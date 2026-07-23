const logger = require('../utils/logger');
const BADINI = require('../i18n/badini');

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '@z_14x';

/**
 * Middleware to verify the user is the authorized admin.
 * Blocks all unauthorized access.
 */
function requireAdmin(bot, msg) {
  const userId = msg.from?.id;
  const username = msg.from?.username;

  // Check if user is the authorized admin
  if (userId !== ADMIN_TELEGRAM_ID && username !== ADMIN_USERNAME.replace('@', '')) {
    logger.warn(`Unauthorized access attempt - User: ${userId} (@${username})`);

    // Send block message only once
    bot.sendMessage(msg.chat.id, BADINI.general.unauthorized, {
      parse_mode: 'Markdown',
    }).catch(() => {});

    return false;
  }

  return true;
}

/**
 * Wraps a command handler with admin authentication
 */
function withAdmin(handler) {
  return function(bot, msg, match) {
    if (!requireAdmin(bot, msg)) {
      return;
    }
    return handler(bot, msg, match);
  };
}

module.exports = { requireAdmin, withAdmin, ADMIN_TELEGRAM_ID, ADMIN_USERNAME };
