# Offline Testing Mode

This document describes the offline testing mode implementation for the MSME Marketplace mobile app.

## Overview

Offline Testing Mode allows the mobile app to function without a backend server, enabling:
- Full browsing of products and categories
- Authentication with mock accounts
- Cart management
- Order creation (local storage)
- Navigation through all screens

This is designed for **temporary testing** during development when the backend is unavailable.

## Quick Toggle

To enable/disable offline mode, modify the environment variable:

```bash
# In .env file
EXPO_PUBLIC_OFFLINE_TESTING=true   # Enable offline mode
EXPO_PUBLIC_OFFLINE_TESTING=false  # Disable offline mode (normal)
```

Or in `src/config/index.js`:
```javascript
export const OFFLINE_TESTING_MODE = true;  // Toggle here
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│           Mobile App                     │
├─────────────────────────────────────────┤
│  Config: OFFLINE_TESTING_MODE = true    │
├─────────────────────────────────────────┤
│  MockAuth - intercepts login requests   │
│  MockData - provides demo products      │
│  LocalStore - persists cart/orders     │
│  NetworkContext - always "offline"      │
├─────────────────────────────────────────┤
│  No backend connection required         │
└─────────────────────────────────────────┘
```

### Feature Matrix

| Feature | Normal Mode | Offline Mode |
|---------|-------------|--------------|
| **Authentication** | Real API login | Mock login with test accounts |
| **Products** | From backend API | From mock data |
| **Categories** | From backend API | Static mock categories |
| **Cart** | Backend synced | Local AsyncStorage |
| **Orders** | Backend synced | Local SQLite |
| **Checkout** | Real payment flow | "Simulated" checkout |
| **Profile** | From backend API | Static mock profile |
| **Maps** | Google Maps + OSM | OpenStreetMap (WebView) |
| **Store Location** | From API | Mock seller locations |
| **Navigate to Store** | Google Maps / Apple Maps | Opens in Maps app with route line |
| **Chats** | Real-time WebSocket | Disabled |
| **Calls** | Video/audio calls | Disabled |
| **Driver Mode** | Real tracking | Disabled |

## Mock Accounts

### Test Buyers
| Email | Password | Name |
|-------|----------|------|
| `buyer@test.com` | `test123` | Test Buyer |
| `andi.buyer@marketplace.test` | `test123` | Andi Wijaya |

### Test Sellers
| Email | Password | Name |
|-------|----------|------|
| `seller@test.com` | `test123` | Test Seller |
| `rani.summarecon@marketplace.test` | `test123` | Rani Pratama |

### Test Drivers
| Email | Password | Name |
|-------|----------|------|
| `driver@test.com` | `test123` | Test Driver |

## Mock Data

### Products (28 items with images)
Located in `src/data/mockData.js`:
All products use images from `/uploads/products/` directory:

| Product | Image | Category | Price |
|---------|-------|----------|-------|
| Nasi Goreng Special | nasi-goreng.webp | Food | Rp 25,000 |
| Mie Ayam Bakso | bakmi.png | Food | Rp 22,000 |
| Sate Ayam 10 Tusuk | sate-ayam.webp | Food | Rp 30,000 |
| Rendang Daging | rendang.webp | Food | Rp 55,000 |
| Gado-Gado Komplit | gadogado.webp | Food | Rp 20,000 |
| Soto Ayam Bening | soto-ayam.webp | Food | Rp 22,000 |
| Nasi Uduk Komplit | nasi-uduk.jpeg | Food | Rp 18,000 |
| Ayam Goreng Kremes | ayam-goreng-kremes.jpeg | Food | Rp 26,000 |
| Ayam Penyet | ayam-penyet.jpg | Food | Rp 28,000 |
| Nasi Padang Paket | nasi-padang.jpg | Food | Rp 35,000 |
| Bakso Malang Jumbo | bakso-malang.webp | Food | Rp 35,000 |
| Bacang Ayam | bacang-ayam.jpg | Food | Rp 20,000 |
| Nasi Kuning Spesial | nasi-kuning.jpg | Food | Rp 28,000 |
| Kopi Susu Gula Aren | kopi-susu.jpg | Beverages | Rp 18,000 |
| Kopi Hitam Tubruk | kopi-hitam.jpg | Beverages | Rp 12,000 |
| Es Teh Lemon | es-teh-lemon.jpg | Beverages | Rp 12,000 |
| Matcha Latte | matcha-latte.jpg | Beverages | Rp 24,000 |
| Thai Tea | thai-tea.webp | Beverages | Rp 18,000 |
| Es Cendol Dawet | es-cendol.jpeg | Beverages | Rp 15,000 |
| Jus Alpukat | jus-alpukat.webp | Beverages | Rp 20,000 |
| Lemon Tea | lemon-tea.webp | Beverages | Rp 14,000 |
| Teh Manis | teh-manis.jpg | Beverages | Rp 8,000 |
| Chocolate Milkshake | chocolate-milkshake.webp | Beverages | Rp 22,000 |
| Brownies Cokelat | brownies.webp | Snacks | Rp 45,000 |
| Kue Lapis Legit | kue-lapis.webp | Snacks | Rp 85,000 |
| Donat Kentang | donat.jpg | Snacks | Rp 30,000 |
| Pisang Cokelat Crispy | pisang-cokelat.webp | Snacks | Rp 20,000 |
| Risoles Mayo | risole.jpg | Snacks | Rp 25,000 |

### Categories (8 categories)
- All Categories
- Makanan & Minuman (Food)
- Minuman (Beverages)
- Kerajinan (Handicrafts)
- Fashion
- Kecantikan (Beauty)
- Rumah Tangga (Home)
- Elektronik (Electronics)

### Businesses (3 businesses)
- Dapur Summarecon (Food)
- Kopi Kita (Beverages)
- Brownies & Co (Snacks)

## Implementation Details

### Files Modified for Offline Mode

| File | Purpose |
|------|---------|
| `src/config/index.js` | `OFFLINE_TESTING_MODE` flag |
| `src/api/api.js` | Skip network, return mock data |
| `src/store/authStore.js` | Mock authentication |
| `src/context/NetworkContext.jsx` | Skip NetInfo checks |
| `src/services/WebSocketService.js` | Skip WebSocket connect |
| `src/navigation/AppNavigator.js` | Skip WebSocket listener |
| `src/store/notificationStore.js` | Return mock unread count |
| `src/screens/home/HomeScreen.js` | Use mock products/orders |
| `src/screens/products/ProductsScreen.js` | Use mock products |
| `src/screens/products/ProductDetailScreen.js` | Use mock product detail |
| `src/screens/orders/OrdersScreen.js` | Use mock orders |
| `src/components/Map.js` | Polyline support in WebView map |
| `src/screens/location/MapViewScreen.js` | Store navigation with route |
| `src/services/apiService.js` | Return mock data |

### Files Added

| File | Purpose |
|------|---------|
| `src/data/mockAuth.js` | Mock users and authentication logic |
| `src/data/mockData.js` | 28 products with real images, categories, businesses |
| `src/data/mockApi.js` | Local cart, orders, addresses, locations storage |

## Current Implementation Status

### Working Features (Offline Mode)
- [x] Authentication with mock accounts
- [x] Product listing and details
- [x] Product images (bundled locally)
- [x] Categories
- [x] Cart management
- [x] Orders
- [x] Map with seller markers (OpenStreetMap WebView)
- [x] Route tracking line
- [x] Navigate to store button

### Known Limitations
- [ ] Chat/Notifications (requires WebSocket)
- [ ] Calls (requires real backend)
- [ ] Driver features (requires real backend)
- [ ] Real-time location tracking (simplified in offline mode)

## Reverting to Normal Mode

### Step 1: Disable Environment Variable
```bash
# In .env
EXPO_PUBLIC_OFFLINE_TESTING=false
```

### Step 2: Clear App Cache
```bash
# Clear Metro cache
rm -rf node_modules/.cache

# Reinstall if needed
npm install
```

### Step 3: Restart Development Server
```bash
npx expo start --clear
```

### Step 4: Restore Backend
Ensure backend is running:
```bash
cd backend
./server
```

## Files to Restore

When reverting, restore these files to their original state:

1. **`src/config/index.js`** - Remove `OFFLINE_TESTING_MODE` check or set to `false`
2. **`src/api/api.js`** - Remove mock response interceptors
3. **`src/store/authStore.js`** - Remove mock login logic
4. **`src/services/apiService.js`** - Remove mock data returns

### Quick Restore Script
```bash
cd mobile
git checkout src/config/index.js src/api/api.js src/store/authStore.js src/services/apiService.js
```

## Known Limitations in Offline Mode

1. **No real-time features** - Chats, calls, driver tracking won't work
2. **Orders are local only** - Not saved to backend, won't appear on other devices
3. **Payments are simulated** - No actual payment processing
4. **No push notifications** - Won't receive notifications
5. **No AI features** - Logo generation, financial consultant disabled

## Testing Checklist

- [ ] App loads without backend
- [ ] Login works with mock accounts
- [ ] Products display from mock data
- [ ] Cart operations work
- [ ] Order creation works (local)
- [ ] All navigation screens accessible
- [ ] Profile page displays mock data
- [ ] Seller dashboard accessible

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_OFFLINE_TESTING` | `true`/`false` | Main toggle for offline mode |
| `EXPO_PUBLIC_API_HOST` | URL | API endpoint (ignored in offline mode) |

## Support

For issues with offline mode, check:
1. `EXPO_PUBLIC_OFFLINE_TESTING` is set correctly
2. Metro cache is cleared after toggling
3. No background processes still using old config
