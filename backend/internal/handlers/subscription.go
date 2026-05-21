package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	// Replace with your actual module path if different
	"msme-marketplace/backend/internal/models"
)

const (
	PremiumPlanName  = "Premium"
	PremiumPlanPrice = 10000.0             // Rp 10.000/month
	PremiumDuration  = 30 * 24 * time.Hour // 30 days
)

type SubscriptionHandler struct {
	DB *mongo.Database
}

func NewSubscriptionHandler(db *mongo.Database) *SubscriptionHandler {
	return &SubscriptionHandler{DB: db}
}

// GetStatus returns the current active subscription for a user
func (h *SubscriptionHandler) GetStatus(c *gin.Context) {
	userIDObj, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var sub models.Subscription
	filter := bson.M{
		"userId":     userIDObj.(primitive.ObjectID),
		"status":     "active",
		"validUntil": bson.M{"$gt": time.Now()},
	}

	err := h.DB.Collection("subscriptions").FindOne(context.TODO(), filter).Decode(&sub)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusOK, gin.H{"isPremium": false, "message": "No active premium subscription"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscription status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"isPremium":  true,
		"plan":       sub.PlanName,
		"validUntil": sub.ValidUntil,
	})
}

// CreateIntent creates a payment intent (e.g., via Midtrans) for upgrading to Premium
func (h *SubscriptionHandler) CreateIntent(c *gin.Context) {
	userIDObj, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDObj.(primitive.ObjectID)

	// Generate a unique transaction ID for the subscription, prefixed with SUB-
	transactionID := fmt.Sprintf("SUB-%s-%d", userID.Hex()[:6], time.Now().Unix())

	sub := models.Subscription{
		ID:            primitive.NewObjectID(),
		UserID:        userID,
		TransactionID: transactionID,
		PlanName:      PremiumPlanName,
		Status:        "pending",
		Amount:        PremiumPlanPrice,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_, err := h.DB.Collection("subscriptions").InsertOne(context.TODO(), sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription intent"})
		return
	}

	// TODO: Integrate Midtrans Snap API here using your existing Midtrans logic.
	// Example:
	// mockPaymentURL := midtransService.CreateTransaction(transactionID, PremiumPlanPrice)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Subscription intent created successfully",
		"transactionId": transactionID,
		"amount":        PremiumPlanPrice,
		"paymentUrl":    "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-token-123", // To be replaced with Midtrans Token
	})
}

// Webhook processes Midtrans payment notifications to activate the subscription
func (h *SubscriptionHandler) Webhook(c *gin.Context) {
	// Define expected Midtrans payload structure
	var payload struct {
		OrderID           string `json:"order_id"`
		TransactionStatus string `json:"transaction_status"`
		FraudStatus       string `json:"fraud_status"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// For subscriptions, we only care about success (settlement or capture)
	if payload.TransactionStatus == "settlement" || payload.TransactionStatus == "capture" {
		filter := bson.M{"transactionId": payload.OrderID}
		update := bson.M{
			"$set": bson.M{
				"status":     "active",
				"validUntil": time.Now().Add(PremiumDuration),
				"updatedAt":  time.Now(),
			},
		}

		// 1. Update the subscription record
		var sub models.Subscription
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		err := h.DB.Collection("subscriptions").FindOneAndUpdate(context.TODO(), filter, update, opts).Decode(&sub)

		if err == nil {
			// 2. Grant Premium privileges to the User
			userFilter := bson.M{"_id": sub.UserID}
			userUpdate := bson.M{"$set": bson.M{"isPremium": true, "premiumUntil": sub.ValidUntil}}
			h.DB.Collection("users").UpdateOne(context.TODO(), userFilter, userUpdate)
		}
	}

	// Midtrans expects a 200 OK
	c.Status(http.StatusOK)
}
