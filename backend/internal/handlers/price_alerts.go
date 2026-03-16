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
)

type PriceAlertHandler struct{}

func NewPriceAlertHandler() *PriceAlertHandler {
	return &PriceAlertHandler{}
}

func (h *PriceAlertHandler) CreatePriceAlert(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		ProductID    string  `json:"productId" binding:"required"`
		TargetPrice  float64 `json:"targetPrice" binding:"required"`
		CurrentPrice float64 `json:"currentPrice" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productObjID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	collection := database.GetDB().Collection("price_alerts")

	existingAlert := models.PriceAlert{}
	err = collection.FindOne(context.Background(), bson.M{
		"userId":    userObjID,
		"productId": productObjID,
		"isActive":  true,
	}).Decode(&existingAlert)

	if err == nil {
		collection.UpdateOne(context.Background(), bson.M{"_id": existingAlert.ID}, bson.M{
			"$set": bson.M{
				"targetPrice":  req.TargetPrice,
				"currentPrice": req.CurrentPrice,
				"isTriggered":  false,
				"updatedAt":    time.Now(),
			},
		})
		c.JSON(http.StatusOK, gin.H{"message": "Price alert updated"})
		return
	}

	alert := models.PriceAlert{
		UserID:       userObjID,
		ProductID:    productObjID,
		TargetPrice:  req.TargetPrice,
		CurrentPrice: req.CurrentPrice,
		IsActive:     true,
		IsTriggered:  false,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err = collection.InsertOne(context.Background(), alert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price alert"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Price alert created"})
}

func (h *PriceAlertHandler) GetPriceAlerts(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("price_alerts")

	cursor, err := collection.Find(context.Background(), bson.M{
		"userId":   userObjID,
		"isActive": true,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch price alerts"})
		return
	}
	defer cursor.Close(context.Background())

	var alerts []models.PriceAlert
	if err := cursor.All(context.Background(), &alerts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode alerts"})
		return
	}

	if alerts == nil {
		alerts = []models.PriceAlert{}
	}

	productsCollection := database.GetDB().Collection("products")
	for i := range alerts {
		var product models.Product
		productsCollection.FindOne(context.Background(), bson.M{"_id": alerts[i].ProductID}).Decode(&product)
		alerts[i].Product = &product
	}

	c.JSON(http.StatusOK, alerts)
}

func (h *PriceAlertHandler) DeletePriceAlert(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	alertID := c.Param("id")
	alertObjID, err := primitive.ObjectIDFromHex(alertID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	collection := database.GetDB().Collection("price_alerts")

	_, err = collection.UpdateOne(context.Background(), bson.M{
		"_id":    alertObjID,
		"userId": userObjID,
	}, bson.M{
		"$set": bson.M{
			"isActive":  false,
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete price alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price alert deleted"})
}

func (h *PriceAlertHandler) CheckAndTriggerAlerts(productID primitive.ObjectID, newPrice float64) {
	collection := database.GetDB().Collection("price_alerts")

	cursor, err := collection.Find(context.Background(), bson.M{
		"productId":   productID,
		"isActive":    true,
		"isTriggered": false,
		"targetPrice": bson.M{"$gte": newPrice},
	})

	if err != nil {
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var alert models.PriceAlert
		if err := cursor.Decode(&alert); err != nil {
			continue
		}

		collection.UpdateOne(context.Background(), bson.M{"_id": alert.ID}, bson.M{
			"$set": bson.M{
				"isTriggered":    true,
				"triggeredAt":    time.Now(),
				"triggeredPrice": newPrice,
				"updatedAt":      time.Now(),
			},
		})

		CreateAndSend(alert.UserID, "price_drop",
			"Price Drop Alert! 🎉",
			"A product you're watching is now at your target price!",
			map[string]interface{}{
				"productId":      productID.Hex(),
				"targetPrice":    alert.TargetPrice,
				"triggeredPrice": newPrice,
			})
	}
}
