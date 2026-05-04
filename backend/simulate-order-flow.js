#!/usr/bin/env node

/**
 * Order Flow Simulation Script
 * 
 * Simulates a complete purchase flow:
 * 1. Login as buyer (andi.buyer@marketplace.test)
 * 2. Get rani.summarecon's products
 * 3. Place an order
 * 4. Login as seller (rani.summarecon@marketplace.test)
 * 5. Walk order through all statuses: payment_pending → confirmed → preparing → ready → delivered
 * 
 * Usage: node simulate-order-flow.js
 */

const API_BASE = 'http://localhost:5000/api';
const PASSWORD = 'test123';

const BUYER_EMAIL = 'andi.buyer@marketplace.test';
const SELLER_EMAIL = 'rani.summarecon@marketplace.test';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function logStep(step, msg) {
  console.log(`\n${colors.bold}${colors.cyan}━━━ Step ${step} ━━━${colors.reset}`);
  console.log(`${colors.blue}${msg}${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

async function apiCall(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function login(email) {
  log('🔑', `Logging in as ${email}...`);
  const data = await apiCall('POST', '/auth/login', { email, password: PASSWORD });
  const token = data.token;
  const user = data.user || data;
  logSuccess(`Logged in as ${user.name || email} (ID: ${user.id || user._id})`);
  return { token, user };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n${colors.bold}${colors.yellow}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}║   🛒  Order Flow Simulation                  ║${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}║   Buyer: andi.buyer → Seller: rani.summarecon ║${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // ── Step 1: Login as buyer ──
    logStep(1, 'Login as buyer');
    const buyer = await login(BUYER_EMAIL);

    // ── Step 2: Get rani.summarecon's seller ID by logging in ──
    logStep(2, 'Find rani.summarecon seller profile');
    const sellerLogin = await login(SELLER_EMAIL);
    const sellerId = sellerLogin.user.id || sellerLogin.user._id;
    logSuccess(`Seller ID: ${sellerId}`);

    // ── Step 3: Get seller's products ──
    logStep(3, "Get rani.summarecon's products");
    const productsRes = await apiCall('GET', `/products/seller/${sellerId}`);
    const products = productsRes.products || productsRes || [];

    if (products.length === 0) {
      logError('No products found for this seller!');
      return;
    }

    // Pick the first available product
    const product = products.find(p => (p.stock > 0 || p.isAvailable !== false)) || products[0];
    logSuccess(`Selected product: "${product.name}" - Rp ${(product.price || 0).toLocaleString('id-ID')}`);
    log('📦', `Stock: ${product.stock || 'N/A'} | Category: ${product.category || 'N/A'}`);

    // ── Step 4: Place order as buyer ──
    logStep(4, 'Place order as buyer');
    const orderData = {
      products: [{
        productId: product._id || product.id,
        quantity: 2,
        variantName: '',
        selectedOptions: [],
      }],
      deliveryAddress: {
        address: 'Summarecon Bekasi, Jl. Boulevard Ahmad Yani',
        city: 'Bekasi',
        state: 'Jawa Barat',
        pincode: '17142',
        coordinates: [107.0, -6.2],
      },
      notes: 'Simulation test order - please ignore',
      paymentMethod: 'cash',
      deliveryType: 'pickup',
    };

    const order = await apiCall('POST', '/orders', orderData, buyer.token);
    const orderId = order._id || order.id;
    logSuccess(`Order placed! ID: ${orderId}`);
    log('💰', `Total: Rp ${(order.totalAmount || 0).toLocaleString('id-ID')}`);
    log('📋', `Status: ${order.status}`);

    // ── Step 5: Use seller token from step 2 ──
    logStep(5, 'Using seller token (rani.summarecon)');
    const seller = sellerLogin;
    logSuccess(`Seller token ready`);

    // ── Step 6: Walk order through all statuses ──
    logStep(6, 'Update order status through the complete flow');

    const statusFlow = [
      { status: 'confirmed', label: '✅ Confirmed (Payment received)', delay: 1000 },
      { status: 'preparing', label: '👨‍🍳 Preparing order', delay: 1500 },
      { status: 'ready', label: '📦 Ready for pickup', delay: 1500 },
      { status: 'delivered', label: '🎉 Delivered / Picked up', delay: 1500 },
    ];

    for (const step of statusFlow) {
      await sleep(step.delay);
      log('⏳', `Updating to: ${step.label}...`);
      
      try {
        const updated = await apiCall('PUT', `/orders/${orderId}/status`, 
          { status: step.status }, seller.token);
        logSuccess(`Status updated to: ${step.status}`);
      } catch (err) {
        logError(`Failed to update to ${step.status}: ${err.message}`);
      }
    }

    // ── Step 7: Verify financial dashboard ──
    logStep(7, 'Verify financial dashboard data');
    await sleep(1000);

    try {
      const financeSummary = await apiCall('GET', `/finance/summary?sellerId=${sellerId}`);
      log('💰', `Total Sales: Rp ${(financeSummary.totalSales || 0).toLocaleString('id-ID')}`);
      log('📊', `Order Count: ${financeSummary.orderCount || 0}`);
      log('💵', `Net Profit: Rp ${(financeSummary.netProfit || 0).toLocaleString('id-ID')}`);
    } catch (err) {
      log('⚠️', `Finance summary error: ${err.message}`);
    }

    try {
      const analytics = await apiCall('GET', '/analytics/sales', null, seller.token);
      log('📈', `Analytics - Total Revenue: Rp ${(analytics.totalRevenue || 0).toLocaleString('id-ID')}`);
      log('📈', `Analytics - Total Orders: ${analytics.totalOrders || 0}`);
      log('📈', `Analytics - Completed: ${analytics.completedOrders || 0}`);
      log('📈', `Analytics - Pending: ${analytics.pendingOrders || 0}`);
    } catch (err) {
      log('⚠️', `Analytics error: ${err.message}`);
    }

    // ── Done ──
    console.log(`\n${colors.bold}${colors.green}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║   ✅  Simulation Complete!                    ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                               ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║   Order: ${orderId}  ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║   Status: delivered                           ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                               ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║   Now check the financial dashboard for       ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║   rani.summarecon to see updated numbers!     ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (err) {
    logError(`Simulation failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
