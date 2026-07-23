const { getPendingPayments, getPaymentById, approvePayment, rejectPayment, getAllUserEmails } = require('../services/supabase');
const BADINI = require('../i18n/badini');
const { withAdmin, ADMIN_TELEGRAM_ID } = require('../middleware/auth');
const logger = require('../utils/logger');

// /payments - List pending payments
async function handlePayments(bot, msg) {
  const chatId = msg.chat.id;
  const payments = await getPendingPayments();

  if (!payments.length) {
    return bot.sendMessage(chatId, BADINI.payments.noPayments, { parse_mode: 'Markdown' });
  }

  for (const p of payments) {
    const message = BADINI.payments.paymentInfo
      .replace('{id}', p.id)
      .replace('{name}', p.full_name || (p.profiles?.full_name || 'نەناسراو'))
      .replace('{email}', p.email || (p.profiles?.email || '—'))
      .replace('{method}', p.method)
      .replace('{txId}', p.transaction_id)
      .replace('{date}', new Date(p.created_at).toLocaleDateString('en-US'))
      .replace('{status}', '⏳ چاوەڕوانە');

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ پەسەندکردن', callback_data: `approve_${p.id}` },
          { text: '❌ ڕەتکردنەوە', callback_data: `reject_${p.id}` },
        ],
      ],
    };

    if (p.receipt_url) {
      try {
        await bot.sendPhoto(chatId, p.receipt_url, {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } catch {
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    } else {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }
}

// /approve <payment_id>
async function handleApprove(bot, msg, match) {
  const chatId = msg.chat.id;
  const paymentId = match && match[1] ? match[1].trim() : '';
  if (!paymentId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی داواکاری بنووسه‌.', { parse_mode: 'Markdown' });

  const result = await approvePayment(paymentId);
  if (result.success) {
    bot.sendMessage(chatId, BADINI.payments.approved, { parse_mode: 'Markdown' });
    logger.info(`Payment ${paymentId} approved by admin`);
  } else {
    bot.sendMessage(chatId, `❌ ${result.error || BADINI.payments.alreadyProcessed}`, { parse_mode: 'Markdown' });
  }
}

// /reject <payment_id>
async function handleReject(bot, msg, match) {
  const chatId = msg.chat.id;
  const paymentId = match && match[1] ? match[1].trim() : '';
  if (!paymentId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی داواکاری بنووسه‌.', { parse_mode: 'Markdown' });

  const result = await rejectPayment(paymentId);
  if (result.success) {
    bot.sendMessage(chatId, BADINI.payments.rejected, { parse_mode: 'Markdown' });
    logger.info(`Payment ${paymentId} rejected by admin`);
  } else {
    bot.sendMessage(chatId, `❌ ${result.error || BADINI.payments.alreadyProcessed}`, { parse_mode: 'Markdown' });
  }
}

// /broadcast - Send message to all users
let broadcastState = null;
async function handleBroadcast(bot, msg) {
  const chatId = msg.chat.id;
  broadcastState = { active: true };
  bot.sendMessage(chatId, BADINI.broadcast.prompt, { parse_mode: 'Markdown' });
}

async function handleBroadcastMessage(bot, msg) {
  if (!broadcastState?.active) return;
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/cancel') {
    broadcastState = null;
    return bot.sendMessage(chatId, BADINI.broadcast.cancelled, { parse_mode: 'Markdown' });
  }

  broadcastState = null;
  const users = await getAllUserEmails();
  if (!users.length) {
    return bot.sendMessage(chatId, BADINI.broadcast.noUsers, { parse_mode: 'Markdown' });
  }

  let sentCount = 0;
  for (const user of users) {
    try {
      await bot.sendMessage(user.email, `📢 *نامەیەکی گشتی له‌ AI-Vision:*\n\n${text}`, { parse_mode: 'Markdown' });
      sentCount++;
    } catch {
      // Skip users who haven't started the bot
    }
    await new Promise(r => setTimeout(r, 50)); // Rate limit
  }

  bot.sendMessage(chatId, BADINI.broadcast.sent.replace('{count}', sentCount), { parse_mode: 'Markdown' });
}

// /settings
async function handleSettings(bot, msg) {
  const chatId = msg.chat.id;
  let message = BADINI.settings.title;
  message += BADINI.settings.notifications.replace('{status}', '🟢 چالاکه');
  message += BADINI.settings.autoApprove.replace('{status}', '🔴 ناچالاکه');
  message += BADINI.settings.language;
  message += BADINI.settings.version;
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

module.exports = {
  handlePayments: withAdmin(handlePayments),
  handleApprove: withAdmin(handleApprove),
  handleReject: withAdmin(handleReject),
  handleBroadcast: withAdmin(handleBroadcast),
  handleBroadcastMessage,
  handleSettings: withAdmin(handleSettings),
  broadcastState,
};
