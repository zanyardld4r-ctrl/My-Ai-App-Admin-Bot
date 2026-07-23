const {
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getAllUserEmails,
} = require('../services/supabase');
const BADINI = require('../i18n/badini');
const { withAdmin, ADMIN_TELEGRAM_ID } = require('../middleware/auth');
const logger = require('../utils/logger');

// ============================================
// PAYMENTS
// ============================================

async function handlePayments(bot, msg) {
  const chatId = msg.chat.id;
  const payments = await getPendingPayments();

  if (!payments.length) {
    return bot.sendMessage(chatId, BADINI.payments.noPayments, { parse_mode: 'Markdown' });
  }

  for (const p of payments) {
    const message = BADINI.payments.paymentInfo
      .replace('{id}', p.id)
      .replace('{name}', p.full_name || 'نەناسراو')
      .replace('{email}', p.email || '—')
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

    if (p.receipt_url && p.receipt_url.startsWith('http')) {
      try {
        await bot.sendPhoto(chatId, p.receipt_url, {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } catch (err) {
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

async function handleApprove(bot, msg, match) {
  const chatId = msg.chat.id;
  const paymentId = match && match[1] ? match[1].trim() : '';
  if (!paymentId) return bot.sendMessage(chatId, '❌ تکایە ناسنامەی داواکاری بنووسە.', { parse_mode: 'Markdown' });

  const result = await approvePayment(paymentId);
  if (result.success) {
    bot.sendMessage(chatId, BADINI.payments.approved, { parse_mode: 'Markdown' });
    logger.info(`Payment approved by admin: ${paymentId}`);
  } else {
    bot.sendMessage(chatId, `❌ ${result.error}`, { parse_mode: 'Markdown' });
  }
}

async function handleReject(bot, msg, match) {
  const chatId = msg.chat.id;
  const paymentId = match && match[1] ? match[1].trim() : '';
  if (!paymentId) return bot.sendMessage(chatId, '❌ تکایە ناسنامەی داواکاری بنووسە.', { parse_mode: 'Markdown' });

  const result = await rejectPayment(paymentId);
  if (result.success) {
    bot.sendMessage(chatId, BADINI.payments.rejected, { parse_mode: 'Markdown' });
    logger.info(`Payment rejected by admin: ${paymentId}`);
  } else {
    bot.sendMessage(chatId, `❌ ${result.error}`, { parse_mode: 'Markdown' });
  }
}

// ============================================
// BROADCAST
// ============================================

let broadcastState = null;

async function handleBroadcast(bot, msg) {
  const chatId = msg.chat.id;
  broadcastState = { active: true, chatId };
  bot.sendMessage(chatId, BADINI.broadcast.prompt, { parse_mode: 'Markdown' });
}

async function handleBroadcastMessage(bot, msg) {
  if (!broadcastState || !broadcastState.active) return;
  if (msg.chat.id !== broadcastState.chatId) return;

  const text = msg.text;

  if (text === '/cancel') {
    broadcastState = null;
    return bot.sendMessage(msg.chat.id, BADINI.broadcast.cancelled, { parse_mode: 'Markdown' });
  }

  broadcastState = null;
  const users = await getAllUserEmails();

  if (!users.length) {
    return bot.sendMessage(msg.chat.id, BADINI.broadcast.noUsers, { parse_mode: 'Markdown' });
  }

  let sentCount = 0;
  for (const user of users) {
    try {
      await bot.sendMessage(user.email, `📢 *نامەیەکی گشتی لە AI-Vision:*\n\n${text}`, {
        parse_mode: 'Markdown',
      });
      sentCount++;
    } catch (err) {
      // Skip users who haven't started the bot
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  bot.sendMessage(msg.chat.id, BADINI.broadcast.sent.replace('{count}', sentCount), { parse_mode: 'Markdown' });
}

// ============================================
// SETTINGS
// ============================================

async function handleSettings(bot, msg) {
  const chatId = msg.chat.id;
  let message = BADINI.settings.title;
  message += BADINI.settings.notifications.replace('{status}', '🟢 چالاکە');
  message += BADINI.settings.autoApprove.replace('{status}', '🔴 ناچالاکە');
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
};
