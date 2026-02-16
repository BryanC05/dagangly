const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msme_marketplace';

async function monitorLatestProduct() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        console.log('👀 Waiting for new products...');

        let lastProductId = null;

        setInterval(async () => {
            const latest = await Product.findOne().sort({ createdAt: -1 });

            if (latest && (!lastProductId || !latest._id.equals(lastProductId))) {
                lastProductId = latest._id;
                console.log(`\n🆕 New Product Detected: "${latest.name}"`);
                console.log(`   Initial Stock: ${latest.stock}`);
                console.log(`   ID: ${latest._id}`);
                monitorStock(latest._id);
            }
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
    }
}

async function monitorStock(productId) {
    console.log(`   Creating watcher for ${productId}...`);
    let initialStock = null;

    const interval = setInterval(async () => {
        const p = await Product.findById(productId);
        if (!p) {
            console.log(`❌ Product ${productId} deleted!`);
            clearInterval(interval);
            return;
        }

        if (initialStock === null) initialStock = p.stock;

        if (p.stock < initialStock) {
            console.log(`\n🚨 STOCK DROP DETECTED for "${p.name}"!`);
            console.log(`   ${initialStock} -> ${p.stock}`);
            clearInterval(interval);

            // Find orders
            const orders = await Order.find({ 'products.product': productId }).populate('buyer');
            if (orders.length > 0) {
                console.log('   Found Orders:');
                orders.forEach(o => console.log(`   - Order ${o._id} by ${o.buyer?.email} at ${o.createdAt}`));
            } else {
                console.log('   ❓ No orders found.');
            }
        }
    }, 1000);
}

monitorLatestProduct();
