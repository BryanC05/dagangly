#!/usr/bin/env node

/**
 * Business Simulation Seed for Backend
 * Creates realistic user/business/product data with varied states:
 * - Some users with registered businesses (verified, active, with products)
 * - Some users with registered businesses (empty storefronts)
 * - Some users with incomplete business registrations
 * - Some users as individual buyers (no business)
 * 
 * Preserves geographic locations around:
 * - Summarecon Mall Bekasi
 * - BINUS Bekasi
 * - Harapan Indah Bekasi
 * - Grand Wisata Bekasi
 * - CBD Cibubur
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// Load environment variables from .env file
const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');

try {
  require('dotenv').config({ path: dotenvPath });
} catch (e) {
  console.log('⚠️  dotenv not installed, using environment variables directly');
}

const DEFAULT_PASSWORD = 'test123';
const DEFAULT_DB_NAME = process.env.DB_NAME || 'msme_marketplace';
const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Geographic centers from previous simulation
const LOCATIONS = {
  summarecon: {
    center: [107.0029, -6.2247],
    address: 'Ruko Emerald Commercial, Summarecon Bekasi',
    city: 'Bekasi',
    state: 'Jawa Barat',
    pincode: '17142',
  },
  binus: {
    center: [107.0008, -6.2232],
    address: 'Jl. Bulevar Ahmad Yani, area BINUS Bekasi',
    city: 'Bekasi',
    state: 'Jawa Barat',
    pincode: '17143',
  },
  harapanIndah: {
    center: [106.9898, -6.2154],
    address: 'Jl. Harapan Indah Boulevard, Bekasi',
    city: 'Bekasi',
    state: 'Jawa Barat',
    pincode: '17131',
  },
  grandWisata: {
    center: [107.0167, -6.2389],
    address: 'Jl. Grand Wisata, Tambun Selatan',
    city: 'Bekasi',
    state: 'Jawa Barat',
    pincode: '17510',
  },
  cibubur: {
    center: [106.8813, -6.3688],
    address: 'Cibubur CBD, Ciracas',
    city: 'Jakarta Timur',
    state: 'DKI Jakarta',
    pincode: '13720',
  },
};

// Helper to add small random offset to coordinates
function jitterCoord(coord, amount = 0.005) {
  return coord + (Math.random() - 0.5) * amount;
}

// Helper to get random item from array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate random date within range
function randomDate(daysBack = 365) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

// Categories and products for generation
const CATEGORIES = [
  { name: 'Makanan', tags: ['makanan', 'indonesian', 'tradisional'] },
  { name: 'Minuman', tags: ['minuman', 'kopi', 'teh', 'segara'] },
  { name: 'Kue & Snack', tags: ['kue', 'snack', 'camilan', 'manis'] },
  { name: 'Sayur & Buah', tags: ['sayur', 'buah', 'segar', 'organik'] },
  { name: 'Kerajinan', tags: ['kerajinan', 'handmade', 'dekorasi', 'lokal'] },
];

const PRODUCT_TEMPLATES = {
  'Makanan': [
    { name: 'Nasi Goreng Special', price: 25000, tags: ['nasi-goreng', 'pedas', 'ayam'] },
    { name: 'Mie Ayam Bakso', price: 22000, tags: ['mie', 'ayam', 'bakso', 'kuah'] },
    { name: 'Sate Ayam 10 Tusuk', price: 30000, tags: ['sate', 'ayam', 'kacang', 'bakar'] },
    { name: 'Rendang Daging 250gr', price: 55000, tags: ['rendang', 'daging', 'padang', 'pedas'] },
    { name: 'Gado-Gado Komplit', price: 20000, tags: ['gado-gado', 'sayur', 'kacang', 'sehat'] },
    { name: 'Ayam Penyet Sambal Ijo', price: 28000, tags: ['ayam', 'penyet', 'sambal', 'pedas'] },
    { name: 'Bakso Malang Jumbo', price: 35000, tags: ['bakso', 'malang', 'mie', 'kuah'] },
    { name: 'Nasi Uduk Komplit', price: 18000, tags: ['nasi-uduk', 'ayam', 'sambal', 'pagi'] },
  ],
  'Minuman': [
    { name: 'Kopi Susu Gula Aren', price: 18000, tags: ['kopi', 'susu', 'gula-aren', 'segara'] },
    { name: 'Es Teh Lemon', price: 12000, tags: ['teh', 'lemon', 'es', 'segar'] },
    { name: 'Jus Alpukat', price: 20000, tags: ['jus', 'alpukat', 'susu', 'sehat'] },
    { name: 'Bandrek Jahe', price: 15000, tags: ['bandrek', 'jahe', 'susu', 'hangat'] },
    { name: 'Es Cendol Dawet', price: 15000, tags: ['cendol', 'dawet', 'santan', 'gula-merah'] },
    { name: 'Thai Tea', price: 18000, tags: ['thai-tea', 'susu', 'es', 'manis'] },
    { name: 'Kopi Hitam Tubruk', price: 12000, tags: ['kopi', 'hitam', 'tubruk', 'strong'] },
    { name: 'Susu Jahe Merah', price: 16000, tags: ['susu', 'jahe', 'hangat', 'sehat'] },
  ],
  'Kue & Snack': [
    { name: 'Brownies Cokelat', price: 45000, tags: ['brownies', 'cokelat', 'manis', 'kue'] },
    { name: 'Kue Lapis Legit', price: 85000, tags: ['lapis-legit', 'butter', 'premium', 'kue'] },
    { name: 'Pisang Cokelat Crispy', price: 20000, tags: ['pisang', 'cokelat', 'crispy', 'snack'] },
    { name: 'Donat Kentang 6pcs', price: 30000, tags: ['donat', 'kentang', 'manis', 'snack'] },
    { name: 'Cromboloni Matcha', price: 25000, tags: ['cromboloni', 'matcha', 'viral', 'snack'] },
    { name: 'Kue Cubit Topping', price: 15000, tags: ['kue-cubit', 'mini', 'manis', 'snack'] },
    { name: 'Bolu Pandan Keju', price: 60000, tags: ['bolu', 'pandan', 'keju', 'kue'] },
    { name: 'Risoles Mayo 5pcs', price: 25000, tags: ['risoles', 'mayo', 'snack', 'goreng'] },
  ],
  'Sayur & Buah': [
    { name: 'Paket Sayur Seminggu', price: 75000, tags: ['sayur', 'paket', 'segar', 'organik'] },
    { name: 'Buah Segar Mix 2kg', price: 65000, tags: ['buah', 'mix', 'segar', 'vitamin'] },
    { name: 'Selada Hydroponik 250gr', price: 12000, tags: ['selada', 'hydroponik', 'segar', 'salad'] },
    { name: 'Bayam Organik 500gr', price: 15000, tags: ['bayam', 'organik', 'sehat', 'sayur'] },
    { name: 'Paket Smoothie Buah', price: 45000, tags: ['buah', 'smoothie', 'sehat', 'paket'] },
    { name: 'Tomat Cherry 500gr', price: 20000, tags: ['tomat', 'cherry', 'segar', 'snack'] },
    { name: 'Paket Bumbu Dapur', price: 35000, tags: ['bumbu', 'dapur', 'rempah', 'masak'] },
    { name: 'Kentang Rendang 1kg', price: 18000, tags: ['kentang', 'import', 'goreng', 'rebus'] },
  ],
  'Kerajinan': [
    { name: 'Tas Rotan Handmade', price: 150000, tags: ['tas', 'rotan', 'handmade', 'fashion'] },
    { name: 'Vas Bunga Anyaman', price: 75000, tags: ['vas', 'anyaman', 'bambu', 'dekorasi'] },
    { name: 'Lampu Hias Gantung', price: 120000, tags: ['lampu', 'hias', 'gantung', 'dekorasi'] },
    { name: 'Tatakan Gelas Batik', price: 45000, tags: ['tatakan', 'batik', 'kain', 'meja'] },
    { name: 'Hiasan Dinding Kayu', price: 95000, tags: ['hiasan', 'dinding', 'kayu', 'ukiran'] },
    { name: 'Keranjang Anyam Set', price: 85000, tags: ['keranjang', 'anyam', 'set', 'organizer'] },
    { name: 'Gantungan Kunci Ukir', price: 25000, tags: ['gantungan', 'kunci', 'ukiran', 'souvenir'] },
    { name: 'Cermin Hias Rotan', price: 110000, tags: ['cermin', 'hias', 'rotan', 'dekorasi'] },
  ],
};

// User types for simulation
const USER_TYPES = {
  VERIFIED_SELLER_WITH_PRODUCTS: 'verified_seller_products',
  VERIFIED_SELLER_EMPTY: 'verified_seller_empty',
  NEW_SELLER_FEW_PRODUCTS: 'new_seller_few',
  UNVERIFIED_SELLER: 'unverified_seller',
  INCOMPLETE_BUSINESS: 'incomplete_business',
  BUYER_NO_BUSINESS: 'buyer_no_business',
};

// Generate users with businesses
const BUSINESS_USERS = [
  // Type 1: Verified sellers with extensive products (Summarecon area)
  {
    type: USER_TYPES.VERIFIED_SELLER_WITH_PRODUCTS,
    name: 'Rani Pratama',
    email: 'rani.summarecon@marketplace.test',
    phone: '081200000101',
    businessName: 'Dapur Summarecon',
    businessType: 'small',
    description: 'Spesialis masakan rumahan dengan bahan segar dan berkualitas. Melayani pesanan katering dan makan siang kantoran.',
    locationKey: 'summarecon',
    isVerified: true,
    isActive: true,
    rating: 4.8,
    totalReviews: 134,
    isMember: true,
    membershipStatus: 'active',
    memberSince: randomDate(300),
    memberExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    productCount: { min: 8, max: 15 },
    categories: ['Makanan', 'Minuman'],
  },
  {
    type: USER_TYPES.VERIFIED_SELLER_WITH_PRODUCTS,
    name: 'Budi Santoso',
    email: 'budi.summarecon@marketplace.test',
    phone: '081200000102',
    businessName: 'Kue Kering Budi',
    businessType: 'micro',
    description: 'Aneka kue kering homemade untuk lebaran dan hampers. Tanpa pengawet, bahan premium.',
    locationKey: 'summarecon',
    isVerified: true,
    isActive: true,
    rating: 4.9,
    totalReviews: 89,
    isMember: true,
    membershipStatus: 'active',
    memberSince: randomDate(200),
    memberExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    productCount: { min: 10, max: 20 },
    categories: ['Kue & Snack'],
  },
  
  // Type 2: Verified sellers with empty storefronts (BINUS area)
  {
    type: USER_TYPES.VERIFIED_SELLER_EMPTY,
    name: 'Farhan Alif',
    email: 'farhan.binus@marketplace.test',
    phone: '081200000201',
    businessName: 'Student Food Corner',
    businessType: 'micro',
    description: 'Makanan mahasiswa dengan harga terjangkau. Coming soon with full menu!',
    locationKey: 'binus',
    isVerified: true,
    isActive: true,
    rating: 0,
    totalReviews: 0,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 0, max: 0 },
    categories: [],
  },
  {
    type: USER_TYPES.VERIFIED_SELLER_EMPTY,
    name: 'Dina Marlina',
    email: 'dina.binus@marketplace.test',
    phone: '081200000202',
    businessName: 'Dina Craft Studio',
    businessType: 'micro',
    description: 'Kerajinan tangan unik dan personalized gifts. Sedang menyiapkan koleksi terbaru.',
    locationKey: 'binus',
    isVerified: true,
    isActive: true,
    rating: 0,
    totalReviews: 0,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 0, max: 0 },
    categories: [],
  },
  
  // Type 3: New sellers with few products (Harapan Indah)
  {
    type: USER_TYPES.NEW_SELLER_FEW_PRODUCTS,
    name: 'Agus Wijaya',
    email: 'agus.harapan@marketplace.test',
    phone: '081200000301',
    businessName: 'Sayur Segar Agus',
    businessType: 'micro',
    description: 'Menjual sayur dan buah segar setiap hari. Dari petani lokal ke rumah Anda.',
    locationKey: 'harapanIndah',
    isVerified: false,
    isActive: true,
    rating: 4.2,
    totalReviews: 12,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 3, max: 6 },
    categories: ['Sayur & Buah'],
  },
  {
    type: USER_TYPES.NEW_SELLER_FEW_PRODUCTS,
    name: 'Maya Sari',
    email: 'maya.harapan@marketplace.test',
    phone: '081200000302',
    businessName: 'Maya Coffee House',
    businessType: 'micro',
    description: 'Kopi lokal Indonesia dengan roast profile terbaik. Bisa grinding sesuai kebutuhan.',
    locationKey: 'harapanIndah',
    isVerified: false,
    isActive: true,
    rating: 4.5,
    totalReviews: 8,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 4, max: 8 },
    categories: ['Minuman'],
  },
  
  // Type 4: Unverified sellers (Grand Wisata)
  {
    type: USER_TYPES.UNVERIFIED_SELLER,
    name: 'Hendra Kurniawan',
    email: 'hendra.wisata@marketplace.test',
    phone: '081200000401',
    businessName: 'Snack Box Hendra',
    businessType: 'micro',
    description: 'Snack box untuk acara kantor dan arisan. Harga mulai 15rb per box.',
    locationKey: 'grandWisata',
    isVerified: false,
    isActive: true,
    rating: 3.8,
    totalReviews: 5,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 5, max: 10 },
    categories: ['Kue & Snack'],
  },
  
  // Type 5: Incomplete business registrations (Cibubur)
  {
    type: USER_TYPES.INCOMPLETE_BUSINESS,
    name: 'Sinta Dewi',
    email: 'sinta.cibubur@marketplace.test',
    phone: '081200000501',
    businessName: 'Sinta Fashion',
    businessType: 'small',
    description: '', // Empty - incomplete
    locationKey: 'cibubur',
    isVerified: false,
    isActive: false,
    rating: 0,
    totalReviews: 0,
    isMember: false,
    membershipStatus: 'none',
    productCount: { min: 0, max: 0 },
    categories: [],
    incomplete: true,
  },
  
  // Type 6: Medium enterprise (Summarecon)
  {
    type: USER_TYPES.VERIFIED_SELLER_WITH_PRODUCTS,
    name: 'PT Rasa Nusantara',
    email: 'pt.rasa@marketplace.test',
    phone: '0218000001',
    businessName: 'Rasa Nusantara Catering',
    businessType: 'medium',
    description: 'Catering profesional untuk event corporate dan wedding. Bersertifikat halal dan ISO 22000.',
    locationKey: 'summarecon',
    isVerified: true,
    isActive: true,
    rating: 4.9,
    totalReviews: 256,
    isMember: true,
    membershipStatus: 'active',
    memberSince: randomDate(400),
    memberExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    productCount: { min: 15, max: 25 },
    categories: ['Makanan', 'Minuman', 'Kue & Snack'],
  },
];

// Buyers without businesses
const BUYER_USERS = [
  {
    name: 'Andi Wijaya',
    email: 'andi.buyer@marketplace.test',
    phone: '081300000101',
    locationKey: 'summarecon',
  },
  {
    name: 'Lisa Permata',
    email: 'lisa.buyer@marketplace.test',
    phone: '081300000102',
    locationKey: 'binus',
  },
  {
    name: 'Rudi Hartono',
    email: 'rudi.buyer@marketplace.test',
    phone: '081300000103',
    locationKey: 'harapanIndah',
  },
  {
    name: 'Nina Anggraini',
    email: 'nina.buyer@marketplace.test',
    phone: '081300000104',
    locationKey: 'grandWisata',
  },
  {
    name: 'Yusuf Ibrahim',
    email: 'yusuf.buyer@marketplace.test',
    phone: '081300000105',
    locationKey: 'cibubur',
  },
  {
    name: 'Dewi Kusuma',
    email: 'dewi.buyer@marketplace.test',
    phone: '081300000106',
    locationKey: 'summarecon',
  },
  {
    name: 'Ahmad Fauzi',
    email: 'ahmad.buyer@marketplace.test',
    phone: '081300000107',
    locationKey: 'binus',
  },
  {
    name: 'Putri Amelia',
    email: 'putri.buyer@marketplace.test',
    phone: '081300000108',
    locationKey: 'harapanIndah',
  },
];

async function seedDatabase() {
  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DEFAULT_DB_NAME);
    
    // Clear existing collections
    console.log('🧹 Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('businesses').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('chatrooms').deleteMany({});
    await db.collection('messages').deleteMany({});
    console.log('✅ Collections cleared');
    
    const users = [];
    const businesses = [];
    const products = [];
    
    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Process business users
    console.log('👥 Creating business users...');
    for (const businessUser of BUSINESS_USERS) {
      const location = LOCATIONS[businessUser.locationKey];
      const userId = new ObjectId();
      const businessId = new ObjectId();
      
      // Create business document (if not incomplete)
      let business = null;
      if (!businessUser.incomplete) {
        business = {
          _id: businessId,
          ownerId: userId,
          name: businessUser.businessName,
          description: businessUser.description,
          email: businessUser.email,
          phone: businessUser.phone,
          businessType: businessUser.businessType,
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
          location: {
            type: 'Point',
            coordinates: [jitterCoord(location.center[0]), jitterCoord(location.center[1])],
          },
          isVerified: businessUser.isVerified,
          isActive: businessUser.isActive,
          createdAt: randomDate(),
          updatedAt: new Date(),
        };
        businesses.push(business);
      }
      
      // Create user document
      const user = {
        _id: userId,
        name: businessUser.name,
        email: businessUser.email,
        password: hashedPassword,
        phone: businessUser.phone,
        isSeller: true,
        businessName: businessUser.businessName,
        businessType: businessUser.businessType,
        businessId: business ? businessId : null,
        location: {
          type: 'Point',
          coordinates: business ? business.location.coordinates : [jitterCoord(location.center[0]), jitterCoord(location.center[1])],
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
        },
        isVerified: businessUser.isVerified,
        rating: businessUser.rating,
        totalReviews: businessUser.totalReviews,
        isMember: businessUser.isMember,
        membershipStatus: businessUser.membershipStatus,
        memberSince: businessUser.memberSince,
        memberExpiry: businessUser.memberExpiry,
        createdAt: business ? business.createdAt : randomDate(),
        updatedAt: new Date(),
      };
      users.push(user);
      
      // Generate products for sellers with products
      if (business && businessUser.productCount.max > 0) {
        const productCount = Math.floor(
          Math.random() * (businessUser.productCount.max - businessUser.productCount.min + 1)
        ) + businessUser.productCount.min;
        
        for (let i = 0; i < productCount; i++) {
          const category = randomItem(businessUser.categories);
          const template = randomItem(PRODUCT_TEMPLATES[category]);
          
          products.push({
            _id: new ObjectId(),
            name: template.name,
            description: `${template.name} dari ${businessUser.businessName}. Dibuat dengan bahan berkualitas dan higienis.`,
            price: template.price + Math.floor(Math.random() * 5000),
            category: category,
            stock: Math.floor(Math.random() * 50) + 10,
            unit: 'pcs',
            images: [`https://source.unsplash.com/640x480/?${template.tags[0]},food,indonesian`],
            seller: userId,
            businessId: businessId,
            location: business.location,
            tags: template.tags,
            isAvailable: true,
            rating: 0,
            totalReviews: 0,
            createdAt: randomDate(100),
            updatedAt: new Date(),
          });
        }
      }
    }
    
    // Process buyer users (no business)
    console.log('👤 Creating buyer users...');
    for (const buyer of BUYER_USERS) {
      const location = LOCATIONS[buyer.locationKey];
      
      users.push({
        _id: new ObjectId(),
        name: buyer.name,
        email: buyer.email,
        password: hashedPassword,
        phone: buyer.phone,
        isSeller: false,
        businessName: null,
        businessType: '',
        businessId: null,
        location: {
          type: 'Point',
          coordinates: [jitterCoord(location.center[0]), jitterCoord(location.center[1])],
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
        },
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        isMember: false,
        membershipStatus: 'none',
        createdAt: randomDate(),
        updatedAt: new Date(),
      });
    }
    
    // Insert data
    console.log('💾 Inserting data...');
    await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);
    
    if (businesses.length > 0) {
      await db.collection('businesses').insertMany(businesses);
      console.log(`✅ Inserted ${businesses.length} businesses`);
    }
    
    if (products.length > 0) {
      await db.collection('products').insertMany(products);
      console.log(`✅ Inserted ${products.length} products`);
    }
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    await db.collection('businesses').createIndex({ ownerId: 1 }, { unique: true });
    await db.collection('businesses').createIndex({ isActive: 1, isVerified: 1 });
    await db.collection('products').createIndex({ businessId: 1 });
    await db.collection('products').createIndex({ seller: 1 });
    await db.collection('products').createIndex({ 'location.coordinates': '2dsphere' });
    console.log('✅ Indexes created');
    
    // Summary
    console.log('\n📊 Simulation Summary:');
    console.log('=====================');
    console.log(`Total Users: ${users.length}`);
    console.log(`  - With Business: ${users.filter(u => u.businessId).length}`);
    console.log(`  - Buyers Only: ${users.filter(u => !u.businessId).length}`);
    console.log(`Total Businesses: ${businesses.length}`);
    console.log(`  - Verified: ${businesses.filter(b => b.isVerified).length}`);
    console.log(`  - Unverified: ${businesses.filter(b => !b.isVerified).length}`);
    console.log(`  - Active: ${businesses.filter(b => b.isActive).length}`);
    console.log(`  - Inactive: ${businesses.filter(b => !b.isActive).length}`);
    console.log(`Total Products: ${products.length}`);
    console.log(`  - From Verified Sellers: ${products.filter(p => {
      const b = businesses.find(b => b._id.equals(p.businessId));
      return b && b.isVerified;
    }).length}`);
    console.log('=====================\n');
    
    console.log('✅ Seeding completed successfully!');
    console.log('\n🔑 Default login credentials:');
    console.log('  Email: (any email from the list above)');
    console.log('  Password: test123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeder
seedDatabase();