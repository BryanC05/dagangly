package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Wishlist struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Name      string             `bson:"name" json:"name"`
	IsPublic  bool               `bson:"isPublic" json:"isPublic"`
	ShareLink string             `bson:"shareLink,omitempty" json:"shareLink,omitempty"`
	Items     []WishlistItem     `bson:"items" json:"items"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type WishlistItem struct {
	ProductID       primitive.ObjectID `bson:"productId" json:"productId"`
	AddedAt         time.Time          `bson:"addedAt" json:"addedAt"`
	NotifyPriceDrop bool               `bson:"notifyPriceDrop" json:"notifyPriceDrop"`
}
