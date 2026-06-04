# 💰 Analisis & Estimasi Biaya Produksi (Production Cost)

Dokumen ini merinci perkiraan biaya untuk menjalankan **Dagangly** di lingkungan produksi dunia nyata. Arsitektur sistem ini sangat dioptimalkan untuk efisiensi biaya, memanfaatkan backend Go yang ringan serta *free tier* (layanan gratis) yang besar dari penyedia pihak ketiga.

*(Catatan: Estimasi menggunakan kurs kasar $1 USD = ~Rp 16.000)*

## 1. Hosting & Infrastruktur

### 🚀 Backend Server (Railway)
*   **Teknologi:** Go (Golang) API
*   **Estimasi Biaya:** **~Rp 80.000/bulan** ($5.00)
*   **Detail:** Railway membebankan biaya berdasarkan penggunaan CPU dan RAM yang sebenarnya. Karena backend telah dimigrasi ke Go, penggunaan memori sangat efisien (biasanya hanya sekitar 20MB - 50MB RAM). Deposit minimum paket "Hobby" sudah sangat cukup untuk mencakup biaya ini pada marketplace skala kecil-menengah.

### 🌐 Frontend Web App (Vercel / Netlify / Cloudflare Pages)
*   **Teknologi:** React.js (Vite)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Frontend adalah kumpulan file statis (HTML/CSS/JS) yang hanya berkomunikasi dengan backend Go Anda. Semua platform besar menawarkan *free tier* yang sangat besar untuk hosting frontend statis (biasanya gratis bandwidth hingga 100GB+/bulan).

### 🤖 Automation Engine (n8n di Railway)
*   **Teknologi:** Node.js (n8n Docker Container)
*   **Estimasi Biaya:** **~Rp 80.000 - Rp 160.000/bulan** ($5.00 - $10.00)
*   **Detail:** Berbeda dengan backend Go, n8n adalah aplikasi Node.js yang berat. Jika Anda menjalankan n8n di Railway bersama aplikasi Go Anda, n8n akan mengonsumsi RAM yang jauh lebih besar.

## 2. Database & Penyimpanan (Storage)

### 🗄️ Database Utama (MongoDB Atlas)
*   **Teknologi:** MongoDB
*   **Estimasi Biaya:** **Rp 0/bulan** (Awal) -> **~Rp 144.000+/bulan** (Saat Scaling)
*   **Detail:** `M0 Free Tier` menyediakan penyimpanan 512MB, yang cukup untuk menangani ribuan pengguna dan produk. Ketika aplikasi sudah berkembang pesat, Anda mungkin perlu beralih ke paket Serverless atau Dedicated (mulai dari ~$9/bulan).

### 🗃️ Database Automasi (Railway PostgreSQL)
*   **Teknologi:** PostgreSQL
*   **Estimasi Biaya:** **~Rp 16.000 - Rp 48.000/bulan** ($1.00 - $3.00)
*   **Detail:** Digunakan secara eksklusif untuk menyimpan *workflow* n8n dan log eksekusi. Kebutuhan memori dan penyimpanannya sangat minim.

### 🖼️ Penyimpanan Gambar (Firebase Storage / AWS S3)
*   **Teknologi:** Cloud Object Storage
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Firebase Storage memberikan 5GB penyimpanan gratis dan bandwidth 1GB/hari. Ini sangat cukup untuk menampung ribuan gambar produk sebelum Anda harus membayar beberapa ribu rupiah per gigabyte pada paket "Blaze".

## 3. Layanan Pihak Ketiga & API

### 🔐 Autentikasi (Firebase Auth)
*   **Teknologi:** Google Identity Platform
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Firebase Authentication (Login Email/Password dan Google Social Login) **100% gratis dengan pengguna aktif bulanan (MAU) tidak terbatas**.

### 🗺️ Geolocation (Google Maps API)
*   **Teknologi:** Google Maps SDK (Android/Web)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Google memberikan **kredit bulanan gratis sebesar $200 (~Rp 3.200.000)**. Ini mencakup sekitar 100.000 kali pemuatan peta (map loads) per bulan. Kecuali jika Dagangly mendadak menjadi sangat masif dalam semalam, Anda tidak perlu membayar sepeser pun.

### 💳 Payment Gateway (Midtrans)
*   **Teknologi:** Midtrans Payment API
*   **Estimasi Biaya:** **Berbasis Transaksi (Tanpa biaya bulanan)**
*   **Detail:** Midtrans tidak membebankan biaya bulanan. Mereka memotong persentase atau biaya tetap dari transaksi yang berhasil:
    *   **QRIS / GoPay / ShopeePay:** Potongan ~0.7% hingga 2% per transaksi.
    *   **Virtual Account (Bank Transfer):** Biaya tetap ~Rp 4.000 per transaksi.

### 📧 Email Transaksional (Gmail SMTP / SendGrid)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** SendGrid menawarkan 100 email gratis/hari. Menggunakan Gmail App Passwords melalui n8n memberikan 500 email gratis/hari.

### ✨ Layanan AI (Claid.ai / Pollinations)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Implementasi saat ini menggunakan versi gratis (free tiers) dan kami telah membatasi permintaan di backend agar Anda tidak secara tidak sengaja terkena biaya dari paket berbayar mereka.

## 4. Distribusi Mobile App

### 📱 Android Play Store
*   **Estimasi Biaya:** **~Rp 400.000 ($25.00)** (Sekali bayar seumur hidup)
*   **Detail:** Google membebankan biaya sekali bayar untuk membuka Akun Developer. Setelah itu, Anda dapat mempublikasikan aplikasi dan update tanpa batas.
*   *(Sebagai perbandingan, Apple App Store untuk iOS membutuhkan biaya rutin ~$99 atau ~Rp 1.584.000 per tahun).*

## 📊 Ringkasan Estimasi (Tahun Pertama)

| Kategori | Tipe Pembayaran | Estimasi Biaya |
| :--- | :--- | :--- |
| **Google Play Developer Account** | Sekali Bayar | **~Rp 400.000** |
| **Custom Domain Name (`.com` / `.id`)** | Tahunan | **~Rp 240.000/tahun** |
| **Railway (Go Backend + n8n + DBs)** | Bulanan | **~Rp 160.000 - Rp 240.000/bulan** |
| **Frontend Hosting & Auth** | Bulanan | **Rp 0** (Free Tiers Besar) |
| **External APIs (Maps, Storage)**| Bulanan | **Rp 0** (Tertutup oleh Free Tiers) |
| **Sistem Pembayaran (Midtrans)** | Per Transaksi | **Potongan ~1.5% dari penjualan** |

**🔥 Total Anggaran Operasional (Operating Budget):** 
Anda dapat dengan tenang menjalankan dan mengembangkan marketplace Dagangly dengan biaya server **kurang dari Rp 300.000 per bulan**, ditambah biaya awal sekitar **Rp 640.000** untuk membeli domain dan lisensi developer Android.
