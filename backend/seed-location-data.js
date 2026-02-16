#!/usr/bin/env node

/**
 * Location-Based Mock Data Seed Script
 * Creates sellers and products spread around Bekasi, Indonesia
 * to simulate realistic location-based UMKM marketplace interactions
 * 
 * Last Updated: 2026-02-02
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

// Bekasi center coordinates: 106.9896, -6.2383
// Spread sellers in a 20km radius around Bekasi

const SELLER_DATA = [
    // ============ FOOD & BEVERAGES ============
    {
        name: 'Warung Bu Dewi',
        email: 'dewi@trolitoko.com',
        phone: '081234567001',
        password: 'test123',
        businessName: 'Warung Makan Bu Dewi',
        businessType: 'micro',
        location: {
            type: 'Point',
            coordinates: [106.9896, -6.2383], // Bekasi Center
            address: 'Jl. Diponegoro No. 15',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17111'
        },
        products: [
            { name: 'Nasi Uduk Betawi', price: 18000, category: 'food', description: 'Nasi uduk khas Betawi dengan lauk lengkap: ayam goreng, tempe orek, dan sambal kacang', stock: 50 },
            { name: 'Soto Betawi', price: 28000, category: 'food', description: 'Soto Betawi kuah santan dengan daging sapi empuk dan kentang goreng', stock: 40 },
            { name: 'Ketoprak Jakarta', price: 20000, category: 'food', description: 'Ketoprak dengan tahu goreng, bihun, dan bumbu kacang spesial', stock: 45 },
            { name: 'Es Cendol Dawet', price: 12000, category: 'food', description: 'Es cendol segar dengan santan dan gula merah asli', stock: 80 }
        ]
    },
    {
        name: 'Kopi Nusantara Bekasi',
        email: 'kopi@trolitoko.com',
        phone: '081234567002',
        password: 'test123',
        businessName: 'Kopi Nusantara',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9956, -6.2290], // ~1km Northeast
            address: 'Jl. Veteran No. 88',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17112'
        },
        products: [
            { name: 'Kopi Gayo Premium', price: 85000, category: 'food', description: 'Kopi Arabika Gayo 250gr, freshly roasted, citrusy notes', stock: 60 },
            { name: 'Kopi Toraja Kalosi', price: 95000, category: 'food', description: 'Kopi Toraja Kalosi 250gr, full body dengan aroma earthy', stock: 45 },
            { name: 'Kopi Flores Bajawa', price: 78000, category: 'food', description: 'Kopi single origin Flores 250gr, chocolate and nutty flavor', stock: 50 },
            { name: 'Teh Pucuk Organik', price: 45000, category: 'food', description: 'Teh hijau pucuk organik dari Puncak 100gr', stock: 70 }
        ]
    },
    {
        name: 'Bakery Rasa Ibu',
        email: 'bakery@trolitoko.com',
        phone: '081234567003',
        password: 'test123',
        businessName: 'Rasa Ibu Bakery',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9780, -6.2450], // ~2km Southwest
            address: 'Jl. Perjuangan No. 42',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17113'
        },
        products: [
            { name: 'Kue Lapis Legit Spesial', price: 185000, category: 'food', description: 'Kue lapis legit homemade 20x20cm, resep turun temurun', stock: 15 },
            { name: 'Bika Ambon Medan', price: 65000, category: 'food', description: 'Bika Ambon asli dengan tekstur berserat sempurna', stock: 25 },
            { name: 'Nastar Premium', price: 95000, category: 'food', description: 'Nastar dengan selai nanas asli, 500gr (isi 40pcs)', stock: 30 },
            { name: 'Brownies Lumer', price: 55000, category: 'food', description: 'Brownies cokelat premium yang lumer di mulut', stock: 20 },
            { name: 'Roti Sobek Cokelat', price: 35000, category: 'food', description: 'Roti sobek lembut dengan isian cokelat melimpah', stock: 40 }
        ]
    },

    // ============ FASHION & CLOTHING ============
    {
        name: 'Batik Betawi Nusantara',
        email: 'batik@trolitoko.com',
        phone: '081234567004',
        password: 'test123',
        businessName: 'Batik Betawi Collection',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9756, -6.2189], // ~3km Northwest
            address: 'Jl. Batik Indah No. 8',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17114'
        },
        products: [
            { name: 'Batik Tulis Mega Mendung', price: 550000, category: 'clothing', description: 'Batik tulis tangan motif mega mendung Cirebon, kain katun prima', stock: 12 },
            { name: 'Kemeja Batik Pria Premium', price: 225000, category: 'clothing', description: 'Kemeja batik pria lengan panjang, motif parang, size M-XXL', stock: 35 },
            { name: 'Blouse Batik Modern', price: 185000, category: 'clothing', description: 'Blouse batik wanita dengan cutting modern, cocok untuk kerja', stock: 40 },
            { name: 'Dress Batik Kombinasi', price: 325000, category: 'clothing', description: 'Dress batik kombinasi polos dan motif, elegant untuk acara', stock: 20 },
            { name: 'Syal Batik Sutra', price: 175000, category: 'clothing', description: 'Syal batik dari sutra premium, berbagai motif', stock: 25 }
        ]
    },
    {
        name: 'Kaos Distro Bekasi',
        email: 'distro@trolitoko.com',
        phone: '081234567005',
        password: 'test123',
        businessName: 'Urban Street Bekasi',
        businessType: 'micro',
        location: {
            type: 'Point',
            coordinates: [107.0012, -6.2520], // ~3km East
            address: 'Jl. Pemuda No. 99',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17115'
        },
        products: [
            { name: 'Kaos Bekasi Pride', price: 95000, category: 'clothing', description: 'Kaos cotton combed 30s dengan desain Bekasi kekinian', stock: 60 },
            { name: 'Hoodie Street Culture', price: 275000, category: 'clothing', description: 'Hoodie fleece tebal dengan desain urban art', stock: 25 },
            { name: 'Topi Snapback Custom', price: 85000, category: 'clothing', description: 'Topi snapback dengan bordir custom Bekasi', stock: 45 },
            { name: 'Celana Jogger Casual', price: 165000, category: 'clothing', description: 'Celana jogger nyaman untuk aktivitas sehari-hari', stock: 30 }
        ]
    },
    {
        name: 'Hijab Gallery Muslimah',
        email: 'hijab@trolitoko.com',
        phone: '081234567006',
        password: 'test123',
        businessName: 'Hijab Gallery',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9650, -6.2600], // ~4km Southwest
            address: 'Jl. Mawar No. 12',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17116'
        },
        products: [
            { name: 'Hijab Voal Premium', price: 89000, category: 'clothing', description: 'Hijab voal premium 120x120cm, lembut dan tidak licin', stock: 80 },
            { name: 'Hijab Pashmina Diamond', price: 75000, category: 'clothing', description: 'Pashmina diamond crepe, jatuh sempurna', stock: 100 },
            { name: 'Set Gamis Syari', price: 385000, category: 'clothing', description: 'Set gamis syari dengan khimar, bahan wolfis premium', stock: 25 },
            { name: 'Inner Hijab Set', price: 45000, category: 'clothing', description: 'Inner hijab anti pusing set 3pcs berbagai warna', stock: 60 }
        ]
    },

    // ============ ELECTRONICS & GADGETS ============
    {
        name: 'Toko Elektronik Makmur',
        email: 'elektronik@trolitoko.com',
        phone: '081234567007',
        password: 'test123',
        businessName: 'Elektronik Makmur',
        businessType: 'medium',
        location: {
            type: 'Point',
            coordinates: [107.0180, -6.2300], // ~4km East
            address: 'Jl. Raya Bekasi No. 156',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17117'
        },
        products: [
            { name: 'TWS Earbuds Pro Max', price: 385000, category: 'electronics', description: 'True Wireless Stereo dengan ANC, 30 jam playtime', stock: 40 },
            { name: 'Power Bank 20000mAh', price: 275000, category: 'electronics', description: 'Power bank fast charging PD 65W, compact design', stock: 50 },
            { name: 'Mechanical Keyboard RGB', price: 450000, category: 'electronics', description: 'Keyboard mechanical switch blue, RGB backlight', stock: 20 },
            { name: 'Webcam HD 1080p', price: 325000, category: 'electronics', description: 'Webcam full HD dengan mic built-in untuk WFH', stock: 30 },
            { name: 'Ring Light 26cm', price: 185000, category: 'electronics', description: 'Ring light LED dengan tripod, dimmable 3 mode', stock: 35 }
        ]
    },
    {
        name: 'Aksesoris HP Lengkap',
        email: 'aksesori@trolitoko.com',
        phone: '081234567008',
        password: 'test123',
        businessName: 'Phone Accessories Hub',
        businessType: 'micro',
        location: {
            type: 'Point',
            coordinates: [106.9830, -6.2280], // ~1km West
            address: 'Jl. Kartini No. 33',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17118'
        },
        products: [
            { name: 'Case iPhone Premium', price: 125000, category: 'electronics', description: 'Case iPhone transparan anti kuning untuk seri 13-15', stock: 80 },
            { name: 'Charger GaN 65W', price: 225000, category: 'electronics', description: 'Charger GaN 3 port dengan fast charging PD', stock: 45 },
            { name: 'Kabel Type-C Braided', price: 55000, category: 'electronics', description: 'Kabel Type-C to Type-C braided 1.5m, 100W', stock: 100 },
            { name: 'Holder HP Mobil', price: 85000, category: 'electronics', description: 'Car holder magnetic dashboard dengan fast charging', stock: 60 }
        ]
    },

    // ============ HANDICRAFTS ============
    {
        name: 'Kerajinan Tangan Nusantara',
        email: 'kerajinan@trolitoko.com',
        phone: '081234567009',
        password: 'test123',
        businessName: 'Crafts Nusantara',
        businessType: 'micro',
        location: {
            type: 'Point',
            coordinates: [107.0234, -6.2612], // ~5km Southeast
            address: 'Jl. Pengrajin No. 22',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17119'
        },
        products: [
            { name: 'Ukiran Garuda Jati', price: 850000, category: 'handicrafts', description: 'Ukiran Garuda Pancasila dari kayu jati solid, 40x30cm', stock: 8 },
            { name: 'Wayang Kulit Handmade', price: 450000, category: 'handicrafts', description: 'Wayang kulit tokoh Arjuna, dibuat pengrajin Solo', stock: 10 },
            { name: 'Miniatur Candi Borobudur', price: 275000, category: 'handicrafts', description: 'Miniatur Candi Borobudur dari batu putih, 15cm', stock: 15 },
            { name: 'Tas Anyaman Rotan', price: 185000, category: 'handicrafts', description: 'Tas rotan asli anyaman tangan Kalimantan', stock: 25 },
            { name: 'Lukisan Batik Canvas', price: 350000, category: 'handicrafts', description: 'Lukisan batik di atas canvas 40x60cm, motif wayang', stock: 12 }
        ]
    },
    {
        name: 'Pottery & Keramik Studio',
        email: 'pottery@trolitoko.com',
        phone: '081234567010',
        password: 'test123',
        businessName: 'Clay Art Studio',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9550, -6.2100], // ~5km Northwest
            address: 'Jl. Seni No. 7',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17120'
        },
        products: [
            { name: 'Vas Keramik Minimalis', price: 225000, category: 'handicrafts', description: 'Vas keramik handmade gaya Skandinavia, tinggi 25cm', stock: 18 },
            { name: 'Set Mangkok Keramik', price: 185000, category: 'handicrafts', description: 'Set 4 mangkok keramik dengan glaze natural', stock: 25 },
            { name: 'Pot Tanaman Terracotta', price: 95000, category: 'handicrafts', description: 'Pot tanaman dari terracotta, diameter 20cm', stock: 40 },
            { name: 'Plat Dekorasi Dinding', price: 165000, category: 'handicrafts', description: 'Plat keramik dekoratif untuk dinding, motif mandala', stock: 20 }
        ]
    },

    // ============ HOME & LIVING ============
    {
        name: 'Furniture Jepara Bekasi',
        email: 'furniture@trolitoko.com',
        phone: '081234567011',
        password: 'test123',
        businessName: 'Jepara Furniture',
        businessType: 'medium',
        location: {
            type: 'Point',
            coordinates: [106.9534, -6.2012], // ~5km North
            address: 'Jl. Mebel No. 45',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17121'
        },
        products: [
            { name: 'Meja Kopi Jati Minimalis', price: 1250000, category: 'home', description: 'Meja kopi dari kayu jati solid gaya minimalis, 80x50cm', stock: 8 },
            { name: 'Rak Buku Industrial', price: 750000, category: 'home', description: 'Rak buku kombinasi besi dan kayu, 5 tingkat', stock: 12 },
            { name: 'Kursi Santai Rotan', price: 850000, category: 'home', description: 'Kursi santai rotan sintetis dengan bantal', stock: 10 },
            { name: 'Meja Makan Set 4 Kursi', price: 3500000, category: 'home', description: 'Set meja makan kayu jati dengan 4 kursi', stock: 5 }
        ]
    },
    {
        name: 'Dekorasi Rumah Cantik',
        email: 'dekorasi@trolitoko.com',
        phone: '081234567012',
        password: 'test123',
        businessName: 'Home Decor Cantik',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [107.0050, -6.2680], // ~4km Southeast
            address: 'Jl. Pelangi No. 18',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17122'
        },
        products: [
            { name: 'Lampu Hias Rotan', price: 285000, category: 'home', description: 'Lampu hias anyaman rotan, cocok untuk ruang tamu', stock: 20 },
            { name: 'Cermin Dinding Bohemian', price: 345000, category: 'home', description: 'Cermin dinding dengan frame macrame bohemian', stock: 15 },
            { name: 'Set Bantal Sofa Etnik', price: 175000, category: 'home', description: 'Set 3 bantal sofa dengan motif etnik Indonesia', stock: 30 },
            { name: 'Karpet Vintage 150x200', price: 425000, category: 'home', description: 'Karpet bermotif vintage, ukuran 150x200cm', stock: 12 },
            { name: 'Wall Art Metal Daun', price: 195000, category: 'home', description: 'Hiasan dinding metal bentuk daun monstera', stock: 25 }
        ]
    },

    // ============ BEAUTY & HEALTH ============
    {
        name: 'Kosmetik Halal Muslimah',
        email: 'kosmetik@trolitoko.com',
        phone: '081234567013',
        password: 'test123',
        businessName: 'Halal Beauty Shop',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [106.9623, -6.2567], // ~4km Southwest
            address: 'Jl. Cantik No. 25',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17123'
        },
        products: [
            { name: 'Serum Vitamin C 20%', price: 145000, category: 'beauty', description: 'Serum wajah dengan Vitamin C brightening, 30ml', stock: 50 },
            { name: 'Masker Organik Set', price: 125000, category: 'beauty', description: 'Set masker organik 5 varian: green tea, rice, honey, dll', stock: 40 },
            { name: 'Sunscreen SPF 50+ PA+++', price: 85000, category: 'beauty', description: 'Sunscreen ringan tanpa white cast, halal certified', stock: 70 },
            { name: 'Lip Tint Velvet Matte', price: 65000, category: 'beauty', description: 'Lip tint tahan lama dengan formula velvet', stock: 80 },
            { name: 'Set Skincare Pemula', price: 285000, category: 'beauty', description: 'Set lengkap: cleanser, toner, moisturizer, sunscreen', stock: 25 }
        ]
    },
    {
        name: 'Herbal Jamu Tradisional',
        email: 'jamu@trolitoko.com',
        phone: '081234567014',
        password: 'test123',
        businessName: 'Jamu Sehat Alami',
        businessType: 'micro',
        location: {
            type: 'Point',
            coordinates: [106.9720, -6.2150], // ~3km North
            address: 'Jl. Herbal No. 9',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17124'
        },
        products: [
            { name: 'Jamu Kunyit Asam', price: 35000, category: 'beauty', description: 'Jamu kunyit asam segar untuk menjaga tubuh, 500ml', stock: 60 },
            { name: 'Jamu Beras Kencur', price: 35000, category: 'beauty', description: 'Jamu beras kencur tradisional untuk stamina, 500ml', stock: 55 },
            { name: 'Minyak Kutus Kutus', price: 175000, category: 'beauty', description: 'Minyak herbal untuk pijat dan kesehatan, 100ml', stock: 40 },
            { name: 'Teh Herbal Detoks', price: 55000, category: 'beauty', description: 'Teh herbal campuran untuk detoksifikasi, 20 sachet', stock: 45 }
        ]
    },

    // ============ AGRICULTURE ============
    {
        name: 'Tani Organik Sejahtera',
        email: 'tani@trolitoko.com',
        phone: '081234567015',
        password: 'test123',
        businessName: 'Tani Organik',
        businessType: 'medium',
        location: {
            type: 'Point',
            coordinates: [107.0456, -6.2234], // ~7km Northeast
            address: 'Jl. Tani Makmur No. 100',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17125'
        },
        products: [
            { name: 'Beras Organik Premium 5kg', price: 115000, category: 'agriculture', description: 'Beras organik putih dari sawah lokal, bebas pestisida', stock: 100 },
            { name: 'Beras Merah Organik 2kg', price: 65000, category: 'agriculture', description: 'Beras merah organik kaya serat dan nutrisi', stock: 80 },
            { name: 'Paket Sayur Segar', price: 55000, category: 'agriculture', description: 'Paket sayuran segar: kangkung, bayam, sawi, wortel', stock: 50 },
            { name: 'Telur Ayam Kampung 1kg', price: 48000, category: 'agriculture', description: 'Telur ayam kampung asli, lebih bernutrisi', stock: 70 },
            { name: 'Madu Hutan Asli 500ml', price: 125000, category: 'agriculture', description: 'Madu hutan murni dari Kalimantan tanpa campuran', stock: 30 }
        ]
    },
    {
        name: 'Kebun Buah Lestari',
        email: 'buah@trolitoko.com',
        phone: '081234567016',
        password: 'test123',
        businessName: 'Kebun Buah Lestari',
        businessType: 'small',
        location: {
            type: 'Point',
            coordinates: [107.0320, -6.2550], // ~6km East
            address: 'Jl. Kebun Raya No. 55',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17126'
        },
        products: [
            { name: 'Mangga Harum Manis 1kg', price: 45000, category: 'agriculture', description: 'Mangga harum manis Indramayu, manis dan wangi', stock: 60 },
            { name: 'Jeruk Medan Super 1kg', price: 35000, category: 'agriculture', description: 'Jeruk Medan manis tanpa biji, segar dari kebun', stock: 70 },
            { name: 'Alpukat Mentega 1kg', price: 55000, category: 'agriculture', description: 'Alpukat mentega super creamy, cocok untuk smoothie', stock: 40 },
            { name: 'Pisang Raja 1 sisir', price: 28000, category: 'agriculture', description: 'Pisang raja matang sempurna, manis alami', stock: 80 }
        ]
    }
];

// Test Buyer Accounts
const BUYER_DATA = [
    {
        name: 'Budi Santoso',
        email: 'budi@test.com',
        phone: '081987654001',
        password: 'test123',
        location: {
            type: 'Point',
            coordinates: [106.9900, -6.2400],
            address: 'Jl. Merdeka No. 10',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17111'
        }
    },
    {
        name: 'Siti Rahayu',
        email: 'siti@test.com',
        phone: '081987654002',
        password: 'test123',
        location: {
            type: 'Point',
            coordinates: [106.9850, -6.2350],
            address: 'Jl. Pahlawan No. 25',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17112'
        }
    },
    {
        name: 'Andi Wijaya',
        email: 'andi@test.com',
        phone: '081987654003',
        password: 'test123',
        location: {
            type: 'Point',
            coordinates: [107.0000, -6.2500],
            address: 'Jl. Sudirman No. 50',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17113'
        }
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Clean existing test data
        const testSellerEmails = SELLER_DATA.map(s => s.email);
        const testBuyerEmails = BUYER_DATA.map(b => b.email);
        const allTestEmails = [...testSellerEmails, ...testBuyerEmails];

        const existingSellers = await User.find({ email: { $in: testSellerEmails } });
        const existingSellerIds = existingSellers.map(s => s._id);

        await Product.deleteMany({ seller: { $in: existingSellerIds } });
        await User.deleteMany({ email: { $in: allTestEmails } });
        console.log('✓ Cleaned existing test data');

        // Create sellers and products
        let totalProducts = 0;
        for (const sellerData of SELLER_DATA) {
            const { products, ...userData } = sellerData;

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const seller = await User.create({
                ...userData,
                password: hashedPassword,
                isSeller: true,
                isVerified: true,
                rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10 // 3.8-5.0 rating
            });

            console.log(`✓ Created seller: ${seller.businessName}`);

            // Create products for this seller
            for (const productData of products) {
                await Product.create({
                    ...productData,
                    seller: seller._id,
                    location: seller.location,
                    isAvailable: true,
                    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
                    totalReviews: Math.floor(Math.random() * 100) + 10
                });
                totalProducts++;
            }
            console.log(`  ↳ Created ${products.length} products`);
        }

        // Create test buyers
        for (const buyerData of BUYER_DATA) {
            const hashedPassword = await bcrypt.hash(buyerData.password, 10);
            await User.create({
                ...buyerData,
                password: hashedPassword,
                isSeller: false
            });
            console.log(`✓ Created buyer: ${buyerData.name}`);
        }

        // Summary
        const finalSellerCount = await User.countDocuments({ role: 'seller', isVerified: true });
        const finalBuyerCount = await User.countDocuments({ role: 'buyer' });
        const finalProductCount = await Product.countDocuments({ isAvailable: true });

        console.log('\n' + '═'.repeat(50));
        console.log('📊 SEED SUMMARY');
        console.log('═'.repeat(50));
        console.log(`   🏪 Sellers:  ${finalSellerCount}`);
        console.log(`   👤 Buyers:   ${finalBuyerCount}`);
        console.log(`   📦 Products: ${finalProductCount}`);
        console.log('═'.repeat(50));
        console.log('\n✓ Database seeded successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('   Sellers: [email]@trolitoko.com / test123');
        console.log('   Buyers:  budi@test.com, siti@test.com, andi@test.com / test123');

        await mongoose.disconnect();
    } catch (error) {
        console.error('✗ Seed failed:', error);
        process.exit(1);
    }
}

seedDatabase();
