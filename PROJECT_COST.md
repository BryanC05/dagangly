# 💰 Production Cost Analysis & Estimates

This document details the expected costs for running **Dagangly** in a real-world production environment. The architecture is highly optimized for cost-efficiency, leveraging the lightweight Go backend and generous free tiers for external services.

## 1. Hosting & Infrastructure

### 🚀 Backend Server (Railway)
*   **Technology:** Go (Golang) API
*   **Cost Expectation:** **~$5.00/month**
*   **Details:** Railway charges based on actual CPU and RAM usage. Because the backend was migrated to Go, it is incredibly memory-efficient (typically hovering around 20MB - 50MB of RAM). A standard "Hobby" plan minimum deposit covers this easily for a small-to-medium scale marketplace.

### 🌐 Frontend Web App (Vercel / Netlify / Cloudflare Pages)
*   **Technology:** React.js (Vite)
*   **Cost Expectation:** **$0.00/month**
*   **Details:** The frontend is a static bundle of HTML/CSS/JS that simply talks to your Go backend. All major platforms offer extremely generous free tiers for static frontend hosting (usually 100GB+ of bandwidth per month for free).

### 🤖 Automation Engine (n8n on Railway)
*   **Technology:** Node.js (n8n Docker Container)
*   **Cost Expectation:** **~$5.00 - $10.00/month**
*   **Details:** Unlike the Go backend, n8n is a heavy Node.js application. If you host it on Railway alongside your Go app, it will consume significantly more RAM. 

## 2. Databases & Storage

### 🗄️ Primary Database (MongoDB Atlas)
*   **Technology:** MongoDB
*   **Cost Expectation:** **$0.00/month** (Initially) -> **$9.00+/month** (Scaling)
*   **Details:** The `M0 Free Tier` provides 512MB of storage, which is enough to handle thousands of users and products. When you outgrow this, the Serverless (`$0.10/million reads`) or Dedicated (`M10 - ~$9/mo`) plans are required.

### 🗃️ Automation Database (Railway PostgreSQL)
*   **Technology:** PostgreSQL
*   **Cost Expectation:** **~$1.00 - $3.00/month**
*   **Details:** Used exclusively to store n8n workflows and execution logs. Storage and memory footprint is minimal.

### 🖼️ Image Storage (Firebase Storage / AWS S3)
*   **Technology:** Cloud Object Storage
*   **Cost Expectation:** **$0.00/month**
*   **Details:** Firebase Storage provides 5GB of free storage and 1GB/day of bandwidth. This is sufficient for thousands of product images before incurring a few cents per gigabyte on the "Blaze" plan.

## 3. Third-Party Services & APIs

### 🔐 Authentication (Firebase Auth)
*   **Technology:** Google Identity Platform
*   **Cost Expectation:** **$0.00/month**
*   **Details:** Firebase Authentication (Email/Password and Google Social Login) is **100% free with unlimited MAUs (Monthly Active Users)**.

### 🗺️ Geolocation (Google Maps API)
*   **Technology:** Google Maps SDK (Android/Web)
*   **Cost Expectation:** **$0.00/month**
*   **Details:** Google provides a **$200 free monthly credit**. This covers roughly 100,000 map loads per month. Unless Dagangly becomes massively popular overnight, you will not pay a dime.

### 💳 Payment Gateway (Midtrans)
*   **Technology:** Midtrans Payment API
*   **Cost Expectation:** **Transaction Based (No monthly fee)**
*   **Details:** Midtrans does not charge monthly fees. They take a percentage cut of successful transactions:
    *   **QRIS / GoPay / ShopeePay:** ~0.7% to 2% per transaction.
    *   **Virtual Accounts (Bank Transfer):** Flat fee of ~Rp 4,000 per transaction.

### 📧 Transactional Emails (Gmail SMTP / SendGrid)
*   **Cost Expectation:** **$0.00/month**
*   **Details:** SendGrid offers 100 free emails/day. Using Gmail App Passwords via n8n provides 500 free emails/day.

### ✨ AI Services (Claid.ai / Pollinations)
*   **Cost Expectation:** **$0.00/month**
*   **Details:** The current implementation uses the free tiers and rate-limits requests on the backend to avoid hitting paid tiers accidentally.

## 4. Mobile App Distribution

### 📱 Android Play Store
*   **Cost Expectation:** **$25.00 (One-time fee)**
*   **Details:** Google charges a single lifetime fee to open a Developer Account. After that, you can publish unlimited updates and apps.
*   *(Apple App Store for iOS requires a recurring $99/year fee).*

## 📊 Summary Estimate (First Year)

| Category | Type | Estimated Cost |
| :--- | :--- | :--- |
| **Google Play Developer Account** | One-Time | **$25.00** |
| **Custom Domain Name (`.com` / `.id`)** | Annual | **~$15.00/year** |
| **Railway (Go Backend + n8n + DBs)** | Monthly | **~$10.00 - $15.00/month** |
| **Frontend Hosting & Auth** | Monthly | **$0.00** (Generous Free Tiers) |
| **External APIs (Maps, Storage)**| Monthly | **$0.00** (Covered by Free Tiers) |
| **Payments** | Per Transaction | **~1.5% cut from sales** |

**🔥 Total Operating Budget:** 
You can confidently run and scale the Dagangly marketplace for **less than $20 a month** in direct server costs, with a ~$40 upfront cost for your domain and Android developer license.