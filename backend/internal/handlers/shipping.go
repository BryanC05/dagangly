package handlers

import (
	"context"
	"net/http"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
	"msme-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ShippingHandler handles shipping-related HTTP requests
type ShippingHandler struct {
	biteshipService *services.BiteshipService
}

// NewShippingHandler creates a new shipping handler
func NewShippingHandler() *ShippingHandler {
	config := services.GetBiteshipConfigFromEnv()
	biteshipService := services.NewBiteshipService(config)
	
	return &ShippingHandler{
		biteshipService: biteshipService,
	}
}

// CalculateShippingRatesRequest represents the request body
type CalculateShippingRatesRequest struct {
	DeliverFrom struct {
		Latitude    float64 `json:"latitude" binding:"required"`
		Longitude   float64 `json:"longitude" binding:"required"`
		Address     string  `json:"address"`
		CityName    string  `json:"cityName"`
		StateName   string  `json:"stateName"`
		ZipCode     string  `json:"zipCode"`
	} `json:"deliverFrom" binding:"required"`
	DeliverTo struct {
		Latitude    float64 `json:"latitude" binding:"required"`
		Longitude   float64 `json:"longitude" binding:"required"`
		Address     string  `json:"address"`
		CityName    string  `json:"cityName"`
		StateName   string  `json:"stateName"`
		ZipCode     string  `json:"zipCode"`
	} `json:"deliverTo" binding:"required"`
	CourierCodes []string `json:"courierCodes"`
	Package      struct {
		Weight float64 `json:"weight" binding:"required"` // in kg
		Length float64 `json:"length"`                    // in cm
		Width  float64 `json:"width"`                     // in cm
		Height float64 `json:"height"`                    // in cm
	} `json:"package"`
}

// CalculateShippingRates godoc
// @Summary Calculate shipping rates
// @Description Get shipping rates from multiple couriers
// @Tags shipping
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CalculateShippingRatesRequest true "Shipping rate calculation request"
// @Success 200 {object} ShippingRatesResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/shipping/rates [post]
func (h *ShippingHandler) CalculateShippingRates(c *gin.Context) {
	var req CalculateShippingRatesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Convert to Biteship RateRequest
	weightGrams := req.Package.Weight * 1000.0
	if weightGrams <= 0 {
		weightGrams = 1000.0 // Default to 1kg if not specified
	}

	rateReq := services.RateRequest{
		DeliverFrom: services.Address{
			Latitude:   req.DeliverFrom.Latitude,
			Longtitude: req.DeliverFrom.Longitude,
			Address:    req.DeliverFrom.Address,
			CityName:   req.DeliverFrom.CityName,
			StateName:  req.DeliverFrom.StateName,
			ZipCode:    req.DeliverFrom.ZipCode,
			CountryISO2: "ID", // Indonesia
		},
		DeliverTo: services.Address{
			Latitude:   req.DeliverTo.Latitude,
			Longtitude: req.DeliverTo.Longitude,
			Address:    req.DeliverTo.Address,
			CityName:   req.DeliverTo.CityName,
			StateName:  req.DeliverTo.StateName,
			ZipCode:    req.DeliverTo.ZipCode,
			CountryISO2: "ID",
		},
		CourierCodes: req.CourierCodes,
		Items: []services.Item{
			{
				Name:     "Shipping Item",
				Quantity: 1,
				Weight:   weightGrams, // Biteship expects weight in grams
			},
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rateResp, err := h.biteshipService.CalculateRates(ctx, rateReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to calculate shipping rates",
			"error":   err.Error(),
		})
		return
	}

	// Format response for frontend
	rates := make([]ShippingRateOption, 0, len(rateResp.Data.Rates))
	for _, rate := range rateResp.Data.Rates {
		rates = append(rates, ShippingRateOption{
			CourierCode:      rate.CourierCode,
			CourierName:      rate.CourierName,
			ServiceCode:      rate.ServiceCode,
			ServiceName:      rate.ServiceName,
			Amount:           rate.Amount,
			Currency:         rate.Currency,
			EstimatedDays:    rate.EstimatedDays,
			EstimatedDaysMin: rate.EstimatedDaysMin,
			EstimatedDaysMax: rate.EstimatedDaysMax,
		})
	}

	c.JSON(http.StatusOK, ShippingRatesResponse{
		Success: true,
		Data: ShippingRatesData{
			RequestID: rateResp.Data.RequestID,
			Rates:     rates,
		},
	})
}

// ShippingRateOption represents a shipping rate option
type ShippingRateOption struct {
	CourierCode      string  `json:"courierCode"`
	CourierName      string  `json:"courierName"`
	ServiceCode      string  `json:"serviceCode"`
	ServiceName      string  `json:"serviceName"`
	Amount           float64 `json:"amount"`
	Currency         string  `json:"currency"`
	EstimatedDays    int     `json:"estimatedDays"`
	EstimatedDaysMin int     `json:"estimatedDaysMin,omitempty"`
	EstimatedDaysMax int     `json:"estimatedDaysMax,omitempty"`
}

// ShippingRatesResponse represents the response
type ShippingRatesResponse struct {
	Success bool               `json:"success"`
	Data    ShippingRatesData  `json:"data"`
}

// ShippingRatesData contains rate data
type ShippingRatesData struct {
	RequestID string               `json:"requestId"`
	Rates     []ShippingRateOption `json:"rates"`
}

// CreateShipmentRequest represents the request to create a shipment
type CreateShipmentRequest struct {
	OrderID       string `json:"orderId" binding:"required"`
	CourierCode   string `json:"courierCode" binding:"required"`
	ServiceCode   string `json:"serviceCode" binding:"required"`
	PickupDate    string `json:"pickupDate"` // YYYY-MM-DD
	Package       struct {
		Length  float64 `json:"length" binding:"required"`
		Width   float64 `json:"width" binding:"required"`
		Height  float64 `json:"height" binding:"required"`
		Weight  float64 `json:"weight" binding:"required"`
		Content string  `json:"content" binding:"required"`
	} `json:"package" binding:"required"`
	Insurance *struct {
		Enabled bool    `json:"enabled"`
		Amount  float64 `json:"amount"`
	} `json:"insurance"`
	COD *struct {
		Enabled bool    `json:"enabled"`
		Amount  float64 `json:"amount"`
	} `json:"cod"`
	Payment string `json:"payment" binding:"required"` // "shipper" or "receiver"
	Note    string `json:"note"`
}

// CreateShipment godoc
// @Summary Create a shipment
// @Description Create a new shipment with Biteship
// @Tags shipping
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateShipmentRequest true "Shipment creation request"
// @Success 200 {object} CreateShipmentResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/shipping/shipments [post]
func (h *ShippingHandler) CreateShipment(c *gin.Context) {
	var req CreateShipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Validate order exists and get seller info
	orderID, err := primitive.ObjectIDFromHex(req.OrderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid order ID"})
		return
	}

	// Get order from database to fetch addresses
	// This is a simplified version - you'll need to integrate with your order handler
	order, err := h.getOrder(c, orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Order not found"})
		return
	}

	// Validate user is the seller
	userID := c.GetString("userID")
	if order.Seller.Hex() != userID {
		c.JSON(http.StatusForbidden, gin.H{"message": "Only seller can create shipment"})
		return
	}

	// Get coordinates for seller location (deliver_from)
	// You'll need to implement GetSellerLocation based on your business profile
	sellerLoc, err := h.getSellerLocation(order.Seller)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get seller location"})
		return
	}

	// Create Biteship shipment request
	shipmentReq := services.CreateShipmentRequest{
		CourierCode: req.CourierCode,
		ServiceCode: req.ServiceCode,
		PickupDate:  req.PickupDate,
		DeliverFrom: services.Address{
			Latitude:   sellerLoc.Latitude,
			Longtitude: sellerLoc.Longtitude,
			Address:    sellerLoc.Address,
			CityName:   sellerLoc.CityName,
			StateName:  sellerLoc.StateName,
			ZipCode:    sellerLoc.ZipCode,
			CountryISO2: "ID",
		},
		DeliverTo: services.Address{
			Latitude:   order.DeliveryAddress.Coordinates[1],
			Longtitude: order.DeliveryAddress.Coordinates[0],
			Address:    order.DeliveryAddress.Address,
			CityName:   order.DeliveryAddress.City,
			StateName:  order.DeliveryAddress.State,
			ZipCode:    order.DeliveryAddress.Pincode,
			CountryISO2: "ID",
		},
		Package: services.Package{
			Length:  req.Package.Length,
			Width:   req.Package.Width,
			Height:  req.Package.Height,
			Weight:  req.Package.Weight,
			Content: req.Package.Content,
			Unit:    "cm",
		},
		Payment:   req.Payment,
		Reference: req.OrderID,
		Note:      req.Note,
	}

	// Add insurance if requested
	if req.Insurance != nil && req.Insurance.Enabled {
		shipmentReq.Insurance = &services.Insurance{
			Enabled:  true,
			Amount:   req.Insurance.Amount,
			Currency: "IDR",
		}
	}

	// Add COD if requested
	if req.COD != nil && req.COD.Enabled {
		shipmentReq.COD = &services.COD{
			Enabled:  true,
			Amount:   req.COD.Amount,
			Currency: "IDR",
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	shipmentResp, err := h.biteshipService.CreateShipment(ctx, shipmentReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create shipment",
			"error":   err.Error(),
		})
		return
	}

	// Update order with shipment tracking info
	err = h.updateOrderWithShipment(c, orderID, shipmentResp.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Shipment created but failed to update order",
			"trackingID": shipmentResp.Data.TrackingID,
		})
		return
	}

	c.JSON(http.StatusOK, CreateShipmentResponse{
		Success: true,
		Data: CreateShipmentData{
			ShipmentID:    shipmentResp.Data.ShipmentID,
			TrackingID:    shipmentResp.Data.TrackingID,
			AwbNumber:     shipmentResp.Data.AwbNumber,
			CourierCode:   shipmentResp.Data.CourierCode,
			CourierName:   shipmentResp.Data.CourierName,
			ServiceCode:   shipmentResp.Data.ServiceCode,
			ServiceName:   shipmentResp.Data.ServiceName,
			RateAmount:    shipmentResp.Data.RateAmount,
			Currency:      shipmentResp.Data.Currency,
			LabelURL:      shipmentResp.Data.LabelURL,
			QRCode:        shipmentResp.Data.QRCode,
			PDFManifest:   shipmentResp.Data.PDFManifest,
		},
	})
}

// CreateShipmentResponse represents the response
type CreateShipmentResponse struct {
	Success bool                `json:"success"`
	Data    CreateShipmentData  `json:"data"`
}

// CreateShipmentData contains shipment data
type CreateShipmentData struct {
	ShipmentID  string  `json:"shipmentId"`
	TrackingID  string  `json:"trackingId"`
	AwbNumber   string  `json:"awbNumber"`
	CourierCode string  `json:"courierCode"`
	CourierName string  `json:"courierName"`
	ServiceCode string  `json:"serviceCode"`
	ServiceName string  `json:"serviceName"`
	RateAmount  float64 `json:"rateAmount"`
	Currency    string  `json:"currency"`
	LabelURL    string  `json:"labelUrl,omitempty"`
	QRCode      string  `json:"qrCode,omitempty"`
	PDFManifest string  `json:"pdfManifest,omitempty"`
}

// TrackShipment godoc
// @Summary Track a shipment
// @Description Get tracking information for a shipment
// @Tags shipping
// @Produce json
// @Security ApiKeyAuth
// @Param trackingId path string true "Tracking ID"
// @Success 200 {object} TrackShipmentResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/shipping/track/{trackingId} [get]
func (h *ShippingHandler) TrackShipment(c *gin.Context) {
	trackingID := c.Param("trackingId")
	if trackingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Tracking ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	trackResp, err := h.biteshipService.TrackShipment(ctx, trackingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Shipment not found",
			"error":   err.Error(),
		})
		return
	}

	// Format tracking events for frontend
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

// TrackShipmentResponse represents the tracking response
type TrackShipmentResponse struct {
	Success bool                `json:"success"`
	Data    TrackShipmentData   `json:"data"`
}

// TrackShipmentData contains tracking data
type TrackShipmentData struct {
	ShipmentID   string          `json:"shipmentId"`
	TrackingID   string          `json:"trackingId"`
	AwbNumber    string          `json:"awbNumber"`
	CourierCode  string          `json:"courierCode"`
	Status       string          `json:"status"`
	StatusDetail string          `json:"statusDetail"`
	DeliveredAt  *time.Time      `json:"deliveredAt,omitempty"`
	ETD          *time.Time      `json:"etd,omitempty"`
	PodImage     string          `json:"podImage,omitempty"`
	Events       []TrackingEvent `json:"events"`
}

// TrackingEvent represents a tracking event
type TrackingEvent struct {
	Status       string     `json:"status"`
	StatusDetail string     `json:"statusDetail"`
	Address      string     `json:"address,omitempty"`
	City         string     `json:"city,omitempty"`
	Country      string     `json:"country,omitempty"`
	Timestamp    time.Time  `json:"timestamp"`
	Message      string     `json:"message,omitempty"`
}

// Placeholder methods - integrate with your existing order/database logic

func (h *ShippingHandler) getOrder(c *gin.Context, orderID primitive.ObjectID) (*models.Order, error) {
	// Get order from database
	collection := database.GetDB().Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var order models.Order
	err := collection.FindOne(ctx, bson.M{"_id": orderID}).Decode(&order)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (h *ShippingHandler) getSellerLocation(sellerID primitive.ObjectID) (*services.Address, error) {
	// Get seller location from business profile
	// For now return Jakarta as default - integrate with actual business profile later
	return &services.Address{
		Latitude:    -6.2088, // Jakarta example
		Longtitude:  106.8456,
		Address:     "Jakarta, Indonesia",
		CityName:    "Jakarta",
		StateName:   "DKI Jakarta",
		ZipCode:     "12345",
		CountryISO2: "ID",
	}, nil
}

func (h *ShippingHandler) updateOrderWithShipment(c *gin.Context, orderID primitive.ObjectID, shipmentData services.ShipmentData) error {
	// Update order with shipment tracking info
	collection := database.GetDB().Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"_id": orderID}
	update := bson.M{
		"$set": bson.M{
			"shipmentTrackingId": shipmentData.TrackingID,
			"shipmentStatus":     shipmentData.Status,
			"courierCode":        shipmentData.CourierCode,
			"updatedAt":          time.Now(),
		},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}
