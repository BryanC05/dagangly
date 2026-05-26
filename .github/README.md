# 🛍️ Dagangly (MSME Marketplace)

Dagangly is a comprehensive, multi-platform e-commerce ecosystem designed to connect local buyers with Micro, Small, and Medium Enterprises (MSMEs/UMKM). 

The platform provides robust tools for sellers to manage their business, automate workflows, and reach customers, while offering buyers a highly accessible, modern, and secure shopping experience.

---

## 🚀 Newly Implemented Features & Updates

The platform has recently undergone massive upgrades across all environments (Web, Mobile, and Backend). Here are the key highlights:

### 🛒 Core Commerce & Order Management
- **Scheduled Delivery Orders:** Buyers can request specific delivery dates and times. Includes a full negotiation flow allowing sellers to accept, decline, or request changes to the schedule.
- **Payment Gateway Integration:** Fully integrated with **Midtrans** supporting Credit Cards, Bank Transfers (Virtual Accounts), E-Wallets (GoPay, OVO), and QRIS.
- **Digital Wallet & Installments:** Users have an in-app digital wallet for quick checkouts and refunds, plus Buy Now Pay Later (BNPL) installment options (3, 6, 12 months).
- **Review & Rating System:** Comprehensive rating system for both products and sellers, verified by delivered orders.
- **Cart Abandonment Recovery:** Automated system to track and remind users of abandoned carts (1h, 24h).

### 🏪 Seller Tools & Admin
- **Business Registration Flow:** Seamless onboarding process requiring Admin approval before a user is granted Seller privileges.
- **Advanced Analytics & Inventory:** Sellers get access to a rich dashboard showing revenue, top products, and low-stock alerts.
- **Dynamic UI Components:** Real-time visual feedback including `LiveStockBadge` (urgency indicators), `OrderStatusCountdown`, and `BalanceAnimation`.

### 🤖 Automation Engine (n8n Integration)
- **Workflow Automation:** Fully integrated with **n8n** (running via Docker) to automate seller tasks.
- **Transactional Emails:** Automated Order Confirmations, Status Updates, and Low Inventory alerts sent via Gmail SMTP or SendGrid.
- **Instagram Auto-Posting:** Sellers can link their Instagram accounts (via Meta Graph API). New product listings can automatically post to their Instagram feed, utilizing ImgBB for robust image binary handling.

### 💬 Communication & Community
- **Video Call Consultations:** 1:1 WebRTC-powered video calls directly between buyers and sellers for product demonstrations.
- **WhatsApp Integration:** Direct "Chat on WhatsApp" buttons on product and store pages.
- **Fraud & Scam Reporting:** Built-in reporting system escalating issues to admins via SMTP/SendGrid or Mailto fallbacks.
- **Social Media Hub:** Both buyers and sellers can attach auto-detected social media links (TikTok, IG, Twitter, WhatsApp) to their profiles and store pages.

### ♿ Accessibility & UX Transformations
- **Low Digital Literacy Support:** Implementation of a "Simple Mode", enlarged touch targets, simplified bottom navigation, and an intuitive visual onboarding tour.
- **WCAG Compliance:** Full Screen Reader support (ARIA labels), keyboard navigation, color contrast compliance, and reduced motion capabilities.
- **Voice Search:** Integrated Web Speech API allowing hands-free product discovery.

---

## 💻 Tech Stack & Architecture

### Frontend (Web)
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Features:** PWA Support, Responsive Design, Accessibility-First.

### Mobile App
- **Framework:** React Native (Expo)
- **Distribution:** Configured for Android EAS Build (APK & AAB), Ready for Google Play Store.
- **Features:** Google Maps integration for nearby sellers, Firebase Push Notifications, Biometric login.

### Backend & Database
- **Language:** Go (Golang) with Gin framework.
- **Databases:** 
  - **MongoDB:** Main application data (Users, Products, Orders, Wallets).
  - **PostgreSQL:** Dedicated persistence for the n8n workflow engine.

---

## 🏗️ Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Go 1.20+
- MongoDB running locally or via Atlas

### 1. Start the Automation Engine (n8n & Postgres)
```bash
docker-compose up -d
```
*n8n will be available at http://localhost:5678*

### 2. Start the Backend (Go)
Ensure your `.env` is configured with MongoDB, Midtrans, and Webhook secrets.
```bash
cd backend
go run ./cmd/server
```
*API running at http://localhost:5000*

### 3. Start the Web Frontend
```bash
cd frontend
npm install
npm run dev
```
*Web App running at http://localhost:5173*

### 4. Start the Mobile App
```bash
cd mobile
npm install
npx expo start
```

---

## 📚 Project Documentation

For detailed implementation instructions, troubleshooting, and architecture guides, refer to the following specialized documentation files:

**Feature Implementations:**
- `NEW_FEATURES.md` - Master list of all recent capability additions.
- `IMPLEMENTATION_PLAN.md` - Instagram Auto-posting & Social Links design.
- `SCHEDULED_DELIVERY_PLAN.md` - Buyer-Seller delivery negotiation architecture.
- `docs/BUSINESS_REGISTRATION.md` - Seller onboarding and approval flows.
- `frontend/ACCESSIBILITY_PLAN.md` - UI simplification and WCAG compliance plan.

**Infrastructure & Automation:**
- `N8N_WORKFLOW_GUIDE.md` - Complete setup guide for n8n, webhooks, and SMTP.
- `N8N_IMGBB_SETUP.md` & `N8N_BINARY_UPLOAD.md` - Instagram graph API and image hosting workarounds.
- `IMAGE_UPLOADS_TROUBLESHOOTING.md` - Fixing ephemeral file system 404s and CSP rules.
- `REPORT_SETUP.md` - Email and Webhook configuration for fraud reporting.

**Mobile Release:**
- `mobile/PLAY_STORE_RELEASE_CHECKLIST.md` - Guide to EAS builds, Play Store forms, and Google Maps setup.

---

## 🛡️ Security Notes
- Ensure `WEBHOOK_SECRET` is changed in production environments to secure n8n callbacks.
- Secure your n8n UI with basic authentication (`N8N_BASIC_AUTH_ACTIVE=true`).
- Lock down your `GOOGLEMAPS_API_KEY` strictly to your Android package name (`com.msmemarketplace.mobile`).
