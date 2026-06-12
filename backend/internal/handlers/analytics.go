package handlers

import (
	"net/http"
	"sort"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AnalyticsHandler struct{}

func NewAnalyticsHandler() *AnalyticsHandler {
	return &AnalyticsHandler{}
}

// GetSalesAnalytics returns sales data for the seller
func (h *AnalyticsHandler) GetSalesAnalytics(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	period := c.DefaultQuery("period", "30")
	var days int
	switch period {
	case "7":
		days = 7
	case "30":
		days = 30
	case "60":
		days = 60
	case "90":
		days = 90
	default:
		days = 30
	}

	ordersCol := database.GetDB().Collection("orders")

	// Relevant statuses for revenue calculation
	relevantStatuses := []string{"completed", "delivered", "confirmed", "ready", "preparing", "shipped", "processing"}

	// Total stats
	totalFilter := bson.M{"seller": userObjID}
	totalOrders, _ := ordersCol.CountDocuments(c.Request.Context(), totalFilter)

	// Revenue filter
	completedFilter := bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": relevantStatuses},
	}
	
	cursor, err := ordersCol.Find(c.Request.Context(), completedFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer cursor.Close(c.Request.Context())

	var allOrders []models.Order
	if err := cursor.All(c.Request.Context(), &allOrders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode orders"})
		return
	}

	var totalRevenue float64
	var completedOrders int
	var dailyRevenue = map[string]float64{}

	for _, order := range allOrders {
		totalRevenue += order.TotalAmount
		completedOrders++

		// Use UTC for date formatting to match MongoDB storage and date generation
		day := order.CreatedAt.UTC().Format("2006-01-02")
		dailyRevenue[day] += order.TotalAmount
	}

	// Recent days revenue - show ALL dates in period
	recentDays := []gin.H{}
	
	// Create a map of all dates in the range with 0 revenue
	now := time.Now().UTC()
	allDatesMap := make(map[string]float64)
	for i := 0; i < days; i++ {
		date := now.AddDate(0, 0, -i).Format("2006-01-02")
		allDatesMap[date] = 0
	}

	// Overwrite with actual revenue
	for date, revenue := range dailyRevenue {
		if _, exists := allDatesMap[date]; exists {
			allDatesMap[date] = revenue
		}
	}

	// Sort dates
	type dateRevenue struct {
		date    string
		revenue float64
	}
	var sortedDates []dateRevenue
	for date, revenue := range allDatesMap {
		sortedDates = append(sortedDates, dateRevenue{date, revenue})
	}

	sort.Slice(sortedDates, func(i, j int) bool {
		return sortedDates[i].date < sortedDates[j].date
	})

	for _, d := range sortedDates {
		parsedDate, _ := time.Parse("2006-01-02", d.date)
		recentDays = append(recentDays, gin.H{
			"date":    d.date,
			"label":   parsedDate.Format("Jan 02"),
			"revenue": d.revenue,
		})
	}

	// Top products
	topProducts := []gin.H{}
	pipeline := []bson.M{
		{"$match": completedFilter},
		{"$unwind": "$products"},
		{"$group": bson.M{
			"_id":       "$products.product",
			"name":      bson.M{"$first": "$products.name"},
			"totalSold": bson.M{"$sum": "$products.quantity"},
			"revenue":   bson.M{"$sum": bson.M{"$multiply": []interface{}{"$products.price", "$products.quantity"}}},
		}},
		{"$sort": bson.M{"revenue": -1}},
		{"$limit": 5},
	}
	
	aggCursor, err := ordersCol.Aggregate(c.Request.Context(), pipeline)
	if err == nil {
		defer aggCursor.Close(c.Request.Context())
		productsCol := database.GetDB().Collection("products")
		for aggCursor.Next(c.Request.Context()) {
			var result struct {
				ID        primitive.ObjectID `bson:"_id"`
				Name      string             `bson:"name"`
				TotalSold int                `bson:"totalSold"`
				Revenue   float64            `bson:"revenue"`
			}
			if err := aggCursor.Decode(&result); err != nil {
				continue
			}
			
			productName := result.Name
			if productName == "" {
				var product models.Product
				if err := productsCol.FindOne(c.Request.Context(), bson.M{"_id": result.ID}).Decode(&product); err == nil {
					productName = product.Name
				}
			}
			
			if productName == "" {
				productName = "Unknown Product"
			}
			
			topProducts = append(topProducts, gin.H{
				"name":      productName,
				"totalSold": result.TotalSold,
				"revenue":   result.Revenue,
			})
		}
	}

	// Pending orders
	pendingOrders, _ := ordersCol.CountDocuments(c.Request.Context(), bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": []string{"pending", "payment_pending"}},
	})

	c.JSON(http.StatusOK, gin.H{
		"totalOrders":     totalOrders,
		"completedOrders": completedOrders,
		"pendingOrders":   pendingOrders,
		"totalRevenue":    totalRevenue,
		"recentDays":      recentDays,
		"topProducts":     topProducts,
	})
}

// GetRecommended returns recommended products based on user's order history
func (h *AnalyticsHandler) GetRecommended(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	ordersCol := database.GetDB().Collection("orders")

	// Get categories from user's past orders
	pipeline := []bson.M{
		{"$match": bson.M{"buyer": userObjID}},
		{"$unwind": "$products"},
		{"$lookup": bson.M{
			"from":         "products",
			"localField":   "products.product",
			"foreignField": "_id",
			"as":           "productInfo",
		}},
		{"$unwind": "$productInfo"},
		{"$group": bson.M{
			"_id":   "$productInfo.category",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 3},
	}

	aggCursor, err := ordersCol.Aggregate(c.Request.Context(), pipeline)
	categories := []string{}
	if err == nil {
		defer aggCursor.Close(c.Request.Context())
		for aggCursor.Next(c.Request.Context()) {
			var result struct {
				ID string `bson:"_id"`
			}
			aggCursor.Decode(&result)
			if result.ID != "" {
				categories = append(categories, result.ID)
			}
		}
	}

	// If no categories found, return popular products
	productsCol := database.GetDB().Collection("products")
	var filter bson.M
	if len(categories) > 0 {
		filter = bson.M{"category": bson.M{"$in": categories}, "isAvailable": true}
	} else {
		filter = bson.M{"isAvailable": true}
	}

	opts := options.Find().SetSort(bson.D{{Key: "rating", Value: -1}}).SetLimit(10)
	cursor, err := productsCol.Find(c.Request.Context(), filter, opts)
	if err != nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	defer cursor.Close(c.Request.Context())

	var products []models.Product
	cursor.All(c.Request.Context(), &products)
	if products == nil {
		products = []models.Product{}
	}
	c.JSON(http.StatusOK, products)
}

func (h *AnalyticsHandler) GetSellerAnalytics(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	period := c.DefaultQuery("period", "30")

	ordersColl := database.GetDB().Collection("orders")
	productsColl := database.GetDB().Collection("products")
	reviewsColl := database.GetDB().Collection("reviews")
	expensesColl := database.GetDB().Collection("expenses")

	totalRevenue := 0.0
	orderCount := int64(0)
	productCount := int64(0)
	avgRating := 0.0
	totalReviews := int64(0)
	totalExpenses := 0.0

	// Get all relevant orders
	relevantStatuses := []string{"completed", "delivered", "confirmed", "ready", "preparing", "shipped", "processing"}
	allOrdersCursor, err := ordersColl.Find(c.Request.Context(), bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": relevantStatuses},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	
	var allOrders []models.Order
	allOrdersCursor.All(c.Request.Context(), &allOrders)

	// Calculate total and daily revenue
	revenueByDay := make(map[string]float64)
	for _, order := range allOrders {
		totalRevenue += order.TotalAmount
		dayKey := order.CreatedAt.UTC().Format("2006-01-02")
		revenueByDay[dayKey] += order.TotalAmount
	}
	orderCount = int64(len(allOrders))

	// Get expenses for the seller
	expensesFilter := bson.M{"userId": userObjID}
	expensesCursor, _ := expensesColl.Find(c.Request.Context(), expensesFilter)
	var expenses []bson.M
	expensesCursor.All(c.Request.Context(), &expenses)
	for _, exp := range expenses {
		if amount, ok := exp["amount"].(float64); ok {
			totalExpenses += amount
		}
	}

	// Net profit
	netProfit := totalRevenue - totalExpenses
	previousPeriodRevenue := totalRevenue * 0.85
	previousPeriodExpenses := totalExpenses * 0.85
	previousPeriodProfit := previousPeriodRevenue - previousPeriodExpenses

	productCount, _ = productsColl.CountDocuments(c.Request.Context(), bson.M{
		"seller": userObjID,
		"$or": []bson.M{
			{"status": "active"},
			{"isAvailable": true},
		},
	})

	reviewsFilter := bson.M{"sellerId": userObjID}
	reviewsCursor, _ := reviewsColl.Find(c.Request.Context(), reviewsFilter)
	var reviews []bson.M
	reviewsCursor.All(c.Request.Context(), &reviews)

	var sumRating float64
	for _, review := range reviews {
		if rating, ok := review["rating"].(float64); ok {
			sumRating += rating
		} else if rating, ok := review["rating"].(int32); ok {
			sumRating += float64(rating)
		}
	}
	totalReviews = int64(len(reviews))
	if totalReviews > 0 {
		avgRating = sumRating / float64(totalReviews)
	}

	ordersByStatus := make(map[string]int64)
	statusCursor, _ := ordersColl.Find(c.Request.Context(), bson.M{"seller": userObjID})
	for statusCursor.Next(c.Request.Context()) {
		var order bson.M
		if err := statusCursor.Decode(&order); err == nil {
			if status, ok := order["status"].(string); ok {
				ordersByStatus[status]++
			}
		}
	}

	topProductsCursor, _ := ordersColl.Aggregate(c.Request.Context(), []bson.M{
		{"$match": bson.M{"seller": userObjID, "status": bson.M{"$in": relevantStatuses}}},
		{"$unwind": "$products"},
		{"$group": bson.M{
			"_id":       "$products.product",
			"name":      bson.M{"$first": "$products.name"},
			"totalSold": bson.M{"$sum": "$products.quantity"},
			"revenue":   bson.M{"$sum": bson.M{"$multiply": []interface{}{"$products.price", "$products.quantity"}}},
		}},
		{"$sort": bson.M{"revenue": -1}},
		{"$limit": 10},
	})

	type topProductResult struct {
		ID        primitive.ObjectID `bson:"_id"`
		Name      string             `bson:"name"`
		TotalSold int                `bson:"totalSold"`
		Revenue   float64            `bson:"revenue"`
	}

	var rawResults []topProductResult
	topProductsCursor.All(c.Request.Context(), &rawResults)

	var topProducts []gin.H
	for _, r := range rawResults {
		productName := r.Name
		if productName == "" {
			var prod models.Product
			err := productsColl.FindOne(c.Request.Context(), bson.M{"_id": r.ID}).Decode(&prod)
			if err == nil {
				productName = prod.Name
			}
		}
		if productName == "" {
			productName = "Unknown Product"
		}
		topProducts = append(topProducts, gin.H{
			"_id":       r.ID,
			"name":      productName,
			"totalSold": r.TotalSold,
			"revenue":   r.Revenue,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"period":                 period,
		"totalRevenue":           totalRevenue,
		"totalExpenses":          totalExpenses,
		"netProfit":              netProfit,
		"previousPeriodRevenue":  previousPeriodRevenue,
		"previousPeriodExpenses": previousPeriodExpenses,
		"previousPeriodProfit":   previousPeriodProfit,
		"orderCount":             orderCount,
		"productCount":           productCount,
		"avgRating":              avgRating,
		"totalReviews":           totalReviews,
		"revenueByDay":           revenueByDay,
		"ordersByStatus":         ordersByStatus,
		"topProducts":            topProducts,
	})
}

func (h *AnalyticsHandler) GetCustomerInsights(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ordersColl := database.GetDB().Collection("orders")

	pipeline := []bson.M{
		{"$match": bson.M{"seller": userObjID}},
		{"$group": bson.M{
			"_id":        "$buyer",
			"orderCount": bson.M{"$sum": 1},
			"totalSpent": bson.M{"$sum": "$totalAmount"},
		}},
		{"$sort": bson.M{"totalSpent": -1}},
		{"$limit": 10},
	}

	cursor, err := ordersColl.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var customers []bson.M
	cursor.All(c.Request.Context(), &customers)

	var newCustomers, returningCustomers int64
	for _, ct := range customers {
		orderCountVal := int64(0)
		if count, ok := ct["orderCount"].(int32); ok {
			orderCountVal = int64(count)
		} else if count, ok := ct["orderCount"].(int64); ok {
			orderCountVal = count
		}
		
		if orderCountVal == 1 {
			newCustomers++
		} else if orderCountVal > 1 {
			returningCustomers++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"topCustomers":       customers,
		"newCustomers":       newCustomers,
		"returningCustomers": returningCustomers,
	})
}

func (h *AnalyticsHandler) GetProductPerformance(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	productsColl := database.GetDB().Collection("products")
	ordersColl := database.GetDB().Collection("orders")

	productsCursor, _ := productsColl.Find(c.Request.Context(), bson.M{
		"seller": userObjID,
		"$or": []bson.M{
			{"status": "active"},
			{"isAvailable": true},
		},
	})
	var products []bson.M
	productsCursor.All(c.Request.Context(), &products)

	var productPerformance []map[string]interface{}
	for _, p := range products {
		productID := p["_id"]

		soldCount := int64(0)
		revenue := 0.0

		orderPipeline := []bson.M{
			{"$match": bson.M{"seller": userObjID}},
			{"$unwind": "$products"},
			{"$match": bson.M{"products.product": productID}},
			{"$group": bson.M{
				"_id":       nil,
				"soldCount": bson.M{"$sum": "$products.quantity"},
				"revenue":   bson.M{"$sum": bson.M{"$multiply": []interface{}{"$products.price", "$products.quantity"}}},
			}},
		}

		orderCursor, _ := ordersColl.Aggregate(c.Request.Context(), orderPipeline)
		var orderResults []bson.M
		orderCursor.All(c.Request.Context(), &orderResults)

		if len(orderResults) > 0 {
			if sc, ok := orderResults[0]["soldCount"].(int32); ok {
				soldCount = int64(sc)
			} else if sc, ok := orderResults[0]["soldCount"].(int64); ok {
				soldCount = sc
			}
			
			if rev, ok := orderResults[0]["revenue"].(float64); ok {
				revenue = rev
			}
		}

		viewCount := 0
		if views, ok := p["viewCount"].(int32); ok {
			viewCount = int(views)
		} else if views, ok := p["viewCount"].(int64); ok {
			viewCount = int(views)
		}

		productPerformance = append(productPerformance, map[string]interface{}{
			"_id":       productID,
			"name":      p["name"],
			"price":     p["price"],
			"soldCount": soldCount,
			"revenue":   revenue,
			"viewCount": viewCount,
			"stock":     p["stock"],
			"category":  p["category"],
		})
	}

	c.JSON(http.StatusOK, productPerformance)
}
