package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	godotenv.Load()

	mongoURL := os.Getenv("MONGODB_URL")
	if mongoURL == "" {
		log.Fatal("MONGODB_URL not set")
	}

	clientOpts := options.Client().ApplyURI(mongoURL)
	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Disconnect(context.Background())

	if err := client.Ping(context.Background(), nil); err != nil {
		log.Fatalf("Failed to ping: %v", err)
	}

	db := client.Database("dagangly")

	collections := []string{"product_calculations", "expenses", "invoices"}

	for _, colName := range collections {
		collection := db.Collection(colName)
		result, err := collection.DeleteMany(context.Background(), bson.M{})
		if err != nil {
			log.Printf("Error clearing %s: %v", colName, err)
			continue
		}
		log.Printf("Cleared %s: deleted %d documents", colName, result.DeletedCount)
	}

	fmt.Println("All finance collections cleared!")
}
