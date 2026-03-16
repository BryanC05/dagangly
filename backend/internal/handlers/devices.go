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

type DeviceHandler struct{}

func NewDeviceHandler() *DeviceHandler {
	return &DeviceHandler{}
}

func (h *DeviceHandler) RegisterDevice(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Platform   string `json:"platform" binding:"required"` // android, ios
		Token      string `json:"token" binding:"required"`
		AppVersion string `json:"appVersion"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("device_tokens")

	existingDevice := models.DeviceToken{}
	err = collection.FindOne(context.Background(), bson.M{
		"token": req.Token,
	}).Decode(&existingDevice)

	if err == nil {
		collection.UpdateOne(context.Background(), bson.M{
			"_id": existingDevice.ID,
		}, bson.M{
			"$set": bson.M{
				"userId":     userObjID,
				"platform":   req.Platform,
				"appVersion": req.AppVersion,
				"lastSeenAt": time.Now(),
			},
		})
	} else {
		device := models.DeviceToken{
			UserID:     userObjID,
			Platform:   req.Platform,
			Token:      req.Token,
			AppVersion: req.AppVersion,
			LastSeenAt: time.Now(),
			CreatedAt:  time.Now(),
		}
		_, err = collection.InsertOne(context.Background(), device)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register device"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device registered successfully"})
}

func (h *DeviceHandler) UnregisterDevice(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token required"})
		return
	}

	collection := database.GetDB().Collection("device_tokens")

	_, err = collection.DeleteOne(context.Background(), bson.M{
		"token":  token,
		"userId": userObjID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unregister device"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device unregistered successfully"})
}

func (h *DeviceHandler) GetRegisteredDevices(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("device_tokens")

	cursor, err := collection.Find(context.Background(), bson.M{
		"userId": userObjID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch devices"})
		return
	}
	defer cursor.Close(context.Background())

	var devices []models.DeviceToken
	if err := cursor.All(context.Background(), &devices); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode devices"})
		return
	}

	if devices == nil {
		devices = []models.DeviceToken{}
	}

	c.JSON(http.StatusOK, devices)
}

func (h *DeviceHandler) UpdatePushToken(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("device_tokens")

	_, err = collection.UpdateOne(context.Background(), bson.M{
		"userId": userObjID,
	}, bson.M{
		"$set": bson.M{
			"token":      req.Token,
			"lastSeenAt": time.Now(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update push token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Push token updated successfully"})
}
