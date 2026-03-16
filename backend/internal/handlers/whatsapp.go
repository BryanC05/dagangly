package handlers

import (
	"context"
	"fmt"
	"net/http"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WhatsAppHandler struct{}

func NewWhatsAppHandler() *WhatsAppHandler {
	return &WhatsAppHandler{}
}

func (h *WhatsAppHandler) GenerateWhatsAppLink(c *gin.Context) {
	var req struct {
		Phone     string `json:"phone" binding:"required"`
		Message   string `json:"message"`
		ProductID string `json:"productId"`
		SellerID  string `json:"sellerId"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	phone := req.Phone
	if phone[0] == '0' {
		phone = "62" + phone[1:]
	} else if phone[0] != '6' {
		phone = "62" + phone
	}

	message := req.Message
	if message == "" && req.ProductID != "" {
		productsCollection := database.GetDB().Collection("products")
		productObjID, _ := primitive.ObjectIDFromHex(req.ProductID)
		var product models.Product
		productsCollection.FindOne(context.Background(), bson.M{"_id": productObjID}).Decode(&product)
		message = fmt.Sprintf("Hi, I'm interested in: %s - Rp %d", product.Name, int(product.Price))
	}

	whatsappURL := fmt.Sprintf("https://wa.me/%s?text=%s", phone, message)

	c.JSON(http.StatusOK, gin.H{
		"whatsappUrl": whatsappURL,
		"phone":       phone,
	})
}

func (h *WhatsAppHandler) GetSellerWhatsApp(c *gin.Context) {
	sellerID := c.Param("sellerId")
	sellerObjID, err := primitive.ObjectIDFromHex(sellerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid seller ID"})
		return
	}

	usersCollection := database.GetDB().Collection("users")
	var seller models.User
	err = usersCollection.FindOne(context.Background(), bson.M{"_id": sellerObjID}).Decode(&seller)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Seller not found"})
		return
	}

	if seller.Phone == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Seller has no WhatsApp number"})
		return
	}

	phone := seller.Phone
	if phone[0] == '0' {
		phone = "62" + phone[1:]
	} else if phone[0] != '6' {
		phone = "62" + phone
	}

	whatsappURL := fmt.Sprintf("https://wa.me/%s", phone)

	c.JSON(http.StatusOK, gin.H{
		"whatsappUrl": whatsappURL,
		"phone":       phone,
		"sellerId":    sellerID,
	})
}
