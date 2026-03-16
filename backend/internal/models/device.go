package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DeviceToken struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	Platform   string             `bson:"platform" json:"platform"` // android, ios
	Token      string             `bson:"token" json:"token"`
	AppVersion string             `bson:"appVersion" json:"appVersion"`
	LastSeenAt time.Time          `bson:"lastSeenAt" json:"lastSeenAt"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}
