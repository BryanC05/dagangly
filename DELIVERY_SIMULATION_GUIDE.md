# Delivery Simulation Guide

This guide walks you through testing the complete driver delivery flow in the UMKM Marketplace app.

## Prerequisites

1. **Backend running** at `http://localhost:5000`
2. **Mobile app installed** on device/emulator
3. **Test data** (products and orders)

---

## Step 1: Create Accounts

Open the mobile app and create these accounts:

### 1.1 Create Seller Account
1. Register new account
2. Go to Profile → enable **Seller Mode**
3. Add **Business Details**:
   - Business Name: "Test Store"
   - Business Type: Small
4. Add **Location** (required for products):
   - Address: "Jl. Sudirman No. 1, Jakarta"
5. Add a product:
   - Name: "Test Product"
   - Price: Rp 50,000
   - Category: Food
   - Stock: 100

### 1.2 Create Buyer Account
1. Register new account (different email)
2. No seller mode needed

### 1.3 Create Driver Account
1. Register new account (different email)
2. Go to Profile → enable **Driver Mode**
3. Toggle Driver Mode ON

---

## Step 2: Create Order as Buyer

### 2.1 Browse Products
1. Login as Buyer
2. Go to Products tab
3. Find "Test Product" from Test Store
4. Tap on product → Add to Cart

### 2.2 Checkout
1. Go to Cart tab
2. Select delivery (not pickup)
3. Enter delivery address:
   - Address: "Jl. Thamrin No. 100, Jakarta"
4. Complete payment

### 2.3 Verify Order Created
- Order status should be "Pending"

---

## Step 3: Update Order Status (as Seller)

### 3.1 Login as Seller
1. Logout from Buyer account
2. Login as Seller

### 3.2 Update Order Status
1. Go to Orders (or seller dashboard)
2. Find the test order
3. Update status sequentially:
   - Pending → **Confirmed**
   - Confirmed → **Preparing**
   - Preparing → **Ready** ✅ (This makes it available for drivers)

---

## Step 4: Claim Order (as Driver)

### 4.1 Login as Driver
1. Logout from Seller
2. Login as Driver

### 4.2 Enable Driver Mode
1. Go to Profile tab
2. Ensure **Driver Mode** is toggled ON
3. Go to **Delivery** tab

### 4.3 Claim Available Order
1. In Delivery tab → Available
2. You should see the order from Test Store
3. Tap **Claim Order**
4. Confirmation: "Order claimed!"

---

## Step 5: Complete Delivery

### 5.1 Navigate to Store
1. Active Delivery screen shows
2. Tap **Navigate** for pickup location
3. Go to store and mark as picked up

### 5.2 Update Status
In Active Delivery screen, tap buttons in order:
- **Mark as Picked Up** → Status: Picked Up
- **Mark as On the Way** → Status: On the Way
- **Mark as Arrived** → Status: Arrived
- **Complete Delivery** → Status: Delivered ✅

### 5.3 Verify Completion
- Earnings added to driver stats
- Driver becomes available for next order

---

## Step 6: Rate Driver (as Buyer)

### 6.1 Login as Buyer
1. Logout from Driver
2. Login as Buyer

### 6.2 Find Delivered Order
1. Go to Orders tab
2. Find delivered order
3. Tap to expand
4. See **Rate Driver** button

### 6.3 Submit Rating
1. Tap Rate Driver
2. Select stars (1-5)
3. Add optional comment
4. Submit

---

## Testing Checklist

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Driver Mode | Toggle ON in Profile | Driver tab appears |
| Available Orders | View Delivery tab | Shows orders within 10km |
| Claim Order | Tap Claim | Order moves to Active |
| Status Update | Tap status buttons | Status changes in order |
| Complete Delivery | Tap Complete | Earnings added, driver available |
| Rating | Rate after delivery | Rating shows on driver profile |
| Tracking | Buyer tracks delivery | Map shows driver location |

---

## Running Automated Tests

### Backend API Test
```bash
cd tests
npm run simulation
```

This tests:
- Driver registration
- Toggle driver mode
- Update location
- Get stats
- Get available orders
- Claim order (if available)
- Complete delivery
- Get history/earnings

### Race Condition Test
```bash
npm run race-test
```

Tests that only ONE driver can claim an order when multiple drivers try simultaneously.

---

## Troubleshooting

### "No orders available"
- Check seller has location set
- Check order status is "Ready"
- Check delivery type is "Delivery" (not Pickup)

### "Location required" error
- Seller must have address/location in profile
- Driver must have location updated

### "Order already claimed"
- Normal behavior - another driver got it
- Find another available order

### Driver not showing in delivery
- Ensure Driver Mode is ON in Profile
- Ensure location is updated

---

## API Flow Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Seller  │────▶│ Order   │────▶│ Driver  │
│ creates │     │ Ready  │     │ claims  │
│ product │     │ status │     │ order   │
└─────────┘     └─────────┘     └─────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Delivery    │
                              │ in progress │
                              └─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌───────────┐   ┌───────────┐   ┌───────────┐
             │ Picked Up │   │On The Way│   │ Arrived   │
             └───────────┘   └───────────┘   └───────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Delivered  │
                              │ + Earnings │
                              └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Buyer Rates │
                              │ Driver     │
                              └─────────────┘
```

---

## Quick Reference

### Order Statuses
- `pending` - Just created
- `confirmed` - Seller confirmed
- `preparing` - Seller preparing
- `ready` - Available for driver pickup
- `claimed` - Driver claimed
- `picked_up` - Driver got items
- `on_the_way` - Driver traveling
- `arrived` - Driver at destination
- `delivered` - Complete

### Delivery Fee Calculation
- Base: Rp 8,000
- Per km: Rp 2,000
- Min: Rp 10,000
- Max: Rp 50,000

### Driver Earnings
- 80% of delivery fee
- Example: Rp 18,000 fee → Rp 14,400 earnings
