# Biteship Shipping Integration Setup Guide

This guide covers everything you need to configure and use the Biteship shipping integration in Dagangly.

---

## Overview

Dagangly uses **Biteship API** to provide nationwide shipping with multiple Indonesian courier services:
- JNE (Jalur Nugraha Ekakurir)
- J&T Express
- SiCepat ekspres
- Ninja Express
- Antar Aja

The integration provides:
- Real-time shipping rate calculation
- Automatic shipment creation
- Live tracking via webhooks
- Public tracking page for customers

---

## Prerequisites

1. **Biteship Account**: Sign up at https://biteship.com
2. **API Key**: Obtain from Biteship dashboard after registration
3. **Render Account**: For production deployment

---

## Configuration Steps

### 1. Get Your Biteship API Key

1. Go to https://biteship.com and create an account
2. Navigate to **Settings** → **API Keys**
3. Generate a new API key
4. Copy the key securely - you'll only see it once

### 2. Configure Backend Environment Variables

#### Local Development

Create or edit `backend/.env`:

```env
# Biteship API Configuration
BITESHIP_API_KEY=your_api_key_here
BITESHIP_API_URL=https://api.biteship.com/v1
```

#### Production (Render Dashboard)

1. Go to https://dashboard.render.com
2. Select your **dagangly-api** service
3. Click **Environment** tab
4. Add the following variables:

| Key | Value |
|-----|-------|
| `BITESHIP_API_KEY` | Your Biteship API key |
| `BITESHIP_API_URL` | `https://api.biteship.com/v1` |

5. Click **Save Changes**

### 3. Configure Webhook (Optional)

For automatic shipment status updates:

1. **In Biteship Dashboard**:
   - Go to **Webhooks** or **Developers** section
   - Add webhook endpoint: `https://dagangly-api.onrender.com/api/webhooks/biteship`
   - Select events: `shipment.*` (all shipment events)

2. **Important**: Biteship does **NOT** provide webhook secrets
   - The webhook endpoint accepts requests without signature verification
   - This is normal Biteship behavior - no additional configuration needed

---

## Testing

### Local Testing

1. Start the backend:
   ```bash
   cd backend
   go run ./cmd/server/main.go
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test shipping rates**:
   - Add items to cart
   - Select "Delivery" at checkout
   - Choose a delivery address on the map
   - View courier options (JNE, J&T, SiCepat, etc.)

4. **Without API credentials**:
   - If `BITESHIP_API_KEY` is not set, the system uses a built-in driver simulator
   - Orders progress through simulated states: `allocated` → `picking_up` → `dropping_off` → `delivered`

### Production Testing

1. **Deploy to Render**:
   - Push code to GitHub main branch
   - Render auto-deploys (~5-10 minutes)

2. **Test webhook**:
   - Place a test order with real Biteship credentials
   - Monitor webhook logs in Render dashboard
   - Verify shipment status updates appear in Orders page

3. **Test tracking page**:
   - Navigate to `/track/:trackingId` (e.g., `https://dagangly-1.onrender.com/track/shipment_123`)
   - Verify real-time tracking timeline displays correctly

---

## API Endpoints

### Calculate Shipping Rates

```http
POST /api/shipping/rates
Authorization: Bearer <user_token>
```

**Request Body**:
```json
{
  "deliverFrom": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "address": "Jl. Sudirman No. 1",
    "cityName": "Jakarta",
    "stateName": "DKI Jakarta",
    "zipCode": "10220"
  },
  "deliverTo": {
    "latitude": -7.7956,
    "longitude": 110.3695,
    "address": "Jl. Malioboro No. 10",
    "cityName": "Yogyakarta",
    "stateName": "DI Yogyakarta",
    "zipCode": "55271"
  },
  "courierCodes": ["jne", "jnt", "sicepat", "ninja", "antaraja"],
  "package": {
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

**Response**:
```json
{
  "rates": [
    {
      "courierCode": "jne",
      "courierName": "JNE Express",
      "serviceCode": "REG",
      "serviceName": "Regular",
      "rateId": "rate_abc123",
      "price": 35000,
      "etd": "2-3 days"
    },
    {
      "courierCode": "sicepat",
      "courierName": "SiCepat ekspres",
      "serviceCode": "REG",
      "serviceName": "Regular",
      "rateId": "rate_def456",
      "price": 32000,
      "etd": "2-3 days"
    }
  ]
}
```

### Create Shipment

```http
POST /api/shipping/shipments
Authorization: Bearer <user_token>
```

**Request Body**:
```json
{
  "orderId": "order_123",
  "sender": {
    "name": "Store Name",
    "phone": "08123456789",
    "address": "Sender address",
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "recipient": {
    "name": "Customer Name",
    "phone": "08987654321",
    "address": "Recipient address",
    "latitude": -7.7956,
    "longitude": 110.3695
  },
  "courierCode": "jne",
  "serviceCode": "REG",
  "rateId": "rate_abc123",
  "package": {
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

**Response**:
```json
{
  "shipment": {
    "id": "shipment_abc123",
    "trackingId": "JNE1234567890",
    "status": "pending",
    "awbNumber": "1234567890"
  }
}
```

### Track Shipment (Authenticated)

```http
GET /api/shipping/track/:trackingId
Authorization: Bearer <user_token>
```

### Track Shipment (Public)

```http
GET /api/shipping/public/track/:trackingId
```

**Response**:
```json
{
  "trackingId": "JNE1234567890",
  "status": "in_transit",
  "courierCode": "jne",
  "courierName": "JNE Express",
  "serviceName": "Regular",
  "etd": "2026-07-20",
  "events": [
    {
      "timestamp": "2026-07-18T10:00:00Z",
      "status": "in_transit",
      "statusDetail": "Package departed from sorting center",
      "address": "Jakarta Distribution Center",
      "city": "Jakarta"
    }
  ]
}
```

---

## Webhook Events

The webhook endpoint (`POST /api/webhooks/biteship`) handles these events:

| Event | Status | Description |
|-------|--------|-------------|
| `shipment.created` | `pending` | Shipment created in Biteship system |
| `shipment.picked_up` | `picked_up` | Courier picked up package from seller |
| `shipment.in_transit` | `in_transit` | Package in transit to destination |
| `shipment.out_for_delivery` | `out_for_delivery` | Out for final delivery |
| `shipment.delivered` | `delivered` | Successfully delivered |
| `shipment.failed` | `failed` | Delivery failed (address issue, etc.) |

All events automatically update the order's `ShipmentStatus` field and broadcast via WebSocket to connected clients.

---

## Frontend Integration

### Customer Tracking Page

Access tracking via: `https://dagangly-1.onrender.com/track/:trackingId`

Features:
- Live status badge (color-coded)
- Timeline of tracking events
- Courier branding (orange for JNE, green for J&T, etc.)
- Auto-refresh every 30 seconds
- Back button to Orders page

### Orders Page Integration

Orders with active shipments display:
- Blue Biteship tracking card
- Tracking ID in monospace font
- Current status badge
- "Track" button linking to public tracking page

---

## Troubleshooting

### No courier options showing at checkout

1. Verify `BITESHIP_API_KEY` is set in `.env`
2. Check backend logs for API call errors
3. Confirm seller location coordinates are valid
4. Ensure package weight is set (default: 0.5kg per item)

### Webhook not receiving updates

1. Verify webhook URL is configured in Biteship dashboard
2. Check webhook logs in Biteship dashboard for failed attempts
3. Verify `BITESHIP_API_KEY` is correct in Render
4. Test endpoint manually with curl:
   ```bash
   curl -X POST https://dagangly-api.onrender.com/api/webhooks/biteship \
     -H "Content-Type: application/json" \
     -d '{"event": "shipment.created", "shipment": {"id": "test"}}'
   ```

### Tracking page shows "Not Found"

1. Verify tracking ID format matches database
2. Check if order has `shipmentTrackingId` field populated
3. Ensure shipment was created successfully during checkout

### Driver simulator instead of real tracking

This happens when `BITESHIP_API_KEY` is not configured. To use real Biteship:
1. Set `BITESHIP_API_KEY` environment variable
2. Create a real shipment via checkout
3. Driver simulator only runs as fallback

---

## Additional Resources

- **Biteship API Docs**: https://docs.biteship.com
- **Backend Service**: `backend/internal/services/biteship.go`
- **Handlers**: `backend/internal/handlers/shipping.go`
- **Webhook Handler**: `backend/internal/handlers/biteship_webhook.go`
- **Frontend Tracking Page**: `frontend/src/pages/ShipmentTrackingPage.jsx`

---

## Support

For issues with Biteship:
- Email: support@biteship.com
- Docs: https://docs.biteship.com

For Dagangly integration issues:
- Check `plans/delivery_integration.md` for implementation details
- Review backend logs in Render dashboard
- Contact Dagangly development team
