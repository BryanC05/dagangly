# Seller Dashboard Features Documentation

## Overview
This document describes the seller dashboard features implemented for the MSME Marketplace app, including mock data, analytics, inventory management, and product status handling.

---

## 1. Mock Finance Data

### Multi-Seller Mock Data
The system includes mock finance data for 13 sellers across various categories:

| # | Business | Email | Revenue | Orders | Rating |
|---|---------|-------|---------|--------|--------|
| 1 | Dapur Summarecon | rani.summarecon@... | Rp 4,906,000 | 6 | 4.8 |
| 2 | Warung Nusantara | surya.warung@... | Rp 1,900,000 | 3 | 4.6 |
| 3 | Kopi Kita | budi.kopi@... | Rp 3,325,000 | 3 | 4.7 |
| 4 | Es Teh Manis Bu Dewi | dewi.esteh@... | Rp 1,090,000 | 3 | 4.5 |
| 5 | Kedai Kopi Senja | rizal.kedai@... | Rp 1,680,000 | 2 | 4.8 |
| 6 | Kue Kering Budi | budi.kue@... | Rp 3,200,000 | 3 | 4.9 |
| 7 | Sayur Segar Agus | agus.sayur@... | Rp 1,300,000 | 2 | 4.6 |
| 8 | Buah Segar Bekasi | rina.buah@... | Rp 1,290,000 | 2 | 4.8 |
| 9 | Anyaman Lokal | dina.anyaman@... | Rp 1,730,000 | 2 | 4.7 |
| 10 | Batik Modern Indah | indah.batik@... | Rp 4,125,000 | 2 | 4.6 |
| 11 | Skincare Alami | lina.skincare@... | Rp 1,780,000 | 2 | 4.7 |
| 12 | Gadget & Accessories | tech.gadget@... | Rp 3,355,000 | 2 | 4.5 |
| 13 | Rumah Modern | budi.home@... | Rp 2,445,000 | 2 | 4.6 |

### Data Structure (mock-finance-data.json)
Each seller has:
- `sellerId`, `sellerName`, `email`, `category`
- `products` - Array of products with price and cost breakdown
- `orders` - Order history with status (delivered/completed)
- `expenses` - Expense records by category
- `totalRevenue`, `totalExpense`, `avgRating`, `totalReviews`
- `revenueTrend` - weekly, daily30, and monthly data

---

## 2. Profit Display & Period Comparison

### Analytics Data
The dashboard displays:
- **Gross Revenue** - Total sales revenue
- **Net Profit** - Revenue minus expenses
- **Total Orders** - Number of completed orders
- **Active SKUs** - Number of active products

### Period Comparison
- Period selection: 7 days, 30 days, 90 days
- Comparison shows percentage change vs previous period
- Visual indicators: ↑ green (positive), ↓ red (negative)
- Formula: `((current - previous) / previous * 100).toFixed(1)%`

### Revenue Trend Graph
- Displays revenue over time based on selected period
- 7 days = weekly data points
- 30/90 days = monthly data points
- Tooltip shows exact values on hover

---

## 3. Inventory Management

### Mock Products (Dapur Summarecon)
| Product | Price | Stock |
|---------|-------|-------|
| Nasi Goreng Special | Rp 45,000 | 25 |
| Mie Ayam Jamur | Rp 35,000 | 18 |
| Soto Ayam Kudus | Rp 40,000 | 12 |
| Bakso Granada | Rp 38,000 | 20 |

### Low Stock Alert
- Alert only appears when: `stock > 0 && stock <= 10`
- Badge shows "Low Stock: X" for items needing attention

---

## 4. Product Status System

### Status Options
| Status | Description | Badge Color |
|--------|-------------|-------------|
| `active` | Available for purchase | Green |
| `sold_out` | Not available (manually marked) | Red |
| `stock_empty` | Waiting for restock | Yellow |

### Product Form Changes
- **Stock field**: Optional (not required)
- **Status dropdown**: New field to select product status
- Default status for new products: `active`

### Buyer Experience
- Products with "sold_out" or "stock_empty" status:
  - Still appear in search results
  - Product card is viewable
  - "Add to Cart" button is hidden/disabled
  - Status badge displayed on product card

---

## 5. Business Registration System

### Overview
Before accessing seller features, users must register their business and get approved by admin.

### Registration Flow
1. User visits `/register-business`
2. Fills business registration form (name, address, category, NPWP)
3. Submits application → status = "pending"
4. Admin reviews at `/admin/registrations`
5. Admin approves → `isSeller = true`
6. User gains access to seller features

### User Model Fields
```javascript
{
  isSeller: Boolean,           // true when approved
  businessName: String,       // from registration
  businessAddress: String,   // from registration
  businessCategory: String,   // from registration
  npwp: String,              // optional
  registrationStatus: String, // "pending", "approved", "denied", "none"
  registeredAt: Date,        // submission date
  approvedAt: Date          // approval date
}
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/register-business` | POST | Submit registration |
| `/api/users/registration-status` | GET | Check status |
| `/api/admin/registrations/pending` | GET | List pending |
| `/api/admin/registrations/:id/approve` | POST | Approve seller |
| `/api/admin/registrations/:id/deny` | POST | Deny seller |

### Frontend Routes
| Route | Description |
|-------|-------------|
| `/register-business` | Registration form |
| `/admin/registrations` | Admin approval page |

---

## 6. Implementation Details

### Frontend Files

#### sellerAnalyticsStore.js
```javascript
// Mock analytics includes:
{
  totalRevenue,
  totalExpenses,
  netProfit,
  previousPeriodRevenue,
  previousPeriodExpenses,
  previousPeriodProfit,
  orderCount,
  productCount,
  avgRating,
  revenueByDay
}
```

#### SellerDashboard.jsx
- Stats display with comparison arrows
- Revenue trend chart (Recharts)
- Inventory management table
- Edit product price/stock inline

#### AddProduct.jsx
- Stock: optional input
- Status: dropdown with 3 options
- Product submission handles null stock

### Mobile Files

#### AddProductScreen.js (React Native)
- Stock: optional TextInput
- Status: 3 touchable options (Active/Sold Out/Stock Empty)

#### MyProductsScreen.js
- Status badge display
- Low stock logic: only show when stock > 0 && stock <= 10

---

## 7. Seed Data (Backend)

### Database Collections
Run `node seed-business-simulation.js` to populate:

| Collection | Count |
|------------|-------|
| users | 39 (29 sellers + 10 buyers) |
| businesses | 29 |
| products | ~377 |
| expenses | ~289 |
| orders | ~287 |

### Expenses by Category
- `supplies` - Raw materials
- `marketing` - Advertising
- `transport` - Delivery costs
- `utilities` - Electricity, water
- `rent` - Kiosk/shop rental
- `equipment` - Tools, machinery

---

## 8. API Endpoints

### Analytics
- `GET /analytics/seller?period=30` - Seller analytics
- `GET /analytics/sales?period=30` - Sales data
- `GET /analytics/customers` - Customer insights
- `GET /analytics/products` - Product performance

### Products
- `GET /products/seller/:id` - Seller's products
- `POST /products` - Create product (with optional stock, new status field)
- `PUT /products/:id` - Update product

---

## 9. Testing Accounts

### Seller Accounts
| Email | Password | Business |
|-------|----------|----------|
| rani.summarecon@marketplace.test | test123 | Dapur Summarecon |
| budi.kopi@marketplace.test | test123 | Kopi Kita |
| surya.warung@marketplace.test | test123 | Warung Nusantara |

### Buyer Accounts
| Email | Password |
|-------|----------|
| andi.buyer@marketplace.test | test123 |
| lisa.buyer@marketplace.test | test123 |

---

## 11. Troubleshooting

### Dashboard shows 0
- Check if `FORCE_MOCK = true` in sellerAnalyticsStore.js
- Verify mock data is loaded correctly

### Products not appearing
- Check mock products array in SellerDashboard.jsx
- Verify `FORCE_MOCK_PRODUCTS = true`

### Mobile build fails
- Ensure expo-sqlite is installed: `npm install expo-sqlite`
- Run: `cd mobile && npx expo install --check`

---

## 12. Future Enhancements

### Planned Features
1. **Expense tracking** - Detailed expense categories
2. **Export reports** - PDF/Excel download
3. **Date comparison** - This period vs last period
4. **Alerts** - Low stock, revenue milestones
5. **Goals** - Set sales targets

### AI Financial Consultant
- Already responds in Bahasa Indonesia
- Uses mock analytics data for analysis
- Groq API integration for AI responses