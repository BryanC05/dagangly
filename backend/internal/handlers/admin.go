package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	usersColl := database.GetDB().Collection("users")
	productsColl := database.GetDB().Collection("products")
	ordersColl := database.GetDB().Collection("orders")
	businessesColl := database.GetDB().Collection("businesses")

	totalUsers, _ := usersColl.CountDocuments(context.Background(), bson.M{})
	totalSellers, _ := usersColl.CountDocuments(context.Background(), bson.M{"role": "seller"})
	totalProducts, _ := productsColl.CountDocuments(context.Background(), bson.M{})
	totalOrders, _ := ordersColl.CountDocuments(context.Background(), bson.M{})
	activeBusinesses, _ := businessesColl.CountDocuments(context.Background(), bson.M{})

	monthStart := time.Now().Truncate(24*time.Hour).AddDate(0, -1, 0)
	cursor, _ := ordersColl.Find(context.Background(), bson.M{
		"createdAt": bson.M{"$gte": monthStart},
		"status":    "completed",
	})
	var orders []models.Order
	cursor.All(context.Background(), &orders)

	var monthlyRevenue float64
	for _, o := range orders {
		monthlyRevenue += o.TotalAmount
	}

	c.JSON(http.StatusOK, gin.H{
		"totalUsers":       totalUsers,
		"totalSellers":     totalSellers,
		"totalProducts":    totalProducts,
		"totalOrders":      totalOrders,
		"activeBusinesses": activeBusinesses,
		"monthlyRevenue":   monthlyRevenue,
	})
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	role := c.Query("role")
	search := c.Query("search")

	skip := (page - 1) * limit

	filter := bson.M{}
	if role != "" {
		filter["role"] = role
	}
	if search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"email": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	usersColl := database.GetDB().Collection("users")
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := usersColl.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	cursor.All(context.Background(), &users)

	total, _ := usersColl.CountDocuments(context.Background(), filter)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usersColl := database.GetDB().Collection("users")
	_, err = usersColl.UpdateOne(context.Background(), bson.M{"_id": userObjID}, bson.M{"$set": bson.M{"role": req.Role}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated"})
}

func (h *AdminHandler) BanUser(c *gin.Context) {
	userID := c.Param("id")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Banned bool   `json:"banned"`
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usersColl := database.GetDB().Collection("users")
	_, err = usersColl.UpdateOne(context.Background(), bson.M{"_id": userObjID}, bson.M{"$set": bson.M{
		"isBanned":  req.Banned,
		"banReason": req.Reason,
		"bannedAt":  time.Now(),
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ban status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User ban status updated"})
}

func (h *AdminHandler) GetProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	search := c.Query("search")

	skip := (page - 1) * limit

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	productsColl := database.GetDB().Collection("products")
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := productsColl.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	cursor.All(context.Background(), &products)

	total, _ := productsColl.CountDocuments(context.Background(), filter)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *AdminHandler) ApproveProduct(c *gin.Context) {
	productID := c.Param("id")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	productsColl := database.GetDB().Collection("products")
	_, err = productsColl.UpdateOne(context.Background(), bson.M{"_id": productObjID}, bson.M{"$set": bson.M{
		"status":     "active",
		"approvedAt": time.Now(),
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product approved"})
}

func (h *AdminHandler) RejectProduct(c *gin.Context) {
	productID := c.Param("id")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	productsColl := database.GetDB().Collection("products")
	_, err = productsColl.UpdateOne(context.Background(), bson.M{"_id": productObjID}, bson.M{"$set": bson.M{
		"status":          "rejected",
		"rejectedAt":      time.Now(),
		"rejectionReason": req.Reason,
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product rejected"})
}

func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	productsColl := database.GetDB().Collection("products")
	_, err = productsColl.DeleteOne(context.Background(), bson.M{"_id": productObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

func (h *AdminHandler) GetOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	skip := (page - 1) * limit

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	ordersColl := database.GetDB().Collection("orders")
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := ordersColl.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var orders []models.Order
	cursor.All(context.Background(), &orders)

	total, _ := ordersColl.CountDocuments(context.Background(), filter)

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *AdminHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ordersColl := database.GetDB().Collection("orders")
	_, err = ordersColl.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{"$set": bson.M{
		"status":         req.Status,
		"adminUpdatedAt": time.Now(),
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated"})
}

func (h *AdminHandler) GetDisputes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	skip := (page - 1) * limit

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	reportsColl := database.GetDB().Collection("reports")
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := reportsColl.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reports []models.Report
	cursor.All(context.Background(), &reports)

	total, _ := reportsColl.CountDocuments(context.Background(), filter)

	c.JSON(http.StatusOK, gin.H{
		"disputes": reports,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *AdminHandler) ResolveDispute(c *gin.Context) {
	disputeID := c.Param("id")
	disputeObjID, err := primitive.ObjectIDFromHex(disputeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dispute ID"})
		return
	}

	var req struct {
		Resolution string `json:"resolution" binding:"required"`
		Action     string `json:"action"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reportsColl := database.GetDB().Collection("reports")
	_, err = reportsColl.UpdateOne(context.Background(), bson.M{"_id": disputeObjID}, bson.M{"$set": bson.M{
		"status":     "resolved",
		"resolution": req.Resolution,
		"action":     req.Action,
		"resolvedAt": time.Now(),
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve dispute"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dispute resolved"})
}

func (h *AdminHandler) GetRevenueReport(c *gin.Context) {
	period := c.DefaultQuery("period", "monthly")

	var startDate time.Time
	now := time.Now()

	switch period {
	case "daily":
		startDate = now.AddDate(0, 0, -30)
	case "weekly":
		startDate = now.AddDate(0, -1, 0)
	case "monthly":
		startDate = now.AddDate(0, -12, 0)
	case "yearly":
		startDate = now.AddDate(-5, 0, 0)
	default:
		startDate = now.AddDate(0, -12, 0)
	}

	ordersColl := database.GetDB().Collection("orders")
	filter := bson.M{
		"createdAt": bson.M{"$gte": startDate},
		"status":    "completed",
	}

	cursor, err := ordersColl.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var orders []models.Order
	cursor.All(context.Background(), &orders)

	var totalRevenue float64
	var totalOrders int64
	byCategory := make(map[string]float64)
	byDay := make(map[string]float64)

	for _, o := range orders {
		totalRevenue += o.TotalAmount
		totalOrders++
		dayKey := o.CreatedAt.Format("2006-01-02")
		byDay[dayKey] += o.TotalAmount
	}

	c.JSON(http.StatusOK, gin.H{
		"totalRevenue": totalRevenue,
		"totalOrders":  totalOrders,
		"byCategory":   byCategory,
		"byDay":        byDay,
		"period":       period,
	})
}
