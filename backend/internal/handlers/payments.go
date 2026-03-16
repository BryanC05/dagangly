package handlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"msme-marketplace/internal/config"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentHandler struct {
	cfg *config.Config
}

func NewPaymentHandler(cfg *config.Config) *PaymentHandler {
	return &PaymentHandler{cfg: cfg}
}

type MidtransTransactionRequest struct {
	PaymentType        string `json:"payment_type"`
	TransactionDetails struct {
		OrderID  string  `json:"order_id"`
		GrossAmt float64 `json:"gross_amount"`
	} `json:"transaction_details"`
	CustomerDetails struct {
		Email string `json:"email"`
		Phone string `json:"phone"`
		Name  string `json:"first_name"`
	} `json:"customer_details"`
	BankTransfer *BankTransferRequest   `json:"bank_transfer,omitempty"`
	CreditCard   *CreditCardRequest     `json:"credit_card,omitempty"`
	Gopay        *GopayRequest          `json:"gopay,omitempty"`
	Shopeepay    *ShopeepayRequest      `json:"shopeepay,omitempty"`
	CallbackURL  string                 `json:"callback_url,omitempty"`
	ReturnURL    string                 `json:"return_url,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

type BankTransferRequest struct {
	Bank     string `json:"bank,omitempty"`
	BankName string `json:"bank_name,omitempty"`
}

type CreditCardRequest struct {
	TokenID        string `json:"token_id,omitempty"`
	Authentication bool   `json:"authentication,omitempty"`
	Secure         bool   `json:"secure,omitempty"`
}

type GopayRequest struct {
	EnableCallback bool   `json:"enable_callback,omitempty"`
	CallbackURL    string `json:"callback_url,omitempty"`
}

type ShopeepayRequest struct {
	CallbackURL string `json:"callback_url,omitempty"`
}

type MidtransResponse struct {
	StatusCode        string     `json:"status_code"`
	StatusMessage     string     `json:"status_message"`
	TransactionID     string     `json:"transaction_id"`
	OrderID           string     `json:"order_id"`
	MerchantID        string     `json:"merchant_id"`
	TransactionTime   string     `json:"transaction_time"`
	TransactionStatus string     `json:"transaction_status"`
	PaymentType       string     `json:"payment_type"`
	PaymentCode       string     `json:"payment_code,omitempty"`
	VaNumbers         []VANumber `json:"va_numbers,omitempty"`
	GopayReference    string     `json:"gopay_reference,omitempty"`
	GopayOrderID      string     `json:"gopay_order_id,omitempty"`
	QrCode            string     `json:"qr_code,omitempty"`
	Actions           []Action   `json:"actions,omitempty"`
}

type VANumber struct {
	Bank     string `json:"bank"`
	VANumber string `json:"va_number"`
}

type Action struct {
	Name   string `json:"name"`
	Method string `json:"method"`
	URL    string `json:"url"`
}

func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		OrderID     string `json:"orderId" binding:"required"`
		PaymentType string `json:"paymentType" binding:"required"` // bank_transfer, credit_card, gopay, shopeepay
		BankName    string `json:"bankName"`                       // bni, bri, bca, mandiri
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	orderObjID, err := primitive.ObjectIDFromHex(req.OrderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.Buyer != userObjID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	if order.PaymentStatus == "paid" || order.PaymentStatus == "success" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order already paid"})
		return
	}

	usersCollection := database.GetDB().Collection("users")
	var user models.User
	usersCollection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&user)

	if h.cfg.MidtransServerKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment gateway not configured"})
		return
	}

	midtransReq := MidtransTransactionRequest{}
	midtransReq.PaymentType = req.PaymentType
	midtransReq.TransactionDetails.OrderID = order.ID.Hex()
	midtransReq.TransactionDetails.GrossAmt = order.TotalAmount + order.DeliveryFee

	if user.Email != "" {
		midtransReq.CustomerDetails.Email = user.Email
	}
	if user.Phone != "" {
		midtransReq.CustomerDetails.Phone = user.Phone
	}
	if user.Name != "" {
		midtransReq.CustomerDetails.Name = user.Name
	}

	switch req.PaymentType {
	case "bank_transfer":
		midtransReq.BankTransfer = &BankTransferRequest{
			Bank: req.BankName,
		}
		if req.BankName == "bca" {
			midtransReq.BankTransfer.BankName = "BCA"
		} else if req.BankName == "bni" {
			midtransReq.BankTransfer.BankName = "BNI"
		} else if req.BankName == "bri" {
			midtransReq.BankTransfer.BankName = "BRI"
		} else if req.BankName == "mandiri" {
			midtransReq.BankTransfer.BankName = "Mandiri"
		}
	case "credit_card":
		midtransReq.CreditCard = &CreditCardRequest{
			Secure: true,
		}
	case "gopay":
		midtransReq.Gopay = &GopayRequest{
			EnableCallback: true,
		}
	case "shopeepay":
		midtransReq.Shopeepay = &ShopeepayRequest{}
	}

	midtransReq.Metadata = map[string]interface{}{
		"orderId":  order.ID.Hex(),
		"buyerId":  userID,
		"sellerId": order.Seller.Hex(),
	}

	auth := base64.StdEncoding.EncodeToString([]byte(h.cfg.MidtransServerKey + ":"))

	midtransURL := "https://api.sandbox.midtrans.com/v2/charge"
	if h.cfg.MidtransIsProduction {
		midtransURL = "https://api.midtrans.com/v2/charge"
	}

	jsonReq, _ := json.Marshal(midtransReq)
	httpReq, _ := http.NewRequest("POST", midtransURL, bytes.NewBuffer(jsonReq))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Basic "+auth)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to payment gateway"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var midtransResp MidtransResponse
	json.Unmarshal(body, &midtransResp)

	if midtransResp.StatusCode != "200" && midtransResp.StatusCode != "201" {
		c.JSON(http.StatusBadRequest, gin.H{"error": midtransResp.StatusMessage})
		return
	}

	now := time.Now()
	paymentDetails := models.PaymentDetails{
		TransactionID: &midtransResp.TransactionID,
	}

	if len(midtransResp.VaNumbers) > 0 {
		va := midtransResp.VaNumbers[0]
		paymentDetails.VaNumber = &va.VANumber
		paymentDetails.BankName = &va.Bank
	}

	ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
		"$set": bson.M{
			"paymentStatus":  "pending",
			"paymentMethod":  req.PaymentType,
			"paymentDetails": paymentDetails,
			"updatedAt":      now,
		},
	})

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"transactionId":  midtransResp.TransactionID,
		"orderId":        midtransResp.OrderID,
		"paymentType":    midtransResp.PaymentType,
		"status":         midtransResp.TransactionStatus,
		"vaNumbers":      midtransResp.VaNumbers,
		"qrCode":         midtransResp.QrCode,
		"gopayReference": midtransResp.GopayReference,
		"actions":        midtransResp.Actions,
	})
}

func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	orderID := c.Param("orderId")
	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{
		"_id": orderObjID,
		"$or": []bson.M{{"buyer": userObjID}, {"seller": userObjID}},
	}).Decode(&order)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if h.cfg.MidtransServerKey == "" {
		c.JSON(http.StatusOK, gin.H{
			"orderId":        order.ID.Hex(),
			"paymentStatus":  order.PaymentStatus,
			"paymentMethod":  order.PaymentMethod,
			"paymentDetails": order.PaymentDetails,
		})
		return
	}

	transactionID := ""
	if order.PaymentDetails.TransactionID != nil {
		transactionID = *order.PaymentDetails.TransactionID
	}

	if transactionID == "" {
		c.JSON(http.StatusOK, gin.H{
			"orderId":        order.ID.Hex(),
			"paymentStatus":  order.PaymentStatus,
			"paymentMethod":  order.PaymentMethod,
			"paymentDetails": order.PaymentDetails,
		})
		return
	}

	auth := base64.StdEncoding.EncodeToString([]byte(h.cfg.MidtransServerKey + ":"))

	midtransURL := "https://api.sandbox.midtrans.com/v2/" + transactionID + "/status"
	if h.cfg.MidtransIsProduction {
		midtransURL = "https://api.midtrans.com/v2/" + transactionID + "/status"
	}

	httpReq, _ := http.NewRequest("GET", midtransURL, nil)
	httpReq.Header.Set("Authorization", "Basic "+auth)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"orderId":        order.ID.Hex(),
			"paymentStatus":  order.PaymentStatus,
			"paymentMethod":  order.PaymentMethod,
			"paymentDetails": order.PaymentDetails,
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var midtransResp MidtransResponse
	json.Unmarshal(body, &midtransResp)

	updateStatus := order.PaymentStatus

	if midtransResp.StatusCode == "200" || midtransResp.StatusCode == "201" {
		updateStatus = midtransResp.TransactionStatus

		if strings.Contains(updateStatus, "settlement") || strings.Contains(updateStatus, "success") {
			updateStatus = "paid"
			now := time.Now()
			order.PaymentDetails.PaidAt = &now
		}

		if updateStatus != order.PaymentStatus {
			ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
				"$set": bson.M{
					"paymentStatus": updateStatus,
					"updatedAt":     time.Now(),
				},
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":           order.ID.Hex(),
		"paymentStatus":     updateStatus,
		"paymentMethod":     order.PaymentMethod,
		"paymentDetails":    order.PaymentDetails,
		"transactionStatus": midtransResp.TransactionStatus,
	})
}

func (h *PaymentHandler) MidtransWebhook(c *gin.Context) {
	var webhookData struct {
		OrderID           string `json:"order_id"`
		TransactionID     string `json:"transaction_id"`
		TransactionStatus string `json:"transaction_status"`
		PaymentType       string `json:"payment_type"`
		StatusCode        string `json:"status_code"`
	}

	if err := c.ShouldBindJSON(&webhookData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook data"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	orderObjID, err := primitive.ObjectIDFromHex(webhookData.OrderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	paymentStatus := "pending"
	if strings.Contains(webhookData.TransactionStatus, "settlement") || strings.Contains(webhookData.TransactionStatus, "success") {
		paymentStatus = "paid"
		now := time.Now()
		order.PaymentDetails.PaidAt = &now
	} else if strings.Contains(webhookData.TransactionStatus, "pending") {
		paymentStatus = "pending"
	} else if strings.Contains(webhookData.TransactionStatus, "deny") || strings.Contains(webhookData.TransactionStatus, "cancel") || strings.Contains(webhookData.TransactionStatus, "expire") {
		paymentStatus = "failed"
	}

	transactionID := webhookData.TransactionID
	order.PaymentDetails.TransactionID = &transactionID

	ordersCollection.UpdateOne(context.Background(), bson.M{"_id": orderObjID}, bson.M{
		"$set": bson.M{
			"paymentStatus":  paymentStatus,
			"paymentDetails": order.PaymentDetails,
			"updatedAt":      time.Now(),
		},
	})

	if paymentStatus == "paid" {
		sellerObjID := order.Seller
		CreateAndSend(sellerObjID, "new_order",
			"New Payment Received!",
			fmt.Sprintf("Payment for order %s has been confirmed", order.ID.Hex()),
			map[string]interface{}{"orderId": order.ID.Hex()})
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
