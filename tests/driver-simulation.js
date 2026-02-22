/**
 * Driver Marketplace Simulation Script
 * 
 * This script simulates the complete driver marketplace flow:
 * 1. User enables driver mode
 * 2. Driver searches for available orders
 * 3. Driver claims an order
 * 4. Driver updates delivery status
 * 5. Driver completes delivery
 * 6. Buyer tracks delivery
 * 7. Buyer rates driver
 * 
 * Usage: node tests/driver-simulation.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test users - use unique emails with timestamp
const TEST_USERS = {
    seller: { 
        email: `seller-${Date.now()}@test.com`, 
        password: 'test123' 
    },
    buyer: { 
        email: `buyer-${Date.now()}@test.com`, 
        password: 'test123' 
    },
    driver: { 
        email: `driver-${Date.now()}@test.com`, 
        password: 'test123' 
    },
};

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

let tokens = {};
let testOrderId = null;

function log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefixes = {
        info: `${colors.blue}[INFO]${colors.reset}`,
        success: `${colors.green}[SUCCESS]${colors.reset}`,
        error: `${colors.red}[ERROR]${colors.reset}`,
        warning: `${colors.yellow}[WARNING]${colors.reset}`,
        step: `${colors.cyan}[STEP]${colors.reset}`,
        driver: `${colors.magenta}[DRIVER]${colors.reset}`,
        buyer: `${colors.cyan}[BUYER]${colors.reset}`,
    };
    console.log(`${prefixes[type] || ''} ${timestamp} - ${message}`);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {},
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status 
        };
    }
}

// Step 1: Login all test users (or register them)
async function loginUsers() {
    log('step', 'Step 1: Logging in or registering test users...');
    
    for (const [role, credentials] of Object.entries(TEST_USERS)) {
        // Try login first
        let result = await apiCall('POST', '/auth/login', credentials);
        
        if (!result.success) {
            // If login fails, try to register
            log('info', `${role} not found, registering new user...`);
            
            const registerData = {
                email: credentials.email,
                password: credentials.password,
                name: role.charAt(0).toUpperCase() + role.slice(1) + ' Test',
                phone: '+62812345678', // Required for registration
            };
            
            if (role === 'seller') {
                registerData.isSeller = true;
                registerData.businessName = 'Test Store';
            }
            
            result = await apiCall('POST', '/auth/register', registerData);
            
            if (!result.success) {
                log('error', `Failed to register ${role}: ${JSON.stringify(result.error)}`);
                continue;
            }
            log('success', `${role} registered successfully`);
        }
        
        if (result.success) {
            tokens[role] = result.data.token;
            log('success', `${role} logged in successfully`);
        }
    }
    
    // Check if we have at least driver token
    if (!tokens.driver) {
        log('error', 'Could not authenticate driver user');
        return false;
    }
    
    return true;
}

// Step 2: Enable driver mode
async function enableDriverMode() {
    log('step', 'Step 2: Enabling driver mode...');
    
    const result = await apiCall('POST', '/driver/toggle', { isActive: true }, tokens.driver);
    if (result.success) {
        log('success', 'Driver mode enabled');
        return true;
    } else {
        log('error', `Failed to enable driver mode: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Step 3: Update driver location
async function updateDriverLocation(lat = -6.2088, lng = 106.8456) {
    log('step', `Step 3: Updating driver location to ${lat}, ${lng}...`);
    
    const result = await apiCall('PUT', '/driver/location', { latitude: lat, longitude: lng }, tokens.driver);
    if (result.success) {
        log('success', 'Driver location updated');
        return true;
    } else {
        log('error', `Failed to update location: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Step 4: Get driver stats
async function getDriverStats() {
    log('step', 'Step 4: Getting driver stats...');
    
    const result = await apiCall('GET', '/driver/stats', null, tokens.driver);
    if (result.success) {
        log('info', `Driver Stats:
      Total Deliveries: ${result.data.totalDeliveries}
      Total Earnings: Rp ${result.data.totalEarnings?.toLocaleString('id-ID')}
      Rating: ${result.data.rating}
      Today: Rp ${result.data.todayEarnings?.toLocaleString('id-ID')}
      This Week: Rp ${result.data.weekEarnings?.toLocaleString('id-ID')}
      This Month: Rp ${result.data.monthEarnings?.toLocaleString('id-ID')}`);
        return result.data;
    } else {
        log('error', `Failed to get stats: ${JSON.stringify(result.error)}`);
        return null;
    }
}

// Step 5: Create a test order (as buyer)
async function createTestOrder() {
    log('step', 'Step 5: Creating test order as buyer...');
    
    // First, get seller's products
    const productsResult = await apiCall('GET', '/products/', null, tokens.buyer);
    if (!productsResult.success || !productsResult.data.length) {
        log('warning', 'No products found in system.');
        log('info', 'Skipping order creation - will test driver APIs without order');
        return null;
    }
    
    return await createTestOrderWithProduct(productsResult.data[0]._id);
}

async function createTestOrderWithProduct(productId) {
    log('info', `Using product: ${productId}`);
    
    // Create order
    const orderData = {
        products: [{ product: productId, quantity: 1 }],
        deliveryType: 'delivery',
        deliveryAddress: {
            address: 'Jl. Test No. 123, Jakarta Selatan',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            pincode: '12345',
            coordinates: [106.84, -6.21], // [lng, lat]
        },
        notes: 'Test order for driver simulation',
    };
    
    const result = await apiCall('POST', '/orders/', orderData, tokens.buyer);
    if (result.success) {
        testOrderId = result.data._id;
        log('success', `Order created: ${testOrderId}`);
        return testOrderId;
    } else {
        log('error', `Failed to create order: ${JSON.stringify(result.error)}`);
        return null;
    }
}

// Step 6: Update order status to ready (as seller)
async function setOrderReady() {
    if (!testOrderId) {
        log('warning', 'No test order to set ready');
        return false;
    }
    
    log('step', 'Step 6: Setting order status to ready...');
    
    // First set to confirmed
    await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'confirmed' }, tokens.seller);
    await delay(500);
    
    // Then preparing
    await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'preparing' }, tokens.seller);
    await delay(500);
    
    // Then ready
    const result = await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'ready' }, tokens.seller);
    if (result.success) {
        log('success', 'Order is now ready for pickup');
        return true;
    } else {
        log('error', `Failed to set order ready: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Step 7: Get available orders (as driver)
async function getAvailableOrders() {
    log('step', 'Step 7: Getting available orders...');
    
    const result = await apiCall('GET', '/driver/available-orders?lat=-6.2088&lng=106.8456', null, tokens.driver);
    if (result.success && result.data) {
        const orders = result.data || [];
        log('info', `Found ${orders.length} available orders`);
        orders.forEach((order, idx) => {
            log('info', `  ${idx + 1}. Order ${order.order?._id?.slice(-6)}:
        Store: ${order.seller?.businessName || order.seller?.name}
        Distance: ${order.distanceToStore?.toFixed(2)} km
        Fee: Rp ${order.deliveryFee?.toLocaleString('id-ID')}
        Earnings: Rp ${order.driverEarnings?.toLocaleString('id-ID')}`);
        });
        return orders;
    } else {
        log('error', `Failed to get available orders: ${JSON.stringify(result.error)}`);
        return [];
    }
}

// Step 8: Claim order
async function claimOrder(orderId) {
    log('driver', `Step 8: Claiming order ${orderId?.slice(-6)}...`);
    
    const result = await apiCall('POST', `/driver/claim/${orderId}`, null, tokens.driver);
    if (result.success) {
        log('success', `Order claimed! Delivery fee: Rp ${result.data.deliveryFee?.toLocaleString('id-ID')}`);
        return true;
    } else {
        log('error', `Failed to claim order: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Step 9: Get active delivery
async function getActiveDelivery() {
    log('driver', 'Step 9: Getting active delivery...');
    
    const result = await apiCall('GET', '/driver/active-delivery', null, tokens.driver);
    if (result.success) {
        if (result.data.order) {
            log('info', `Active delivery found:
        Order: ${result.data.order._id?.slice(-6)}
        Status: ${result.data.order.status}
        Store: ${result.data.seller?.businessName || result.data.seller?.name}
        Buyer: ${result.data.buyer?.name}`);
            return result.data;
        } else {
            log('info', 'No active delivery');
            return null;
        }
    } else {
        log('error', `Failed to get active delivery: ${JSON.stringify(result.error)}`);
        return null;
    }
}

// Step 10: Update delivery status through all steps
async function completeDelivery(orderId) {
    log('driver', 'Step 10: Completing delivery...');
    
    const statuses = ['picked_up', 'on_the_way', 'arrived'];
    
    for (const status of statuses) {
        await delay(1000);
        const result = await apiCall('POST', `/driver/status/${orderId}`, { status }, tokens.driver);
        if (result.success) {
            log('success', `Status updated to: ${status}`);
        } else {
            log('error', `Failed to update status: ${JSON.stringify(result.error)}`);
        }
    }
    
    // Complete delivery
    await delay(1000);
    const completeResult = await apiCall('POST', `/driver/complete/${orderId}`, { notes: 'Delivered successfully!' }, tokens.driver);
    if (completeResult.success) {
        log('success', `Delivery completed! Earnings: Rp ${completeResult.data.earnings?.toLocaleString('id-ID')}`);
        return true;
    } else {
        log('error', `Failed to complete delivery: ${JSON.stringify(completeResult.error)}`);
        return false;
    }
}

// Step 11: Rate driver (as buyer)
async function rateDriver(orderId) {
    log('buyer', `Step 11: Rating driver for order ${orderId?.slice(-6)}...`);
    
    const result = await apiCall('POST', `/driver-rating/${orderId}`, { 
        rating: 5, 
        comment: 'Great delivery service!' 
    }, tokens.buyer);
    
    if (result.success) {
        log('success', `Driver rated! New average rating: ${result.data.newRating?.toFixed(1)}`);
        return true;
    } else {
        log('error', `Failed to rate driver: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Step 12: Get delivery history
async function getDeliveryHistory() {
    log('step', 'Step 12: Getting delivery history...');
    
    const result = await apiCall('GET', '/driver/history', null, tokens.driver);
    if (result.success) {
        log('info', `Delivery history (${result.data.deliveries?.length || 0} deliveries):`);
        result.data.deliveries?.slice(0, 5).forEach((delivery, idx) => {
            log('info', `  ${idx + 1}. Order ${delivery._id?.slice(-6)} - ${delivery.status} - Rp ${delivery.driverEarnings?.toLocaleString('id-ID')}`);
        });
        return result.data;
    } else {
        log('error', `Failed to get history: ${JSON.stringify(result.error)}`);
        return null;
    }
}

// Step 13: Get earnings
async function getEarnings() {
    log('step', 'Step 13: Getting earnings breakdown...');
    
    const result = await apiCall('GET', '/driver/earnings?period=month', null, tokens.driver);
    if (result.success) {
        log('info', 'Earnings breakdown:');
        result.data.forEach((item, idx) => {
            const date = new Date(item.date).toLocaleDateString('id-ID');
            log('info', `  ${date}: Rp ${item.amount?.toLocaleString('id-ID')} (${item.orderCount} deliveries)`);
        });
        return result.data;
    } else {
        log('error', `Failed to get earnings: ${JSON.stringify(result.error)}`);
        return null;
    }
}

// Main simulation
async function runSimulation() {
    console.log('\n' + '='.repeat(60));
    console.log('     DRIVER MARKETPLACE SIMULATION');
    console.log('='.repeat(60) + '\n');
    
    console.log('Using test credentials:');
    console.log(`  Seller:  ${TEST_USERS.seller.email}`);
    console.log(`  Buyer:   ${TEST_USERS.buyer.email}`);
    console.log(`  Driver:  ${TEST_USERS.driver.email}`);
    console.log('');
    
    const startTime = Date.now();
    
    try {
        // Login
        if (!await loginUsers()) {
            log('error', 'Simulation failed: Could not login users');
            return;
        }
        await delay(500);
        
        // Enable driver mode
        if (!await enableDriverMode()) {
            log('error', 'Simulation failed: Could not enable driver mode');
            return;
        }
        await delay(500);
        
        // Update location
        if (!await updateDriverLocation()) {
            log('error', 'Simulation failed: Could not update location');
            return;
        }
        await delay(500);
        
        // Get initial stats
        await getDriverStats();
        await delay(500);
        
        // Create test order
        const orderId = await createTestOrder();
        
        if (!orderId) {
            log('warning', '\n⚠️  No test order available. Testing driver APIs without order...');
            log('info', 'To test full flow, please:');
            log('info', '1. Create a seller with products in the app');
            log('info', '2. Create an order as buyer');
            log('info', '3. Set order status to "ready" as seller');
        }
        
        await delay(500);
        
        // Set order ready
        if (orderId) {
            if (!await setOrderReady()) {
                log('error', 'Could not set order ready');
            }
        }
        await delay(500);
        
        // Get available orders
        const availableOrders = await getAvailableOrders();
        await delay(500);
        
        // Claim order
        const orderToClaim = orderId || (availableOrders.length > 0 ? availableOrders[0].order?._id : null);
        if (orderToClaim) {
            if (!await claimOrder(orderToClaim)) {
                log('error', 'Could not claim order');
            }
        } else {
            log('warning', 'No orders available to claim');
        }
        await delay(500);
        
        // Get active delivery
        await getActiveDelivery();
        await delay(500);
        
        // Complete delivery
        if (orderToClaim) {
            if (!await completeDelivery(orderToClaim)) {
                log('error', 'Could not complete delivery');
            }
        }
        await delay(500);
        
        // Rate driver
        if (orderToClaim) {
            await rateDriver(orderToClaim);
        }
        await delay(500);
        
        // Get updated stats
        log('info', '\n--- Final Stats ---');
        await getDriverStats();
        await delay(500);
        
        // Get history
        await getDeliveryHistory();
        await delay(500);
        
        // Get earnings
        await getEarnings();
        
    } catch (error) {
        log('error', `Simulation error: ${error.message}`);
        console.error(error);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log(`     SIMULATION COMPLETE (${duration}s)`);
    console.log('='.repeat(60) + '\n');
}

// Run simulation
runSimulation().catch(console.error);
