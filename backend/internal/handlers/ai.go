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
		aj, _ := json.MarshalIndent(req.Analytics, "", "  ")
		analyticsJSON = string(aj)
	}

	var productCalcJSON string
	if req.ProductCalculations != nil {
		pc, _ := json.MarshalIndent(req.ProductCalculations, "", "  ")
		productCalcJSON = string(pc)
	}

	var analyticsSection string
	if analyticsJSON != "" {
		analyticsSection = fmt.Sprintf(`
=== DATA DASHBOARD PENJUAL ===
%s

`, analyticsJSON)
	}

	var productCalcSection string
	if productCalcJSON != "" {
		productCalcSection = fmt.Sprintf(`
=== DATA KALKULASI LABA PRODUK ===
%s

`, productCalcJSON)
	}

	systemPrompt := fmt.Sprintf(`Anda adalah seorang konsultan keuangan AI dan analis bisnis ahli untuk penjual di marketplace MSME (UMKM).
Anda sedang berbicara langsung dengan penjualan untuk membantu mereka mengembangkan bisnisnya.
Jawablah dalam bahasa Indonesia yang baik dan benar (Bahasa Indonesia).
Analisis data yang diberikan dan jawab pertanyaan mereka dengan akurat, profesional, dan ringkas.
Gunakan formatasi (bullet points, teks tebal) untuk membuat respons mudah dibaca.
Jangan gunakan markdown headers (#), cukup teks tebal dan bullet points.

%s

%s

PENTING - Data yang diberikan adalah SEMUA data historis pendapatan dari awal:
- totalRevenue: total pendapatan SEMUA waktu
- recentDays/dailyRevenue: data pendapatan per hari untuk SEMUA hari yang ada
- orderCount: total pesanan SEMUA waktu

Anda dapat menghitung periode spesifik berdasarkan pertanyaan:
- "30 hari terakhir" = hitung dari tanggal terbaru ke belakang 30 hari
- "60 hari terakhir" = hitung dari tanggal terbaru ke belakang 60 hari
- "90 hari terakhir" = hitung dari tanggal terbaru ke belakang 90 hari
- "semua waktu" = gunakan semua data yang ada

Gunakan tanggal-tanggal dalam data untuk menghitung periode yang diminta pengguna.

Catatan Penting:
- Selalu jawab dalam bahasa Indonesia
- Jika ada angka, gunakan format Rupiah (Rp) dengan pemisah ribuan yang sesuai
- Berikan saran yang praktis dan actionable untuk membantu bisnis berkembang
- Fokus pada analisis keuntungan bersih (clean profit) dari setiap produk`, analyticsSection, productCalcSection)

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
