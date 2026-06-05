# 🛍️ Dagangly (MSME Marketplace)

Dagangly is a comprehensive, multi-platform e-commerce ecosystem designed to connect local buyers with Micro, Small, and Medium Enterprises (MSMEs/UMKM). 

The platform provides robust tools for sellers to manage their business, automate workflows, and reach customers, while offering buyers a highly accessible, modern, and secure shopping experience.

---

## 🌟 100% Production Ready

The Dagangly platform has achieved full production readiness across all environments (Backend, Web, and Mobile). The recent architectural overhaul included a complete rewrite of the backend, the implementation of robust hybrid authentication, and 100% feature parity between the web and mobile applications.

### 🔐 Hybrid Authentication (Firebase + JWT)
- **Seamless Login:** Users can authenticate using traditional Email/Password or **Google Social Login** via Firebase.
- **Unified Security:** Whether authenticating manually or via Google, the Go backend verifies the credentials and issues a secure, standardized JWT.
- **Cross-Platform Support:** Fully implemented with clean, user-friendly error handling on both the React Web App and the React Native Mobile App.

### 🛒 Core Commerce & Order Management
- **Scheduled Delivery Orders:** Buyers can request specific delivery dates and times. Includes a full negotiation flow allowing sellers to accept, decline, or request changes to the schedule.
- **Payment Processing:** Manual payment verification system supporting **Cash on Delivery (COD)** and **QRIS**. Buyers can upload proof-of-transfer screenshots directly within the order panel for seller approval.
- **Digital Wallet & Installments:** Users have an in-app digital wallet for quick checkouts and refunds, plus Buy Now Pay Later (BNPL) installment options (3, 6, 12 months).
- **Review & Rating System:** Comprehensive rating system for both products and sellers, verified by delivered orders.
- **Cart Abandonment Recovery:** Automated system to track and remind users of abandoned carts (1h, 24h).

### 🏪 Seller Tools & Full Admin Panel
- **Business Registration Flow:** Seamless onboarding process requiring Admin approval before a user is granted Seller privileges.
- **Advanced Analytics & Inventory:** Sellers get access to a rich dashboard showing revenue, top products, and low-stock alerts.
- **Mobile Admin Parity:** System administrators can manage memberships, business registrations, user bans, and resolve order disputes directly from the mobile app.

### 🤖 Automation Engine (n8n Integration)
- **Workflow Automation:** Fully integrated with **n8n** (running via Docker) to automate seller tasks.
- **Transactional Emails:** Automated Order Confirmations, Status Updates, and Low Inventory alerts sent via Gmail SMTP or SendGrid.
- **Instagram Auto-Posting:** Sellers can link their Instagram accounts (via Meta Graph API). New product listings can automatically post to their Instagram feed, utilizing ImgBB for robust image binary handling.

### 💬 Communication & Community
- **Video Call Consultations:** 1:1 WebRTC-powered (Jit.si) video calls directly between buyers and sellers for product demonstrations.
- **Real-Time Chat:** WebSocket-powered chat rooms for order discussions and direct buyer-seller messaging.
- **WhatsApp Integration:** Direct "WhatsApp Seller" buttons dynamically generated on product and store pages.
- **Social Media Hub:** Both buyers and sellers can attach auto-detected social media links (TikTok, IG, Twitter, WhatsApp) to their profiles and store pages.

### ♿ Accessibility & UX Transformations
- **Low Digital Literacy Support:** Implementation of a "Simple Mode", enlarged touch targets, simplified bottom navigation, and an intuitive visual onboarding tour.
- **WCAG Compliance:** Full Screen Reader support (ARIA labels), keyboard navigation, color contrast compliance, and reduced motion capabilities.
*(Note: Experimental Voice Search features were removed to simplify the codebase and improve app performance).*

---

## 💻 Tech Stack & Architecture

### Backend & Database
- **Language:** Go (Golang) 1.24+ with Gin framework. (Successfully migrated from Node.js/Express).
- **Authentication:** Firebase Admin SDK (for token verification) + Custom JWT.
- **Databases:** 
  - **MongoDB:** Main application data (Users, Products, Orders, Wallets).
  - **Redis:** Caching and WebSocket pub/sub.
  - **PostgreSQL:** Dedicated persistence for the n8n workflow engine.

### Frontend (Web)
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS + shadcn/ui
- **Features:** Firebase Web SDK, PWA Support, Responsive Design, Accessibility-First.

### Mobile App
- **Framework:** React Native (Expo)
- **Distribution:** Configured for Android EAS Build (APK & AAB), Ready for Google Play Store.
- **Features:** Firebase Native SDK (Modular v22+), Google Maps integration for nearby sellers, Push Notifications.

---

## 🏗️ Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Go 1.24+
- MongoDB & Redis running locally or via Cloud (Atlas/Upstash)

### 1. Start the Automation Engine (n8n & Postgres)
```bash
docker-compose up -d
```
*n8n will be available at http://localhost:5678*

### 2. Start the Backend (Go)
Create a `.env` in the `backend/` directory (see `backend/.env.example`).
```bash
cd backend
go run ./cmd/server/main.go
```
*API running at http://localhost:5000*

### 3. Start the Web Frontend
Create a `.env` in the `frontend/` directory (see `frontend/.env.example`).
```bash
cd frontend
npm install
npm run dev
```
*Web App running at http://localhost:5173*

### 4. Start the Mobile App
Ensure `mobile/.env` is configured with `EXPO_PUBLIC_API_HOST` and `EXPO_PUBLIC_USE_FIREBASE_AUTH=true`.
```bash
cd mobile
npm install
npx expo start --clear
```
*(Note: To test Google Social Login on mobile, you must use a Native Development Build via `npx expo run:android` or `npx expo run:ios`, as it is not supported in the standard Expo Go app).*

---

## 📚 Project Documentation

For detailed implementation instructions, troubleshooting, and architecture guides, refer to the following specialized documentation files:

- `PRODUCTION_CHECKLIST.md` - The master sign-off sheet proving 100% feature completion.
- `GOLANG_MIGRATION_PLAN.md` & `GOLANG_MIGRATION_PROGRESS.md` - Details of the backend rewrite.
- `N8N_WORKFLOW_GUIDE.md` - Complete setup guide for n8n, webhooks, and SMTP.
- `mobile/PLAY_STORE_RELEASE_CHECKLIST.md` - Guide to EAS builds, Play Store forms, and Google Maps setup.

---

## 🛡️ Security Notes
- Ensure `WEBHOOK_SECRET` is changed in production environments to secure n8n callbacks.
- Secure your n8n UI with basic authentication (`N8N_BASIC_AUTH_ACTIVE=true`).
- **Firebase Security:** Make sure to restrict your Firebase API Keys in the Google Cloud Console to your specific Vercel domains and Android App package names.