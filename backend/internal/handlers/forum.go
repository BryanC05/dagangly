package handlers

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
)

type ForumHandler struct{}

func NewForumHandler() *ForumHandler {
	return &ForumHandler{}
}

type ForumAuthor struct {
	ID           primitive.ObjectID `json:"_id"`
	Name         string             `json:"name"`
	BusinessName *string            `json:"businessName"`
}

type ForumThreadResponse struct {
	ID          primitive.ObjectID       `json:"_id"`
	Title       string                   `json:"title"`
	Content     string                   `json:"content"`
	Author      ForumAuthor              `json:"author"`
	Category    string                   `json:"category"`
	Attachments []models.ForumAttachment `json:"attachments"`
	ViewCount   int                      `json:"viewCount"`
	ReplyCount  int                      `json:"replyCount"`
	Likes       []primitive.ObjectID     `json:"likes"`
	IsPinned    bool                     `json:"isPinned"`
	IsLocked    bool                     `json:"isLocked"`
	CreatedAt   time.Time                `json:"createdAt"`
	UpdatedAt   time.Time                `json:"updatedAt"`
}

type ForumReplyResponse struct {
	ID          primitive.ObjectID       `json:"_id"`
	Content     string                   `json:"content"`
	Author      ForumAuthor              `json:"author"`
	Thread      primitive.ObjectID       `json:"thread"`
	Attachments []models.ForumAttachment `json:"attachments"`
	Likes       []primitive.ObjectID     `json:"likes"`
	IsEdited    bool                     `json:"isEdited"`
	CreatedAt   time.Time                `json:"createdAt"`
	UpdatedAt   time.Time                `json:"updatedAt"`
}

// Helper to bulk fetch authors and map them by ObjectID
func getAuthorsMap(ctx context.Context, userIDs []primitive.ObjectID) map[primitive.ObjectID]ForumAuthor {
	authorsMap := make(map[primitive.ObjectID]ForumAuthor)
	if len(userIDs) == 0 {
		return authorsMap
	}

	// Deduplicate IDs
	uniqueIDs := make([]primitive.ObjectID, 0, len(userIDs))
	seen := make(map[primitive.ObjectID]bool)
	for _, id := range userIDs {
		if !seen[id] {
			seen[id] = true
			uniqueIDs = append(uniqueIDs, id)
		}
	}

	usersColl := database.GetDB().Collection("users")
	cursor, err := usersColl.Find(ctx, bson.M{"_id": bson.M{"$in": uniqueIDs}})
	if err != nil {
		return authorsMap
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err == nil {
		for _, u := range users {
			authorsMap[u.ID] = ForumAuthor{
				ID:           u.ID,
				Name:         u.Name,
				BusinessName: u.BusinessName,
			}
		}
	}
	return authorsMap
}

func (h *ForumHandler) GetThreads(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	category := c.Query("category")
	search := c.Query("search")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}

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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")

	total, err := threadsCollection.CountDocuments(ctx, query)
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	findOptions := options.Find()
	findOptions.SetSort(bson.D{
		{Key: "isPinned", Value: -1},
		{Key: "createdAt", Value: -1},
	})
	findOptions.SetSkip(int64((page - 1) * limit))
	findOptions.SetLimit(int64(limit))

	cursor, err := threadsCollection.Find(ctx, query, findOptions)
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var threads []models.ForumThread
	if err := cursor.All(ctx, &threads); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	var authorIDs []primitive.ObjectID
	for _, t := range threads {
		authorIDs = append(authorIDs, t.Author)
	}

	authorsMap := getAuthorsMap(ctx, authorIDs)

	respThreads := make([]ForumThreadResponse, 0, len(threads))
	for _, t := range threads {
		author, exists := authorsMap[t.Author]
		if !exists {
			author = ForumAuthor{
				ID:   t.Author,
				Name: "Unknown User",
			}
		}
		respThreads = append(respThreads, ForumThreadResponse{
			ID:          t.ID,
			Title:       t.Title,
			Content:     t.Content,
			Author:      author,
			Category:    t.Category,
			Attachments: t.Attachments,
			ViewCount:   t.ViewCount,
			ReplyCount:  t.ReplyCount,
			Likes:       t.Likes,
			IsPinned:    t.IsPinned,
			IsLocked:    t.IsLocked,
			CreatedAt:   t.CreatedAt,
			UpdatedAt:   t.UpdatedAt,
		})
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(200, gin.H{
		"threads":     respThreads,
		"totalPages":  totalPages,
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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")

	var thread models.ForumThread
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	err = threadsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": threadObjID},
		bson.M{"$inc": bson.M{"viewCount": 1}},
		opts,
	).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	findOpts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}})
	cursor, err := repliesCollection.Find(ctx, bson.M{"thread": threadObjID}, findOpts)
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var replies []models.ForumReply
	if err := cursor.All(ctx, &replies); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	authorIDs := []primitive.ObjectID{thread.Author}
	for _, r := range replies {
		authorIDs = append(authorIDs, r.Author)
	}

	authorsMap := getAuthorsMap(ctx, authorIDs)

	threadAuthor, exists := authorsMap[thread.Author]
	if !exists {
		threadAuthor = ForumAuthor{
			ID:   thread.Author,
			Name: "Unknown User",
		}
	}

	respThread := ForumThreadResponse{
		ID:          thread.ID,
		Title:       thread.Title,
		Content:     thread.Content,
		Author:      threadAuthor,
		Category:    thread.Category,
		Attachments: thread.Attachments,
		ViewCount:   thread.ViewCount,
		ReplyCount:  thread.ReplyCount,
		Likes:       thread.Likes,
		IsPinned:    thread.IsPinned,
		IsLocked:    thread.IsLocked,
		CreatedAt:   thread.CreatedAt,
		UpdatedAt:   thread.UpdatedAt,
	}

	respReplies := make([]ForumReplyResponse, 0, len(replies))
	for _, r := range replies {
		replyAuthor, exists := authorsMap[r.Author]
		if !exists {
			replyAuthor = ForumAuthor{
				ID:   r.Author,
				Name: "Unknown User",
			}
		}
		respReplies = append(respReplies, ForumReplyResponse{
			ID:          r.ID,
			Content:     r.Content,
			Author:      replyAuthor,
			Thread:      r.Thread,
			Attachments: r.Attachments,
			Likes:       r.Likes,
			IsEdited:    r.IsEdited,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		})
	}

	c.JSON(200, gin.H{"thread": respThread, "replies": respReplies})
}

func (h *ForumHandler) CreateThread(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var title, content, category string
	var attachments []models.ForumAttachment

	contentType := c.ContentType()
	if strings.HasPrefix(contentType, "multipart/form-data") {
		title = c.PostForm("title")
		content = c.PostForm("content")
		category = c.DefaultPostForm("category", "general")

		form, err := c.MultipartForm()
		if err == nil {
			files := form.File["attachments"]
			for _, file := range files {
				if file.Size > 5*1024*1024 {
					c.JSON(400, gin.H{"message": "Each attachment must be less than 5MB"})
					return
				}

				forumDir := filepath.Join(".", "uploads", "forum")
				if err := os.MkdirAll(forumDir, 0755); err != nil {
					c.JSON(500, gin.H{"message": "Failed to create upload directory"})
					return
				}

				filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(file.Filename))
				filePath := filepath.Join(forumDir, filename)

				if err := c.SaveUploadedFile(file, filePath); err != nil {
					c.JSON(500, gin.H{"message": "Failed to save attachment"})
					return
				}

				attachments = append(attachments, models.ForumAttachment{
					URL:      "/uploads/forum/" + filename,
					Filename: file.Filename,
					Mimetype: file.Header.Get("Content-Type"),
				})
			}
		}
	} else {
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
		title = req.Title
		content = req.Content
		category = req.Category
		for _, url := range req.Attachments {
			attachments = append(attachments, models.ForumAttachment{
				URL: url,
			})
		}
	}

	if strings.TrimSpace(title) == "" || strings.TrimSpace(content) == "" {
		c.JSON(400, gin.H{"message": "Title and content are required"})
		return
	}

	if category == "" {
		category = "general"
	}

	now := time.Now()
	thread := models.ForumThread{
		ID:          primitive.NewObjectID(),
		Title:       title,
		Content:     content,
		Author:      userObjID,
		Category:    category,
		Attachments: attachments,
		ViewCount:   0,
		ReplyCount:  0,
		Likes:       []primitive.ObjectID{},
		IsPinned:    false,
		IsLocked:    false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")
	_, err = threadsCollection.InsertOne(ctx, thread)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create thread"})
		return
	}

	authorsMap := getAuthorsMap(ctx, []primitive.ObjectID{userObjID})
	author, exists := authorsMap[userObjID]
	if !exists {
		usersColl := database.GetDB().Collection("users")
		var u models.User
		if err := usersColl.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&u); err == nil {
			author = ForumAuthor{
				ID:           u.ID,
				Name:         u.Name,
				BusinessName: u.BusinessName,
			}
		} else {
			author = ForumAuthor{
				ID:   userObjID,
				Name: "Unknown User",
			}
		}
	}

	resp := ForumThreadResponse{
		ID:          thread.ID,
		Title:       thread.Title,
		Content:     thread.Content,
		Author:      author,
		Category:    thread.Category,
		Attachments: thread.Attachments,
		ViewCount:   thread.ViewCount,
		ReplyCount:  thread.ReplyCount,
		Likes:       thread.Likes,
		IsPinned:    thread.IsPinned,
		IsLocked:    thread.IsLocked,
		CreatedAt:   thread.CreatedAt,
		UpdatedAt:   thread.UpdatedAt,
	}

	c.JSON(201, resp)
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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(ctx, bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	if thread.IsLocked {
		c.JSON(403, gin.H{"message": "This thread is locked"})
		return
	}

	var content string
	var attachments []models.ForumAttachment

	contentType := c.ContentType()
	if strings.HasPrefix(contentType, "multipart/form-data") {
		content = c.PostForm("content")

		form, err := c.MultipartForm()
		if err == nil {
			files := form.File["attachments"]
			for _, file := range files {
				if file.Size > 5*1024*1024 {
					c.JSON(400, gin.H{"message": "Each attachment must be less than 5MB"})
					return
				}

				forumDir := filepath.Join(".", "uploads", "forum")
				if err := os.MkdirAll(forumDir, 0755); err != nil {
					c.JSON(500, gin.H{"message": "Failed to create upload directory"})
					return
				}

				filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(file.Filename))
				filePath := filepath.Join(forumDir, filename)

				if err := c.SaveUploadedFile(file, filePath); err != nil {
					c.JSON(500, gin.H{"message": "Failed to save attachment"})
					return
				}

				attachments = append(attachments, models.ForumAttachment{
					URL:      "/uploads/forum/" + filename,
					Filename: file.Filename,
					Mimetype: file.Header.Get("Content-Type"),
				})
			}
		}
	} else {
		var req struct {
			Content     string   `json:"content" binding:"required"`
			Attachments []string `json:"attachments"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"message": err.Error()})
			return
		}
		content = req.Content
		for _, url := range req.Attachments {
			attachments = append(attachments, models.ForumAttachment{
				URL: url,
			})
		}
	}

	if strings.TrimSpace(content) == "" {
		c.JSON(400, gin.H{"message": "Content is required"})
		return
	}

	now := time.Now()
	reply := models.ForumReply{
		ID:          primitive.NewObjectID(),
		Content:     content,
		Author:      userObjID,
		Thread:      threadObjID,
		Attachments: attachments,
		Likes:       []primitive.ObjectID{},
		IsEdited:    false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	_, err = repliesCollection.InsertOne(ctx, reply)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create reply"})
		return
	}

	threadsCollection.UpdateOne(ctx, bson.M{"_id": threadObjID}, bson.M{
		"$inc": bson.M{"replyCount": 1},
	})

	authorsMap := getAuthorsMap(ctx, []primitive.ObjectID{userObjID})
	author, exists := authorsMap[userObjID]
	if !exists {
		usersColl := database.GetDB().Collection("users")
		var u models.User
		if err := usersColl.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&u); err == nil {
			author = ForumAuthor{
				ID:           u.ID,
				Name:         u.Name,
				BusinessName: u.BusinessName,
			}
		} else {
			author = ForumAuthor{
				ID:   userObjID,
				Name: "Unknown User",
			}
		}
	}

	resp := ForumReplyResponse{
		ID:          reply.ID,
		Content:     reply.Content,
		Author:      author,
		Thread:      reply.Thread,
		Attachments: reply.Attachments,
		Likes:       reply.Likes,
		IsEdited:    reply.IsEdited,
		CreatedAt:   reply.CreatedAt,
		UpdatedAt:   reply.UpdatedAt,
	}

	c.JSON(201, resp)
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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(ctx, bson.M{"_id": threadObjID}).Decode(&thread)
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

	_, err = threadsCollection.UpdateOne(ctx, bson.M{"_id": threadObjID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to update thread"})
		return
	}

	var updatedThread models.ForumThread
	threadsCollection.FindOne(ctx, bson.M{"_id": threadObjID}).Decode(&updatedThread)

	authorsMap := getAuthorsMap(ctx, []primitive.ObjectID{updatedThread.Author})
	author, exists := authorsMap[updatedThread.Author]
	if !exists {
		author = ForumAuthor{
			ID:   updatedThread.Author,
			Name: "Unknown User",
		}
	}

	resp := ForumThreadResponse{
		ID:          updatedThread.ID,
		Title:       updatedThread.Title,
		Content:     updatedThread.Content,
		Author:      author,
		Category:    updatedThread.Category,
		Attachments: updatedThread.Attachments,
		ViewCount:   updatedThread.ViewCount,
		ReplyCount:  updatedThread.ReplyCount,
		Likes:       updatedThread.Likes,
		IsPinned:    updatedThread.IsPinned,
		IsLocked:    updatedThread.IsLocked,
		CreatedAt:   updatedThread.CreatedAt,
		UpdatedAt:   updatedThread.UpdatedAt,
	}

	c.JSON(200, resp)
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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(ctx, bson.M{"_id": threadObjID}).Decode(&thread)
	if err != nil {
		c.JSON(404, gin.H{"message": "Thread not found"})
		return
	}

	if thread.Author != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized to delete this thread"})
		return
	}

	repliesCollection := database.GetDB().Collection("forumreplies")
	repliesCollection.DeleteMany(ctx, bson.M{"thread": threadObjID})
	threadsCollection.DeleteOne(ctx, bson.M{"_id": threadObjID})

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

	ctx := c.Request.Context()
	threadsCollection := database.GetDB().Collection("forumthreads")
	var thread models.ForumThread
	err = threadsCollection.FindOne(ctx, bson.M{"_id": threadObjID}).Decode(&thread)
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

	threadsCollection.UpdateOne(ctx, bson.M{"_id": threadObjID}, bson.M{
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

	ctx := c.Request.Context()
	repliesCollection := database.GetDB().Collection("forumreplies")
	var reply models.ForumReply
	err = repliesCollection.FindOne(ctx, bson.M{"_id": replyObjID}).Decode(&reply)
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

	repliesCollection.UpdateOne(ctx, bson.M{"_id": replyObjID}, bson.M{
		"$set": bson.M{"likes": reply.Likes},
	})

	c.JSON(200, gin.H{"likes": len(reply.Likes), "liked": liked})
}
