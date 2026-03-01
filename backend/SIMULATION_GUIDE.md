# UMKM Marketplace - Simulation Data Guide

This guide provides instructions for loading, managing, and using the simulation data for testing the UMKM Marketplace application.

## Table of Contents
- [Overview](#overview)
- [Loading Simulation Data](#loading-simulation-data)
- [Deleting Simulation Data](#deleting-simulation-data)
- [Simulated User Accounts](#simulated-user-accounts)
  - [Verified Sellers (With Products)](#verified-sellers-with-products)
  - [Verified Sellers (Empty Storefronts)](#verified-sellers-empty-storefronts)
  - [New Sellers (Few Products)](#new-sellers-few-products)
  - [Unverified Sellers](#unverified-sellers)
  - [Incomplete Business Registration](#incomplete-business-registration)
  - [Buyers (No Business)](#buyers-no-business)
- [Geographic Locations](#geographic-locations)
- [Default Credentials](#default-credentials)

---

## Overview

The simulation data creates realistic user/business/product scenarios for testing:

| User Type | Count | Description |
|-----------|-------|-------------|
| Verified Sellers (Products) | 3 | Active businesses with 8-25 products |
| Verified Sellers (Empty) | 2 | Verified but no products yet |
| New Sellers (Few Products) | 2 | New businesses with 3-8 products |
| Unverified Sellers | 1 | Business not yet verified |
| Incomplete Business | 1 | User with incomplete registration |
| Buyers (No Business) | 8 | Regular buyers without businesses |

---

## Loading Simulation Data

### Prerequisites
- MongoDB running locally or accessible via `MONGODB_URI`
- Node.js installed
- Backend dependencies installed (`npm install` in backend directory)

### Installing MongoDB

#### Option 1: Homebrew (Recommended for macOS 13+)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb
```

#### Option 2: MongoDB Compass (GUI with built-in server)
Download MongoDB Compass from: https://www.mongodb.com/try/download/compass
- Install the application
- Click "Start using Compass" (it includes a local MongoDB instance)

#### Option 3: Docker (if you have Docker installed)
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

#### Option 4: Direct Download (for macOS 12 or older)
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Extract the archive
3. Create data directory: `mkdir -p ~/mongodb-data`
4. Start MongoDB: `~/mongodb-macos-x86_64-*/bin/mongod --dbpath ~/mongodb-data`

### Option 5: MongoDB Atlas (Cloud)
If you have a MongoDB Atlas account:

**Using .env file (Recommended):**
1. Create `.env` file in backend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
DB_NAME=msme_marketplace
```
2. Run seed script:
```bash
cd backend
node seed-business-simulation.js
```

**Using environment variables:**
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net"
export DB_NAME="msme_marketplace"
cd backend
node seed-business-simulation.js
```

**Note for Atlas:** Make sure your IP address is whitelisted in Atlas Network Access settings.

### Troubleshooting MongoDB Connection

**Error: `ECONNREFUSED ::1:27017`**

This means MongoDB is not running. Try these fixes:

```bash
# Check if MongoDB is already installed
which mongod

# If installed via Homebrew but not starting:
brew services restart mongodb-community

# Check status:
brew services list | grep mongo

# If Homebrew fails (macOS 12 or older), use Docker:
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or download MongoDB manually from:
# https://www.mongodb.com/try/download/community
```

**Check MongoDB Status:**
```bash
brew services list | grep mongo
```

Should show: `mongodb-community started`

### Option 1: Run Seed Script Directly
```bash
# Navigate to backend directory
cd backend

# Run the simulation seed script
node seed-business-simulation.js
```

### Option 2: Using npm Script (if configured in package.json)
```bash
cd backend
npm run seed:simulation
```

### Environment Variables
```bash
# Optional: Set custom MongoDB URI
export MONGODB_URI="mongodb://localhost:27017"

# Optional: Set custom database name (default: msme_marketplace)
export DB_NAME="msme_marketplace"
```

### What Gets Created
The script will:
1. Clear existing collections (users, businesses, products, orders, chatrooms, messages)
2. Create 15 users with varied business states
3. Create 8-10 businesses
4. Generate 50-100 products across different categories
5. Assign realistic locations around Bekasi/Jakarta area

---

## Deleting Simulation Data

### Option 1: Use Clear Data Script (Recommended)
```bash
cd backend

# Interactive mode (requires typing "yes")
node clear-simulation-data.js

# Force mode (no confirmation)
node clear-simulation-data.js --force
# or
node clear-simulation-data.js -f
```

This script clears:
- users
- businesses  
- products
- orders
- chatrooms
- messages
- reviews
- savedproducts
- logos
- notifications

### Option 2: Run Seed Script (Auto-clears on run)
The seed script automatically clears all data before creating new simulation data.

### Option 3: Manual MongoDB Cleanup
```bash
# Connect to MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net"

# Switch to database
use msme_marketplace

# Drop collections
db.users.deleteMany({})
db.businesses.deleteMany({})
db.products.deleteMany({})
db.orders.deleteMany({})
db.chatrooms.deleteMany({})
db.messages.deleteMany({})
db.logos.deleteMany({})  # If exists

# Or drop entire database
db.dropDatabase()
```

### Option 4: Using MongoDB Compass
1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Select `msme_marketplace` database
4. Delete collections individually or drop the entire database

---

## Simulated User Accounts

### Default Credentials
**Password for ALL accounts:** `test123`

---

### Verified Sellers (With Products)

These are established businesses with verified status and active product listings.

| Name | Email | Phone | Business Name | Location | Products | Status |
|------|-------|-------|---------------|----------|----------|--------|
| Rani Pratama | `rani.summarecon@marketplace.test` | 081200000101 | Dapur Summarecon | Summarecon | 8-15 | ✅ Verified, Member |
| Budi Santoso | `budi.summarecon@marketplace.test` | 081200000102 | Kue Kering Budi | Summarecon | 10-20 | ✅ Verified, Member |
| PT Rasa Nusantara | `pt.rasa@marketplace.test` | 0218000001 | Rasa Nusantara Catering | Summarecon | 15-25 | ✅ Verified, Member, Medium Enterprise |

**Use Cases:**
- Test full seller experience
- Test product browsing with rich catalog
- Test business logo display
- Test membership features

---

### Verified Sellers (Empty Storefronts)

Verified businesses that haven't added products yet.

| Name | Email | Phone | Business Name | Location | Products | Status |
|------|-------|-------|---------------|----------|----------|--------|
| Farhan Alif | `farhan.binus@marketplace.test` | 081200000201 | Student Food Corner | BINUS | 0 | ✅ Verified, Empty Store |
| Dina Marlina | `dina.binus@marketplace.test` | 081200000202 | Dina Craft Studio | BINUS | 0 | ✅ Verified, Empty Store |

**Use Cases:**
- Test "Add Product" flow
- Test empty storefront UI
- Test business profile without products

---

### New Sellers (Few Products)

Recently joined sellers with small product catalogs.

| Name | Email | Phone | Business Name | Location | Products | Status |
|------|-------|-------|---------------|----------|----------|--------|
| Agus Wijaya | `agus.harapan@marketplace.test` | 081200000301 | Sayur Segar Agus | Harapan Indah | 3-6 | ⏳ Not Verified |
| Maya Sari | `maya.harapan@marketplace.test` | 081200000302 | Maya Coffee House | Harapan Indah | 4-8 | ⏳ Not Verified |

**Use Cases:**
- Test new seller onboarding
- Test unverified business display
- Test product management with few items

---

### Unverified Sellers

Businesses that haven't completed verification.

| Name | Email | Phone | Business Name | Location | Products | Status |
|------|-------|-------|---------------|----------|----------|--------|
| Hendra Kurniawan | `hendra.wisata@marketplace.test` | 081200000401 | Snack Box Hendra | Grand Wisata | 5-10 | ❌ Unverified |

**Use Cases:**
- Test verification workflow
- Test trust indicators
- Test unverified seller limitations

---

### Incomplete Business Registration

Users who started but haven't completed business registration.

| Name | Email | Phone | Business Name | Location | Products | Status |
|------|-------|-------|---------------|----------|----------|--------|
| Sinta Dewi | `sinta.cibubur@marketplace.test` | 081200000501 | Sinta Fashion | Cibubur | 0 | ⚠️ Incomplete |

**Use Cases:**
- Test business registration completion flow
- Test logo generator prerequisite (should redirect to complete business)
- Test incomplete profile UI

---

### Buyers (No Business)

Regular buyer accounts without any business registration.

| Name | Email | Phone | Location |
|------|-------|-------|----------|
| Andi Wijaya | `andi.buyer@marketplace.test` | 081300000101 | Summarecon |
| Lisa Permata | `lisa.buyer@marketplace.test` | 081300000102 | BINUS |
| Rudi Hartono | `rudi.buyer@marketplace.test` | 081300000103 | Harapan Indah |
| Nina Anggraini | `nina.buyer@marketplace.test` | 081300000104 | Grand Wisata |
| Yusuf Ibrahim | `yusuf.buyer@marketplace.test` | 081300000105 | Cibubur |
| Dewi Kusuma | `dewi.buyer@marketplace.test` | 081300000106 | Summarecon |
| Ahmad Fauzi | `ahmad.buyer@marketplace.test` | 081300000107 | BINUS |
| Putri Amelia | `putri.buyer@marketplace.test` | 081300000108 | Harapan Indah |

**Use Cases:**
- Test buyer-only experience
- Test product browsing and purchasing
- Test business registration from profile
- Test logo generator access (should be blocked)

---

## Geographic Locations

All simulation data is centered around these Bekasi/Jakarta locations:

| Location Key | Address | Coordinates | City |
|-------------|---------|-------------|------|
| summarecon | Ruko Emerald Commercial, Summarecon Bekasi | 107.0029, -6.2247 | Bekasi |
| binus | Jl. Bulevar Ahmad Yani, area BINUS Bekasi | 107.0008, -6.2232 | Bekasi |
| harapanIndah | Jl. Harapan Indah Boulevard, Bekasi | 106.9898, -6.2154 | Bekasi |
| grandWisata | Jl. Grand Wisata, Tambun Selatan | 107.0167, -6.2389 | Bekasi |
| cibubur | Cibubur CBD, Ciracas | 106.8813, -6.3688 | Jakarta Timur |

---

## Product Categories

The simulation generates products across these categories:

1. **Makanan** - Nasi Goreng, Sate, Rendang, Gado-Gado, etc.
2. **Minuman** - Kopi, Teh, Jus, Bandrek, Cendol, etc.
3. **Kue & Snack** - Brownies, Donat, Risoles, etc.
4. **Sayur & Buah** - Sayur segar, buah mix, paket organik, etc.
5. **Kerajinan** - Tas rotan, vas anyaman, lampu hias, etc.

---

## Quick Test Scenarios

### Test Business Registration Flow
1. Login as: `sinta.cibubur@marketplace.test` / `test123`
2. Go to Profile → Complete business registration
3. Try Logo Generator (should now work)

### Test Logo Generator Prerequisite
1. Login as: `andi.buyer@marketplace.test` / `test123`
2. Try to access Logo Generator
3. Should see "Business Registration Required" message

### Test Business Logo Display
1. Login as: `rani.summarecon@marketplace.test` / `test123`
2. Add business logo via Logo Generator
3. Check ProductCard and ProductDetail show the logo
4. Check Profile shows business logo

### Test Empty Storefront
1. Login as: `farhan.binus@marketplace.test` / `test123`
2. Navigate to "My Products"
3. Should show empty state with "Add Product" CTA

---

## Troubleshooting

### Connection Issues
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017" --eval "db.adminCommand('ping')"
```

### Script Errors
```bash
# Install dependencies
cd backend
npm install

# Check Node version (should be 18+)
node --version
```

### Data Not Showing
- Clear browser/app cache
- Restart backend server
- Check MongoDB data was created: `db.users.find().count()`

---

## File Location

Simulation script: [`backend/seed-business-simulation.js`](seed-business-simulation.js)

---

**Note:** All simulation accounts use the password: **`test123`**
