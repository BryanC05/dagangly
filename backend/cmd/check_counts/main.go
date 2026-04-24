package main

import (
	"context"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"os"
)

func main() {
	godotenv.Load()
	client, _ := mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGODB_URL")))
	defer client.Disconnect(context.Background())
	db := client.Database("dagangly")

	// Use Count with empty filter
	sellers, _ := db.Collection("sellers").CountDocuments(context.Background(), bson.M{})
	products, _ := db.Collection("products").CountDocuments(context.Background(), bson.M{})
	orders, _ := db.Collection("orders").CountDocuments(context.Background(), bson.M{})
	expenses, _ := db.Collection("expenses").CountDocuments(context.Background(), bson.M{})

	log.Printf("sellers: %d", sellers)
	log.Printf("products: %d", products)
	log.Printf("orders: %d", orders)
	log.Printf("expenses: %d", expenses)
}
