package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
	"msme-marketplace/internal/websocket"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type NotificationHandler struct{}

const notificationDBTimeout = 8 * time.Second

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{}
}

// GetNotifications returns the user's notifications (newest first, max 50)
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetLimit(50)

	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"userId": userObjID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer cursor.Close(ctx)

	var notifications []models.Notification
	if err := cursor.All(ctx, &notifications); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode notifications"})
		return
	}

	if notifications == nil {
		notifications = []models.Notification{}
	}

	c.JSON(http.StatusOK, notifications)
}

// GetUnreadCount returns the number of unread notifications
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	count, err := collection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"isRead": false,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkAsRead marks a single notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	notifID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	result, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": notifID, "userId": userObjID},
		bson.M{"$set": bson.M{"isRead": true}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllRead marks all of the user's notifications as read
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	_, err = collection.UpdateMany(
		ctx,
		bson.M{"userId": userObjID, "isRead": false},
		bson.M{"$set": bson.M{"isRead": true}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// Delete removes a single notification
func (h *NotificationHandler) Delete(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	notifID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	result, err := collection.DeleteOne(
		ctx,
		bson.M{"_id": notifID, "userId": userObjID},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

// DeleteAll removes all of the user's notifications
func (h *NotificationHandler) DeleteAll(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(c.Request.Context(), notificationDBTimeout)
	defer cancel()

	_, err = collection.DeleteMany(
		ctx,
		bson.M{"userId": userObjID},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications deleted"})
}

// SendTestNotification sends a test notification to the current user (for testing)
func (h *NotificationHandler) SendTestNotification(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("Queueing test notification for user: %s", userID)
	go CreateAndSend(userObjID, "system", "Test Notification 🔔",
		"This is a test notification! If you see this, notifications are working correctly.",
		map[string]interface{}{"test": true},
	)
	log.Printf("Test notification queued for user: %s", userID)

	c.JSON(http.StatusOK, gin.H{"message": "Test notification queued"})
}

// CreateAndSend creates a notification in DB and pushes it via WebSocket
func CreateAndSend(userID primitive.ObjectID, notifType, title, message string, data map[string]interface{}) {
	notification := models.Notification{
		UserID:    userID,
		Type:      notifType,
		Title:     title,
		Message:   message,
		Data:      data,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	collection := database.GetDB().Collection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), notificationDBTimeout)
	defer cancel()

	result, err := collection.InsertOne(ctx, notification)
	if err != nil {
		log.Printf("Failed to create notification: %v", err)
		return
	}

	insertedID, ok := result.InsertedID.(primitive.ObjectID)
	if !ok {
		log.Printf("Failed to parse inserted notification ID for user %s", userID.Hex())
		return
	}
	notification.ID = insertedID

	// Push via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		wsMsg := &websocket.Message{
			Type:   "notification",
			RoomID: "user-" + userID.Hex(),
			Data:   notification,
		}
		msgBytes, err := json.Marshal(wsMsg)
		if err == nil {
			hub.SendToUser(userID.Hex(), msgBytes)
		}
	}
}
