import { Context } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const locale = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'locales', 'ku-badini.json'), 'utf-8')
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Whitelist of allowed tables for querying
const ALLOWED_TABLES = [
  'profiles',
  'generations',
  'payment_requests',
  'connections',
  'messages',
  'wallet_transactions',
  'profile_visits',
  'user_sessions',
];

// Whitelist of allowed SQL operations
const ALLOWED_OPERATIONS = ['SELECT', 'COUNT'];

/**
 * /query command - Execute whitelisted parameterized queries (Super Admin only)
 * Usage: /query SELECT * FROM profiles LIMIT 5
 */
export async function queryCommand(ctx: Context): Promise<void> {
  const isSuperAdmin = (ctx as any).isSuperAdmin;

  if (!isSuperAdmin) {
    await ctx.reply(locale.auth.super_admin_required, { parse_mode: 'Markdown' });
    return;
  }

  const queryText = ctx.message?.text?.replace('/query', '').trim();

  if (!queryText) {
    await ctx.reply(
      '💎 *پرتوکۆلا پسیارێ*\n\n' +
      'نمونه: `/query SELECT * FROM profiles LIMIT 5`\n\n' +
      'تابلۆیێن دەستپێگەهشتن: ' + ALLOWED_TABLES.join(', '),
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Validate query
  const upperQuery = queryText.toUpperCase().trim();
  const operation = upperQuery.split(' ')[0];

  if (!ALLOWED_OPERATIONS.includes(operation)) {
    await ctx.reply('⛔ *ئەڤ جۆرێ پرسیارێ نە یا دەستپێگەهشتن*', { parse_mode: 'Markdown' });
    return;
  }

  // Check if any allowed table is in the query
  const hasAllowedTable = ALLOWED_TABLES.some((table) =>
    upperQuery.includes(table.toUpperCase())
  );

  if (!hasAllowedTable) {
    await ctx.reply('⛔ *تابلۆ نە یا دەستپێگەهشتن*', { parse_mode: 'Markdown' });
    return;
  }

  try {
    // Execute the query using Supabase's raw SQL (via rpc or direct)
    const { data, error } = await supabase.rpc('execute_query', { query: queryText });

    if (error) {
      await ctx.reply(`❌ *هەلە:* \`${error.message}\``, { parse_mode: 'Markdown' });
      return;
    }

    const resultStr = JSON.stringify(data, null, 2);
    const truncated = resultStr.length > 3500 ? resultStr.slice(0, 3500) + '\n\n...(کورت کر)' : resultStr;

    await ctx.reply(`📊 *ئەنجام:*\n\n\`\`\`json\n${truncated}\n\`\`\``, {
      parse_mode: 'Markdown',
    });
  } catch (err: any) {
    await ctx.reply(`❌ *هەلەیەک ڕویدا:* \`${err.message}\``, { parse_mode: 'Markdown' });
  }
}

/**
 * Execute a raw SQL query (wrapper for Supabase)
 * This function is exposed via Supabase RPC
 */
export async function executeQuery(query: string): Promise<any> {
  const { data, error } = await supabase.rpc('execute_query', { query });
  if (error) throw error;
  return data;
}
