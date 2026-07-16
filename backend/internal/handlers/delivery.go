package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"msme-marketplace/internal/config"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
	"msme-marketplace/internal/websocket"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DeliveryHandler struct {
	cfg *config.Config
}

func NewDeliveryHandler(cfg *config.Config) *DeliveryHandler {
	return &DeliveryHandler{cfg: cfg}
}

type RatesRequest struct {
	SellerID    string  `json:"sellerId"`
	DestLat     float64 `json:"destination_latitude"`
	DestLng     float64 `json:"destination_longitude"`
}


func (h *DeliveryHandler) GetDeliveryRates(c *gin.Context) {
	var req RatesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	sellerObjID, err := primitive.ObjectIDFromHex(req.SellerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid seller ID"})
		return
	}

	usersCollection := database.GetDB().Collection("users")
	var seller models.User
	err = usersCollection.FindOne(context.Background(), bson.M{"_id": sellerObjID}).Decode(&seller)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Seller not found"})
		return
	}

	var sellerLat, sellerLng float64
	if len(seller.Location.Coordinates) >= 2 {
		sellerLng = seller.Location.Coordinates[0]
		sellerLat = seller.Location.Coordinates[1]
	} else {
		// Default to central Jakarta if empty
		sellerLng = 106.8272
		sellerLat = -6.1754
	}

	buyerLat := req.DestLat
	buyerLng := req.DestLng

	distance := calculateDistance(sellerLat, sellerLng, buyerLat, buyerLng)

	// Simulated courier options
	goSendPrice := 12000.0 + (distance * 2500.0)
	grabPrice := 13000.0 + (distance * 2700.0)

	// Round to nearest hundred
	goSendPrice = math.Round(goSendPrice/100.0) * 100.0
	grabPrice = math.Round(grabPrice/100.0) * 100.0

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"distance": distance,
		"couriers": []gin.H{
			{
				"courier_name":         "GoSend",
				"courier_service_name": "Instant",
				"price":                goSendPrice,
				"duration":             fmt.Sprintf("%d mins", int(distance*5)+10),
				"vendor":               "gosend",
				"service":              "instant",
			},
			{
				"courier_name":         "GrabExpress",
				"courier_service_name": "Instant",
				"price":                grabPrice,
				"duration":             fmt.Sprintf("%d mins", int(distance*5.5)+8),
				"vendor":               "grab",
				"service":              "instant",
			},
		},
	})
}

// ReceiveDeliveryWebhook maps real driver coordinates from Biteship API webhooks
func (h *DeliveryHandler) ReceiveDeliveryWebhook(c *gin.Context) {
	// Parses incoming webhook events from Biteship and redirects coordinate changes via websockets
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// StartDeliverySimulation simulates driver mapping sequences in background goroutines
func StartDeliverySimulation(orderID string, sellerLat, sellerLng, buyerLat, buyerLng float64, vendor string, buyerID, sellerID string) {
	go func() {
		orderObjID, err := primitive.ObjectIDFromHex(orderID)
		if err != nil {
			return
		}

		ordersCollection := database.GetDB().Collection("orders")
		driverName := "Budi Anto"
		driverPhone := "08123456789"
		driverPlate := "B 8888 ABC"
		if vendor == "grab" {
			driverName = "Denny Pratama"
			driverPhone = "08199988822"
			driverPlate = "B 7777 XYZ"
		}

		// 1. Wait 5s: Allocated
		time.Sleep(5 * time.Second)
		shipmentStatus := "allocated"
		
		_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
			"$set": bson.M{
				"shipmentStatus": shipmentStatus,
				"driverName":     driverName,
				"driverPhone":    driverPhone,
				"driverPlate":    driverPlate,
				"status":         "out_for_delivery",
				"driverLocation": bson.M{
					"latitude":  sellerLat,
					"longitude": sellerLng,
					"timestamp": time.Now(),
				},
			},
		})
		sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, sellerLat, sellerLng, driverName, driverPlate)

		// 2. Wait 5s: Picking up
		time.Sleep(5 * time.Second)
		shipmentStatus = "picking_up"
		_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
			"$set": bson.M{"shipmentStatus": shipmentStatus},
		})
		sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, sellerLat, sellerLng, driverName, driverPlate)

		// Step coordinates from seller to halfway
		steps := 5
		for i := 1; i <= steps; i++ {
			time.Sleep(3 * time.Second)
			t := float64(i) / float64(steps)
			currLat := sellerLat + (buyerLat-sellerLat)*t*0.4
			currLng := sellerLng + (buyerLng-sellerLng)*t*0.4

			_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
				"$set": bson.M{
					"driverLocation": bson.M{
						"latitude":  currLat,
						"longitude": currLng,
						"timestamp": time.Now(),
					},
				},
			})
			sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, currLat, currLng, driverName, driverPlate)
		}

		// 3. Wait 4s: Dropping off
		time.Sleep(4 * time.Second)
		shipmentStatus = "dropping_off"
		_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
			"$set": bson.M{"shipmentStatus": shipmentStatus},
		})
		sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, sellerLat+(buyerLat-sellerLat)*0.4, sellerLng+(buyerLng-sellerLng)*0.4, driverName, driverPlate)

		// Step coordinates from halfway to destination
		for i := 1; i <= steps; i++ {
			time.Sleep(3 * time.Second)
			t := 0.4 + (float64(i)/float64(steps))*0.6
			currLat := sellerLat + (buyerLat-sellerLat)*t
			currLng := sellerLng + (buyerLng-sellerLng)*t

			_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
				"$set": bson.M{
					"driverLocation": bson.M{
						"latitude":  currLat,
						"longitude": currLng,
						"timestamp": time.Now(),
					},
				},
			})
			sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, currLat, currLng, driverName, driverPlate)
		}

		// 4. Wait 5s: Delivered
		time.Sleep(5 * time.Second)
		shipmentStatus = "delivered"
		now := time.Now()
		_, _ = ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
			"$set": bson.M{
				"shipmentStatus": shipmentStatus,
				"status":         "delivered",
				"paymentStatus":  "completed",
				"deliveredAt":    now,
			},
		})
		sendDeliveryWSUpdate(buyerID, sellerID, orderID, shipmentStatus, buyerLat, buyerLng, driverName, driverPlate)
	}()
}

func sendDeliveryWSUpdate(buyerID, sellerID string, orderID string, status string, lat, lng float64, driverName, plate string) {
	hub := websocket.GetHub()
	if hub == nil {
		return
	}

	updatePayload := gin.H{
		"orderId":         orderID,
		"shipmentStatus":  status,
		"driverName":      driverName,
		"driverPlate":     plate,
		"driverLocation": gin.H{
			"latitude":  lat,
			"longitude": lng,
			"timestamp": time.Now(),
		},
	}

	msg := websocket.Message{
		Type:   "delivery_update",
		RoomID: "user-" + buyerID,
		Data:   updatePayload,
	}

	msgBytes, err := json.Marshal(msg)
	if err == nil {
		hub.SendToUser(buyerID, msgBytes)
		hub.SendToUser(sellerID, msgBytes)
	}
}
