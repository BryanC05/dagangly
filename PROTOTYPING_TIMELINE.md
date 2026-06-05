# Timeline of Prototyping, Action Plan & Output

This document outlines the structured timeline and action plan executed to bring the Dagangly (MSME Marketplace) from concept to a 100% production-ready prototype.

---

## Phase 1: Architecture & Foundation (Weeks 1-2)
Goal: Establish a scalable, multi-platform ecosystem capable of handling e-commerce transactions and real-time communications.

### Action Plan
1. Backend Overhaul: Migrate the initial Node.js/Express backend to a high-performance Go (Golang) infrastructure.
2. Database Design: Structure MongoDB collections for Users, Products, Orders, and Wallets. Introduce Redis for caching.
3. Authentication Blueprint: Implement a dual-layer authentication system combining custom JWTs for internal routes and Firebase Admin SDK for seamless Social Logins.
4. Frontend Scaffolding: Set up Vite + React for the Web, and Expo + React Native for Mobile.

### Output
- A blazing-fast Go API running on port 5000.
- GOLANG_MIGRATION_PLAN.md documenting the successful transition.
- Secure, shared API routes that both Web and Mobile platforms can consume.

---

## Phase 2: Core Commerce & Payments (Weeks 3-4)
Goal: Build the essential buying and selling features required for an MVP marketplace.

### Action Plan
1. Product Management: Implement CRUD operations for sellers to list products, add variants, and track inventory.
2. Cart & Checkout: Build the shopping cart logic, including location-based distance validation for delivery vs. pickup.
3. Payment Processing: Implement a manual payment verification system supporting Cash on Delivery (COD) and QRIS. Build the OrderPaymentPanel allowing buyers to upload payment proof screenshots for seller verification.
4. Digital Wallet & Installments: Develop a robust ledger system for the in-app wallet and logic to calculate multi-month (BNPL) installment plans.

### Output
- Fully functional shopping cart and multi-step checkout UI.
- Manual payment processing with proof-of-transfer uploads.
- Order tracking system with visual timelines.

---

## Phase 3: Seller Tools, Automation & AI (Weeks 5-6)
Goal: Empower MSMEs with professional tools previously only available to large enterprises.

### Action Plan
1. Workflow Automation (n8n): Deploy a localized n8n Docker container. Build webhooks in Go to trigger automated emails (Gmail SMTP) for order confirmations and low-stock alerts.
2. AI Asset Generation: Integrate Pollinations AI for free logo generation and Claid.ai for professional product image background removal/enhancement.
3. AI Copywriting: Connect the Groq API (Llama 3) to generate SEO-friendly product descriptions instantly.
4. Social Media Connectivity: Implement Meta Graph API connections to allow sellers to auto-post their new products directly to Instagram.

### Output
- n8n-custom-nodes and docker-compose.yml defining the automation engine.
- An Automation Dashboard for sellers to toggle their workflows.
- One-click AI buttons on the product creation forms.

---

## Phase 4: Platform Parity, Admin & Real-time (Weeks 7-8)
Goal: Ensure 100% feature parity between Web and Mobile, and finalize administrative controls.

### Action Plan
1. Real-Time Communications: Implement WebSockets for live buyer-seller chat and integrate Jit.si for 1:1 video call consultations.
2. Mobile Admin Dashboard: Build out the missing React Native screens (AdminDashboardScreen, AdminRegistrationsScreen, AdminDisputesScreen) to allow admins to manage the platform on the go.
3. WhatsApp Integration: Add dynamic "Chat on WhatsApp" buttons linking directly to seller phones (wa.me).
4. UX & Accessibility Sweep: Refine color contrasts, add screen-reader ARIA labels, and remove experimental/buggy features (e.g., Voice Search) to ensure a smooth, lag-free experience (like removing CSS blurs).

### Output
- Real-time messaging interface on both platforms.
- PRODUCTION_CHECKLIST.md completely checked off (100% Readiness).
- A unified, highly accessible UI adhering to strict WCAG standards.

---

## Phase 5: Deployment & Launch Strategy (Current)
Goal: Move the prototype from local development to production environments.

### Action Plan
1. Infrastructure Provisioning: 
    - Deploy the Go Backend and MongoDB to Railway.
    - Deploy the React Web app to Vercel.
2. Security & Secrets: Configure production .env files. Ensure Firebase API keys and Webhook Secrets are injected securely and bound by Content Security Policies (CSP).
3. Mobile Distribution: Run EAS Builds (npx expo run:android) to generate production AAB files.
4. Google Play Registration: Pay the $25 developer fee and submit the app for review using the PLAY_STORE_RELEASE_CHECKLIST.md.

### Output
- Live, accessible web URLs (e.g., dagangly.vercel.app).
- Downloadable Android APK/AAB files.
- PROJECT_COST.md detailing the highly-efficient ~$20/month operating budget.
