#!/usr/bin/env node

/**
 * Seed Simulation — Dagangly Marketplace
 *
 * Creates realistic user/business/product/order/expense data with
 * support for two authentication modes:
 *
 *   JWT mode (default):       FIREBASE_AUTH_MODE=false
 *     - Users stored in MongoDB with bcrypt-hashed passwords
 *     - Login via POST /auth/login → JWT token
 *
 *   Firebase mode:            FIREBASE_AUTH_MODE=true
 *     - Creates Firebase Auth users via Admin SDK
 *     - Stores firebaseUid in MongoDB (no local password)
 *     - Login via signInWithEmailAndPassword → Firebase ID token
 *
 * Image paths use /uploads/products/… which resolveImageUrl()
 * routes to the running backend server.
 *
 * Geographic distribution around Bekasi areas:
 *   Summarecon, BINUS, Harapan Indah, Grand Wisata, Cibubur
 *
 * Usage:
 *   node seed-simulation.js
 *   FIREBASE_AUTH_MODE=true node seed-simulation.js
 */

// ──────────────────────────────────────────────
//  Dependencies & Config
// ──────────────────────────────────────────────

const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const path = require("path");

try {
  require("dotenv").config({ path: path.resolve(__dirname, ".env") });
} catch {
  // dotenv optional
}

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || "test123";
const DB_NAME = process.env.DB_NAME || "msme_marketplace";
const MONGODB_URI =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017";
let FIREBASE_AUTH_MODE = process.env.FIREBASE_AUTH_MODE === "true";

// ──────────────────────────────────────────────
//  Firebase Admin SDK (optional)
// ──────────────────────────────────────────────

let firebaseAuth = null;

if (FIREBASE_AUTH_MODE) {
  try {
    const admin = require("firebase-admin");
    const svcPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (svcPath) {
      admin.initializeApp({
        credential: admin.credential.cert(require(path.resolve(__dirname, svcPath))),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
    } else {
      admin.initializeApp();
    }

    firebaseAuth = admin.auth();
    console.log("  🔥 Firebase Auth mode enabled");
  } catch (err) {
    console.error("  ⚠️  Firebase init failed:", err.message);
    console.error("     Falling back to JWT mode");
    FIREBASE_AUTH_MODE = false;
  }
}

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (daysBack = 365) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
};

const jitterCoord = (coord, amount = 0.005) =>
  coord + (Math.random() - 0.5) * amount;

async function createFirebaseUser(email, password, displayName) {
  if (!firebaseAuth) return null;
  try {
    const user = await firebaseAuth.createUser({ email, password, displayName, emailVerified: true });
    return user.uid;
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      const existing = await firebaseAuth.getUserByEmail(email);
      return existing.uid;
    }
    console.error(`  ❌ Firebase user ${email}: ${err.message}`);
    return null;
  }
}

// ──────────────────────────────────────────────
//  Geographic locations
// ──────────────────────────────────────────────

const LOCATIONS = {
  summarecon: {
    center: [107.0029, -6.2247],
    address: "Ruko Emerald Commercial, Summarecon Bekasi",
    city: "Bekasi", state: "Jawa Barat", pincode: "17142",
  },
  binus: {
    center: [107.0008, -6.2232],
    address: "Jl. Bulevar Ahmad Yani, area BINUS Bekasi",
    city: "Bekasi", state: "Jawa Barat", pincode: "17143",
  },
  harapanIndah: {
    center: [106.9898, -6.2154],
    address: "Jl. Harapan Indah Boulevard, Bekasi",
    city: "Bekasi", state: "Jawa Barat", pincode: "17131",
  },
  grandWisata: {
    center: [107.0167, -6.2389],
    address: "Jl. Grand Wisata, Tambun Selatan",
    city: "Bekasi", state: "Jawa Barat", pincode: "17510",
  },
  cibubur: {
    center: [106.8813, -6.3688],
    address: "Cibubur CBD, Ciracas",
    city: "Jakarta Timur", state: "DKI Jakarta", pincode: "13720",
  },
};

// ──────────────────────────────────────────────
//  Product data — images exist in backend/uploads/products/
// ──────────────────────────────────────────────

const CATEGORIES = {
  food: {
    name: "Makanan",
    tags: ["makanan", "indonesian", "tradisional"],
    image: "/uploads/products/nasi-goreng.webp",
    templates: [
      // Nasi Goreng variants — same image
      { name: "Nasi Goreng Ayam", price: 25000, tags: ["nasi-goreng", "ayam"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Nasi Goreng Telur", price: 22000, tags: ["nasi-goreng", "telur"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Nasi Goreng Seafood", price: 32000, tags: ["nasi-goreng", "seafood"], image: "/uploads/products/nasi-goreng.webp" },
      // Mie variants — same image
      { name: "Mie Ayam Bakso", price: 22000, tags: ["mie", "ayam", "bakso"], image: "/uploads/products/bakmi.png" },
      { name: "Mie Ayam Ceker", price: 24000, tags: ["mie", "ayam", "ceker"], image: "/uploads/products/bakmi.png" },
      { name: "Mie Goreng Spesial", price: 28000, tags: ["mie", "goreng", "spesial"], image: "/uploads/products/bakmi.png" },
      // Sate variants — same image
      { name: "Sate Ayam 10 Tusuk", price: 30000, tags: ["sate", "ayam"], image: "/uploads/products/sate-ayam.webp" },
      { name: "Sate Ayam 15 Tusuk", price: 42000, tags: ["sate", "ayam", "besar"], image: "/uploads/products/sate-ayam.webp" },
      { name: "Sate Ayam Lilit", price: 35000, tags: ["sate", "ayam", "lilit"], image: "/uploads/products/sate-ayam.webp" },
      // Rendang variants — same image
      { name: "Rendang Daging Sapi", price: 55000, tags: ["rendang", "daging"], image: "/uploads/products/rendang.webp" },
      { name: "Rendang Ayam", price: 45000, tags: ["rendang", "ayam"], image: "/uploads/products/rendang.webp" },
      { name: "Rendang Jengkol", price: 35000, tags: ["rendang", "jengkol"], image: "/uploads/products/rendang.webp" },
      // Gado-Gado variants — same image
      { name: "Gado-Gado Komplit", price: 20000, tags: ["gado-gado", "sayur"], image: "/uploads/products/gadogado.webp" },
      { name: "Gado-Gado Lontong", price: 22000, tags: ["gado-gado", "lontong"], image: "/uploads/products/gadogado.webp" },
      { name: "Gado-Gado Telur", price: 18000, tags: ["gado-gado", "telur"], image: "/uploads/products/gadogado.webp" },
      // Ayam Penyet variants — same image
      { name: "Ayam Penyet Sambal Ijo", price: 28000, tags: ["ayam", "penyet", "sambal-ijo"], image: "/uploads/products/ayam-penyet.jpg" },
      { name: "Ayam Penyet Sambal Merah", price: 28000, tags: ["ayam", "penyet", "sambal-merah"], image: "/uploads/products/ayam-penyet.jpg" },
      { name: "Ayam Penyet Keju", price: 32000, tags: ["ayam", "penyet", "keju"], image: "/uploads/products/ayam-penyet.jpg" },
      // Bakso variants — same image
      { name: "Bakso Malang Jumbo", price: 35000, tags: ["bakso", "malang"], image: "/uploads/products/bakso-malang.webp" },
      { name: "Bakso Komplit", price: 40000, tags: ["bakso", "komplit"], image: "/uploads/products/bakso-malang.webp" },
      { name: "Bakso Tulang Rangu", price: 25000, tags: ["bakso", "tulang"], image: "/uploads/products/bakso-malang.webp" },
      // Nasi Uduk variants — same image
      { name: "Nasi Uduk Komplit", price: 18000, tags: ["nasi-uduk", "komplit"], image: "/uploads/products/nasi-uduk.jpeg" },
      { name: "Nasi Uduk Ayam", price: 22000, tags: ["nasi-uduk", "ayam"], image: "/uploads/products/nasi-uduk.jpeg" },
      { name: "Nasi Uduk Telur", price: 15000, tags: ["nasi-uduk", "telur"], image: "/uploads/products/nasi-uduk.jpeg" },
      // Soto variants — same image
      { name: "Soto Ayam Bening", price: 22000, tags: ["soto", "ayam"], image: "/uploads/products/soto-ayam.webp" },
      { name: "Soto Ayam Kudus", price: 25000, tags: ["soto", "kudus"], image: "/uploads/products/soto-ayam.webp" },
      { name: "Soto Ayam Lamongan", price: 26000, tags: ["soto", "lamongan"], image: "/uploads/products/soto-ayam.webp" },
      // Nasi Padang variants — same image
      { name: "Nasi Padang Paket", price: 35000, tags: ["padang", "paket"], image: "/uploads/products/nasi-padang.jpg" },
      { name: "Nasi Padang Ayam", price: 30000, tags: ["padang", "ayam"], image: "/uploads/products/nasi-padang.jpg" },
      { name: "Nasi Padang Dendeng", price: 40000, tags: ["padang", "dendeng"], image: "/uploads/products/nasi-padang.jpg" },
      // Ayam Goreng variants — same image
      { name: "Ayam Goreng Kremes", price: 26000, tags: ["ayam", "kremes"], image: "/uploads/products/ayam-goreng-kremes.jpeg" },
      { name: "Ayam Goreng Lengkuas", price: 28000, tags: ["ayam", "lengkuas"], image: "/uploads/products/ayam-goreng-kremes.jpeg" },
      { name: "Ayam Goreng Serundeng", price: 30000, tags: ["ayam", "serundeng"], image: "/uploads/products/ayam-goreng-kremes.jpeg" },
      // Nasi Kuning variants — same image
      { name: "Nasi Kuning Komplit", price: 22000, tags: ["nasi-kuning", "komplit"], image: "/uploads/products/nasi-kuning.jpg" },
      { name: "Nasi Kuning Ayam", price: 25000, tags: ["nasi-kuning", "ayam"], image: "/uploads/products/nasi-kuning.jpg" },
      { name: "Nasi Kuning Ikan", price: 28000, tags: ["nasi-kuning", "ikan"], image: "/uploads/products/nasi-kuning.jpg" },
      // Bacang variants — same image
      { name: "Bacang Ayam", price: 28000, tags: ["bacang", "ayam"], image: "/uploads/products/bacang-ayam.jpg" },
      { name: "Bacang Daging", price: 32000, tags: ["bacang", "daging"], image: "/uploads/products/bacang-ayam.jpg" },
    ],
  },
  beverages: {
    name: "Minuman",
    tags: ["minuman", "kopi", "teh"],
    image: "/uploads/products/kopi-susu.jpg",
    templates: [
      // Kopi Susu variants — same image
      { name: "Kopi Susu Gula Aren", price: 18000, tags: ["kopi", "gula-aren"], image: "/uploads/products/kopi-susu.jpg" },
      { name: "Kopi Susu Kekinian", price: 22000, tags: ["kopi", "kekinian"], image: "/uploads/products/kopi-susu.jpg" },
      { name: "Es Kopi Susu", price: 16000, tags: ["kopi", "es"], image: "/uploads/products/kopi-susu.jpg" },
      { name: "Kopi Susu Klasik", price: 14000, tags: ["kopi", "klasik"], image: "/uploads/products/kopi-susu.jpg" },
      // Es Teh variants — same image
      { name: "Es Teh Lemon", price: 12000, tags: ["teh", "lemon"], image: "/uploads/products/es-teh-lemon.jpg" },
      { name: "Es Teh Leci", price: 14000, tags: ["teh", "leci"], image: "/uploads/products/es-teh-lemon.jpg" },
      { name: "Es Teh Markisa", price: 15000, tags: ["teh", "markisa"], image: "/uploads/products/es-teh-lemon.jpg" },
      // Jus Alpukat variants — same image
      { name: "Jus Alpukat", price: 20000, tags: ["jus", "alpukat"], image: "/uploads/products/jus-alpukat.webp" },
      { name: "Jus Alpukat Cokelat", price: 25000, tags: ["jus", "alpukat", "cokelat"], image: "/uploads/products/jus-alpukat.webp" },
      { name: "Jus Alpukat Susu", price: 22000, tags: ["jus", "alpukat", "susu"], image: "/uploads/products/jus-alpukat.webp" },
      // Es Cendol variants — same image
      { name: "Es Cendol Dawet", price: 15000, tags: ["cendol", "dawet"], image: "/uploads/products/es-cendol.jpeg" },
      { name: "Es Campur", price: 18000, tags: ["es", "campur"], image: "/uploads/products/es-cendol.jpeg" },
      { name: "Es Teler", price: 20000, tags: ["es", "teler"], image: "/uploads/products/es-cendol.jpeg" },
      // Thai Tea variants — same image
      { name: "Thai Tea", price: 18000, tags: ["thai-tea"], image: "/uploads/products/thai-tea.webp" },
      { name: "Thai Tea Pink", price: 20000, tags: ["thai-tea", "pink"], image: "/uploads/products/thai-tea.webp" },
      { name: "Thai Tea Hijau", price: 20000, tags: ["thai-tea", "hijau"], image: "/uploads/products/thai-tea.webp" },
      // Kopi Hitam variants — same image
      { name: "Kopi Hitam Tubruk", price: 12000, tags: ["kopi", "hitam"], image: "/uploads/products/kopi-hitam.jpg" },
      { name: "Kopi Hitam Aceh", price: 15000, tags: ["kopi", "aceh"], image: "/uploads/products/kopi-hitam.jpg" },
      { name: "Kopi Hitam Bali", price: 18000, tags: ["kopi", "bali"], image: "/uploads/products/kopi-hitam.jpg" },
      // Matcha variants — same image
      { name: "Matcha Latte", price: 24000, tags: ["matcha", "latte"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Matcha Greentea", price: 22000, tags: ["matcha", "greentea"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Matcha Susu", price: 20000, tags: ["matcha", "susu"], image: "/uploads/products/matcha-latte.jpg" },
      // Lemon Tea variants — same image
      { name: "Lemon Tea", price: 14000, tags: ["lemon", "tea"], image: "/uploads/products/lemon-tea.webp" },
      { name: "Lemon Tea Madu", price: 16000, tags: ["lemon", "madu"], image: "/uploads/products/lemon-tea.webp" },
      { name: "Lemon Tea Jahe", price: 16000, tags: ["lemon", "jahe"], image: "/uploads/products/lemon-tea.webp" },
      // Milkshake variants — same image
      { name: "Milkshake Cokelat", price: 22000, tags: ["milkshake", "cokelat"], image: "/uploads/products/chocolate-milkshake.webp" },
      { name: "Milkshake Stroberi", price: 22000, tags: ["milkshake", "stroberi"], image: "/uploads/products/chocolate-milkshake.webp" },
      { name: "Milkshake Vanila", price: 20000, tags: ["milkshake", "vanila"], image: "/uploads/products/chocolate-milkshake.webp" },
      { name: "Milkshake Mangga", price: 24000, tags: ["milkshake", "mangga"], image: "/uploads/products/chocolate-milkshake.webp" },
      // Teh Manis variants — same image
      { name: "Teh Manis Hangat", price: 8000, tags: ["teh", "manis"], image: "/uploads/products/teh-manis.jpg" },
      { name: "Teh Manis Es", price: 10000, tags: ["teh", "es"], image: "/uploads/products/teh-manis.jpg" },
      { name: "Teh Tarik", price: 15000, tags: ["teh", "tarik"], image: "/uploads/products/teh-manis.jpg" },
      { name: "Susu Jahe Merah", price: 16000, tags: ["susu", "jahe"], image: "/uploads/products/teh-manis.jpg" },
      { name: "Bandrek Jahe", price: 15000, tags: ["bandrek", "jahe"], image: "/uploads/products/teh-manis.jpg" },
    ],
  },
  snacks: {
    name: "Kue & Snack",
    tags: ["kue", "snack", "camilan"],
    image: "/uploads/products/brownies.webp",
    templates: [
      // Brownies variants — same image
      { name: "Brownies Cokelat", price: 45000, tags: ["brownies", "cokelat"], image: "/uploads/products/brownies.webp" },
      { name: "Brownies Keju", price: 50000, tags: ["brownies", "keju"], image: "/uploads/products/brownies.webp" },
      { name: "Brownies Matcha", price: 48000, tags: ["brownies", "matcha"], image: "/uploads/products/brownies.webp" },
      { name: "Cromboloni Matcha", price: 25000, tags: ["cromboloni", "matcha"], image: "/uploads/products/brownies.webp" },
      { name: "Putri Salju 500gr", price: 60000, tags: ["putri-salju", "kue-kering"], image: "/uploads/products/brownies.webp" },
      // Kue Lapis variants — same image
      { name: "Kue Lapis Legit", price: 85000, tags: ["lapis-legit", "premium"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Kue Cubit Topping", price: 15000, tags: ["kue-cubit"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Bolu Pandan Keju", price: 60000, tags: ["bolu", "pandan"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Kue Nastar 500gr", price: 75000, tags: ["nastar", "kue-kering"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Kastengel 250gr", price: 55000, tags: ["kastengel", "keju"], image: "/uploads/products/kue-lapis.webp" },
      // Pisang variants — same image
      { name: "Pisang Cokelat Crispy", price: 20000, tags: ["pisang", "cokelat"], image: "/uploads/products/pisang-cokelat.webp" },
      { name: "Pisang Goreng Madu", price: 18000, tags: ["pisang", "madu"], image: "/uploads/products/pisang-cokelat.webp" },
      { name: "Pisang Keju", price: 22000, tags: ["pisang", "keju"], image: "/uploads/products/pisang-cokelat.webp" },
      // Donat variants — same image
      { name: "Donat Kentang 6pcs", price: 30000, tags: ["donat", "kentang"], image: "/uploads/products/donat.jpg" },
      { name: "Donat Glazur 6pcs", price: 32000, tags: ["donat", "glazur"], image: "/uploads/products/donat.jpg" },
      { name: "Donat Cokelat 6pcs", price: 35000, tags: ["donat", "cokelat"], image: "/uploads/products/donat.jpg" },
      // Risoles variants — same image
      { name: "Risoles Mayo 5pcs", price: 25000, tags: ["risoles", "mayo"], image: "/uploads/products/risole.jpg" },
      { name: "Risoles Ragout 5pcs", price: 25000, tags: ["risoles", "ragout"], image: "/uploads/products/risole.jpg" },
      { name: "Lumpia Semarang", price: 35000, tags: ["lumpia", "semarang"], image: "/uploads/products/risole.jpg" },
      { name: "Lumpia Isi Udang", price: 38000, tags: ["lumpia", "udang"], image: "/uploads/products/risole.jpg" },
    ],
  },
  agriculture: {
    name: "Sayur & Buah",
    tags: ["sayur", "buah", "segar"],
    image: "/uploads/products/gadogado.webp",
    templates: [
      // Sayur Paket variants — same image
      { name: "Paket Sayur Seminggu", price: 75000, tags: ["sayur", "paket"], image: "/uploads/products/gadogado.webp" },
      { name: "Paket Sayur Hemat", price: 55000, tags: ["sayur", "hemat"], image: "/uploads/products/gadogado.webp" },
      { name: "Paket Sayur Premium", price: 95000, tags: ["sayur", "premium"], image: "/uploads/products/gadogado.webp" },
      { name: "Paket Bumbu Dapur", price: 35000, tags: ["bumbu", "dapur"], image: "/uploads/products/gadogado.webp" },
      { name: "Paket Salad Sayur", price: 25000, tags: ["salad", "sayur"], image: "/uploads/products/gadogado.webp" },
      // Sayur Organik variants — same image
      { name: "Selada Hydroponik 250gr", price: 12000, tags: ["selada", "hydroponik"], image: "/uploads/products/gadogado.webp" },
      { name: "Bayam Organik 500gr", price: 15000, tags: ["bayam", "organik"], image: "/uploads/products/gadogado.webp" },
      { name: "Wortel Organik 500gr", price: 12000, tags: ["wortel", "organik"], image: "/uploads/products/gadogado.webp" },
      { name: "Tomat Cherry 500gr", price: 20000, tags: ["tomat", "cherry"], image: "/uploads/products/gadogado.webp" },
      // Buah variants — same image
      { name: "Buah Segar Mix 2kg", price: 65000, tags: ["buah", "mix"], image: "/uploads/products/jus-alpukat.webp" },
      { name: "Paket Smoothie Buah", price: 45000, tags: ["smoothie", "buah"], image: "/uploads/products/jus-alpukat.webp" },
      { name: "Apel Fuji 1kg", price: 35000, tags: ["apel", "fuji"], image: "/uploads/products/jus-alpukat.webp" },
      { name: "Jeruk Mandarin 1kg", price: 28000, tags: ["jeruk", "mandarin"], image: "/uploads/products/jus-alpukat.webp" },
      // Kentang variants — same image
      { name: "Kentang Import 1kg", price: 18000, tags: ["kentang", "import"], image: "/uploads/products/rendang.webp" },
      { name: "Kentang Lokal 1kg", price: 12000, tags: ["kentang", "lokal"], image: "/uploads/products/rendang.webp" },
    ],
  },
  handicrafts: {
    name: "Kerajinan",
    tags: ["kerajinan", "handmade", "lokal"],
    image: "/uploads/products/kue-lapis.webp",
    templates: [
      // Rotan variants — same image
      { name: "Tas Rotan Handmade", price: 150000, tags: ["tas", "rotan"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Tas Rotan Mini", price: 95000, tags: ["tas", "rotan", "mini"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Keranjang Rotan Set", price: 85000, tags: ["keranjang", "rotan"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Cermin Hias Rotan", price: 110000, tags: ["cermin", "rotan"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Tempat Tisu Rotan", price: 65000, tags: ["tempat-tisu", "rotan"], image: "/uploads/products/kue-lapis.webp" },
      // Anyaman variants — same image
      { name: "Vas Bunga Anyaman", price: 75000, tags: ["vas", "anyaman"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Gelas Anyaman Bambu", price: 35000, tags: ["gelas", "bambu"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Tatakan Gelas Batik", price: 45000, tags: ["tatakan", "batik"], image: "/uploads/products/kue-lapis.webp" },
      // Kayu variants — same image
      { name: "Hiasan Dinding Kayu", price: 95000, tags: ["hiasan", "kayu"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Lampu Hias Gantung", price: 120000, tags: ["lampu", "hias"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Kalung Kayu Ukir", price: 45000, tags: ["kalung", "kayu"], image: "/uploads/products/kue-lapis.webp" },
      // Kain variants — same image
      { name: "Gantungan Kunci Ukir", price: 25000, tags: ["gantungan", "ukir"], image: "/uploads/products/kue-lapis.webp" },
      { name: "Tote Bag Kanvas Custom", price: 55000, tags: ["tote-bag", "kanvas"], image: "/uploads/products/kue-lapis.webp" },
    ],
  },
  fashion: {
    name: "Fashion",
    tags: ["fashion", "pakaian", "lokal"],
    image: "/uploads/products/brownies.webp",
    templates: [
      // Kaos variants — same image
      { name: "Kaos Polos Katun Premium", price: 85000, tags: ["kaos", "katun"], image: "/uploads/products/brownies.webp" },
      { name: "Kaos Sablon Custom", price: 95000, tags: ["kaos", "sablon"], image: "/uploads/products/brownies.webp" },
      { name: "Kaos Striped", price: 75000, tags: ["kaos", "striped"], image: "/uploads/products/brownies.webp" },
      // Batik variants — same image
      { name: "Kemeja Batik Modern", price: 195000, tags: ["kemeja", "batik"], image: "/uploads/products/brownies.webp" },
      { name: "Kemeja Batik Slimfit", price: 215000, tags: ["kemeja", "batik"], image: "/uploads/products/brownies.webp" },
      // Hoodie variants — same image
      { name: "Hoodie Oversize", price: 175000, tags: ["hoodie", "oversize"], image: "/uploads/products/brownies.webp" },
      { name: "Hoodie Polos", price: 155000, tags: ["hoodie", "polos"], image: "/uploads/products/brownies.webp" },
      // Wanita variants — same image
      { name: "Rok Panjang Plisket", price: 125000, tags: ["rok", "plisket"], image: "/uploads/products/brownies.webp" },
      { name: "Blouse Katun Rayon", price: 145000, tags: ["blouse", "rayon"], image: "/uploads/products/brownies.webp" },
      { name: "Celana Kulot Highwaist", price: 135000, tags: ["celana", "kulot"], image: "/uploads/products/brownies.webp" },
      { name: "Dress Midi Floral", price: 225000, tags: ["dress", "midi"], image: "/uploads/products/brownies.webp" },
      // Aksesoris variants — same image
      { name: "Topi Bucket Hat", price: 65000, tags: ["topi", "bucket"], image: "/uploads/products/brownies.webp" },
      { name: "Scarf Silk Premium", price: 95000, tags: ["scarf", "silk"], image: "/uploads/products/brownies.webp" },
      { name: "Sandal Slide Comfy", price: 75000, tags: ["sandal", "slide"], image: "/uploads/products/brownies.webp" },
      { name: "Tas Selempang Mini", price: 115000, tags: ["tas", "selempang"], image: "/uploads/products/brownies.webp" },
      { name: "Cardigan Rajut Halus", price: 165000, tags: ["cardigan", "rajut"], image: "/uploads/products/brownies.webp" },
    ],
  },
  beauty: {
    name: "Kecantikan",
    tags: ["kecantikan", "skincare", "alami"],
    image: "/uploads/products/matcha-latte.jpg",
    templates: [
      // Face Care variants — same image
      { name: "Face Wash Aloe Vera", price: 55000, tags: ["face-wash", "aloevera"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Face Wash Green Tea", price: 50000, tags: ["face-wash", "greentea"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Moisturizer Gel", price: 75000, tags: ["moisturizer", "gel"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Toner Rose Water", price: 52000, tags: ["toner", "rose-water"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Serum Vitamin C", price: 125000, tags: ["serum", "vitamin-c"], image: "/uploads/products/matcha-latte.jpg" },
      // Face Mask variants — same image
      { name: "Face Mask Sheet Set", price: 35000, tags: ["face-mask", "sheet"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Face Mask Clay", price: 45000, tags: ["face-mask", "clay"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Face Mask Scrub", price: 40000, tags: ["face-mask", "scrub"], image: "/uploads/products/matcha-latte.jpg" },
      // Body Care variants — same image
      { name: "Body Scrub Coffee", price: 65000, tags: ["body-scrub", "coffee"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Body Lotion Whitening", price: 48000, tags: ["body-lotion", "whitening"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Hand Cream Set", price: 38000, tags: ["hand-cream", "set"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Sabun Madu Herbal", price: 28000, tags: ["sabun", "madu"], image: "/uploads/products/matcha-latte.jpg" },
      // Makeup variants — same image
      { name: "Lip Tint Natural", price: 45000, tags: ["lip-tint", "natural"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Lip Tint Red", price: 45000, tags: ["lip-tint", "red"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Lip Tint Pink", price: 42000, tags: ["lip-tint", "pink"], image: "/uploads/products/matcha-latte.jpg" },
      // Sunscreen variants — same image
      { name: "Sunscreen SPF 50", price: 85000, tags: ["sunscreen", "spf50"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Sunscreen SPF 30", price: 65000, tags: ["sunscreen", "spf30"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Sunscreen Spray", price: 90000, tags: ["sunscreen", "spray"], image: "/uploads/products/matcha-latte.jpg" },
      // Oil variants — same image
      { name: "Essential Oil Lavender", price: 95000, tags: ["essential-oil", "lavender"], image: "/uploads/products/matcha-latte.jpg" },
      { name: "Essential Oil Tea Tree", price: 90000, tags: ["essential-oil", "tea-tree"], image: "/uploads/products/matcha-latte.jpg" },
    ],
  },
  electronics: {
    name: "Elektronik",
    tags: ["elektronik", "gadget", "teknologi"],
    image: "/uploads/products/thai-tea.webp",
    templates: [
      // Powerbank variants — same image
      { name: "Powerbank 20000mAh", price: 185000, tags: ["powerbank", "20000mah"], image: "/uploads/products/thai-tea.webp" },
      { name: "Powerbank 10000mAh", price: 125000, tags: ["powerbank", "10000mah"], image: "/uploads/products/thai-tea.webp" },
      { name: "Powerbank 5000mAh Mini", price: 85000, tags: ["powerbank", "5000mah"], image: "/uploads/products/thai-tea.webp" },
      // Audio variants — same image
      { name: "Earphone Wireless", price: 145000, tags: ["earphone", "wireless"], image: "/uploads/products/thai-tea.webp" },
      { name: "Earphone Bluetooth", price: 95000, tags: ["earphone", "bluetooth"], image: "/uploads/products/thai-tea.webp" },
      { name: "Speaker Mini Bluetooth", price: 95000, tags: ["speaker", "bluetooth"], image: "/uploads/products/thai-tea.webp" },
      // Cable variants — same image
      { name: "Kabel Charger Fast", price: 45000, tags: ["kabel", "fast-charging"], image: "/uploads/products/thai-tea.webp" },
      { name: "Kabel Data USB", price: 25000, tags: ["kabel", "data"], image: "/uploads/products/thai-tea.webp" },
      { name: "USB Hub 4 Port", price: 85000, tags: ["usb", "hub"], image: "/uploads/products/thai-tea.webp" },
      // Mobile variants — same image
      { name: "Holder HP Mobil", price: 65000, tags: ["holder", "hp"], image: "/uploads/products/thai-tea.webp" },
      { name: "Tripod HP Mini", price: 55000, tags: ["tripod", "hp"], image: "/uploads/products/thai-tea.webp" },
      { name: "Ring Light 8 Inch", price: 115000, tags: ["ring-light"], image: "/uploads/products/thai-tea.webp" },
      // Komputer variants — same image
      { name: "Mouse Wireless", price: 75000, tags: ["mouse", "wireless"], image: "/uploads/products/thai-tea.webp" },
      { name: "Keyboard Mini", price: 125000, tags: ["keyboard", "mini"], image: "/uploads/products/thai-tea.webp" },
      { name: "Webcam HD 1080p", price: 225000, tags: ["webcam", "hd"], image: "/uploads/products/thai-tea.webp" },
      // Lampu variants — same image
      { name: "Lampu LED USB", price: 35000, tags: ["lampu", "led"], image: "/uploads/products/thai-tea.webp" },
      { name: "Lampu LED Night", price: 28000, tags: ["lampu", "night"], image: "/uploads/products/thai-tea.webp" },
    ],
  },
  services: {
    name: "Jasa",
    tags: ["jasa", "layanan", "digital"],
    image: "/uploads/products/nasi-goreng.webp",
    templates: [
      // Desain variants — same image
      { name: "Desain Logo Bisnis", price: 250000, tags: ["desain", "logo"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Desain Kartu Nama", price: 75000, tags: ["desain", "kartu-nama"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Desain Banner", price: 150000, tags: ["desain", "banner"], image: "/uploads/products/nasi-goreng.webp" },
      // Foto/Video variants — same image
      { name: "Jasa Foto Produk", price: 350000, tags: ["foto", "produk"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Edit Video 1 Menit", price: 185000, tags: ["edit", "video"], image: "/uploads/products/nasi-goreng.webp" },
      // Konten variants — same image
      { name: "Konten Media Sosial", price: 150000, tags: ["konten", "sosial-media"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Jasa Tulis Konten", price: 95000, tags: ["tulis", "konten"], image: "/uploads/products/nasi-goreng.webp" },
      // Bisnis variants — same image
      { name: "Setup Toko Online", price: 450000, tags: ["setup", "toko-online"], image: "/uploads/products/nasi-goreng.webp" },
      { name: "Konsultasi Bisnis", price: 200000, tags: ["konsultasi", "bisnis"], image: "/uploads/products/nasi-goreng.webp" },
    ],
  },
};

// ──────────────────────────────────────────────
//  Business definitions
// ──────────────────────────────────────────────

const BUSINESSES = [
  // ── Food ──
  { name: "Dapur Summarecon", owner: "Rani Pratama", email: "rani.summarecon@marketplace.test", phone: "081200000101", type: "small", loc: "summarecon", cats: ["food", "beverages"], products: { min: 12, max: 20 }, verified: true, rating: 4.8, reviews: 134, member: true },
  { name: "Warung Nusantara", owner: "Pak Surya", email: "surya.warung@marketplace.test", phone: "081200000102", type: "micro", loc: "harapanIndah", cats: ["food"], products: { min: 8, max: 15 }, verified: true, rating: 4.6, reviews: 78, member: false },
  { name: "Soto & Bakso Pak Joko", owner: "Joko Santoso", email: "joko.soto@marketplace.test", phone: "081200000103", type: "micro", loc: "grandWisata", cats: ["food", "beverages"], products: { min: 6, max: 12 }, verified: false, rating: 4.4, reviews: 45, member: false },
  { name: "Nasi Padang Bu Ani", owner: "Ani Wijaya", email: "ani.padang@marketplace.test", phone: "081200000104", type: "small", loc: "cibubur", cats: ["food"], products: { min: 10, max: 18 }, verified: true, rating: 4.9, reviews: 156, member: true },
  // ── Beverages ──
  { name: "Kopi Kita", owner: "Budi Kopi", email: "budi.kopi@marketplace.test", phone: "081200000201", type: "micro", loc: "summarecon", cats: ["beverages"], products: { min: 10, max: 16 }, verified: true, rating: 4.7, reviews: 92, member: true },
  { name: "Es Teh Manis Bu Dewi", owner: "Dewi Sari", email: "dewi.esteh@marketplace.test", phone: "081200000202", type: "micro", loc: "binus", cats: ["beverages"], products: { min: 8, max: 14 }, verified: true, rating: 4.5, reviews: 67, member: false },
  { name: "Kedai Kopi Senja", owner: "Ahmad Rizal", email: "rizal.kedai@marketplace.test", phone: "081200000203", type: "small", loc: "harapanIndah", cats: ["beverages", "snacks"], products: { min: 10, max: 18 }, verified: true, rating: 4.8, reviews: 112, member: true },
  // ── Snacks ──
  { name: "Kue Kering Budi", owner: "Budi Santoso", email: "budi.kue@marketplace.test", phone: "081200000301", type: "micro", loc: "summarecon", cats: ["snacks"], products: { min: 12, max: 22 }, verified: true, rating: 4.9, reviews: 189, member: true },
  { name: "Brownies & Co", owner: "Maya Brownies", email: "maya.brownies@marketplace.test", phone: "081200000302", type: "small", loc: "binus", cats: ["snacks"], products: { min: 8, max: 15 }, verified: true, rating: 4.7, reviews: 134, member: true },
  { name: "Donat Kentang Madu", owner: "Siti Aminah", email: "siti.donat@marketplace.test", phone: "081200000303", type: "micro", loc: "grandWisata", cats: ["snacks"], products: { min: 6, max: 12 }, verified: false, rating: 4.3, reviews: 38, member: false },
  // ── Agriculture ──
  { name: "Sayur Segar Agus", owner: "Agus Wijaya", email: "agus.sayur@marketplace.test", phone: "081200000401", type: "micro", loc: "harapanIndah", cats: ["agriculture"], products: { min: 10, max: 18 }, verified: true, rating: 4.6, reviews: 89, member: false },
  { name: "Buah Segar Bekasi", owner: "Rina Buah", email: "rina.buah@marketplace.test", phone: "081200000402", type: "small", loc: "cibubur", cats: ["agriculture"], products: { min: 8, max: 16 }, verified: true, rating: 4.8, reviews: 156, member: true },
  { name: "Organik Hydroponik", owner: "Doni Tanaman", email: "doni.organic@marketplace.test", phone: "081200000403", type: "micro", loc: "summarecon", cats: ["agriculture"], products: { min: 6, max: 12 }, verified: false, rating: 4.5, reviews: 42, member: false },
  // ── Handicrafts ──
  { name: "Anyaman Lokal", owner: "Dina Marlina", email: "dina.anyaman@marketplace.test", phone: "081200000501", type: "micro", loc: "binus", cats: ["handicrafts"], products: { min: 8, max: 16 }, verified: true, rating: 4.7, reviews: 67, member: false },
  { name: "Kerajinan Kayu Jati", owner: "Pak Harto", email: "harto.kayu@marketplace.test", phone: "081200000502", type: "small", loc: "grandWisata", cats: ["handicrafts"], products: { min: 6, max: 14 }, verified: true, rating: 4.8, reviews: 98, member: true },
  // ── Fashion ──
  { name: "Batik Modern Indah", owner: "Indah Batik", email: "indah.batik@marketplace.test", phone: "081200000601", type: "small", loc: "summarecon", cats: ["fashion"], products: { min: 10, max: 18 }, verified: true, rating: 4.6, reviews: 124, member: true },
  { name: "Kaos Polos Premium", owner: "Rudi Kaos", email: "rudi.kaos@marketplace.test", phone: "081200000602", type: "micro", loc: "harapanIndah", cats: ["fashion"], products: { min: 8, max: 14 }, verified: false, rating: 4.4, reviews: 56, member: false },
  { name: "Hijab Syar'i Gallery", owner: "Aisyah Hijab", email: "aisyah.hijab@marketplace.test", phone: "081200000603", type: "small", loc: "cibubur", cats: ["fashion"], products: { min: 12, max: 20 }, verified: true, rating: 4.9, reviews: 178, member: true },
  // ── Beauty ──
  { name: "Skincare Alami", owner: "Lina Skincare", email: "lina.skincare@marketplace.test", phone: "081200000701", type: "micro", loc: "summarecon", cats: ["beauty"], products: { min: 8, max: 16 }, verified: true, rating: 4.7, reviews: 145, member: true },
  { name: "Aromaterapi Nusantara", owner: "Yuni Aroma", email: "yuni.aroma@marketplace.test", phone: "081200000702", type: "micro", loc: "binus", cats: ["beauty"], products: { min: 6, max: 12 }, verified: false, rating: 4.5, reviews: 34, member: false },
  // ── Home ──
  { name: "Perlengkapan Rumah Modern", owner: "Budi Home", email: "budi.home@marketplace.test", phone: "081200000801", type: "small", loc: "summarecon", cats: ["home"], products: { min: 10, max: 18 }, verified: true, rating: 4.6, reviews: 87, member: true },
  { name: "Dekorasi Rumah Unik", owner: "Sari Decor", email: "sari.decor@marketplace.test", phone: "081200000802", type: "micro", loc: "harapanIndah", cats: ["home", "handicrafts"], products: { min: 8, max: 15 }, verified: false, rating: 4.4, reviews: 52, member: false },
  // ── Electronics ──
  { name: "Gadget & Accessories", owner: "Tech Shop", email: "tech.gadget@marketplace.test", phone: "081200000901", type: "small", loc: "binus", cats: ["electronics"], products: { min: 10, max: 18 }, verified: true, rating: 4.5, reviews: 134, member: true },
  { name: "Elektronik Rumah Tangga", owner: "Andi Elektronik", email: "andi.elektronik@marketplace.test", phone: "081200000902", type: "micro", loc: "grandWisata", cats: ["electronics"], products: { min: 6, max: 12 }, verified: false, rating: 4.2, reviews: 45, member: false },
  // ── Services ──
  { name: "Desain Kreatif Studio", owner: "Rina Design", email: "rina.design@marketplace.test", phone: "081200001001", type: "micro", loc: "summarecon", cats: ["services"], products: { min: 6, max: 10 }, verified: true, rating: 4.8, reviews: 76, member: true },
  { name: "Digital Marketing Hub", owner: "Dodi Marketing", email: "dodi.marketing@marketplace.test", phone: "081200001002", type: "small", loc: "cibubur", cats: ["services"], products: { min: 4, max: 8 }, verified: true, rating: 4.6, reviews: 58, member: true },
  // ── Mixed / Large ──
  { name: "Rasa Nusantara Catering", owner: "PT Rasa Nusantara", email: "pt.rasa@marketplace.test", phone: "0218000001", type: "medium", loc: "summarecon", cats: ["food", "beverages", "snacks"], products: { min: 20, max: 35 }, verified: true, rating: 4.9, reviews: 256, member: true },
  { name: "Snack Box & Katering", owner: "Hendra Kurniawan", email: "hendra.snackbox@marketplace.test", phone: "081200001101", type: "micro", loc: "grandWisata", cats: ["snacks", "food"], products: { min: 8, max: 16 }, verified: false, rating: 4.2, reviews: 28, member: false },
  { name: "Market Fresh & Co", owner: "Sinta Market", email: "sinta.market@marketplace.test", phone: "081200001102", type: "small", loc: "cibubur", cats: ["agriculture", "food"], products: { min: 12, max: 22 }, verified: true, rating: 4.7, reviews: 167, member: true },
];

const BUYERS = [
  { name: "Andi Wijaya", email: "andi.buyer@marketplace.test", phone: "081300000101", loc: "summarecon" },
  { name: "Lisa Permata", email: "lisa.buyer@marketplace.test", phone: "081300000102", loc: "binus" },
  { name: "Rudi Hartono", email: "rudi.buyer@marketplace.test", phone: "081300000103", loc: "harapanIndah" },
  { name: "Nina Anggraini", email: "nina.buyer@marketplace.test", phone: "081300000104", loc: "grandWisata" },
  { name: "Yusuf Ibrahim", email: "yusuf.buyer@marketplace.test", phone: "081300000105", loc: "cibubur" },
  { name: "Dewi Kusuma", email: "dewi.buyer@marketplace.test", phone: "081300000106", loc: "summarecon" },
  { name: "Ahmad Fauzi", email: "ahmad.buyer@marketplace.test", phone: "081300000107", loc: "binus" },
  { name: "Putri Amelia", email: "putri.buyer@marketplace.test", phone: "081300000108", loc: "harapanIndah" },
  { name: "Bambang Sulistio", email: "bambang.buyer@marketplace.test", phone: "081300000109", loc: "grandWisata" },
  { name: "Citra Lestari", email: "citra.buyer@marketplace.test", phone: "081300000110", loc: "cibubur" },
];

const EXPENSE_CATEGORIES = ["supplies", "marketing", "transport", "utilities", "rent", "equipment"];

const EXPENSE_TEMPLATES = {
  supplies: ["Bahan baku utama", "Kemasan dus + label", "Bahan setengah jadi", "Ingredients stock", "Raw materials procurement"],
  marketing: ["Iklan Facebook Ads", "Promo Instagram", "Iklan Google", "Promo Tokopedia", "Marketing materials"],
  transport: ["Ongkir delivery", "Biaya kirim produk", "Transportasi bahan baku", "Delivery costs", "Shipping expenses"],
  utilities: ["Listrik bulan ini", "Air PDAM", "Internet bisnis", "Telepon & komunikasi", "Utilities monthly"],
  rent: ["Sewa kios", "Sewa gudang", "Sewa ruko", "Sewa stan mall", "Space rental"],
  equipment: ["Mesin kerja", "Alat produksi", "Peralatan dapur", "Tools & equipment", "Machinery maintenance"],
};

const EXPENSE_BASE = {
  supplies: { min: 150000, max: 600000 },
  marketing: { min: 100000, max: 400000 },
  transport: { min: 80000, max: 300000 },
  utilities: { min: 50000, max: 150000 },
  rent: { min: 150000, max: 350000 },
  equipment: { min: 200000, max: 2500000 },
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled"];
const DELIVERED = ["delivered", "completed"];

// ──────────────────────────────────────────────
//  Main seed function
// ──────────────────────────────────────────────

async function seed() {
  console.log("\n  ╔══════════════════════════════════════════╗");
  console.log("  ║     🌱  Dagangly Seed Simulation        ║");
  console.log("  ╚══════════════════════════════════════════╝\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("  📦 Connected to MongoDB\n");

    const db = client.db(DB_NAME);

    // ── Clear collections ──
    const collections = ["users", "businesses", "products", "orders", "chatrooms", "messages", "expenses", "wallets"];
    for (const name of collections) {
      await db.collection(name).deleteMany({});
    }
    console.log("  🧹 Cleared all collections\n");

    const hashedPassword = FIREBASE_AUTH_MODE ? null : await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const users = [];
    const businesses = [];
    const products = [];
    const expenses = [];
    const orders = [];

    // ── Create business users ──
    console.log("  ── Creating business users ──");

    for (const biz of BUSINESSES) {
      const loc = LOCATIONS[biz.loc];
      const userId = new ObjectId();
      const businessId = new ObjectId();
      const memberSince = biz.member ? randomDate(400) : null;
      const memberExpiry = biz.member ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;

      let firebaseUid = null;
      if (FIREBASE_AUTH_MODE) {
        firebaseUid = await createFirebaseUser(biz.email, DEFAULT_PASSWORD, biz.owner);
      }

      const coords = [jitterCoord(loc.center[0]), jitterCoord(loc.center[1])];

      businesses.push({
        _id: businessId,
        ownerId: userId,
        name: biz.name,
        description: `${biz.name} — ${biz.type} business specializing in ${biz.cats.join(", ")}.`,
        email: biz.email,
        phone: biz.phone,
        businessType: biz.type,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        location: { type: "Point", coordinates: coords },
        isVerified: biz.verified,
        isActive: true,
        createdAt: randomDate(300),
        updatedAt: new Date(),
      });

      const user = {
        _id: userId,
        name: biz.owner,
        email: biz.email,
        phone: biz.phone,
        isSeller: true,
        businessName: biz.name,
        businessType: biz.type,
        businessId,
        location: { type: "Point", coordinates: coords, address: loc.address, city: loc.city, state: loc.state, pincode: loc.pincode },
        isVerified: biz.verified,
        rating: biz.rating,
        totalReviews: biz.reviews,
        isMember: biz.member,
        membershipStatus: biz.member ? "active" : "none",
        memberSince,
        memberExpiry,
        registrationStatus: "approved",
        approvedAt: randomDate(200),
        createdAt: randomDate(300),
        updatedAt: new Date(),
      };

      if (FIREBASE_AUTH_MODE) {
        user.firebaseUid = firebaseUid;
        user.authProvider = "firebase";
        user.emailVerified = true;
      } else {
        user.password = hashedPassword;
      }

      users.push(user);

      // ── Generate products ──
      const count = randomInt(biz.products.min, biz.products.max);
      const used = new Set();

      for (let i = 0; i < count; i++) {
        const catId = randomItem(biz.cats);
        const cat = CATEGORIES[catId];
        if (!cat) continue;

        let tpl;
        let tries = 0;
        do { tpl = randomItem(cat.templates); tries++; } while (used.has(tpl.name) && tries < 5);
        used.add(tpl.name);

        const price = Math.max(5000, tpl.price + randomInt(-3000, 5000));
        const hasReviews = Math.random() > 0.3;

        products.push({
          _id: new ObjectId(),
          name: tpl.name,
          description: `${tpl.name} dari ${biz.name}. ${cat.name} berkualitas terbaik.`,
          price,
          category: catId,
          stock: randomInt(5, 100),
          unit: "pcs",
          images: [tpl.image || cat.image],
          seller: userId,
          businessId,
          location: businesses[businesses.length - 1].location,
          tags: [...new Set([...tpl.tags, ...cat.tags.slice(0, 2)])],
          isAvailable: true,
          rating: hasReviews ? parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)) : 0,
          totalReviews: hasReviews ? randomInt(1, 50) : 0,
          createdAt: randomDate(200),
          updatedAt: new Date(),
        });
      }

      process.stdout.write(`  ✅ ${biz.name.padEnd(30)} ${count} products\n`);
    }

    // ── Create buyers ──
    console.log("\n  ── Creating buyer users ──");

    for (const b of BUYERS) {
      const loc = LOCATIONS[b.loc];

      let firebaseUid = null;
      if (FIREBASE_AUTH_MODE) {
        firebaseUid = await createFirebaseUser(b.email, DEFAULT_PASSWORD, b.name);
      }

      const buyer = {
        _id: new ObjectId(),
        name: b.name,
        email: b.email,
        phone: b.phone,
        isSeller: false,
        businessName: null,
        businessType: "",
        businessId: null,
        location: {
          type: "Point",
          coordinates: [jitterCoord(loc.center[0]), jitterCoord(loc.center[1])],
          address: loc.address, city: loc.city, state: loc.state, pincode: loc.pincode,
        },
        isVerified: false,
        rating: 0, totalReviews: 0,
        isMember: false, membershipStatus: "none",
        registrationStatus: "approved",
        createdAt: randomDate(),
        updatedAt: new Date(),
      };

      if (FIREBASE_AUTH_MODE) {
        buyer.firebaseUid = firebaseUid;
        buyer.authProvider = "firebase";
        buyer.emailVerified = true;
      } else {
        buyer.password = hashedPassword;
      }

      users.push(buyer);
      process.stdout.write(`  👤 ${b.name.padEnd(25)} buyer\n`);
    }

    // ── Generate expenses ──
    console.log("\n  ── Creating expenses ──");

    for (const biz of businesses) {
      const num = randomInt(8, 12);
      for (let i = 0; i < num; i++) {
        const cat = randomItem(EXPENSE_CATEGORIES);
        const base = EXPENSE_BASE[cat];
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * 60));
        expenses.push({
          _id: new ObjectId(),
          userId: biz.ownerId,
          localId: `EXP-${biz.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
          amount: randomInt(base.min, base.max),
          category: cat,
          description: randomItem(EXPENSE_TEMPLATES[cat]),
          date: d.toISOString().split("T")[0],
          createdAt: d,
          updatedAt: new Date(),
          source: "seed",
        });
      }
    }
    console.log(`  ✅ ${expenses.length} expenses created`);

    // ── Generate orders ──
    console.log("\n  ── Creating orders ──");

    for (const biz of businesses) {
      const sellerProducts = products.filter(p => p.businessId.equals(biz._id));
      if (!sellerProducts.length) continue;

      const numOrders = randomInt(5, 15);

      for (let i = 0; i < numOrders; i++) {
        const buyer = randomItem(BUYERS);
        const orderProducts = [];
        const usedP = new Set();
        const count = randomInt(1, Math.min(3, sellerProducts.length));

        for (let j = 0; j < count; j++) {
          const avail = sellerProducts.filter(p => !usedP.has(p._id.toString()));
          if (!avail.length) break;
          const p = randomItem(avail);
          usedP.add(p._id.toString());
          const qty = randomInt(1, 5);
          orderProducts.push({ productId: p._id, name: p.name, price: p.price, quantity: qty });
        }

        if (!orderProducts.length) continue;

        const subtotal = orderProducts.reduce((s, p) => s + p.price * p.quantity, 0);
        const shipping = randomInt(5000, 25000);
        const roll = Math.random();
        const status = roll < 0.7 ? randomItem(DELIVERED) : roll < 0.85 ? "shipped" : roll < 0.95 ? randomItem(["pending", "confirmed", "processing"]) : "cancelled";
        const orderDate = randomDate(90);

        orders.push({
          _id: new ObjectId(),
          orderNumber: `ORD-${String(orders.length + 1).padStart(5, "0")}`,
          buyer: new ObjectId(),
          buyerName: buyer.name,
          buyerPhone: buyer.phone,
          seller: biz.ownerId,
          businessId: biz._id,
          businessName: biz.name,
          products: orderProducts,
          subtotal,
          shippingFee: shipping,
          discountAmount: 0,
          totalAmount: subtotal + shipping,
          status,
          paymentMethod: randomItem(["COD", "Transfer", "Gopay", "OVO", "Dana"]),
          paymentStatus: status === "cancelled" ? "refunded" : "paid",
          deliveryAddress: { address: LOCATIONS[buyer.loc].address, city: LOCATIONS[buyer.loc].city },
          createdAt: orderDate,
          updatedAt: orderDate,
        });
      }
    }
    console.log(`  ✅ ${orders.length} orders created`);

    // ── Insert all data ──
    console.log("\n  ── Inserting into database ──");

    await db.collection("users").insertMany(users);
    console.log(`  ✅ ${users.length} users (${BUSINESSES.length} sellers, ${BUYERS.length} buyers)`);

    await db.collection("businesses").insertMany(businesses);
    console.log(`  ✅ ${businesses.length} businesses`);

    await db.collection("products").insertMany(products);
    console.log(`  ✅ ${products.length} products`);

    if (expenses.length) {
      await db.collection("expenses").insertMany(expenses);
      console.log(`  ✅ ${expenses.length} expenses`);
    }

    if (orders.length) {
      await db.collection("orders").insertMany(orders);
      console.log(`  ✅ ${orders.length} orders`);
    }

    // ── Indexes ──
    console.log("\n  ── Creating indexes ──");
    await db.collection("businesses").createIndexes([
      { key: { ownerId: 1 }, unique: true },
      { key: { isActive: 1, isVerified: 1 } },
    ]);
    await db.collection("products").createIndexes([
      { key: { businessId: 1 } },
      { key: { seller: 1 } },
      { key: { category: 1 } },
      { key: { "location.coordinates": "2dsphere" } },
    ]);
    await db.collection("expenses").createIndexes([
      { key: { userId: 1 } },
      { key: { category: 1 } },
      { key: { date: -1 } },
    ]);
    await db.collection("orders").createIndexes([
      { key: { seller: 1 } },
      { key: { buyer: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ]);
    console.log("  ✅ Indexes created");

    // ── Summary ──
    console.log("\n  ╔══════════════════════════════════════════╗");
    console.log("  ║            📊  Summary                  ║");
    console.log("  ╚══════════════════════════════════════════╝");
    console.log(`  Auth mode:        ${FIREBASE_AUTH_MODE ? "Firebase Auth" : "JWT (MongoDB + bcrypt)"}`);
    if (FIREBASE_AUTH_MODE) {
      console.log(`  Firebase users:   ${users.filter(u => u.firebaseUid).length}/${users.length}`);
    } else {
      console.log(`  Default password: "${DEFAULT_PASSWORD}"`);
    }
    console.log(`  Users:            ${users.length}`);
    console.log(`  Businesses:       ${businesses.length}`);
    console.log(`  Products:         ${products.length}`);
    console.log(`  Expenses:         ${expenses.length} (Rp ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString("id-ID")})`);
    console.log(`  Orders:           ${orders.length} (Rp ${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("id-ID")})`);
    console.log(`  Completed:        ${orders.filter(o => DELIVERED.includes(o.status)).length}`);

    // ── Category breakdown ──
    const byCat = {};
    products.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    console.log("\n  Products by category:");
    Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, n]) => console.log(`    ${cat.padEnd(18)} ${n}`));

    console.log("\n  ✅ Seeding complete!\n");
  } catch (err) {
    console.error("\n  ❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
