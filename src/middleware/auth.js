const logger = require('../utils/logger');

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0', 10);
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '@z_14x').replace('@', '');

/**
 * Middleware to verify the user is the authorized admin.
 * Blocks all unauthorized access.
 * @param {object} bot - Telegram bot instance
 * @param {object} msg - Telegram message object
 * @returns {boolean} - true if authorized, false otherwise
 */
function requireAdmin(bot, msg) {
  const userId = msg.from?.id;
  const username = msg.from?.username;

  // Check if user is the authorized admin
  if (userId !== ADMIN_TELEGRAM_ID && username !== ADMIN_USERNAME) {
    logger.warn(`Unauthorized access attempt - User: ${userId} (@${username})`);

    bot.sendMessage(msg.chat.id, '⛔ *دەستپێگەیشتن قەدەغەیە!*\n\nتۆ مافی بەکارهێنانی ئەم بۆتەت نییە.', {
      parse_mode: 'Markdown',
    }).catch((err) => logger.error('Failed to send unauthorized message:', err.message));

    return false;
  }

  return true;
}

/**
 * Wraps a command handler with admin authentication
 * @param {function} handler - Command handler function
 * @returns {function} - Wrapped handler with auth check
 */
function withAdmin(handler) {
  return function (bot, msg, match) {
    if (!requireAdmin(bot, msg)) {
      return;
    }
    return handler(bot, msg, match);
  };
}

module.exports = { requireAdmin, withAdmin, ADMIN_TELEGRAM_ID, ADMIN_USERNAME };
