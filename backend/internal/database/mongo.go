package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func Connect(uri, dbName string) error {
	clientOptions := options.Client().ApplyURI(uri).SetConnectTimeout(5 * time.Second)
	client, err := mongo.NewClient(clientOptions)
	if err != nil {
		return fmt.Errorf("failed to create MongoDB client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	DB = client.Database(dbName)

	ctx, cancel = context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err = client.Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	// Setup comprehensive indexes
	if err := SetupIndexes(DB); err != nil {
		fmt.Printf("Warning: failed to setup database indexes: %v\n", err)
	} else {
		fmt.Println("✅ Database indexes initialized")
	}

	fmt.Println("✅ Connected to MongoDB")
	return nil
}

func GetDB() *mongo.Database {
	return DB
}
