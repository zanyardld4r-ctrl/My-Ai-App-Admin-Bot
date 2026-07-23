const {
  getUserByEmail,
  getUserById,
  getUsers,
  searchUsers,
  banUser,
  unbanUser,
  grantPremium,
  revokePremium,
  resetUserCredits,
} = require('../services/supabase');
const BADINI = require('../i18n/badini');
const { withAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// /users - List users
async function handleUsers(bot, msg, match) {
  const chatId = msg.chat.id;
  const page = match && match[1] ? parseInt(match[1]) : 1;

  const result = await getUsers(page, 10);

  if (!result || !result.users.length) {
    return bot.sendMessage(chatId, BADINI.users.noUsers, { parse_mode: 'Markdown' });
  }

  const usersList = result.users
    .map((u, i) => {
      const plan = u.subscription_status === 'pro' ? '⭐' : '🆓';
      return `${(page - 1) * 10 + i + 1}. ${plan} ${u.full_name || 'بێناو'} - ${u.email}`;
    })
    .join('\n');

  const message = BADINI.users.userList
    .replace('{page}', page)
    .replace('{totalPages}', result.totalPages)
    .replace('{users}', usersList)
    .replace('{nextPage}', page + 1);

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// /user <email> - Get specific user
async function handleUser(bot, msg, match) {
  const chatId = msg.chat.id;
  const query = match && match[1] ? match[1].trim() : '';

  if (!query) {
    return bot.sendMessage(chatId, BADINI.users.noEmail, { parse_mode: 'Markdown' });
  }

  let user = await getUserByEmail(query);
  if (!user) {
    user = await getUserById(query);
  }

  if (!user) {
    return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });
  }

  const message = BADINI.users.userInfo
    .replace('{name}', user.full_name || 'بێناو')
    .replace('{email}', user.email)
    .replace('{id}', user.user_id)
    .replace('{plan}', user.subscription_status === 'pro' ? '⭐ پڕۆ' : '🆓 ئاسایی')
    .replace('{created}', new Date(user.created_at).toLocaleDateString('en-US'))
    .replace('{generations}', '—')
    .replace('{todayGen}', user.daily_generations_count || 0)
    .replace('{status}', user.banned ? BADINI.users.banned : BADINI.users.active);

  // Action buttons
  const keyboard = {
    inline_keyboard: [
      [
        { text: '⭐ دانی پڕۆ', callback_data: `grant_${user.user_id}` },
        { text: '⬇️ لێسەندنەوە', callback_data: `revoke_${user.user_id}` },
      ],
      [
        { text: '🚫 قەدەغەکردن', callback_data: `ban_${user.user_id}` },
        { text: '✅ لابردنی قەدەغە', callback_data: `unban_${user.user_id}` },
      ],
      [
        { text: '🔄 ڕێسێتکردنی کرێدیت', callback_data: `reset_${user.user_id}` },
      ],
    ],
  };

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// /search <query> - Search users
async function handleSearch(bot, msg, match) {
  const chatId = msg.chat.id;
  const query = match && match[1] ? match[1].trim() : '';

  if (!query) {
    return bot.sendMessage(chatId, '❌ تکایه‌ زانیارییه‌ک بنووسه‌ بۆ گه‌ڕان.', { parse_mode: 'Markdown' });
  }

  const users = await searchUsers(query);

  if (!users.length) {
    return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });
  }

  const usersList = users
    .map((u) => `👤 ${u.full_name || 'بێناو'} | 📧 ${u.email} | 🆔 \`${u.user_id}\``)
    .join('\n');

  bot.sendMessage(chatId, `🔍 *ئەنجامی گەڕان:*\n\n${usersList}`, { parse_mode: 'Markdown' });
}

// /ban <user_id>
async function handleBan(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = match && match[1] ? match[1].trim() : '';
  if (!userId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی به‌کارهێنه‌ر بنووسه‌.', { parse_mode: 'Markdown' });

  const user = await getUserById(userId);
  if (!user) return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });

  const success = await banUser(userId);
  if (success) {
    bot.sendMessage(chatId, BADINI.notifications.userBanned.replace('{userId}', userId).replace('{name}', user.full_name || user.email), { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }
}

// /unban <user_id>
async function handleUnban(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = match && match[1] ? match[1].trim() : '';
  if (!userId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی به‌کارهێنه‌ر بنووسه‌.', { parse_mode: 'Markdown' });

  const user = await getUserById(userId);
  if (!user) return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });

  const success = await unbanUser(userId);
  if (success) {
    bot.sendMessage(chatId, BADINI.notifications.userUnbanned.replace('{userId}', userId).replace('{name}', user.full_name || user.email), { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }
}

// /grant <user_id>
async function handleGrant(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = match && match[1] ? match[1].trim() : '';
  if (!userId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی به‌کارهێنه‌ر بنووسه‌.', { parse_mode: 'Markdown' });

  const user = await getUserById(userId);
  if (!user) return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });

  const success = await grantPremium(userId);
  if (success) {
    bot.sendMessage(chatId, BADINI.notifications.premiumGranted.replace('{userId}', userId).replace('{name}', user.full_name || user.email), { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }
}

// /revoke <user_id>
async function handleRevoke(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = match && match[1] ? match[1].trim() : '';
  if (!userId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی به‌کارهێنه‌ر بنووسه‌.', { parse_mode: 'Markdown' });

  const user = await getUserById(userId);
  if (!user) return bot.sendMessage(chatId, BADINI.users.notFound, { parse_mode: 'Markdown' });

  const success = await revokePremium(userId);
  if (success) {
    bot.sendMessage(chatId, BADINI.notifications.premiumRevoked.replace('{userId}', userId).replace('{name}', user.full_name || user.email), { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }
}

// /reset <user_id>
async function handleReset(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = match && match[1] ? match[1].trim() : '';
  if (!userId) return bot.sendMessage(chatId, '❌ تکایه‌ ناسنامه‌ی به‌کارهێنه‌ر بنووسه‌.', { parse_mode: 'Markdown' });

  const success = await resetUserCredits(userId);
  if (success) {
    bot.sendMessage(chatId, '✅ کرێدیتی به‌کارهێنه‌ر ڕێسێت کرا.', { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, BADINI.general.error, { parse_mode: 'Markdown' });
  }
}

module.exports = {
  handleUsers: withAdmin(handleUsers),
  handleUser: withAdmin(handleUser),
  handleSearch: withAdmin(handleSearch),
  handleBan: withAdmin(handleBan),
  handleUnban: withAdmin(handleUnban),
  handleGrant: withAdmin(handleGrant),
  handleRevoke: withAdmin(handleRevoke),
  handleReset: withAdmin(handleReset),
};
