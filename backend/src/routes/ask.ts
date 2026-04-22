import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { query } from '../db.js';

// POST /api/ask — free-form Q&A fallback for the mobile Ask-Advisor screen.
// The client hits this only when its local rule engine couldn't confidently
// answer, so we keep cost low. Uses OpenAI chat completions when OPENAI_API_KEY
// is set; otherwise returns a canned fallback so the UX doesn't hard-fail.

const SYSTEM_PROMPT = `You are a concise, practical farming advisor for smallholder farmers in Maharashtra, India. You advise on:
- Weather (heat, rain, wind) impact on crops
- Sowing windows and transplanting
- Irrigation timing and water management
- Pesticide / fertilizer choices (mention the active ingredient name, not brand)
- Harvest timing and post-harvest
- Common regional crops: tomato, onion, potato, chili, wheat, rice, soybean, cotton, sugarcane

Rules:
- Respond in the user's requested language (mr = Marathi in Devanagari, en = English).
- Keep replies under 4 short lines.
- No speculative medical / veterinary advice.
- When uncertain, say so and suggest contacting the Kisan helpline (1800-180-1551).`;

export async function askRoutes(app: FastifyInstance) {
  app.post('/ask', async (req, reply) => {
    const schema = z.object({
      question: z.string().min(4).max(500),
      lang: z.enum(['mr', 'en']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'bad_params' });
    const { question, lang } = parsed.data;

    const userId = (req as any).user?.sub ?? null;

    if (!config.openaiApiKey) {
      const answer =
        lang === 'mr'
          ? 'सध्या AI सल्लागार उपलब्ध नाही. किसान हेल्पलाईन १८००-१८०-१५५१ वर संपर्क साधा.'
          : 'AI advisor is not available right now. Call Kisan helpline 1800-180-1551 for help.';
      await safeLog(userId, question, answer, 'fallback', lang);
      return { answer, source: 'fallback' };
    }

    try {
      const res = await fetch(`${config.openaiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.openaiModel,
          temperature: 0.2,
          max_tokens: 280,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Language: ${lang}\nQuestion: ${question}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, 'openai non-200');
        throw new Error('openai failed');
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = body.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error('openai empty');
      await safeLog(userId, question, answer, 'llm', lang);
      return { answer, source: 'llm' };
    } catch (err) {
      logger.warn({ err }, 'ask proxy failed');
      const answer =
        lang === 'mr'
          ? 'उत्तर तयार होऊ शकले नाही. कृपया पुन्हा प्रयत्न करा किंवा हेल्पलाईनवर संपर्क साधा.'
          : "Couldn't generate an answer. Please retry or contact the helpline.";
      await safeLog(userId, question, answer, 'fallback', lang);
      return { answer, source: 'fallback' };
    }
  });
}

async function safeLog(
  userId: string | null,
  question: string,
  answer: string,
  source: 'llm' | 'fallback',
  lang: 'mr' | 'en',
) {
  try {
    await query(
      `INSERT INTO ask_logs (user_id, question, answer, source, lang)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, question, answer, source, lang],
    );
  } catch (err) {
    logger.debug({ err }, 'ask_logs insert failed');
  }
}
