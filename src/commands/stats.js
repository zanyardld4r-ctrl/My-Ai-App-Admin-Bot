const { getStats } = require('../services/supabase');
const BADINI = require('../i18n/badini');
const { withAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

async function handleStats(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, BADINI.general.loading, { parse_mode: 'Markdown' });

  const stats = await getStats();

  if (!stats) {
    return bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours}ک ${minutes}خ ${seconds}چ`;

  let message = BADINI.stats.header;
  message += BADINI.stats.totalUsers.replace('{count}', stats.totalUsers);
  message += BADINI.stats.freeUsers.replace('{count}', stats.freeUsers);
  message += BADINI.stats.proUsers.replace('{count}', stats.proUsers);
  message += BADINI.stats.totalGenerations.replace('{count}', stats.totalGenerations);
  message += BADINI.stats.pendingPayments.replace('{count}', stats.pendingPayments);
  message += BADINI.stats.todayGenerations.replace('{count}', stats.todayGenerations);
  message += BADINI.stats.todayNewUsers.replace('{count}', stats.todayNewUsers);
  message += BADINI.stats.revenue.replace('{amount}', stats.revenue);
  message += BADINI.stats.dbStatus.replace('{status}', '🟢 باشە');
  message += BADINI.stats.botUptime.replace('{uptime}', uptimeStr);

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  logger.info(`Stats viewed by admin @${msg.from.username}`);
}

module.exports = withAdmin(handleStats);
