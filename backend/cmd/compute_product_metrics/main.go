package main

import (
	"context"
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
	client, _ := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURL))
	defer client.Disconnect(context.Background())
	db := client.Database("dagangly")

	log.Println("Computing product financial metrics...")

	pipeline := []bson.M{
		{
			"$group": bson.M{
				"_id":          "$sellerId",
				"totalRevenue": bson.M{"$sum": "$total"},
				"totalOrders":  bson.M{"$sum": 1},
			},
		},
	}

	cursor, _ := db.Collection("orders").Aggregate(context.Background(), pipeline)
	var results []bson.M
	cursor.All(context.Background(), &results)

	for _, r := range results {
		sellerId := r["_id"]
		totalRevenue := r["totalRevenue"].(float64)
		totalOrders := r["totalOrders"].(int32)
		log.Printf("Seller %v: revenue=%v, orders=%d", sellerId, totalRevenue, totalOrders)
	}

	log.Println("✅ Done!")
}
