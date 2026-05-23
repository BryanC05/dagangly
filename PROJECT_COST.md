# Rincian Biaya Proyek (Skala Mini-Produksi)

Menjalankan setup mini-produksi untuk marketplace **Dagangly** sangat ramah anggaran (budget-friendly). Karena backend menggunakan Go, penggunaan memori server akan sangat kecil (sekitar 15-30 MB untuk core API), yang membuat biaya hosting menjadi sangat murah.

Berikut adalah rincian estimasi biaya untuk memelihara dan mempublikasikan proyek ini pada skala mini-produksi:

## 1. Backend & Database (Railway + MongoDB)
* **Railway Hosting (Go API & n8n):** Railway menawarkan paket "Hobby" yang dimulai dari **$5/bulan**. Karena Go sangat efisien dalam penggunaan sumber daya, API Anda hampir tidak akan menyentuh batas penggunaan. Jika Anda juga meng-host container Docker n8n dan PostgreSQL (untuk data n8n) di Railway, RAM yang digunakan akan sedikit lebih banyak, namun totalnya akan tetap nyaman di kisaran **$5 hingga $10/bulan** untuk skala mini.
* **Database (MongoDB):** Anda dapat menggunakan **MongoDB Atlas Free Tier (M0)**. Paket ini memberikan penyimpanan 512MB, yang mana lebih dari cukup untuk menampung ribuan pengguna, produk, dan pesan chat pada tahap awal produksi. **Biaya: $0/bulan**.

## 2. Web Frontend
* **Hosting (React/Vite):** Karena frontend Anda adalah aplikasi React statis, Anda tidak perlu meng-host-nya di Railway. Anda bisa melakukan deploy ke **Vercel, Netlify, atau Cloudflare Pages** menggunakan paket gratis (free tier) mereka. **Biaya: $0/bulan**.
* **Custom Domain:** Agar terlihat profesional (misalnya `dagangly.com` atau `dagangly.id`), Anda membutuhkan nama domain. **Biaya: ~$10 hingga $15/tahun**.

## 3. Mobile App (Android)
* **Google Play Store:** Untuk mempublikasikan aplikasi Android Anda (file AAB), Google mewajibkan pembuatan akun Developer. Ini adalah biaya **$25 sekali bayar** (one-time fee). Tidak ada biaya bulanan atau tahunan untuk Android.
* **Toko Aplikasi Alternatif (Opsional):** Seperti yang dicatat dalam `PLAY_STORE_RELEASE_CHECKLIST.md`, Anda juga dapat mendistribusikan APK secara gratis via direct download, Samsung Galaxy Store, atau APKPure. **Biaya: $0**.
* **Expo/EAS Builds:** Paket gratis Expo memungkinkan Anda mem-build aplikasi di cloud (hingga 30 build gratis per bulan). Untuk skala mini-produksi, ini biasanya sudah sangat cukup. **Biaya: $0/bulan**.
* *(Catatan: Apple App Store (iOS) membutuhkan biaya $99/tahun, namun kita asumsikan hanya Android untuk saat ini).*

## 4. Third-Party APIs & Services
* **Google Maps API:** Digunakan untuk fitur penjual terdekat (nearby sellers). Google memberikan **kredit bulanan gratis sebesar $200**. Aplikasi skala mini akan dengan mudah berada di bawah batas limit ini. **Biaya: $0/bulan**.
* **Email / SMTP:** Workflow n8n Anda menggunakan Gmail App Passwords untuk SMTP. **Biaya: $0**.
* **AI Image Generation & Enhancements:** Layanan seperti Claid atau Pollinations biasanya menawarkan paket gratis yang cukup besar. Selama Anda menjaga limit harian (`PRODUCT_ENHANCE_DAILY_LIMIT=20`), Anda belum perlu mengeluarkan biaya di sini. **Biaya: $0**.

---

## Ringkasan Biaya (Estimasi Tahun Pertama)

| Kategori | Tipe Biaya | Jumlah |
| :--- | :--- | :--- |
| **Google Play Console** | Sekali Bayar | **$25** |
| **Nama Domain** | Tahunan | **~$15/tahun** |
| **Railway (Backend & n8n)** | Bulanan | **~$5 - $10/bulan** |
| **MongoDB Atlas** | Bulanan | **$0** (Free Tier) |
| **Frontend Hosting** | Bulanan | **$0** (Free Tier) |
| **External APIs (Maps, SMTP)**| Bulanan | **$0** (Free Tier) |

### Total Estimasi Anggaran:
* **Biaya Awal / Total Tahun Pertama:** ~$100 hingga $160 untuk satu tahun penuh.
* **Biaya Bulanan Berjalan:** Hanya sekitar **~$5 hingga $10**.

---

**Tips Pro untuk Railway:** 
Untuk memaksimalkan anggaran Railway Anda, atur batas memori yang ketat pada container n8n Anda, karena Node.js/n8n akan memakan RAM yang jauh lebih besar dibandingkan aplikasi Go Anda. Server Go itu sendiri bisa berjalan dengan sangat nyaman hanya dengan sebagian kecil CPU dan RAM 128MB.