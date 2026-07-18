# Biteship Shipping API Integration Guide

## Overview

Dagangly now supports **Biteship** integration for comprehensive shipping and logistics management. This allows sellers to:

- Calculate shipping rates from multiple couriers
- Create shipments with tracking numbers
- Track deliveries in real-time
- Receive automatic status updates via webhooks

## Environment Configuration

Add the following variables to your environment (Vercel, Render, or `.env`):

```env
# Biteship Shipping API Configuration
BITESHIP_API_KEY=your_api_key_here
BITESHIP_API_URL=https://api.biteship.com/v1
BITESHIP_WEBHOOK_SECRET=your_webhook_secret_here
```

### Getting API Keys

1. Sign up at [Biteship](https://biteship.com)
2. Go to API Settings in your dashboard
3. Generate your API key
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/biteship`

---

## API Endpoints

### 1. Calculate Shipping Rates

Get shipping rates from multiple couriers for a given route.

**Endpoint:** `POST /api/shipping/rates`  
**Auth:** Required

#### Request Body

```json
{
  "deliverFrom": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "address": "Jl. Sudirman No. 1",
    "cityName": "Jakarta",
    "stateName": "DKI Jakarta",
    "zipCode": "12345"
  },
  "deliverTo": {
    "latitude": -7.2575,
    "longitude": 112.7521,
    "address": "Jl. Basuki Rahmat No. 100",
    "cityName": "Surabaya",
    "stateName": "Jawa Timur",
    "zipCode": "60231"
  },
  "courierCodes": ["jne", "jnt", "sicepat"],
  "package": {
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "requestId": "req_abc123",
    "rates": [
      {
        "courierCode": "jne",
        "courierName": "JNE Express",
        "serviceCode": "REG",
        "serviceName": "Regular",
        "amount": 25000,
        "currency": "IDR",
        "estimatedDays": 3,
        "estimatedDaysMin": 2,
        "estimatedDaysMax": 4
      },
      {
        "courierCode": "jnt",
        "courierName": "J&T Express",
        "serviceCode": "JNT_REG",
        "serviceName": "Regular",
        "amount": 23000,
        "currency": "IDR",
        "estimatedDays": 2,
        "estimatedDaysMin": 2,
        "estimatedDaysMax": 3
      }
    ]
  }
}
```

---

### 2. Create Shipment

Create a new shipment with a selected courier.

**Endpoint:** `POST /api/shipping/shipments`  
**Auth:** Required

#### Request Body

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "courierCode": "jne",
  "serviceCode": "REG",
  "pickupDate": "2026-07-20",
  "package": {
    "length": 30,
    "width": 20,
    "height": 15,
    "weight": 2.5,
    "content": "Kain Batik Print"
  },
  "insurance": {
    "enabled": true,
    "amount": 100000
  },
  "cod": {
    "enabled": false,
    "amount": 0
  },
  "payment": "shipper",
  "note": "Fragile - handle with care"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "shipmentId": "shp_xyz789",
    "trackingId": "TRK123456789",
    "awbNumber": "JNE1234567890",
    "courierCode": "jne",
    "courierName": "JNE Express",
    "serviceCode": "REG",
    "serviceName": "Regular",
    "rateAmount": 25000,
    "currency": "IDR",
    "labelUrl": "https://biteship.com/labels/shp_xyz789.pdf",
    "qrCode": "https://biteship.com/qr/shp_xyz789.png",
    "pdfManifest": "https://biteship.com/manifest/shp_xyz789.pdf"
  }
}
```

---

### 3. Track Shipment (Authenticated)

Get detailed tracking information for a shipment.

**Endpoint:** `GET /api/shipping/track/:trackingId`  
**Auth:** Required

#### Example

```bash
GET /api/shipping/track/TRK123456789
```

#### Response

```json
{
  "success": true,
  "data": {
    "shipmentId": "shp_xyz789",
    "trackingId": "TRK123456789",
    "awbNumber": "JNE1234567890",
    "courierCode": "jne",
    "status": "in_transit",
    "statusDetail": "Package is on the way to destination hub",
    "deliveredAt": null,
    "etd": "2026-07-22T10:00:00Z",
    "podImage": null,
    "events": [
      {
        "status": "in_transit",
        "statusDetail": "Departed from Jakarta sorting center",
        "address": "Jakarta Hub",
        "city": "Jakarta",
        "country": "ID",
        "timestamp": "2026-07-19T14:30:00Z",
        "message": "Package departed from origin hub"
      },
      {
        "status": "picked_up",
        "statusDetail": "Package picked up by courier",
        "address": "Jl. Sudirman No. 1",
        "city": "Jakarta",
        "country": "ID",
        "timestamp": "2026-07-19T09:00:00Z",
        "message": "Package picked up"
      }
    ]
  }
}
```

---

### 4. Track Shipment (Public)

Public tracking endpoint for customers (no authentication required).

**Endpoint:** `GET /api/shipping/public/track/:trackingId`  
**Auth:** Not Required

#### Example

```bash
GET /api/shipping/public/track/TRK123456789
```

#### Response

Same format as authenticated tracking endpoint.

---

### 5. Biteship Webhook

Receive automatic shipment status updates from Biteship.

**Endpoint:** `POST /api/webhooks/biteship`  
**Auth:** Webhook signature validation

#### Supported Events

| Event Type | Description |
|------------|-------------|
| `shipment.created` | Shipment has been created |
| `tracking.updated` | Tracking status has been updated |
| `shipment.delivered` | Package has been delivered |
| `shipment.cancelled` | Shipment has been cancelled |

#### Webhook Payload Example

```json
{
  "type": "tracking.updated",
  "data": {
    "shipment_id": "shp_xyz789",
    "tracking_id": "TRK123456789",
    "awb_number": "JNE1234567890",
    "courier_code": "jne",
    "status": "delivered",
    "status_detail": "Package delivered to recipient",
    "updated_at": "2026-07-22T15:30:00Z",
    "delivered_at": "2026-07-22T15:30:00Z"
  },
  "timestamp": "2026-07-22T15:30:05Z"
}
```

#### Response

```json
{
  "success": true,
  "message": "Webhook received",
  "type": "tracking.updated"
}
```

---

## Database Integration

The Biteship integration automatically updates the `orders` collection with shipment information:

### Order Schema Updates

```ts
{
  _id: ObjectId,
  // ... existing fields
  
  shipmentTrackingId: string,      // Biteship tracking ID
  shipmentStatus: string,          // Current shipment status
  courierCode: string,             // Selected courier code
  updatedAt: Date
}
```

### Webhook Database Updates

When a webhook is received, the following order fields are updated:

- `shipmentTrackingId` - Tracking ID from Biteship
- `shipmentStatus` - Current status (e.g., "in_transit", "delivered")
- `status` - Order status (updated to "delivered" when package is delivered)

---

## Frontend Integration Examples

### Calculate Shipping Rates (React)

```typescript
async function calculateShippingRates(deliverFrom, deliverTo, package) {
  const response = await fetch('/api/shipping/rates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      deliverFrom,
      deliverTo,
      package
    })
  });
  
  const data = await response.json();
  return data.data.rates;
}
```

### Create Shipment (React)

```typescript
async function createShipment(orderId, courierCode, serviceCode, package) {
  const response = await fetch('/api/shipping/shipments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId,
      courierCode,
      serviceCode,
      package,
      payment: 'shipper'
    })
  });
  
  const data = await response.json();
  return data.data;
}
```

### Public Tracking Page URL

```
https://dagangly.com/track/TRK123456789
```

This will call the public tracking endpoint and display the shipment status.

---

## Status Reference

### Shipment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Shipment created, awaiting pickup |
| `picked_up` | Package picked up by courier |
| `in_transit` | Package is in transit |
| `out_for_delivery` | Package is out for delivery |
| `delivered` | Package has been delivered |
| `cancelled` | Shipment has been cancelled |
| `failed` | Delivery failed |

---

## Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "message": "Invalid request parameters"
}
```

#### 401 Unauthorized
```json
{
  "message": "Invalid or missing API key"
}
```

#### 404 Not Found
```json
{
  "message": "Shipment not found",
  "error": "shipment_id not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Failed to calculate shipping rates",
  "error": "Biteship API returned non-success status"
}
```

---

## Testing

### Test with Sample Data

1. **Environment Setup**
   - Set `BITESHIP_API_KEY` in your Vercel/Render environment
   - Ensure `BITESHIP_WEBHOOK_SECRET` is configured

2. **Test Rate Calculation**
   ```bash
   curl -X POST https://your-domain.com/api/shipping/rates \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "deliverFrom": {"latitude": -6.2088, "longitude": 106.8456},
       "deliverTo": {"latitude": -7.2575, "longitude": 112.7521},
       "package": {"weight": 1.0}
     }'
   ```

3. **Test Webhook Locally** (using ngrok)
   ```bash
   ngrok http 5000
   # Set webhook URL in Biteship dashboard to:
   # https://<ngrok-id>.ngrok.io/api/webhooks/biteship
   ```

---

## Support

For API documentation and support:
- **Biteship Docs:** https://docs.biteship.com
- **Biteship Support:** support@biteship.com
- **Dagangly Issues:** https://github.com/BryanC05/dagangly/issues

---

## Version History

### v1.0.0 (July 2026)
- Initial Biteship integration
- Shipping rate calculation
- Shipment creation
- Real-time tracking
- Webhook support
- Automatic order status updates

---

**Implemented by:** Nebula AI Agent  
**Requested by:** Itz Delay (@user:itz-delay)  
**Date:** July 18, 2026
