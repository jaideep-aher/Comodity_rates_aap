import { request } from 'undici';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { query } from '../db.js';

type SmsArgs = {
  userId?: string;
  phone: string;
  body: string;
  dedupKey?: string;
  templateId?: string;
  vars?: Record<string, string>;
};

export async function sendSms(args: SmsArgs): Promise<{ sent: boolean; skipped?: string }> {
  if (!config.smsEnabled) return { sent: false, skipped: 'sms_disabled' };

  if (args.userId && args.dedupKey) {
    const existing = await query(
      `SELECT 1 FROM sms_sent WHERE user_id=$1 AND dedup_key=$2`,
      [args.userId, args.dedupKey],
    );
    if (existing.rows.length > 0) return { sent: false, skipped: 'deduped' };
  }

  const phone = args.phone.replace('+', '');
  if (!config.msg91AuthKey) {
    logger.info({ phone, body: args.body }, '[sms simulated]');
    await recordSms(args, 'simulated');
    return { sent: true };
  }

  try {
    const template = args.templateId || config.smsDigestTemplate;
    if (template) {
      const res = await request('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: config.msg91AuthKey },
        body: JSON.stringify({
          template_id: template,
          sender: config.msg91SenderId,
          short_url: '0',
          mobiles: phone,
          ...(args.vars ?? {}),
        }),
      });
      if (res.statusCode >= 300) throw new Error(`msg91 status ${res.statusCode}`);
    } else {
      const url = new URL('https://api.msg91.com/api/sendhttp.php');
      url.searchParams.set('authkey', config.msg91AuthKey);
      url.searchParams.set('mobiles', phone);
      url.searchParams.set('message', args.body);
      url.searchParams.set('sender', config.msg91SenderId);
      url.searchParams.set('route', '4');
      url.searchParams.set('country', '91');
      const res = await request(url.toString());
      if (res.statusCode >= 300) throw new Error(`msg91 status ${res.statusCode}`);
    }
    await recordSms(args, 'sent');
    return { sent: true };
  } catch (err) {
    logger.error({ err, phone }, 'msg91 SMS failed');
    await recordSms(args, 'failed');
    return { sent: false, skipped: 'error' };
  }
}

async function recordSms(args: SmsArgs, status: string) {
  try {
    await query(
      `INSERT INTO sms_sent (user_id, phone, body, provider, status, dedup_key)
       VALUES ($1, $2, $3, 'msg91', $4, $5)
       ON CONFLICT (user_id, dedup_key) DO NOTHING`,
      [args.userId ?? null, args.phone, args.body, status, args.dedupKey ?? null],
    );
  } catch {
    /* ignore log write errors */
  }
}
