package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Seller struct {
	SellerID     string    `json:"sellerId"`
	SellerName   string    `json:"sellerName"`
	Email        string    `json:"email"`
	Category     string    `json:"category"`
	Products     []Product `json:"products"`
	Orders       []Order   `json:"orders"`
	Expenses     []Expense `json:"expenses"`
	TotalRevenue float64   `json:"totalRevenue"`
	TotalExpense float64   `json:"totalExpense"`
	AvgRating    float64   `json:"avgRating"`
}

type Product struct {
	Name    string         `json:"name"`
	Price   float64        `json:"price"`
	Cost    Cost           `json:"cost"`
	Metrics ProductMetrics `json:"metrics,omitempty"`
}

type ProductMetrics struct {
	OrdersCount  int     `json:"ordersCount"`
	UnitsSold    int     `json:"unitsSold"`
	Revenue      float64 `json:"revenue"`
	TotalCost    float64 `json:"totalCost"`
	CleanProfit  float64 `json:"cleanProfit"`
	ProfitMargin float64 `json:"profitMargin"`
}

type Cost struct {
	Material    float64 `json:"material"`
	Labor       float64 `json:"labor"`
	Shipping    float64 `json:"shipping"`
	PlatformFee float64 `json:"platformFee"`
	Other       float64 `json:"other"`
}

type Order struct {
	OrderID  string  `json:"orderId"`
	Product  string  `json:"product"`
	Quantity int     `json:"quantity"`
	Total    float64 `json:"total"`
	Status   string  `json:"status"`
	Customer string  `json:"customer"`
	Date     string  `json:"date"`
}

type Expense struct {
	ID          string  `json:"id"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
}

type MockData struct {
	Sellers []Seller `json:"sellers"`
}

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

	jsonFile, err := os.Open("../frontend/src/utils/mock-finance-data.json")
	if err != nil {
		log.Fatalf("Failed to open JSON: %v", err)
	}
	defer jsonFile.Close()

	var mockData MockData
	decoder := json.NewDecoder(jsonFile)
	if err := decoder.Decode(&mockData); err != nil {
		log.Fatalf("Failed to decode JSON: %v", err)
	}

	log.Printf("Seeding %d sellers...", len(mockData.Sellers))

	for _, seller := range mockData.Sellers {
		sellerBSON := bson.M{
			"_id":          seller.SellerID,
			"sellerName":   seller.SellerName,
			"email":        seller.Email,
			"category":     seller.Category,
			"totalRevenue": seller.TotalRevenue,
			"totalExpense": seller.TotalExpense,
			"avgRating":    seller.AvgRating,
			"createdAt":    time.Now(),
			"updatedAt":    time.Now(),
		}

		_, err = db.Collection("sellers").UpdateOne(context.Background(),
			bson.M{"_id": seller.SellerID},
			bson.M{"$set": sellerBSON},
			options.Update().SetUpsert(true))
		if err != nil {
			log.Printf("Error upserting seller %s: %v", seller.SellerID, err)
			continue
		}

		for idx, product := range seller.Products {
			platformFeeAmt := product.Price * (product.Cost.PlatformFee / 100)
			totalCost := product.Cost.Material + product.Cost.Labor + product.Cost.Shipping + platformFeeAmt + product.Cost.Other
			profitPerUnit := product.Price - totalCost

			productOrders := []Order{}
			for _, o := range seller.Orders {
				if o.Product == product.Name {
					productOrders = append(productOrders, o)
				}
			}

			var unitsSold int
			var revenue float64
			for _, o := range productOrders {
				unitsSold += o.Quantity
				revenue += product.Price * float64(o.Quantity)
			}
			totalCostAll := totalCost * float64(unitsSold)
			cleanProfit := revenue - totalCostAll
			profitMargin := 0.0
			if revenue > 0 {
				profitMargin = (cleanProfit / revenue) * 100
			}

			seller.Products[idx].Metrics = ProductMetrics{
				OrdersCount:  len(productOrders),
				UnitsSold:    unitsSold,
				Revenue:      revenue,
				TotalCost:    totalCostAll,
				CleanProfit:  cleanProfit,
				ProfitMargin: profitMargin,
			}

			productBSON := bson.M{
				"sellerId": seller.SellerID,
				"name":     product.Name,
				"price":    product.Price,
				"expenses": bson.M{
					"materials":   product.Cost.Material,
					"labor":       product.Cost.Labor,
					"packaging":   product.Cost.Shipping,
					"platformFee": platformFeeAmt,
					"other":       product.Cost.Other,
					"total":       totalCost,
				},
				"profitPerUnit": profitPerUnit,
				"marginPercent": (profitPerUnit / product.Price) * 100,
				"metrics": bson.M{
					"ordersCount":  len(productOrders),
					"unitsSold":    unitsSold,
					"revenue":      revenue,
					"totalCost":    totalCostAll,
					"cleanProfit":  cleanProfit,
					"profitMargin": profitMargin,
				},
				"createdAt": time.Now(),
			}

			_, err = db.Collection("products").UpdateOne(context.Background(),
				bson.M{"sellerId": seller.SellerID, "name": product.Name},
				bson.M{"$set": productBSON},
				options.Update().SetUpsert(true))
			if err != nil {
				log.Printf("Error upserting product %s: %v", product.Name, err)
			}
		}

		for _, order := range seller.Orders {
			orderBSON := bson.M{
				"sellerId":  seller.SellerID,
				"orderId":   order.OrderID,
				"product":   order.Product,
				"quantity":  order.Quantity,
				"total":     order.Total,
				"status":    order.Status,
				"customer":  order.Customer,
				"date":      order.Date,
				"createdAt": time.Now(),
			}

			_, err = db.Collection("orders").UpdateOne(context.Background(),
				bson.M{"orderId": order.OrderID},
				bson.M{"$set": orderBSON},
				options.Update().SetUpsert(true))
			if err != nil {
				log.Printf("Error upserting order %s: %v", order.OrderID, err)
			}
		}

		for _, expense := range seller.Expenses {
			expenseBSON := bson.M{
				"localId":     expense.ID,
				"sellerId":    seller.SellerID,
				"amount":      expense.Amount,
				"category":    expense.Category,
				"description": expense.Description,
				"date":        expense.Date,
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
			}

			_, err = db.Collection("expenses").UpdateOne(context.Background(),
				bson.M{"localId": expense.ID},
				bson.M{"$set": expenseBSON},
				options.Update().SetUpsert(true))
			if err != nil {
				log.Printf("Error upserting expense %s: %v", expense.ID, err)
			}
		}

		log.Printf("Seeded seller: %s (%d products, %d orders, %d expenses)",
			seller.SellerName, len(seller.Products), len(seller.Orders), len(seller.Expenses))
	}

	log.Println("✅ Mock finance data seeded successfully!")
}
