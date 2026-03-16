package handlers

import (
	"context"
	"net/http"
	"time"

	"msme-marketplace/internal/database"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type InstallmentHandler struct{}

func NewInstallmentHandler() *InstallmentHandler {
	return &InstallmentHandler{}
}

type InstallmentPlan struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	OrderID           primitive.ObjectID `bson:"orderId" json:"orderId"`
	UserID            primitive.ObjectID `bson:"userId" json:"userId"`
	TotalAmount       float64            `bson:"totalAmount" json:"totalAmount"`
	InstallmentAmount float64            `bson:"installmentAmount" json:"installmentAmount"`
	RemainingAmount   float64            `bson:"remainingAmount" json:"remainingAmount"`
	Tenure            int                `bson:"tenure" json:"tenure"` // months
	CurrentPeriod     int                `bson:"currentPeriod" json:"currentPeriod"`
	MonthlyPayment    float64            `bson:"monthlyPayment" json:"monthlyPayment"`
	InterestRate      float64            `bson:"interestRate" json:"interestRate"`
	Status            string             `bson:"status" json:"status"` // active, completed, defaulted
	NextPaymentDate   time.Time          `bson:"nextPaymentDate" json:"nextPaymentDate"`
	DueDate           time.Time          `bson:"dueDate" json:"dueDate"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type InstallmentPayment struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	InstallmentPlanID primitive.ObjectID `bson:"installmentPlanId" json:"installmentPlanId"`
	Period            int                `bson:"period" json:"period"`
	Amount            float64            `bson:"amount" json:"amount"`
	Principal         float64            `bson:"principal" json:"principal"`
	Interest          float64            `bson:"interest" json:"interest"`
	Status            string             `bson:"status" json:"status"` // pending, paid, late
	PaidAt            *time.Time         `bson:"paidAt,omitempty" json:"paidAt,omitempty"`
	DueDate           time.Time          `bson:"dueDate" json:"dueDate"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
}

func (h *InstallmentHandler) CalculateInstallment(c *gin.Context) {
	var req struct {
		Amount       float64 `json:"amount" binding:"required"`
		Tenure       int     `json:"tenure" binding:"required"` // months: 3, 6, 12
		InterestRate float64 `json:"interestRate"`              // annual rate, default 0
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.InterestRate == 0 {
		req.InterestRate = 0.12 // 12% annual default
	}

	monthlyRate := req.InterestRate / 12

	var monthlyPayment float64
	if monthlyRate > 0 {
		monthlyPayment = req.Amount * (monthlyRate * power(1+monthlyRate, float64(req.Tenure))) /
			(power(1+monthlyRate, float64(req.Tenure)) - 1)
	} else {
		monthlyPayment = req.Amount / float64(req.Tenure)
	}

	totalPayment := monthlyPayment * float64(req.Tenure)
	totalInterest := totalPayment - req.Amount

	installments := make([]map[string]interface{}, req.Tenure)
	remaining := req.Amount

	for i := 0; i < req.Tenure; i++ {
		interest := remaining * monthlyRate
		principal := monthlyPayment - interest
		remaining -= principal

		installments[i] = map[string]interface{}{
			"period":    i + 1,
			"amount":    monthlyPayment,
			"principal": principal,
			"interest":  interest,
			"remaining": remaining,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"amount":         req.Amount,
		"tenure":         req.Tenure,
		"interestRate":   req.InterestRate,
		"monthlyPayment": monthlyPayment,
		"totalPayment":   totalPayment,
		"totalInterest":  totalInterest,
		"installments":   installments,
	})
}

func power(base, exp float64) float64 {
	result := 1.0
	for i := 0; i < int(exp); i++ {
		result *= base
	}
	return result
}

func (h *InstallmentHandler) CreateInstallmentPlan(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		OrderID      string  `json:"orderId" binding:"required"`
		Amount       float64 `json:"amount" binding:"required"`
		Tenure       int     `json:"tenure" binding:"required"`
		InterestRate float64 `json:"interestRate"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orderObjID, err := primitive.ObjectIDFromHex(req.OrderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	if req.InterestRate == 0 {
		req.InterestRate = 0.12
	}

	monthlyRate := req.InterestRate / 12
	var monthlyPayment float64
	if monthlyRate > 0 {
		monthlyPayment = req.Amount * (monthlyRate * power(1+monthlyRate, float64(req.Tenure))) /
			(power(1+monthlyRate, float64(req.Tenure)) - 1)
	} else {
		monthlyPayment = req.Amount / float64(req.Tenure)
	}

	now := time.Now()
	nextPayment := now.AddDate(0, 1, 0)

	plan := InstallmentPlan{
		ID:                primitive.NewObjectID(),
		OrderID:           orderObjID,
		UserID:            userObjID,
		TotalAmount:       req.Amount,
		InstallmentAmount: req.Amount,
		RemainingAmount:   req.Amount,
		Tenure:            req.Tenure,
		CurrentPeriod:     0,
		MonthlyPayment:    monthlyPayment,
		InterestRate:      req.InterestRate,
		Status:            "active",
		NextPaymentDate:   nextPayment,
		DueDate:           nextPayment,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	collection := database.GetDB().Collection("installment_plans")
	_, err = collection.InsertOne(context.Background(), plan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create installment plan"})
		return
	}

	paymentsCollection := database.GetDB().Collection("installment_payments")
	for i := 0; i < req.Tenure; i++ {
		dueDate := now.AddDate(0, i+1, 0)
		interest := plan.RemainingAmount * monthlyRate
		principal := monthlyPayment - interest

		payment := InstallmentPayment{
			ID:                primitive.NewObjectID(),
			InstallmentPlanID: plan.ID,
			Period:            i + 1,
			Amount:            monthlyPayment,
			Principal:         principal,
			Interest:          interest,
			Status:            "pending",
			DueDate:           dueDate,
			CreatedAt:         now,
		}
		paymentsCollection.InsertOne(context.Background(), payment)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Installment plan created",
		"plan":    plan,
	})
}

func (h *InstallmentHandler) GetMyInstallments(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetDB().Collection("installment_plans")
	filter := bson.M{"userId": userObjID}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := collection.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var plans []InstallmentPlan
	cursor.All(context.Background(), &plans)

	var result []map[string]interface{}
	for _, plan := range plans {
		paymentsColl := database.GetDB().Collection("installment_payments")
		paymentsFilter := bson.M{"installmentPlanId": plan.ID}
		paymentsCursor, _ := paymentsColl.Find(context.Background(), paymentsFilter)
		var payments []InstallmentPayment
		paymentsCursor.All(context.Background(), &payments)

		result = append(result, map[string]interface{}{
			"plan":     plan,
			"payments": payments,
		})
	}

	c.JSON(http.StatusOK, result)
}

func (h *InstallmentHandler) GetInstallmentPlan(c *gin.Context) {
	planID := c.Param("planId")
	planObjID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	collection := database.GetDB().Collection("installment_plans")
	var plan InstallmentPlan
	err = collection.FindOne(context.Background(), bson.M{"_id": planObjID}).Decode(&plan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	paymentsColl := database.GetDB().Collection("installment_payments")
	paymentsFilter := bson.M{"installmentPlanId": planObjID}
	paymentsCursor, _ := paymentsColl.Find(context.Background(), paymentsFilter)
	var payments []InstallmentPayment
	paymentsCursor.All(context.Background(), &payments)

	c.JSON(http.StatusOK, gin.H{
		"plan":     plan,
		"payments": payments,
	})
}

func (h *InstallmentHandler) PayInstallment(c *gin.Context) {
	planID := c.Param("planId")
	planObjID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	collection := database.GetDB().Collection("installment_plans")
	var plan InstallmentPlan
	err = collection.FindOne(context.Background(), bson.M{"_id": planObjID}).Decode(&plan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	paymentsColl := database.GetDB().Collection("installment_payments")
	nextPeriod := plan.CurrentPeriod + 1
	err = paymentsColl.FindOneAndUpdate(
		context.Background(),
		bson.M{"installmentPlanId": planObjID, "period": nextPeriod},
		bson.M{"$set": bson.M{
			"status": "paid",
			"paidAt": time.Now(),
		}},
	).Decode(&struct{}{})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No pending payment found"})
		return
	}

	newCurrentPeriod := nextPeriod
	newRemaining := plan.RemainingAmount - plan.MonthlyPayment
	var newStatus string
	var nextPaymentDate time.Time

	if newCurrentPeriod >= plan.Tenure {
		newRemaining = 0
		newStatus = "completed"
	} else {
		nextPaymentDate = time.Now().AddDate(0, 1, 0)
		newStatus = "active"
	}

	collection.UpdateOne(
		context.Background(),
		bson.M{"_id": planObjID},
		bson.M{"$set": bson.M{
			"currentPeriod":   newCurrentPeriod,
			"remainingAmount": newRemaining,
			"status":          newStatus,
			"nextPaymentDate": nextPaymentDate,
			"updatedAt":       time.Now(),
		}},
	)

	c.JSON(http.StatusOK, gin.H{
		"message":         "Payment successful",
		"remainingAmount": newRemaining,
		"currentPeriod":   newCurrentPeriod,
		"status":          newStatus,
	})
}
