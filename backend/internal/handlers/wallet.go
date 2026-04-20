package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WalletHandler struct{}

func NewWalletHandler() *WalletHandler {
	return &WalletHandler{}
}

func (h *WalletHandler) GetWallet(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("wallets")

	var wallet models.Wallet
	err = collection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&wallet)
	if err != nil {
		wallet = models.Wallet{
			UserID:       userObjID,
			Balance:      0,
			Transactions: []models.WalletTransaction{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		collection.InsertOne(context.Background(), wallet)
	}

	c.JSON(http.StatusOK, wallet)
}

func (h *WalletHandler) AddFunds(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Amount    float64 `json:"amount" binding:"required"`
		PaymentID string  `json:"paymentId"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	collection := database.GetDB().Collection("wallets")

	var wallet models.Wallet
	err = collection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&wallet)
	if err != nil {
		wallet = models.Wallet{
			UserID:       userObjID,
			Balance:      0,
			Transactions: []models.WalletTransaction{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
	}

	transaction := models.WalletTransaction{
		Type:        "credit",
		Amount:      req.Amount,
		Description: "Wallet top-up",
		ReferenceID: req.PaymentID,
		CreatedAt:   time.Now(),
	}

	wallet.Balance += req.Amount
	wallet.Transactions = append(wallet.Transactions, transaction)
	wallet.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$set": bson.M{
			"balance":      wallet.Balance,
			"transactions": wallet.Transactions,
			"updatedAt":    wallet.UpdatedAt,
		}},
	)

	if err != nil {
		collection.InsertOne(context.Background(), wallet)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Funds added successfully",
		"balance": wallet.Balance,
	})
}

func (h *WalletHandler) DeductFunds(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Amount      float64 `json:"amount" binding:"required"`
		Reference   string  `json:"reference" binding:"required"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("wallets")

	var wallet models.Wallet
	err = collection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&wallet)
	if err != nil || wallet.Balance < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	transaction := models.WalletTransaction{
		Type:        "debit",
		Amount:      req.Amount,
		Description: req.Description,
		ReferenceID: req.Reference,
		CreatedAt:   time.Now(),
	}

	wallet.Balance -= req.Amount
	wallet.Transactions = append(wallet.Transactions, transaction)
	wallet.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$set": bson.M{
			"balance":      wallet.Balance,
			"transactions": wallet.Transactions,
			"updatedAt":    wallet.UpdatedAt,
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct funds"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Funds deducted successfully",
		"balance": wallet.Balance,
	})
}

func (h *WalletHandler) GetTransactions(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("wallets")

	var wallet models.Wallet
	err = collection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&wallet)
	if err != nil {
		c.JSON(http.StatusOK, []models.WalletTransaction{})
		return
	}

	c.JSON(http.StatusOK, wallet.Transactions)
}

func (h *WalletHandler) TransferToBank(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Amount        float64 `json:"amount" binding:"required"`
		BankName      string  `json:"bankName" binding:"required"`
		AccountNumber string  `json:"accountNumber" binding:"required"`
		AccountHolder string  `json:"accountHolder" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("wallets")

	var wallet models.Wallet
	err = collection.FindOne(context.Background(), bson.M{"userId": userObjID}).Decode(&wallet)
	if err != nil || wallet.Balance < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	transaction := models.WalletTransaction{
		Type:          "debit",
		Amount:        req.Amount,
		Description:   fmt.Sprintf("Transfer to %s (%s)", req.BankName, req.AccountNumber),
		ReferenceID:   req.AccountNumber,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		CreatedAt:     time.Now(),
	}

	wallet.Balance -= req.Amount
	wallet.Transactions = append(wallet.Transactions, transaction)
	wallet.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$set": bson.M{
			"balance":      wallet.Balance,
			"transactions": wallet.Transactions,
			"updatedAt":    wallet.UpdatedAt,
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to transfer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Transfer initiated successfully",
		"balance":       wallet.Balance,
		"transactionId": transaction.ID,
	})
}

func (h *WalletHandler) UpdateBankAccount(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.BankAccount
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetDB().Collection("wallets")
	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$set": bson.M{
			"bankAccount": req,
			"updatedAt":   time.Now(),
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bank account updated successfully", "bankAccount": req})
}

func (h *WalletHandler) DeleteBankAccount(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("wallets")
	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"userId": userObjID},
		bson.M{"$unset": bson.M{"bankAccount": ""}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bank account deleted successfully"})
}
