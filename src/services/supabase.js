const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Supabase credentials missing! Check environment variables.');
  logger.error(`SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  logger.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'SET' : 'MISSING'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test database connection on startup
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    logger.info(`Supabase connected successfully. Profiles count: ${count}`);
    return true;
  } catch (error) {
    logger.error('Supabase connection failed:', error.message);
    return false;
  }
}

// ============================================
// STATS FUNCTIONS
// ============================================

async function getStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsersResult,
      freeUsersResult,
      proUsersResult,
      totalGenerationsResult,
      pendingPaymentsResult,
      todayGenerationsResult,
      todayNewUsersResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
      supabase.from('generations').select('*', { count: 'exact', head: true }),
      supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);

    return {
      totalUsers: totalUsersResult.count || 0,
      freeUsers: freeUsersResult.count || 0,
      proUsers: proUsersResult.count || 0,
      totalGenerations: totalGenerationsResult.count || 0,
      pendingPayments: pendingPaymentsResult.count || 0,
      todayGenerations: todayGenerationsResult.count || 0,
      todayNewUsers: todayNewUsersResult.count || 0,
      revenue: '0.00',
    };
  } catch (error) {
    logger.error('Get stats error:', error.message);
    return null;
  }
}

// ============================================
// USER FUNCTIONS
// ============================================

async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', `%${email}%`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    logger.error('Get user by email error:', error.message);
    return null;
  }
}

async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    logger.error('Get user by ID error:', error.message);
    return null;
  }
}

async function getUsers(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    logger.error('Get users error:', error.message);
    return { users: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function searchUsers(query) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Search users error:', error.message);
    return [];
  }
}

async function banUser(userId) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876600h',
    });
    if (error) throw error;
    logger.info(`User banned: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Ban user error:', error.message);
    return false;
  }
}

async function unbanUser(userId) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '0h',
    });
    if (error) throw error;
    logger.info(`User unbanned: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Unban user error:', error.message);
    return false;
  }
}

async function grantPremium(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pro',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
    logger.info(`Premium granted to: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Grant premium error:', error.message);
    return false;
  }
}

async function revokePremium(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
    logger.info(`Premium revoked from: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Revoke premium error:', error.message);
    return false;
  }
}

async function resetUserCredits(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        daily_generations_count: 0,
        last_reset_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
    logger.info(`Credits reset for: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Reset credits error:', error.message);
    return false;
  }
}

// ============================================
// PAYMENT FUNCTIONS
// ============================================

async function getPendingPayments() {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get pending payments error:', error.message);
    return [];
  }
}

async function getPaymentById(paymentId) {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    logger.error('Get payment by ID error:', error.message);
    return null;
  }
}

async function approvePayment(paymentId) {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) return { success: false, error: 'پارەدان نەدۆزرایەوە' };
    if (payment.status !== 'pending') return { success: false, error: 'پێشتر پێواژۆ کراوە' };

    await supabase
      .from('payment_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    await grantPremium(payment.user_id);

    logger.info(`Payment approved: ${paymentId}`);
    return { success: true, payment };
  } catch (error) {
    logger.error('Approve payment error:', error.message);
    return { success: false, error: error.message };
  }
}

async function rejectPayment(paymentId) {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) return { success: false, error: 'پارەدان نەدۆزرایەوە' };
    if (payment.status !== 'pending') return { success: false, error: 'پێشتر پێواژۆ کراوە' };

    await supabase
      .from('payment_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    logger.info(`Payment rejected: ${paymentId}`);
    return { success: true, payment };
  } catch (error) {
    logger.error('Reject payment error:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// BROADCAST FUNCTION
// ============================================

async function getAllUserEmails() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get all users error:', error.message);
    return [];
  }
}

// ============================================
// PROACTIVE SUGGESTIONS
// ============================================

async function getInactiveUsers(days = 7) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('generations')
      .select('user_id')
      .lt('created_at', cutoff.toISOString())
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get inactive users error:', error.message);
    return [];
  }
}

module.exports = {
  supabase,
  testConnection,
  getStats,
  getUserByEmail,
  getUserById,
  getUsers,
  searchUsers,
  banUser,
  unbanUser,
  grantPremium,
  revokePremium,
  resetUserCredits,
  getPendingPayments,
  getPaymentById,
  approvePayment,
  rejectPayment,
  getAllUserEmails,
  getInactiveUsers,
};
