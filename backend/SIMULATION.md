# TroliToko Simulation Guide

Panduan simulasi untuk marketplace UMKM TroliToko.

## Quick Start

### 1. Seed Database dengan Data Simulasi
```bash
cd backend
npx eas-cli build -p android --profile preview
```

# Deleting Data on MongoDB
```
node clear-db.js
```

# Killing running backend
```
lsof -i :5000

kill -9 <PID>

or

kill -9 $(lsof -t -i:5000)

or
pkill -9 -f "node.*server" 2>/dev/null || true && sleep 2 && node server.js > server.log 2>&1 & sleep 5 && cat server.log
```
# Reset Logo Generation Limit
```bash
node reset-logo-limit.js --all
```

Ini akan membuat:
- **16 Seller UMKM** dengan berbagai kategori bisnis
- **68 Produk** tersebar di semua kategori
- **3 Akun Buyer** untuk testing

### 2. Jalankan Server
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 3. Akses Aplikasi
Buka `http://localhost:5173`

---

## Test Credentials

### Seller Accounts
| Business Name | Email | Password |
|--------------|-------|----------|
| Warung Makan Bu Dewi | dewi@trolitoko.com | test123 |
| Kopi Nusantara | kopi@trolitoko.com | test123 |
| Rasa Ibu Bakery | bakery@trolitoko.com | test123 |
| Batik Betawi Collection | batik@trolitoko.com | test123 |
| Urban Street Bekasi | distro@trolitoko.com | test123 |
| Hijab Gallery | hijab@trolitoko.com | test123 |
| Elektronik Makmur | elektronik@trolitoko.com | test123 |
| Phone Accessories Hub | aksesori@trolitoko.com | test123 |
| Crafts Nusantara | kerajinan@trolitoko.com | test123 |
| Clay Art Studio | pottery@trolitoko.com | test123 |
| Jepara Furniture | furniture@trolitoko.com | test123 |
| Home Decor Cantik | dekorasi@trolitoko.com | test123 |
| Halal Beauty Shop | kosmetik@trolitoko.com | test123 |
| Jamu Sehat Alami | jamu@trolitoko.com | test123 |
| Tani Organik | tani@trolitoko.com | test123 |
| Kebun Buah Lestari | buah@trolitoko.com | test123 |

### Buyer Accounts
| Name | Email | Password |
|------|-------|----------|
| Budi Santoso | budi@test.com | test123 |
| Siti Rahayu | siti@test.com | test123 |
| Andi Wijaya | andi@test.com | test123 |

---

## Kategori Produk

| Kategori | Jumlah Produk | Contoh Produk |
|----------|---------------|---------------|
| 🍜 Food & Beverages | 17 | Nasi Uduk, Kopi Gayo, Kue Lapis |
| 👗 Clothing | 13 | Batik Tulis, Hijab Voal, Kaos Distro |
| 📱 Electronics | 9 | TWS Earbuds, Power Bank, Keyboard |
| 🎨 Handicrafts | 9 | Ukiran Garuda, Wayang Kulit, Keramik |
| 🏠 Home & Living | 9 | Furniture Jati, Lampu Hias, Dekorasi |
| 💄 Beauty & Health | 9 | Serum, Skincare, Jamu Tradisional |
| 🌾 Agriculture | 9 | Beras Organik, Buah Segar, Madu |

---

## Testing Flow

### Buyer Flow
1. Login sebagai buyer (budi@test.com)
2. Browse produk di halaman Products
3. Gunakan fitur Nearby untuk cari penjual terdekat
4. Tambah produk ke keranjang
5. Checkout dengan alamat pengiriman
6. Cek status pesanan di My Orders

### Seller Flow
1. Login sebagai seller (misal: dewi@trolitoko.com)
2. Akses Seller Dashboard
3. Lihat produk yang dijual
4. Kelola pesanan masuk
5. Update status pesanan

---

## API Testing dengan cURL

### Register Buyer Baru
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Buyer",
    "email": "newbuyer@test.com",
    "password": "test123",
    "phone": "081234567890",
    "role": "buyer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budi@test.com",
    "password": "test123"
  }'
```

### Browse Products
```bash
curl http://localhost:5000/api/products
```

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "products": [
      {"productId": "PRODUCT_ID", "quantity": 2}
    ],
    "deliveryAddress": {
      "address": "Jl. Test No. 123",
      "city": "Bekasi",
      "state": "Jawa Barat",
      "pincode": "17111"
    }
  }'
```

---

## Lokasi Penjual

Semua penjual tersebar di radius 7km dari pusat Bekasi:
- **Koordinat Pusat:** 106.9896, -6.2383
- **Radius:** ~7km

Gunakan fitur **Nearby** untuk melihat penjual terdekat berdasarkan lokasi Anda.

---

## Order Status Flow

```
pending → confirmed → preparing → ready → delivered
    ↓
cancelled
```

---

## Database Commands

```javascript
// MongoDB shell
use msme_marketplace

// Lihat semua produk
db.products.find().pretty()

// Lihat produk per kategori
db.products.find({ category: "food" })

// Lihat semua seller
db.users.find({ role: "seller" })

// Statistik order
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } }}
])
```

---

## Reset Database

```bash
cd backend
node clear-db.js        # Hapus semua data
node seed-location-data.js  # Seed ulang
```

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| "Cannot order from multiple sellers" | Order hanya bisa dari 1 seller per transaksi |
| "Insufficient stock" | Kurangi quantity atau pilih produk lain |
| "Unauthorized" | Token expired, login ulang |
| "Product not found" | Jalankan seed script ulang |

---

*Last Updated: 2026-02-02*
