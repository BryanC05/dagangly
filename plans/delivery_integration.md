# On-Demand Delivery & Logistics Integration Specification

This document details the implementation of the third-party logistics integration (**Biteship API** with JNE, J&T, SiCepat, Ninja, and Antar Aja) in the Dagangly ecosystem.

---

## 1. Overview

Dagangly integrates with **Biteship**, a logistics aggregator API that provides real-time shipping rates and tracking for major Indonesian courier services. The system supports:

- **Live rate calculation** from multiple couriers (JNE, J&T, SiCepat, Ninja Express, Antar Aja)
- **Shipment creation** with automatic tracking ID generation
- **Real-time tracking** via webhook updates and public tracking API
- **Automated driver simulator** for local testing without live credentials

---

## 2. Database Model Modifications

The MongoDB `orders` schema includes the following third-party delivery tracking metadata:

```go
type Order struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Buyer              primitive.ObjectID `bson:"buyer" json:"buyer"`
	Seller             primitive.ObjectID `bson:"seller" json:"seller"`
	Products           []OrderProduct     `bson:"products" json:"products"`
	TotalAmount        float64            `bson:"totalAmount" json:"totalAmount"`
	Status             string             `bson:"status" json:"status"`

	// Biteship Logistics Fields
	DeliveryType         string             `bson:"deliveryType" json:"deliveryType"` // "pickup" | "delivery"
	DeliveryCourierCode  string             `bson:"deliveryCourierCode" json:"deliveryCourierCode"` // "jne", "jnt", "sicepat", "ninja", "antaraja"
	DeliveryServiceCode  string             `bson:"deliveryServiceCode" json:"deliveryServiceCode"` // Service code from Biteship
	DeliveryRateId       string             `bson:"deliveryRateId" json:"deliveryRateId"` // Biteship rate ID
	DeliveryFee          float64            `bson:"deliveryFee" json:"deliveryFee"`
	ShipmentTrackingID   string             `bson:"shipmentTrackingId,omitempty" json:"shipmentTrackingId,omitempty"` // Biteship shipment ID
	ShipmentStatus       string             `bson:"shipmentStatus,omitempty" json:"shipmentStatus,omitempty"` // "pending", "picked_up", "in_transit", "out_for_delivery", "delivered"
	DriverPlate          string             `bson:"driverPlate,omitempty" json:"driverPlate,omitempty"`
}
```

---

## 3. Go Backend Handlers

### A. Shipping Rates Retrieval (`POST /api/shipping/rates`)
*   **Source**: `backend/internal/handlers/shipping.go`
*   **Package Weight Calculation**: Automatically computes total weight from cart items (default 0.5kg per item if not specified)
*   **Package Dimensions**: Fixed at 30x20x15 cm for standard packages
*   **Courier Selection**: Pre-configured couriers: JNE, J&T, SiCepat, Ninja Express, Antar Aja
*   **Biteship API Call**: Calls `biteship.CalculateRates()` with origin/destination addresses including:
    - Latitude/longitude coordinates
    - Full address details (street, city, state, postal code)
    - Package weight and dimensions
*   **Response Format**: Returns array of rate objects:
    ```json
    {
      "rates": [
        {
          "courierCode": "jne",
          "courierName": "JNE Express",
          "serviceCode": "REG",
          "serviceName": "Regular",
          "rateId": "rate_abc123",
          "price": 25000,
          "etd": "2-3 days"
        }
      ]
    }
    ```

### B. Shipment Creation (`POST /api/shipping/shipments`)
*   **Source**: `backend/internal/handlers/shipping.go`
*   **Creates shipment** via Biteship API after order payment confirmation
*   **Returns shipment ID** stored in `order.ShipmentTrackingID`
*   **Initial status**: `"pending"` or `"allocated"`

### C. Shipment Tracking (`GET /api/shipping/track/:trackingId`)
*   **Authenticated endpoint** for order owners
*   **Source**: `backend/internal/handlers/shipping.go`
*   Fetches live tracking data from Biteship
*   Returns shipment status, events timeline, and ETD

### D. Public Tracking (`GET /api/shipping/public/track/:trackingId`)
*   **Public endpoint** - no authentication required
*   **Source**: `backend/internal/handlers/shipping.go`
*   Allows customers to track shipments via direct link
*   Used by customer tracking page: `/track/:trackingId`

### E. Webhook Handler (`POST /api/webhooks/biteship`)
*   **Source**: `backend/internal/handlers/biteship_webhook.go`
*   **No signature validation** - Biteship doesn't provide webhook secrets
*   **Authentication**: Only requires `BITESHIP_API_KEY` and `BITESHIP_API_URL` environment variables
*   **Events handled**:
    - `shipment.created` - Shipment allocated
    - `shipment.picked_up` - Courier picked up package
    - `shipment.in_transit` - Package in transit
    - `shipment.out_for_delivery` - Out for delivery
    - `shipment.delivered` - Delivered successfully
    - `shipment.failed` - Delivery failed
*   **Updates order**: Automatically updates `order.ShipmentStatus` and broadcasts via WebSocket
*   **Tested on Render**: All event types return 200 OK

### F. Driver Simulator (`StartDeliverySimulation`)
*   **Fallback**: Launches async background goroutine if Biteship credentials not configured
*   Transitions order through states: `allocated` → `picking_up` → `dropping_off` → `delivered`
*   WebSocket updates sent via `hub.SendToUser(userID, messageBytes)`

---

## 4. Frontend UI Components

### A. Checkout Flow (`Cart.jsx`)
*   **Step 2 (Fulfillment)**: Segmented buttons for **Pickup** and **Delivery**
*   **Delivery Map Picker**: `DeliveryMapPicker` component for address selection using Leaflet + OpenStreetMap
*   **API Integration**: Calls `/api/shipping/rates` with Biteship payload format
*   **Courier Selection UI**: Displays courier cards with:
    - Courier logo/names (JNE, J&T, SiCepat, etc.)
    - Service type (Regular, Express, etc.)
    - Price in Rupiah
    - Estimated delivery time (ETD)
*   **Field Mapping**:
    ```javascript
    {
      deliverFrom: { latitude, longitude, address, cityName, stateName, zipCode },
      deliverTo: { latitude, longitude, address, cityName, stateName, zipCode },
      courierCodes: ['jne', 'jnt', 'sicepat', 'ninja', 'antaraja'],
      package: { weight: totalWeight, length: 30, width: 20, height: 15 }
    }
    ```
*   **Order Payload**: Includes `deliveryCourierCode`, `deliveryServiceCode`, `deliveryRateId`

### B. Orders Page (`Orders.jsx`)
*   **Shipment Tracking Card**: Blue badge showing Biteship integration
*   **Displays**:
    - Tracking ID with font-mono styling
    - Current shipment status badge (color-coded)
    - "Track" button linking to `/track/:trackingId`
*   **Status Colors**:
    - Green: `delivered`
    - Blue: `in_transit`
    - Purple: `out_for_delivery`
    - Yellow: `pending`

### C. Shipment Tracking Page (`ShipmentTrackingPage.jsx`)
*   **Route**: `/track/:trackingId` (public access)
*   **Features**:
    - Courier branding with color-coded badges
    - Timeline view of tracking events
    - Event details: timestamp, status, location
    - Auto-refresh every 30 seconds
    - Back button to Orders page
*   **Courier Colors**:
    - JNE: Orange, J&T: Green, SiCepat: Blue, Ninja: Red, Antar Aja: Yellow

### D. Geocoding Map Picker (`DeliveryMapPicker.jsx`)
*   Browser GPS geolocation on load
*   OpenStreetMap Nominatim API for address search
*   Real-time coordinate updates for map centering

---

## 5. Environment Variables

### Required Configuration (Render Dashboard)

```env
# Biteship API Configuration
BITESHIP_API_KEY=your_api_key_here
BITESHIP_API_URL=https://api.biteship.com/v1
```

### Optional Configuration

```env
# For webhook signature validation (NOT provided by Biteship)
# BITESHIP_WEBHOOK_SECRET=not_used
```

**Important**: Biteship does **NOT** provide webhook secrets for signature validation. The webhook endpoint (`/api/webhooks/biteship`) accepts requests without signature verification - this is normal Biteship behavior.

---

## 6. Webhook Settings (Biteship Console)

To receive live callbacks from couriers:

1. **Configure Webhook URL**: `https://dagangly-1.onrender.com/api/webhooks/biteship`
2. **Configure Environment Variables** in Render Dashboard:
   - `BITESHIP_API_KEY`
   - `BITESHIP_API_URL`
3. **No signature secret required** - Biteship doesn't provide this
4. **Event Types**: All shipment status events are automatically handled

---

## 7. API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shipping/rates` | Yes | Calculate shipping rates from multiple couriers |
| POST | `/api/shipping/shipments` | Yes | Create shipment with tracking |
| GET | `/api/shipping/track/:trackingId` | Yes | Track shipment (owner only) |
| GET | `/api/shipping/public/track/:trackingId` | No | Track shipment (public) |
| POST | `/api/webhooks/biteship` | No | Webhook handler for status updates |

---

## 8. Implementation Status

### ✅ Backend (Complete)
- [x] Biteship service client (`backend/internal/services/biteship.go`)
- [x] Shipping handlers (`backend/internal/handlers/shipping.go`)
- [x] Webhook handler (`backend/internal/handlers/biteship_webhook.go`)
- [x] Environment variables in `.env.example`
- [x] Tested on Render with production webhook

### ✅ Frontend (Complete)
- [x] Cart.jsx - Courier selection UI and rate calculation
- [x] Orders.jsx - Shipment tracking display
- [x] ShipmentTrackingPage.jsx - Public tracking page
- [x] App.jsx - Route configuration (`/track/:trackingId`)
- [x] Auto-refresh tracking every 30 seconds
