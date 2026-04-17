# UMKM Marketplace - Simulation Data Guide

This guide provides instructions for loading, managing, and using the simulation data for testing the UMKM Marketplace application.

## Table of Contents
- [Overview](#overview)
- [Loading Simulation Data](#loading-simulation-data)
- [Deleting Simulation Data](#deleting-simulation-data)
- [Simulated User Accounts](#simulated-user-accounts)
  - [Food Businesses](#food-businesses)
  - [Beverage Businesses](#beverage-businesses)
  - [Bakery & Snack Businesses](#bakery--snack-businesses)
  - [Fresh Produce Businesses](#fresh-produce-businesses-agriculture)
  - [Handicraft Businesses](#handicraft-businesses)
  - [Fashion Businesses](#fashion-businesses)
  - [Beauty Businesses](#beauty-businesses)
  - [Home Goods Businesses](#home-goods-businesses)
  - [Electronics Businesses](#electronics-businesses)
  - [Services Businesses](#services-businesses)
  - [Catering / Medium Enterprise](#catering--medium-enterprise)
  - [Mixed Category Businesses](#mixed-category-businesses)
  - [Buyers (No Business)](#buyers-no-business)
- [Product Categories](#product-categories)
- [Geographic Locations](#geographic-locations)
- [Default Credentials](#default-credentials)

---

## Overview

The simulation data creates realistic user/business/product scenarios for testing:

| Category | Count |
|----------|-------|
| Total Businesses | 33 |
| Total Buyers | 10 |
| Total Users | 43 |
| Total Products | 400-600 |

**Business Categories:**
- Food (Makanan)
- Beverages (Minuman)
- Snacks (Kue & Snack)
- Agriculture (Sayur & Buah)
- Handicrafts (Kerajinan)
- Fashion (Fashion)
- Beauty (Kecantikan)
- Home (Rumah Tangga)
- Electronics (Elektronik)
- Services (Jasa)

---

## Loading Simulation Data

### Prerequisites
- MongoDB running locally or accessible via `MONGODB_URL`
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

### Run Seed Script
```bash
# Navigate to backend directory
cd backend

# Run the simulation seed script
node seed-business-simulation.js
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
2. Create 33 businesses across 10 categories
3. Generate 400-600 products across different categories
4. Create 10 buyer accounts
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
db.logos.deleteMany({})

# Or drop entire database
db.dropDatabase()
```

---

## Simulated User Accounts

### Default Credentials
**Password for ALL accounts:** `test123`

---

### Food Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Dapur Summarecon | `rani.summarecon@marketplace.test` | 081200000101 | Summarecon | 12-20 | ✅ Verified, Member |
| Warung Nusantara | `surya.warung@marketplace.test` | 081200000102 | Harapan Indah | 8-15 | ✅ Verified |
| Soto & Bakso Pak Joko | `joko.soto@marketplace.test` | 081200000103 | Grand Wisata | 6-12 | ⏳ Not Verified |
| Nasi Padang Bu Ani | `ani.padang@marketplace.test` | 081200000104 | Cibubur | 10-18 | ✅ Verified, Member |

---

### Beverage Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Kopi Kita | `budi.kopi@marketplace.test` | 081200000201 | Summarecon | 10-16 | ✅ Verified, Member |
| Es Teh Manis Bu Dewi | `dewi.esteh@marketplace.test` | 081200000202 | BINUS | 8-14 | ✅ Verified |
| Kedai Kopi Senja | `rizal.kedai@marketplace.test` | 081200000203 | Harapan Indah | 10-18 | ✅ Verified, Member |

---

### Bakery & Snack Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Kue Kering Budi | `budi.kue@marketplace.test` | 081200000301 | Summarecon | 12-22 | ✅ Verified, Member |
| Browns & Co | `maya.brownies@marketplace.test` | 081200000302 | BINUS | 8-15 | ✅ Verified, Member |
| Donat Kentang Madu | `siti.donat@marketplace.test` | 081200000303 | Grand Wisata | 6-12 | ⏳ Not Verified |

---

### Fresh Produce Businesses (Agriculture)

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Sayur Segar Agus | `agus.sayur@marketplace.test` | 081200000401 | Harapan Indah | 10-18 | ✅ Verified |
| Buah Segar Bekasi | `rina.buah@marketplace.test` | 081200000402 | Cibubur | 8-16 | ✅ Verified, Member |
| Organik Hydroponik | `doni.organic@marketplace.test` | 081200000403 | Summarecon | 6-12 | ⏳ Not Verified |

---

### Handicraft Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Anyaman Lokal | `dina.anyaman@marketplace.test` | 081200000501 | BINUS | 8-16 | ✅ Verified |
| Kerajinan Kayu Jati | `harto.kayu@marketplace.test` | 081200000502 | Grand Wijata | 6-14 | ✅ Verified, Member |

---

### Fashion Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Batik Modern Indah | `indah.batik@marketplace.test` | 081200000601 | Summarecon | 10-18 | ✅ Verified, Member |
| Kaos Polos Premium | `rudi.kaos@marketplace.test` | 081200000602 | Harapan Indah | 8-14 | ⏳ Not Verified |
| Hijab Syar'i Gallery | `aisyah.hijab@marketplace.test` | 081200000603 | Cibubur | 12-20 | ✅ Verified, Member |

---

### Beauty Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Skincare Alami | `lina.skincare@marketplace.test` | 081200000701 | Summarecon | 8-16 | ✅ Verified, Member |
| Aromaterapi Nusantara | `yuni.aroma@marketplace.test` | 081200000702 | BINUS | 6-12 | ⏳ Not Verified |

---

### Home Goods Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Perlengkapan Rumah Modern | `budi.home@marketplace.test` | 081200000801 | Summarecon | 10-18 | ✅ Verified, Member |
| Dekorasi Rumah Unik | `sari.decor@marketplace.test` | 081200000802 | Harapan Indah | 8-15 | ⏳ Not Verified |

---

### Electronics Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Gadget & Accessories | `tech.gadget@marketplace.test` | 081200000901 | BINUS | 10-18 | ✅ Verified, Member |
| Elektronik Rumah Tangga | `andi.elektronik@marketplace.test` | 081200000902 | Grand Wijata | 6-12 | ⏳ Not Verified |

---

### Services Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Desain Kreatif Studio | `rina.design@marketplace.test` | 081200001001 | Summarecon | 6-10 | ✅ Verified, Member |
| Digital Marketing Hub | `dodi.marketing@marketplace.test` | 081200001002 | Cibubur | 4-8 | ✅ Verified, Member |

---

### Catering / Medium Enterprise

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Rasa Nusantara Catering | `pt.rasa@marketplace.test` | 0218000001 | Summarecon | 20-35 | ✅ Verified, Member, Medium Enterprise |

---

### Mixed Category Businesses

| Name | Email | Phone | Location | Products | Status |
|------|-------|-------|----------|----------|--------|
| Snack Box & Katering | `hendra.snackbox@marketplace.test` | 081200001101 | Grand Wijata | 8-16 | ⏳ Not Verified |
| Market Fresh & Co | `sinta.market@marketplace.test` | 081200001102 | Cibubur | 12-22 | ✅ Verified, Member |

---

### Buyers (No Business)

Regular buyer accounts without any business registration.

| Name | Email | Phone | Location |
|------|-------|-------|----------|
| Andi Wijaya | `andi.buyer@marketplace.test` | 081300000101 | Summarecon |
| Lisa Permata | `lisa.buyer@marketplace.test` | 081300000102 | BINUS |
| Rudi Hartono | `rudi.buyer@marketplace.test` | 081300000103 | Harapan Indah |
| Nina Anggraini | `nina.buyer@marketplace.test` | 081300000104 | Grand Wijata |
| Yusuf Ibrahim | `yusuf.buyer@marketplace.test` | 081300000105 | Cibubur |
| Dewi Kusuma | `dewi.buyer@marketplace.test` | 081300000106 | Summarecon |
| Ahmad Fauzi | `ahmad.buyer@marketplace.test` | 081300000107 | BINUS |
| Putri Amelia | `putri.buyer@marketplace.test` | 081300000108 | Harapan Indah |
| Bambang Sulistio | `bambang.buyer@marketplace.test` | 081300000109 | Grand Wijata |
| Citra Lestari | `citra.buyer@marketplace.test` | 081300000110 | Cibubur |

---

## Product Categories

The simulation generates products across these categories:

1. **Makanan** - Nasi Goreng, Sate, Rendang, Gado-Gado, Mie Ayam, Soto, dll.
2. **Minuman** - Kopi Susu, Es Teh, Jus Alpukat, Bandrek, Cendol, Thai Tea, dll.
3. **Kue & Snack** - Brownies, Donat, Risoles, Kue Lapis, Nastar, Kastengel, dll.
4. **Sayur & Buah** - Paket Sayur, Buah Segar, Selada Hydroponik, Apel, Jeruk, dll.
5. **Kerajinan** - Tas Rotan, Vas Bunga, Lampu Hias, Anyaman Bambu, dll.
6. **Fashion** - Kaos Polos, Kemeja Batik, Hoodie, Blouse, Dress, Scarf, dll.
7. **Kecantikan** - Face Wash, Body Scrub, Lip Tint, Moisturizer, Sunscreen, Serum, dll.
8. **Rumah Tangga** - Peralatan Makan, Lilin Aromaterapi, Gorden, Rak Dinding, dll.
9. **Elektronik** - Powerbank, Earphone Wireless, Kabel Charger, Speaker Bluetooth, dll.
10. **Jasa** - Desain Logo, Foto Produk, Edit Video, Konten Medsos, Konsultasi Bisnis, dll.

---

## Geographic Locations

All simulation data is centered around these Bekasi/Jakarta locations:

| Location Key | Address | Coordinates | City |
|-------------|---------|-------------|------|
| summarecon | Ruko Emerald Commercial, Summarecon Bekasi | 107.0029, -6.2247 | Bekasi |
| binus | Jl. Bulevar Ahmad Yani, area BINUS Bekasi | 107.0008, -6.2232 | Bekasi |
| harapanIndah | Jl. Harapan Indah Boulevard, Bekasi | 106.9898, -6.2154 | Bekasi |
| grandWisata | Jl. Grand Wijata, Tambun Selatan | 107.0167, -6.2389 | Bekasi |
| cibubur | Cibubur CBD, Ciracas | 106.8813, -6.3688 | Jakarta Timur |

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
