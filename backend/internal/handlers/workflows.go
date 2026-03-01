package handlers

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
)

type WorkflowHandler struct{}

func NewWorkflowHandler() *WorkflowHandler {
	return &WorkflowHandler{}
}

func (h *WorkflowHandler) GetWorkflows(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	workflowsCollection := database.GetDB().Collection("workflows")
	cursor, err := workflowsCollection.Find(context.Background(), bson.M{"seller": userObjID})
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var workflows []models.Workflow
	if err := cursor.All(context.Background(), &workflows); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	c.JSON(200, workflows)
}

func (h *WorkflowHandler) CreateWorkflow(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		Name       string                 `json:"name" binding:"required"`
		Type       string                 `json:"type" binding:"required"`
		WebhookURL string                 `json:"webhookUrl"`
		Config     map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	validTypes := map[string]bool{
		"order_confirmation": true,
		"inventory_alert":    true,
		"welcome_series":     true,
	}
	if !validTypes[req.Type] {
		c.JSON(400, gin.H{"message": "Invalid workflow type"})
		return
	}

	workflow := models.Workflow{
		Seller:     userObjID,
		Name:       req.Name,
		Type:       req.Type,
		WebhookURL: &req.WebhookURL,
		IsActive:   true,
		Config:     req.Config,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	workflowsCollection := database.GetDB().Collection("workflows")
	result, err := workflowsCollection.InsertOne(context.Background(), workflow)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to create workflow"})
		return
	}

	workflow.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(201, workflow)
}

func (h *WorkflowHandler) ToggleWorkflow(c *gin.Context) {
	userID := c.GetString("userID")
	workflowID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	workflowObjID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid workflow ID"})
		return
	}

	workflowsCollection := database.GetDB().Collection("workflows")
	var workflow models.Workflow
	err = workflowsCollection.FindOne(context.Background(), bson.M{
		"_id":    workflowObjID,
		"seller": userObjID,
	}).Decode(&workflow)
	if err != nil {
		c.JSON(404, gin.H{"message": "Workflow not found"})
		return
	}

	newStatus := !workflow.IsActive
	_, err = workflowsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": workflowObjID},
		bson.M{"$set": bson.M{"isActive": newStatus, "updatedAt": time.Now()}},
	)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to toggle workflow"})
		return
	}

	workflow.IsActive = newStatus
	c.JSON(200, workflow)
}

func (h *WorkflowHandler) DeleteWorkflow(c *gin.Context) {
	userID := c.GetString("userID")
	workflowID := c.Param("id")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	workflowObjID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid workflow ID"})
		return
	}

	workflowsCollection := database.GetDB().Collection("workflows")
	_, err = workflowsCollection.DeleteOne(context.Background(), bson.M{
		"_id":    workflowObjID,
		"seller": userObjID,
	})
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to delete workflow"})
		return
	}

	c.JSON(200, gin.H{"message": "Workflow deleted"})
}
