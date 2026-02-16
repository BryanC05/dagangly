#!/usr/bin/env node

/**
 * Buyer Simulation Script for MSME Marketplace
 * Simulates the complete buyer journey: browsing, cart, ordering
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msme_marketplace';

// Simulated buyer profiles
const BUYER_PROFILES = [
  { name: 'Test Buyer 1', email: 'buyer1@test.com', phone: '9876543210', password: 'test123' },
  { name: 'Test Buyer 2', email: 'buyer2@test.com', phone: '9876543211', password: 'test123' },
  { name: 'Test Buyer 3', email: 'buyer3@test.com', phone: '9876543212', password: 'test123' }
];

// Simulated delivery addresses
const DELIVERY_ADDRESSES = [
  {
    address: '123 Main Street, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    coordinates: [77.6271, 12.9279]
  },
  {
    address: '456 Park Avenue, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    coordinates: [77.6412, 12.9716]
  },
  {
    address: '789 Garden Road, Jayanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560041',
    coordinates: [77.5933, 12.9299]
  }
];

class BuyerSimulator {
  constructor() {
    this.tokens = new Map();
    this.products = [];
    this.orders = [];
  }

  async connectDB() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✓ Connected to MongoDB');
    } catch (error) {
      console.error('✗ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }

  async registerBuyer(profile) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        ...profile,
        role: 'buyer'
      });
      console.log(`✓ Registered buyer: ${profile.email}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`ℹ Buyer already exists: ${profile.email}`);
        return null;
      }
      throw error;
    }
  }

  async loginBuyer(email, password) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      console.log(`✓ Logged in buyer: ${email}`);
      return response.data.token;
    } catch (error) {
      console.error(`✗ Login failed for ${email}:`, error.response?.data?.message);
      throw error;
    }
  }

  async browseProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.lat && filters.lng && filters.radius) {
        params.append('lat', filters.lat);
        params.append('lng', filters.lng);
        params.append('radius', filters.radius);
      }

      const response = await axios.get(`${API_URL}/api/products?${params}`);
      this.products = response.data.products || [];
      console.log(`✓ Found ${this.products.length} products`);
      return this.products;
    } catch (error) {
      console.error('✗ Failed to browse products:', error.message);
      throw error;
    }
  }

  async viewProductDetails(productId) {
    try {
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
      console.log(`✓ Viewed product: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error(`✗ Failed to view product ${productId}:`, error.message);
      throw error;
    }
  }

  async placeOrder(buyerEmail, cartItems, addressIndex = 0) {
    const token = this.tokens.get(buyerEmail);
    if (!token) {
      throw new Error(`Buyer ${buyerEmail} not logged in`);
    }

    try {
      const orderData = {
        products: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        deliveryAddress: DELIVERY_ADDRESSES[addressIndex],
        notes: 'Simulated order - test purchase'
      };

      const response = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`✓ Order placed by ${buyerEmail}: ${response.data._id}`);
      this.orders.push({
        orderId: response.data._id,
        buyer: buyerEmail,
        total: response.data.totalAmount,
        status: response.data.status
      });
      return response.data;
    } catch (error) {
      console.error(`✗ Failed to place order for ${buyerEmail}:`, error.response?.data?.message);
      throw error;
    }
  }

  async getMyOrders(buyerEmail) {
    const token = this.tokens.get(buyerEmail);
    if (!token) {
      throw new Error(`Buyer ${buyerEmail} not logged in`);
    }

    try {
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✓ Retrieved ${response.data.length} orders for ${buyerEmail}`);
      return response.data;
    } catch (error) {
      console.error(`✗ Failed to get orders for ${buyerEmail}:`, error.message);
      throw error;
    }
  }

  async simulateBuyerJourney(profileIndex = 0) {
    const profile = BUYER_PROFILES[profileIndex];
    console.log(`\n--- Simulating Buyer Journey: ${profile.name} ---\n`);

    // Step 1: Register (or skip if exists)
    await this.registerBuyer(profile);

    // Step 2: Login
    const token = await this.loginBuyer(profile.email, profile.password);
    this.tokens.set(profile.email, token);

    // Step 3: Browse products
    await this.browseProducts();

    if (this.products.length === 0) {
      console.log('⚠ No products available for purchase');
      return;
    }

    // Step 4: View product details (simulating interest)
    const randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
    await this.viewProductDetails(randomProduct._id);

    // Step 5: Add to cart and place order
    const cartItems = [
      {
        productId: randomProduct._id,
        quantity: Math.floor(Math.random() * 3) + 1 // 1-3 items
      }
    ];

    await this.placeOrder(profile.email, cartItems, profileIndex);

    // Step 6: Check order history
    await this.getMyOrders(profile.email);

    console.log(`\n--- Buyer Journey Complete: ${profile.name} ---\n`);
  }

  async runConcurrentSimulations(count = 3) {
    console.log(`\n🚀 Starting ${count} concurrent buyer simulations...\n`);

    const simulations = [];
    for (let i = 0; i < count && i < BUYER_PROFILES.length; i++) {
      simulations.push(this.simulateBuyerJourney(i));
    }

    await Promise.allSettled(simulations);

    console.log('\n📊 Simulation Summary:');
    console.log(`Total orders placed: ${this.orders.length}`);
    this.orders.forEach(order => {
      console.log(`  - ${order.orderId}: ${order.buyer} - ₹${order.total} (${order.status})`);
    });
  }

  async runLoadTest(duration = 60000, interval = 5000) {
    console.log(`\n🔥 Starting load test for ${duration / 1000}s...\n`);

    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;

    const intervalId = setInterval(async () => {
      if (Date.now() - startTime >= duration) {
        clearInterval(intervalId);
        console.log('\n📈 Load Test Results:');
        console.log(`Total requests: ${requestCount}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${errorCount}`);
        console.log(`Success rate: ${((successCount / requestCount) * 100).toFixed(2)}%`);
        return;
      }

      try {
        requestCount++;
        await this.browseProducts();
        successCount++;
        process.stdout.write('.');
      } catch (error) {
        errorCount++;
        process.stdout.write('x');
      }
    }, interval);
  }

  async cleanupTestData() {
    try {
      const User = require('./models/User');
      const Order = require('./models/Order');

      // Delete test orders
      const testEmails = BUYER_PROFILES.map(p => p.email);
      const testBuyers = await User.find({ email: { $in: testEmails } });
      const testBuyerIds = testBuyers.map(u => u._id);

      await Order.deleteMany({ buyer: { $in: testBuyerIds } });
      await User.deleteMany({ email: { $in: testEmails } });

      console.log('✓ Cleaned up test data');
    } catch (error) {
      console.error('✗ Cleanup failed:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const simulator = new BuyerSimulator();
  const command = process.argv[2];

  try {
    await simulator.connectDB();

    switch (command) {
      case 'single':
        await simulator.simulateBuyerJourney(parseInt(process.argv[3]) || 0);
        break;

      case 'concurrent':
        await simulator.runConcurrentSimulations(parseInt(process.argv[3]) || 3);
        break;

      case 'load':
        const duration = parseInt(process.argv[3]) || 60000;
        const interval = parseInt(process.argv[4]) || 5000;
        await simulator.runLoadTest(duration, interval);
        break;

      case 'cleanup':
        await simulator.cleanupTestData();
        break;

      default:
        console.log(`
Usage: node simulate-buyers.js [command] [options]

Commands:
  single [index]         - Simulate single buyer journey (index: 0-2)
  concurrent [count]     - Run concurrent buyer simulations (default: 3)
  load [duration] [interval] - Load test (duration in ms, interval in ms)
  cleanup                - Remove all test data

Examples:
  node simulate-buyers.js single 0
  node simulate-buyers.js concurrent 5
  node simulate-buyers.js load 60000 2000
  node simulate-buyers.js cleanup
`);
    }

    await simulator.disconnectDB();
  } catch (error) {
    console.error('Simulation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BuyerSimulator;
