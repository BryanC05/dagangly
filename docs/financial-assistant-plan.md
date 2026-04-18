# Financial Assistant - Implementation Plan

## Overview

A financial management tool for MSME sellers to track sales, expenses, generate invoices, and get AI-powered financial advice.

---

## Status: ✅ COMPLETED (Phases 1-6)

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
├── DashboardScreen    ✅ Sales overview + quick links
├── ExpensesScreen     ✅ Add/edit/delete local expenses
├── CalculatorScreen  ✅ Price calculator (cost + margin)
├── CashFlowScreen    ✅ Income vs expenses chart
├── InvoicesScreen    ✅ Generate from orders
├── SettingsScreen   ✅ Sync toggle + export
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
```

---

## Implemented Features

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| 1 | **Dashboard** | ✅ | Sales overview from orders + local expenses summary |
| 2 | **Expenses Screen** | ✅ | Add/edit/delete local expenses |
| 3 | **Calculator** | ✅ | Price calculator (cost + margin → selling price) |
| 4 | **Invoices** | ✅ | Generate invoice from orders |
| 5 | **Cash Flow** | ✅ | Income vs expenses chart |
| 6 | **Backend Sync** | ✅ | MongoDB sync + settings |
| 7 | **AI Chat** | ⏳ | Financial assistant chat |

---

## API Endpoints (Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/finance/expenses/sync` | POST | Sync local expenses to server |
| `/finance/expenses` | GET | Get expense summary by category |
| `/finance/invoices/sync` | POST | Sync local invoices to server |
| `/finance/summary` | GET | Dashboard summary (sales, expenses, profit) |

---

## Files Created

```
mobile/src/
├── services/
│   ├── FinanceDB.js        # SQLite database helper
│   └── FinanceSync.js      # Backend sync service
└── screens/finance/
    ├── DashboardScreen.js  # Main dashboard with stats
    ├── ExpensesScreen.js   # Expense management
    ├── CalculatorScreen.js  # Price calculator
    ├── CashFlowScreen.js   # Cash flow analysis
    ├── InvoicesScreen.js  # Invoice generation
    └── SettingsScreen.js  # Sync settings

backend/internal/
├── handlers/
│   └── finance.go        # Finance API handlers
└── models/
    └── expense.go       # Expense model
```

---

## Dependencies

```bash
# Mobile
npx expo install expo-sqlite

# Backend (already have MongoDB)
```

---

## Next: AI Chat (Phase 7)

Research AI model for financial advice. Options:
- Custom LLM fine-tuned on financial data
- OpenAI API with financial system prompt
- Local rules-based for simple advice

---

## Build Notes

- SQLite for offline-first experience
- Sync as optional toggle in settings
- Export data as JSON for manual backup
- All finance screens accessible from Dashboard