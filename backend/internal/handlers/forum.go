package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
)

type ForumHandler struct{}

func NewForumHandler() *ForumHandler {
	return &ForumHandler{}
}

func (h *ForumHandler) GetThreads(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	category := c.Query("category")
	search := c.Query("search")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	query := bson.M{}
	if category != "" && category != "all" {
		query["category"] = category
	}
	if search != "" {
		searchRegex := bson.M{
			"$regex":   search,
			"$options": "i",
		}
		query["$or"] = []bson.M{
			{"title": searchRegex},
			{"content": searchRegex},
		}
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	cursor, err := threadsCollection.Find(context.Background(), query)
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var threads []models.ForumThread
	if err := cursor.All(context.Background(), &threads); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	total, _ := threadsCollection.CountDocuments(context.Background(), query)

	c.JSON(200, gin.H{
		"threads":     threads,
		"totalPages":  (total + int64(limit) - 1) / int64(limit),
		"currentPage": page,
		"total":       total,
	})
}

func (h *ForumHandler) GetThread(c *gin.Context) {
	threadID := c.Param("id")
	threadObjID, err := primitive.ObjectIDFromHex(threadID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid thread ID"})
		return
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": threadObjID},
		bson.M{"$inc": bson.M{"viewCount": 1}},
	).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	cursor, err := repliesCollection.Find(context.Background(), bson.M{"thread": threadObjID})
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var replies []models.ForumReply
	if err := cursor.All(context.Background(), &replies); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"thread": thread, "replies": replies})
}

func (h *ForumHandler) CreateThread(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		Title       string   `json:"title" binding:"required"`
		Content     string   `json:"content" binding:"required"`
		Category    string   `json:"category"`
		Attachments []string `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	category := "general"
	if req.Category != "" {
		category = req.Category
	}

	var attachments []models.ForumAttachment
	for _, url := range req.Attachments {
		attachments = append(attachments, models.ForumAttachment{
			URL: url,
		})
	}

	thread := models.ForumThread{
		Title:       req.Title,
		Content:     req.Content,
		Author:      userObjID,
		Category:    category,
		Attachments: attachments,
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	result, err := threadsCollection.InsertOne(context.Background(), thread)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create thread"})
		return
	}

	thread.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(201, thread)
}

func (h *ForumHandler) CreateReply(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	threadObjID, err := primitive.ObjectIDFromHex(threadID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid thread ID"})
		return
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(context.Background(), bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	if thread.IsLocked {
		c.JSON(403, gin.H{"message": "This thread is locked"})
		return
	}

	var req struct {
		Content     string   `json:"content" binding:"required"`
		Attachments []string `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	var attachments []models.ForumAttachment
	for _, url := range req.Attachments {
		attachments = append(attachments, models.ForumAttachment{
			URL: url,
		})
	}

	reply := models.ForumReply{
		Content:     req.Content,
		Author:      userObjID,
		Thread:      threadObjID,
		Attachments: attachments,
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	result, err := repliesCollection.InsertOne(context.Background(), reply)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create reply"})
		return
	}

	reply.ID = result.InsertedID.(primitive.ObjectID)

	threadsCollection.UpdateOne(context.Background(), bson.M{"_id": threadObjID}, bson.M{
		"$inc": bson.M{"replyCount": 1},
	})

	c.JSON(201, reply)
}

func (h *ForumHandler) UpdateThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	threadObjID, err := primitive.ObjectIDFromHex(threadID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid thread ID"})
		return
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(context.Background(), bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	if thread.Author != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized to edit this thread"})
		return
	}

	var req struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		Category string `json:"category"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	update := bson.M{}
	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Content != "" {
		update["content"] = req.Content
	}
	if req.Category != "" {
		update["category"] = req.Category
	}
	update["updatedAt"] = time.Now()

	_, err = threadsCollection.UpdateOne(context.Background(), bson.M{"_id": threadObjID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update thread"})
		return
	}

	var updatedThread models.ForumThread
	threadsCollection.FindOne(context.Background(), bson.M{"_id": threadObjID}).Decode(&updatedThread)

	c.JSON(200, updatedThread)
}

func (h *ForumHandler) DeleteThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	threadObjID, err := primitive.ObjectIDFromHex(threadID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid thread ID"})
		return
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(context.Background(), bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	if thread.Author != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized to delete this thread"})
		return
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	repliesCollection.DeleteMany(context.Background(), bson.M{"thread": threadObjID})
	threadsCollection.DeleteOne(context.Background(), bson.M{"_id": threadObjID})

	c.JSON(200, gin.H{"message": "Thread deleted successfully"})
}

func (h *ForumHandler) LikeThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	threadObjID, err := primitive.ObjectIDFromHex(threadID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid thread ID"})
		return
	}

	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(context.Background(), bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	liked := false
	userIndex := -1
	for i, id := range thread.Likes {
		if id == userObjID {
			userIndex = i
			break
		}
	}

	if userIndex > -1 {
		thread.Likes = append(thread.Likes[:userIndex], thread.Likes[userIndex+1:]...)
	} else {
		thread.Likes = append(thread.Likes, userObjID)
		liked = true
	}

	threadsCollection.UpdateOne(context.Background(), bson.M{"_id": threadObjID}, bson.M{
		"$set": bson.M{"likes": thread.Likes},
	})

	c.JSON(200, gin.H{"likes": len(thread.Likes), "liked": liked})
}

func (h *ForumHandler) LikeReply(c *gin.Context) {
	userID := c.GetString("userID")
	replyID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	replyObjID, err := primitive.ObjectIDFromHex(replyID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid reply ID"})
		return
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	var reply models.ForumReply
	err = repliesCollection.FindOne(context.Background(), bson.M{"_id": replyObjID}).Decode(&reply)
	if err != nil {
		c.JSON(404, gin.H{"message": "Reply not found"})
		return
	}

	liked := false
	userIndex := -1
	for i, id := range reply.Likes {
		if id == userObjID {
			userIndex = i
			break
		}
	}

	if userIndex > -1 {
		reply.Likes = append(reply.Likes[:userIndex], reply.Likes[userIndex+1:]...)
	} else {
		reply.Likes = append(reply.Likes, userObjID)
		liked = true
	}

	repliesCollection.UpdateOne(context.Background(), bson.M{"_id": replyObjID}, bson.M{
		"$set": bson.M{"likes": reply.Likes},
	})

	c.JSON(200, gin.H{"likes": len(reply.Likes), "liked": liked})
}
