package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
	"msme-marketplace/internal/config"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
)

type AuthHandler struct {
	Config *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{Config: cfg}
}

func (h *AuthHandler) jwtSecret() string {
	if strings.TrimSpace(h.Config.JWTSecret) == "" {
		return "your-secret-key"
	}
	return h.Config.JWTSecret
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Name         string `json:"name" binding:"required"`
		Email        string `json:"email" binding:"required,email"`
		Password     string `json:"password" binding:"required,min=6"`
		Phone        string `json:"phone" binding:"required"`
		IsSeller     bool   `json:"isSeller"`
		BusinessName string `json:"businessName"`
		BusinessType string `json:"businessType"`
		Location     struct {
			Coordinates []float64 `json:"coordinates"`
			Address     string    `json:"address"`
			City        string    `json:"city"`
			State       string    `json:"state"`
			Pincode     string    `json:"pincode"`
		} `json:"location"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	collection := database.GetDB().Collection("users")

	var existing models.User
	err := collection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		c.JSON(400, gin.H{"message": "User already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to hash password"})
		return
	}

	location := models.Location{
		Type:        "Point",
		Coordinates: []float64{0, 0},
	}
	if len(req.Location.Coordinates) == 2 {
		location.Coordinates = req.Location.Coordinates
	}
	location.Address = req.Location.Address
	location.City = req.Location.City
	location.State = req.Location.State
	location.Pincode = req.Location.Pincode

	businessType := "none"
	if req.IsSeller {
		businessType = req.BusinessType
		if businessType == "" {
			businessType = "micro"
		}
	}

	user := models.User{
		Name:         req.Name,
		Email:        req.Email,
		Password:     string(hashedPassword),
		Phone:        req.Phone,
		IsSeller:     req.IsSeller,
		BusinessName: &req.BusinessName,
		BusinessType: businessType,
		Location:     location,
		LogoGenerationCount: models.LogoGenerationCount{
			Count:         0,
			LastResetDate: time.Now(),
		},
		ImageEnhancementCount: models.ImageEnhancementCount{
			Count:         0,
			LastResetDate: time.Now(),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result, err := collection.InsertOne(context.Background(), user)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create user"})
		return
	}

	user.ID = result.InsertedID.(primitive.ObjectID)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID.Hex(),
		"email":    user.Email,
		"isSeller": user.IsSeller,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(h.jwtSecret()))
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to generate authentication token"})
		return
	}

	c.JSON(201, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":                user.ID.Hex(),
			"name":              user.Name,
			"email":             user.Email,
			"phone":             user.Phone,
			"profileImage":      user.ProfileImage,
			"isSeller":          user.IsSeller,
			"automationEnabled": user.AutomationEnabled,
			"businessName":      user.BusinessName,
			"businessType":      user.BusinessType,
			"location":          user.Location,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request: " + err.Error()})
		return
	}

	collection := database.GetDB().Collection("users")

	var user models.User
	err := collection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		c.JSON(400, gin.H{"message": "User not found with email: " + req.Email})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(400, gin.H{"message": "Password does not match"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID.Hex(),
		"email":    user.Email,
		"isSeller": user.IsSeller,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte(h.jwtSecret()))
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to generate authentication token"})
		return
	}

	c.JSON(200, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":                user.ID.Hex(),
			"name":              user.Name,
			"email":             user.Email,
			"phone":             user.Phone,
			"profileImage":      user.ProfileImage,
			"isSeller":          user.IsSeller,
			"automationEnabled": user.AutomationEnabled,
			"businessName":      user.BusinessName,
			"businessType":      user.BusinessType,
			"location":          user.Location,
		},
	})
}

func (h *AuthHandler) SocialLogin(c *gin.Context) {
	var req struct {
		IDToken string `json:"idToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request: " + err.Error()})
		return
	}

	// Verify Firebase token
	token, err := database.VerifyIDToken(context.Background(), req.IDToken)
	if err != nil {
		c.JSON(401, gin.H{"message": "Invalid Firebase token: " + err.Error()})
		return
	}

	firebaseUID := token.UID
	email := ""
	if emailVal, ok := token.Claims["email"].(string); ok {
		email = emailVal
	}
	name := ""
	if nameVal, ok := token.Claims["name"].(string); ok {
		name = nameVal
	}
	picture := ""
	if picVal, ok := token.Claims["picture"].(string); ok {
		picture = picVal
	}

	collection := database.GetDB().Collection("users")

	var user models.User
	// Try to find by FirebaseUID first
	err = collection.FindOne(context.Background(), bson.M{"firebaseUid": firebaseUID}).Decode(&user)
	if err != nil {
		// Not found by UID, try by email
		err = collection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
		if err == nil {
			// Found by email, link FirebaseUID
			_, _ = collection.UpdateOne(
				context.Background(),
				bson.M{"_id": user.ID},
				bson.M{"$set": bson.M{"firebaseUid": firebaseUID, "updatedAt": time.Now()}},
			)
			user.FirebaseUID = firebaseUID
		} else {
			// Not found by email either, create new user
			user = models.User{
				FirebaseUID:  firebaseUID,
				Name:         name,
				Email:        email,
				ProfileImage: &picture,
				IsSeller:     false,
				BusinessType: "none",
				Location: models.Location{
					Type:        "Point",
					Coordinates: []float64{0, 0},
				},
				LogoGenerationCount: models.LogoGenerationCount{
					Count:         0,
					LastResetDate: time.Now(),
				},
				ImageEnhancementCount: models.ImageEnhancementCount{
					Count:         0,
					LastResetDate: time.Now(),
				},
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			result, err := collection.InsertOne(context.Background(), user)
			if err != nil {
				c.JSON(500, gin.H{"message": "Failed to create user"})
				return
			}
			user.ID = result.InsertedID.(primitive.ObjectID)
		}
	}

	// Generate our own JWT
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID.Hex(),
		"email":    user.Email,
		"isSeller": user.IsSeller,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	tokenString, err := jwtToken.SignedString([]byte(h.jwtSecret()))
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to generate authentication token"})
		return
	}

	c.JSON(200, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":                user.ID.Hex(),
			"name":              user.Name,
			"email":             user.Email,
			"phone":             user.Phone,
			"profileImage":      user.ProfileImage,
			"isSeller":          user.IsSeller,
			"automationEnabled": user.AutomationEnabled,
			"businessName":      user.BusinessName,
			"businessType":      user.BusinessType,
			"location":          user.Location,
		},
	})
}
