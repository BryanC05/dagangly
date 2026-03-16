package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Wallet struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty" json:"_id"`
	UserID       primitive.ObjectID  `bson:"userId" json:"userId"`
	Balance      float64             `bson:"balance" json:"balance"`
	Transactions []WalletTransaction `bson:"transactions" json:"transactions"`
	BankAccount  *BankAccount        `bson:"bankAccount,omitempty" json:"bankAccount,omitempty"`
	CreatedAt    time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time           `bson:"updatedAt" json:"updatedAt"`
}

type WalletTransaction struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Type          string             `bson:"type" json:"type"` // credit, debit
	Amount        float64            `bson:"amount" json:"amount"`
	Description   string             `bson:"description" json:"description"`
	ReferenceID   string             `bson:"referenceId,omitempty" json:"referenceId,omitempty"`
	BankName      string             `bson:"bankName,omitempty" json:"bankName,omitempty"`
	AccountNumber string             `bson:"accountNumber,omitempty" json:"accountNumber,omitempty"`
	Status        string             `bson:"status" json:"status"` // pending, completed, failed
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
}

type BankAccount struct {
	BankName      string `bson:"bankName" json:"bankName"`
	AccountNumber string `bson:"accountNumber" json:"accountNumber"`
	AccountHolder string `bson:"accountHolder" json:"accountHolder"`
}
