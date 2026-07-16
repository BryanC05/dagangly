# On-Demand Delivery & Logistics Integration Specification

This document details the implementation of the third-party logistics integration (**GoSend Instant** and **GrabExpress Instant** via **BiteShip API**) in the Dagangly ecosystem.

---

## 1. Overview
To support instant fulfillment for local buyers and MSMEs, Dagangly integrates with BiteShip logistics aggregator. 
For local testing and offline compatibility, the system triggers an **automated background driver simulator** if no live credentials are set.

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
	
	// Logistics Fields
	DeliveryType       string             `bson:"deliveryType" json:"deliveryType"` // "pickup" | "delivery"
	DeliveryVendor     string             `bson:"deliveryVendor" json:"deliveryVendor"` // "gosend" | "grab"
	DeliveryService    string             `bson:"deliveryService" json:"deliveryService"` // "instant"
	DeliveryFee        float64            `bson:"deliveryFee" json:"deliveryFee"`
	ShipmentTrackingID string             `bson:"shipmentTrackingId,omitempty" json:"shipmentTrackingId,omitempty"`
	ShipmentStatus     string             `bson:"shipmentStatus,omitempty" json:"shipmentStatus,omitempty"`
	DriverPlate        string             `bson:"driverPlate,omitempty" json:"driverPlate,omitempty"`
}
```

---

## 3. Go Backend Handlers

### A. Rates Retrieval (`POST /api/delivery/rates`)
*   **Source**: `backend/internal/handlers/delivery.go`
*   Computes the Haversine distance in kilometers between the store coordinate and the buyer coordinate.
*   Enforces a strict **5km delivery radius**.
*   Estimates instant rates for local couriers (GoSend baseline: Rp 15,000; GrabExpress baseline: Rp 17,000).

### B. Live Driver Simulator (`StartDeliverySimulation`)
*   Launches an asynchronous background goroutine when an order is paid or confirmed.
*   Transitions the order through shipment states: `allocated` (driver details assigned) ➡️ `picking_up` (driver travels to store) ➡️ `dropping_off` (driver travels to destination) ➡️ `delivered` (order completed).
*   Coordinates updates are pushed directly to the buyer's socket session using:
    ```go
    hub.SendToUser(userID, messageBytes)
    ```
    using JSON payload with type `delivery_update`.

---

## 4. Frontend UI Components

### A. Checkout Options (`Cart.jsx`)
*   Step 2 (Fulfillment) displays segmented buttons for **Pickup** and **Delivery**.
*   Selecting **Delivery** mounts the `DeliveryMapPicker` Leaflet component.
*   Queries `/api/delivery/rates` to fetch courier services, auto-calculates the shipping charge, and appends it to the final checkout payload.

### B. Geocoding Map Picker (`DeliveryMapPicker.jsx`)
*   Queries browser GPS geolocation on load and centers the Leaflet map automatically.
*   Includes a search input bar calling OpenStreetMap's Nominatim API to geocode queries, allowing users to type street or city names to locate themselves.
*   Propagates coordinates immediately (0ms delay) to prevent navigation blocks while reverse-geocoding street addresses in the background.

### C. Live Tracking Map (`TrackingPage.jsx`)
*   Listens to WebSockets for frame type `delivery_update`.
*   Triggers cache invalidation in React-Query:
    ```javascript
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['driverLocation', orderId] });
    ```
    This triggers immediate refetches, causing the Leaflet map marker for the driver to move smoothly in real-time.

---

## 5. Webhook Settings (BiteShip Console)
To receive live callbacks from real drivers:
1.  Configure Webhook URL: `https://dagangly-1.onrender.com/api/webhooks/delivery`
2.  Enable Webhook Event: `order.status`
3.  Configure `BITESHIP_WEBHOOK_SECRET` inside Render's Environment Dashboard.
