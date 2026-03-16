package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func Connect(uri, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = client.Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	DB = client.Database(dbName)

	indexCtx, indexCancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer indexCancel()
	createIndexes(indexCtx)

	fmt.Println("✅ Connected to MongoDB")
	return nil
}

func createIndexes(ctx context.Context) {
	users := DB.Collection("users")
	_, err := users.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "location", Value: "2dsphere"}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create 2dsphere index on users.location: %v\n", err)
	} else {
		fmt.Println("✅ Created 2dsphere index on users.location")
	}

	products := DB.Collection("products")
	_, err = products.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "location", Value: "2dsphere"}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create 2dsphere index on products.location: %v\n", err)
	} else {
		fmt.Println("✅ Created 2dsphere index on products.location")
	}

	_, err = products.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "seller", Value: 1}, {Key: "createdAt", Value: -1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on products.seller,createdAt: %v\n", err)
	} else {
		fmt.Println("✅ Created index on products.seller,createdAt")
	}

	notifications := DB.Collection("notifications")
	_, err = notifications.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on notifications.userId,createdAt: %v\n", err)
	} else {
		fmt.Println("✅ Created index on notifications.userId,createdAt")
	}

	_, err = notifications.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}, {Key: "isRead", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on notifications.userId,isRead: %v\n", err)
	} else {
		fmt.Println("✅ Created index on notifications.userId,isRead")
	}

	wishlists := DB.Collection("wishlists")
	_, err = wishlists.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}, {Key: "updatedAt", Value: -1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on wishlists.userId,updatedAt: %v\n", err)
	} else {
		fmt.Println("✅ Created index on wishlists.userId,updatedAt")
	}

	_, err = wishlists.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "shareLink", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on wishlists.shareLink: %v\n", err)
	} else {
		fmt.Println("✅ Created index on wishlists.shareLink")
	}

	devices := DB.Collection("device_tokens")
	_, err = devices.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on device_tokens.userId: %v\n", err)
	} else {
		fmt.Println("✅ Created index on device_tokens.userId")
	}

	_, err = devices.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "token", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on device_tokens.token: %v\n", err)
	} else {
		fmt.Println("✅ Created index on device_tokens.token")
	}

	cartAbandonments := DB.Collection("cart_abandonments")
	_, err = cartAbandonments.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}, {Key: "status", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on cart_abandonments.userId,status: %v\n", err)
	} else {
		fmt.Println("✅ Created index on cart_abandonments.userId,status")
	}

	wallets := DB.Collection("wallets")
	_, err = wallets.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "userId", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on wallets.userId: %v\n", err)
	} else {
		fmt.Println("✅ Created index on wallets.userId")
	}

	videoRooms := DB.Collection("video_rooms")
	_, err = videoRooms.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "hostId", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on video_rooms.hostId: %v\n", err)
	} else {
		fmt.Println("✅ Created index on video_rooms.hostId")
	}

	_, err = videoRooms.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "participantId", Value: 1}},
	})
	if err != nil {
		fmt.Printf("Warning: failed to create index on video_rooms.participantId: %v\n", err)
	} else {
		fmt.Println("✅ Created index on video_rooms.participantId")
	}
}

func GetDB() *mongo.Database {
	return DB
}
