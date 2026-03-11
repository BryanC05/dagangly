# Facebook Automation Implementation Plan

## Overview

This document outlines the implementation plan for adding Facebook post automation to the marketplace, similar to the existing Instagram automation. The user will handle the N8N workflow implementation.

## Current State Analysis

### Existing Instagram Automation

The current Instagram automation includes:

1. **OAuth Connection** - `backend/internal/handlers/instagram.go`
   - Users connect via OAuth at `/api/users/instagram/connect`
   - Callback handles token exchange at `/api/users/instagram/callback`
   - Stores accounts in user document

2. **Product Creation Integration** - `backend/internal/handlers/products.go`
   - `PostToInstagram` checkbox in product form
   - `triggerInstagramPost()` function triggers N8N webhook
   - N8N webhook URL: `N8N_WEBHOOK_URL` environment variable

3. **User Model** - `backend/internal/models/user.go`
   - `InstagramAccounts []InstagramAccount`
   - `InstagramPostPreference` ("dagangly" or "own")

4. **Frontend UI**
   - Instagram connection in settings/profile
   - "Post to Instagram" option when creating products

---

## Implementation Requirements

### 1. Facebook API Setup (User Responsibility)

Before code implementation, user needs to:

1. Create Facebook Developer Account
2. Create Facebook App with:
   - Instagram Basic Display product
   - Facebook Login product
3. Configure redirect URI
4. Get credentials:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_REDIRECT_URI`

### 2. Backend Changes

#### 2.1 Environment Variables

Add to `.env`:

```env
# Facebook API (can share same as Instagram if using Instagram Graph API)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/users/facebook/callback
```

#### 2.2 User Model Updates

File: `backend/internal/models/user.go`

```go
// FacebookAccount represents a connected Facebook account
type FacebookAccount struct {
    FacebookUserID string    `bson:"facebookUserID" json:"facebookUserID"`
    Username       string    `bson:"username" json:"username"`
    AccessToken    string    `bson:"accessToken" json:"accessToken"`
    PageID         string    `bson:"pageId" json:"pageId"`
    PageName       string    `bson:"pageName" json:"pageName"`
    IsDefault      bool      `bson:"isDefault" json:"isDefault"`
    ConnectedAt    time.Time `bson:"connectedAt" json:"connectedAt"`
}

// Add to User struct
type User struct {
    // ... existing fields ...
    
    // Facebook Accounts
    FacebookAccounts       []FacebookAccount `bson:"facebookAccounts" json:"facebookAccounts"`
    FacebookPostPreference string           `bson:"facebookPostPreference" json:"facebookPostPreference"` // "dagangly" (default) or "own"
}
```

#### 2.3 Product Model Updates

File: `backend/internal/models/product.go`

Add Facebook posting options to product creation:

```go
type ProductInput struct {
    // ... existing fields ...
    
    // Facebook posting
    PostToFacebook  bool   `json:"postToFacebook"`
    FacebookCaption string  `json:"facebookCaption"`
}
```

#### 2.4 Create Facebook Handler

File: `backend/internal/handlers/facebook.go`

```go
package handlers

import (
    "fmt"
    "net/http"
    "os"
    "time"
    
    "msme-marketplace/internal/database"
    "msme-marketplace/internal/models"
    
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Facebook OAuth endpoints
// GET /api/users/facebook/connect - Initiate OAuth
// GET /api/users/facebook/callback - Handle OAuth callback
// POST /api/users/facebook/disconnect - Remove account
// GET /api/users/facebook/status - Get connected accounts
// POST /api/users/facebook/set-default - Set default account
// POST /api/users/facebook/preference - Set post preference
// GET /api/users/facebook/preference - Get post preference
```

Key functions to implement:
- `FacebookConnect()` - Initiate OAuth flow
- `FacebookCallback()` - Handle callback, exchange tokens
- `FacebookStatus()` - Return connected accounts
- `FacebookDisconnect()` - Remove account
- `FacebookSetDefault()` - Set default account
- `FacebookSetPostPreference()` - Set "dagangly" or "own"
- `GetFacebookPostPreference()` - Get current preference
- `triggerFacebookPost()` - Trigger N8N webhook

#### 2.5 Update Products Handler

File: `backend/internal/handlers/products.go`

Add Facebook post trigger (similar to Instagram):

```go
// In CreateProduct function, after Instagram trigger
if req.PostToFacebook {
    go triggerFacebookPost(product, user, req.FacebookCaption)
}

// Add triggerFacebookPost function
func triggerFacebookPost(product models.Product, user models.User, caption string) {
    n8nWebhookURL := strings.TrimSpace(os.Getenv("N8N_WEBHOOK_URL"))
    if n8nWebhookURL == "" {
        fmt.Println("N8N_WEBHOOK_URL not set, skipping Facebook post")
        return
    }
    
    // Get Facebook preference
    // Build payload
    // Trigger webhook
}
```

#### 2.6 Register Routes

File: `backend/cmd/server/main.go`

```go
// Facebook routes
users.GET("/facebook/status", handlers.FacebookStatus)
users.GET("/facebook/connect", handlers.FacebookConnect)
users.GET("/facebook/callback", handlers.FacebookCallback)
users.POST("/facebook/disconnect", handlers.FacebookDisconnect)
users.POST("/facebook/set-default", handlers.FacebookSetDefault)
users.POST("/facebook/preference", handlers.FacebookSetPostPreference)
users.GET("/facebook/preference", handlers.GetFacebookPostPreference)
```

---

### 3. Frontend (Web) Changes

#### 3.1 API Service

File: `frontend/src/api/api.js`

Add Facebook API methods:

```javascript
facebook: {
  status: () => api.get('/users/facebook/status'),
  connect: () => api.get('/users/facebook/connect'),
  disconnect: (username) => api.post('/users/facebook/disconnect', { username }),
  setDefault: (username) => api.post('/users/facebook/set-default', { username }),
  setPreference: (preference) => api.post('/users/facebook/preference', { preference }),
  getPreference: () => api.get('/users/facebook/preference'),
}
```

#### 3.2 Settings Page Updates

File: `frontend/src/pages/Settings.jsx` (or similar)

Add Facebook connection section:
- Connect Facebook button
- List connected accounts
- Set default account
- Post preference toggle ("Use Dagangly account" vs "Use my account")

#### 3.3 Add Product Page Updates

File: `frontend/src/pages/AddProduct.jsx` or `frontend/src/pages/SellerDashboard.jsx`

Add Facebook posting options:
- Checkbox: "Post to Facebook"
- Optional caption input field

---

### 4. Mobile App Changes

#### 4.1 API Service

File: `mobile/src/api/api.js`

Add Facebook API methods similar to web.

#### 4.2 Settings Screen

File: `mobile/src/screens/settings/SettingsScreen.js`

Add Facebook connection UI:
- Facebook account list
- Connect/Disconnect buttons
- Default account selector

#### 4.3 Add Product Screen

File: `mobile/src/screens/seller/AddProductScreen.js`

Add Facebook posting toggle:
- Switch: "Post to Facebook"
- TextInput: Facebook caption (optional)

---

## N8N Webhook Integration

### User's Responsibility

The user will implement the N8N workflow that receives the webhook payload:

**Webhook Endpoint:** `{N8N_WEBHOOK_URL}` (existing env var, reuse)

**Event Type:** `facebook.post`

**Payload Structure:**

```json
{
  "event": "facebook.post",
  "productName": "Product Name",
  "productDescription": "Product description",
  "productPrice": 50000,
  "productImage": "https://...",
  "productLink": "https://...",
  "caption": "Optional caption",
  "preference": "dagangly",  // or "own"
  "facebookUserID": "123456",  // if preference is "own"
  "accessToken": "token...",   // if preference is "own"
  "daganglyPageID": "page_id",  // if preference is "dagangly"
  "daganglyAccessToken": "token..."  // if preference is "dagangly"
}
```

**N8N Workflow Should:**

1. Receive webhook
2. If preference is "own":
   - Post to user's connected Facebook/. If preference isInstagram account
3. If preference is "dagangly":
   - Post to Dagangly official account
4. Return success/failure response

---

## Implementation Order

### Phase 1: Backend Core

1. Update user model with Facebook fields
2. Create `facebook.go` handler with OAuth flow
3. Add Facebook routes to main.go
4. Add Facebook post trigger to products handler

### Phase 2: Frontend (Web)

1. Add Facebook API methods
2. Update settings page with Facebook connection UI
3. Add Facebook posting option to Add Product page

### Phase 3: Mobile App

1. Add Facebook API methods
2. Update settings screen with Facebook connection
3. Add Facebook posting option to Add Product screen

### Phase 4: Testing & Environment

1. Configure Facebook Developer App
2. Set environment variables
3. Test OAuth flow
4. Test posting workflow

---

## File Summary

### New Files

| File | Description |
|------|-------------|
| `backend/internal/handlers/facebook.go` | Facebook OAuth and posting handler |

### Modified Files

| File | Changes |
|------|---------|
| `backend/internal/models/user.go` | Add FacebookAccounts, FacebookPostPreference |
| `backend/internal/models/product.go` | Add PostToFacebook, FacebookCaption |
| `backend/internal/handlers/products.go` | Add triggerFacebookPost() call |
| `backend/cmd/server/main.go` | Register Facebook routes |
| `frontend/src/api/api.js` | Add Facebook API methods |
| `frontend/src/pages/Settings.jsx` | Add Facebook connection UI |
| `frontend/src/pages/AddProduct.jsx` | Add Facebook posting option |
| `mobile/src/api/api.js` | Add Facebook API methods |
| `mobile/src/screens/settings/SettingsScreen.js` | Add Facebook connection UI |
| `mobile/src/screens/seller/AddProductScreen.js` | Add Facebook posting option |

---

## Notes

- Facebook API uses the Instagram Graph API, so the same API credentials can potentially work for both
- The implementation follows the same pattern as Instagram to maintain consistency
- The N8N webhook can be shared between Instagram and Facebook, distinguished by the `event` field
- Consider rate limiting and error handling for API calls
