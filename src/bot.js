require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');
const { testConnection } = require('./services/supabase');
const BADINI = require('./i18n/badini');
const { requireAdmin } = require('./middleware/auth');
const { sendProactiveSuggestions } = require('./commands/notifications');

// Command handlers
const { handleStats } = require('./commands/stats');
const {
  handleUsers,
  handleUser,
  handleSearch,
  handleBan,
  handleUnban,
  handleGrant,
  handleRevoke,
  handleReset,
} = require('./commands/users');
const {
  handlePayments,
  handleApprove,
  handleReject,
  handleBroadcast,
  handleBroadcastMessage,
  handleSettings,
} = require('./commands/admin');

// ============================================
// INITIALIZATION
// ============================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0', 10);

if (!TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is required! Set it in .env file.');
  process.exit(1);
}

if (!ADMIN_ID) {
  logger.error('ADMIN_TELEGRAM_ID is required! Set it in .env file.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, {
  polling: true,
  filepath: false,
});

// ============================================
// STARTUP
// ============================================

async function startup() {
  const dbConnected = await testConnection();
  const dbStatus = dbConnected ? '🟢 پەیوەستە' : '🔴 پەیوەست نییە';

  const startMessage =
    `🤖 *بۆتی ئەدمینی AI-Vision* چالاک بوو!\n\n` +
    `⏰ کات: ${new Date().toLocaleString('en-US')}\n` +
    `🗄️ داتابەیس: ${dbStatus}\n` +
    `🆔 ئەدمین: ${ADMIN_ID}\n\n` +
    `/help - لیستی فەرمانان`;

  try {
    await bot.sendMessage(ADMIN_ID, startMessage, { parse_mode: 'Markdown' });
    logger.info('Bot started successfully, admin notified');
  } catch (error) {
    logger.error('Failed to send startup message to admin:', error.message);
  }

  // Proactive suggestions every 6 hours
  setInterval(() => {
    sendProactiveSuggestions(bot).catch((err) => logger.error('Suggestions error:', err.message));
  }, 6 * 60 * 60 * 1000);

  // Initial suggestion after 30 seconds
  setTimeout(() => {
    sendProactiveSuggestions(bot).catch((err) => logger.error('Initial suggestions error:', err.message));
  }, 30000);
}

// ============================================
// COMMAND REGISTRATION
// ============================================

bot.onText(/\/start/, (msg) => {
  if (!requireAdmin(bot, msg)) return;
  const name = msg.from.first_name || 'ئەدمین';
  bot.sendMessage(msg.chat.id, BADINI.commands.start.replace('{name}', name), {
    parse_mode: 'Markdown',
  });
});

bot.onText(/\/help/, (msg) => {
  if (!requireAdmin(bot, msg)) return;
  bot.sendMessage(msg.chat.id, BADINI.commands.help, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, (msg) => handleStats(bot, msg));
bot.onText(/\/users(?:\s+(\d+))?/, (msg, match) => handleUsers(bot, msg, match));
bot.onText(/\/user(?:\s+(.+))/, (msg, match) => handleUser(bot, msg, match));
bot.onText(/\/search(?:\s+(.+))/, (msg, match) => handleSearch(bot, msg, match));
bot.onText(/\/ban(?:\s+(.+))/, (msg, match) => handleBan(bot, msg, match));
bot.onText(/\/unban(?:\s+(.+))/, (msg, match) => handleUnban(bot, msg, match));
bot.onText(/\/grant(?:\s+(.+))/, (msg, match) => handleGrant(bot, msg, match));
bot.onText(/\/revoke(?:\s+(.+))/, (msg, match) => handleRevoke(bot, msg, match));
bot.onText(/\/reset(?:\s+(.+))/, (msg, match) => handleReset(bot, msg, match));
bot.onText(/\/payments/, (msg) => handlePayments(bot, msg));
bot.onText(/\/approve(?:\s+(.+))/, (msg, match) => handleApprove(bot, msg, match));
bot.onText(/\/reject(?:\s+(.+))/, (msg, match) => handleReject(bot, msg, match));
bot.onText(/\/broadcast/, (msg) => handleBroadcast(bot, msg));
bot.onText(/\/settings/, (msg) => handleSettings(bot, msg));

// Handle broadcast message input
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    handleBroadcastMessage(bot, msg);
  }
});

// ============================================
// CALLBACK QUERIES (Inline Buttons)
// ============================================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!requireAdmin(bot, { from: query.from, chat: query.message.chat })) {
    return bot.answerCallbackQuery(query.id, { text: '⛔ دەستپێگەیشتن قەدەغەیە!' });
  }

  try {
    if (data.startsWith('approve_')) {
      const paymentId = data.replace('approve_', '');
      await handleApprove(bot, { chat: { id: chatId } }, [null, paymentId]);
    } else if (data.startsWith('reject_')) {
      const paymentId = data.replace('reject_', '');
      await handleReject(bot, { chat: { id: chatId } }, [null, paymentId]);
    } else if (data.startsWith('grant_')) {
      const userId = data.replace('grant_', '');
      await handleGrant(bot, { chat: { id: chatId } }, [null, userId]);
    } else if (data.startsWith('revoke_')) {
      const userId = data.replace('revoke_', '');
      await handleRevoke(bot, { chat: { id: chatId } }, [null, userId]);
    } else if (data.startsWith('ban_')) {
      const userId = data.replace('ban_', '');
      await handleBan(bot, { chat: { id: chatId } }, [null, userId]);
    } else if (data.startsWith('unban_')) {
      const userId = data.replace('unban_', '');
      await handleUnban(bot, { chat: { id: chatId } }, [null, userId]);
    } else if (data.startsWith('reset_')) {
      const userId = data.replace('reset_', '');
      await handleReset(bot, { chat: { id: chatId } }, [null, userId]);
    }

    bot.answerCallbackQuery(query.id, { text: '✅ ئەنجامدرا!' });
  } catch (error) {
    logger.error('Callback query error:', error.message);
    bot.answerCallbackQuery(query.id, { text: '❌ هەڵەیەک ڕویدا' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

bot.on('polling_error', (error) => {
  logger.error('Polling error:', error.message);
});

bot.on('error', (error) => {
  logger.error('Bot error:', error.message);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

function shutdown() {
  logger.info('Bot shutting down...');
  bot.stopPolling();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ============================================
// START
// ============================================

startup();
logger.info('Bot polling started. Press Ctrl+C to stop.');
