package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProductCalculation struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID        primitive.ObjectID `bson:"userId" json:"userId"`
	ProductName   string             `bson:"productName" json:"productName"`
	SellingPrice  float64            `bson:"sellingPrice" json:"sellingPrice"`
	Quantity      int                `bson:"quantity" json:"quantity"`
	Expenses      []ExpenseItem      `bson:"expenses" json:"expenses"`
	TotalRevenue  float64            `bson:"totalRevenue" json:"totalRevenue"`
	TotalCost     float64            `bson:"totalCost" json:"totalCost"`
	CleanProfit   float64            `bson:"cleanProfit" json:"cleanProfit"`
	ProfitMargin  float64            `bson:"profitMargin" json:"profitMargin"`
	CostPerUnit   float64            `bson:"costPerUnit" json:"costPerUnit"`
	ProfitPerUnit float64            `bson:"profitPerUnit" json:"profitPerUnit"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type ExpenseItem struct {
	ID     string  `bson:"id" json:"id"`
	Name   string  `bson:"name" json:"name"`
	Amount float64 `bson:"amount" json:"amount"`
}
