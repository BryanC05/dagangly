# Offline Capability Implementation Plan

## Overview

This document outlines the implementation of offline functionality for the MSME Marketplace mobile app, allowing users to browse products, manage orders, and use core features without an active internet connection.

## Goals

1. **Browse products offline** - Cache product listings locally
2. **Manage orders offline** - Create/modify orders when offline
3. **View local data** - Access cached business info and previous orders
4. **Sync when online** - Queue actions and sync when connection restored

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                            │
├─────────────────────────────────────────────────────────┤
│  UI Components                                          │
├─────────────────────────────────────────────────────────┤
│  NetworkContext (offline state, connectivity listener)   │
├─────────────────────────────────────────────────────────┤
│  API Service (with offline detection & caching)         │
├───────────────────┬─────────────────┬──────────────────┤
│   Local Store     │  SQLite DB      │  Offline Queue   │
│  (AsyncStorage)   │  (expo-sqlite)  │  (action queue) │
├───────────────────┴─────────────────┴──────────────────┤
│                    Mock Data (fallback)                 │
└─────────────────────────────────────────────────────────┘
```

## Implementation Components

### 1. Network Context (`NetworkContext.jsx`)

**Purpose**: Manage online/offline state across the app

**Features**:
- Detect connectivity changes using `@react-native-community/netinfo`
- Provide `isOnline` and `isInternetReachable` states
- Emit events when connection status changes
- Sync queued actions when coming back online

**States**:
- `isConnected` - General network connectivity
- `isInternetReachable` - Can actually reach the internet
- `lastOnlineAt` - Timestamp of last successful connection

### 2. Local Store (`localStore.js`)

**Purpose**: Persist key data using AsyncStorage

**Stored Data**:
- `auth_token` - User authentication token
- `user_profile` - Cached user data
- `last_products_sync` - Timestamp of last product sync
- `last_orders_sync` - Timestamp of last orders sync
- `app_settings` - User preferences

**API**:
```javascript
setItem(key, value) - Store JSON-serializable data
getItem(key) - Retrieve stored data
removeItem(key) - Remove stored data
clear() - Clear all stored data
```

### 3. Local Database (`localDatabase.js`)

**Purpose**: SQLite database for structured offline data

**Tables**:

#### `products`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Product ID |
| name | TEXT | Product name |
| description | TEXT | Description |
| price | REAL | Price |
| category | TEXT | Category |
| images | TEXT | JSON array of image URLs |
| stock | INTEGER | Stock count |
| seller_id | TEXT | Seller ID |
| business_name | TEXT | Business name |
| rating | REAL | Rating |
| cached_at | TEXT | Cache timestamp |

#### `orders`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Order ID (local UUID) |
| server_id | TEXT | Server order ID (null until synced) |
| products | TEXT | JSON array of order items |
| total_amount | REAL | Total amount |
| status | TEXT | Order status |
| created_at | TEXT | Creation timestamp |
| sync_status | TEXT | pending/synced/failed |
| local_only | INTEGER | 1 if only created locally |

#### `businesses`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Business ID |
| name | TEXT | Business name |
| description | TEXT | Description |
| logo | TEXT | Logo URL |
| address | TEXT | Address |
| city | TEXT | City |
| rating | REAL | Rating |
| is_verified | INTEGER | Verification status |
| cached_at | TEXT | Cache timestamp |

### 4. Offline Queue (`offlineQueue.js`)

**Purpose**: Queue actions to be executed when back online

**Queued Actions**:
- Create order
- Update order status
- Create product
- Update product
- Send message
- Submit review

**Structure**:
```javascript
{
  id: UUID,
  type: 'order' | 'product' | 'message' | 'review',
  action: 'create' | 'update' | 'delete',
  payload: {...},
  createdAt: timestamp,
  retryCount: number,
  status: 'pending' | 'processing' | 'failed'
}
```

**Sync Process**:
1. On connectivity restored, process queue in order
2. Execute each action against API
3. Update local records with server response
4. Remove from queue on success
5. Increment retry count on failure
6. Mark as failed after max retries (3)

### 5. API Service with Caching (`apiService.js`)

**Purpose**: Wrap API calls with caching and offline support

**Features**:
- Check cache before API calls
- Cache successful GET responses
- Return cached data when offline
- Queue mutations when offline
- Track cache freshness

**Cache Strategy**:
- Products: Cache for 24 hours, background refresh
- Businesses: Cache for 7 days
- Orders: No cache, queue mutations when offline

### 6. Mock Data (`mockData.js`)

**Purpose**: Provide demo data when no cached data available

**Includes**:
- Sample products across categories
- Sample businesses
- Sample orders
- Sample categories

## Feature Implementation

### Browse Products (Offline)

1. On app start, check local SQLite for products
2. If empty, populate with mock data
3. If has cached data, display immediately
4. Background: sync with server if online
5. Show "Last updated: X" indicator

### Create Order (Offline)

1. Generate local UUID for order
2. Save to SQLite with `sync_status = 'pending'`
3. Add to offline queue
4. Show optimistic UI immediately
5. When online: sync with server, update with real ID
6. Handle conflicts (order might already exist)

### View Orders (Offline)

1. Load from local SQLite immediately
2. Show sync status indicator (synced/pending/failed)
3. Background sync if online
4. Allow viewing order details

### Network Status Indicator

1. Show banner when offline
2. Show pending sync count
3. Auto-dismiss when back online
4. Provide manual sync button

## File Structure

```
src/
├── store/
│   ├── localStore.js          # AsyncStorage wrapper
│   ├── localDatabase.js       # SQLite operations
│   └── offlineQueue.js        # Action queue
├── services/
│   ├── apiService.js          # API with caching
│   └── WebSocketService.js    # Existing (keep as-is)
├── context/
│   └── NetworkContext.jsx     # Network state management
├── data/
│   └── mockData.js            # Demo data
├── hooks/
│   └── useOfflineSync.js      # Sync hook
└── components/
    └── NetworkStatus.jsx      # Status indicator component
```

## Dependencies Required

```json
{
  "@react-native-async-storage/async-storage": "^1.23.1",
  "@react-native-community/netinfo": "^11.3.2",
  "expo-sqlite": "~14.0.0",
  "uuid": "^9.0.0"
}
```

## Implementation Order

1. **NetworkContext** - Core connectivity tracking
2. **localStore** - Basic key-value storage
3. **localDatabase** - SQLite setup
4. **mockData** - Fallback demo data
5. **offlineQueue** - Action queuing
6. **apiService** - Cached API calls
7. **UI Integration** - NetworkStatus component
8. **Sync Hook** - Auto-sync logic

## Configuration

### Environment Variables

```env
# Enable offline mode for development
EXPO_PUBLIC_OFFLINE_ENABLED=true

# Cache duration in milliseconds
EXPO_PUBLIC_CACHE_DURATION_PRODUCTS=86400000    # 24 hours
EXPO_PUBLIC_CACHE_DURATION_BUSINESS=604800000   # 7 days

# Sync settings
EXPO_PUBLIC_MAX_RETRY_ATTEMPTS=3
EXPO_PUBLIC_SYNC_INTERVAL=30000  # 30 seconds
```

## Testing Checklist

- [ ] App loads with no network
- [ ] Products display from cache/mock
- [ ] Can create order offline
- [ ] Order appears in order list
- [ ] Sync occurs when back online
- [ ] Network status shows correctly
- [ ] Queue processes in order
- [ ] Failed actions retry correctly
- [ ] App handles network transitions smoothly

## Future Enhancements

1. **Conflict Resolution** - Handle server-side conflicts
2. **Selective Sync** - Allow user to choose what to sync
3. **Offline Maps** - Cache location data
4. **Push Notifications** - Queue notifications to send when online
5. **File Caching** - Cache images locally with disk management
