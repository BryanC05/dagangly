# Seller Dashboard & Analytics Unification Changelog

This document outlines the major architectural changes, additions, and cleanups performed during the unification of the Seller Analytics and Dashboard systems across both Web (React) and Mobile (React Native) platforms.

---

## 1. Backend API Additions (`backend/`)
To support the new centralized dashboard experience, new API endpoints were added to manage seller payout details securely.

### **Additions**
- **Wallet Handlers (`internal/handlers/wallet.go`)**
  - Added `PUT /wallet/bank-account`: Allows sellers to save or update their payout bank details (Bank Name, Account Number, Account Holder Name).
  - Added `DELETE /wallet/bank-account`: Allows sellers to safely remove their saved bank details.
- **Router Configuration (`cmd/server/main.go`)**
  - Registered the new `PUT` and `DELETE` bank-account endpoints under the protected `/wallet` route group.

---

## 2. Web Frontend (`frontend/`)
The goal was to merge the advanced, interactive "Finance Theme" analytics directly into the main Seller Dashboard, creating a single "Command Center" for sellers.

### **Additions & Modifications**
- **Unified `SellerDashboard.jsx`:**
  - **Recharts Integration**: Injected the interactive `AreaChart` to display the 7/30/90-day revenue trend directly on the dashboard.
  - **Financial Stat Cards**: Added high-contrast, premium stat cards for Gross Volume, Total Orders, Active SKUs, and Avg Rating.
  - **Customer Retention**: Added the "New vs. Returning Customers" data visualization block.
  - **AI Financial Advisor Terminal**: Integrated the Bloomberg-style AI chat terminal directly into the dashboard layout so sellers can query data without leaving the page.
  - **Payout Settings (Bank Management)**: Added a new UI block that queries the `/wallet` API. It includes a robust modal to Add, Edit, or Remove Bank Account details (supporting BCA, BNI, BRI, Mandiri).
  - **Query Integration**: Added the `useSellerAnalyticsStore` fetches and a new `useQuery` for the wallet data.

### **Deletions (Cleanup)**
- **Deleted `SellerAnalytics.jsx`**: The standalone analytics page was completely removed as it was redundant.
- **Removed Route**: Deleted the `<Route path="/seller-analytics" />` from `App.jsx`.
- **Removed Navigation Link**: Removed the standalone "Analitik" dropdown menu item from `Navbar.jsx`.

---

## 3. Mobile Frontend (`mobile/`)
The mobile app was updated to match the new web capabilities, optimized for mobile screens and performance.

### **Additions & Modifications**
- **Unified `SellerDashboardScreen.js`:**
  - **Backend Sync**: Switched the dashboard from manually calculating stats on the frontend to fetching the real, pre-calculated data from the `/analytics/seller` endpoint.
  - **Top Stats Grid**: Built a robust, grid-based layout for the core metrics (Products, Revenue, Orders, Pending).
  - **Customer Retention**: Added the New vs. Returning customer data blocks.
  - **Payout Settings (Bank Management)**: Brought the Bank Account management block to mobile. Includes a sleek slide-up modal to input and save Bank Name, Account Number, and Account Holder Name via the new backend endpoints.
  - **AI Consultant Terminal Widget**: Added an `AI_ADVISOR_TERMINAL` widget. To accommodate mobile keyboards and prevent scroll conflicts, this acts as a stylish launchpad button that navigates to the full-screen `AIConsultantScreen`.
  - **Refined Quick Actions**: Restyled the Add Product, Manage Inventory, and Logo Generator buttons to match the premium, high-contrast theme.

### **Deletions (Cleanup)**
- **Deleted `SellerAnalyticsScreen.js`**: The standalone mobile analytics screen was removed.
- **Removed Route**: Deleted the `SellerAnalytics` route from the `ProfileStack` in `AppNavigator.js`.
- **Removed Navigation Link**: Removed the "Analytics" menu list item from `ProfileScreen.js`.

---

## Summary
By combining the operational controls (inventory management, order updates) with advanced financial reporting (Recharts, AI Advisor) and payout management (Bank Settings), the Seller Dashboard is now a fully comprehensive **Command Center** on both web and mobile.
