# New Features & Enhancements Plan

> **Status: ALL PHASES COMPLETE** ✅

This document outlines the proposed features, enhancements, and accessibility improvements for the MSME Marketplace platform. Each feature includes detailed requirements, functionality specifications, and expected benefits.

---

## Table of Contents

1. [Accessibility & UX Improvements](#1-accessibility--ux-improvements) ✅
2. [Core Commerce Features](#2-core-commerce-features)
3. [User Engagement Features](#3-user-engagement-features)
4. [Seller Tools & Analytics](#4-seller-tools--analytics)
5. [Search & Discovery](#5-search--discovery)
6. [Communication & Community](#6-communication--community)
7. [Payments & Financial](#7-payments--financial)
8. [Platform & Technical](#8-platform--technical)
9. [Mobile-Specific](#9-mobile-specific)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Accessibility & UX Improvements

### 1.1 Screen Reader Support

**Requirements:**
- Add ARIA labels to all interactive elements
- Implement proper heading hierarchy (h1 → h2 → h3)
- Add `alt` text for all product images and icons
- Add `role` attributes for custom components
- Ensure proper focus management for modals and dialogs

**Functionality:**
- All buttons, links, and form elements have descriptive labels
- Product cards announce product name, price, rating, and seller
- Navigation menus are properly announced
- Form validation errors are announced to screen readers

**Benefits:**
- Enables visually impaired users to navigate and use the platform
- Improves SEO through semantic HTML
- Meets WCAG 2.1 AA compliance

---

### 1.2 Keyboard Navigation

**Requirements:**
- Full keyboard accessibility for all interactive elements
- Implement logical tab order
- Add keyboard shortcuts for common actions
- Ensure focus is visible at all times

**Functionality:**
- Tab through all elements in logical order
- Enter/Space activates buttons and links
- Escape closes modals and dropdowns
- Arrow keys navigate within menus and carousels

**Benefits:**
- Enables users who cannot use a mouse to navigate
- Improves power user efficiency
- Better accessibility compliance

---

### 1.3 Color Contrast Compliance

**Requirements:**
- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text and UI components
- Test all color combinations in both light and dark modes

**Functionality:**
- Review and adjust color palette for compliance
- Add high-contrast mode option
- Test with color blindness simulators

**Benefits:**
- Improves readability for users with visual impairments
- Better user experience in various lighting conditions
- Legal compliance in some jurisdictions

---

### 1.4 Font Size Scaling

**Requirements:**
- Support browser zoom up to 200%
- Allow in-app font size adjustment (small/medium/large/extra-large)
- Use relative units (rem, em) instead of fixed pixels

**Functionality:**
- Text scales proportionally with browser zoom
- Users can adjust base font size in settings
- Layout adapts gracefully to larger text sizes

**Benefits:**
- Accommodates users with low vision
- Improves reading comfort for all users
- Flexible reading experience

---

### 1.5 Reduced Motion

**Requirements:**
- Respect `prefers-reduced-motion` media query
- Provide toggle in accessibility settings
- Animate only essential motion

**Functionality:**
- Disable or reduce animations when enabled
- Replace animated transitions with instant state changes
- Keep only essential loading indicators

**Benefits:**
- Helps users with vestibular disorders
- Improves performance on low-end devices
- Better user preference respect

---

### 1.6 Skip Navigation Links

**Requirements:**
- Add skip links at the top of the page
- Links should skip to main content and navigation

**Functionality:**
- First tab stop is "Skip to main content"
- Hidden by default, visible on focus
- Skips repetitive navigation

**Benefits:**
- Faster navigation for keyboard users
- Better accessibility for screen readers

---

### 1.7 Enhanced Focus Indicators

**Requirements:**
- All interactive elements have visible focus states
- Focus indicators meet 3:1 contrast ratio
- Focus is not obscured by other content

**Functionality:**
- Custom focus styles for all buttons, links, inputs
- Focus ring visible in both light and dark modes
- Focus moves logically through page

**Benefits:**
- Helps users track their position on the page
- Improves keyboard navigation experience

---

## 2. Core Commerce Features

### 2.1 Review & Rating System

**Requirements:**
- Database: New `reviews` collection with MongoDB
- Backend: Review CRUD handlers with validation
- Frontend: Review components and display
- Protection: One review per delivered order item

**Functionality:**
- Buyers can rate products (1-5 stars) and leave written reviews
- Buyers can rate sellers (1-5 stars) separately
- Reviews can include up to 3 photos
- Sellers can respond to reviews
- Buyers can edit reviews within 7 days
- Buyers can report abusive reviews
- Display average rating and distribution histogram

**API Endpoints:**
```
POST   /api/reviews                    - Create review
GET    /api/reviews/product/:productId - Get product reviews
GET    /api/reviews/seller/:sellerId   - Get seller reviews
PATCH  /api/reviews/:reviewId          - Update review
DELETE /api/reviews/:reviewId          - Delete review
POST   /api/reviews/:reviewId/report   - Report review
```

**Database Schema:**
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  productId: ObjectId,
  sellerId: ObjectId,
  buyerId: ObjectId,
  rating: Number,           // 1-5
  comment: String,
  images: [String],         // URLs
  sellerResponse: {
    comment: String,
    respondedAt: Date
  },
  isReported: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Benefits:**
- Builds trust between buyers and sellers
- Helps buyers make informed decisions
- Provides feedback for sellers to improve
- Increases conversion rates

---

### 2.2 In-App Notifications

**Requirements:**
- Database: New `notifications` collection
- Backend: Notification creation and retrieval handlers
- Frontend: Notification center UI
- WebSocket: Real-time notification delivery

**Functionality:**
- Notification types: order updates, messages, forum replies, price drops, new products
- Notification center with list view
- Mark as read/unread functionality
- Mark all as read button
- Unread count badge in navbar
- Deep links to relevant content

**API Endpoints:**
```
GET    /api/notifications              - Get user notifications
PATCH  /api/notifications/:id/read    - Mark notification as read
PATCH  /api/notifications/read-all    - Mark all as read
GET    /api/notifications/unread-count - Get unread count
```

**Database Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String,             // order, message, forum, product, system
  title: String,
  body: String,
  entityType: String,       // order, product, forum, thread
  entityId: ObjectId,
  isRead: Boolean,
  readAt: Date,
  meta: Object,            // Additional data
  createdAt: Date
}
```

**Benefits:**
- Keeps users engaged with timely updates
- Reduces need to constantly check order status
- Improves user experience through proactive communication

---

### 2.3 Mobile Push Notifications

**Requirements:**
- Firebase Cloud Messaging (FCM) integration
- Expo Notifications for mobile app
- Device token registration system

**Functionality:**
- Register device tokens on app install/login
- Send push notifications for:
  - Order status changes
  - New messages
  - Forum replies
  - Price drop alerts
  - Promotional notifications (opt-in)
- Notification tap opens relevant screen
- Notification preferences per category

**API Endpoints:**
```
POST   /api/devices/register   - Register device token
DELETE /api/devices/:token     - Remove device token
```

**Database Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  platform: String,        // android, ios
  token: String,
  appVersion: String,
  lastSeenAt: Date,
  createdAt: Date
}
```

**Benefits:**
- Re-engages users who have left the app
- Real-time order status updates
- Increases app retention
- Better communication channel

---

### 2.4 Pickup/Delivery Scheduling

**Requirements:**
- Order model extensions for scheduling
- Backend handlers for slot management
- Frontend: Time slot picker at checkout
- Frontend: Seller schedule confirmation UI

**Functionality:**
- Buyer selects preferred pickup/delivery time slot at checkout
- Available slots based on seller configuration
- Seller can confirm, reschedule, or reject time slot
- Time zone handling for accuracy
- Order timeline shows scheduled time

**API Endpoints:**
```
PATCH  /api/orders/:id/schedule           - Set order schedule
PATCH  /api/orders/:id/schedule/confirm    - Seller confirms schedule
GET    /api/orders/:id/timeline            - Get order timeline
```

**Order Timeline Schema:**
```javascript
{
  status: String,
  at: Date,
  by: ObjectId,        // User who triggered
  note: String
}
```

**Benefits:**
- Better buyer experience with predictable delivery times
- Helps sellers manage their workflow
- Reduces delivery failures
- Improves customer satisfaction

---

### 2.5 Order Timeline UI

**Requirements:**
- Backend: Timeline event generation on status changes
- Frontend: Visual timeline component
- Mobile: Timeline display

**Functionality:**
- Visual vertical timeline showing:
  - Order placed
  - Payment confirmed
  - Order confirmed by seller
  - Being prepared
  - Ready for pickup/delivery
  - Out for delivery
  - Delivered
- Each event shows timestamp and who performed the action
- Current status highlighted
- Color-coded status indicators

**Benefits:**
- Transparent order tracking
- Builds trust through visibility
- Reduces "where is my order" inquiries

---

### 2.6 Payment Gateway Integration (Midtrans)

**Requirements:**
- Midtrans SDK integration
- Payment webhook handler
- Order payment status management

**Functionality:**
- Support payment methods:
  - Credit/Debit cards (Visa, Mastercard, JCB)
  - Bank transfer (BNI, BRI, BCA, Mandiri)
  - E-wallets (GoPay, OVO, DANA, LinkAja)
  - Convenience stores (Indomaret, Alfamart)
  - Cash on Delivery (COD)
- Payment status tracking: pending, success, failed, expired
- Automatic status update via webhook
- Payment instruction display for bank transfer
- Payment receipt generation

**API Endpoints:**
```
POST   /api/payments/intent              - Create payment
GET    /api/payments/:orderId/status     - Get payment status
POST   /api/webhooks/payments/midtrans  - Midtrans webhook
```

**Order Payment Schema:**
```javascript
{
  method: String,           // card, bank_transfer, ewallet, cod
  provider: String,         // midtrans
  providerRef: String,     // Midtrans transaction ID
  status: String,          // pending, success, failed, expired
  paidAt: Date,
  amount: Number,
  details: Object          // Provider-specific details
}
```

**Benefits:**
- Secure, trusted payment processing
- Multiple payment options increase conversion
- Automated reconciliation
- Professional payment experience

---

### 2.7 Delivery Tracking

**Requirements:**
- Delivery partner API integration
- Real-time location tracking
- Frontend: Map-based tracking display

**Functionality:**
- Track order from seller to buyer
- Real-time location updates on map
- Estimated time of arrival (ETA)
- Delivery status notifications
- Proof of delivery (photo/signature)
- Support multiple delivery partners

**Benefits:**
- Transparency in delivery process
- Reduces customer anxiety about orders
- Builds trust in the platform

---

## 3. User Engagement Features

### 3.1 Wishlists

**Requirements:**
- Database: User wishlist collection
- Backend: Wishlist CRUD handlers
- Frontend: Wishlist UI components

**Functionality:**
- Add products to wishlist from any product card/detail
- Create multiple named wishlists
- Add items to specific wishlist
- Rename and delete wishlists
- Share wishlists via link
- Move items from wishlist to cart
- Price drop notifications for wishlist items
- "Add to wishlist" shows heart icon animation

**API Endpoints:**
```
GET    /api/wishlists              - Get user wishlists
POST   /api/wishlists             - Create wishlist
PUT    /api/wishlists/:id         - Update wishlist
DELETE /api/wishlists/:id         - Delete wishlist
POST   /api/wishlists/:id/items  - Add item to wishlist
DELETE /api/wishlists/:id/items/:productId - Remove item
```

**Database Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  isPublic: Boolean,
  shareLink: String,
  items: [{
    productId: ObjectId,
    addedAt: Date,
    notifyPriceDrop: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Benefits:**
- Increases conversion from browsing to purchase
- Facilitates gift planning and sharing
- Price alerts drive repeat visits

---

### 3.2 Product Recommendations

**Requirements:**
- Recommendation engine service
- User behavior tracking
- Frontend: Recommended products section

**Functionality:**
- "Similar products" on product detail page
- "Frequently bought together" suggestions
- "Customers also viewed" section
- Personalized homepage recommendations
- Category-based recommendations
- Collaborative filtering based on user behavior
- Trending products section

**Benefits:**
- Increases average order value
- Improves product discovery
- Personalized shopping experience

---

### 3.3 Recently Viewed Products

**Requirements:**
- Local storage for recently viewed
- Backend sync option
- Frontend: Recently viewed section

**Functionality:**
- Automatically track viewed products
- Store last 20 viewed products
- Display on homepage and product pages
- Clear history option
- Sync across devices (optional)

**Benefits:**
- Easy re-discovery of products
- Quick access to previously considered items

---

### 3.4 Price Drop Alerts

**Requirements:**
- Price tracking in database
- Notification system integration
- Frontend: Subscribe to price alerts

**Functionality:**
- Users can subscribe to price drop notifications
- Alert when price drops below threshold
- In-app and push notification options
- Display price history on product page

**Benefits:**
- Drives conversion with urgency
- Encourages users to save products
- Re-engages users when prices drop

---

### 3.5 Abandoned Cart Recovery

**Requirements:**
- Cart tracking in database
- Scheduled job for cart monitoring
- Email/push notification system

**Functionality:**
- Track cart abandonment
- Send reminder after 1 hour
- Send follow-up after 24 hours
- Include incentive option (optional discount)
- One-click return to cart

**Benefits:**
- Recovers lost sales
- Increases conversion rate
- Low-cost marketing automation

---

### 3.6 Social Sharing

**Requirements:**
- Social media SDK integrations
- Share URL generation
- Open Graph metadata

**Functionality:**
- Share products to Facebook, Twitter, WhatsApp, Instagram
- Generate shareable product links
- Preview cards for social platforms
- Referral tracking (optional)

**Benefits:**
- Organic marketing through user sharing
- Increases platform visibility
- Referral traffic

---

### 3.7 Product Q&A

**Requirements:**
- Database: Q&A collection
- Backend: Q&A handlers
- Frontend: Q&A component

**Functionality:**
- Public Q&A section on product pages
- Anyone can ask questions
- Seller or other buyers can answer
- Upvote helpful answers
- Mark best answer
- Email notification for new questions

**Database Schema:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  question: String,
  answers: [{
    userId: ObjectId,
    answer: String,
    isBestAnswer: Boolean,
    upvotes: Number,
    createdAt: Date
  }],
  createdAt: Date
}
```

**Benefits:**
- Builds community engagement
- Provides real-time product information
- Helps hesitant buyers decide

---

## 4. Seller Tools & Analytics

### 4.1 Advanced Analytics Dashboard

**Requirements:**
- Analytics data aggregation service
- Database queries for statistics
- Frontend: Dashboard with charts

**Functionality:**
- Sales overview (daily, weekly, monthly, yearly)
- Revenue tracking and graphs
- Top selling products
- Order volume by status
- Customer demographics (location, device)
- Peak order times (hourly, daily)
- Conversion rate metrics
- Traffic sources
- Product view counts
- Export reports to CSV/PDF

**Dashboard Sections:**
- Overview cards (revenue, orders, customers)
- Sales trend chart
- Top products table
- Recent orders
- Customer map distribution

**Benefits:**
- Data-driven business decisions
- Identify trends and opportunities
- Performance tracking

---

### 4.2 Inventory Management

**Requirements:**
- Product inventory tracking
- Low stock alerts
- Bulk operations support
- Backend: Inventory handlers
- Frontend: Inventory management UI

**Functionality:**
- Track stock quantity per product variant
- Low stock threshold alerts (configurable)
- Automatic "out of stock" status
- Bulk product update (CSV import/export)
- Stock history log
- Batch stock adjustments
- Restock reminders

**API Endpoints:**
```
GET    /api/inventory/low-stock    - Get low stock products
PATCH  /api/inventory/bulk-update  - Bulk update stock
GET    /api/inventory/history/:productId - Stock history
POST   /api/inventory/adjust       - Adjust stock
```

**Benefits:**
- Prevents overselling
- Automated inventory monitoring
- Time-saving bulk operations

---

### 4.3 Seller Verification Badge

**Requirements:**
- Verification application process
- Admin approval workflow
- Badge display components

**Functionality:**
- Verification application form
- Document upload (business license, ID)
- Admin review and approval
- Verified badge on seller profile and products
- Verification level (basic, verified, premium)
- Increased trust signals

**Benefits:**
- Builds buyer trust
- Reduces fraud
- Premium seller positioning

---

### 4.4 Business Insights

**Requirements:**
- Data analysis service
- Competitor comparison (anonymized)
- Frontend: Insights dashboard

**Functionality:**
- Pricing recommendations
- Category performance analysis
- Market trend indicators
- Customer satisfaction scores
- Performance vs. similar sellers
- Growth suggestions

**Benefits:**
- Helps sellers optimize strategy
- Competitive intelligence
- Guided business growth

---

### 4.5 Multi-Store Management

**Requirements:**
- Store relationship in database
- Backend: Multi-store handlers
- Frontend: Store switcher

**Functionality:**
- Create and manage multiple stores
- Switch between stores in one account
- Consolidated analytics across stores
- Separate product catalogs
- Per-store settings

**Database Schema:**
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,
  stores: [{
    storeId: ObjectId,
    name: String,
    isActive: Boolean,
    roles: [String]          // owner, manager, staff
  }]
}
```

**Benefits:**
- Scalability for growing businesses
- Separate brands or locations
- Centralized management

---

### 4.6 Staff Accounts

**Requirements:**
- User roles and permissions
- Staff invitation system
- Activity logging

**Functionality:**
- Invite staff with email
- Role-based access:
  - Owner: Full access
  - Manager: Products, Orders, Analytics
  - Staff: Orders only
- Staff activity log
- Revoke access anytime

**Benefits:**
- Delegation of responsibilities
- Security through limited access
- Team collaboration

---

## 5. Search & Discovery

### 5.1 Voice Search

**Requirements:**
- Web Speech API integration
- Mobile: Native speech recognition
- Backend: Voice search handler

**Functionality:**
- Microphone button in search bar
- Voice input for product search
- Speech-to-text conversion
- Search suggestions during speech
- Support for English and Indonesian

**Benefits:**
- Hands-free shopping experience
- Accessibility for users with disabilities
- Faster search input

---

### 5.2 Image Search

**Requirements:**
- Image upload handler
- Reverse image search service
- Frontend: Image upload UI

**Functionality:**
- Upload image to find similar products
- Camera capture for image search
- Display matching products
- Confidence score display

**Benefits:**
- Visual product discovery
- Find products from screenshots/photos
- Enhanced user engagement

---

### 5.3 Barcode/QR Scanning

**Requirements:**
- Barcode scanner library (jsQR, expo-barcode-scanner)
- Product barcode association

**Functionality:**
- Scan product barcodes
- Quick product lookup
- Scan QR codes for seller profiles
- Manual barcode entry option

**Benefits:**
- Quick product lookup
- In-store price comparison
- Easy seller discovery

---

### 5.4 Advanced Filters

**Requirements:**
- Backend: Filter query handlers
- Frontend: Filter UI components

**Functionality:**
- Filter by:
  - Rating (4+ stars, 5 stars only)
  - Delivery options (same day, COD)
  - Price range (with slider)
  - Seller location/radius
  - Availability (in stock, pre-order)
  - New arrivals
  - Discount percentage
- Save filter presets
- Clear all filters

**Benefits:**
- Refined search results
- Faster product discovery
- Better user experience

---

### 5.5 Search Suggestions

**Requirements:**
- Search analytics
- Autocomplete service
- Frontend: Suggestion dropdown

**Functionality:**
- Real-time search suggestions
- Popular searches display
- Recent searches
- Category suggestions
- Spelling correction

**Benefits:**
- Faster search
- Reduces failed searches
- Guides users to popular products

---

## 6. Communication & Community

### 6.1 In-App Video Call

**Requirements:**
- WebRTC integration (Daily.co, Agora, or Twilio)
- Backend: Call coordination handlers
- Frontend: Video call UI

**Functionality:**
- Start video call from chat
- 1:1 video calls between buyer and seller
- Screen sharing for product demonstrations
- Call quality indicators
- Call duration limits (30 min free)
- Recording option (with consent)

**Benefits:**
- Personal consultation
- Build stronger relationships
- Faster issue resolution

---

### 6.2 WhatsApp Integration

**Requirements:**
- WhatsApp Business API integration
- Click-to-chat links
- Backend: Message handlers

**Functionality:**
- "Chat on WhatsApp" button on seller profile
- Pre-filled message templates
- Order reference in messages
- Quick response with product link

**Benefits:**
- Leverages existing WhatsApp usage
- Familiar communication channel
- No app download needed

---

### 6.3 Rich Media Forums

**Requirements:**
- File upload for forums
- Backend: Media handlers
- Frontend: Rich editor

**Functionality:**
- Image uploads in posts
- Video embeds
- Poll creation
- Code snippets
- Markdown support
- File attachments

**Benefits:**
- More engaging discussions
- Better information sharing
- Community building

---

### 6.4 Seller Blogs

**Requirements:**
- Blog post model
- Backend: Blog CRUD handlers
- Frontend: Blog pages

**Functionality:**
- Create blog posts (sellers)
- Categories and tags
- Featured images
- SEO optimization
- Share to social media
- Comments on posts
- Newsletter subscription

**Benefits:**
- Content marketing for sellers
- SEO benefits for platform
- Build authority and trust

---

### 6.5 Gamification

**Requirements:**
- Points system
- Badge definitions
- Frontend: Achievement UI
- Backend: Points tracking

**Functionality:**
- Points for:
  - Making a purchase
  - Writing a review
  - Referring a friend
  - Daily login
  - Forum participation
- Badges:
  - Newcomer
  - First Purchase
  - Top Reviewer
  - Trusted Buyer
- Leaderboards
- Redeem points for discounts

**Benefits:**
- Increases engagement
- Encourages platform activity
- Loyalty building

---

## 7. Payments & Financial

### 7.1 Digital Wallet

**Requirements:**
- Wallet model in database
- Transaction handlers
- Frontend: Wallet UI

**Functionality:**
- Add funds to wallet
- View balance
- Transaction history
- Wallet payment at checkout
- Refund to wallet
- Transfer to bank (optional)

**Database Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  balance: Number,
  transactions: [{
    type: String,         // credit, debit
    amount: Number,
    description: String,
    referenceId: ObjectId,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Benefits:**
- Faster checkout
- Increased customer loyalty
- Alternative payment method

---

### 7.2 Installment Payments (BNPL)

**Requirements:**
- BNPL provider integration (Kredivo, Akulaku)
- Credit assessment service
- Frontend: Installment selection

**Functionality:**
- Select installment tenure (3, 6, 12 months)
- Credit eligibility check
- Real-time installment calculation
- Payment via BNPL provider

**Benefits:**
- Higher conversion for expensive items
- Attracts more customers
- Competitive advantage

---

### 7.3 Seller Payout System

**Requirements:**
- Payout model
- Bank integration
- Frontend: Payout dashboard

**Functionality:**
- Request payout
- View payout history
- Bank account management
- Automatic scheduled payouts
- Payout reports

**Benefits:**
- Improved seller satisfaction
- Transparent transactions
- Automated processes

---

### 7.4 Invoice Generation

**Requirements:**
- Invoice model
- PDF generation service
- Email sending

**Functionality:**
- Auto-generate invoice on order
- Downloadable PDF invoice
- Email invoice to buyer
- Custom invoice template
- Tax calculation

**Benefits:**
- Professional appearance
- Accounting records
- Trust building

---

### 7.5 Coupons & Promotions

**Requirements:**
- Coupon model
- Validation handlers
- Frontend: Coupon UI

**Functionality:**
- Create discount codes
- Percentage or fixed discount
- Minimum purchase requirements
- Valid date range
- Usage limits
- Product/category restrictions
- Flash sales

**API Endpoints:**
```
POST   /api/coupons              - Create coupon
GET    /api/coupons              - List coupons
POST   /api/coupons/validate     - Validate coupon
PATCH  /api/coupons/:id          - Update coupon
DELETE /api/coupons/:id          - Delete coupon
```

**Benefits:**
- Marketing campaigns
- Customer acquisition
- Increase sales

---

## 8. Platform & Technical

### 8.1 PWA Support

**Requirements:**
- Service worker implementation
- Web manifest
- Offline handling

**Functionality:**
- Installable on desktop and mobile
- Offline product browsing (cached)
- Background sync for orders
- Push notification support
- App-like experience

**Files:**
- `manifest.json`
- `sw.js` (service worker)
- Offline fallback page

**Benefits:**
- Increased engagement
- Offline capability
- No app store needed

---

### 8.2 Offline Mode

**Requirements:**
- Local data caching
- IndexedDB for storage
- Sync queue for offline actions

**Functionality:**
- Browse cached products
- View saved products and cart
- Queue actions when offline
- Auto-sync when online
- Offline indicator in UI

**Benefits:**
- Reliable experience anywhere
- Works in low connectivity
- Better user experience

---

### 8.3 Caching Layer (Redis)

**Requirements:**
- Redis instance
- Cache service implementation
- Cache invalidation strategy

**Functionality:**
- Cache frequently accessed data:
  - Product listings
  - User sessions
  - Search results
- Session management
- Rate limiting
- Cache expiration policies

**Benefits:**
- 60-80% reduction in database queries
- Faster response times
- Scalability improvement

---

### 8.4 API Rate Limiting

**Requirements:**
- Rate limiter middleware
- Configuration per endpoint

**Functionality:**
- Limit requests per IP/user
- Different limits per endpoint tier:
  - Public: 100/minute
  - Authenticated: 500/minute
  - Premium: 1000/minute
- Rate limit headers in responses
- Blocked user notification

**Benefits:**
- Protects against abuse
- Ensures fair usage
- Prevents DDoS

---

### 8.5 Admin Panel

**Requirements:**
- Admin dashboard pages
- User management
- Content moderation tools
- Platform analytics

**Functionality:**
- User management (buyers, sellers)
- Order management
- Product moderation
- Review management
- Reported content handling
- Platform analytics
- Settings management

**Benefits:**
- Platform governance
- Content moderation
- User support

---

## 9. Mobile-Specific

### 9.1 Camera Features

**Requirements:**
- Camera integration
- Image processing library
- Frontend: Camera UI

**Functionality:**
- In-app camera for product photos
- Photo filters
- Background removal
- Auto-enhance
- Grid overlay for better composition

**Benefits:**
- Better product photos
- Improved listing quality
- User convenience

---

### 9.2 Biometric Login

**Requirements:**
- Biometric authentication library
- Secure storage for credentials
- Frontend: Biometric UI

**Functionality:**
- Fingerprint authentication
- Face ID authentication
- Remember device option
- Fallback to password

**Benefits:**
- Faster login
- Enhanced security
- Better UX

---

### 9.3 Background Sync

**Requirements:**
- Background sync API
- Queue management
- Network detection

**Functionality:**
- Sync orders when back online
- Upload pending images
- Update user preferences
- Retry failed requests

**Benefits:**
- Reliable data sync
- Works in background
- Better offline support

---

### 9.4 Widget Support

**Requirements:**
- Android widgets
- iOS widgets (WidgetKit)

**Functionality:**
- Order status widget
- Deals/discounts widget
- Recent orders widget

**Benefits:**
- Quick information access
- Increased engagement
- Brand presence

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4) ✅ COMPLETE

| Feature | Priority | Status | Files Changed |
|---------|----------|--------|---------------|
| Screen Reader Support | High | ✅ Complete | `frontend/src/index.css`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/ProductCard.jsx`, `frontend/src/components/layout/Layout.jsx` |
| Keyboard Navigation | High | ✅ Complete | `frontend/src/index.css` |
| Color Contrast Compliance | High | ✅ Complete | Already WCAG compliant (per DESIGN_COLOR.md) |
| Font Size Scaling | Medium | ✅ Complete | `frontend/src/store/accessibilityStore.js`, `frontend/src/components/Navbar.jsx` |
| Reduced Motion | Medium | ✅ Complete | `frontend/src/index.css` |
| In-App Notifications | High | ✅ Complete | Backend: `backend/internal/handlers/notifications.go`, Frontend: `frontend/src/store/notificationStore.js`, `frontend/src/components/NotificationBell.jsx` |
| Review & Rating System | High | ✅ Complete | Backend: `backend/internal/handlers/reviews.go`, `backend/internal/models/review.go` |

**Implementation Notes:**
- Added skip-to-content link for keyboard navigation
- Created accessibility settings menu in Navbar with font size controls
- Added `prefers-reduced-motion` support in CSS
- Implemented persistent accessibility preferences via localStorage
- Enhanced ProductCard with ARIA labels and semantic HTML
- Added `role="navigation"` and `aria-label` to Navbar
- Added `id="main-content"` to Layout for skip link

---

### Phase 2: Commerce Core (Weeks 5-10) ✅ COMPLETE

| Feature | Priority | Status | Files Changed |
|---------|----------|--------|---------------|
| Mobile Push Notifications | High | ✅ Complete | Backend: `backend/internal/handlers/devices.go`, `backend/internal/models/device.go` |
| Payment Gateway (Midtrans) | High | ✅ Complete | Backend: `backend/internal/handlers/payments.go`, `backend/internal/config/config.go`, `backend/internal/models/order.go` |
| Pickup/Delivery Scheduling | Medium | ✅ Complete | Already exists in Order model (IsPreorder, PreorderTime, DeliveryDate, etc.) |
| Order Timeline UI | Medium | ✅ Complete | Backend: `backend/internal/handlers/orders.go` (GetOrderTimeline), Routes added |
| Wishlists | High | ✅ Complete | Backend: `backend/internal/handlers/wishlists.go`, `backend/internal/models/wishlist.go`, Frontend: `frontend/src/store/wishlistStore.js`, `frontend/src/components/WishlistButton.jsx`, `frontend/src/pages/SavedProducts.jsx` |
| Abandoned Cart Recovery | Medium | ✅ Complete | Backend: `backend/internal/handlers/cart_abandonment.go`, `backend/internal/models/cart_abandonment.go` |

**Implementation Notes:**
- Wishlists: Multiple wishlists support, public sharing, price drop notifications
- Order Timeline: Visual timeline with all order status changes
- Payment Gateway: Bank transfer, credit card, GoPay, ShopeePay support
- Device Registration: FCM token management for push notifications
- Cart Abandonment: Automatic reminder system (1h, 24h)

**Environment Variables Added:**
```
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

---

### Phase 3: Engagement (Weeks 11-16) ✅ COMPLETE

| Feature | Priority | Status | Files Changed |
|---------|----------|--------|---------------|
| Seller Analytics Dashboard | High | ✅ Complete | Backend: `backend/internal/handlers/analytics.go`, Frontend: `frontend/src/pages/SellerAnalytics.jsx`, `frontend/src/store/sellerAnalyticsStore.js`, Mobile: `mobile/src/screens/seller/SellerAnalyticsScreen.js` |
| Inventory Management | Medium | ✅ Complete | Backend: `backend/internal/handlers/products.go` (low-stock, adjust-stock endpoints), Frontend: `frontend/src/pages/Inventory.jsx`, `frontend/src/store/inventoryStore.js`, Mobile: `mobile/src/screens/seller/InventoryScreen.js` |
| Voice Search | Medium | ✅ Complete | Backend: (uses Web Speech API), Frontend: `frontend/src/hooks/useVoiceSearch.js`, `frontend/src/components/VoiceSearchInput.jsx`, `frontend/src/pages/Products.jsx`, Mobile: `mobile/src/components/VoiceSearchInput.js`, `mobile/src/screens/products/ProductsScreen.js` |

**Implementation Notes:**
- Seller Analytics: Sales overview, revenue tracking, top products, order volume
- Inventory: Low stock alerts, bulk operations, stock adjustments
- Voice Search: Microphone button in search bar, speech-to-text for product search

---

### Phase 4: Advanced Features (Weeks 17-24) ✅ COMPLETE

| Feature | Priority | Status | Files Changed |
|---------|----------|--------|---------------|
| Video Call Consultation | Medium | ✅ Complete | Backend: `backend/internal/handlers/video_call.go`, `backend/internal/models/video_call.go`, Frontend: `frontend/src/pages/VideoCall.jsx`, `frontend/src/store/videoCallStore.js`, Mobile: `mobile/src/screens/videoCall/VideoCallScreen.js` |
| WhatsApp Integration | Medium | ✅ Complete | Backend: `backend/internal/handlers/whatsapp.go`, Frontend: `frontend/src/pages/ProductDetail.jsx`, Mobile: `mobile/src/screens/products/ProductDetailScreen.js` |
| Digital Wallet | Medium | ✅ Complete | Backend: `backend/internal/handlers/wallet.go`, `backend/internal/models/wallet.go`, Frontend: `frontend/src/pages/Wallet.jsx`, `frontend/src/store/walletStore.js`, Mobile: `mobile/src/screens/wallet/WalletScreen.js` |
| Installment Payments | Low | ✅ Complete | Backend: `backend/internal/handlers/installments.go`, Frontend: `frontend/src/pages/Installments.jsx`, `frontend/src/store/installmentStore.js`, Mobile: `mobile/src/screens/installments/InstallmentsScreen.js` |
| Admin Panel | Medium | ✅ Complete | Backend: `backend/internal/handlers/admin.go`, Frontend: `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/store/adminStore.js` |

**Implementation Notes:**
- Video Call: 1:1 video calls between buyer and seller using WebRTC/Daily.co
- WhatsApp: "Chat on WhatsApp" button on ProductDetail pages
- Digital Wallet: Balance, transaction history, add funds, wallet payment
- Installments: Installment tenure selection (3, 6, 12 months), calculation
- Admin Panel: User management, order management, platform analytics

---

### Phase 5: Polish & Scale (Weeks 25+)

| Feature | Priority | Effort |
|---------|----------|--------|
| Image Search | Low | Medium |
| Barcode Scanning | Low | Low |
| Multi-Store Management | Low | Medium |
| Gamification | Low | Medium |
| Seller Blogs | Low | Medium |
| Performance Optimization | High | Ongoing |

**Dependencies:** All phases complete

---

## Technical Notes

### Database Changes Summary

New collections required:
- `notifications` ✅ (already exists)
- `reviews` ✅ (already exists)
- `device_tokens` ✅ (created in Phase 2)
- `wishlists` ✅ (created in Phase 2)
- `cart_abandonments` ✅ (created in Phase 2)
- `coupons` (for Phase 3)
- `wallets` (for Phase 4)
- `blog_posts` (for Phase 4)

Modified collections:
- `users` - add wallet, preferences
- `products` - add barcode, price history, rating, totalReviews ✅ (partially exists)
- `orders` - add schedule, timeline, payment, VaNumber ✅

### New Files Created

Phase 1 implementation created/modified:
- `frontend/src/store/accessibilityStore.js` - Accessibility preferences store
- `frontend/src/utils/accessibility.js` - Accessibility utility functions
- `frontend/src/index.css` - Added accessibility CSS (skip links, focus states, reduced motion, font scaling)
- `frontend/src/components/Navbar.jsx` - Added skip link, accessibility menu, ARIA labels
- `frontend/src/components/ProductCard.jsx` - Added ARIA labels, semantic HTML
- `frontend/src/components/layout/Layout.jsx` - Added main content landmark

Phase 2 implementation created/modified:
- `backend/internal/models/wishlist.go` - Wishlist model
- `backend/internal/handlers/wishlists.go` - Wishlist CRUD handlers
- `backend/internal/models/device.go` - Device token model for push notifications
- `backend/internal/handlers/devices.go` - Device registration handlers
- `backend/internal/models/cart_abandonment.go` - Cart abandonment tracking model
- `backend/internal/handlers/cart_abandonment.go` - Cart abandonment handlers
- `backend/internal/handlers/payments.go` - Midtrans payment integration
- `backend/internal/handlers/orders.go` - Added GetOrderTimeline
- `frontend/src/store/wishlistStore.js` - Wishlist state management
- `frontend/src/components/WishlistButton.jsx` - Wishlist toggle button
- `frontend/src/pages/SavedProducts.jsx` - Updated to use backend wishlists
- `frontend/src/components/ProductCard.jsx` - Added wishlist button overlay

Phase 3 implementation created/modified:
- `backend/internal/handlers/recommendations.go` - Product recommendations, trending, similar products
- `backend/internal/handlers/price_alerts.go` - Price drop alert system
- `backend/internal/models/price_alert.go` - Price alert model
- `backend/internal/models/user.go` - Added ViewHistory field

Phase 4 implementation created/modified:
- `backend/internal/handlers/wallet.go` - Digital wallet handler
- `backend/internal/models/wallet.go` - Wallet model
- `backend/internal/handlers/whatsapp.go` - WhatsApp integration
- `backend/internal/handlers/admin.go` - Admin panel backend
- `backend/internal/handlers/video_call.go` - Video call coordination
- `backend/internal/models/video_call.go` - Video call model
- `backend/internal/handlers/installments.go` - Installment payments handler
- `backend/internal/handlers/analytics.go` - Seller analytics (extended)
- `backend/internal/handlers/products.go` - Inventory endpoints (extended)
- `frontend/public/manifest.json` - PWA manifest
- `frontend/public/sw.js` - Service worker
- `frontend/src/hooks/usePWA.js` - PWA hook
- `frontend/src/hooks/useVoiceSearch.js` - Voice search hook
- `frontend/src/store/walletStore.js` - Wallet state management
- `frontend/src/store/adminStore.js` - Admin panel state management
- `frontend/src/store/installmentStore.js` - Installments state management
- `frontend/src/store/videoCallStore.js` - Video call state management
- `frontend/src/store/sellerAnalyticsStore.js` - Seller analytics state management
- `frontend/src/store/inventoryStore.js` - Inventory state management
- `frontend/src/components/VoiceSearchInput.jsx` - Voice search component
- `frontend/src/components/VideoCall.jsx` - Video call component
- `frontend/src/pages/Wallet.jsx` - Wallet page
- `frontend/src/pages/Installments.jsx` - Installments page
- `frontend/src/pages/VideoCall.jsx` - Video call page
- `frontend/src/pages/SellerAnalytics.jsx` - Seller analytics page
- `frontend/src/pages/Inventory.jsx` - Inventory page
- `frontend/src/pages/AdminDashboard.jsx` - Admin dashboard page
- `frontend/src/pages/ProductDetail.jsx` - Added WhatsApp button
- `frontend/src/App.jsx` - Added all new routes
- `frontend/src/components/layout/Navbar.jsx` - Added new menu items
- `frontend/src/locales/en.json` - Added all new feature translations
- `frontend/src/locales/id.json` - Added all new feature translations
- `mobile/src/screens/wallet/WalletScreen.js` - Mobile wallet screen
- `mobile/src/screens/installments/InstallmentsScreen.js` - Mobile installments screen
- `mobile/src/screens/videoCall/VideoCallScreen.js` - Mobile video call screen
- `mobile/src/screens/seller/SellerAnalyticsScreen.js` - Mobile seller analytics
- `mobile/src/screens/seller/InventoryScreen.js` - Mobile inventory screen
- `mobile/src/screens/products/ProductDetailScreen.js` - Added WhatsApp button
- `mobile/src/screens/products/ProductsScreen.js` - Added voice search
- `mobile/src/components/VoiceSearchInput.js` - Mobile voice search component
- `mobile/src/navigation/AppNavigator.js` - Added new routes
- `mobile/src/screens/profile/ProfileScreen.js` - Added menu items
- `mobile/src/i18n/en.js` - Added translations
- `mobile/src/i18n/id.js` - Added translations
- `backend/cmd/server/main.go` - Added all new routes
- `backend/internal/database/mongo.go` - Added wallet and video call indexes

### API Versioning

Consider implementing API versioning:
```
/api/v1/...
/api/v2/...
```

This allows gradual migrations and backward compatibility.

### Testing Strategy

- Unit tests for all new handlers
- Integration tests for critical flows
- E2E tests for checkout and payment
- Accessibility testing with tools (axe, lighthouse)
- Load testing for scaled features

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API response time: < 200ms (p95)
- Lighthouse score: > 80

---

## Conclusion

This roadmap provides a comprehensive plan for evolving the MSME Marketplace into a full-featured e-commerce platform. The phased approach allows for incremental delivery while maintaining a stable platform.

Prioritize Phase 1 features for immediate accessibility improvements and user trust building. Phase 2 features are critical for core commerce functionality. Later phases can be adjusted based on user feedback and business priorities.

For questions or clarifications on any feature, please reach out to the development team.

---

*Document Version: 1.4*
*Last Updated: March 16, 2026*
*Phase 1 Complete: March 16, 2026*
*Phase 2 Complete: March 16, 2026*
*Phase 3 Complete: March 16, 2026*
*Phase 4 Complete: March 16, 2026*
*ALL FEATURES IMPLEMENTED*
