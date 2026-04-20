#!/usr/bin/env node

/**
 * Seed mock wallets (with bank accounts) for all existing sellers.
 * This does NOT delete any data. It only creates wallets for sellers
 * who don't already have one.
 * 
 * Also ensures every seller has enough orders in the last 30 days
 * so the AI Financial Consultant has meaningful data to analyze.
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'msme_marketplace';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

const BANKS = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'Bank Jago'];
const NAMES = [
  'Rani Pratama', 'Surya Wijaya', 'Joko Santoso', 'Ani Wijaya', 'Budi Kopi',
  'Dewi Sari', 'Ahmad Rizal', 'Budi Santoso', 'Maya Brownies', 'Siti Aminah',
  'Agus Wijaya', 'Rina Buah', 'Doni Tanaman', 'Dina Marlina', 'Harto Kayu',
  'Indah Batik', 'Rudi Kaos', 'Aisyah Hijab', 'Lina Skincare', 'Yuni Aroma',
  'Budi Home', 'Sari Decor', 'Tech Shop', 'Andi Elektronik', 'Rina Design',
  'Dodi Marketing', 'PT Rasa Nusantara', 'Hendra Kurniawan', 'Sinta Market'
];

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB_NAME);

    // Get all sellers (users who have a business)
    const businesses = await db.collection('businesses').find({}).toArray();
    const sellerIds = businesses.map(b => b.ownerId);
    console.log(`Found ${sellerIds.length} sellers with businesses.\n`);

    let walletsCreated = 0;
    let ordersCreated = 0;

    for (let i = 0; i < sellerIds.length; i++) {
      const sellerId = sellerIds[i];
      const sellerObjId = typeof sellerId === 'string' ? new ObjectId(sellerId) : sellerId;
      const biz = businesses[i];

      console.log(`📦 Processing: ${biz.name} (${sellerId})`);

      // --- 1. Create Wallet with Bank Account ---
      const existingWallet = await db.collection('wallets').findOne({ user: sellerObjId });
      if (!existingWallet) {
        const holderName = NAMES[i % NAMES.length];
        const wallet = {
          _id: new ObjectId(),
          user: sellerObjId,
          balance: randomInt(500000, 5000000),
          bankAccount: {
            bankName: randomItem(BANKS),
            accountNumber: `${randomInt(100, 999)}${randomInt(1000000, 9999999)}`,
            accountHolder: holderName,
          },
          transactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.collection('wallets').insertOne(wallet);
        walletsCreated++;
        console.log(`   ✅ Wallet created (${wallet.bankAccount.bankName} - ${wallet.bankAccount.accountNumber})`);
      } else {
        // If wallet exists but has no bank account, add one
        if (!existingWallet.bankAccount) {
          const holderName = NAMES[i % NAMES.length];
          await db.collection('wallets').updateOne(
            { _id: existingWallet._id },
            {
              $set: {
                bankAccount: {
                  bankName: randomItem(BANKS),
                  accountNumber: `${randomInt(100, 999)}${randomInt(1000000, 9999999)}`,
                  accountHolder: holderName,
                },
                updatedAt: new Date(),
              }
            }
          );
          console.log(`   ✅ Bank account added to existing wallet`);
        } else {
          console.log(`   ⏭  Wallet already exists`);
        }
      }

      // --- 2. Ensure recent orders exist (last 30 days) ---
      const recentOrderCount = await db.collection('orders').countDocuments({
        seller: sellerObjId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      if (recentOrderCount < 5) {
        // Get this seller's products
        const sellerProducts = await db.collection('products').find({ seller: sellerObjId }).limit(5).toArray();
        if (sellerProducts.length === 0) {
          console.log(`   ⚠️  No products found, skipping order generation`);
          continue;
        }

        // Get some random buyers
        const buyers = await db.collection('users').find({}).limit(10).toArray();

        const newOrders = [];
        const ordersToCreate = randomInt(8, 15);

        for (let j = 0; j < ordersToCreate; j++) {
          const product = randomItem(sellerProducts);
          const buyer = randomItem(buyers);
          const qty = randomInt(1, 4);
          const orderDate = randomDate(30);
          const subtotal = product.price * qty;
          const shippingFee = randomInt(8000, 25000);

          newOrders.push({
            _id: new ObjectId(),
            orderNumber: `ORD-MOCK-${Date.now()}-${j}`,
            buyer: buyer._id,
            buyerName: buyer.name || 'Mock Buyer',
            buyerPhone: buyer.phone || '081200000000',
            seller: sellerObjId,
            businessId: biz._id,
            businessName: biz.name,
            products: [{
              productId: product._id,
              name: product.name,
              price: product.price,
              quantity: qty,
            }],
            subtotal: subtotal,
            shippingFee: shippingFee,
            discountAmount: 0,
            totalAmount: subtotal + shippingFee,
            status: randomItem(['completed', 'delivered', 'confirmed', 'delivered', 'completed']),
            paymentMethod: randomItem(['COD', 'Transfer', 'E-Wallet']),
            paymentStatus: 'paid',
            deliveryAddress: {
              address: biz.address || 'Jakarta',
              city: biz.city || 'Jakarta',
            },
            createdAt: orderDate,
            updatedAt: orderDate,
          });
        }

        await db.collection('orders').insertMany(newOrders);
        ordersCreated += newOrders.length;
        console.log(`   ✅ Created ${newOrders.length} recent orders`);
      } else {
        console.log(`   ⏭  Already has ${recentOrderCount} recent orders`);
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Wallets created: ${walletsCreated}`);
    console.log(`   Orders created: ${ordersCreated}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run();
