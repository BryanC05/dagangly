# Financial Assistant - Implementation Plan

## Overview

A financial management tool for MSME sellers to track sales, expenses, generate invoices, and get AI-powered financial advice.

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
├── DashboardScreen    ← Pulls sales from orders + local expenses
├── ExpensesScreen     ← Add/edit expenses (local + sync)
├── InvoicesScreen    ← Generate from orders (local + sync)
├── CalculatorScreen  ← Price calculator (local only)
├── CashFlowScreen    ← income - expenses (local + sync)
├── SettingsScreen   ← Enable/disable sync
└── (Future) AIChatScreen
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
  amount: Number,
  category: String,
  description: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date,
  source: 'mobile'
}

// invoices
{
  _id: ObjectId,
  userId: ObjectId,
  orderId: ObjectId,
  invoiceNumber: String,
  customerName: String,
  items: Array,
  total: Number,
  createdAt: Date,
  source: 'mobile'
}
```

---

## Features & Priority

| Phase | Feature | Description |
|-------|---------|-------------|
| 1 | **Dashboard** | Sales overview from orders + local expenses summary |
| 2 | **Expenses Screen** | Add/edit/delete local expenses |
| 3 | **Calculator** | Price calculator (cost + margin → selling price) |
| 4 | **Invoices** | Generate invoice from orders |
| 5 | **Cash Flow** | Income vs expenses chart |
| 6 | **Backend Sync** | MongoDB sync + settings |
| 7 | **AI Chat** | Financial assistant chat |

---

## Integration Points

| Source | Data |
|--------|------|
| Backend | `orders` collection → sales data |
| Backend | `products` → cost data |
| New | `expenses` table (local) |
| New | `invoices` table (local) |

---

## API Endpoints (Backend)

```javascript
// POST /finance/expenses/sync
// GET /finance/expenses
// POST /finance/expenses
// PUT /finance/expenses/:id
// DELETE /finance/expenses/:id

// GET /finance/invoices
// POST /finance/invoices
// GET /finance/invoices/:id
// GET /finance/summary
```

---

## Dependencies

```bash
npx expo install expo-sqlite
```

---

## Build Notes

- Research AI model for chat assistant before Phase 7
- Start with SQLite for offline-first experience
- Add sync option as toggle in settings
- Export data as JSON/CSV for manual backup