#!/usr/bin/env node

/**
 * Business Simulation Seed for Backend
 * Creates realistic user/business/product data with proper category matching:
 * - Each business specializes in specific product categories
 * - Products are categorized based on business type
 * - All products are attached to valid stores with proper business names
 * - No product has empty seller/business names
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

// Helper to get random int within range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// PRODUCT CATEGORIES WITH BUSINESS MATCHING
// Categories use IDs that match frontend expectations
// ============================================

const PRODUCT_CATEGORIES = {
  'food': {
    name: 'Makanan',
    tags: ['makanan', 'indonesian', 'tradisional'],
    templates: [
      { name: 'Nasi Goreng Special', price: 25000, tags: ['nasi-goreng', 'pedas', 'ayam'] },
      { name: 'Mie Ayam Bakso', price: 22000, tags: ['mie', 'ayam', 'bakso', 'kuah'] },
      { name: 'Sate Ayam 10 Tusuk', price: 30000, tags: ['sate', 'ayam', 'kacang', 'bakar'] },
      { name: 'Rendang Daging 250gr', price: 55000, tags: ['rendang', 'daging', 'padang', 'pedas'] },
      { name: 'Gado-Gado Komplit', price: 20000, tags: ['gado-gado', 'sayur', 'kacang', 'sehat'] },
      { name: 'Ayam Penyet Sambal Ijo', price: 28000, tags: ['ayam', 'penyet', 'sambal', 'pedas'] },
      { name: 'Bakso Malang Jumbo', price: 35000, tags: ['bakso', 'malang', 'mie', 'kuah'] },
      { name: 'Nasi Uduk Komplit', price: 18000, tags: ['nasi-uduk', 'ayam', 'sambal', 'pagi'] },
      { name: 'Soto Ayam Bening', price: 22000, tags: ['soto', 'ayam', 'kuah', 'segar'] },
      { name: 'Nasi Padang Paket', price: 35000, tags: ['padang', 'rendang', 'sambal', 'komplit'] },
      { name: 'Mie Goreng Seafood', price: 32000, tags: ['mie', 'seafood', 'goreng', 'pedas'] },
      { name: 'Ayam Goreng Kremes', price: 26000, tags: ['ayam', 'goreng', 'kremes', 'renyah'] },
    ]
  },
  'beverages': {
    name: 'Minuman',
    tags: ['minuman', 'kopi', 'teh', 'segar'],
    templates: [
      { name: 'Kopi Susu Gula Aren', price: 18000, tags: ['kopi', 'susu', 'gula-aren', 'segar'] },
      { name: 'Es Teh Lemon', price: 12000, tags: ['teh', 'lemon', 'es', 'segar'] },
      { name: 'Jus Alpukat', price: 20000, tags: ['jus', 'alpukat', 'susu', 'sehat'] },
      { name: 'Bandrek Jahe', price: 15000, tags: ['bandrek', 'jahe', 'susu', 'hangat'] },
      { name: 'Es Cendol Dawet', price: 15000, tags: ['cendol', 'dawet', 'santan', 'gula-merah'] },
      { name: 'Thai Tea', price: 18000, tags: ['thai-tea', 'susu', 'es', 'manis'] },
      { name: 'Kopi Hitam Tubruk', price: 12000, tags: ['kopi', 'hitam', 'tubruk', 'strong'] },
      { name: 'Susu Jahe Merah', price: 16000, tags: ['susu', 'jahe', 'hangat', 'sehat'] },
      { name: 'Matcha Latte', price: 24000, tags: ['matcha', 'latte', 'green-tea', 'creamy'] },
      { name: 'Es Kopi Susu', price: 16000, tags: ['kopi', 'es', 'susu', 'segar'] },
      { name: 'Lemon Tea', price: 14000, tags: ['lemon', 'tea', 'segar', 'vitamin-c'] },
      { name: 'Milkshake Cokelat', price: 22000, tags: ['milkshake', 'cokelat', 'creamy', 'manis'] },
    ]
  },
  'snacks': {
    name: 'Kue & Snack',
    tags: ['kue', 'snack', 'camilan', 'manis'],
    templates: [
      { name: 'Brownies Cokelat', price: 45000, tags: ['brownies', 'cokelat', 'manis', 'kue'] },
      { name: 'Kue Lapis Legit', price: 85000, tags: ['lapis-legit', 'butter', 'premium', 'kue'] },
      { name: 'Pisang Cokelat Crispy', price: 20000, tags: ['pisang', 'cokelat', 'crispy', 'snack'] },
      { name: 'Donat Kentang 6pcs', price: 30000, tags: ['donat', 'kentang', 'manis', 'snack'] },
      { name: 'Cromboloni Matcha', price: 25000, tags: ['cromboloni', 'matcha', 'viral', 'snack'] },
      { name: 'Kue Cubit Topping', price: 15000, tags: ['kue-cubit', 'mini', 'manis', 'snack'] },
      { name: 'Bolu Pandan Keju', price: 60000, tags: ['bolu', 'pandan', 'keju', 'kue'] },
      { name: 'Risoles Mayo 5pcs', price: 25000, tags: ['risoles', 'mayo', 'snack', 'goreng'] },
      { name: 'Lumpia Semarang', price: 35000, tags: ['lumpia', 'semarang', 'rebung', 'khas'] },
      { name: 'Kue Nastar 500gr', price: 75000, tags: ['nastar', 'nanas', 'kue-kering', 'lebaran'] },
      { name: 'Kastengel 250gr', price: 55000, tags: ['kastengel', 'keju', 'kue-kering', 'premium'] },
      { name: 'Putri Salju 500gr', price: 60000, tags: ['putri-salju', 'kue-kering', 'mentega', 'lebaran'] },
    ]
  },
  'agriculture': {
    name: 'Sayur & Buah',
    tags: ['sayur', 'buah', 'segar', 'organik'],
    templates: [
      { name: 'Paket Sayur Seminggu', price: 75000, tags: ['sayur', 'paket', 'segar', 'organik'] },
      { name: 'Buah Segar Mix 2kg', price: 65000, tags: ['buah', 'mix', 'segar', 'vitamin'] },
      { name: 'Selada Hydroponik 250gr', price: 12000, tags: ['selada', 'hydroponik', 'segar', 'salad'] },
      { name: 'Bayam Organik 500gr', price: 15000, tags: ['bayam', 'organik', 'sehat', 'sayur'] },
      { name: 'Paket Smoothie Buah', price: 45000, tags: ['buah', 'smoothie', 'sehat', 'paket'] },
      { name: 'Tomat Cherry 500gr', price: 20000, tags: ['tomat', 'cherry', 'segar', 'snack'] },
      { name: 'Paket Bumbu Dapur', price: 35000, tags: ['bumbu', 'dapur', 'rempah', 'masak'] },
      { name: 'Kentang Rendang 1kg', price: 18000, tags: ['kentang', 'import', 'goreng', 'rebus'] },
      { name: 'Wortel Organik 500gr', price: 12000, tags: ['wortel', 'organik', 'vitamin-a', 'sayur'] },
      { name: 'Apel Fuji 1kg', price: 35000, tags: ['apel', 'fuji', 'segar', 'buah'] },
      { name: 'Jeruk Mandarin 1kg', price: 28000, tags: ['jeruk', 'mandarin', 'vitamin-c', 'segar'] },
      { name: 'Paket Salad Sayur', price: 25000, tags: ['salad', 'sayur', 'sehat', 'diet'] },
    ]
  },
  'handicrafts': {
    name: 'Kerajinan',
    tags: ['kerajinan', 'handmade', 'dekorasi', 'lokal'],
    templates: [
      { name: 'Tas Rotan Handmade', price: 150000, tags: ['tas', 'rotan', 'handmade', 'fashion'] },
      { name: 'Vas Bunga Anyaman', price: 75000, tags: ['vas', 'anyaman', 'bambu', 'dekorasi'] },
      { name: 'Lampu Hias Gantung', price: 120000, tags: ['lampu', 'hias', 'gantung', 'dekorasi'] },
      { name: 'Tatakan Gelas Batik', price: 45000, tags: ['tatakan', 'batik', 'kain', 'meja'] },
      { name: 'Hiasan Dinding Kayu', price: 95000, tags: ['hiasan', 'dinding', 'kayu', 'ukiran'] },
      { name: 'Keranjang Anyam Set', price: 85000, tags: ['keranjang', 'anyam', 'set', 'organizer'] },
      { name: 'Gantungan Kunci Ukir', price: 25000, tags: ['gantungan', 'kunci', 'ukiran', 'souvenir'] },
      { name: 'Cermin Hias Rotan', price: 110000, tags: ['cermin', 'hias', 'rotan', 'dekorasi'] },
      { name: 'Gelas Anyaman Bambu', price: 35000, tags: ['gelas', 'bambu', 'anyaman', 'eco-friendly'] },
      { name: 'Tote Bag Kanvas Custom', price: 55000, tags: ['tote-bag', 'kanvas', 'custom', 'fashion'] },
      { name: 'Kalung Kayu Ukir', price: 45000, tags: ['kalung', 'kayu', 'ukiran', 'aksesoris'] },
      { name: 'Tempat Tisu Rotan', price: 65000, tags: ['tempat-tisu', 'rotan', 'dekorasi', 'meja'] },
    ]
  },
  'fashion': {
    name: 'Fashion',
    tags: ['fashion', 'pakaian', 'lokal', 'modern'],
    templates: [
      { name: 'Kaos Polos Katun Premium', price: 85000, tags: ['kaos', 'katun', 'polos', 'premium'] },
      { name: 'Kemeja Batik Modern', price: 195000, tags: ['kemeja', 'batik', 'modern', 'formal'] },
      { name: 'Hoodie Oversize', price: 175000, tags: ['hoodie', 'oversize', 'sweater', 'casual'] },
      { name: 'Rok Panjang Plisket', price: 125000, tags: ['rok', 'plisket', 'panjang', 'elegant'] },
      { name: 'Blouse Katun Rayon', price: 145000, tags: ['blouse', 'katun', 'rayon', 'wanita'] },
      { name: 'Celana Kulot Highwaist', price: 135000, tags: ['celana', 'kulot', 'highwaist', 'casual'] },
      { name: 'Topi Bucket Hat', price: 65000, tags: ['topi', 'bucket', 'hat', 'casual'] },
      { name: 'Scarf Silk Premium', price: 95000, tags: ['scarf', 'silk', 'premium', 'aksesoris'] },
      { name: 'Sandal Slide Comfy', price: 75000, tags: ['sandal', 'slide', 'comfy', 'casual'] },
      { name: 'Tas Selempang Mini', price: 115000, tags: ['tas', 'selempang', 'mini', 'fashion'] },
      { name: 'Dress Midi Floral', price: 225000, tags: ['dress', 'midi', 'floral', 'elegant'] },
      { name: 'Cardigan Rajut Halus', price: 165000, tags: ['cardigan', 'rajut', 'halus', 'cozy'] },
    ]
  },
  'beauty': {
    name: 'Kecantikan',
    tags: ['kecantikan', 'skincare', 'kosmetik', 'alami'],
    templates: [
      { name: 'Face Wash Aloe Vera', price: 55000, tags: ['face-wash', 'aloevera', 'skincare', 'alami'] },
      { name: 'Body Scrub Coffee', price: 65000, tags: ['body-scrub', 'coffee', 'exfoliate', 'organik'] },
      { name: 'Lip Tint Natural', price: 45000, tags: ['lip-tint', 'natural', 'kosmetik', 'bibir'] },
      { name: 'Moisturizer Gel', price: 75000, tags: ['moisturizer', 'gel', 'skincare', 'hydrating'] },
      { name: 'Face Mask Sheet Set', price: 35000, tags: ['face-mask', 'sheet', 'set', 'skincare'] },
      { name: 'Body Lotion Whitening', price: 48000, tags: ['body-lotion', 'whitening', 'kulit', 'lembut'] },
      { name: 'Sunscreen SPF 50', price: 85000, tags: ['sunscreen', 'spf50', 'protection', 'skincare'] },
      { name: 'Hand Cream Set', price: 38000, tags: ['hand-cream', 'set', 'lembut', 'tangan'] },
      { name: 'Essential Oil Lavender', price: 95000, tags: ['essential-oil', 'lavender', 'aromaterapi', 'relax'] },
      { name: 'Toner Rose Water', price: 52000, tags: ['toner', 'rose-water', 'natural', 'skincare'] },
      { name: 'Serum Vitamin C', price: 125000, tags: ['serum', 'vitamin-c', 'brightening', 'skincare'] },
      { name: 'Sabun Madu Herbal', price: 28000, tags: ['sabun', 'madu', 'herbal', 'alami'] },
    ]
  },
  'home': {
    name: 'Rumah Tangga',
    tags: ['rumah-tangga', 'perlengkapan', 'dapur', 'dekorasi'],
    templates: [
      { name: 'Set Peralatan Makan', price: 125000, tags: ['peralatan-makan', 'set', 'dapur', 'makan'] },
      { name: 'Lilin Aromaterapi', price: 45000, tags: ['lilin', 'aromaterapi', 'wangi', 'relaksasi'] },
      { name: 'Keset Kaki Microfiber', price: 35000, tags: ['keset', 'kaki', 'microfiber', 'kamar-mandi'] },
      { name: 'Gorden Blackout', price: 175000, tags: ['gorden', 'blackout', 'jendela', 'dekorasi'] },
      { name: 'Rak Dinding Minimalis', price: 95000, tags: ['rak', 'dinding', 'minimalis', 'dekorasi'] },
      { name: 'Jam Dinding Kayu', price: 85000, tags: ['jam', 'dinding', 'kayu', 'ukiran'] },
      { name: 'Lampu Meja LED', price: 65000, tags: ['lampu', 'meja', 'led', 'baca'] },
      { name: 'Kotak Penyimpanan', price: 55000, tags: ['kotak', 'penyimpanan', 'organizer', 'rumah'] },
      { name: 'Sprei Katun', price: 145000, tags: ['sprei', 'katun', 'kasur', 'tidur'] },
      { name: 'Bantal Sofa Decor', price: 45000, tags: ['bantal', 'sofa', 'dekorasi', 'ruang-tamu'] },
      { name: 'Tempat Sampah Minimalis', price: 75000, tags: ['tempat-sampah', 'minimalis', 'rumah', 'kebersihan'] },
      { name: 'Gantungan Kunci Dinding', price: 35000, tags: ['gantungan', 'kunci', 'dinding', 'organizer'] },
    ]
  },
  'electronics': {
    name: 'Elektronik',
    tags: ['elektronik', 'gadget', 'teknologi', 'digital'],
    templates: [
      { name: 'Powerbank 20000mAh', price: 185000, tags: ['powerbank', 'charger', 'portable', 'hp'] },
      { name: 'Earphone Wireless', price: 145000, tags: ['earphone', 'wireless', 'bluetooth', 'audio'] },
      { name: 'Kabel Charger Fast', price: 45000, tags: ['kabel', 'charger', 'fast-charging', 'data'] },
      { name: 'Holder HP Mobil', price: 65000, tags: ['holder', 'hp', 'mobil', 'dashboard'] },
      { name: 'Lampu LED USB', price: 35000, tags: ['lampu', 'led', 'usb', 'portable'] },
      { name: 'Speaker Mini Bluetooth', price: 95000, tags: ['speaker', 'bluetooth', 'mini', 'portable'] },
      { name: 'Mouse Wireless', price: 75000, tags: ['mouse', 'wireless', 'komputer', 'laptop'] },
      { name: 'Webcam HD 1080p', price: 225000, tags: ['webcam', 'hd', 'streaming', 'meeting'] },
      { name: 'Keyboard Mini', price: 125000, tags: ['keyboard', 'mini', 'portable', 'tablet'] },
      { name: 'USB Hub 4 Port', price: 85000, tags: ['usb', 'hub', 'port', 'expander'] },
      { name: 'Ring Light 8 Inch', price: 115000, tags: ['ring-light', 'foto', 'video', 'streaming'] },
      { name: 'Tripod HP Mini', price: 55000, tags: ['tripod', 'hp', 'mini', 'foto'] },
    ]
  },
  'services': {
    name: 'Jasa',
    tags: ['jasa', 'layanan', 'service', 'digital'],
    templates: [
      { name: 'Desain Logo Bisnis', price: 250000, tags: ['desain', 'logo', 'bisnis', 'branding'] },
      { name: 'Jasa Foto Produk', price: 350000, tags: ['foto', 'produk', 'photography', 'commercial'] },
      { name: 'Edit Video 1 Menit', price: 185000, tags: ['edit', 'video', 'promosi', 'iklan'] },
      { name: 'Konten Media Sosial', price: 150000, tags: ['konten', 'sosial-media', 'desain', 'posting'] },
      { name: 'Jasa Tulis Konten', price: 95000, tags: ['tulis', 'konten', 'artikel', 'blog'] },
      { name: 'Desain Kartu Nama', price: 75000, tags: ['desain', 'kartu-nama', 'printing', 'branding'] },
      { name: 'Setup Toko Online', price: 450000, tags: ['setup', 'toko-online', 'ecommerce', 'marketplace'] },
      { name: 'Konsultasi Bisnis', price: 200000, tags: ['konsultasi', 'bisnis', 'umkm', 'strategi'] },
    ]
  }
};

// ============================================
// BUSINESS DEFINITIONS - Categorized by type
// ============================================

const BUSINESS_DEFINITIONS = [
  // FOOD BUSINESSES
  {
    name: 'Dapur Summarecon',
    ownerName: 'Rani Pratama',
    email: 'rani.summarecon@marketplace.test',
    phone: '081200000101',
    businessType: 'small',
    description: 'Spesialis masakan rumahan dengan bahan segar dan berkualitas. Melayani pesanan katering dan makan siang kantoran.',
    locationKey: 'summarecon',
    categories: ['food', 'beverages'],
    productCount: { min: 12, max: 20 },
    isVerified: true,
    rating: 4.8,
    totalReviews: 134,
    isMember: true,
  },
  {
    name: 'Warung Nusantara',
    ownerName: 'Pak Surya',
    email: 'surya.warung@marketplace.test',
    phone: '081200000102',
    businessType: 'micro',
    description: 'Aneka masakan tradisional Nusantara dengan resep turun-temurun. Tersedia nasi box dan katering.',
    locationKey: 'harapanIndah',
    categories: ['food'],
    productCount: { min: 8, max: 15 },
    isVerified: true,
    rating: 4.6,
    totalReviews: 78,
    isMember: false,
  },
  {
    name: 'Soto & Bakso Pak Joko',
    ownerName: 'Joko Santoso',
    email: 'joko.soto@marketplace.test',
    phone: '081200000103',
    businessType: 'micro',
    description: 'Soto ayam bening dan bakso daging sapi asli. Kuah kaldu homemade tanpa pengawet.',
    locationKey: 'grandWisata',
    categories: ['food', 'beverages'],
    productCount: { min: 6, max: 12 },
    isVerified: false,
    rating: 4.4,
    totalReviews: 45,
    isMember: false,
  },
  {
    name: 'Nasi Padang Bu Ani',
    ownerName: 'Ani Wijaya',
    email: 'ani.padang@marketplace.test',
    phone: '081200000104',
    businessType: 'small',
    description: 'Nasi Padang autentik dengan aneka lauk pauk. Rendang, dendeng, dan gulai khas Minang.',
    locationKey: 'cibubur',
    categories: ['food'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.9,
    totalReviews: 156,
    isMember: true,
  },

  // BEVERAGE BUSINESSES
  {
    name: 'Kopi Kita',
    ownerName: 'Budi Kopi',
    email: 'budi.kopi@marketplace.test',
    phone: '081200000201',
    businessType: 'micro',
    description: 'Kopi lokal Indonesia dari berbagai daerah. Single origin dan blend dengan roast profile terbaik.',
    locationKey: 'summarecon',
    categories: ['beverages'],
    productCount: { min: 10, max: 16 },
    isVerified: true,
    rating: 4.7,
    totalReviews: 92,
    isMember: true,
  },
  {
    name: 'Es Teh Manis Bu Dewi',
    ownerName: 'Dewi Sari',
    email: 'dewi.esteh@marketplace.test',
    phone: '081200000202',
    businessType: 'micro',
    description: 'Aneka minuman segar dan sehat. Es teh variasi, jus buah segar, dan minuman herbal.',
    locationKey: 'binus',
    categories: ['beverages'],
    productCount: { min: 8, max: 14 },
    isVerified: true,
    rating: 4.5,
    totalReviews: 67,
    isMember: false,
  },
  {
    name: 'Kedai Kopi Senja',
    ownerName: 'Ahmad Rizal',
    email: 'rizal.kedai@marketplace.test',
    phone: '081200000203',
    businessType: 'small',
    description: 'Kopi susu gula aren dan aneka kopi susu modern. Biji kopi pilihan dari petani lokal.',
    locationKey: 'harapanIndah',
    categories: ['beverages', 'snacks'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.8,
    totalReviews: 112,
    isMember: true,
  },

  // BAKERY & SNACK BUSINESSES
  {
    name: 'Kue Kering Budi',
    ownerName: 'Budi Santoso',
    email: 'budi.kue@marketplace.test',
    phone: '081200000301',
    businessType: 'micro',
    description: 'Aneka kue kering homemade untuk lebaran dan hampers. Tanpa pengawet, bahan premium.',
    locationKey: 'summarecon',
    categories: ['snacks'],
    productCount: { min: 12, max: 22 },
    isVerified: true,
    rating: 4.9,
    totalReviews: 189,
    isMember: true,
  },
  {
    name: 'Brownies & Co',
    ownerName: 'Maya Brownies',
    email: 'maya.brownies@marketplace.test',
    phone: '081200000302',
    businessType: 'small',
    description: 'Spesialis brownies premium dengan berbagai topping. Fudge brownies, cream cheese, dan matcha.',
    locationKey: 'binus',
    categories: ['snacks'],
    productCount: { min: 8, max: 15 },
    isVerified: true,
    rating: 4.7,
    totalReviews: 134,
    isMember: true,
  },
  {
    name: 'Donat Kentang Madu',
    ownerName: 'Siti Aminah',
    email: 'siti.donat@marketplace.test',
    phone: '081200000303',
    businessType: 'micro',
    description: 'Donat kentang empuk dengan berbagai glaze. Fresh baked setiap hari.',
    locationKey: 'grandWisata',
    categories: ['snacks'],
    productCount: { min: 6, max: 12 },
    isVerified: false,
    rating: 4.3,
    totalReviews: 38,
    isMember: false,
  },

  // FRESH PRODUCE BUSINESSES (agriculture)
  {
    name: 'Sayur Segar Agus',
    ownerName: 'Agus Wijaya',
    email: 'agus.sayur@marketplace.test',
    phone: '081200000401',
    businessType: 'micro',
    description: 'Menjual sayur dan buah segar setiap hari. Dari petani lokal ke rumah Anda.',
    locationKey: 'harapanIndah',
    categories: ['agriculture'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.6,
    totalReviews: 89,
    isMember: false,
  },
  {
    name: 'Buah Segar Bekasi',
    ownerName: 'Rina Buah',
    email: 'rina.buah@marketplace.test',
    phone: '081200000402',
    businessType: 'small',
    description: 'Paket buah segar untuk diet dan smoothie. Delivery setiap pagi.',
    locationKey: 'cibubur',
    categories: ['agriculture'],
    productCount: { min: 8, max: 16 },
    isVerified: true,
    rating: 4.8,
    totalReviews: 156,
    isMember: true,
  },
  {
    name: 'Organik Hydroponik',
    ownerName: 'Doni Tanaman',
    email: 'doni.organic@marketplace.test',
    phone: '081200000403',
    businessType: 'micro',
    description: 'Sayur hidroponik organik tanpa pestisida. Selada, bayam, dan kale segar.',
    locationKey: 'summarecon',
    categories: ['agriculture'],
    productCount: { min: 6, max: 12 },
    isVerified: false,
    rating: 4.5,
    totalReviews: 42,
    isMember: false,
  },

  // HANDICRAFT BUSINESSES
  {
    name: 'Anyaman Lokal',
    ownerName: 'Dina Marlina',
    email: 'dina.anyaman@marketplace.test',
    phone: '081200000501',
    businessType: 'micro',
    description: 'Kerajinan tangan anyaman rotan dan bambu. Tas, keranjang, dan hiasan rumah.',
    locationKey: 'binus',
    categories: ['handicrafts'],
    productCount: { min: 8, max: 16 },
    isVerified: true,
    rating: 4.7,
    totalReviews: 67,
    isMember: false,
  },
  {
    name: 'Kerajinan Kayu Jati',
    ownerName: 'Pak Harto',
    email: 'harto.kayu@marketplace.test',
    phone: '081200000502',
    businessType: 'small',
    description: 'Hiasan dinding dan furniture mini dari kayu jati. Ukiran tradisional Jawa.',
    locationKey: 'grandWisata',
    categories: ['handicrafts'],
    productCount: { min: 6, max: 14 },
    isVerified: true,
    rating: 4.8,
    totalReviews: 98,
    isMember: true,
  },

  // FASHION BUSINESSES
  {
    name: 'Batik Modern Indah',
    ownerName: 'Indah Batik',
    email: 'indah.batik@marketplace.test',
    phone: '081200000601',
    businessType: 'small',
    description: 'Batik kontemporer dengan motif modern. Kemeja, dress, dan aksesoris batik.',
    locationKey: 'summarecon',
    categories: ['fashion'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.6,
    totalReviews: 124,
    isMember: true,
  },
  {
    name: 'Kaos Polos Premium',
    ownerName: 'Rudi Kaos',
    email: 'rudi.kaos@marketplace.test',
    phone: '081200000602',
    businessType: 'micro',
    description: 'Kaos polos katun combed 30s. Tersedia berbagai warna dan ukuran.',
    locationKey: 'harapanIndah',
    categories: ['fashion'],
    productCount: { min: 8, max: 14 },
    isVerified: false,
    rating: 4.4,
    totalReviews: 56,
    isMember: false,
  },
  {
    name: 'Hijab Syar\'i Gallery',
    ownerName: 'Aisyah Hijab',
    email: 'aisyah.hijab@marketplace.test',
    phone: '081200000603',
    businessType: 'small',
    description: 'Hijab syar\'i berkualitas dengan bahan premium. Segiempat dan pashmina.',
    locationKey: 'cibubur',
    categories: ['fashion'],
    productCount: { min: 12, max: 20 },
    isVerified: true,
    rating: 4.9,
    totalReviews: 178,
    isMember: true,
  },

  // BEAUTY BUSINESSES
  {
    name: 'Skincare Alami',
    ownerName: 'Lina Skincare',
    email: 'lina.skincare@marketplace.test',
    phone: '081200000701',
    businessType: 'micro',
    description: 'Skincare dari bahan alami dan organik. Aman untuk kulit sensitif.',
    locationKey: 'summarecon',
    categories: ['beauty'],
    productCount: { min: 8, max: 16 },
    isVerified: true,
    rating: 4.7,
    totalReviews: 145,
    isMember: true,
  },
  {
    name: 'Aromaterapi Nusantara',
    ownerName: 'Yuni Aroma',
    email: 'yuni.aroma@marketplace.test',
    phone: '081200000702',
    businessType: 'micro',
    description: 'Essential oil dan aromaterapi alami. Minyak esensial lokal Indonesia.',
    locationKey: 'binus',
    categories: ['beauty'],
    productCount: { min: 6, max: 12 },
    isVerified: false,
    rating: 4.5,
    totalReviews: 34,
    isMember: false,
  },

  // HOME GOODS BUSINESSES
  {
    name: 'Perlengkapan Rumah Modern',
    ownerName: 'Budi Home',
    email: 'budi.home@marketplace.test',
    phone: '081200000801',
    businessType: 'small',
    description: 'Peralatan rumah tangga modern dan minimalis. Perlengkapan dapur, kamar tidur, dan dekorasi.',
    locationKey: 'summarecon',
    categories: ['home'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.6,
    totalReviews: 87,
    isMember: true,
  },
  {
    name: 'Dekorasi Rumah Unik',
    ownerName: 'Sari Decor',
    email: 'sari.decor@marketplace.test',
    phone: '081200000802',
    businessType: 'micro',
    description: 'Dekorasi rumah unik dan handmade. Hiasan dinding, lilin aromaterapi, dan pernak-pernik.',
    locationKey: 'harapanIndah',
    categories: ['home', 'handicrafts'],
    productCount: { min: 8, max: 15 },
    isVerified: false,
    rating: 4.4,
    totalReviews: 52,
    isMember: false,
  },

  // ELECTRONICS BUSINESSES
  {
    name: 'Gadget & Accessories',
    ownerName: 'Tech Shop',
    email: 'tech.gadget@marketplace.test',
    phone: '081200000901',
    businessType: 'small',
    description: 'Aksesoris gadget dan elektronik. Powerbank, kabel charger, earphone, dan holder.',
    locationKey: 'binus',
    categories: ['electronics'],
    productCount: { min: 10, max: 18 },
    isVerified: true,
    rating: 4.5,
    totalReviews: 134,
    isMember: true,
  },
  {
    name: 'Elektronik Rumah Tangga',
    ownerName: 'Andi Elektronik',
    email: 'andi.elektronik@marketplace.test',
    phone: '081200000902',
    businessType: 'micro',
    description: 'Elektronik rumah tangga mini. Lampu LED, kipas portable, dan charger.',
    locationKey: 'grandWisata',
    categories: ['electronics'],
    productCount: { min: 6, max: 12 },
    isVerified: false,
    rating: 4.2,
    totalReviews: 45,
    isMember: false,
  },

  // SERVICES BUSINESSES
  {
    name: 'Desain Kreatif Studio',
    ownerName: 'Rina Design',
    email: 'rina.design@marketplace.test',
    phone: '081200001001',
    businessType: 'micro',
    description: 'Jasa desain grafis, logo, dan konten media sosial. Bantu tingkatkan branding bisnis Anda.',
    locationKey: 'summarecon',
    categories: ['services'],
    productCount: { min: 6, max: 10 },
    isVerified: true,
    rating: 4.8,
    totalReviews: 76,
    isMember: true,
  },
  {
    name: 'Digital Marketing Hub',
    ownerName: 'Dodi Marketing',
    email: 'dodi.marketing@marketplace.test',
    phone: '081200001002',
    businessType: 'small',
    description: 'Konsultasi bisnis UMKM dan digital marketing. Setup toko online dan strategi pemasaran.',
    locationKey: 'cibubur',
    categories: ['services'],
    productCount: { min: 4, max: 8 },
    isVerified: true,
    rating: 4.6,
    totalReviews: 58,
    isMember: true,
  },

  // CATERING / MEDIUM ENTERPRISE
  {
    name: 'Rasa Nusantara Catering',
    ownerName: 'PT Rasa Nusantara',
    email: 'pt.rasa@marketplace.test',
    phone: '0218000001',
    businessType: 'medium',
    description: 'Catering profesional untuk event corporate dan wedding. Bersertifikat halal dan ISO 22000.',
    locationKey: 'summarecon',
    categories: ['food', 'beverages', 'snacks'],
    productCount: { min: 20, max: 35 },
    isVerified: true,
    rating: 4.9,
    totalReviews: 256,
    isMember: true,
  },

  // MIXED CATEGORY BUSINESSES
  {
    name: 'Snack Box & Katering',
    ownerName: 'Hendra Kurniawan',
    email: 'hendra.snackbox@marketplace.test',
    phone: '081200001101',
    businessType: 'micro',
    description: 'Snack box untuk acara kantor dan arisan. Harga mulai 15rb per box.',
    locationKey: 'grandWisata',
    categories: ['snacks', 'food'],
    productCount: { min: 8, max: 16 },
    isVerified: false,
    rating: 4.2,
    totalReviews: 28,
    isMember: false,
  },
  {
    name: 'Market Fresh & Co',
    ownerName: 'Sinta Market',
    email: 'sinta.market@marketplace.test',
    phone: '081200001102',
    businessType: 'small',
    description: 'Paket sayur, buah, dan bumbu dapur segar. Delivery harian.',
    locationKey: 'cibubur',
    categories: ['agriculture', 'food'],
    productCount: { min: 12, max: 22 },
    isVerified: true,
    rating: 4.7,
    totalReviews: 167,
    isMember: true,
  },
];

// Buyers without businesses
const BUYER_USERS = [
  { name: 'Andi Wijaya', email: 'andi.buyer@marketplace.test', phone: '081300000101', locationKey: 'summarecon' },
  { name: 'Lisa Permata', email: 'lisa.buyer@marketplace.test', phone: '081300000102', locationKey: 'binus' },
  { name: 'Rudi Hartono', email: 'rudi.buyer@marketplace.test', phone: '081300000103', locationKey: 'harapanIndah' },
  { name: 'Nina Anggraini', email: 'nina.buyer@marketplace.test', phone: '081300000104', locationKey: 'grandWisata' },
  { name: 'Yusuf Ibrahim', email: 'yusuf.buyer@marketplace.test', phone: '081300000105', locationKey: 'cibubur' },
  { name: 'Dewi Kusuma', email: 'dewi.buyer@marketplace.test', phone: '081300000106', locationKey: 'summarecon' },
  { name: 'Ahmad Fauzi', email: 'ahmad.buyer@marketplace.test', phone: '081300000107', locationKey: 'binus' },
  { name: 'Putri Amelia', email: 'putri.buyer@marketplace.test', phone: '081300000108', locationKey: 'harapanIndah' },
  { name: 'Bambang Sulistio', email: 'bambang.buyer@marketplace.test', phone: '081300000109', locationKey: 'grandWisata' },
  { name: 'Citra Lestari', email: 'citra.buyer@marketplace.test', phone: '081300000110', locationKey: 'cibubur' },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

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
    await db.collection('expenses').deleteMany({});
    console.log('✅ Collections cleared');
    
    const users = [];
    const businesses = [];
    const products = [];
    const allExpenses = [];
    const allOrders = [];
    
    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Process business users
    console.log('👥 Creating business users with categorized products...');
    
    for (const bizDef of BUSINESS_DEFINITIONS) {
      const location = LOCATIONS[bizDef.locationKey];
      const userId = new ObjectId();
      const businessId = new ObjectId();
      
      const memberSince = randomDate(400);
      const memberExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      // Create business document
      const business = {
        _id: businessId,
        ownerId: userId,
        name: bizDef.name,
        description: bizDef.description,
        email: bizDef.email,
        phone: bizDef.phone,
        businessType: bizDef.businessType,
        address: location.address,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        location: {
          type: 'Point',
          coordinates: [jitterCoord(location.center[0]), jitterCoord(location.center[1])],
        },
        isVerified: bizDef.isVerified,
        isActive: true,
        createdAt: randomDate(300),
        updatedAt: new Date(),
      };
      businesses.push(business);
      
      // Create user document
      const user = {
        _id: userId,
        name: bizDef.ownerName,
        email: bizDef.email,
        password: hashedPassword,
        phone: bizDef.phone,
        isSeller: true,
        businessName: bizDef.name,
        businessType: bizDef.businessType,
        businessId: businessId,
        location: {
          type: 'Point',
          coordinates: business.location.coordinates,
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
        },
        isVerified: bizDef.isVerified,
        rating: bizDef.rating,
        totalReviews: bizDef.totalReviews,
        isMember: bizDef.isMember,
        membershipStatus: bizDef.isMember ? 'active' : 'none',
        memberSince: bizDef.isMember ? memberSince : null,
        memberExpiry: bizDef.isMember ? memberExpiry : null,
        createdAt: business.createdAt,
        updatedAt: new Date(),
      };
      users.push(user);
      
      // Generate products for this business based on their categories
      const productCount = randomInt(bizDef.productCount.min, bizDef.productCount.max);
      const usedTemplates = new Set(); // Track used templates to avoid duplicates
      
      for (let i = 0; i < productCount; i++) {
        // Pick a category ID this business specializes in
        const categoryId = randomItem(bizDef.categories);
        const categoryData = PRODUCT_CATEGORIES[categoryId];
        
        if (!categoryData) {
          console.warn(`Warning: Category ${categoryId} not found for business ${bizDef.name}`);
          continue;
        }
        
        // Pick a template, trying to avoid duplicates
        let template;
        let attempts = 0;
        do {
          template = randomItem(categoryData.templates);
          attempts++;
        } while (usedTemplates.has(template.name) && attempts < 5);
        
        usedTemplates.add(template.name);
        
        // Generate price variation
        const priceVariation = randomInt(-3000, 5000);
        const finalPrice = Math.max(5000, template.price + priceVariation);
        
        // Generate stock
        const stock = randomInt(5, 100);
        
        // Generate rating (newer products might have fewer reviews)
        const hasReviews = Math.random() > 0.3;
        const productRating = hasReviews ? (Math.random() * 1.5 + 3.5).toFixed(1) : 0;
        const totalReviews = hasReviews ? randomInt(1, 50) : 0;
        
        products.push({
          _id: new ObjectId(),
          name: template.name,
          description: `${template.name} dari ${bizDef.name}. Dibuat dengan bahan berkualitas terbaik dan higienis. Produk ${categoryData.name} pilihan dari ${bizDef.ownerName}.`,
          price: finalPrice,
          category: categoryId, // Use category ID that matches frontend
          stock: stock,
          unit: 'pcs',
          images: [`https://source.unsplash.com/640x480/?${template.tags[0]},${categoryData.tags[0]}`],
          seller: userId,
          businessId: businessId,
          location: business.location,
          tags: [...template.tags, ...categoryData.tags.slice(0, 2)],
          isAvailable: true,
          rating: parseFloat(productRating),
          totalReviews: totalReviews,
          createdAt: randomDate(200),
          updatedAt: new Date(),
        });
      }
      
      console.log(`  ✅ ${bizDef.name} - ${productCount} ${bizDef.categories.join(', ')} products`);
    }
    
    // ============================================
    // SEED EXPENSES FOR EACH SELLER
    // ============================================
    console.log('\n💰 Creating expenses for each seller...');
    
    const EXPENSE_CATEGORIES = ['supplies', 'marketing', 'transport', 'utilities', 'rent', 'equipment'];
    const EXPENSE_TEMPLATES = {
      supplies: [
        'Bahan baku utama',
        'Kemasan dus + label',
        'Bahan setengah jadi',
        'Ingredients stock',
        'Raw materials procurement',
      ],
      marketing: [
        'Iklan Facebook Ads',
        'Promo Instagram',
        'Iklan Google',
        'Promo Tokopedia',
        'Marketing materials',
      ],
      transport: [
        'Ongkir delivery',
        'Biaya kirim produk',
        'Transportasi bahan baku',
        'Delivery costs',
        'Shipping expenses',
      ],
      utilities: [
        'Listrik bulan ini',
        'Air PDAM',
        'Internet bisnis',
        'Telepon & komunikasi',
        'Utilities monthly',
      ],
      rent: [
        'Sewa kios',
        'Sewa gudang',
        'Sewa ruko',
        'Sewa stan mall',
        'Space rental',
      ],
      equipment: [
        'Mesin kerja',
        'Alat produksi',
        'Peralatan dapur',
        'Tools & equipment',
        'Machinery maintenance',
      ],
    };
    
    for (const business of businesses) {
      const userId = business.ownerId;
      const bizName = business.name;
      
      // Generate 8-12 expenses per seller
      const numExpenses = randomInt(8, 12);
      
      // Base expense amounts by category
      const categoryBaseAmounts = {
        supplies: { min: 150000, max: 600000 },
        marketing: { min: 100000, max: 400000 },
        transport: { min: 80000, max: 300000 },
        utilities: { min: 50000, max: 150000 },
        rent: { min: 150000, max: 350000 },
        equipment: { min: 200000, max: 2500000 },
      };
      
      for (let i = 0; i < numExpenses; i++) {
        const category = randomItem(EXPENSE_CATEGORIES);
        const baseAmount = categoryBaseAmounts[category];
        const amount = randomInt(baseAmount.min, baseAmount.max);
        const template = randomItem(EXPENSE_TEMPLATES[category]);
        
        // Generate date within last 60 days
        const daysBack = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        
        const expense = {
          _id: new ObjectId(),
          userId: userId,
          localId: `EXP-${bizName.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          amount: amount,
          category: category,
          description: template,
          date: date.toISOString().split('T')[0],
          createdAt: date,
          updatedAt: new Date(),
          source: 'seed',
        };
        
        allExpenses.push(expense);
      }
    }
    
    console.log(`  ✅ Created ${allExpenses.length} expenses for ${businesses.length} sellers`);
    
    // ============================================
    // SEED ORDERS FOR EACH SELLER
    // ============================================
    console.log('\n📦 Creating orders for each seller...');
    
    const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    const DELIVERED_STATUSES = ['delivered', 'completed'];
    
    for (const business of businesses) {
      const sellerId = business.ownerId;
      const businessId = business._id;
      
      // Generate 5-15 orders per seller
      const numOrders = randomInt(5, 15);
      
      for (let i = 0; i < numOrders; i++) {
        // Random buyer (from buyer users that will be created)
        const buyerIndex = randomInt(0, BUYER_USERS.length - 1);
        const buyer = BUYER_USERS[buyerIndex];
        
        // Random products from this business's products
        const sellerProducts = products.filter(p => p.businessId.equals(businessId));
        if (sellerProducts.length === 0) continue;
        
        const orderProducts = [];
        const numProducts = randomInt(1, Math.min(3, sellerProducts.length));
        const usedProducts = new Set();
        
        for (let j = 0; j < numProducts; j++) {
          const availableProducts = sellerProducts.filter(p => !usedProducts.has(p._id.toString()));
          if (availableProducts.length === 0) break;
          
          const product = randomItem(availableProducts);
          usedProducts.add(product._id.toString());
          
          const quantity = randomInt(1, 5);
          orderProducts.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: quantity,
          });
        }
        
        if (orderProducts.length === 0) continue;
        
        const totalAmount = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const shippingFee = randomInt(5000, 25000);
        const finalTotal = totalAmount + shippingFee;
        
        // Random status - 70% delivered/completed
        const statusRoll = Math.random();
        let status;
        if (statusRoll < 0.7) {
          status = randomItem(DELIVERED_STATUSES);
        } else if (statusRoll < 0.85) {
          status = 'shipped';
        } else if (statusRoll < 0.95) {
          status = randomItem(['pending', 'confirmed', 'processing']);
        } else {
          status = 'cancelled';
        }
        
        // Generate date within last 90 days
        const daysBack = randomInt(0, 90);
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysBack);
        
        const order = {
          _id: new ObjectId(),
          orderNumber: `ORD-${String(allOrders.length + 1).padStart(5, '0')}`,
          buyer: new ObjectId(), // placeholder - will be set after buyers created
          buyerName: buyer.name,
          buyerPhone: buyer.phone,
          seller: sellerId,
          businessId: businessId,
          businessName: business.name,
          products: orderProducts,
          subtotal: totalAmount,
          shippingFee: shippingFee,
          discountAmount: 0,
          totalAmount: finalTotal,
          status: status,
          paymentMethod: randomItem(['COD', 'Transfer', 'Gopay', 'OVO', 'Dana']),
          paymentStatus: status === 'cancelled' ? 'refunded' : 'paid',
          deliveryAddress: {
            address: LOCATIONS[buyer.locationKey].address,
            city: LOCATIONS[buyer.locationKey].city,
          },
          createdAt: orderDate,
          updatedAt: orderDate,
        };
        
        allOrders.push(order);
      }
    }
    
    console.log(`  ✅ Created ${allOrders.length} orders for ${businesses.length} sellers`);
    
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
    console.log('\n💾 Inserting data into database...');
    await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${users.length} users (${users.filter(u => u.businessId).length} sellers, ${users.filter(u => !u.businessId).length} buyers)`);
    
    if (businesses.length > 0) {
      await db.collection('businesses').insertMany(businesses);
      console.log(`✅ Inserted ${businesses.length} businesses`);
    }
    
    if (products.length > 0) {
      await db.collection('products').insertMany(products);
      console.log(`✅ Inserted ${products.length} products`);
    }
    
    if (allExpenses.length > 0) {
      await db.collection('expenses').insertMany(allExpenses);
      console.log(`✅ Inserted ${allExpenses.length} expenses`);
    }
    
    if (allOrders.length > 0) {
      await db.collection('orders').insertMany(allOrders);
      console.log(`✅ Inserted ${allOrders.length} orders`);
    }
    
    // Create indexes
    console.log('\n🔍 Creating indexes...');
    await db.collection('businesses').createIndex({ ownerId: 1 }, { unique: true });
    await db.collection('businesses').createIndex({ isActive: 1, isVerified: 1 });
    await db.collection('products').createIndex({ businessId: 1 });
    await db.collection('products').createIndex({ seller: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ 'location.coordinates': '2dsphere' });
    await db.collection('expenses').createIndex({ userId: 1 });
    await db.collection('expenses').createIndex({ category: 1 });
    await db.collection('expenses').createIndex({ date: -1 });
    await db.collection('orders').createIndex({ seller: 1 });
    await db.collection('orders').createIndex({ buyer: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    console.log('✅ Indexes created');
    
    // Summary by category
    console.log('\n📊 Product Distribution by Category:');
    console.log('=====================================');
    const categoryCounts = {};
    products.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} products`);
      });
    
    // Summary
    console.log('\n📊 Simulation Summary:');
    console.log('=====================');
    console.log(`Total Users: ${users.length}`);
    console.log(`  - Sellers (with business): ${users.filter(u => u.businessId).length}`);
    console.log(`  - Buyers only: ${users.filter(u => !u.businessId).length}`);
    console.log(`Total Businesses: ${businesses.length}`);
    console.log(`  - Verified: ${businesses.filter(b => b.isVerified).length}`);
    console.log(`  - Unverified: ${businesses.filter(b => !b.isVerified).length}`);
    console.log(`Total Products: ${products.length}`);
    console.log(`  - From Verified Sellers: ${products.filter(p => {
      const b = businesses.find(b => b._id.equals(p.businessId));
      return b && b.isVerified;
    }).length}`);
    console.log(`Total Expenses: ${allExpenses.length}`);
    const totalExpenseAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    console.log(`  - Total Expense Value: Rp ${totalExpenseAmount.toLocaleString('id-ID')}`);
    console.log(`Total Orders: ${allOrders.length}`);
    const totalOrderRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    console.log(`  - Total Order Value: Rp ${totalOrderRevenue.toLocaleString('id-ID')}`);
    const completedOrders = allOrders.filter(o => o.status === 'delivered' || o.status === 'completed');
    console.log(`  - Completed/Delivered: ${completedOrders.length}`);
    console.log('=====================\n');
    
    // Verification - ensure all products have business names
    const productsWithoutBusiness = products.filter(p => !p.businessId);
    const productsWithEmptySeller = products.filter(p => {
      const business = businesses.find(b => b._id.equals(p.businessId));
      return !business || !business.name;
    });
    
    if (productsWithoutBusiness.length === 0 && productsWithEmptySeller.length === 0) {
      console.log('✅ All products are properly attached to stores with valid business names!');
    } else {
      console.log(`⚠️  Found ${productsWithoutBusiness.length} products without businessId`);
      console.log(`⚠️  Found ${productsWithEmptySeller.length} products with empty business names`);
    }
    
    console.log('✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

// Run the seed function
seedDatabase();
