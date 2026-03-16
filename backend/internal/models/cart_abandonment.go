package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CartAbandonment struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID        primitive.ObjectID `bson:"userId" json:"userId"`
	Products      []AbandonedProduct `bson:"products" json:"products"`
	TotalAmount   float64            `bson:"totalAmount" json:"totalAmount"`
	Status        string             `bson:"status" json:"status"` // pending, recovered, expired
	Reminder1Sent bool               `bson:"reminder1Sent" json:"reminder1Sent"`
	Reminder2Sent bool               `bson:"reminder2Sent" json:"reminder2Sent"`
	Reminder1At   time.Time          `bson:"reminder1At" json:"reminder1At"`
	Reminder2At   time.Time          `bson:"reminder2At" json:"reminder2At"`
	RecoveredAt   *time.Time         `bson:"recoveredAt,omitempty" json:"recoveredAt,omitempty"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type AbandonedProduct struct {
	ProductID string  `json:"productId"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}
