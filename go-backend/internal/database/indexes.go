package database

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// SetupIndexes creates necessary indexes for the application
func SetupIndexes(db *mongo.Database) error {
	ctx := context.Background()

	// Drivers collection indexes
	driversCollection := db.Collection("drivers")

	// Index for finding drivers by userId
	_, err := driversCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "userId", Value: 1}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create drivers userId index: %w", err)
	}

	// Geospatial index for driver locations (for finding nearby drivers)
	_, err = driversCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "currentLocation", Value: "2dsphere"}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create drivers location index: %w", err)
	}

	// Compound index for active available drivers
	_, err = driversCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "isActive", Value: 1},
			{Key: "isAvailable", Value: 1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create drivers availability index: %w", err)
	}

	// Orders collection indexes
	ordersCollection := db.Collection("orders")

	// Index for finding orders by status and claimedBy (for available orders)
	_, err = ordersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "status", Value: 1},
			{Key: "claimedBy", Value: 1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create orders status index: %w", err)
	}

	// Geospatial index for delivery addresses
	_, err = ordersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "deliveryAddress.coordinates", Value: "2dsphere"}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create orders delivery location index: %w", err)
	}

	// Index for driver's active delivery
	_, err = ordersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "claimedBy", Value: 1},
			{Key: "status", Value: 1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create orders driver status index: %w", err)
	}

	// Driver earnings collection indexes
	earningsCollection := db.Collection("driver_earnings")

	// Index for finding earnings by driver
	_, err = earningsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "driverId", Value: 1},
			{Key: "createdAt", Value: -1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create earnings driver index: %w", err)
	}

	fmt.Println("✅ Database indexes created successfully")
	return nil
}
