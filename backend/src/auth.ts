import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { query, tx } from './db.js';
import { config } from './config.js';
import { logger } from './logger.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export type User = {
  id: string;
  phone: string;
  name: string | null;
  village: string | null;
  district: string | null;
  language: 'mr' | 'en';
};

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  if (digits.length === 13 && digits.startsWith('091')) return '+' + digits.slice(1);
  if (raw.startsWith('+')) return raw;
  return '+' + digits;
}

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export async function requestOtp(phoneRaw: string): Promise<{ sent: boolean; devCode?: string }> {
  const phone = normalizePhone(phoneRaw);

  const recent = await query<{ created_at: string }>(
    'SELECT created_at FROM otp_codes WHERE phone=$1 ORDER BY created_at DESC LIMIT 1',
    [phone],
  );
  if (recent.rows[0]) {
    const last = new Date(recent.rows[0].created_at).getTime();
    if (Date.now() - last < OTP_RESEND_COOLDOWN_MS) {
      throw new Error('Please wait a few seconds before requesting another OTP.');
    }
  }

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await query(
    'INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1,$2,$3)',
    [phone, codeHash, expiresAt],
  );

  if (config.msg91AuthKey) {
    try {
      await sendOtpViaMsg91(phone, code);
      logger.info({ phone }, 'otp sent via msg91');
    } catch (err) {
      logger.error({ err, phone }, 'msg91 send failed');
    }
  } else {
    logger.warn({ phone, code }, 'msg91 not configured — OTP not delivered (dev mode)');
  }

  return { sent: true, devCode: config.isDev ? code : undefined };
}

export async function verifyOtp(
  phoneRaw: string,
  code: string,
): Promise<{ user: User; isNew: boolean }> {
  const phone = normalizePhone(phoneRaw);

  return tx(async (client) => {
    const res = await client.query(
      `SELECT id, code_hash, expires_at, consumed_at, attempts
       FROM otp_codes
       WHERE phone=$1
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [phone],
    );
    const row = res.rows[0];
    if (!row) throw new Error('No OTP requested for this number.');
    if (row.consumed_at) throw new Error('This OTP has already been used.');
    if (new Date(row.expires_at) < new Date()) throw new Error('OTP has expired.');
    if (row.attempts >= OTP_MAX_ATTEMPTS) throw new Error('Too many failed attempts.');

    const matches = config.devOtpAny
      ? code.length >= 4
      : await bcrypt.compare(code, row.code_hash);

    if (!matches) {
      await client.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id=$1', [row.id]);
      throw new Error('Incorrect code. Try again.');
    }

    await client.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id=$1', [row.id]);

    let userRes = await client.query(
      `SELECT id, phone, name, village, district, language FROM users WHERE phone=$1`,
      [phone],
    );
    let isNew = false;
    if (userRes.rows.length === 0) {
      userRes = await client.query(
        `INSERT INTO users (phone) VALUES ($1)
         RETURNING id, phone, name, village, district, language`,
        [phone],
      );
      isNew = true;
    } else {
      await client.query('UPDATE users SET last_seen = NOW() WHERE id=$1', [userRes.rows[0].id]);
    }
    return { user: userRes.rows[0] as User, isNew };
  });
}

async function sendOtpViaMsg91(phone: string, code: string): Promise<void> {
  const key = config.msg91AuthKey;
  const template = config.msg91TemplateId;
  if (!key || !template) throw new Error('msg91 not configured');
  const { request } = await import('undici');
  const body = {
    template_id: template,
    sender: config.msg91SenderId,
    short_url: '0',
    mobiles: phone.replace('+', ''),
    var1: code,
  };
  const res = await request('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: key },
    body: JSON.stringify(body),
  });
  if (res.statusCode >= 300) {
    throw new Error(`msg91 status ${res.statusCode}: ${await res.body.text()}`);
  }
}
