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

type WishlistHandler struct{}

func NewWishlistHandler() *WishlistHandler {
	return &WishlistHandler{}
}

func (h *WishlistHandler) GetWishlists(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")
	opts := options.Find().SetSort(bson.D{{Key: "updatedAt", Value: -1}})

	ctx, cancel := context.WithTimeout(c.Request.Context(), 8*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"userId": userObjID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlists"})
		return
	}
	defer cursor.Close(ctx)

	var wishlists []models.Wishlist
	if err := cursor.All(ctx, &wishlists); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode wishlists"})
		return
	}

	if wishlists == nil {
		wishlists = []models.Wishlist{}
	}

	c.JSON(http.StatusOK, wishlists)
}

func (h *WishlistHandler) GetWishlistByID(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	wishlistID := c.Param("id")
	wishlistObjID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wishlist ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	var wishlist models.Wishlist
	err = collection.FindOne(context.Background(), bson.M{
		"_id":    wishlistObjID,
		"userId": userObjID,
	}).Decode(&wishlist)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

func (h *WishlistHandler) GetPublicWishlist(c *gin.Context) {
	shareLink := c.Param("shareLink")
	if shareLink == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Share link required"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	var wishlist models.Wishlist
	err := collection.FindOne(context.Background(), bson.M{
		"shareLink": shareLink,
		"isPublic":  true,
	}).Decode(&wishlist)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found or not public"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

func (h *WishlistHandler) CreateWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Name     string `json:"name" binding:"required"`
		IsPublic bool   `json:"isPublic"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wishlist := models.Wishlist{
		UserID:    userObjID,
		Name:      req.Name,
		IsPublic:  req.IsPublic,
		ShareLink: generateShareLink(),
		Items:     []models.WishlistItem{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	collection := database.GetDB().Collection("wishlists")
	result, err := collection.InsertOne(context.Background(), wishlist)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wishlist"})
		return
	}

	wishlist.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, wishlist)
}

func (h *WishlistHandler) UpdateWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	wishlistID := c.Param("id")
	wishlistObjID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wishlist ID"})
		return
	}

	var req struct {
		Name     string `json:"name"`
		IsPublic *bool  `json:"isPublic"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if req.Name != "" {
		update["$set"].(bson.M)["name"] = req.Name
	}
	if req.IsPublic != nil {
		update["$set"].(bson.M)["isPublic"] = *req.IsPublic
	}

	result, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": wishlistObjID, "userId": userObjID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wishlist"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wishlist updated"})
}

func (h *WishlistHandler) DeleteWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	wishlistID := c.Param("id")
	wishlistObjID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wishlist ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	result, err := collection.DeleteOne(
		context.Background(),
		bson.M{"_id": wishlistObjID, "userId": userObjID},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete wishlist"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wishlist deleted"})
}

func (h *WishlistHandler) AddItemToWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	wishlistID := c.Param("id")
	wishlistObjID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wishlist ID"})
		return
	}

	var req struct {
		ProductID       string `json:"productId" binding:"required"`
		NotifyPriceDrop bool   `json:"notifyPriceDrop"`
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

	collection := database.GetDB().Collection("wishlists")

	var wishlist models.Wishlist
	err = collection.FindOne(context.Background(), bson.M{
		"_id":    wishlistObjID,
		"userId": userObjID,
	}).Decode(&wishlist)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	for _, item := range wishlist.Items {
		if item.ProductID == productObjID {
			c.JSON(http.StatusConflict, gin.H{"error": "Product already in wishlist"})
			return
		}
	}

	newItem := models.WishlistItem{
		ProductID:       productObjID,
		AddedAt:         time.Now(),
		NotifyPriceDrop: req.NotifyPriceDrop,
	}

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": wishlistObjID, "userId": userObjID},
		bson.M{
			"$push": bson.M{"items": newItem},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item added to wishlist", "item": newItem})
}

func (h *WishlistHandler) RemoveItemFromWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	wishlistID := c.Param("id")
	wishlistObjID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wishlist ID"})
		return
	}

	productID := c.Param("productId")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": wishlistObjID, "userId": userObjID},
		bson.M{
			"$pull": bson.M{"items": bson.M{"productId": productObjID}},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove item from wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed from wishlist"})
}

func (h *WishlistHandler) AddToDefaultWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		ProductID       string `json:"productId" binding:"required"`
		NotifyPriceDrop bool   `json:"notifyPriceDrop"`
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

	collection := database.GetDB().Collection("wishlists")

	var existingWishlist models.Wishlist
	err = collection.FindOne(context.Background(), bson.M{
		"userId": userObjID,
		"name":   "Favorites",
	}).Decode(&existingWishlist)

	if err != nil {
		wishlist := models.Wishlist{
			UserID:    userObjID,
			Name:      "Favorites",
			IsPublic:  false,
			ShareLink: generateShareLink(),
			Items: []models.WishlistItem{
				{
					ProductID:       productObjID,
					AddedAt:         time.Now(),
					NotifyPriceDrop: req.NotifyPriceDrop,
				},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		result, err := collection.InsertOne(context.Background(), wishlist)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wishlist"})
			return
		}

		wishlist.ID = result.InsertedID.(primitive.ObjectID)
		c.JSON(http.StatusCreated, gin.H{"message": "Added to new Favorites wishlist", "wishlist": wishlist})
		return
	}

	for _, item := range existingWishlist.Items {
		if item.ProductID == productObjID {
			c.JSON(http.StatusConflict, gin.H{"error": "Product already in wishlist"})
			return
		}
	}

	newItem := models.WishlistItem{
		ProductID:       productObjID,
		AddedAt:         time.Now(),
		NotifyPriceDrop: req.NotifyPriceDrop,
	}

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": existingWishlist.ID, "userId": userObjID},
		bson.M{
			"$push": bson.M{"items": newItem},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added to Favorites wishlist", "item": newItem})
}

func (h *WishlistHandler) RemoveFromDefaultWishlist(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	productID := c.Param("productId")
	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID, "name": "Favorites"},
		bson.M{
			"$pull": bson.M{"items": bson.M{"productId": productObjID}},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove item from wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed from Favorites"})
}

func (h *WishlistHandler) CheckProductInWishlists(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	productID := c.Query("productId")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID required"})
		return
	}

	productObjID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	collection := database.GetDB().Collection("wishlists")

	cursor, err := collection.Find(context.Background(), bson.M{
		"userId": userObjID,
		"items": bson.M{
			"$elemMatch": bson.M{"productId": productObjID},
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check wishlists"})
		return
	}
	defer cursor.Close(context.Background())

	var wishlists []models.Wishlist
	if err := cursor.All(context.Background(), &wishlists); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode wishlists"})
		return
	}

	wishlistIDs := make([]string, len(wishlists))
	for i, w := range wishlists {
		wishlistIDs[i] = w.ID.Hex()
	}

	c.JSON(http.StatusOK, gin.H{
		"inWishlists":   len(wishlists) > 0,
		"wishlistIDs":   wishlistIDs,
		"wishlistCount": len(wishlists),
	})
}

func generateShareLink() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}
