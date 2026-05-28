#!/usr/bin/env node

/**
 * Clear Simulation Data
 * Deletes only seed/simulated data while preserving real user data.
 *
 * Identification strategy:
 *   Users:    email ends with @marketplace.test
 *   Expenses: source === "seed"
 *   Others:   linked to seed users/businesses via foreign keys
 *
 * Collections handled:
 *   users, businesses, products, orders, expenses,
 *   chatrooms, messages, wallets
 */

const { MongoClient } = require("mongodb");
const path = require("path");

try {
  require("dotenv").config({ path: path.resolve(__dirname, ".env") });
} catch {
  // dotenv optional
}

const MONGODB_URI =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "msme_marketplace";

const SEED_EMAIL_DOMAIN = "@marketplace.test";

async function clearSimulationData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("  🔍 Identifying simulated data...\n");

    // ── 1. Find seed user IDs ──
    const usersCollection = db.collection("users");
    const seedUsers = await usersCollection
      .find({ email: { $regex: `${SEED_EMAIL_DOMAIN.replace(".", "\\.")}$` } })
      .project({ _id: 1, email: 1, name: 1 })
      .toArray();

    const seedUserIds = seedUsers.map((u) => u._id);
    console.log(`  👤 Seed users found: ${seedUsers.length}`);

    // ── 2. Find seed business IDs ──
    const businessesCollection = db.collection("businesses");
    const seedBusinesses = await businessesCollection
      .find({ ownerId: { $in: seedUserIds } })
      .project({ _id: 1, name: 1 })
      .toArray();

    const seedBusinessIds = seedBusinesses.map((b) => b._id);
    const seedBusinessOwnerIds = seedBusinesses.map((b) => b.ownerId);
    console.log(`  🏪 Seed businesses found: ${seedBusinesses.length}`);

    // ── 3. Delete in dependency order ──
    let total = 0;

    // Messages (depend on chatrooms)
    const msgCol = db.collection("messages");
    const msgDel = await msgCol.deleteMany({});
    if (msgDel.deletedCount > 0) {
      total += msgDel.deletedCount;
      console.log(`  🗑️  Messages:             ${msgDel.deletedCount}`);
    }

    // Chatrooms (depend on users)
    const chatCol = db.collection("chatrooms");
    const chatDel = await chatCol.deleteMany({
      $or: [
        { participants: { $in: seedUserIds } },
        { buyerId: { $in: seedUserIds } },
        { sellerId: { $in: seedUserIds } },
      ],
    });
    if (chatDel.deletedCount > 0) {
      total += chatDel.deletedCount;
      console.log(`  🗑️  Chatrooms:            ${chatDel.deletedCount}`);
    }

    // Orders (foreign keys: seller, buyer, businessId)
    const ordersCol = db.collection("orders");
    const orderDel = await ordersCol.deleteMany({
      $or: [
        { seller: { $in: seedUserIds } },
        { buyer: { $in: seedUserIds } },
        { businessId: { $in: seedBusinessIds } },
      ],
    });
    if (orderDel.deletedCount > 0) {
      total += orderDel.deletedCount;
      console.log(`  🗑️  Orders:               ${orderDel.deletedCount}`);
    }

    // Expenses (have source: "seed")
    const expensesCol = db.collection("expenses");
    const expDel = await expensesCol.deleteMany({ source: "seed" });
    if (expDel.deletedCount > 0) {
      total += expDel.deletedCount;
      console.log(`  🗑️  Expenses:             ${expDel.deletedCount}`);
    }

    // Products (linked to seed businesses / sellers)
    const productsCol = db.collection("products");
    const prodDel = await productsCol.deleteMany({
      $or: [
        { businessId: { $in: seedBusinessIds } },
        { seller: { $in: seedUserIds } },
      ],
    });
    if (prodDel.deletedCount > 0) {
      total += prodDel.deletedCount;
      console.log(`  🗑️  Products:             ${prodDel.deletedCount}`);
    }

    // Wallets (linked to seed users)
    const walletsCol = db.collection("wallets");
    const walDel = await walletsCol.deleteMany({ user: { $in: seedUserIds } });
    if (walDel.deletedCount > 0) {
      total += walDel.deletedCount;
      console.log(`  🗑️  Wallets:              ${walDel.deletedCount}`);
    }

    // Businesses
    const bizDel = await businessesCollection.deleteMany({
      _id: { $in: seedBusinessIds },
    });
    if (bizDel.deletedCount > 0) {
      total += bizDel.deletedCount;
      console.log(`  🗑️  Businesses:           ${bizDel.deletedCount}`);
    }

    // Users (seed emails)
    const userDel = await usersCollection.deleteMany({
      _id: { $in: seedUserIds },
    });
    if (userDel.deletedCount > 0) {
      total += userDel.deletedCount;
      console.log(`  🗑️  Users:                ${userDel.deletedCount}`);
    }

    console.log(`\n  ✅ Removed ${total} simulated documents total`);
    console.log("  ✅ Real data preserved\n");
  } catch (err) {
    console.error("\n  ❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

const hasForce = process.argv.includes("--force") || process.argv.includes("-f");

if (hasForce) {
  clearSimulationData();
} else {
  console.log("\n  ⚠️  This will delete ALL simulated data created by seed-simulation.js");
  console.log("     Real user data will NOT be affected.");
  console.log(`     Identifier: emails ending with "${SEED_EMAIL_DOMAIN}"`);
  console.log(`     Database:   ${DB_NAME}`);
  console.log("\n     Run with --force or -f to proceed\n");
  process.stdout.write("  Type \"yes\" to continue: ");
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (data) => {
    if (data.trim().toLowerCase() === "yes") {
      process.stdin.pause();
      clearSimulationData();
    } else {
      console.log("\n  ❌ Cancelled. No data was deleted.\n");
      process.exit(0);
    }
  });
}
