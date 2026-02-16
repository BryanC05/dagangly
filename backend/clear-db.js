#!/usr/bin/env node

/**
 * Clear Database Script
 * Deletes ALL data from the MongoDB database
 * WARNING: This action is irreversible!
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define models if not available (minimal definition to allow deletion)
const userSchema = new mongoose.Schema({}, { strict: false });
const productSchema = new mongoose.Schema({}, { strict: false });
const orderSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function clearDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected');

        console.log('\n🗑️  Deleting all data...');

        const pResult = await Product.deleteMany({});
        console.log(`✓ Deleted ${pResult.deletedCount} products`);

        const oResult = await Order.deleteMany({});
        console.log(`✓ Deleted ${oResult.deletedCount} orders`);

        const uResult = await User.deleteMany({});
        console.log(`✓ Deleted ${uResult.deletedCount} users`);

        console.log('\n✨ Database cleared successfully!');

        await mongoose.disconnect();
    } catch (error) {
        console.error('✗ Failed to clear database:', error);
        process.exit(1);
    }
}

// Ask for confirmation if running interactively, otherwise just run
// Since this is a script tool, we'll just run it immediately, 
// assuming the user invoked it or we explained it.
clearDatabase();
