package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Subscription struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID `bson:"userId" json:"userId"`
	TransactionID string             `bson:"transactionId" json:"transactionId"`
	PlanName      string             `bson:"planName" json:"planName"` // e.g., "Premium"
	Status        string             `bson:"status" json:"status"`     // "pending", "active", "expired", "failed"
	Amount        float64            `bson:"amount" json:"amount"`     // e.g., 10000 for Rp 10.000
	ValidUntil    time.Time          `bson:"validUntil" json:"validUntil"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}
