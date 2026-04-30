package handlers

import (
	"context"
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
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	period := c.DefaultQuery("period", "30")
	var days int
	switch period {
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

	// Total stats
	totalFilter := bson.M{"seller": userObjID}
	totalOrders, _ := ordersCol.CountDocuments(context.Background(), totalFilter)

	// Revenue (from all relevant order statuses - all historical data)
	relevantStatuses := []string{"completed", "delivered", "confirmed", "ready", "preparing", "shipped", "processing"}
	completedFilter := bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": relevantStatuses},
	}
	cursor, err := ordersCol.Find(context.Background(), completedFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics"})
		return
	}
	defer cursor.Close(context.Background())

	var totalRevenue float64
	var completedOrders int
	var dailyRevenue = map[string]float64{}

	for cursor.Next(context.Background()) {
		var order models.Order
		cursor.Decode(&order)
		totalRevenue += order.TotalAmount
		completedOrders++

		day := order.CreatedAt.Format("2006-01-02")
		dailyRevenue[day] += order.TotalAmount
	}

	// Recent days revenue - only show dates with revenue, filtered by period
	recentDays := []gin.H{}
	startDate := time.Now().AddDate(0, 0, -days)

	type dateRevenue struct {
		date    string
		revenue float64
	}
	var allDates []dateRevenue
	for date, revenue := range dailyRevenue {
		parsedDate, _ := time.Parse("2006-01-02", date)
		if parsedDate.After(startDate) || parsedDate.Equal(startDate) {
			allDates = append(allDates, dateRevenue{date, revenue})
		}
	}

	sort.Slice(allDates, func(i, j int) bool {
		return allDates[i].date < allDates[j].date
	})

	for _, d := range allDates {
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
		{"$match": bson.M{"seller": userObjID, "status": bson.M{"$in": []string{"completed", "delivered", "confirmed"}}}},
		{"$unwind": "$products"},
		{"$group": bson.M{
			"_id":       "$products.product",
			"totalSold": bson.M{"$sum": "$products.quantity"},
			"revenue":   bson.M{"$sum": bson.M{"$multiply": []string{"$products.price", "$products.quantity"}}},
		}},
		{"$sort": bson.M{"totalSold": -1}},
		{"$limit": 5},
	}
	aggCursor, err := ordersCol.Aggregate(context.Background(), pipeline)
	if err == nil {
		defer aggCursor.Close(context.Background())
		productsCol := database.GetDB().Collection("products")
		for aggCursor.Next(context.Background()) {
			var result struct {
				ID        primitive.ObjectID `bson:"_id"`
				TotalSold int                `bson:"totalSold"`
				Revenue   float64            `bson:"revenue"`
			}
			aggCursor.Decode(&result)
			var product models.Product
			productsCol.FindOne(context.Background(), bson.M{"_id": result.ID}).Decode(&product)
			topProducts = append(topProducts, gin.H{
				"name":      product.Name,
				"totalSold": result.TotalSold,
				"revenue":   result.Revenue,
			})
		}
	}

	// Pending orders
	pendingOrders, _ := ordersCol.CountDocuments(context.Background(), bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": []string{"pending", "confirmed"}},
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

	aggCursor, err := ordersCol.Aggregate(context.Background(), pipeline)
	categories := []string{}
	if err == nil {
		defer aggCursor.Close(context.Background())
		for aggCursor.Next(context.Background()) {
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
	cursor, err := productsCol.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	defer cursor.Close(context.Background())

	var products []models.Product
	cursor.All(context.Background(), &products)
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

	// Get all relevant orders (not filtered by startDate for revenue calculation)
	allOrdersCursor, _ := ordersColl.Find(context.Background(), bson.M{
		"seller": userObjID,
		"status": bson.M{"$in": []string{"completed", "delivered", "confirmed", "ready", "preparing", "shipped", "processing"}},
	})
	var allOrders []models.Order
	allOrdersCursor.All(context.Background(), &allOrders)

	// Calculate total from all orders
	for _, order := range allOrders {
		totalRevenue += order.TotalAmount
	}
	orderCount = int64(len(allOrders))

	// Get expenses for the seller in the period
	expensesFilter := bson.M{"userId": userObjID}
	expensesCursor, _ := expensesColl.Find(context.Background(), expensesFilter)
	var expenses []bson.M
	expensesCursor.All(context.Background(), &expenses)
	for _, exp := range expenses {
		if amount, ok := exp["amount"].(float64); ok {
			totalExpenses += amount
		}
	}

	netProfit := totalRevenue - totalExpenses
	previousPeriodRevenue := totalRevenue * 0.85
	previousPeriodExpenses := totalExpenses * 0.85
	previousPeriodProfit := previousPeriodRevenue - previousPeriodExpenses

	productCount, _ = productsColl.CountDocuments(context.Background(), bson.M{
		"seller": userObjID,
		"$or": []bson.M{
			{"status": "active"},
			{"isAvailable": true},
		},
	})

	reviewsFilter := bson.M{"sellerId": userObjID}
	reviewsCursor, _ := reviewsColl.Find(context.Background(), reviewsFilter)
	var reviews []bson.M
	reviewsCursor.All(context.Background(), &reviews)

	var sumRating float64
	for _, review := range reviews {
		if rating, ok := review["rating"].(float64); ok {
			sumRating += rating
		}
	}
	totalReviews = int64(len(reviews))
	if totalReviews > 0 {
		avgRating = sumRating / float64(totalReviews)
	}

	revenueByDay := make(map[string]float64)
	for _, order := range allOrders {
		dayKey := order.CreatedAt.Format("2006-01-02")
		revenueByDay[dayKey] += order.TotalAmount
	}

	ordersByStatus := make(map[string]int64)
	statusCursor, _ := ordersColl.Find(context.Background(), bson.M{"seller": userObjID})
	for statusCursor.Next(context.Background()) {
		var order bson.M
		if err := statusCursor.Decode(&order); err == nil {
			if status, ok := order["status"].(string); ok {
				ordersByStatus[status]++
			}
		}
	}

	topProductsCursor, _ := ordersColl.Aggregate(context.Background(), []bson.M{
		{"$match": bson.M{"seller": userObjID}},
		{"$unwind": "$products"},
		{"$group": bson.M{
			"_id":       "$products.productId",
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
	topProductsCursor.All(context.Background(), &rawResults)

	var topProducts []gin.H
	for _, r := range rawResults {
		productName := r.Name
		if productName == "" {
			var prod models.Product
			err := productsColl.FindOne(context.Background(), bson.M{"_id": r.ID}).Decode(&prod)
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

	cursor, err := ordersColl.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var customers []bson.M
	cursor.All(context.Background(), &customers)

	var newCustomers, returningCustomers int64
	for _, ct := range customers {
		if orderCount, ok := ct["orderCount"].(int32); ok {
			if orderCount == 1 {
				newCustomers++
			} else {
				returningCustomers++
			}
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

	productsCursor, _ := productsColl.Find(context.Background(), bson.M{
		"seller": userObjID,
		"$or": []bson.M{
			{"status": "active"},
			{"isAvailable": true},
		},
	})
	var products []bson.M
	productsCursor.All(context.Background(), &products)

	var productPerformance []map[string]interface{}
	for _, p := range products {
		productID := p["_id"]

		soldCount := int64(0)
		revenue := 0.0

		orderPipeline := []bson.M{
			{"$match": bson.M{"seller": userObjID}},
			{"$unwind": "$products"},
			{"$match": bson.M{"products.productId": productID}},
			{"$group": bson.M{
				"_id":       nil,
				"soldCount": bson.M{"$sum": "$products.quantity"},
				"revenue":   bson.M{"$sum": bson.M{"$multiply": []interface{}{"$products.price", "$products.quantity"}}},
			}},
		}

		orderCursor, _ := ordersColl.Aggregate(context.Background(), orderPipeline)
		var orderResults []bson.M
		orderCursor.All(context.Background(), &orderResults)

		if len(orderResults) > 0 {
			if sc, ok := orderResults[0]["soldCount"].(int32); ok {
				soldCount = int64(sc)
			}
			if rev, ok := orderResults[0]["revenue"].(float64); ok {
				revenue = rev
			}
		}

		viewCount := 0
		if views, ok := p["viewCount"].(int32); ok {
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
