const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Supabase credentials missing! Check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test connection on startup
async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    logger.info('Supabase connection successful');
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
      { count: totalUsers },
      { count: freeUsers },
      { count: proUsers },
      { count: totalGenerations },
      { count: pendingPayments },
      { count: todayGenerations },
      { count: todayNewUsers },
      { data: monthlyRevenue },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
      supabase.from('generations').select('*', { count: 'exact', head: true }),
      supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('payment_requests').select('amount').eq('status', 'approved'),
    ]);

    const revenue = monthlyRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      freeUsers: freeUsers || 0,
      proUsers: proUsers || 0,
      totalGenerations: totalGenerations || 0,
      pendingPayments: pendingPayments || 0,
      todayGenerations: todayGenerations || 0,
      todayNewUsers: todayNewUsers || 0,
      revenue: revenue.toFixed(2),
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
      .ilike('email', email)
      .single();
    if (error) return null;
    return data;
  } catch (error) {
    logger.error('Get user error:', error.message);
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
    if (error) return null;
    return data;
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
    return { users: data, total: count, page, totalPages: Math.ceil(count / limit) };
  } catch (error) {
    logger.error('Get users error:', error.message);
    return null;
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
    return data;
  } catch (error) {
    logger.error('Search users error:', error.message);
    return [];
  }
}

async function banUser(userId) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876600h', // 100 years effectively permanent
    });
    if (error) throw error;
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
      .update({ subscription_status: 'pro', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
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
      .update({ subscription_status: 'free', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
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
      .update({ daily_generations_count: 0, last_reset_date: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
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
      .select('*, profiles!inner(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get pending payments error:', error.message);
    return [];
  }
}

async function getPaymentById(paymentId) {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*, profiles!inner(full_name, email)')
      .eq('id', paymentId)
      .single();
    if (error) return null;
    return data;
  } catch (error) {
    logger.error('Get payment error:', error.message);
    return null;
  }
}

async function approvePayment(paymentId) {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };
    if (payment.status !== 'pending') return { success: false, error: 'Already processed' };

    // Update payment status
    await supabase.from('payment_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', paymentId);
    // Grant premium to user
    await grantPremium(payment.user_id);

    return { success: true, payment };
  } catch (error) {
    logger.error('Approve payment error:', error.message);
    return { success: false, error: error.message };
  }
}

async function rejectPayment(paymentId) {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };
    if (payment.status !== 'pending') return { success: false, error: 'Already processed' };

    await supabase.from('payment_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', paymentId);
    return { success: true, payment };
  } catch (error) {
    logger.error('Reject payment error:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

async function getInactiveUsers(days = 7) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const { data, error } = await supabase
      .from('generations')
      .select('user_id, profiles!inner(email, full_name)')
      .lt('created_at', cutoff.toISOString())
      .limit(10);
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get inactive users error:', error.message);
    return [];
  }
}

async function getHighUsageUsers(threshold = 50) {
  try {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('generations')
      .select('user_id, profiles!inner(email, full_name), count')
      .gte('created_at', today.toISOString())
      .order('count', { ascending: false })
      .limit(5);
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get high usage users error:', error.message);
    return [];
  }
}

// ============================================
// BROADCAST FUNCTION
// ============================================

async function getAllUserEmails() {
  try {
    const { data, error } = await supabase.from('profiles').select('email, full_name');
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get all users error:', error.message);
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
  getInactiveUsers,
  getHighUsageUsers,
  getAllUserEmails,
};
