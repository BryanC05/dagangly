package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Driver represents a user who can deliver orders
type Driver struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID          primitive.ObjectID `bson:"userId" json:"userId"`
	IsActive        bool               `bson:"isActive" json:"isActive"`
	IsAvailable     bool               `bson:"isAvailable" json:"isAvailable"`
	CurrentLocation *DriverLocation    `bson:"currentLocation,omitempty" json:"currentLocation,omitempty"`
	VehicleType     string             `bson:"vehicleType" json:"vehicleType"`
	TotalDeliveries int                `bson:"totalDeliveries" json:"totalDeliveries"`
	TotalEarnings   float64            `bson:"totalEarnings" json:"totalEarnings"`
	Rating          float64            `bson:"rating" json:"rating"`
	RatingCount     int                `bson:"ratingCount" json:"ratingCount"`
	Phone           string             `bson:"phone" json:"phone"`
	PushToken       string             `bson:"pushToken,omitempty" json:"pushToken,omitempty"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// DriverLocation represents real-time location
type DriverLocation struct {
	Latitude  float64   `bson:"latitude" json:"latitude"`
	Longitude float64   `bson:"longitude" json:"longitude"`
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

// DriverEarnings represents a single earnings transaction
type DriverEarnings struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	DriverID  primitive.ObjectID `bson:"driverId" json:"driverId"`
	OrderID   primitive.ObjectID `bson:"orderId" json:"orderId"`
	Amount    float64            `bson:"amount" json:"amount"`
	Fee       float64            `bson:"fee" json:"fee"`
	NetAmount float64            `bson:"netAmount" json:"netAmount"`
	Type      string             `bson:"type" json:"type"`     // "delivery", "bonus", "adjustment"
	Status    string             `bson:"status" json:"status"` // "pending", "paid", "disputed"
	PaidAt    *time.Time         `bson:"paidAt,omitempty" json:"paidAt,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

// DeliveryConfig holds fee calculation constants
type DeliveryConfig struct {
	BaseFee     float64 `json:"baseFee"`     // Rp 8,000
	PerKmRate   float64 `json:"perKmRate"`   // Rp 2,000
	MinFee      float64 `json:"minFee"`      // Rp 10,000
	MaxFee      float64 `json:"maxFee"`      // Rp 50,000
	DriverShare float64 `json:"driverShare"` // 0.80 (80%)
}

// GetDefaultDeliveryConfig returns default fee configuration
func GetDefaultDeliveryConfig() DeliveryConfig {
	return DeliveryConfig{
		BaseFee:     8000,
		PerKmRate:   2000,
		MinFee:      10000,
		MaxFee:      50000,
		DriverShare: 0.80,
	}
}

// CalculateDeliveryFee calculates fee based on distance
func CalculateDeliveryFee(distanceKm float64) float64 {
	config := GetDefaultDeliveryConfig()

	fee := config.BaseFee + (distanceKm * config.PerKmRate)

	// Apply min/max bounds
	if fee < config.MinFee {
		return config.MinFee
	}
	if fee > config.MaxFee {
		return config.MaxFee
	}

	return fee
}

// CalculateDriverEarnings calculates driver's share
func CalculateDriverEarnings(deliveryFee float64) float64 {
	config := GetDefaultDeliveryConfig()
	return deliveryFee * config.DriverShare
}

// AvailableOrder represents an order available for pickup
type AvailableOrder struct {
	Order           Order   `json:"order"`
	DistanceToStore float64 `json:"distanceToStore"` // km from driver to store
	TotalDistance   float64 `json:"totalDistance"`   // km store to delivery
	DeliveryFee     float64 `json:"deliveryFee"`
	DriverEarnings  float64 `json:"driverEarnings"`
}

// DriverStats represents driver statistics
type DriverStats struct {
	TotalDeliveries int     `json:"totalDeliveries"`
	TotalEarnings   float64 `json:"totalEarnings"`
	Rating          float64 `json:"rating"`
	TodayEarnings   float64 `json:"todayEarnings"`
	WeekEarnings    float64 `json:"weekEarnings"`
	MonthEarnings   float64 `json:"monthEarnings"`
}

// DriverStatusUpdate represents a status update during delivery
type DriverStatusUpdate struct {
	Status   string `json:"status"` // "picked_up", "on_the_way", "arrived", "delivered"
	Notes    string `json:"notes"`
	Location *struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"location,omitempty"`
}
