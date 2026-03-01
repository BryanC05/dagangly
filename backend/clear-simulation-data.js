#!/usr/bin/env node

/**
 * Clear Simulation Data Script
 * Removes all data from collections while keeping indexes
 * Supports both local MongoDB and MongoDB Atlas
 */

const { MongoClient } = require('mongodb');

// Load environment variables from .env file
const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');

try {
  require('dotenv').config({ path: dotenvPath });
} catch (e) {
  console.log('⚠️  dotenv not installed, using environment variables directly');
}

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'msme_marketplace';

// Debug: Show which env variable was used
if (process.env.MONGODB_URL) {
  console.log('📋 Using MONGODB_URL from .env');
} else if (process.env.MONGODB_URI) {
  console.log('📋 Using MONGODB_URI from .env');
} else {
  console.log('📋 Using default localhost connection');
}

// Collections to clear
const COLLECTIONS = [
  'users',
  'businesses',
  'products',
  'orders',
  'orderitems',
  'chatrooms',
  'messages',
  'reviews',
  'savedproducts',
  'logos',
  'notifications',
];

async function clearData() {
  console.log('🔌 Connecting to MongoDB...');
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`   Database: ${DB_NAME}`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    
    // Get list of existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    console.log('🧹 Clearing collections...\n');
    
    let clearedCount = 0;
    let skippedCount = 0;
    
    for (const collectionName of COLLECTIONS) {
      if (existingNames.includes(collectionName)) {
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();
        
        if (countBefore > 0) {
          await collection.deleteMany({});
          console.log(`  ✅ ${collectionName}: Cleared ${countBefore} documents`);
          clearedCount++;
        } else {
          console.log(`  ⚪ ${collectionName}: Already empty`);
          skippedCount++;
        }
      } else {
        console.log(`  ⚪ ${collectionName}: Collection does not exist`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Cleared: ${clearedCount} collections`);
    console.log(`   Skipped: ${skippedCount} collections`);
    console.log(`\n✨ All simulation data has been cleared!`);
    
  } catch (error) {
    console.error('\n❌ Error clearing data:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  - Check if MONGODB_URI is correct in .env file');
    console.error('  - Ensure MongoDB is running (local) or Atlas IP is whitelisted');
    console.error('  - Verify database name is correct');
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Confirmation prompt for production safety
if (process.argv.includes('--force') || process.argv.includes('-f')) {
  clearData();
} else {
  console.log('\n⚠️  WARNING: This will delete ALL data from the following collections:');
  console.log('   ' + COLLECTIONS.join(', '));
  console.log(`\n   Database: ${DB_NAME}`);
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log('\n   Run with --force or -f to skip this confirmation\n');
  
  // Simple confirmation using stdin
  process.stdout.write('   Type "yes" to continue: ');
  
  const stdin = process.stdin;
  stdin.setEncoding('utf-8');
  stdin.on('data', (data) => {
    const input = data.trim().toLowerCase();
    if (input === 'yes') {
      stdin.pause();
      clearData();
    } else {
      console.log('\n❌ Cancelled. No data was deleted.\n');
      process.exit(0);
    }
  });
}
