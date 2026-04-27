package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FinanceChat struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Role      string             `bson:"role" json:"role"` // "user" or "assistant"
	Content   string             `bson:"content" json:"content"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
