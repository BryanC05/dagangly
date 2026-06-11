# 💰 Analisis & Estimasi Biaya Produksi (Production Cost)

Dokumen ini merinci perkiraan biaya untuk menjalankan **Dagangly** di lingkungan produksi dunia nyata. Arsitektur sistem ini sangat dioptimalkan untuk efisiensi biaya, memanfaatkan backend Go yang ringan serta *free tier* (layanan gratis) yang besar dari penyedia pihak ketiga.

*(Catatan: Estimasi menggunakan kurs kasar $1 USD = ~Rp 16.000)*

## 1. Hosting & Infrastruktur

### 🚀 Backend Server (Render Hobby Plan)
*   **Teknologi:** Go (Golang) API
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Dagangly kini menggunakan **Render Hobby Plan (Free)**. Karena backend Go sangat efisien dalam penggunaan memori (20MB-50MB RAM), aplikasi dapat berjalan stabil tanpa biaya langganan bulanan. 
*   *Catatan:* Layanan gratis Render akan "tidur" jika tidak ada aktivitas selama 15 menit, dan butuh beberapa detik untuk bangun saat dipanggil kembali.

### 🌐 Frontend Web App (Vercel / Cloudflare Pages)
*   **Teknologi:** React.js (Vite)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Frontend adalah kumpulan file statis (HTML/CSS/JS) yang hanya berkomunikasi dengan backend Go Anda. Semua platform besar menawarkan *free tier* yang sangat besar untuk hosting frontend statis (biasanya gratis bandwidth hingga 100GB+/bulan).

### 🤖 Automation (Native Go Integration)
*   **Teknologi:** Native Go Implementation (Instagram Graph API)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Kebutuhan automasi (seperti autoposting Instagram) kini telah dipindahkan secara langsung ke dalam kode backend Go. Kami **tidak lagi memerlukan n8n** atau server tambahan untuk automasi, yang secara signifikan mengurangi biaya operasional dan kompleksitas sistem.

## 2. Database & Penyimpanan (Storage)

### 🗄️ Database Utama (MongoDB Atlas)
*   **Teknologi:** MongoDB
*   **Estimasi Biaya:** **Rp 0/bulan** (Awal) -> **~Rp 144.000+/bulan** (Saat Scaling)
*   **Detail:** `M0 Free Tier` menyediakan penyimpanan 512MB, yang cukup untuk menangani ribuan pengguna dan produk. Ketika aplikasi sudah berkembang pesat, Anda mungkin perlu beralih ke paket Serverless atau Dedicated (mulai dari ~$9/bulan).

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
*   **Detail:** Google memberikan **kredit bulanan gratis sebesar $200 (~Rp 3.200.000)**. Ini mencakup sekitar 100.000 kali pemuatan peta (map loads) per bulan.

### 💳 Payment Gateway (Midtrans)
*   **Teknologi:** Midtrans Payment API
*   **Estimasi Biaya:** **Berbasis Transaksi (Tanpa biaya bulanan)**
*   **Detail:** Midtrans tidak membebankan biaya bulanan. Mereka memotong persentase atau biaya tetap dari transaksi yang berhasil:
    *   **QRIS / GoPay / ShopeePay:** Potongan ~0.7% hingga 2% per transaksi.
    *   **Virtual Account (Bank Transfer):** Biaya tetap ~Rp 4.000 per transaksi.

### 📧 Email Transaksional (SendGrid)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** SendGrid menawarkan 100 email gratis/hari, cukup untuk notifikasi pesanan UMKM skala awal.

### ✨ Layanan AI (Claid.ai / Pollinations)
*   **Estimasi Biaya:** **Rp 0/bulan**
*   **Detail:** Implementasi saat ini menggunakan versi gratis (free tiers) untuk optimasi gambar dan pembuatan logo AI.

## 4. Distribusi Mobile App

### 📱 Android Play Store
*   **Estimasi Biaya:** **~Rp 400.000 ($25.00)** (Sekali bayar seumur hidup)
*   **Detail:** Google membebankan biaya sekali bayar untuk membuka Akun Developer. Setelah itu, Anda dapat mempublikasikan aplikasi dan update tanpa batas.

## 📊 Ringkasan Estimasi (Tahun Pertama)

| Kategori | Tipe Pembayaran | Estimasi Biaya |
| :--- | :--- | :--- |
| **Google Play Developer Account** | Sekali Bayar | **~Rp 400.000** |
| **Custom Domain Name (`.com` / `.id`)** | Tahunan | **~Rp 240.000/tahun** |
| **Render (Go Backend)** | Bulanan | **Rp 0 (Hobby Plan)** |
| **MongoDB Atlas** | Bulanan | **Rp 0 (Free Tier)** |
| **Frontend Hosting & Auth** | Bulanan | **Rp 0** (Free Tiers Besar) |
| **External APIs (Maps, Storage)**| Bulanan | **Rp 0** (Tertutup oleh Free Tiers) |
| **Sistem Pembayaran (Midtrans)** | Per Transaksi | **Potongan ~1.5% dari penjualan** |

**🔥 Total Anggaran Operasional (Operating Budget):** 
Berkat migrasi ke Go dan penggunaan Render Hobby Plan serta penghapusan n8n, Dagangly kini dapat dijalankan dengan **Rp 0 per bulan** (biaya server), dengan biaya awal hanya sekitar **Rp 640.000** untuk domain dan lisensi developer Android.
