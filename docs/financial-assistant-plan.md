# Financial Assistant - Implementation Plan

## Overview

A financial management tool for MSME sellers to track sales, expenses, generate invoices, and analyze product profitability.

---

## Status: ✅ Phase 7 In Progress

---

## Architecture: Local + Optional Sync

```
┌─────────────────────────────────────────┐
│              Local (SQLite)              │
│  - expenses, invoices, settings         │
│  - Full offline support               │
└──────────────────┬────────────────────┘
                   │ sync (optional)
                   ▼
┌─────────────────────────────────────────┐
│              Backend (MongoDB)           │
│  - expenses, invoices (mirror)          │
│  - Multi-device access                │
└─────────────────────────────────────────┘
```

---

## Data Sync Strategy

| Field | `expenses` | `invoices` |
|-------|-----------|-----------|
| `_id` | UUID (local) | UUID (local) |
| `syncId` | MongoDB ObjectId (after sync) | MongoDB ObjectId (after sync) |
| `status` | `local` / `synced` / `pending` | `local` / `synced` / `pending` |
| `updatedAt` | timestamp | timestamp |

**Sync Flow:**
1. User enables sync in settings + logged in
2. On save: write local first, then queue for sync
3. Background: attempt sync when online
4. On pull: merge by `updatedAt` timestamp

---

## Screen Structure

```
FinanceTab/
├── DashboardScreen     ✅ Sales overview + quick links
├── ExpensesScreen     ✅ Add/edit/delete local expenses
├── CalculatorScreen  ✅ Price calculator (cost + margin)
├── CashFlowScreen   ✅ Income vs expenses chart
├── InvoicesScreen  ✅ Generate from orders
├── SettingsScreen  ✅ Sync toggle + export
└── ProductAnalysisScreen ⏳ Product profit/loss calculator
```

---

## Database Schema

### Local SQLite

```sql
-- expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  category TEXT,
  description TEXT,
  date TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  syncStatus TEXT DEFAULT 'local',
  syncId TEXT
);

-- invoices
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  orderId TEXT,
  invoiceNumber TEXT,
  customerName TEXT,
  items TEXT,
  total REAL,
  createdAt TEXT,
  syncStatus TEXT DEFAULT 'local',
  syncId TEXT
);

-- product_costs (new)
CREATE TABLE product_costs (
  id TEXT PRIMARY KEY,
  productId TEXT,
  productName TEXT,
  materialCost REAL DEFAULT 0,
  laborCost REAL DEFAULT 0,
  shippingCost REAL DEFAULT 0,
  platformFee REAL DEFAULT 0,
  platformFeeType TEXT DEFAULT 'percent',
  otherCosts REAL DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

-- settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### Backend MongoDB

```javascript
// expenses
{
  _id: ObjectId,
  userId: ObjectId,
  localId: String,
  amount: Number,
  category: String,
  description: String,
  date: String,
  createdAt: Date,
  updatedAt: Date,
  source: 'mobile'
}

// invoices
{
  _id: ObjectId,
  userId: ObjectId,
  localId: String,
  orderId: ObjectId,
  invoiceNumber: String,
  customerName: String,
  items: Array,
  total: Number,
  createdAt: Date,
  source: 'mobile'
}

// product_costs
{
  _id: ObjectId,
  userId: ObjectId,
  productId: String,
  productName: String,
  materialCost: Number,
  laborCost: Number,
  shippingCost: Number,
  platformFee: Number,
  platformFeeType: String,  // 'percent' or 'fixed'
  otherCosts: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implemented Features

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| 1 | **Dashboard** | ✅ | Sales overview from orders + local expenses summary |
| 2 | **Expenses Screen** | ✅ | Add/edit/delete local expenses |
| 3 | **Calculator** | ✅ | Simple price calculator (cost + margin) |
| 4 | **Invoices** | ✅ | Generate invoice from orders |
| 5 | **Cash Flow** | ✅ | Income vs expenses chart |
| 6 | **Backend Sync** | ✅ | MongoDB sync + settings |
| 7 | **Product Analysis** | 🚧 | Product profit/loss from existing data + manual edit |

---

## Phase 7: Product Analysis Calculator

### Purpose
Calculate detailed profit/loss for individual products based on seller costs and sales data.

### Data Sources
1. **Existing Data** - Pull from orders, products
2. **Manual Entry** - User can input/edit costs manually
3. **Combined** - Pre-populated + user corrections

### Cost Categories (Per Product)

| Cost Type | Description | Example |
|----------|------------|----------|
| Material | Raw material cost per unit | Rp 5,000 |
| Labor | Labor cost per unit | Rp 2,000 |
| Shipping | Shipping cost per unit | Rp 3,000 |
| Platform Fee | Etsy/Shopee/Tokopedia fee | 5% or Rp 1,000 |
| Other | Packaging, marketing, etc. | Rp 500 |

### Output Metrics

| Metric | Formula |
|--------|---------|
| **Total Cost** | Material + Labor + Shipping + Platform Fee + Other |
| **Revenue** | Selling Price × Units Sold |
| **Gross Profit** | Revenue - (Total Cost × Units Sold) |
| **Profit/Unit** | Selling Price - Total Cost |
| **Margin %** | (Profit/Unit ÷ Selling Price) × 100 |
| **Break-even** | Total Fixed Costs ÷ Profit/Unit |

### Workflow

1. User selects product (from orders/products)
2. System pre-fills data from existing orders
3. User edits/adds cost breakdown
4. User enters: selling price, units sold
5. Dashboard shows profit/loss metrics

### Screen Layout

```
ProductAnalysisScreen
├── ProductSelector (search/select from orders)
├── SalesInput
│   ├── Selling price
│   ├── Units sold
│   └── Units returned
├── CostEditor
│   ├── Material cost
│   ├── Labor cost
│   ├── Shipping cost
│   ├── Platform fee (% or fixed)
│   └── Other costs
└── ResultsDashboard
    ├── Total Cost/Unit
    ├── Total Revenue
    ├── Gross Profit/Loss
    ├── Profit Margin %
    └── Break-even Point
```

---

## API Endpoints (Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/finance/expenses/sync` | POST | Sync local expenses to server |
| `/finance/expenses` | GET | Get expense summary by category |
| `/finance/invoices/sync` | POST | Sync local invoices to server |
| `/finance/summary` | GET | Dashboard summary (sales, expenses, profit) |
| `/finance/product-costs` | GET | Get product cost data |
| `/finance/product-costs` | POST | Save/update product cost data |
| `/finance/product-analysis/:productId` | GET | Product profit analysis |

---

## Files Created

```
mobile/src/
├── services/
│   ├── FinanceDB.js        # SQLite database helper
│   └── FinanceSync.js   # Backend sync service
└── screens/finance/
    ├── DashboardScreen.js    # Main dashboard
    ├── ExpensesScreen.js   # Expense management
    ├── CalculatorScreen.js   # Simple price calculator
    ├── CashFlowScreen.js   # Cash flow analysis
    ├── InvoicesScreen.js  # Invoice generation
    ├── SettingsScreen.js  # Sync settings
    └── ProductAnalysisScreen.js  # NEW: Product profit calculator

backend/internal/
├── handlers/
│   └── finance.go      # Finance API handlers
└── models/
    └── expense.go     # Expense model
```

---

## Dependencies

```bash
# Mobile
npx expo install expo-sqlite

# Backend (already have MongoDB)
```

---

## Build Notes

- SQLite for offline-first experience
- Sync as optional toggle in settings
- Export data as JSON for manual backup
- Product costs stored locally, can pre-fill from orders
- Recurring costs excluded (focus on product-level costs only)