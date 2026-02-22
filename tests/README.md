# Driver Marketplace Test Suite

This directory contains test scripts for the Driver Marketplace feature.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd ../go-backend
   go run cmd/server/main.go
   ```

2. **Test Users** (or create them automatically via simulation)
   - The simulation scripts can create test users automatically
   - Or use existing users in your database

3. **Node.js** (for JavaScript test scripts)
   ```bash
   npm install
   ```

## Test Scripts

### 1. Driver Flow Simulation (`driver-simulation.js`)

Simulates the complete driver marketplace workflow:

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIVER SIMULATION FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Login Users (Seller, Buyer, Driver)                     │
│           ↓                                                  │
│  2. Driver enables driver mode                              │
│           ↓                                                  │
│  3. Driver updates location                                 │
│           ↓                                                  │
│  4. Buyer creates order                                     │
│           ↓                                                  │
│  5. Seller sets order to "ready"                            │
│           ↓                                                  │
│  6. Driver gets available orders                            │
│           ↓                                                  │
│  7. Driver claims order (atomic operation)                  │
│           ↓                                                  │
│  8. Driver updates status: picked_up → on_the_way → arrived │
│           ↓                                                  │
│  9. Driver completes delivery                               │
│           ↓                                                  │
│  10. Buyer rates driver                                     │
│           ↓                                                  │
│  11. View updated stats, history, earnings                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Run:**
```bash
npm run simulation
# or
node driver-simulation.js
```

**Output Example:**
```
[INFO] 10:30:15 AM - Step 1: Logging in test users...
[SUCCESS] 10:30:16 AM - seller logged in successfully
[SUCCESS] 10:30:16 AM - buyer logged in successfully
[SUCCESS] 10:30:16 AM - driver logged in successfully
[STEP] 10:30:16 AM - Step 2: Enabling driver mode...
[SUCCESS] 10:30:16 AM - Driver mode enabled
...
```

### 2. Race Condition Test (`race-condition-test.js`)

Tests the atomic order claiming by having multiple drivers attempt to claim the same order simultaneously.

```
┌─────────────────────────────────────────────────────────────┐
│                  RACE CONDITION TEST                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Setup:                                                      │
│    - Create 5 test drivers                                  │
│    - Create 1 test order                                    │
│    - Set order to "ready" status                            │
│                                                              │
│  Test:                                                       │
│    - All 5 drivers attempt to claim simultaneously          │
│    - Only ONE should succeed (200 OK)                       │
│    - Others should get 409 Conflict                         │
│                                                              │
│  Verification:                                               │
│    - Check order.claimedBy is set                           │
│    - Check order.status is "claimed"                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Run:**
```bash
npm run race-test
# or
node race-condition-test.js
```

**Output Example:**
```
============================================================
     RACE CONDITION TEST: SIMULTANEOUS CLAIMS
     5 drivers attempting to claim order 1A2B3C
============================================================

--- RESULTS ---

✅ Driver 1: CLAIMED (45ms)
⚠️ Driver 2: CONFLICT (48ms)
⚠️ Driver 3: CONFLICT (47ms)
⚠️ Driver 4: CONFLICT (46ms)
⚠️ Driver 5: CONFLICT (49ms)

--- SUMMARY ---

Total requests: 5
Successful claims: 1
Conflicts (409): 4
Other errors: 0

✅ TEST PASSED: Exactly ONE driver claimed the order!
   Winner: Driver 1
```

### 3. Run All Tests

```bash
npm run all
```

## Configuration

Set the API URL via environment variable:

```bash
export API_URL=http://localhost:5000/api
npm run simulation
```

## Testing Scenarios

### Scenario 1: Happy Path
- Driver successfully claims and completes delivery
- Buyer tracks delivery and rates driver

### Scenario 2: Race Condition
- Multiple drivers compete for same order
- Verify atomic claiming works correctly

### Scenario 3: Driver Availability
- Driver with active delivery cannot claim more orders
- Driver becomes available after completing delivery

### Scenario 4: Location-Based Filtering
- Orders outside driver's radius don't appear
- Driver location updates work correctly

## API Endpoints Tested

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/auth/register` | POST | User registration |
| `/driver/toggle` | POST | Enable/disable driver mode |
| `/driver/location` | PUT | Update driver location |
| `/driver/stats` | GET | Get driver statistics |
| `/driver/available-orders` | GET | Get orders for pickup |
| `/driver/claim/:id` | POST | Claim an order |
| `/driver/active-delivery` | GET | Get current delivery |
| `/driver/status/:id` | POST | Update delivery status |
| `/driver/complete/:id` | POST | Complete delivery |
| `/driver/history` | GET | Get delivery history |
| `/driver/earnings` | GET | Get earnings breakdown |
| `/driver-rating/:orderId` | POST | Rate driver |
| `/orders/` | POST | Create order |
| `/orders/:id/status` | PUT | Update order status |

## Troubleshooting

### "Connection refused" errors
- Ensure backend server is running on the correct port

### "Authentication failed" errors
- Check that test users exist in the database
- Verify JWT secret is configured correctly

### "No orders available" message
- Make sure there are products in the database
- Ensure sellers have set up their stores

### Race condition test shows multiple successes
- This indicates a bug in the atomic claiming logic
- Check MongoDB transactions are working correctly

## Performance Testing

For load testing, you can use tools like:
- **k6**: `k6 run load-test.js`
- **Artillery**: `artillery run artillery-config.yml`

Example k6 test:
```javascript
import http from 'k6/http';

export default function() {
    const res = http.get('http://localhost:5000/api/driver/available-orders?lat=-6.2&lng=106.8');
}
```
