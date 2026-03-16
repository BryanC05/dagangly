package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VideoCallRoom struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	RoomID        string             `bson:"roomId" json:"roomId"`
	HostID        primitive.ObjectID `bson:"hostId" json:"hostId"`
	ParticipantID primitive.ObjectID `bson:"participantId" json:"participantId"`
	MeetingURL    string             `bson:"meetingUrl" json:"meetingUrl"`
	Status        string             `bson:"status" json:"status"`     // scheduled, active, ended, cancelled
	Duration      int                `bson:"duration" json:"duration"` // minutes
	ScheduledAt   *time.Time         `bson:"scheduledAt,omitempty" json:"scheduledAt,omitempty"`
	StartedAt     *time.Time         `bson:"startedAt,omitempty" json:"startedAt,omitempty"`
	EndedAt       *time.Time         `bson:"endedAt,omitempty" json:"endedAt,omitempty"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}
