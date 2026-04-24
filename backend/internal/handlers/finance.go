package handlers

import (
	"context"
	"net/http"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type FinanceHandler struct{}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

// SyncExpenses - sync local expenses to backend or fetch from backend
func (h *FinanceHandler) SyncExpenses(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		Expenses []struct {
			ID          string  `json:"id"`
			Amount      float64 `json:"amount"`
			Category    string  `json:"category"`
			Description string  `json:"description"`
			Date        string  `json:"date"`
			LocalID     string  `json:"localId"`
		} `json:"expenses"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	collection := database.GetDB().Collection("expenses")
	now := time.Now()

	// Upsert local expenses to backend
	for _, exp := range req.Expenses {
		filter := bson.M{"localId": exp.LocalID, "userId": userObjID}
		update := bson.M{
			"$set": bson.M{
				"amount":      exp.Amount,
				"category":    exp.Category,
				"description": exp.Description,
				"date":        exp.Date,
				"updatedAt":   now,
				"source":      "mobile",
			},
			"$setOnInsert": bson.M{
				"userId":    userObjID,
				"localId":   exp.LocalID,
				"createdAt": now,
			},
		}

		opts := options.FindOneAndUpdate().SetUpsert(true)
		var result models.Expense
		err := collection.FindOneAndUpdate(context.Background(), filter, update, opts).Decode(&result)
		if err != nil {
			continue
		}
	}

	// Fetch all expenses from backend
	cursor, err := collection.Find(context.Background(), bson.M{"userId": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var expenses []models.ExpenseResponse
	for cursor.Next(context.Background()) {
		var exp models.Expense
		if err := cursor.Decode(&exp); err != nil {
			continue
		}
		expenses = append(expenses, models.ExpenseResponse{
			ID:          exp.LocalID,
			Amount:      exp.Amount,
			Category:    exp.Category,
			Description: exp.Description,
			Date:        exp.Date,
			CreatedAt:   exp.CreatedAt,
			UpdatedAt:   exp.UpdatedAt,
			SyncStatus:  "synced",
		})
	}

	c.JSON(http.StatusOK, gin.H{"expenses": expenses})
}

// GetExpenses - get expenses summary
func (h *FinanceHandler) GetExpenses(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("expenses")

	// This month
	startOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.UTC)
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId": userObjID,
			"date":   bson.M{"$gte": startOfMonth.Format("2006-01-02")},
		}},
		{"$group": bson.M{
			"_id":   "$category",
			"total": bson.M{"$sum": "$amount"},
		}},
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	categoryTotals := make(map[string]float64)
	for cursor.Next(context.Background()) {
		var result struct {
			ID    string  `bson:"_id"`
			Total float64 `bson:"total"`
		}
		cursor.Decode(&result)
		categoryTotals[result.ID] = result.Total
	}

	total, _ := collection.CountDocuments(context.Background(), bson.M{"userId": userObjID})

	c.JSON(http.StatusOK, gin.H{
		"categoryTotals": categoryTotals,
		"total":          total,
	})
}

// SyncInvoices - sync local invoices to backend
func (h *FinanceHandler) SyncInvoices(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		Invoices []struct {
			LocalID       string  `json:"localId"`
			OrderID       string  `json:"orderId"`
			InvoiceNumber string  `json:"invoiceNumber"`
			CustomerName  string  `json:"customerName"`
			Items         string  `json:"items"`
			Total         float64 `json:"total"`
		} `json:"invoices"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	collection := database.GetDB().Collection("invoices")
	now := time.Now()

	for _, inv := range req.Invoices {
		filter := bson.M{"localId": inv.LocalID, "userId": userObjID}
		update := bson.M{
			"$set": bson.M{
				"invoiceNumber": inv.InvoiceNumber,
				"customerName":  inv.CustomerName,
				"items":         inv.Items,
				"total":         inv.Total,
				"updatedAt":     now,
				"source":        "mobile",
			},
			"$setOnInsert": bson.M{
				"userId":    userObjID,
				"localId":   inv.LocalID,
				"orderId":   inv.OrderID,
				"createdAt": now,
			},
		}

		opts := options.FindOneAndUpdate().SetUpsert(true)
		collection.FindOneAndUpdate(context.Background(), filter, update, opts)
	}

	// Fetch all invoices
	cursor, err := collection.Find(context.Background(), bson.M{"userId": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var invoices []bson.M
	for cursor.Next(context.Background()) {
		var inv bson.M
		cursor.Decode(&inv)
		invoices = append(invoices, inv)
	}

	c.JSON(http.StatusOK, gin.H{"invoices": invoices})
}

// GetFinanceSummary - dashboard summary
func (h *FinanceHandler) GetFinanceSummary(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	expensesCollection := database.GetDB().Collection("expenses")

	// Get sales from completed orders
	salesPipeline := []bson.M{
		{"$match": bson.M{
			"seller": userObjID,
			"status": bson.M{"$in": []string{"delivered", "completed"}},
		}},
		{"$group": bson.M{
			"_id":   nil,
			"total": bson.M{"$sum": "$total"},
			"count": bson.M{"$sum": 1},
		}},
	}

	salesCursor, _ := ordersCollection.Aggregate(context.Background(), salesPipeline)
	var salesSummary struct {
		Total float64 `bson:"total"`
		Count int     `bson:"count"`
	}
	if salesCursor.Next(context.Background()) {
		salesCursor.Decode(&salesSummary)
	}
	salesCursor.Close(context.Background())

	// Get expenses
	expPipeline := []bson.M{
		{"$match": bson.M{"userId": userObjID}},
		{"$group": bson.M{
			"_id":   nil,
			"total": bson.M{"$sum": "$amount"},
		}},
	}

	expCursor, _ := expensesCollection.Aggregate(context.Background(), expPipeline)
	var expenseSummary struct {
		Total float64 `bson:"total"`
	}
	if expCursor.Next(context.Background()) {
		expCursor.Decode(&expenseSummary)
	}
	expCursor.Close(context.Background())

	c.JSON(http.StatusOK, gin.H{
		"totalSales":    salesSummary.Total,
		"orderCount":    salesSummary.Count,
		"totalExpenses": expenseSummary.Total,
		"netProfit":     salesSummary.Total - expenseSummary.Total,
	})
}

// GetAllSellers - get all sellers with products
func (h *FinanceHandler) GetAllSellers(c *gin.Context) {
	collection := database.GetDB().Collection("sellers")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var sellers []bson.M
	for cursor.Next(context.Background()) {
		var seller bson.M
		cursor.Decode(&seller)
		sellers = append(sellers, seller)
	}

	c.JSON(http.StatusOK, gin.H{"sellers": sellers})
}

// GetProductsWithFinancials - get all products with calculated financials
func (h *FinanceHandler) GetProductsWithFinancials(c *gin.Context) {
	collection := database.GetDB().Collection("products")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var products []bson.M
	for cursor.Next(context.Background()) {
		var product bson.M
		cursor.Decode(&product)
		products = append(products, product)
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

// GetProductsBySeller - get products for a specific seller
func (h *FinanceHandler) GetProductsBySeller(c *gin.Context) {
	sellerId := c.Query("sellerId")
	if sellerId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "sellerId required"})
		return
	}

	collection := database.GetDB().Collection("products")
	cursor, err := collection.Find(context.Background(), bson.M{"sellerId": sellerId})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var products []bson.M
	for cursor.Next(context.Background()) {
		var product bson.M
		cursor.Decode(&product)
		products = append(products, product)
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

// GetOrdersBySeller - get orders for a specific seller
func (h *FinanceHandler) GetOrdersBySeller(c *gin.Context) {
	sellerId := c.Query("sellerId")
	if sellerId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "sellerId required"})
		return
	}

	collection := database.GetDB().Collection("orders")
	cursor, err := collection.Find(context.Background(), bson.M{"sellerId": sellerId})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var orders []bson.M
	for cursor.Next(context.Background()) {
		var order bson.M
		cursor.Decode(&order)
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// ProductCalculations - save product profit calculations
func (h *FinanceHandler) ProductCalculations(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("product_calculations")
	now := time.Now()

	// GET - fetch all calculations
	if c.Request.Method == "GET" {
		cursor, err := collection.Find(context.Background(), bson.M{"userId": userObjID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		var calculations []models.ProductCalculation
		for cursor.Next(context.Background()) {
			var calc models.ProductCalculation
			cursor.Decode(&calc)
			calculations = append(calculations, calc)
		}

		c.JSON(http.StatusOK, gin.H{"calculations": calculations})
		return
	}

	// POST - save calculation
	var req struct {
		ProductName  string  `json:"productName"`
		SellingPrice float64 `json:"sellingPrice"`
		Quantity     int     `json:"quantity"`
		Expenses     []struct {
			ID     string  `json:"id"`
			Name   string  `json:"name"`
			Amount float64 `json:"amount"`
		} `json:"expenses"`
		TotalRevenue  float64 `json:"totalRevenue"`
		TotalCost     float64 `json:"totalCost"`
		CleanProfit   float64 `json:"cleanProfit"`
		ProfitMargin  float64 `json:"profitMargin"`
		CostPerUnit   float64 `json:"costPerUnit"`
		ProfitPerUnit float64 `json:"profitPerUnit"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var expenseItems []models.ExpenseItem
	for _, exp := range req.Expenses {
		expenseItems = append(expenseItems, models.ExpenseItem{
			ID:     exp.ID,
			Name:   exp.Name,
			Amount: exp.Amount,
		})
	}

	calc := models.ProductCalculation{
		UserID:        userObjID,
		ProductName:   req.ProductName,
		SellingPrice:  req.SellingPrice,
		Quantity:      req.Quantity,
		Expenses:      expenseItems,
		TotalRevenue:  req.TotalRevenue,
		TotalCost:     req.TotalCost,
		CleanProfit:   req.CleanProfit,
		ProfitMargin:  req.ProfitMargin,
		CostPerUnit:   req.CostPerUnit,
		ProfitPerUnit: req.ProfitPerUnit,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	result, err := collection.InsertOne(context.Background(), calc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Calculation saved",
		"calculation": result.InsertedID,
	})
}

// GetProductCalculations - get calculations for AI
func (h *FinanceHandler) GetProductCalculations(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("product_calculations")
	cursor, err := collection.Find(context.Background(), bson.M{"userId": userObjID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(10))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var calculations []models.ProductCalculation
	for cursor.Next(context.Background()) {
		var calc models.ProductCalculation
		cursor.Decode(&calc)
		calculations = append(calculations, calc)
	}

	c.JSON(http.StatusOK, gin.H{"calculations": calculations})
}
