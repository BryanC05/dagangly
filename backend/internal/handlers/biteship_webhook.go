package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"msme-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BiteshipWebhookHandler handles Biteship webhook events
type BiteshipWebhookHandler struct {
	biteshipService *services.BiteshipService
	webhookSecret   string
}

// NewBiteshipWebhookHandler creates a new webhook handler
func NewBiteshipWebhookHandler() *BiteshipWebhookHandler {
	config := services.GetBiteshipConfigFromEnv()
	biteshipService := services.NewBiteshipService(config)
	
	return &BiteshipWebhookHandler{
		biteshipService: biteshipService,
		webhookSecret:   config.APIKey, // Or use separate BITESHIP_WEBHOOK_SECRET
	}
}

// HandleWebhook godoc
// @Summary Handle Biteship webhook events
// @Description Process shipment status updates from Biteship
// @Tags shipping
// @Accept json
// @Produce json
// @Param X-Biteship-Signature header string false "Webhook signature"
// @Success 200 {object} WebhookResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /api/webhooks/biteship [post]
func (h *BiteshipWebhookHandler) HandleWebhook(c *gin.Context) {
	// Get signature from header
	signature := c.GetHeader("X-Biteship-Signature")
	if signature == "" {
		signature = c.GetHeader("X-Webhook-Signature")
	}

	// Read raw body
	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to read request body"})
		return
	}

	// Validate webhook signature
	// Note: Adjust validation based on actual Biteship webhook signature format
	if !h.biteshipService.ValidateWebhook(h.webhookSecret, string(body), signature) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid webhook signature"})
		return
	}

	// Parse webhook event
	var event services.WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid webhook payload"})
		return
	}

	// Process based on event type
	switch event.Type {
	case "shipment.created":
		h.handleShipmentCreated(c, event.Data)
	case "tracking.updated":
		h.handleTrackingUpdated(c, event.Data)
	case "shipment.delivered":
		h.handleShipmentDelivered(c, event.Data)
	case "shipment.cancelled":
		h.handleShipmentCancelled(c, event.Data)
	default:
		c.JSON(http.StatusOK, gin.H{"message": "Webhook received", "type": event.Type})
		return
	}
}

// handleShipmentCreated handles shipment.created events
func (h *BiteshipWebhookHandler) handleShipmentCreated(c *gin.Context, data services.WebhookEventData) {
	// Update order with shipment info
	err := h.updateOrderShipmentInfo(data.TrackingID, data.AwbNumber, data.CourierCode, "created")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update order", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shipment created event processed"})
}

// handleTrackingUpdated handles tracking.updated events
func (h *BiteshipWebhookHandler) handleTrackingUpdated(c *gin.Context, data services.WebhookEventData) {
	// Update order shipment status
	err := h.updateOrderShipmentStatus(data.TrackingID, data.Status, data.StatusDetail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update order", "error": err.Error()})
		return
	}

	// Add tracking event to order history
	err = h.addTrackingEvent(data.TrackingID, data.Status, data.StatusDetail, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to add tracking event", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tracking update processed"})
}

// handleShipmentDelivered handles shipment.delivered events
func (h *BiteshipWebhookHandler) handleShipmentDelivered(c *gin.Context, data services.WebhookEventData) {
	// Update order to delivered status
	err := h.updateOrderShipmentStatus(data.TrackingID, "delivered", "Package delivered successfully")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update order", "error": err.Error()})
		return
	}

	// Mark order as completed
	err = h.markOrderCompleted(data.TrackingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to complete order", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delivery confirmed"})
}

// handleShipmentCancelled handles shipment.cancelled events
func (h *BiteshipWebhookHandler) handleShipmentCancelled(c *gin.Context, data services.WebhookEventData) {
	// Update order shipment status to cancelled
	err := h.updateOrderShipmentStatus(data.TrackingID, "cancelled", "Shipment cancelled")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update order", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shipment cancellation processed"})
}

// Database integration methods - implement these to match your schema

func (h *BiteshipWebhookHandler) updateOrderShipmentInfo(trackingID, awbNumber, courierCode, status string) error {
	// TODO: Implement database update
	// This should update the order with shipment tracking information
	// Example:
	// collection := database.GetCollection("orders")
	// filter := bson.M{"shipmentTrackingID": trackingID}
	// update := bson.M{
	// 	"$set": bson.M{
	// 		"shipmentTrackingID": trackingID,
	// 		"awbNumber":         awbNumber,
	// 		"courierCode":       courierCode,
	// 		"shipmentStatus":    status,
	// 		"updatedAt":         time.Now(),
	// 	},
	// }
	// _, err := collection.UpdateOne(context.Background(), filter, update)
	// return err
	return nil
}

func (h *BiteshipWebhookHandler) updateOrderShipmentStatus(trackingID, status, statusDetail string) error {
	// TODO: Implement database update
	return nil
}

func (h *BiteshipWebhookHandler) addTrackingEvent(trackingID, status, statusDetail string, timestamp time.Time) error {
	// TODO: Add tracking event to order history
	// This should append to a shipmentEvents array in the order document
	return nil
}

func (h *BiteshipWebhookHandler) markOrderCompleted(trackingID string) error {
	// TODO: Mark order as completed
	// Update order status to "delivered" or "completed"
	return nil
}

// Public tracking endpoint (no auth required for public tracking page)

// PublicTrackShipment godoc
// @Summary Public shipment tracking
// @Description Track shipment without authentication (for public tracking page)
// @Tags shipping
// @Produce json
// @Param trackingId path string true "Tracking ID or AWB Number"
// @Success 200 {object} TrackShipmentResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/shipping/public/track/{trackingId} [get]
func PublicTrackShipment(c *gin.Context) {
	trackingID := c.Param("trackingId")
	if trackingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tracking ID or AWB number is required"})
		return
	}

	// Initialize Biteship service
	config := services.GetBiteshipConfigFromEnv()
	biteshipService := services.NewBiteshipService(config)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	trackResp, err := biteshipService.TrackShipment(ctx, trackingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Shipment not found",
			"error":   err.Error(),
		})
		return
	}

	// Format tracking events
	events := make([]TrackingEvent, 0, len(trackResp.Data.Events))
	for _, event := range trackResp.Data.Events {
		events = append(events, TrackingEvent{
			Status:       event.Status,
			StatusDetail: event.StatusDetail,
			Address:      event.Address,
			City:         event.City,
			Country:      event.Country,
			Timestamp:    event.Timestamp,
			Message:      event.Message,
		})
	}

	c.JSON(http.StatusOK, TrackShipmentResponse{
		Success: true,
		Data: TrackShipmentData{
			ShipmentID:    trackResp.Data.ShipmentID,
			TrackingID:    trackResp.Data.TrackingID,
			AwbNumber:     trackResp.Data.AwbNumber,
			CourierCode:   trackResp.Data.CourierCode,
			Status:        trackResp.Data.Status,
			StatusDetail:  trackResp.Data.StatusDetail,
			DeliveredAt:   trackResp.Data.DeliveredAt,
			ETD:           trackResp.Data.ETD,
			PodImage:      trackResp.Data.PodImage,
			Events:        events,
		},
	})
}

// WebhookResponse represents a webhook response
type WebhookResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// MongoDB update helper (example implementation)
func updateOrderWithShipment(ctx context.Context, collection interface{}, orderID primitive.ObjectID, trackingID, status string) error {
	// This is a placeholder - implement based on your actual database access pattern
	// type Collection interface {
	// 	UpdateOne(ctx context.Context, filter interface{}, update interface{}) (UpdateResult, error)
	// }
	
	filter := bson.M{"_id": orderID}
	update := bson.M{
		"$set": bson.M{
			"shipmentTrackingID": trackingID,
			"shipmentStatus":     status,
			"updatedAt":          time.Now(),
		},
	}
	
	// _, err := collection.UpdateOne(ctx, filter, update)
	// return err
	_ = filter
	_ = update
	return nil
}
