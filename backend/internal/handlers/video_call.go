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

type VideoCallHandler struct{}

func NewVideoCallHandler() *VideoCallHandler {
	return &VideoCallHandler{}
}

func (h *VideoCallHandler) CreateRoom(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		ParticipantID string `json:"participantId" binding:"required"`
		ScheduledTime string `json:"scheduledTime"`
		Duration      int    `json:"duration"` // minutes, default 30
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	participantObjID, err := primitive.ObjectIDFromHex(req.ParticipantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid participant ID"})
		return
	}

	duration := req.Duration
	if duration == 0 {
		duration = 30
	}

	roomID := primitive.NewObjectID().Hex()
	meetingURL := "https://meet.jit.si/Dagangly-" + roomID

	var scheduledAt *time.Time
	if req.ScheduledTime != "" {
		t, err := time.Parse(time.RFC3339, req.ScheduledTime)
		if err == nil {
			scheduledAt = &t
		}
	}

	room := models.VideoCallRoom{
		ID:            primitive.NewObjectID(),
		RoomID:        roomID,
		HostID:        userObjID,
		ParticipantID: participantObjID,
		MeetingURL:    meetingURL,
		Status:        "scheduled",
		Duration:      duration,
		ScheduledAt:   scheduledAt,
		CreatedAt:     time.Now(),
	}

	collection := database.GetDB().Collection("video_rooms")
	_, err = collection.InsertOne(context.Background(), room)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"room":       room,
		"meetingUrl": meetingURL,
		"roomId":     roomID,
	})
}

func (h *VideoCallHandler) GetRooms(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("video_rooms")
	filter := bson.M{
		"$or": []bson.M{
			{"hostId": userObjID},
			{"participantId": userObjID},
		},
	}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := collection.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var rooms []models.VideoCallRoom
	cursor.All(context.Background(), &rooms)

	c.JSON(http.StatusOK, rooms)
}

func (h *VideoCallHandler) GetRoom(c *gin.Context) {
	roomID := c.Param("roomId")

	collection := database.GetDB().Collection("video_rooms")
	var room models.VideoCallRoom
	err := collection.FindOne(context.Background(), bson.M{"roomId": roomID}).Decode(&room)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, room)
}

func (h *VideoCallHandler) UpdateRoomStatus(c *gin.Context) {
	roomID := c.Param("roomId")

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("video_rooms")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"roomId": roomID},
		bson.M{"$set": bson.M{"status": req.Status, "updatedAt": time.Now()}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room status updated"})
}

func (h *VideoCallHandler) EndRoom(c *gin.Context) {
	roomID := c.Param("roomId")

	collection := database.GetDB().Collection("video_rooms")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"roomId": roomID},
		bson.M{"$set": bson.M{
			"status":    "ended",
			"endedAt":   time.Now(),
			"updatedAt": time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room ended"})
}

func (h *VideoCallHandler) GetUpcomingCalls(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("video_rooms")
	filter := bson.M{
		"$or": []bson.M{
			{"hostId": userObjID},
			{"participantId": userObjID},
		},
		"status":      "scheduled",
		"scheduledAt": bson.M{"$gte": time.Now()},
	}
	opts := options.Find().SetSort(bson.D{{Key: "scheduledAt", Value: 1}})

	cursor, err := collection.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var rooms []models.VideoCallRoom
	cursor.All(context.Background(), &rooms)

	c.JSON(http.StatusOK, rooms)
}
