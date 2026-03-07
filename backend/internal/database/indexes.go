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

	// Products collection indexes
	productsCollection := db.Collection("products")

	// Text index for product search (searches name, description, tags)
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "name", Value: "text"},
			{Key: "description", Value: "text"},
			{Key: "tags", Value: "text"},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products text index: %w", err)
	}

	// Index for seller field (used when fetching seller info for each product)
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "seller", Value: 1}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products seller index: %w", err)
	}

	// Index for businessId field (used when fetching business info for each product)
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "businessId", Value: 1}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products businessId index: %w", err)
	}

	// Compound index for isAvailable with createdAt (common query pattern)
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "isAvailable", Value: -1},
			{Key: "createdAt", Value: -1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products availability index: %w", err)
	}

	// Compound index for category with isAvailable
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "category", Value: 1},
			{Key: "isAvailable", Value: 1},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products category index: %w", err)
	}

	// Geospatial index for location-based queries
	_, err = productsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "location", Value: "2dsphere"}},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create products location index: %w", err)
	}

	// Forum threads collection indexes
	forumThreadsCollection := db.Collection("forumthreads")

	// Text index for forum thread search
	_, err = forumThreadsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "title", Value: "text"},
			{Key: "content", Value: "text"},
		},
		Options: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to create forumthreads text index: %w", err)
	}

	fmt.Println("✅ Database indexes created successfully")
	return nil
}
