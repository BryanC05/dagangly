# Feature Implementation - Cart Abandonment, Map Tracking, Barcode Scanner

> **Date:** April 16, 2026
> **Status:** In Progress

---

## Overview

This document covers the implementation of three new features:
1. Cart Abandonment Recovery
2. Map-based Live Tracking
3. Barcode Scanner

---

## 1. Cart Abandonment Recovery

### Purpose
Recover lost sales by reminding users about items left in their cart.

### Implementation

#### Backend (`backend/`)

**New Files:**
- `internal/models/cart_abandonment.go`
- `internal/handlers/cart_abandonment.go`

**Database Schema:**
```go
type CartAbandonment struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID       primitive.ObjectID `bson:"userId" json:"userId"`
    CartItems    []CartItem          `bson:"cartItems" json:"cartItems"`
    AbandonedAt  time.Time           `bson:"abandonedAt" json:"abandonedAt"`
    ReminderSent bool                `bson:"reminderSent" json:"reminderSent"`
    RecoveredAt *time.Time          `bson:"recoveredAt,omitempty" json:"recoveredAt,omitempty"`
    CreatedAt   time.Time           `bson:"createdAt" json:"createdAt"`
}

type CartItem struct {
    ProductID primitive.ObjectID `bson:"productId" json:"productId"`
    Name     string             `bson:"name" json:"name"`
    Price    float64            `bson:"price" json:"price"`
    Quantity int                `bson:"quantity" json:"quantity"`
    Image    string             `bson:"image,omitempty" json:"image,omitempty"`
}
```

**API Endpoints:**
```
POST   /api/cart-abandonment/create  - Create abandonment record when cart abandoned
GET    /api/cart-abandonment/:userId - Get user's abandoned carts
PATCH  /api/cart-abandonment/:id/recover - Mark as recovered
DELETE /api/cart-abandonment/:id     - Delete record
```

**Schedule Job:**
- Run every hour via cron
- Check carts abandoned > 1 hour, send first reminder
- Check carts abandoned > 24 hours, send second reminder
- After 72 hours, mark as expired (no more reminders)

#### Mobile (`mobile/src/`)

**Updated Files:**
- `screens/cart/CartScreen.js` - Add abandonment tracking
- `i18n/en.js`, `i18n/id.js` - Add translations

**New Files:**
- `components/CartAbandonmentBanner.js` (optional - remind user before leaving)

#### Web (`frontend/src/`)

**Updated Files:**
- `pages/Cart.jsx` - Add abandonment tracking

---

## 2. Map-based Live Tracking

### Purpose
Show real-time delivery driver location on a map for order tracking.

### Implementation

#### Backend (`backend/`)

**New Files:**
- `internal/handlers/driver_tracking.go`
- `internal/models/driver_location.go`

**Database Schema:**
```go
type DriverLocation struct {
    ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    DriverID  primitive.ObjectID `bson:"driverId" json:"driverId"`
    OrderID   primitive.ObjectID `bson:"orderId" json:"orderId"`
    Latitude  float64            `bson:"latitude" json:"latitude"`
    Longitude float64            `bson:"longitude" json:"longitude"`
    Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
}
```

**API Endpoints:**
```
GET    /api/tracking/order/:orderId      - Get current driver location
POST   /api/tracking/update               - Driver updates location (authenticated)
GET    /api/tracking/history/:orderId   - Get location history
```

**WebSocket:**
- Event: `driver-location` - Broadcast driver location to client

#### Mobile (`mobile/src/`)

**Updated Files:**
- `screens/orders/OrderDetailScreen.js` - Add map view
- `navigation/AppNavigator.js` - Add tracking route

**New Files:**
- `screens/tracking/LiveTrackingScreen.js` - Map view with driver marker
- `components/TrackingMap.js` - Reusable map component

**Dependencies:**
- `react-native-maps` (Expo compatible)
- OR use `react-native-webview` with Google Maps embed

**Note:** For Expo Go, use web-based map embed in WebView instead of native maps.

#### Web (`frontend/src/`)

**Updated Files:**
- `pages/OrderDetail.jsx` - Add map tracking section

**New Files:**
- `components/TrackingMap.jsx` - Google Maps integration

**Dependencies:**
- `@react-google-maps/api` (optional - can use iframe embed)

---

## 3. Barcode Scanner

### Purpose
Allow users to quickly find products by scanning barcodes.

### Implementation

#### Mobile (`mobile/src/`)

**New Files:**
- `screens/products/BarcodeScannerScreen.js`
- `components/BarcodeScanner.js`

**Implementation:**
```javascript
import { BarCodeScanner } from 'expo-barcode-scanner';

// Using expo-barcode-scanner for QR/Barcodes
const [hasPermission, requestPermission] = BarCodeScanner.usePermissions();

// Scan handler
const handleBarCodeScanned = ({ type, data }) => {
    // Search product by barcode
    navigate('Products', { search: data });
};
```

**API Endpoint:**
```
GET /api/products/barcode/:barcode - Look up product by barcode
```

**Backend Update:**
- Add barcode field to product model (if not exists)
- Add lookup handler

**Navigation:**
- Add to Products screen (camera icon button)
- Or as separate tab in search options

#### Web (`frontend/src/`)

**Implementation:**
- Use `html5-qrcode` library for camera access
- Or use camera input fallback

**New Files:**
- `components/BarcodeScanner.jsx`
- `pages/Products.jsx` - Add scanner button

---

## Files Structure

### Backend

```
backend/
├── internal/
│   ├── models/
│   │   ├── cart_abandonment.go     # NEW
│   │   └── driver_location.go       # NEW
│   ├── handlers/
│   │   ├── cart_abandonment.go     # NEW
│   │   ├── driver_tracking.go      # NEW
│   │   └── products.go             # UPDATE
│   └── database/
│       └── mongo.go               # UPDATE - indexes
```

### Mobile

```
mobile/src/
├── components/
│   ├── CartAbandonmentBanner.js   # NEW
│   └── TrackingMap.js            # NEW
├── screens/
│   ├── tracking/
│   │   └── LiveTrackingScreen.js # NEW
│   ├── products/
│   │   └── BarcodeScannerScreen.js # NEW
│   └── orders/
│   │   └── OrderDetailScreen.js   # UPDATE
├── i18n/
│   ├── en.js                     # UPDATE
│   └── id.js                     # UPDATE
└── navigation/
    └── AppNavigator.js           # UPDATE
```

### Web

```
frontend/src/
├── components/
│   ├── TrackingMap.jsx          # NEW
│   └── BarcodeScanner.jsx        # NEW
├── pages/
│   ├── OrderDetail.jsx          # UPDATE
│   └── Products.jsx             # UPDATE
└── App.jsx                      # UPDATE
```

---

## Dependencies

### Mobile (Expo)

```bash
# For barcode scanner
npx expo install expo-barcode-scanner

# For maps (requires dev build)
npx expo install react-native-maps
# OR use web view for Expo Go
```

### Web

```bash
npm install html5-qrcode
# OR use Google Maps (optional)
npm install @react-google-maps/api
```

---

## Translation Keys to Add

### English (`en.js`)

```javascript
cartAbandonment: {
    title: 'Forgot something?',
    message: 'You have items left in your cart',
    reminder1: 'Reminder sent: Complete your order!',
    reminder2: 'Last chance! Your cart expires soon',
    recoverCart: 'Complete Purchase',
    continueShopping: 'Continue Shopping',
},
tracking: {
    driverLocation: 'Driver Location',
    arrivingIn: 'Arriving in {minutes} min',
    deliveredSoon: 'Your driver is on the way!',
    orderDelivered: 'Order Delivered',
},
scanner: {
    scanBarcode: 'Scan Barcode',
    pointCamera: 'Point camera at barcode',
    productFound: 'Product found!',
    noProduct: 'No product found',
},
```

### Indonesian (`id.js`)

```javascript
cartAbandonment: {
    title: 'Lupa sesuatu?',
    message: 'Anda memiliki barang di keranjang',
    reminder1: 'Pengingat: Selesaikan pesanan Anda!',
    reminder2: 'Kesempatan terakhir! Keranjang Anda kedaluwarsa',
    recoverCart: 'Selesaikan Pembelian',
    continueShopping: 'Lanjut Belanja',
},
tracking: {
    driverLocation: 'Lokasi Driver',
    arrivingIn: 'Tiba dalam {minutes} menit',
    deliveredSoon: 'Driver Anda dalam perjalanan!',
    orderDelivered: 'Pesanan Dikirim',
},
scanner: {
    scanBarcode: 'Pindai Barcode',
    pointCamera: 'Arahkan kamera ke barcode',
    productFound: 'Produk ditemukan!',
    noProduct: 'Produk tidak ditemukan',
},
```

---

## Testing Checklist

### Cart Abandonment
- [ ] User adds item to cart, closes app → record created
- [ ] After 1 hour → notification sent (simulated)
- [ ] User returns via link → cart restored
- [ ] User completes purchase → recovered marked
- [ ] Translation works in EN/ID

### Map Tracking
- [ ] Order in delivery → map shows
- [ ] Driver location updates → marker moves
- [ ] ETA displayed correctly
- [ ] Works on mobile (web view fallback for Expo Go)
- [ ] Works on web (Google Maps)

### Barcode Scanner
- [ ] Camera permission requested
- [ ] Barcode scanned → product lookup
- [ ] Product found → navigate to detail
- [ ] No product → show message
- [ ] Works on mobile
- [ ] Fallback for web (manual entry)

---

## Implementation Status

| Feature | Backend | Mobile | Web |
|---------|---------|--------|-----|
| Cart Abandonment | ⏳ | ⏳ | ⏳ |
| Map Tracking | ⏳ | ⏳ | ⏳ |
| Barcode Scanner | ⏳ | ⏳ | ⏳ |

---

*Document Version: 1.0*
*Last Updated: April 16, 2026*
*Status: Implementing*