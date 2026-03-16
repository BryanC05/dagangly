package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CartAbandonmentHandler struct{}

func NewCartAbandonmentHandler() *CartAbandonmentHandler {
	return &CartAbandonmentHandler{}
}

func (h *CartAbandonmentHandler) TrackCartAbandonment(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Products []struct {
			ProductID string  `json:"productId"`
			Quantity  int     `json:"quantity"`
			Price     float64 `json:"price"`
		} `json:"products"`
		TotalAmount float64 `json:"totalAmount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("cart_abandonments")

	existingCart := models.CartAbandonment{}
	err = collection.FindOne(context.Background(), bson.M{
		"userId": userObjID,
		"status": "pending",
	}).Decode(&existingCart)

	now := time.Now()
	reminder1 := now.Add(1 * time.Hour)
	reminder2 := now.Add(24 * time.Hour)

	if err == nil {
		collection.UpdateOne(context.Background(), bson.M{
			"_id": existingCart.ID,
		}, bson.M{
			"$set": bson.M{
				"products":      req.Products,
				"totalAmount":   req.TotalAmount,
				"updatedAt":     now,
				"reminder1Sent": false,
				"reminder2Sent": false,
				"reminder1At":   reminder1,
				"reminder2At":   reminder2,
			},
		})
	} else {
		var products []models.AbandonedProduct
		for _, p := range req.Products {
			products = append(products, models.AbandonedProduct{
				ProductID: p.ProductID,
				Quantity:  p.Quantity,
				Price:     p.Price,
			})
		}

		cart := models.CartAbandonment{
			UserID:        userObjID,
			Products:      products,
			TotalAmount:   req.TotalAmount,
			Status:        "pending",
			Reminder1Sent: false,
			Reminder2Sent: false,
			Reminder1At:   reminder1,
			Reminder2At:   reminder2,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		_, err = collection.InsertOne(context.Background(), cart)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track cart"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart tracked successfully"})
}

func (h *CartAbandonmentHandler) MarkCartRecovered(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("cart_abandonments")

	_, err = collection.UpdateOne(context.Background(), bson.M{
		"userId": userObjID,
		"status": "pending",
	}, bson.M{
		"$set": bson.M{
			"status":      "recovered",
			"recoveredAt": time.Now(),
			"updatedAt":   time.Now(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark cart as recovered"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart marked as recovered"})
}

func (h *CartAbandonmentHandler) GetAbandonedCarts(c *gin.Context) {
	collection := database.GetDB().Collection("cart_abandonments")

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(100)
	cursor, err := collection.Find(context.Background(), bson.M{
		"status": "pending",
	}, opts)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch carts"})
		return
	}
	defer cursor.Close(context.Background())

	var carts []models.CartAbandonment
	if err := cursor.All(context.Background(), &carts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode carts"})
		return
	}

	if carts == nil {
		carts = []models.CartAbandonment{}
	}

	c.JSON(http.StatusOK, carts)
}

func (h *CartAbandonmentHandler) ProcessReminders() {
	collection := database.GetDB().Collection("cart_abandonments")
	now := time.Now()

	cursor, err := collection.Find(context.Background(), bson.M{
		"status":        "pending",
		"reminder1Sent": false,
		"reminder1At":   bson.M{"$lte": now},
	})
	if err != nil {
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var cart models.CartAbandonment
		if err := cursor.Decode(&cart); err != nil {
			continue
		}

		usersCollection := database.GetDB().Collection("users")
		var user models.User
		usersCollection.FindOne(context.Background(), bson.M{"_id": cart.UserID}).Decode(&user)

		CreateAndSend(cart.UserID, "cart_abandonment",
			"You left something behind! 🛒",
			"Don't forget to complete your purchase. Your items are still waiting for you!",
			map[string]interface{}{"cartId": cart.ID.Hex(), "totalAmount": cart.TotalAmount})

		collection.UpdateOne(context.Background(), bson.M{"_id": cart.ID}, bson.M{
			"$set": bson.M{"reminder1Sent": true},
		})

		log.Printf("Sent first cart reminder to user %s", cart.UserID.Hex())
	}

	cursor2, err := collection.Find(context.Background(), bson.M{
		"status":        "pending",
		"reminder1Sent": true,
		"reminder2Sent": false,
		"reminder2At":   bson.M{"$lte": now},
	})
	if err != nil {
		return
	}
	defer cursor2.Close(context.Background())

	for cursor2.Next(context.Background()) {
		var cart models.CartAbandonment
		if err := cursor2.Decode(&cart); err != nil {
			continue
		}

		usersCollection := database.GetDB().Collection("users")
		var user models.User
		usersCollection.FindOne(context.Background(), bson.M{"_id": cart.UserID}).Decode(&user)

		CreateAndSend(cart.UserID, "cart_abandonment",
			"Last chance! Your cart is about to expire ⏰",
			"Your saved items will be available for a limited time. Complete your purchase now!",
			map[string]interface{}{"cartId": cart.ID.Hex(), "totalAmount": cart.TotalAmount})

		collection.UpdateOne(context.Background(), bson.M{"_id": cart.ID}, bson.M{
			"$set": bson.M{"reminder2Sent": true},
		})

		log.Printf("Sent second cart reminder to user %s", cart.UserID.Hex())
	}
}
