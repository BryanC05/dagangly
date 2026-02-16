/**
 * Quick API Test for Buyer Flow
 * Simple script to test the order placement API
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function quickTest() {
  console.log('🧪 Quick Buyer Flow Test\n');

  try {
    // 1. Register/Login a test buyer
    console.log('1. Authenticating test buyer...');
    let token;
    try {
      const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'testbuyer@example.com',
        password: 'password123'
      });
      token = loginRes.data.token;
      console.log('   ✓ Test buyer logged in');
    } catch (e) {
      // Register if doesn't exist
      const regRes = await axios.post(`${API_URL}/api/auth/register`, {
        name: 'Test Buyer',
        email: 'testbuyer@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'buyer'
      });
      token = regRes.data.token;
      console.log('   ✓ Test buyer registered');
    }

    // 2. Get available products
    console.log('\n2. Fetching available products...');
    const productsRes = await axios.get(`${API_URL}/api/products`);
    const products = productsRes.data.products;
    console.log(`   ✓ Found ${products.length} products`);

    if (products.length === 0) {
      console.log('   ⚠ No products available - need sellers to add products first');
      return;
    }

    // 3. View a product
    console.log('\n3. Viewing product details...');
    const product = products[0];
    const productRes = await axios.get(`${API_URL}/api/products/${product._id}`);
    console.log(`   ✓ Product: ${productRes.data.name} - ₹${productRes.data.price}`);
    console.log(`      Stock: ${productRes.data.stock} | Seller: ${productRes.data.seller?.businessName || 'Unknown'}`);

    // 4. Place an order
    console.log('\n4. Placing test order...');
    const orderRes = await axios.post(
      `${API_URL}/api/orders`,
      {
        products: [
          {
            productId: product._id,
            quantity: 1
          }
        ],
        deliveryAddress: {
          address: 'Test Address, Koramangala',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560034',
          coordinates: [77.6271, 12.9279]
        },
        notes: 'Quick test order'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`   ✓ Order created: ${orderRes.data._id}`);
    console.log(`      Total: ₹${orderRes.data.totalAmount}`);
    console.log(`      Status: ${orderRes.data.status}`);

    // 5. Check my orders
    console.log('\n5. Checking order history...');
    const ordersRes = await axios.get(`${API_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✓ Found ${ordersRes.data.length} orders`);

    console.log('\n✅ Buyer flow test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    console.error('   Make sure the server is running on', API_URL);
    process.exit(1);
  }
}

quickTest();
