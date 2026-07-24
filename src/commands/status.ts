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

/**
 * /status command - System health dashboard
 */
export async function statusCommand(ctx: Context): Promise<void> {
  const loadingMsg = await ctx.reply('⏳ *چاڤەڕێبە...*', { parse_mode: 'Markdown' });

  try {
    // Gather stats
    const [
      { count: totalUsers },
      { count: freeUsers },
      { count: proUsers },
      { count: pendingPayments },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
      supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Check DB health
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    const dbHealthy = !dbError;

    // Calculate uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${hours}س ${minutes}د`;

    // Build message
    let message = locale.status.header;
    message += locale.status.total_users.replace('{count}', String(totalUsers || 0));
    message += locale.status.free_users.replace('{count}', String(freeUsers || 0));
    message += locale.status.pro_users.replace('{count}', String(proUsers || 0));
    message += locale.status.pending_payments.replace('{count}', String(pendingPayments || 0));
    message += locale.status.db_status.replace(
      '{status}',
      dbHealthy ? locale.status.healthy : locale.status.error
    );
    message += locale.status.bot_uptime.replace('{uptime}', uptimeStr);

    // Edit the loading message
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loadingMsg.message_id,
      message,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loadingMsg.message_id,
      locale.errors.db_connection,
      { parse_mode: 'Markdown' }
    );
  }
}
