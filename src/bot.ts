import 'dotenv/config';
import { Bot, Context, session, InlineKeyboard } from 'grammy';
import { readFileSync } from 'fs';
import { join } from 'path';
import { authGuard } from './middlewares/auth';
import { statusCommand } from './commands/status';
import { queryCommand } from './commands/query';

// Load localization
const locale = JSON.parse(
  readFileSync(join(__dirname, '..', 'locales', 'ku-badini.json'), 'utf-8')
);

// ============================================
// BOT INITIALIZATION
// ============================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ============================================
// GLOBAL AUTH GUARD MIDDLEWARE
// ============================================

bot.use(authGuard);

// ============================================
// /start - Interactive Inline Keyboard Menu
// ============================================

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('📊 دۆخی سیستەمێ', 'menu_status')
    .row()
    .text('🔍 گەڕیان ل داتابەیسێ', 'menu_search')
    .row()
    .text('📜 لۆگێن هەڵەیان', 'menu_logs')
    .row()
    .text('👥 ڕێڤەبرنا ئەدمینان', 'menu_admins');

  await ctx.reply(locale.start.welcome, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
});

// ============================================
// INLINE KEYBOARD HANDLERS
// ============================================

bot.callbackQuery('menu_status', async (ctx) => {
  await ctx.answerCallbackQuery();
  await statusCommand(ctx);
});

bot.callbackQuery('menu_search', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(locale.search.prompt, { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_logs', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('📜 *لۆگێن هەلەیان:*\n\n🟢 هێشتا لۆگ نەینە ئامادەکرن.', {
    parse_mode: 'Markdown',
  });
});

bot.callbackQuery('menu_admins', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('👥 *ڕێڤەبرنا ئەدمینان:*\n\nئەم تایبەتمەندییە دێتە ئامادەکرن.', {
    parse_mode: 'Markdown',
  });
});

// ============================================
// COMMANDS
// ============================================

bot.command('status', statusCommand);
bot.command('query', queryCommand);

// ============================================
// CATCH-ALL: Handle unknown messages
// ============================================

bot.on('message', async (ctx) => {
  if (ctx.message?.text?.startsWith('/')) {
    await ctx.reply('❓ *فەرمانێ نەناسراو*\n\n/start بکاربینە بو دیتنا مێنوویێ سەرەکی.', {
      parse_mode: 'Markdown',
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err) => {
  console.error('Bot error:', err.message);
});

// ============================================
// START THE BOT
// ============================================

bot.start({
  onStart: () => {
    console.log('🤖 AI-Vision Admin Bot is running...');
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
  },
});
