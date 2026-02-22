package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
)

type DriverHandler struct{}

func NewDriverHandler() *DriverHandler {
	return &DriverHandler{}
}

// ToggleDriverMode enables/disables driver mode for a user
func (h *DriverHandler) ToggleDriverMode(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		IsActive bool `json:"isActive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")

	// Try to find existing driver record
	var driver models.Driver
	err = driversCollection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&driver)

	if err != nil {
		// Create new driver record
		driver = models.Driver{
			UserID:          userObjID,
			IsActive:        req.IsActive,
			IsAvailable:     req.IsActive,
			TotalDeliveries: 0,
			TotalEarnings:   0,
			Rating:          5,
			RatingCount:     0,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		_, err = driversCollection.InsertOne(context.Background(), driver)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create driver profile"})
			return
		}
	} else {
		// Update existing record
		_, err = driversCollection.UpdateOne(
			context.Background(),
			bson.M{"userId": userObjID},
			bson.M{
				"$set": bson.M{
					"isActive":    req.IsActive,
					"isAvailable": req.IsActive,
					"updatedAt":   time.Now(),
				},
			},
		)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to update driver mode"})
			return
		}
	}

	c.JSON(200, gin.H{
		"isActive": req.IsActive,
		"message":  "Driver mode updated successfully",
	})
}

// UpdateDriverProfile updates driver profile information
func (h *DriverHandler) UpdateDriverProfile(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		VehicleType string `json:"vehicleType"`
		Phone       string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")

	update := bson.M{
		"updatedAt": time.Now(),
	}
	if req.VehicleType != "" {
		update["vehicleType"] = req.VehicleType
	}
	if req.Phone != "" {
		update["phone"] = req.Phone
	}

	_, err = driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$set": update},
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update profile"})
		return
	}

	c.JSON(200, gin.H{"message": "Profile updated successfully"})
}

// UpdateDriverLocation updates driver's current location
func (h *DriverHandler) UpdateDriverLocation(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		Latitude  float64 `json:"latitude" binding:"required"`
		Longitude float64 `json:"longitude" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")

	_, err = driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{
			"$set": bson.M{
				"currentLocation": bson.M{
					"latitude":  req.Latitude,
					"longitude": req.Longitude,
					"timestamp": time.Now(),
				},
				"updatedAt": time.Now(),
			},
		},
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update location"})
		return
	}

	// Also update location in any active order
	ordersCollection := database.GetDB().Collection("orders")
	ordersCollection.UpdateOne(
		context.Background(),
		bson.M{
			"claimedBy": userObjID,
			"status":    bson.M{"$in": []string{"claimed", "picked_up", "on_the_way"}},
		},
		bson.M{
			"$set": bson.M{
				"driverLocation": bson.M{
					"latitude":  req.Latitude,
					"longitude": req.Longitude,
					"timestamp": time.Now(),
				},
			},
		},
	)

	c.JSON(200, gin.H{"success": true})
}

// GetAvailableOrders returns orders available for pickup near driver
func (h *DriverHandler) GetAvailableOrders(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Parse radius from query (default 10km)
	radius := 10.0

	// Try to get location from query params first
	var driverLat, driverLng float64
	latParam := c.Query("lat")
	lngParam := c.Query("lng")

	if latParam != "" && lngParam != "" {
		driverLat, _ = strconv.ParseFloat(latParam, 64)
		driverLng, _ = strconv.ParseFloat(lngParam, 64)
	}

	// If not in query, get from stored driver location
	if driverLat == 0 || driverLng == 0 {
		driversCollection := database.GetDB().Collection("drivers")
		var driver models.Driver
		err = driversCollection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&driver)
		if err != nil || driver.CurrentLocation == nil {
			c.JSON(400, gin.H{"message": "Driver location not available. Please update your location first."})
			return
		}
		driverLat = driver.CurrentLocation.Latitude
		driverLng = driver.CurrentLocation.Longitude
	}

	ordersCollection := database.GetDB().Collection("orders")

	// Find orders that are ready and not claimed
	cursor, err := ordersCollection.Find(
		context.Background(),
		bson.M{
			"status":       "ready",
			"claimedBy":    bson.M{"$exists": false},
			"deliveryType": "delivery",
		},
		options.Find().SetSort(bson.M{"createdAt": -1}),
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to fetch orders"})
		return
	}
	defer cursor.Close(context.Background())

	var orders []models.Order
	if err := cursor.All(context.Background(), &orders); err != nil {
		c.JSON(500, gin.H{"message": "Failed to parse orders"})
		return
	}

	// Filter by distance and calculate fees
	var availableOrders []gin.H
	usersCollection := database.GetDB().Collection("users")

	for _, order := range orders {
		// Get seller location
		var seller models.User
		err := usersCollection.FindOne(context.Background(), bson.M{"_id": order.Seller}).Decode(&seller)
		if err != nil || seller.Location.Coordinates == nil {
			continue
		}

		sellerLng := seller.Location.Coordinates[0]
		sellerLat := seller.Location.Coordinates[1]

		// Calculate distance from driver to store
		distanceToStore := calculateDistance(driverLat, driverLng, sellerLat, sellerLng)

		// Skip if too far
		if distanceToStore > radius {
			continue
		}

		// Calculate total distance (store to delivery)
		var totalDistance float64
		if order.DeliveryAddress.Coordinates != nil && len(order.DeliveryAddress.Coordinates) >= 2 {
			deliveryLng := order.DeliveryAddress.Coordinates[0]
			deliveryLat := order.DeliveryAddress.Coordinates[1]
			totalDistance = calculateDistance(sellerLat, sellerLng, deliveryLat, deliveryLng)
		}

		// Calculate fees
		deliveryFee := models.CalculateDeliveryFee(totalDistance)
		driverEarnings := models.CalculateDriverEarnings(deliveryFee)

		// Populate seller info
		sellerInfo := gin.H{
			"_id":          seller.ID,
			"name":         seller.Name,
			"businessName": seller.BusinessName,
			"address":      seller.Location.Address,
			"coordinates":  seller.Location.Coordinates,
		}

		availableOrders = append(availableOrders, gin.H{
			"order":           order,
			"seller":          sellerInfo,
			"distanceToStore": distanceToStore,
			"totalDistance":   totalDistance,
			"deliveryFee":     deliveryFee,
			"driverEarnings":  driverEarnings,
		})
	}

	c.JSON(200, availableOrders)
}

// ClaimOrder allows a driver to claim an available order
func (h *DriverHandler) ClaimOrder(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	orderID := c.Param("id")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid order ID"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")

	// Atomic update - only claim if not already claimed and status is ready
	filter := bson.M{
		"_id":       orderObjID,
		"status":    "ready",
		"claimedBy": bson.M{"$exists": false},
	}

	update := bson.M{
		"$set": bson.M{
			"claimedBy": userObjID,
			"claimedAt": time.Now(),
			"status":    "claimed",
			"updatedAt": time.Now(),
		},
	}

	result := ordersCollection.FindOneAndUpdate(
		context.Background(),
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if result.Err() != nil {
		// Check if already claimed
		var existingOrder models.Order
		ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&existingOrder)

		if existingOrder.DriverID != nil {
			c.JSON(409, gin.H{"error": "Order already claimed by another driver"})
			return
		}

		c.JSON(400, gin.H{"error": "Order no longer available"})
		return
	}

	var order models.Order
	result.Decode(&order)

	// Calculate and set delivery fee
	if order.DeliveryAddress.Coordinates != nil && len(order.DeliveryAddress.Coordinates) >= 2 {
		usersCollection := database.GetDB().Collection("users")
		var seller models.User
		usersCollection.FindOne(context.Background(), bson.M{"_id": order.Seller}).Decode(&seller)

		if seller.Location.Coordinates != nil {
			sellerLat := seller.Location.Coordinates[1]
			sellerLng := seller.Location.Coordinates[0]
			deliveryLat := order.DeliveryAddress.Coordinates[1]
			deliveryLng := order.DeliveryAddress.Coordinates[0]

			distance := calculateDistance(sellerLat, sellerLng, deliveryLat, deliveryLng)
			deliveryFee := models.CalculateDeliveryFee(distance)
			driverEarnings := models.CalculateDriverEarnings(deliveryFee)

			ordersCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": orderObjID},
				bson.M{
					"$set": bson.M{
						"estimatedDistance": distance,
						"deliveryFee":       deliveryFee,
						"driverEarnings":    driverEarnings,
					},
				},
			)

			order.DeliveryFee = deliveryFee
			order.DriverEarnings = driverEarnings
			order.EstimatedDistance = distance
		}
	}

	// Update driver's availability
	driversCollection := database.GetDB().Collection("drivers")
	driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{
			"$set": bson.M{
				"isAvailable": false,
				"updatedAt":   time.Now(),
			},
		},
	)

	c.JSON(200, order)
}

// GetActiveDelivery returns the driver's current active delivery
func (h *DriverHandler) GetActiveDelivery(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")

	// Find order claimed by this driver that is not yet delivered
	var order models.Order
	err = ordersCollection.FindOne(
		context.Background(),
		bson.M{
			"claimedBy": userObjID,
			"status":    bson.M{"$in": []string{"claimed", "picked_up", "on_the_way", "arrived"}},
		},
		options.FindOne().SetSort(bson.M{"claimedAt": -1}),
	).Decode(&order)

	if err != nil {
		c.JSON(200, gin.H{"order": nil, "isActive": false})
		return
	}

	// Populate seller and buyer info
	usersCollection := database.GetDB().Collection("users")

	var seller models.User
	usersCollection.FindOne(context.Background(), bson.M{"_id": order.Seller}).Decode(&seller)

	var buyer models.User
	usersCollection.FindOne(context.Background(), bson.M{"_id": order.Buyer}).Decode(&buyer)

	c.JSON(200, gin.H{
		"order":    order,
		"seller":   seller,
		"buyer":    buyer,
		"isActive": true,
	})
}

// UpdateDeliveryStatus updates the status during delivery
func (h *DriverHandler) UpdateDeliveryStatus(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	orderID := c.Param("id")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid order ID"})
		return
	}

	var req models.DriverStatusUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"picked_up":  true,
		"on_the_way": true,
		"arrived":    true,
		"delivered":  true,
	}

	if !validStatuses[req.Status] {
		c.JSON(400, gin.H{"message": "Invalid status"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")

	// Verify driver owns this order
	var order models.Order
	err = ordersCollection.FindOne(
		context.Background(),
		bson.M{
			"_id":       orderObjID,
			"claimedBy": userObjID,
		},
	).Decode(&order)

	if err != nil {
		c.JSON(404, gin.H{"message": "Order not found or not assigned to you"})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"status":    req.Status,
			"updatedAt": time.Now(),
		},
		"$push": bson.M{
			"deliveryProgress": bson.M{
				"status":    req.Status,
				"timestamp": time.Now(),
				"note":      req.Notes,
			},
		},
	}

	// Add timestamps for specific statuses
	switch req.Status {
	case "picked_up":
		update["$set"].(bson.M)["pickupAt"] = time.Now()
	case "delivered":
		update["$set"].(bson.M)["deliveredAt"] = time.Now()
		update["$set"].(bson.M)["deliveryNotes"] = req.Notes

		// Update driver stats
		driversCollection := database.GetDB().Collection("drivers")
		driversCollection.UpdateOne(
			context.Background(),
			bson.M{"userId": userObjID},
			bson.M{
				"$inc": bson.M{
					"totalDeliveries": 1,
					"totalEarnings":   order.DriverEarnings,
				},
				"$set": bson.M{
					"isAvailable": true,
					"updatedAt":   time.Now(),
				},
			},
		)

		// Create earnings record
		earningsCollection := database.GetDB().Collection("driver_earnings")
		earningsCollection.InsertOne(context.Background(), models.DriverEarnings{
			DriverID:  userObjID,
			OrderID:   orderObjID,
			Amount:    order.DriverEarnings,
			Fee:       order.DeliveryFee - order.DriverEarnings,
			NetAmount: order.DriverEarnings,
			Type:      "delivery",
			Status:    "pending",
			CreatedAt: time.Now(),
		})
	}

	// Update driver location if provided
	if req.Location != nil {
		update["$set"].(bson.M)["driverLocation"] = bson.M{
			"latitude":  req.Location.Latitude,
			"longitude": req.Location.Longitude,
			"timestamp": time.Now(),
		}
	}

	_, err = ordersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": orderObjID},
		update,
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update status"})
		return
	}

	// Fetch the updated order
	ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&order)

	c.JSON(200, order)
}

// GetDriverStats returns driver statistics
func (h *DriverHandler) GetDriverStats(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")
	earningsCollection := database.GetDB().Collection("driver_earnings")

	var driver models.Driver
	err = driversCollection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&driver)
	if err != nil {
		c.JSON(404, gin.H{"message": "Driver profile not found"})
		return
	}

	// Calculate earnings for different periods
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Today's earnings
	todayCursor, _ := earningsCollection.Aggregate(context.Background(), []bson.M{
		{
			"$match": bson.M{
				"driverId":  userObjID,
				"createdAt": bson.M{"$gte": todayStart},
				"status":    bson.M{"$ne": "cancelled"},
			},
		},
		{
			"$group": bson.M{
				"_id":   nil,
				"total": bson.M{"$sum": "$amount"},
			},
		},
	})
	var todayResult []bson.M
	todayCursor.All(context.Background(), &todayResult)
	todayEarnings := 0.0
	if len(todayResult) > 0 {
		todayEarnings = todayResult[0]["total"].(float64)
	}

	// Week's earnings
	weekCursor, _ := earningsCollection.Aggregate(context.Background(), []bson.M{
		{
			"$match": bson.M{
				"driverId":  userObjID,
				"createdAt": bson.M{"$gte": weekStart},
				"status":    bson.M{"$ne": "cancelled"},
			},
		},
		{
			"$group": bson.M{
				"_id":   nil,
				"total": bson.M{"$sum": "$amount"},
			},
		},
	})
	var weekResult []bson.M
	weekCursor.All(context.Background(), &weekResult)
	weekEarnings := 0.0
	if len(weekResult) > 0 {
		weekEarnings = weekResult[0]["total"].(float64)
	}

	// Month's earnings
	monthCursor, _ := earningsCollection.Aggregate(context.Background(), []bson.M{
		{
			"$match": bson.M{
				"driverId":  userObjID,
				"createdAt": bson.M{"$gte": monthStart},
				"status":    bson.M{"$ne": "cancelled"},
			},
		},
		{
			"$group": bson.M{
				"_id":   nil,
				"total": bson.M{"$sum": "$amount"},
			},
		},
	})
	var monthResult []bson.M
	monthCursor.All(context.Background(), &monthResult)
	monthEarnings := 0.0
	if len(monthResult) > 0 {
		monthEarnings = monthResult[0]["total"].(float64)
	}

	c.JSON(200, models.DriverStats{
		TotalDeliveries: driver.TotalDeliveries,
		TotalEarnings:   driver.TotalEarnings,
		Rating:          driver.Rating,
		TodayEarnings:   todayEarnings,
		WeekEarnings:    weekEarnings,
		MonthEarnings:   monthEarnings,
	})
}

// GetDeliveryHistory returns driver's past deliveries
func (h *DriverHandler) GetDeliveryHistory(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	status := c.Query("status") // "all", "completed", "cancelled"
	if status == "" {
		status = "all"
	}

	limit := int64(20)
	offset := int64(0)

	ordersCollection := database.GetDB().Collection("orders")

	filter := bson.M{
		"claimedBy": userObjID,
		"status":    bson.M{"$in": []string{"delivered", "cancelled"}},
	}

	if status == "completed" {
		filter["status"] = "delivered"
	} else if status == "cancelled" {
		filter["status"] = "cancelled"
	}

	count, _ := ordersCollection.CountDocuments(context.Background(), filter)

	findOptions := options.Find().
		SetSort(bson.M{"deliveredAt": -1}).
		SetSkip(offset).
		SetLimit(limit)

	cursor, err := ordersCollection.Find(context.Background(), filter, findOptions)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to fetch history"})
		return
	}
	defer cursor.Close(context.Background())

	var orders []models.Order
	if err := cursor.All(context.Background(), &orders); err != nil {
		c.JSON(500, gin.H{"message": "Failed to parse orders"})
		return
	}

	c.JSON(200, gin.H{
		"deliveries": orders,
		"total":      count,
	})
}

// GetEarningsHistory returns earnings breakdown by period
func (h *DriverHandler) GetEarningsHistory(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	period := c.Query("period") // "day", "week", "month", "all"
	if period == "" {
		period = "week"
	}

	earningsCollection := database.GetDB().Collection("driver_earnings")

	now := time.Now()
	var startDate time.Time

	switch period {
	case "day":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -7)
	case "month":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, -1, 0)
	default:
		startDate = time.Time{}
	}

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"driverId": userObjID,
				"status":   bson.M{"$ne": "cancelled"},
			},
		},
	}

	if !startDate.IsZero() {
		pipeline[0]["$match"].(bson.M)["createdAt"] = bson.M{"$gte": startDate}
	}

	pipeline = append(pipeline,
		bson.M{
			"$group": bson.M{
				"_id": bson.M{
					"year":  bson.M{"$year": "$createdAt"},
					"month": bson.M{"$month": "$createdAt"},
					"day":   bson.M{"$dayOfMonth": "$createdAt"},
				},
				"amount":     bson.M{"$sum": "$amount"},
				"orderCount": bson.M{"$sum": 1},
			},
		},
		bson.M{
			"$sort": bson.M{"_id": -1},
		},
	)

	cursor, err := earningsCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to fetch earnings"})
		return
	}
	defer cursor.Close(context.Background())

	var results []bson.M
	cursor.All(context.Background(), &results)

	earnings := make([]gin.H, len(results))
	for i, r := range results {
		id := r["_id"].(bson.M)
		earnings[i] = gin.H{
			"date":       time.Date(int(id["year"].(int32)), time.Month(int(id["month"].(int32))), int(id["day"].(int32)), 0, 0, 0, 0, time.UTC),
			"amount":     r["amount"],
			"orderCount": r["orderCount"],
		}
	}

	c.JSON(200, earnings)
}

// GetDriverProfile returns the driver's profile
func (h *DriverHandler) GetDriverProfile(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")

	var driver models.Driver
	err = driversCollection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&driver)
	if err != nil {
		c.JSON(404, gin.H{"message": "Driver profile not found"})
		return
	}

	c.JSON(200, driver)
}

// CompleteDelivery marks a delivery as complete
func (h *DriverHandler) CompleteDelivery(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	orderID := c.Param("id")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid order ID"})
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}
	c.ShouldBindJSON(&req)

	ordersCollection := database.GetDB().Collection("orders")

	var order models.Order
	err = ordersCollection.FindOne(
		context.Background(),
		bson.M{
			"_id":       orderObjID,
			"claimedBy": userObjID,
		},
	).Decode(&order)

	if err != nil {
		c.JSON(404, gin.H{"message": "Order not found or not assigned to you"})
		return
	}

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"status":        "delivered",
			"deliveredAt":   now,
			"deliveryNotes": req.Notes,
			"updatedAt":     now,
		},
	}

	_, err = ordersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": orderObjID},
		update,
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to complete delivery"})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")
	driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{
			"$inc": bson.M{
				"totalDeliveries": 1,
				"totalEarnings":   order.DriverEarnings,
			},
			"$set": bson.M{
				"isAvailable": true,
				"updatedAt":   now,
			},
		},
	)

	earningsCollection := database.GetDB().Collection("driver_earnings")
	earningsCollection.InsertOne(context.Background(), models.DriverEarnings{
		DriverID:  userObjID,
		OrderID:   orderObjID,
		Amount:    order.DriverEarnings,
		Fee:       order.DeliveryFee - order.DriverEarnings,
		NetAmount: order.DriverEarnings,
		Type:      "delivery",
		Status:    "pending",
		CreatedAt: now,
	})

	c.JSON(200, gin.H{
		"success":  true,
		"earnings": order.DriverEarnings,
		"message":  "Delivery completed successfully",
	})
}

// SavePushToken saves the driver's push notification token
func (h *DriverHandler) SavePushToken(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		PushToken string `json:"pushToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	driversCollection := database.GetDB().Collection("drivers")

	_, err = driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{
			"$set": bson.M{
				"pushToken": req.PushToken,
				"updatedAt": time.Now(),
			},
		},
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to save push token"})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

// RateDriver allows buyer to rate a driver after delivery
func (h *DriverHandler) RateDriver(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	orderID := c.Param("orderId")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid order ID"})
		return
	}

	var req struct {
		Rating  float64 `json:"rating" binding:"required,min=1,max=5"`
		Comment string  `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": "Rating must be between 1 and 5"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")

	var order models.Order
	err = ordersCollection.FindOne(
		context.Background(),
		bson.M{
			"_id":    orderObjID,
			"buyer":  userObjID,
			"status": "delivered",
		},
	).Decode(&order)

	if err != nil {
		c.JSON(404, gin.H{"message": "Order not found or not eligible for rating"})
		return
	}

	if order.ClaimedBy == nil {
		c.JSON(400, gin.H{"message": "This order has no driver to rate"})
		return
	}

	driverObjID := order.ClaimedBy

	driversCollection := database.GetDB().Collection("drivers")
	var driver models.Driver
	err = driversCollection.FindOne(context.Background(), bson.M{"userId": driverObjID}).Decode(&driver)
	if err != nil {
		c.JSON(404, gin.H{"message": "Driver not found"})
		return
	}

	newRatingCount := driver.RatingCount + 1
	newTotalRating := (driver.Rating * float64(driver.RatingCount)) + req.Rating
	newRating := newTotalRating / float64(newRatingCount)

	_, err = driversCollection.UpdateOne(
		context.Background(),
		bson.M{"userId": driverObjID},
		bson.M{
			"$set": bson.M{
				"rating":      newRating,
				"ratingCount": newRatingCount,
				"updatedAt":   time.Now(),
			},
		},
	)

	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update driver rating"})
		return
	}

	ordersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": orderObjID},
		bson.M{
			"$set": bson.M{
				"driverRating":  req.Rating,
				"driverComment": req.Comment,
				"ratedAt":       time.Now(),
			},
		},
	)

	c.JSON(200, gin.H{
		"success":     true,
		"newRating":   newRating,
		"ratingCount": newRatingCount,
	})
}

// GetNearbyDriverTokens returns push tokens of nearby active drivers
func (h *DriverHandler) GetNearbyDriverTokens(storeLat, storeLng, radius float64) ([]string, error) {
	driversCollection := database.GetDB().Collection("drivers")

	filter := bson.M{
		"isActive":    true,
		"isAvailable": true,
		"pushToken":   bson.M{"$exists": true, "$ne": ""},
	}

	cursor, err := driversCollection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var drivers []models.Driver
	if err := cursor.All(context.Background(), &drivers); err != nil {
		return nil, err
	}

	var tokens []string
	for _, driver := range drivers {
		if driver.CurrentLocation != nil {
			distance := calculateDistance(storeLat, storeLng, driver.CurrentLocation.Latitude, driver.CurrentLocation.Longitude)
			if distance <= radius {
				tokens = append(tokens, driver.PushToken)
			}
		}
	}

	return tokens, nil
}
