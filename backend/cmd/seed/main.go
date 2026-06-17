package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// hashPassword creates a bcrypt hash
func hashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes)
}

func main() {
	godotenv.Load(".env")
	uri := os.Getenv("MONGODB_URL")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.NewClient(clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database("msme_marketplace")

	usersCol := db.Collection("users")
	productsCol := db.Collection("products")

	passwordHash := hashPassword("password123")

	fmt.Println("🌱 Starting basic data seed...")

	// ==========================================
	// 1. Create Sellers
	// ==========================================
	fmt.Println("👤 Creating seller accounts...")

	seller1ID := primitive.NewObjectID()
	seller2ID := primitive.NewObjectID()

	budiBusinessName := "Budi Electronics & Accessories"
	sitiBusinessName := "Dapur Bu Siti (Catering)"

	seller1 := bson.M{
		"_id":                 seller1ID,
		"name":                "Budi Santoso",
		"email":               "budi.seller@test.com",
		"password":            passwordHash,
		"phone":               "081234567890",
		"isSeller":            true,
		"businessName":        budiBusinessName,
		"businessType":        "individual",
		"businessAddress":     "Jl. Sudirman No. 45, Jakarta Pusat",
		"registrationStatus":  "approved",
		"isVerified":          true,
		"isMember":            true,
		"memberSince":         time.Now(),
		"memberExpiry":        time.Now().AddDate(1, 0, 0),
		"membershipStatus":    "active",
		"location": bson.M{
			"type":        "Point",
			"coordinates": []float64{106.8229, -6.1931}, // Jakarta Pusat
			"address":     "Jl. Sudirman No. 45",
			"city":        "Jakarta Pusat",
			"state":       "DKI Jakarta",
			"pincode":     "10220",
		},
		"rating":       4.8,
		"totalReviews": 24,
		"createdAt":    time.Now(),
		"updatedAt":    time.Now(),
	}

	seller2 := bson.M{
		"_id":                 seller2ID,
		"name":                "Siti Rahmawati",
		"email":               "siti.seller@test.com",
		"password":            passwordHash,
		"phone":               "081987654321",
		"isSeller":            true,
		"businessName":        sitiBusinessName,
		"businessType":        "individual",
		"businessAddress":     "Jl. Margonda Raya No. 10, Depok",
		"registrationStatus":  "approved",
		"isVerified":          true,
		"isMember":            true,
		"memberSince":         time.Now(),
		"memberExpiry":        time.Now().AddDate(1, 0, 0),
		"membershipStatus":    "active",
		"location": bson.M{
			"type":        "Point",
			"coordinates": []float64{106.8330, -6.3731}, // Depok
			"address":     "Jl. Margonda Raya No. 10",
			"city":        "Depok",
			"state":       "Jawa Barat",
			"pincode":     "16424",
		},
		"rating":       4.9,
		"totalReviews": 56,
		"createdAt":    time.Now(),
		"updatedAt":    time.Now(),
	}

	opts := options.Update().SetUpsert(true)
	usersCol.UpdateOne(ctx, bson.M{"email": "budi.seller@test.com"}, bson.M{"$set": seller1}, opts)
	usersCol.UpdateOne(ctx, bson.M{"email": "siti.seller@test.com"}, bson.M{"$set": seller2}, opts)

	// Fetch to get exact IDs in case they existed
	usersCol.FindOne(ctx, bson.M{"email": "budi.seller@test.com"}).Decode(&seller1)
	usersCol.FindOne(ctx, bson.M{"email": "siti.seller@test.com"}).Decode(&seller2)
	s1ID := seller1["_id"].(primitive.ObjectID)
	s2ID := seller2["_id"].(primitive.ObjectID)

	// ==========================================
	// 2. Create Buyers
	// ==========================================
	fmt.Println("👤 Creating buyer accounts...")

	buyer1ID := primitive.NewObjectID()
	buyer1 := bson.M{
		"_id":        buyer1ID,
		"name":       "Andi Wijaya",
		"email":      "andi.buyer@test.com",
		"password":   passwordHash,
		"phone":      "085678901234",
		"isSeller":   false,
		"isVerified": true,
		"location": bson.M{
			"type":        "Point",
			"coordinates": []float64{106.8000, -6.2000},
			"address":     "Jl. Gatot Subroto",
			"city":        "Jakarta",
			"state":       "DKI Jakarta",
			"pincode":     "10270",
		},
		"createdAt": time.Now(),
		"updatedAt": time.Now(),
	}

	usersCol.UpdateOne(ctx, bson.M{"email": "andi.buyer@test.com"}, bson.M{"$set": buyer1}, opts)

	// ==========================================
	// 3. Create Products
	// ==========================================
	fmt.Println("📦 Creating products...")

	products := []bson.M{
		{
			"seller":      s1ID,
			"name":        "Wireless Bluetooth Earbuds Pro",
			"description": "High-quality wireless earbuds with noise cancellation and 24-hour battery life. Perfect for music and calls.",
			"price":       250000,
			"category":    "electronics",
			"stock":       50,
			"unit":        "pieces",
			"images":      []string{"/images/placeholder-product.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.5,
			"reviewCount": 12,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    seller1["location"],
		},
		{
			"seller":      s1ID,
			"name":        "Fast Charging Cable Type-C",
			"description": "Durable braided fast charging cable, 2 meters length. Supports data transfer up to 480Mbps.",
			"price":       45000,
			"category":    "electronics",
			"stock":       120,
			"unit":        "pieces",
			"images":      []string{"/images/placeholder-product.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 45,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    seller1["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Nasi Liwet Komplit",
			"description": "Nasi liwet khas Sunda dengan ayam goreng, tahu, tempe, lalapan, dan sambal terasi pedas.",
			"price":       35000,
			"category":    "food",
			"stock":       20,
			"unit":        "portions",
			"images":      []string{"/images/placeholder-product.jpg"},
			"isAvailable": true,
			"status":      "active",
			"hasVariants": true,
			"variants": []bson.M{
				{"name": "Ayam Bakar", "price": 35000, "stock": 10},
				{"name": "Ayam Goreng", "price": 35000, "stock": 10},
			},
			"rating":      4.9,
			"reviewCount": 89,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    seller2["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Kue Kering Nastar Premium",
			"description": "Nastar isi nanas asli dengan butter premium. Tekstur lumer di mulut. Toples ukuran 500 gram.",
			"price":       85000,
			"category":    "food",
			"stock":       15,
			"unit":        "pieces",
			"images":      []string{"/images/placeholder-product.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      5.0,
			"reviewCount": 34,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    seller2["location"],
		},
	}

	for _, p := range products {
		productsCol.UpdateOne(ctx, bson.M{"name": p["name"], "seller": p["seller"]}, bson.M{"$set": p}, opts)
	}

	fmt.Println("\n✅ Database seeded successfully with realistic basic data!")
	fmt.Println("\n--- TEST ACCOUNTS ---")
	fmt.Println("All accounts use password: password123")
	fmt.Println("👨‍💼 Seller 1 (Electronics): budi.seller@test.com")
	fmt.Println("👩‍🍳 Seller 2 (Food):       siti.seller@test.com")
	fmt.Println("🛒 Buyer 1:               andi.buyer@test.com")
}
