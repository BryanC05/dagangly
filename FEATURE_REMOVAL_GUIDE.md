# Feature Implementation Details & Removal Guide

> Last Updated: March 16, 2026

This document provides detailed information about where each new feature is implemented and how to remove or disable them.

---

## Feature Summary

| Feature | Backend | Web Frontend | Mobile | Status |
|---------|---------|--------------|--------|--------|
| Digital Wallet | ✅ | ✅ | ✅ | Complete |
| Installments | ✅ | ✅ | ✅ | Complete |
| Video Call | ✅ | ✅ | ✅ | Complete |
| Seller Analytics | ✅ | ✅ | ✅ | Complete |
| Inventory | ✅ | ✅ | ✅ | Complete |
| Voice Search | N/A | ✅ | ✅ | Complete |
| Admin Panel | ✅ | ✅ | ⚠️ | Complete |
| WhatsApp | ✅ | ✅ | ✅ | Complete |

---

## 1. Digital Wallet

### Implementation Locations

#### Backend
- `backend/internal/handlers/wallet.go` - Wallet CRUD operations
- `backend/internal/models/wallet.go` - Wallet model
- `backend/cmd/server/main.go` - Route: `walletGroup := r.Group("/wallet")`
- `backend/internal/database/mongo.go` - Index: `wallets` collection

#### Frontend (Web)
- `frontend/src/pages/Wallet.jsx` - Wallet page UI
- `frontend/src/store/walletStore.js` - State management
- `frontend/src/App.jsx` - Route: `<Route path="/wallet" element={<Wallet />} />`
- `frontend/src/components/layout/Navbar.jsx` - Menu item: `{ path: '/wallet', icon: Wallet, label: t('wallet.title') }`
- `frontend/src/locales/en.json` - Keys: `wallet.*`
- `frontend/src/locales/id.json` - Keys: `wallet.*`

#### Mobile
- `mobile/src/screens/wallet/WalletScreen.js` - Wallet screen
- `mobile/src/navigation/AppNavigator.js` - Route in `sellerStack`
- `mobile/src/screens/profile/ProfileScreen.js` - Menu item in `sellerMenu`
- `mobile/src/i18n/en.js` - Keys: `wallet.*`
- `mobile/src/i18n/id.js` - Keys: `wallet.*`

---

### How to Remove Digital Wallet

#### Backend
```bash
# 1. Remove handler file
rm backend/internal/handlers/wallet.go

# 2. Remove model file
rm backend/internal/models/wallet.go

# 3. Remove route from main.go - delete these lines:
walletHandler := handlers.NewWalletHandler()
walletGroup := r.Group("/wallet")
walletGroup.Use(middleware.AuthRequired())
walletGroup.GET("", walletHandler.GetWallet)
walletGroup.POST("/add-funds", walletHandler.AddFunds)
walletGroup.POST("/deduct", walletHandler.Deduct)
walletGroup.POST("/transfer-bank", walletHandler.TransferToBank)
walletGroup.GET("/transactions", walletHandler.GetTransactions)

# 4. Remove index from mongo.go - delete:
{ Keys: bson.D{{Key: "userId", Value: 1}}, Unique: true }, // wallets
```

#### Frontend (Web)
```bash
# 1. Remove page
rm frontend/src/pages/Wallet.jsx

# 2. Remove store
rm frontend/src/store/walletStore.js

# 3. Remove route from App.jsx - delete:
import Wallet from './pages/Wallet';
<Route path="/wallet" element={<Wallet />} />

# 4. Remove Navbar menu item from Navbar.jsx
# 5. Remove translations from en.json and id.json (wallet.*)
```

#### Mobile
```bash
# 1. Remove screen
rm mobile/src/screens/wallet/WalletScreen.js

# 2. Remove route from AppNavigator.js
# 3. Remove menu item from ProfileScreen.js
# 4. Remove translations from en.js and id.js
```

---

## 2. Installment Payments

### Implementation Locations

#### Backend
- `backend/internal/handlers/installments.go` - Installment calculations and plans
- `backend/cmd/server/main.go` - Route: `r.POST("/installments/*", ...)` and `r.GET("/installments/*", ...)`

#### Frontend (Web)
- `frontend/src/pages/Installments.jsx` - Installments page
- `frontend/src/store/installmentStore.js` - State management
- `frontend/src/App.jsx` - Route: `<Route path="/installments" element={<Installments />} />`
- `frontend/src/components/layout/Navbar.jsx` - Menu item
- `frontend/src/locales/en.json` - Keys: `installment.*`
- `frontend/src/locales/id.json` - Keys: `installment.*`

#### Mobile
- `mobile/src/screens/installments/InstallmentsScreen.js` - Installments screen
- `mobile/src/navigation/AppNavigator.js` - Route
- `mobile/src/screens/profile/ProfileScreen.js` - Menu item
- `mobile/src/i18n/en.js` - Keys: `installment.*`
- `mobile/src/i18n/id.js` - Keys: `installment.*`

---

### How to Remove Installments

#### Backend
```bash
# 1. Remove handler file
rm backend/internal/handlers/installments.go

# 2. Remove routes from main.go - delete:
r.POST("/installments/calculate", h.CalculateInstallment)
r.POST("/installments/create-plan", middleware.AuthRequired(), h.CreatePlan)
r.GET("/installments/my", middleware.AuthRequired(), h.GetMyPlans)
r.GET("/installments/plan/:id", middleware.AuthRequired(), h.GetPlan)
r.POST("/installments/plan/:id/pay", middleware.AuthRequired(), h.PayInstallment)
```

#### Frontend (Web)
```bash
# 1. Remove page
rm frontend/src/pages/Installments.jsx

# 2. Remove store
rm frontend/src/store/installmentStore.js

# 3. Remove route from App.jsx
# 4. Remove Navbar menu item
# 5. Remove translations
```

#### Mobile
```bash
# 1. Remove screen
rm mobile/src/screens/installments/InstallmentsScreen.js

# 2. Remove route and menu item
# 3. Remove translations
```

---

## 3. Video Call Consultation

### Implementation Locations

#### Backend
- `backend/internal/handlers/video_call.go` - Room management
- `backend/internal/models/video_call.go` - Video call model
- `backend/cmd/server/main.go` - Route: `videoCallGroup := r.Group("/video-call")`
- `backend/internal/database/mongo.go` - Index: `video_calls` collection

#### Frontend (Web)
- `frontend/src/pages/VideoCall.jsx` - Video call page
- `frontend/src/store/videoCallStore.js` - State management
- `frontend/src/components/VideoCall.jsx` - Video call component
- `frontend/src/App.jsx` - Route
- `frontend/src/components/layout/Navbar.jsx` - Menu item

#### Mobile
- `mobile/src/screens/videoCall/VideoCallScreen.js` - Video call screen
- `mobile/src/navigation/AppNavigator.js` - Route
- `mobile/src/screens/profile/ProfileScreen.js` - Menu item

---

### How to Remove Video Call

#### Backend
```bash
# 1. Remove handler file
rm backend/internal/handlers/video_call.go

# 2. Remove model file
rm backend/internal/models/video_call.go

# 3. Remove routes from main.go
# 4. Remove index from mongo.go
```

---

## 4. Seller Analytics Dashboard

### Implementation Locations

#### Backend
- `backend/internal/handlers/analytics.go` - Contains all analytics (sales, recommendations, seller analytics)
- `backend/cmd/server/main.go` - Route: `analyticsGroup := r.Group("/analytics")`

#### Frontend (Web)
- `frontend/src/pages/SellerAnalytics.jsx` - Analytics dashboard
- `frontend/src/store/sellerAnalyticsStore.js` - State management
- `frontend/src/App.jsx` - Route
- `frontend/src/components/layout/Navbar.jsx` - Menu item

#### Mobile
- `mobile/src/screens/seller/SellerAnalyticsScreen.js` - Analytics screen
- `mobile/src/navigation/AppNavigator.js` - Route
- `mobile/src/screens/profile/ProfileScreen.js` - Menu item

---

### How to Remove Seller Analytics

#### Backend
```bash
# In analytics.go, remove these functions:
# - GetSellerAnalytics
# - GetCustomerInsights
# - GetProductPerformance

# Or remove entire analytics functionality from main.go:
# Remove routes: analyticsGroup.GET("/seller", ...)
```

---

## 5. Inventory Management

### Implementation Locations

#### Backend
- `backend/internal/handlers/products.go` - Extended with:
  - `GetLowStockProducts` - GET /products/low-stock
  - `AdjustStock` - POST /products/:id/adjust-stock

#### Frontend (Web)
- `frontend/src/pages/Inventory.jsx` - Inventory page
- `frontend/src/store/inventoryStore.js` - State management
- `frontend/src/App.jsx` - Route
- `frontend/src/components/layout/Navbar.jsx` - Menu item

#### Mobile
- `mobile/src/screens/seller/InventoryScreen.js` - Inventory screen
- `mobile/src/navigation/AppNavigator.js` - Route
- `mobile/src/screens/profile/ProfileScreen.js` - Menu item

---

### How to Remove Inventory

#### Backend
```bash
# In products.go, remove:
# - GetLowStockProducts handler function
# - AdjustStock handler function
# - Route: r.GET("/products/low-stock", h.GetLowStockProducts)
# - Route: r.POST("/products/:id/adjust-stock", h.AdjustStock)
```

---

## 6. Voice Search

### Implementation Locations

#### Frontend (Web)
- `frontend/src/hooks/useVoiceSearch.js` - Speech recognition hook
- `frontend/src/components/VoiceSearchInput.jsx` - Voice input component
- `frontend/src/pages/Products.jsx` - Integrated in search bar

#### Mobile
- `mobile/src/screens/products/ProductsScreen.js` - Integrated in ProductsScreen
- `mobile/src/components/VoiceSearchInput.js` - Component (created but not fully integrated)

---

### How to Remove Voice Search

#### Frontend (Web)
```bash
# 1. Remove hook
rm frontend/src/hooks/useVoiceSearch.js

# 2. Remove component
rm frontend/src/components/VoiceSearchInput.jsx

# 3. In Products.jsx, remove:
# - import useVoiceSearch
# - VoiceSearchInput component usage
# - Microphone button in search bar
```

#### Mobile
```bash
# In ProductsScreen.js, remove:
# - import * as Speech from 'expo-speech'
# - isListening state
# - handleVoiceSearch function
# - Microphone button in search bar
```

---

## 7. Admin Panel

### Implementation Locations

#### Backend
- `backend/internal/handlers/admin.go` - Admin CRUD operations
- `backend/cmd/server/main.go` - Route: `adminGroup := r.Group("/admin")`

#### Frontend (Web)
- `frontend/src/pages/AdminDashboard.jsx` - Admin dashboard
- `frontend/src/store/adminStore.js` - State management
- `frontend/src/App.jsx` - Route: `/admin/*`

---

### How to Remove Admin Panel

#### Backend
```bash
# 1. Remove handler file
rm backend/internal/handlers/admin.go

# 2. Remove routes from main.go - delete:
adminHandler := handlers.NewAdminHandler()
adminGroup := r.Group("/admin", middleware.AuthRequired(), middleware.AdminRequired())
adminGroup.GET("/dashboard", adminHandler.GetDashboard)
# ... all other admin routes
```

---

## 8. WhatsApp Integration

### Implementation Locations

#### Backend
- `backend/internal/handlers/whatsapp.go` - WhatsApp link generation
- `backend/cmd/server/main.go` - Route: `r.POST("/whatsapp/*")` and `r.GET("/whatsapp/*")`

#### Frontend (Web)
- `frontend/src/pages/ProductDetail.jsx` - WhatsApp button added

#### Mobile
- `mobile/src/screens/products/ProductDetailScreen.js` - WhatsApp button added

---

### How to Remove WhatsApp

#### Backend
```bash
# 1. Remove handler file
rm backend/internal/handlers/whatsapp.go

# 2. Remove routes from main.go - delete:
whatsappHandler := handlers.NewWhatsAppHandler()
r.POST("/whatsapp/generate-link", whatsappHandler.GenerateWhatsAppLink)
r.GET("/whatsapp/seller/:sellerId", whatsappHandler.GetSellerWhatsApp)
```

#### Frontend (Web)
```bash
# In ProductDetail.jsx, remove:
# - import { MessageSquare } from 'lucide-react'
# - whatsappUrl state and useEffect
# - WhatsApp Button component in Contact Section
```

#### Mobile
```bash
# In ProductDetailScreen.js, remove:
# - import { Linking } from 'react-native'
# - whatsappUrl state and useEffect
# - WhatsApp button in bottom bar
```

---

## Quick Disable vs Complete Removal

### Option 1: Quick Disable (Hide from UI)

To disable a feature without deleting code:

1. **Web Frontend** - Comment out routes in `App.jsx`:
```jsx
{/* <Route path="/wallet" element={<Wallet />} /> */}
```

2. **Navbar** - Remove menu item from `Navbar.jsx`

3. **Mobile** - Remove route from `AppNavigator.js` and menu item from `ProfileScreen.js`

### Option 2: Complete Removal

Follow the detailed steps for each feature above to completely remove all code.

---

## Environment Variables Added

The following environment variables may have been added (check your `.env` file):

```bash
# None required for most features - they use existing infrastructure
# Video Call uses Jit.si (free tier)
# WhatsApp uses wa.me (free, no API key needed)
```

---

## Database Collections Added

- `wallets` - Digital wallet data
- `video_calls` - Video call rooms
- Installment plans stored in existing `orders` or separate collection

To drop collections (if complete removal):
```javascript
use marketplace
db.wallets.drop()
db.video_calls.drop()
```

---

## Testing After Removal

After removing any feature:

1. **Backend**: Run `go build ./...` to verify no import errors
2. **Frontend**: Run `npm run build` to verify no import errors
3. **Mobile**: Run `npx expo start` to verify no import errors
4. Test that removed feature is no longer accessible

---

## Support

For questions or issues with feature removal, review:
- `NEW_FEATURES.md` - Feature requirements
- `PRODUCTION_CHECKLIST.md` - Implementation details
- This document - Removal instructions
