package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AIHandler struct{}

func NewAIHandler() *AIHandler {
	return &AIHandler{}
}

type GenerateDescRequest struct {
	Name     string `json:"name" binding:"required"`
	Keywords string `json:"keywords"`
}

type FinancialConsultantRequest struct {
	Query               string                   `json:"query" binding:"required"`
	Analytics           map[string]interface{}   `json:"analytics"`
	ProductCalculations []map[string]interface{} `json:"productCalculations"`
}

type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *AIHandler) GenerateDescription(c *gin.Context) {
	var req GenerateDescRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API key not configured"})
		return
	}

	prompt := fmt.Sprintf("You are an expert copywriter for an e-commerce MSME (Micro, Small, Medium Enterprise) marketplace. Write a catchy, professional, and SEO-friendly product description tailored for the Indonesian market for the product '%s'.", req.Name)
	if req.Keywords != "" {
		prompt += fmt.Sprintf(" Please include these keywords naturally: %s.", req.Keywords)
	}
	prompt += " Keep it concise, engaging, and format it nicely with emojis."

	groqReq := GroqRequest{
		Model: "llama-3.1-8b-instant", // Fast and free tier model on Groq
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: "You are a helpful e-commerce copywriter assistant.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonData, err := json.Marshal(groqReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	httpReq, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create HTTP request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call AI API"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		fmt.Printf("Groq API Error: %s\n", string(bodyBytes))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI provider refused the request. Please check API key/quota."})
		return
	}

	var groqResp GroqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	if len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response choice from AI"})
		return
	}

	generatedText := strings.TrimSpace(groqResp.Choices[0].Message.Content)

	c.JSON(http.StatusOK, gin.H{
		"description": generatedText,
	})
}

func (h *AIHandler) FinancialConsultant(c *gin.Context) {
	var req FinancialConsultantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API key not configured"})
		return
	}

	var analyticsJSON string
	if req.Analytics != nil {
		// Only send essential fields to reduce token count
		type SimpleAnalytics struct {
			TotalRevenue float64 `json:"totalRevenue"`
			TotalOrders  int     `json:"orderCount"`
		}
		sa := SimpleAnalytics{}
		if v, ok := req.Analytics["totalRevenue"].(float64); ok {
			sa.TotalRevenue = v
		}
		if v, ok := req.Analytics["totalSales"].(float64); ok {
			sa.TotalRevenue = v
		}
		if v, ok := req.Analytics["orderCount"].(float64); ok {
			sa.TotalOrders = int(v)
		} else if v, ok := req.Analytics["orderCount"].(int); ok {
			sa.TotalOrders = v
		}
		aj, _ := json.MarshalIndent(sa, "", "  ")
		analyticsJSON = string(aj)
	}

	var productCalcJSON string
	if req.ProductCalculations != nil && len(req.ProductCalculations) > 0 {
		// Limit to first 10 products with essential fields only to reduce token count
		type SimpleProduct struct {
			Name         string  `json:"name"`
			Price        float64 `json:"price"`
			Cost         float64 `json:"cost"`
			Revenue      float64 `json:"revenue"`
			Profit       float64 `json:"profit"`
			ProfitMargin float64 `json:"profitMargin"`
			Orders       int     `json:"orders"`
		}
		simpleProds := make([]SimpleProduct, 0)
		for i, p := range req.ProductCalculations {
			if i >= 10 {
				break
			}
			sp := SimpleProduct{}
			if v, ok := p["name"].(string); ok {
				sp.Name = v
			}
			if v, ok := p["price"].(float64); ok {
				sp.Price = v
			} else if v, ok := p["price"].(int); ok {
				sp.Price = float64(v)
			}
			if v, ok := p["cost"].(float64); ok {
				sp.Cost = v
			} else if v, ok := p["cost"].(int); ok {
				sp.Cost = float64(v)
			}
			if v, ok := p["revenue"].(float64); ok {
				sp.Revenue = v
			} else if v, ok := p["revenue"].(int); ok {
				sp.Revenue = float64(v)
			}
			if v, ok := p["profit"].(float64); ok {
				sp.Profit = v
			} else if v, ok := p["profit"].(int); ok {
				sp.Profit = float64(v)
			}
			if v, ok := p["profitMargin"].(float64); ok {
				sp.ProfitMargin = v
			} else if v, ok := p["profitMargin"].(int); ok {
				sp.ProfitMargin = float64(v)
			}
			if v, ok := p["orders"].(float64); ok {
				sp.Orders = int(v)
			} else if v, ok := p["orders"].(int); ok {
				sp.Orders = v
			}
			simpleProds = append(simpleProds, sp)
		}
		pc, _ := json.MarshalIndent(simpleProds, "", "  ")
		productCalcJSON = string(pc)
	}

	var systemPrompt string
	if productCalcJSON != "" {
		systemPrompt = "Anda adalah konsultan keuangan AI untukUMKM. Jawab dalam Bahasa Indonesia dengan bullet points. Gunakan format Rupiah (Rp). Fokus pada profit bersih.\n\nData Bisnis:\n" + analyticsJSON + "\n\nProduk:\n" + productCalcJSON
	} else {
		systemPrompt = "Anda adalah konsultan keuangan AI untukUMKM. Jawab dalam Bahasa Indonesia dengan bullet points. Gunakan format Rupiah (Rp). Fokus pada profit bersih.\n\nData Bisnis:\n" + analyticsJSON
	}

	groqReq := GroqRequest{
		Model: "llama-3.3-70b-versatile", // Using smarter 70B model specifically for financial analysis
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role:    "user",
				Content: req.Query,
			},
		},
	}

	jsonData, err := json.Marshal(groqReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	httpReq, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create HTTP request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call AI API"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		fmt.Printf("Groq API Error: %s\n", string(bodyBytes))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI provider refused the request. Please check API key/quota."})
		return
	}

	var groqResp GroqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	if len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response choice from AI"})
		return
	}

	generatedText := strings.TrimSpace(groqResp.Choices[0].Message.Content)

	// Save chat to MongoDB
	userID := c.GetString("userID")
	if userID != "" {
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		collection := database.GetDB().Collection("finance_chats")
		now := time.Now()

		// Save user message
		_, _ = collection.InsertOne(context.Background(), models.FinanceChat{
			UserID:    userObjID,
			Role:      "user",
			Content:   req.Query,
			CreatedAt: now,
		})

		// Save AI response
		_, _ = collection.InsertOne(context.Background(), models.FinanceChat{
			UserID:    userObjID,
			Role:      "assistant",
			Content:   generatedText,
			CreatedAt: now,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"response": generatedText,
	})
}

// GetFinanceChats - get user's finance AI chat history
func (h *AIHandler) GetFinanceChats(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("finance_chats")
	cursor, err := collection.Find(context.Background(),
		bson.M{"userId": userObjID},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var chats []models.FinanceChat
	for cursor.Next(context.Background()) {
		var chat models.FinanceChat
		cursor.Decode(&chat)
		chats = append(chats, chat)
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

// ClearFinanceChats - clear user's finance AI chat history
func (h *AIHandler) ClearFinanceChats(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("finance_chats")
	_, err = collection.DeleteMany(context.Background(), bson.M{"userId": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat history cleared"})
}
