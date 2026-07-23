/**
 * AI-Vision Admin Bot
 * هەموو دەقەکان بە شێوەزاری بادینی (کورمانجی)
 * All texts in Pure Badini Kurdish dialect
 */

const BADINI = {
  general: {
    botStarted: '🤖 *بۆتی ئەدمینی AI-Vision* چالاک بوو!\n\nئێز نها ئامادەم بۆ بەڕێوەبردنی پلاتفۆرمەکەت 24/7.',
    unauthorized: '⛔ *دەستپێگەیشتن قەدەغەیە!*\n\nتۆ مافی بەکارهێنانی ئەم بۆتەت نییە. ئەم بۆتە تایبەتە بە ئەدمینی AI-Vision.',
    unknownCommand: '❓ *فەرمانی نەناسراو*\n\nببورە، ئەو فەرمانە ناناسیم. /help بنووسە بۆ لیستی فەرمانان.',
    error: '❌ *هەڵەیەک ڕویدا*\n\nتکایە دووبارە هەوڵبدەرەوە یان چەند خولەکێکی تر هەوڵبدە.',
    loading: '⏳ *چاوەڕێبە...*\n\nزانیارییەکان تێدەگەین...',
  },

  commands: {
    start: '👋 *سڵاو، {name}!*\n\nئەم بۆتەی بەڕێوەبردنی AI-Vision ە. ئەم فەرمانانە بەردەستن:\n\n' +
          '📊 /stats - ئامارەکانی سیستەم\n' +
          '👥 /users - بەڕێوەبردنی بەکارهێنەران\n' +
          '💰 /payments - داواکارییەکانی پارەدان\n' +
          '🔍 /search - گەڕان بۆ بەکارهێنەر\n' +
          '📢 /broadcast - نامەی گشتی\n' +
          '⚙️ /settings - ڕێکخستنەکان\n' +
          '📋 /help - ئەم لیستە',
    help: '📋 *لیستی فەرمانەکان*\n\n' +
          '/start - دەستپێکردنەوەی بۆت\n' +
          '/stats - ئامارە گشتییەکانی پلاتفۆرم\n' +
          '/users [پەڕە] - لیستی بەکارهێنەران\n' +
          '/user [ئیمەیل|ناسنامە] - زانیاری بەکارهێنەر\n' +
          '/search [زانیاری] - گەڕان\n' +
          '/payments - داواکارییەکانی پارەدان\n' +
          '/approve [ناسنامە] - پەسەندکردنی پارەدان\n' +
          '/reject [ناسنامە] - ڕەتکردنەوەی پارەدان\n' +
          '/ban [ناسنامە] - قەدەغەکردنی بەکارهێنەر\n' +
          '/unban [ناسنامە] - لابردنی قەدەغە\n' +
          '/grant [ناسنامە] - دانی پلانی پڕۆ\n' +
          '/revoke [ناسنامە] - لێسەندنەوەی پلانی پڕۆ\n' +
          '/reset [ناسنامە] - ڕێسێتکردنی کرێدیت\n' +
          '/broadcast - نامەی گشتی\n' +
          '/settings - ڕێکخستنەکان\n' +
          '/help - ئەم لیستە',
  },

  notifications: {
    newUser: '🆕 *بەکارهێنەرێکی نوی تۆمار بوو!*\n\n' +
             '👤 ناو: {name}\n' +
             '📧 ئیمەیل: {email}\n' +
             '🔑 شێوازی چوونەژوور: {provider}\n' +
             '📅 ڕێکەوت: {date}\n' +
             '🆔 ناسنامە: `{id}`',
    newPayment: '💰 *داواکارییەکی نوی پارەدان!*\n\n' +
                '👤 ناو: {name}\n' +
                '📧 ئیمەیل: {email}\n' +
                '💳 شێواز: {method}\n' +
                '🔢 ناسنامەی مامەڵە: `{txId}`\n' +
                '📅 ڕێکەوت: {date}\n' +
                '🆔 ناسنامەی داواکاری: `{paymentId}`\n\n' +
                'بۆ پەسەندکردن: /approve {paymentId}\n' +
                'بۆ ڕەتکردنەوە: /reject {paymentId}',
    paymentApproved: '✅ *پارەدان پەسەند کرا*\n\n🆔: {paymentId}\n👤: {name}',
    paymentRejected: '❌ *پارەدان ڕەتکرایەوە*\n\n🆔: {paymentId}\n👤: {name}',
    userBanned: '🚫 *بەکارهێنەر قەدەغە کرا*\n\n🆔: {userId}\n👤: {name}',
    userUnbanned: '✅ *قەدەغەی بەکارهێنەر لادرا*\n\n🆔: {userId}\n👤: {name}',
    premiumGranted: '⭐ *پلانی پڕۆ درا*\n\n🆔: {userId}\n👤: {name}',
    premiumRevoked: '⬇️ *پلانی پڕۆ لێسەندرا*\n\n🆔: {userId}\n👤: {name}',
  },

  stats: {
    header: '📊 *ئامارەکانی سیستەمی AI-Vision*\n\n',
    totalUsers: '👥 کۆی بەکارهێنەران: *{count}*\n',
    freeUsers: '🆓 بەکارهێنەری ئاسایی: *{count}*\n',
    proUsers: '⭐ بەکارهێنەری پڕۆ: *{count}*\n',
    totalGenerations: '🤖 کۆی دروستکراوەکان: *{count}*\n',
    pendingPayments: '⏳ داواکارییە چاوەڕوانەکان: *{count}*\n',
    todayGenerations: '📅 دروستکراوەکانی ئەمڕۆ: *{count}*\n',
    todayNewUsers: '🆕 بەکارهێنەری نوی ئەمڕۆ: *{count}*\n',
    revenue: '💰 داهاتی مانگانە: *${amount}*\n',
    dbStatus: '🗄️ دۆخی داتابەیس: *{status}*\n',
    botUptime: '⏱️ کاتی چالاکی بۆت: *{uptime}*\n',
  },

  users: {
    noEmail: '❌ تکایە ئیمەیلی بەکارهێنەر بنووسە.\n\nبۆ نموونە: /user example@email.com',
    notFound: '❌ *بەکارهێنەر نەدۆزرایەوە*\n\nهیچ بەکارهێنەرێک بەو زانیارییە نەدۆزرایەوە.',
    userInfo: '👤 *زانیاری بەکارهێنەر*\n\n' +
              '👤 ناو: {name}\n' +
              '📧 ئیمەیل: {email}\n' +
              '🆔 ناسنامە: `{id}`\n' +
              '⭐ پلان: {plan}\n' +
              '📅 ڕێکەوتی تۆماربوون: {created}\n' +
              '📊 دروستکراوەکانی ئەمڕۆ: {todayGen}\n' +
              '🚫 دۆخ: {status}',
    noUsers: '📭 *هیچ بەکارهێنەرێک نەدۆزرایەوە*',
    userList: '👥 *لیستی بەکارهێنەران* (پەڕەی {page}/{totalPages})\n\n{users}\n\n📄 پەڕەی دواتر: /users {nextPage}',
    banned: '🚫 *قەدەغەکراو*',
    active: '🟢 *چالاک*',
  },

  payments: {
    noPayments: '📭 *هیچ داواکارییەکی پارەدان نییە*',
    approved: '✅ *پارەدان پەسەند کرا*\n\nپلانی پڕۆ بۆ بەکارهێنەر چالاک کرا.',
    rejected: '❌ *پارەدان ڕەتکرایەوە*',
    alreadyProcessed: '⚠️ ئەم داواکارییە پێشتر پێواژۆ کراوە.',
    invalidId: '❌ ناسنامەی داواکاری نادروستە.',
    paymentInfo: '💳 *زانیاری داواکاری پارەدان*\n\n' +
                 '🆔: {id}\n' +
                 '👤: {name}\n' +
                 '📧: {email}\n' +
                 '💳 شێواز: {method}\n' +
                 '🔢 TX: `{txId}`\n' +
                 '📅: {date}\n' +
                 '📊 دۆخ: {status}',
  },

  broadcast: {
    prompt: '📢 *نامەى گشتى*\n\nتکایە پەیامەکەت بنووسە بۆ ناردن بۆ هەموو بەکارهێنەران.\n\nبۆ هەڵوەشاندن: /cancel',
    sent: '✅ *پەیامەکە نێردرا!*\n\n📊 ژمارەی وەرگران: {count}',
    cancelled: '❌ *هەڵوەشێنرایەوە*\n\nنامەی گشتی هەڵوەشێنرایەوە.',
    noUsers: '📭 هیچ بەکارهێنەرێک نییە بۆ ناردنی پەیام.',
  },

  suggestions: {
    pendingPayments: '💡 *پێشنیاری زیرەک*\n\n{count} داواکاری پارەدانی چاوەڕوانە هەیە. تکایە پێداچوونەوەیان بکە.\n\n/payments بۆ بینین.',
    inactiveUsers: '💡 *پێشنیاری زیرەک*\n\n{count} بەکارهێنەر زیاتر لە 7 ڕۆژە چالاک نەبوون.',
  },

  settings: {
    title: '⚙️ *ڕێکخستنەکانی بۆت*\n\n',
    notifications: '🔔 ئاگادارکردنەوە: *{status}*\n',
    autoApprove: '🤖 پەسەندکردنی خۆکار: *{status}*\n',
    language: '🌐 زمان: *کوردی بادینی*\n',
    version: '📦 وەشانی بۆت: *1.0.0*\n',
  },
};

module.exports = BADINI;
