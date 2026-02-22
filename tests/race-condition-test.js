/**
 * Race Condition Test for Order Claiming
 * 
 * This script tests the atomic order claiming functionality by having
 * multiple drivers attempt to claim the same order simultaneously.
 * 
 * Expected: Only ONE driver should successfully claim the order.
 * 
 * Usage: node tests/race-condition-test.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const NUM_DRIVERS = 5;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefixes = {
        info: `${colors.blue}[INFO]${colors.reset}`,
        success: `${colors.green}[SUCCESS]${colors.reset}`,
        error: `${colors.red}[ERROR]${colors.reset}`,
        warning: `${colors.yellow}[WARNING]${colors.reset}`,
        test: `${colors.magenta}[TEST]${colors.reset}`,
    };
    console.log(`${prefixes[type] || ''} ${timestamp} - ${message}`);
}

let sellerToken = null;
let buyerToken = null;
let driverTokens = [];
let testOrderId = null;

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
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status 
        };
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function registerTestUsers() {
    log('info', 'Registering test users...');
    
    // Register seller
    const sellerResult = await apiCall('POST', '/auth/register', {
        email: `race-seller-${Date.now()}@test.com`,
        password: 'test123',
        name: 'Race Test Seller',
        isSeller: true,
        businessName: 'Race Test Store',
    });
    
    if (sellerResult.success) {
        sellerToken = sellerResult.data.token;
        log('success', 'Seller registered');
    } else {
        // Try login
        log('warning', 'Seller might exist, trying login...');
    }
    
    // Register buyer
    const buyerResult = await apiCall('POST', '/auth/register', {
        email: `race-buyer-${Date.now()}@test.com`,
        password: 'test123',
        name: 'Race Test Buyer',
    });
    
    if (buyerResult.success) {
        buyerToken = buyerResult.data.token;
        log('success', 'Buyer registered');
    }
    
    // Register multiple drivers
    for (let i = 0; i < NUM_DRIVERS; i++) {
        const driverResult = await apiCall('POST', '/auth/register', {
            email: `race-driver-${i}-${Date.now()}@test.com`,
            password: 'test123',
            name: `Race Test Driver ${i + 1}`,
        });
        
        if (driverResult.success) {
            driverTokens.push({
                token: driverResult.data.token,
                name: `Driver ${i + 1}`,
                claimed: false,
                error: null,
            });
            log('success', `Driver ${i + 1} registered`);
        }
        
        await delay(100);
    }
    
    log('info', `Created ${driverTokens.length} drivers`);
}

async function enableDriverMode() {
    log('info', 'Enabling driver mode for all drivers...');
    
    for (const driver of driverTokens) {
        await apiCall('POST', '/driver/toggle', { isActive: true }, driver.token);
        await apiCall('PUT', '/driver/location', { 
            latitude: -6.2088 + (Math.random() * 0.01 - 0.005),
            longitude: 106.8456 + (Math.random() * 0.01 - 0.005),
        }, driver.token);
    }
    
    log('success', 'All drivers enabled and located');
}

async function createTestOrder() {
    log('info', 'Creating test order...');
    
    // Get a product from seller
    const productsResult = await apiCall('GET', '/products/', null, buyerToken);
    if (!productsResult.success || !productsResult.data.length) {
        log('error', 'No products available for test');
        return null;
    }
    
    const product = productsResult.data[0];
    
    const orderResult = await apiCall('POST', '/orders/', {
        products: [{ product: product._id, quantity: 1 }],
        deliveryType: 'delivery',
        deliveryAddress: {
            address: 'Test Address',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            pincode: '12345',
            coordinates: [106.84, -6.21],
        },
    }, buyerToken);
    
    if (orderResult.success) {
        testOrderId = orderResult.data._id;
        log('success', `Order created: ${testOrderId}`);
        return testOrderId;
    } else {
        log('error', `Failed to create order: ${JSON.stringify(orderResult.error)}`);
        return null;
    }
}

async function setOrderReady() {
    if (!testOrderId) return false;
    
    log('info', 'Setting order to ready...');
    
    await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'confirmed' }, sellerToken);
    await delay(200);
    await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'preparing' }, sellerToken);
    await delay(200);
    await apiCall('PUT', `/orders/${testOrderId}/status`, { status: 'ready' }, sellerToken);
    
    log('success', 'Order is ready');
    return true;
}

async function attemptClaim(driver, orderId) {
    const startTime = Date.now();
    const result = await apiCall('POST', `/driver/claim/${orderId}`, null, driver.token);
    const duration = Date.now() - startTime;
    
    return {
        name: driver.name,
        success: result.success,
        status: result.status,
        error: result.error,
        duration,
        order: result.data,
    };
}

async function runRaceConditionTest() {
    if (!testOrderId) {
        log('error', 'No order to test');
        return;
    }
    
    log('test', `\n${'='.repeat(60)}`);
    log('test', '     RACE CONDITION TEST: SIMULTANEOUS CLAIMS');
    log('test', `     ${NUM_DRIVERS} drivers attempting to claim order ${testOrderId.slice(-6)}`);
    log('test', `${'='.repeat(60)}\n`);
    
    // Create simultaneous claim attempts
    const claimPromises = driverTokens.map(driver => attemptClaim(driver, testOrderId));
    
    // Execute all claims at once
    const startTime = Date.now();
    const results = await Promise.all(claimPromises);
    const totalDuration = Date.now() - startTime;
    
    // Analyze results
    log('test', '\n--- RESULTS ---\n');
    
    let successCount = 0;
    let conflictCount = 0;
    let errorCount = 0;
    let winner = null;
    
    results.forEach((result, idx) => {
        const statusIcon = result.success ? '✅' : (result.status === 409 ? '⚠️' : '❌');
        const statusText = result.success ? 'CLAIMED' : (result.status === 409 ? 'CONFLICT' : 'ERROR');
        
        console.log(`${statusIcon} ${result.name}: ${statusText} (${result.duration}ms)`);
        
        if (result.success) {
            successCount++;
            winner = result;
        } else if (result.status === 409) {
            conflictCount++;
        } else {
            errorCount++;
        }
    });
    
    log('test', '\n--- SUMMARY ---\n');
    console.log(`Total requests: ${results.length}`);
    console.log(`Successful claims: ${successCount}`);
    console.log(`Conflicts (409): ${conflictCount}`);
    console.log(`Other errors: ${errorCount}`);
    console.log(`Total duration: ${totalDuration}ms`);
    
    // Verify result
    log('test', '\n--- VERIFICATION ---\n');
    
    if (successCount === 1 && conflictCount === NUM_DRIVERS - 1) {
        log('success', `✅ TEST PASSED: Exactly ONE driver claimed the order!`);
        log('success', `   Winner: ${winner.name}`);
        log('success', `   Order status: ${winner.order?.status}`);
    } else if (successCount === 0) {
        log('error', `❌ TEST FAILED: No driver could claim the order`);
    } else if (successCount > 1) {
        log('error', `❌ TEST FAILED: Multiple drivers claimed the same order!`);
        log('error', `   This indicates a race condition bug.`);
    } else {
        log('warning', `⚠️ TEST INCONCLUSIVE: Unexpected result pattern`);
    }
    
    // Verify order state
    const orderCheck = await apiCall('GET', `/orders/${testOrderId}`, null, buyerToken);
    if (orderCheck.success) {
        log('info', `\nOrder verification:`);
        log('info', `  Status: ${orderCheck.data.status}`);
        log('info', `  Claimed by: ${orderCheck.data.claimedBy || 'none'}`);
    }
}

async function runMultipleRounds(rounds = 3) {
    console.log('\n' + '='.repeat(60));
    console.log('     RACE CONDITION STRESS TEST');
    console.log('='.repeat(60) + '\n');
    
    for (let round = 1; round <= rounds; round++) {
        console.log(`\n${'─'.repeat(40)}`);
        console.log(`ROUND ${round} of ${rounds}`);
        console.log(`${'─'.repeat(40)}\n`);
        
        // Reset state
        testOrderId = null;
        driverTokens = [];
        
        // Setup
        await registerTestUsers();
        await enableDriverMode();
        
        const orderId = await createTestOrder();
        if (orderId) {
            await setOrderReady();
            await delay(500);
            await runRaceConditionTest();
        }
        
        if (round < rounds) {
            log('info', '\nWaiting before next round...\n');
            await delay(2000);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('     STRESS TEST COMPLETE');
    console.log('='.repeat(60) + '\n');
}

// Run test
runMultipleRounds(3).catch(console.error);
