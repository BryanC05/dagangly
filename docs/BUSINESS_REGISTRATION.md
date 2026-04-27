# Business Registration Feature Specification

## Overview
This document outlines the changes required to implement a business/seller registration system where:
- Users can apply to become a seller by submitting a business registration form
- Admin must approve the application before the user becomes a seller
- Only approved sellers can access seller-specific features

---

## 1. User Model Changes

### Schema Updates
Add the following fields to the user model:

```javascript
// User Schema
{
  // ... existing fields
  isSeller: Boolean,        // false by default, true when approved
  businessInfo: {
    businessName: String,        // Required
    businessAddress: String,    // Required
    NPWP: String,              // Optional
    category: String,           // Required (e.g., food, fashion, electronics)
    registeredAt: Date           // When application was submitted
  }
}
```

### Database Collection
- **Collection**: `users`
- **Update Type**: Add new fields to existing collection

---

## 2. Backend API Endpoints

### New Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/users/register-business` | Submit business registration | Required |
| GET | `/api/admin/pending-registrations` | List pending applications | Admin only |
| POST | `/api/admin/approve-registration/:userId` | Approve a seller | Admin only |
| POST | `/api/admin/deny-registration/:userId` | Deny a seller | Admin only |

### Response Schemas

#### POST /api/users/register-business
**Request:**
```javascript
{
  businessName: String,
  businessAddress: String,
  NPWP: String,        // Optional
  category: String
}
```

**Response:**
```javascript
{
  message: "Application submitted, awaiting approval"
}
```

#### POST /api/admin/approve-registration/:userId
**Response:**
```javascript
{
  message: "Registration approved",
  user: { ... }
}
```

---

## 3. Frontend Pages

### New Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/register-business` | RegisterBusiness | Business registration form |
| `/admin/registrations` | PendingRegistrations | Admin approval page |

### Route Protection

**Protected Routes (require isSeller = true):**
- `/finance` - Finance Dashboard
- `/finance/expenses` - Expenses
- `/finance/calculator` - Calculator
- `/finance/profit-calculator` - Profit Calculator
- `/finance/ai` - AI Consultant
- `/finance/product-expenses` - Product Expenses
- `/finance/invoices` - Invoices
- `/seller-dashboard` - Seller Dashboard
- `/inventory` - Inventory
- `/products/add` - Add Product

**Conditional Display:**
- Show "Register as Seller" button for non-sellers
- Show seller navigation items only for sellers

### Registration Form Fields
- Business Name (required)
- Business Address (required)
- NPWP (optional)
- Business Category (required)
  - Options: Food & Beverages, Fashion, Electronics, Home & Living, Beauty, Handicrafts, Agriculture, Other

---

## 4. Admin Panel

### Pending Registrations Page
- List all users with pending business applications
- Show: Name, Business Name, Category, Submitted Date
- Actions: Approve, Deny

---

## 5. Notification System

### In-App Notifications (Future Expansion)
- Application submitted
- Application approved/denied

---

## 6. Implementation Tasks

### Backend
- [x] Update user model/schema
- [x] Create business registration endpoint
- [x] Create admin approval endpoints

### Frontend
- [x] Create RegisterBusiness page
- [x] Create AdminPendingRegistrations page
- [x] Update route guards
- [x] Update navigation to show/hide based on isSeller

### Database
- [ ] Run migration to add new fields to users collection

---

## 7. User Flow

### New Seller Registration
1. User visits `/register-business`
2. Fills business registration form
3. Submits form
4. Sees "Application submitted, awaiting approval" message
5. Admin reviews and approves
6. User gets access to seller features

### Existing Users
- Users without seller account see "Become a Seller" option
- Existing sellers (isSeller = true) keep their access
- No changes to existing functionality

---

## 8. Security Considerations

- Only authenticated users can submit registration
- Only admins can approve/deny registrations
- Validate all form inputs
- Sanitize business information

---

## 9. Future Enhancements (Out of Scope)

- Business reactivation after denial
- Email notifications
- Business verification documents upload
- Multiple shop support per seller
- Seller rating/reviews
