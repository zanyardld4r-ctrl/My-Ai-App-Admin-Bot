import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = new Hono();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_CHAT_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').filter(Boolean);
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || 'aivision-webhook-secret';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/supabase
 * Receives database webhooks and forwards errors to Telegram
 */
app.post('/api/webhooks/supabase', async (c) => {
  // Validate webhook secret
  const authHeader = c.req.header('x-webhook-secret');
  if (authHeader !== WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { type, record, error } = body;

  // Only process error events
  if (type === 'ERROR' || error) {
    const message = formatErrorMessage(body);

    // Forward to all admin chat IDs
    for (const chatId of ADMIN_CHAT_IDS) {
      await sendTelegramMessage(chatId, message);
    }
  }

  return c.json({ success: true });
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatErrorMessage(body: any): string {
  const { table, record, error, timestamp } = body;

  let message = '🔴 *ئاگەهدارییا هەلەیێ*\n\n';
  message += `📋 تابلۆ: \`${table || 'نەناسراو'}\`\n`;
  message += `🕐 دەم: \`${timestamp || new Date().toISOString()}\`\n`;
  message += `❌ هەلە: \`${error || 'نەناسراو'}\`\n`;

  if (record) {
    message += `\n📝 تۆمار: \`${JSON.stringify(record).slice(0, 500)}\``;
  }

  return message;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      console.error('Telegram send error:', await response.text());
    }
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

// ============================================
// START SERVER
// ============================================

const PORT = parseInt(process.env.WEBHOOK_PORT || '3001', 10);

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🔔 Webhook server running on port ${PORT}`);
