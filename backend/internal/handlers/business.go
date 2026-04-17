package handlers

import (
	"context"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
	"msme-marketplace/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type BusinessHandler struct {
	businessCollection *mongo.Collection
	userCollection     *mongo.Collection
	productCollection  *mongo.Collection
}

func NewBusinessHandler() *BusinessHandler {
	db := database.GetDB()
	return &BusinessHandler{
		businessCollection: db.Collection("businesses"),
		userCollection:     db.Collection("users"),
		productCollection:  db.Collection("products"),
	}
}

// buildBusinessResponse creates a BusinessResponse with resolved logo
func (h *BusinessHandler) buildBusinessResponse(business models.Business, userProfileImage *string) models.BusinessResponse {
	var logoPtr string
	if business.Logo != nil {
		logoPtr = *business.Logo
	}

	var profileImage string
	if userProfileImage != nil {
		profileImage = *userProfileImage
	}

	// Resolve the logo using the utility function
	logoInfo := utils.ResolveBusinessLogo(logoPtr, profileImage, business.Name)

	return models.BusinessResponse{
		ID:           business.ID.Hex(),
		Name:         business.Name,
		Description:  business.Description,
		Logo:         business.Logo,
		LogoInfo:     models.LogoInfo{URL: logoInfo.URL, Source: string(logoInfo.Source)},
		Email:        business.Email,
		Phone:        business.Phone,
		Website:      business.Website,
		BusinessType: business.BusinessType,
		Address:      business.Address,
		City:         business.City,
		State:        business.State,
		IsVerified:   business.IsVerified,
		IsActive:     business.IsActive,
		Instagram:    business.Instagram,
		Facebook:     business.Facebook,
		TikTok:       business.TikTok,
		CreatedAt:    business.CreatedAt,
	}
}

// GetMyBusiness retrieves the current user's business
func (h *BusinessHandler) GetMyBusiness(c *gin.Context) {
	userID := c.GetString("userID")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Get user to find business ID
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	// If user has no business, return empty response
	if user.BusinessID == nil {
		c.JSON(200, gin.H{"business": nil})
		return
	}

	// Get business details
	var business models.Business
	err = h.businessCollection.FindOne(context.Background(), bson.M{"_id": *user.BusinessID}).Decode(&business)
	if err != nil {
		c.JSON(404, gin.H{"message": "Business not found"})
		return
	}

	// Build response with resolved logo
	response := h.buildBusinessResponse(business, user.ProfileImage)
	c.JSON(200, gin.H{"business": response})
}

// CreateBusiness creates a new business for the current user
func (h *BusinessHandler) CreateBusiness(c *gin.Context) {
	userID := c.GetString("userID")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Check if user already has a business
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	if user.BusinessID != nil {
		c.JSON(400, gin.H{"message": "User already has a registered business"})
		return
	}

	// Parse request
	var req models.CreateBusinessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// Create business
	now := time.Now()
	business := models.Business{
		ID:           primitive.NewObjectID(),
		OwnerID:      objID,
		Name:         req.Name,
		Description:  req.Description,
		Email:        req.Email,
		Phone:        req.Phone,
		Website:      req.Website,
		BusinessType: req.BusinessType,
		Address:      req.Address,
		City:         req.City,
		State:        req.State,
		Pincode:      req.Pincode,
		Country:      req.Country,
		Instagram:    req.Instagram,
		Facebook:     req.Facebook,
		TikTok:       req.TikTok,
		IsVerified:   false,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Insert business
	_, err = h.businessCollection.InsertOne(context.Background(), business)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create business"})
		return
	}

	// Update user with business ID
	_, err = h.userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{
			"$set": bson.M{
				"businessId":   business.ID,
				"businessName": req.Name,
				"businessType": req.BusinessType,
				"updatedAt":    now,
			},
		},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update user"})
		return
	}

	// Build response with resolved logo (will use profile image or generate monogram)
	response := h.buildBusinessResponse(business, user.ProfileImage)

	c.JSON(201, gin.H{
		"message":  "Business created successfully",
		"business": response,
	})
}

// UpdateBusiness updates the current user's business
func (h *BusinessHandler) UpdateBusiness(c *gin.Context) {
	userID := c.GetString("userID")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Get user to find business ID
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	if user.BusinessID == nil {
		c.JSON(404, gin.H{"message": "No business found for this user"})
		return
	}

	// Parse request
	var req models.UpdateBusinessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// Build update
	update := bson.M{"updatedAt": time.Now()}

	if req.Name != nil {
		update["name"] = *req.Name
		// Also update user's business name
		h.userCollection.UpdateOne(
			context.Background(),
			bson.M{"_id": objID},
			bson.M{"$set": bson.M{"businessName": *req.Name}},
		)
	}
	if req.Description != nil {
		update["description"] = *req.Description
	}
	if req.Email != nil {
		update["email"] = *req.Email
	}
	if req.Phone != nil {
		update["phone"] = *req.Phone
	}
	if req.Website != nil {
		update["website"] = *req.Website
	}
	if req.BusinessType != nil {
		update["businessType"] = *req.BusinessType
		// Also update user's business type
		h.userCollection.UpdateOne(
			context.Background(),
			bson.M{"_id": objID},
			bson.M{"$set": bson.M{"businessType": *req.BusinessType}},
		)
	}
	if req.Address != nil {
		update["address"] = *req.Address
	}
	if req.City != nil {
		update["city"] = *req.City
	}
	if req.State != nil {
		update["state"] = *req.State
	}
	if req.Pincode != nil {
		update["pincode"] = *req.Pincode
	}
	if req.Country != nil {
		update["country"] = *req.Country
	}
	if req.IsActive != nil {
		update["isActive"] = *req.IsActive
	}
	if req.Instagram != nil {
		update["instagram"] = *req.Instagram
	}
	if req.Facebook != nil {
		update["facebook"] = *req.Facebook
	}
	if req.TikTok != nil {
		update["tiktok"] = *req.TikTok
	}

	// Update business
	_, err = h.businessCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": *user.BusinessID},
		bson.M{"$set": update},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update business"})
		return
	}

	c.JSON(200, gin.H{"message": "Business updated successfully"})
}

// UpdateBusinessLogo updates the business logo
func (h *BusinessHandler) UpdateBusinessLogo(c *gin.Context) {
	userID := c.GetString("userID")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Get user to find business ID
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	if user.BusinessID == nil {
		c.JSON(404, gin.H{"message": "No business found for this user"})
		return
	}

	// Parse request
	var req models.UpdateBusinessLogoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// Update business logo
	_, err = h.businessCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": *user.BusinessID},
		bson.M{
			"$set": bson.M{
				"logo":      req.LogoURL,
				"updatedAt": time.Now(),
			},
		},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update logo"})
		return
	}

	c.JSON(200, gin.H{"message": "Logo updated successfully"})
}

// DeleteBusiness deletes the current user's business (with safeguards)
func (h *BusinessHandler) DeleteBusiness(c *gin.Context) {
	userID := c.GetString("userID")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	// Get user to find business ID
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	if user.BusinessID == nil {
		c.JSON(404, gin.H{"message": "No business found for this user"})
		return
	}

	// Check for active products
	count, err := h.productCollection.CountDocuments(
		context.Background(),
		bson.M{"businessId": *user.BusinessID},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to check products"})
		return
	}

	if count > 0 {
		c.JSON(400, gin.H{
			"message":       "Cannot delete business with active products",
			"productsCount": count,
		})
		return
	}

	// Delete business
	_, err = h.businessCollection.DeleteOne(context.Background(), bson.M{"_id": *user.BusinessID})
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to delete business"})
		return
	}

	// Remove business ID from user
	_, err = h.userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{
			"$set": bson.M{
				"businessId": nil,
				"updatedAt":  time.Now(),
			},
		},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update user"})
		return
	}

	c.JSON(200, gin.H{"message": "Business deleted successfully"})
}

// GetBusinessByID gets a business by ID (public endpoint)
func (h *BusinessHandler) GetBusinessByID(c *gin.Context) {
	businessID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(businessID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid business ID"})
		return
	}

	var business models.Business
	err = h.businessCollection.FindOne(
		context.Background(),
		bson.M{
			"_id":      objID,
			"isActive": true,
		},
	).Decode(&business)
	if err != nil {
		c.JSON(404, gin.H{"message": "Business not found"})
		return
	}

	// Get owner's profile image for logo resolution
	var user models.User
	err = h.userCollection.FindOne(context.Background(), bson.M{"_id": business.OwnerID}).Decode(&user)
	var profileImage *string
	if err == nil {
		profileImage = user.ProfileImage
	}

	// Build response with resolved logo
	response := h.buildBusinessResponse(business, profileImage)
	c.JSON(200, gin.H{"business": response})
}

// EnsureIndexes creates necessary indexes for business collection
func (h *BusinessHandler) EnsureIndexes() {
	// Skip index creation if database is not connected
	if h.businessCollection == nil {
		return
	}

	ctx := context.Background()

	// Index on ownerId for quick lookups
	h.businessCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "ownerId", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// Index on isActive and isVerified for filtering
	h.businessCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "isActive", Value: 1},
			{Key: "isVerified", Value: 1},
		},
	})

	// Index on businessId in products collection
	h.productCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "businessId", Value: 1}},
	})
}
