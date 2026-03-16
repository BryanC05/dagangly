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

type RecommendationHandler struct{}

func NewRecommendationHandler() *RecommendationHandler {
	return &RecommendationHandler{}
}

func (h *RecommendationHandler) GetRecommendations(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("users")
	var user models.User
	err = collection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	productsCollection := database.GetDB().Collection("products")

	var recommendations []models.Product

	if len(user.ViewHistory) > 0 {
		var viewedProductIDs []primitive.ObjectID
		for _, v := range user.ViewHistory {
			if v.ProductID != primitive.NilObjectID {
				viewedProductIDs = append(viewedProductIDs, v.ProductID)
			}
		}

		if len(viewedProductIDs) > 0 {
			var viewedProducts []models.Product
			cursor, _ := productsCollection.Find(context.Background(), bson.M{
				"_id": bson.M{"$in": viewedProductIDs},
			})
			if cursor != nil {
				cursor.All(context.Background(), &viewedProducts)
				cursor.Close(context.Background())
			}

			if len(viewedProducts) > 0 {
				var categoryCounts = make(map[string]int)
				for _, p := range viewedProducts {
					if p.Category != "" {
						categoryCounts[p.Category]++
					}
				}

				var topCategory string
				maxCount := 0
				for cat, count := range categoryCounts {
					if count > maxCount {
						maxCount = count
						topCategory = cat
					}
				}

				if topCategory != "" {
					opts := options.Find().
						SetSort(bson.D{{Key: "createdAt", Value: -1}}).
						SetLimit(20)
					cursor, _ := productsCollection.Find(context.Background(), bson.M{
						"category": topCategory,
						"isActive": true,
						"stock":    bson.M{"$gt": 0},
						"_id":      bson.M{"$nin": viewedProductIDs},
					}, opts)
					if cursor != nil {
						cursor.All(context.Background(), &recommendations)
						cursor.Close(context.Background())
					}
				}
			}
		}
	}

	if len(recommendations) < 10 {
		opts := options.Find().
			SetSort(bson.D{{Key: "rating", Value: -1}, {Key: "createdAt", Value: -1}}).
			SetLimit(20)

		var topRated []models.Product
		cursor, _ := productsCollection.Find(context.Background(), bson.M{
			"isActive": true,
			"stock":    bson.M{"$gt": 0},
		}, opts)
		if cursor != nil {
			cursor.All(context.Background(), &topRated)
			cursor.Close(context.Background())
		}

		seen := make(map[string]bool)
		for _, r := range recommendations {
			seen[r.ID.Hex()] = true
		}

		for _, p := range topRated {
			if !seen[p.ID.Hex()] {
				recommendations = append(recommendations, p)
				if len(recommendations) >= 20 {
					break
				}
			}
		}
	}

	if recommendations == nil {
		recommendations = []models.Product{}
	}

	productsCollection = database.GetDB().Collection("products")
	var enrichedRecommendations []models.Product
	for _, rec := range recommendations {
		var product models.Product
		err := productsCollection.FindOne(context.Background(), bson.M{"_id": rec.ID}).Decode(&product)
		if err == nil {
			enrichedRecommendations = append(enrichedRecommendations, product)
		}
	}

	if enrichedRecommendations == nil {
		enrichedRecommendations = []models.Product{}
	}

	c.JSON(http.StatusOK, gin.H{
		"recommendations": enrichedRecommendations,
		"basedOn":         "your browsing history",
	})
}

func (h *RecommendationHandler) GetTrendingProducts(c *gin.Context) {
	productsCollection := database.GetDB().Collection("products")

	filter := bson.M{
		"isActive": true,
		"stock":    bson.M{"$gt": 0},
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "rating", Value: -1}, {Key: "totalReviews", Value: -1}}).
		SetLimit(20)

	var products []models.Product
	cursor, _ := productsCollection.Find(context.Background(), filter, opts)
	if cursor != nil {
		cursor.All(context.Background(), &products)
		cursor.Close(context.Background())
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

func (h *RecommendationHandler) GetSimilarProducts(c *gin.Context) {
	productID := c.Param("id")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	productsCollection := database.GetDB().Collection("products")

	var currentProduct models.Product
	err = productsCollection.FindOne(context.Background(), bson.M{"_id": productObjID}).Decode(&currentProduct)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	filter := bson.M{
		"category": currentProduct.Category,
		"isActive": true,
		"stock":    bson.M{"$gt": 0},
		"_id":      bson.M{"$ne": productObjID},
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "rating", Value: -1}}).
		SetLimit(10)

	var products []models.Product
	cursor, _ := productsCollection.Find(context.Background(), filter, opts)
	if cursor != nil {
		cursor.All(context.Background(), &products)
		cursor.Close(context.Background())
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

func (h *RecommendationHandler) GetFrequentlyBoughtTogether(c *gin.Context) {
	productID := c.Param("id")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	productsCollection := database.GetDB().Collection("products")

	var currentProduct models.Product
	err = productsCollection.FindOne(context.Background(), bson.M{"_id": productObjID}).Decode(&currentProduct)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	filter := bson.M{
		"isActive": true,
		"stock":    bson.M{"$gt": 0},
		"_id":      bson.M{"$ne": productObjID},
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetLimit(10)

	var products []models.Product
	cursor, _ := productsCollection.Find(context.Background(), filter, opts)
	if cursor != nil {
		cursor.All(context.Background(), &products)
		cursor.Close(context.Background())
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

func (h *RecommendationHandler) RecordViewHistory(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		ProductID string `json:"productId" binding:"required"`
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

	collection := database.GetDB().Collection("users")

	viewEntry := models.ViewHistoryEntry{
		ProductID: productObjID,
		ViewedAt:  time.Now(),
	}

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		bson.M{
			"$push": bson.M{"viewHistory": viewEntry},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record view history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "View history recorded"})
}

func (h *RecommendationHandler) GetViewHistory(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("users")

	var user models.User
	err = collection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	viewHistory := user.ViewHistory
	if viewHistory == nil {
		viewHistory = []models.ViewHistoryEntry{}
	}

	var productIDs []primitive.ObjectID
	for _, v := range viewHistory {
		if v.ProductID != primitive.NilObjectID {
			productIDs = append(productIDs, v.ProductID)
		}
	}

	if len(productIDs) == 0 {
		c.JSON(http.StatusOK, []models.Product{})
		return
	}

	productsCollection := database.GetDB().Collection("products")
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	var products []models.Product
	cursor, _ := productsCollection.Find(context.Background(), bson.M{
		"_id": bson.M{"$in": productIDs},
	}, opts)
	if cursor != nil {
		cursor.All(context.Background(), &products)
		cursor.Close(context.Background())
	}

	if products == nil {
		products = []models.Product{}
	}

	c.JSON(http.StatusOK, products)
}

func (h *RecommendationHandler) ClearViewHistory(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("users")

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		bson.M{
			"$set": bson.M{
				"viewHistory": []models.ViewHistoryEntry{},
				"updatedAt":   time.Now(),
			},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear view history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "View history cleared"})
}
