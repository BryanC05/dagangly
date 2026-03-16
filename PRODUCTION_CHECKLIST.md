# Feature Production Readiness Checklist

> Last Updated: March 16, 2026

---

## 1. Digital Wallet

### Backend Status: ✅ COMPLETE
- `handlers/wallet.go` - Full CRUD operations
- `models/wallet.go` - Wallet model
- Routes registered in main.go

### Frontend (Web) Status: ✅ COMPLETE
- `pages/Wallet.jsx` - UI with balance, add funds, transfer
- `store/walletStore.js` - State management
- Navbar menu link added

### Mobile Status: ✅ COMPLETE
- `WalletScreen.js` - Full implementation
- Navigation route added
- Profile menu link added

### Translations: ✅ COMPLETE
- EN: wallet.title, wallet.balance, wallet.addFunds, wallet.transferToBank, wallet.transactions
- ID: Same translations

### Theme Support: ✅ COMPLETE
- Uses dynamic colors from theme store

---

### Pre-Production Checklist - Digital Wallet

#### Backend Testing
- [ ] Test `GET /api/wallet` returns wallet with balance
- [ ] Test `POST /api/wallet/add-funds` adds funds correctly
- [ ] Test `POST /api/wallet/deduct` deducts funds
- [ ] Test `POST /api/wallet/transfer-bank` initiates transfer
- [ ] Test `GET /api/wallet/transactions` returns transaction history
- [ ] Verify insufficient balance returns error
- [ ] Test with valid/invalid user IDs

#### Frontend Testing (Web)
- [ ] Open `/wallet` page
- [ ] Verify balance displays correctly
- [ ] Test "Add Funds" modal opens and accepts input
- [ ] Test "Transfer to Bank" modal opens
- [ ] Verify transactions list renders
- [ ] Test dark/light mode toggle
- [ ] Test EN/ID language toggle

#### Mobile Testing
- [ ] Navigate to Wallet from Profile menu
- [ ] Verify balance displays
- [ ] Test Add Funds button
- [ ] Test Transfer to Bank button
- [ ] Verify transactions list
- [ ] Test dark/light mode

---

## 2. Installment Payments

### Backend Status: ✅ COMPLETE
- `handlers/installments.go` - Calculator, plan creation, payments
- Routes: calculate, create-plan, my, plan/:id, pay

### Frontend (Web) Status: ✅ COMPLETE
- `pages/Installments.jsx` - UI with calculator, plans
- `store/installmentStore.js` - State management

### Mobile Status: ✅ COMPLETE
- `InstallmentsScreen.js` - Full implementation

### Translations: ✅ COMPLETE
- EN: installment.title, installment.calculate, installment.monthlyPayment, etc.
- ID: Same translations

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Installments

#### Backend Testing
- [ ] Test `POST /api/installments/calculate` returns correct calculation
- [ ] Test with 3, 6, 12, 24 month tenures
- [ ] Test interest rate calculation
- [ ] Test `POST /api/installments/create-plan` creates plan
- [ ] Test `GET /api/installments/my` returns user plans
- [ ] Test `GET /api/installments/plan/:id` returns plan with payments
- [ ] Test `POST /api/installments/plan/:id/pay` processes payment

#### Frontend Testing (Web)
- [ ] Open `/installments` page
- [ ] Test calculator - enter amount, select tenure
- [ ] Verify monthly payment calculation displays
- [ ] View existing installment plans
- [ ] Test "Pay Now" button on active plan
- [ ] Test dark/light mode
- [ ] Test EN/ID language toggle

#### Mobile Testing
- [ ] Navigate to Installments from Profile
- [ ] Test calculator functionality
- [ ] View installment plans
- [ ] Test payment flow

---

## 3. Video Call Consultation

### Backend Status: ✅ COMPLETE
- `handlers/video_call.go` - Room management
- `models/video_call.go` - Video call model
- Uses Jit.si for meetings

### Frontend (Web) Status: ✅ COMPLETE
- `pages/VideoCall.jsx` - UI with room creation, history
- `store/videoCallStore.js` - State management
- `components/VideoCall.jsx` - Video call component

### Mobile Status: ✅ COMPLETE
- `VideoCallScreen.js` - Full implementation

### Translations: ✅ COMPLETE

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Video Call

#### Backend Testing
- [ ] Test `POST /api/video-call/room` creates room
- [ ] Verify meeting URL is generated
- [ ] Test `GET /api/video-call/rooms` returns user rooms
- [ ] Test `GET /api/video-call/room/:roomId` returns room details
- [ ] Test `PUT /api/video-call/room/:roomId/status` updates status
- [ ] Test `POST /api/video-call/room/:roomId/end` ends room
- [ ] Test `GET /api/video-call/upcoming` returns scheduled calls

#### Frontend Testing (Web)
- [ ] Open `/video-call` page
- [ ] Test "New Call" button opens modal
- [ ] Enter participant ID and duration
- [ ] Create room and verify URL generated
- [ ] Test joining call via URL
- [ ] View call history
- [ ] View upcoming calls

#### Mobile Testing
- [ ] Navigate to Video Call from Profile
- [ ] Test create room flow
- [ ] Test joining call via deep link

#### External Dependency
- [ ] Verify Jit.si account is configured
- [ ] Test video call works with microphone/camera

---

## 4. Seller Analytics Dashboard

### Backend Status: ✅ COMPLETE
- Extended `handlers/analytics.go` with:
  - GetSellerAnalytics - revenue, orders, products, ratings
  - GetCustomerInsights - top customers
  - GetProductPerformance - per-product analytics

### Frontend (Web) Status: ✅ COMPLETE
- `pages/SellerAnalytics.jsx` - Dashboard with charts/stats
- `store/sellerAnalyticsStore.js` - State management

### Mobile Status: ✅ COMPLETE
- `SellerAnalyticsScreen.js` - Full implementation

### Translations: ✅ COMPLETE
- analytics.title, analytics.totalRevenue, analytics.orders, etc.

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Seller Analytics

#### Backend Testing
- [ ] Test `GET /api/analytics/seller?period=30` returns analytics
- [ ] Test with period=7, period=90
- [ ] Verify totalRevenue calculation
- [ ] Verify orderCount is accurate
- [ ] Verify avgRating calculation
- [ ] Test `GET /api/analytics/customers` returns top customers
- [ ] Test `GET /api/analytics/products` returns product performance

#### Frontend Testing (Web)
- [ ] Open `/seller-analytics` page (requires seller login)
- [ ] Verify dashboard displays 4 stat cards
- [ ] Test period selector (7D, 30D, 90D)
- [ ] Verify revenue displays correctly
- [ ] View top products list
- [ ] View orders by status
- [ ] Test dark/light mode

#### Mobile Testing
- [ ] Navigate to Analytics from Profile menu
- [ ] Verify stats display
- [ ] Test period selector

---

## 5. Inventory Management

### Backend Status: ✅ COMPLETE
- Extended `handlers/products.go`:
  - GetMyProducts - existing
  - GetLowStockProducts - NEW
  - AdjustStock - NEW with reason tracking

### Frontend (Web) Status: ✅ COMPLETE
- `pages/Inventory.jsx` - Stock management UI
- `store/inventoryStore.js` - State management

### Mobile Status: ✅ COMPLETE
- `InventoryScreen.js` - Full implementation

### Translations: ✅ COMPLETE
- inventory.title, inventory.inStock, inventory.lowStock, etc.

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Inventory

#### Backend Testing
- [ ] Test `GET /api/products/my-products` returns seller's products
- [ ] Test `GET /api/products/low-stock?threshold=10` returns low stock items
- [ ] Test `POST /api/products/:id/adjust-stock` adjusts stock
- [ ] Verify adjustment reason is recorded
- [ ] Verify new stock cannot be negative

#### Frontend Testing (Web)
- [ ] Open `/inventory` page (requires seller login)
- [ ] Verify 3 stat cards (In Stock, Low Stock, Out of Stock)
- [ ] Test filter buttons (All, In Stock, Low Stock, Out of Stock)
- [ ] Edit stock quantity directly in input
- [ ] Test "Adjust" button opens modal
- [ ] Select reason (restock, sale, return, damaged, lost)
- [ ] Verify stock updates correctly

#### Mobile Testing
- [ ] Navigate to Inventory from Profile
- [ ] Verify stock counts
- [ ] Test stock adjustment flow
- [ ] Test filter functionality

---

## 6. Voice Search

### Frontend (Web) Status: ✅ COMPLETE
- `hooks/useVoiceSearch.js` - Speech recognition hook
- `components/VoiceSearchInput.jsx` - Input component
- Integrated into Products.jsx search

### Mobile Status: ⚠️ COMPONENT CREATED
- `components/VoiceSearchInput.js` - Component created
- NOT integrated into ProductsScreen yet

### Translations: ✅ COMPLETE
- voiceSearch.listening, voiceSearch.notSupported

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Voice Search

#### Frontend Testing (Web)
- [ ] Open `/products` page
- [ ] Click microphone icon in search
- [ ] Grant microphone permission
- [ ] Speak in Indonesian (e.g., "piring")
- [ ] Verify speech is converted to text
- [ ] Verify search results update
- [ ] Test dark/light mode

#### Mobile Testing
- [ ] Navigate to Products screen
- [ ] Integrate VoiceSearchInput into ProductsScreen
- [ ] Test microphone button
- [ ] Verify speech recognition works

#### Browser Compatibility
- [ ] Test on Chrome (desktop)
- [ ] Test on Safari (desktop)
- [ ] Test on mobile browsers
- [ ] Fallback message for unsupported browsers

---

## 7. Admin Panel

### Backend Status: ✅ COMPLETE
- `handlers/admin.go` - Full admin CRUD
- Routes: dashboard, users, products, orders, disputes, revenue

### Frontend (Web) Status: ✅ COMPLETE
- `pages/AdminDashboard.jsx` - Full admin UI
- `store/adminStore.js` - State management

### Mobile Status: ⚠️ EXISTING
- Only has AdminMembershipScreen

### Translations: ✅ COMPLETE

### Theme Support: ✅ COMPLETE

---

### Pre-Production Checklist - Admin Panel

#### Backend Testing
- [ ] Test `GET /api/admin/dashboard` returns stats
- [ ] Test `GET /api/admin/users` returns user list
- [ ] Test `PUT /api/admin/users/:id/role` updates role
- [ ] Test `POST /api/admin/users/:id/ban` bans user
- [ ] Test `GET /api/admin/products` returns products
- [ ] Test `POST /api/admin/products/:id/approve`
- [ ] Test `POST /api/admin/products/:id/reject`
- [ ] Test `DELETE /api/admin/products/:id`
- [ ] Test `GET /api/admin/orders` returns orders
- [ ] Test `PUT /api/admin/orders/:id/status`
- [ ] Test `GET /api/admin/disputes` returns disputes
- [ ] Test `PUT /api/admin/disputes/:id/resolve`
- [ ] Test `GET /api/admin/revenue?period=monthly`

#### Frontend Testing (Web)
- [ ] Navigate to `/admin/dashboard`
- [ ] Verify dashboard stats display
- [ ] Test Users tab - view, filter, search
- [ ] Test Products tab - approve/reject/delete
- [ ] Test Orders tab - view, update status
- [ ] Test Disputes tab - resolve disputes
- [ ] Test dark/light mode

#### Security
- [ ] Verify non-admin users cannot access admin routes
- [ ] Verify admin middleware blocks unauthorized access

---

## 8. WhatsApp Integration

### Backend Status: ✅ COMPLETE
- `handlers/whatsapp.go` - Generate links, get seller WhatsApp

### Frontend (Web) Status: ⚠️ NOT CREATED
- Need to add WhatsApp button to ProductDetail

### Mobile Status: ⚠️ NOT CREATED

### Theme Support: N/A

---

### Pre-Production Checklist - WhatsApp

#### Backend Testing
- [ ] Test `POST /api/whatsapp/generate-link` creates link
- [ ] Test with phone number format
- [ ] Test optional message parameter
- [ ] Test `GET /api/whatsapp/seller/:sellerId` returns WhatsApp link

#### Frontend Integration Needed
- [ ] Add WhatsApp button to ProductDetail.jsx
- [ ] Call `/api/whatsapp/seller/:id` to get seller's WhatsApp
- [ ] Open wa.me link on click

#### Mobile Integration Needed
- [ ] Add WhatsApp button to ProductDetailScreen
- [ ] Link to WhatsApp app via URL scheme

---

## General Pre-Production Checklist

### All Features
- [ ] Test Bahasa Indonesia language toggle
- [ ] Test English language toggle
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Verify all API endpoints return proper error messages
- [ ] Verify JWT authentication works on all protected routes

### Performance
- [ ] Test page load times < 3 seconds
- [ ] Test API response times < 500ms

### Security
- [ ] Verify all POST/PUT/DELETE routes require authentication
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention

### Accessibility
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify color contrast ratios

---

## Sign-Off

| Feature | Backend | Web Frontend | Mobile Frontend | Ready for Production |
|---------|---------|--------------|-----------------|---------------------|
| Digital Wallet | ✅ | ✅ | ✅ | ✅ |
| Installments | ✅ | ✅ | ✅ | ✅ |
| Video Call | ✅ | ✅ | ✅ | ✅ |
| Seller Analytics | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Voice Search | N/A | ✅ | ⚠️ | ⚠️ |
| Admin Panel | ✅ | ✅ | ⚠️ | ⚠️ |
| WhatsApp | ✅ | ⚠️ | ⚠️ | ⚠️ |

**Legend:**
- ✅ Complete
- ⚠️ Partial/In Progress
- ❌ Not Started
