const { getStats, getPendingPayments, getInactiveUsers } = require('../services/supabase');
const BADINI = require('../i18n/badini');
const { ADMIN_TELEGRAM_ID } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Send proactive AI suggestions to admin
 */
async function sendProactiveSuggestions(bot) {
  try {
    const stats = await getStats();

    // Check pending payments
    if (stats && stats.pendingPayments > 0) {
      const message = BADINI.suggestions.pendingPayments.replace('{count}', stats.pendingPayments);
      await bot.sendMessage(ADMIN_TELEGRAM_ID, message, { parse_mode: 'Markdown' });
    }

    // Check inactive users
    const inactiveUsers = await getInactiveUsers(7);
    if (inactiveUsers.length > 3) {
      const message = BADINI.suggestions.inactiveUsers.replace('{count}', inactiveUsers.length);
      await bot.sendMessage(ADMIN_TELEGRAM_ID, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.error('Proactive suggestions error:', error.message);
  }
}

/**
 * Notify admin of new user registration
 */
async function notifyNewUser(bot, userData) {
  try {
    const message = BADINI.notifications.newUser
      .replace('{name}', userData.full_name || userData.email)
      .replace('{email}', userData.email)
      .replace('{provider}', userData.provider || 'email')
      .replace('{date}', new Date().toLocaleDateString('en-US'))
      .replace('{id}', userData.id);

    await bot.sendMessage(ADMIN_TELEGRAM_ID, message, { parse_mode: 'Markdown' });
    logger.info(`New user notification: ${userData.email}`);
  } catch (error) {
    logger.error('Notify new user error:', error.message);
  }
}

/**
 * Notify admin of new payment request
 */
async function notifyNewPayment(bot, paymentData) {
  try {
    const message = BADINI.notifications.newPayment
      .replace('{name}', paymentData.full_name)
      .replace('{email}', paymentData.email)
      .replace('{method}', paymentData.method)
      .replace('{txId}', paymentData.transaction_id)
      .replace('{date}', new Date().toLocaleDateString('en-US'))
      .replace('{paymentId}', paymentData.id);

    await bot.sendMessage(ADMIN_TELEGRAM_ID, message, { parse_mode: 'Markdown' });
    logger.info(`New payment notification: ${paymentData.id}`);
  } catch (error) {
    logger.error('Notify new payment error:', error.message);
  }
}

module.exports = {
  sendProactiveSuggestions,
  notifyNewUser,
  notifyNewPayment,
};
