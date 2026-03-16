package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PriceAlert struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID         primitive.ObjectID `bson:"userId" json:"userId"`
	ProductID      primitive.ObjectID `bson:"productId" json:"productId"`
	Product        *Product           `bson:"-" json:"product,omitempty"`
	TargetPrice    float64            `bson:"targetPrice" json:"targetPrice"`
	CurrentPrice   float64            `bson:"currentPrice" json:"currentPrice"`
	TriggeredPrice *float64           `bson:"triggeredPrice,omitempty" json:"triggeredPrice,omitempty"`
	IsActive       bool               `bson:"isActive" json:"isActive"`
	IsTriggered    bool               `bson:"isTriggered" json:"isTriggered"`
	TriggeredAt    *time.Time         `bson:"triggeredAt,omitempty" json:"triggeredAt,omitempty"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}
