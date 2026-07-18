package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
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

// generateSecurePassword generates a random 16-character password
func generateSecurePassword() (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	password := make([]byte, 16)
	for i := range password {
		randomIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[randomIndex.Int64()]
	}
	return string(password), nil
}

func main() {
	godotenv.Load(".env")
	uri := os.Getenv("MONGODB_URL")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	defer client.Disconnect(ctx)

	db := client.Database("msme_marketplace")

	usersCol := db.Collection("users")
	productsCol := db.Collection("products")

	// SECURITY FIX: Generate unique random passwords for each seeded account
	// NEVER use hardcoded passwords or print them to console
	defaultPassword, err := generateSecurePassword()
	if err != nil {
		log.Fatal("Failed to generate secure password")
	}
	passwordHash := hashPassword(defaultPassword)

	fmt.Println("🌱 Revamping database mock simulation data...")
	fmt.Println("⚠️  All accounts use a secure random password (NOT printed for security)")
	fmt.Println("⚠️  Check .env.example for SEED_PASSWORD override option")

	// Allow override via environment variable for development
	if seedPassword := os.Getenv("SEED_PASSWORD"); seedPassword != "" {
		if len(seedPassword) < 8 {
			log.Fatal("SEED_PASSWORD must be at least 8 characters")
		}
		fmt.Println("✓ Using SEED_PASSWORD from environment")
		passwordHash = hashPassword(seedPassword)
	}

	// Clear existing test/seeding data to start fresh
	_, _ = usersCol.DeleteMany(ctx, bson.M{"email": bson.M{"$regex": "@test.com$"}})
	_, _ = productsCol.DeleteMany(ctx, bson.M{})

	// ==========================================
	// 1. Create Sellers (5 total, 3 new)
	// ==========================================
	fmt.Println("👤 Creating 5 seller accounts at different locations...")

	s1ID := primitive.NewObjectID()
	s2ID := primitive.NewObjectID()
	s3ID := primitive.NewObjectID()
	s4ID := primitive.NewObjectID()
	s5ID := primitive.NewObjectID()

	sellers := []bson.M{
		{
			"_id":                 s1ID,
			"name":                "Budi Santoso",
			"email":               "budi.seller@test.com",
			"password":            passwordHash,
			"phone":               "081234567890",
			"isSeller":            true,
			"businessName":        "Warung Makan Padang Budi",
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
		},
		{
			"_id":                 s2ID,
			"name":                "Siti Rahmawati",
			"email":               "siti.seller@test.com",
			"password":            passwordHash,
			"phone":               "081987654321",
			"isSeller":            true,
			"businessName":        "Dapur Bu Siti (Catering)",
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
		},
		{
			"_id":                 s3ID,
			"name":                "Joko Widodo",
			"email":               "joko.seller@test.com",
			"password":            passwordHash,
			"phone":               "081122334455",
			"isSeller":            true,
			"businessName":        "Warung Kopi Mas Joko",
			"businessType":        "individual",
			"businessAddress":     "Jl. Tebet Raya No. 12, Jakarta Selatan",
			"registrationStatus":  "approved",
			"isVerified":          true,
			"isMember":            true,
			"memberSince":         time.Now(),
			"memberExpiry":        time.Now().AddDate(1, 0, 0),
			"membershipStatus":    "active",
			"location": bson.M{
				"type":        "Point",
				"coordinates": []float64{106.8480, -6.2250}, // Jakarta Selatan (Tebet)
				"address":     "Jl. Tebet Raya No. 12",
				"city":        "Jakarta Selatan",
				"state":       "DKI Jakarta",
				"pincode":     "12810",
			},
			"rating":       4.7,
			"totalReviews": 35,
			"createdAt":    time.Now(),
			"updatedAt":    time.Now(),
		},
		{
			"_id":                 s4ID,
			"name":                "Dewi Lestari",
			"email":               "dewi.seller@test.com",
			"password":            passwordHash,
			"phone":               "081223344556",
			"isSeller":            true,
			"businessName":        "Toko Kue & Dessert Dewi",
			"businessType":        "individual",
			"businessAddress":     "Jl. Panjang No. 15, Kebon Jeruk, Jakarta Barat",
			"registrationStatus":  "approved",
			"isVerified":          true,
			"isMember":            true,
			"memberSince":         time.Now(),
			"memberExpiry":        time.Now().AddDate(1, 0, 0),
			"membershipStatus":    "active",
			"location": bson.M{
				"type":        "Point",
				"coordinates": []float64{106.7681, -6.1905}, // Jakarta Barat (Kebon Jeruk)
				"address":     "Jl. Panjang No. 15, Kebon Jeruk",
				"city":        "Jakarta Barat",
				"state":       "DKI Jakarta",
				"pincode":     "11530",
			},
			"rating":       4.9,
			"totalReviews": 42,
			"createdAt":    time.Now(),
			"updatedAt":    time.Now(),
		},
		{
			"_id":                 s5ID,
			"name":                "Eko Prasetyo",
			"email":               "eko.seller@test.com",
			"password":            passwordHash,
			"phone":               "081334455667",
			"isSeller":            true,
			"businessName":        "Sate & Ayam Goreng Pak Eko",
			"businessType":        "individual",
			"businessAddress":     "Jl. MT Haryono No. 5, Cawang, Jakarta Timur",
			"registrationStatus":  "approved",
			"isVerified":          true,
			"isMember":            true,
			"memberSince":         time.Now(),
			"memberExpiry":        time.Now().AddDate(1, 0, 0),
			"membershipStatus":    "active",
			"location": bson.M{
				"type":        "Point",
				"coordinates": []float64{106.8720, -6.2480}, // Jakarta Timur (Cawang)
				"address":     "Jl. MT Haryono No. 5, Cawang",
				"city":        "Jakarta Timur",
				"state":       "DKI Jakarta",
				"pincode":     "13630",
			},
			"rating":       4.6,
			"totalReviews": 18,
			"createdAt":    time.Now(),
			"updatedAt":    time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	for _, seller := range sellers {
		usersCol.UpdateOne(ctx, bson.M{"email": seller["email"]}, bson.M{"$set": seller}, opts)
	}

	// ==========================================
	// 2. Create Buyer
	// ==========================================
	fmt.Println("👤 Creating buyer account...")

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
			"city":        "Jakarta Pusat",
			"state":       "DKI Jakarta",
			"pincode":     "10270",
		},
		"createdAt": time.Now(),
		"updatedAt": time.Now(),
	}

	usersCol.UpdateOne(ctx, bson.M{"email": "andi.buyer@test.com"}, bson.M{"$set": buyer1}, opts)

	// ==========================================
	// 3. Create Products (28 items utilizing /uploads/products images)
	// ==========================================
	fmt.Println("📦 Creating revamped products with authentic names and images...")

	products := []bson.M{
		// --- Seller 1 Products (Padang food) ---
		{
			"seller":      s1ID,
			"name":        "Nasi Padang Komplit",
			"description": "Nasi Padang dengan ayam bakar, sayur nangka khas minang, sambal hijau, dan kuah gulai yang gurih.",
			"price":       2500, // keep cheap for testing if needed
			"category":    "food",
			"stock":       50,
			"unit":        "portion",
			"images":      []string{"/uploads/products/nasi-padang.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 15,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[0]["location"],
		},
		{
			"seller":      s1ID,
			"name":        "Rendang Daging Sapi",
			"description": "Rendang daging sapi empuk khas Minang yang dimasak dengan bumbu rempah pilihan selama berjam-jam.",
			"price":       40000,
			"category":    "food",
			"stock":       30,
			"unit":        "portion",
			"images":      []string{"/uploads/products/rendang.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.9,
			"reviewCount": 24,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[0]["location"],
		},
		{
			"seller":      s1ID,
			"name":        "Nasi Goreng Spesial",
			"description": "Nasi goreng harum wajan dengan campuran telur, bakso sapi, suwiran ayam, dan kerupuk renyah.",
			"price":       20000,
			"category":    "food",
			"stock":       40,
			"unit":        "portion",
			"images":      []string{"/uploads/products/nasi-goreng.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 38,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[0]["location"],
		},
		{
			"seller":      s1ID,
			"name":        "Soto Ayam Madura",
			"description": "Soto ayam berkuah kuning bening gurih dengan suwiran ayam, soun, kol, telur rebus, dan taburan koya.",
			"price":       18000,
			"category":    "food",
			"stock":       35,
			"unit":        "portion",
			"images":      []string{"/uploads/products/soto-ayam.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.6,
			"reviewCount": 19,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[0]["location"],
		},
		{
			"seller":      s1ID,
			"name":        "Teh Manis Segar",
			"description": "Teh manis seduh tradisional dengan aroma melati yang wangi. Nikmat disajikan dingin maupun hangat.",
			"price":       5000,
			"category":    "drinks",
			"stock":       100,
			"unit":        "glass",
			"images":      []string{"/uploads/products/teh-manis.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.5,
			"reviewCount": 85,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[0]["location"],
		},

		// --- Seller 2 Products (Traditional Indonesian Dishes) ---
		{
			"seller":      s2ID,
			"name":        "Nasi Uduk Gurih Betawi",
			"description": "Nasi yang dimasak dengan santan wangi, disajikan dengan bihun goreng, orek tempe, telur dadar iris, dan sambal kacang.",
			"price":       15000,
			"category":    "food",
			"stock":       45,
			"unit":        "portion",
			"images":      []string{"/uploads/products/nasi-uduk.jpeg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 42,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[1]["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Nasi Kuning Tumpeng Mini",
			"description": "Nasi kuning wangi rempah dengan lauk ayam goreng, perkedel kentang, serundeng kelapa wangi, dan sambal goreng ati.",
			"price":       15000,
			"category":    "food",
			"stock":       30,
			"unit":        "portion",
			"images":      []string{"/uploads/products/nasi-kuning.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.9,
			"reviewCount": 29,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[1]["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Gado Gado Bumbu Kacang",
			"description": "Sayuran rebus segar, tahu, tempe, kentang, dan lontong disiram saus bumbu kacang tanah gurih kental.",
			"price":       17000,
			"category":    "food",
			"stock":       25,
			"unit":        "portion",
			"images":      []string{"/uploads/products/gadogado.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 51,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[1]["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Bakso Malang Asli",
			"description": "Bakso halus, bakso urat, pangsit goreng renyah, tahu bakso, dan siomay basah disajikan hangat dengan kuah kaldu sapi bening.",
			"price":       20000,
			"category":    "food",
			"stock":       35,
			"unit":        "portion",
			"images":      []string{"/uploads/products/bakso-malang.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 63,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[1]["location"],
		},
		{
			"seller":      s2ID,
			"name":        "Es Cendol Gula Merah",
			"description": "Minuman manis dingin dari cendol pandan kenyal, santan kelapa segar, dan sirup gula merah jawa asli.",
			"price":       8000,
			"category":    "drinks",
			"stock":       60,
			"unit":        "glass",
			"images":      []string{"/uploads/products/es-cendol.jpeg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.9,
			"reviewCount": 44,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[1]["location"],
		},

		// --- Seller 3 Products (Coffee shop / Drinks) ---
		{
			"seller":      s3ID,
			"name":        "Kopi Hitam Tubruk",
			"description": "Seduhan kopi hitam arabika lokal berkualitas tinggi dengan rasa bold dan aroma pekat.",
			"price":       8000,
			"category":    "drinks",
			"stock":       80,
			"unit":        "cup",
			"images":      []string{"/uploads/products/kopi-hitam.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.6,
			"reviewCount": 31,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[2]["location"],
		},
		{
			"seller":      s3ID,
			"name":        "Kopi Susu Aren Gula Semut",
			"description": "Perpaduan kopi espresso, susu cair creamy, dan manis legit dari gula aren cair asli.",
			"price":       12000,
			"category":    "drinks",
			"stock":       90,
			"unit":        "cup",
			"images":      []string{"/uploads/products/kopi-susu.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 78,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[2]["location"],
		},
		{
			"seller":      s3ID,
			"name":        "Matcha Latte Premium",
			"description": "Minuman susu dengan bubuk matcha jepang impor murni tanpa pemanis buatan, disajikan creamy dingin.",
			"price":       15000,
			"category":    "drinks",
			"stock":       50,
			"unit":        "glass",
			"images":      []string{"/uploads/products/matcha-latte.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 26,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[2]["location"],
		},
		{
			"seller":      s3ID,
			"name":        "Lemon Tea Dingin",
			"description": "Teh hitam dingin dengan perasan lemon segar asli, memberikan rasa manis kecut yang menyegarkan dahaga.",
			"price":       10000,
			"category":    "drinks",
			"stock":       70,
			"unit":        "glass",
			"images":      []string{"/uploads/products/lemon-tea.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.6,
			"reviewCount": 15,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[2]["location"],
		},
		{
			"seller":      s3ID,
			"name":        "Es Teh Lemon Mint",
			"description": "Es teh lemon dingin yang disajikan dengan tambahan daun mint segar untuk kesegaran ekstra.",
			"price":       10000,
			"category":    "drinks",
			"stock":       65,
			"unit":        "glass",
			"images":      []string{"/uploads/products/es-teh-lemon.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 22,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[2]["location"],
		},

		// --- Seller 4 Products (Cakes and Desserts) ---
		{
			"seller":      s4ID,
			"name":        "Kue Lapis Legit Spesial",
			"description": "Kue lapis panggang premium beraroma rempah wisman harum dengan tekstur padat lumer di mulut.",
			"price":       60000,
			"category":    "food",
			"stock":       15,
			"unit":        "box",
			"images":      []string{"/uploads/products/kue-lapis.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      5.0,
			"reviewCount": 49,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[3]["location"],
		},
		{
			"seller":      s4ID,
			"name":        "Brownies Cokelat Panggang",
			"description": "Brownies cokelat panggang dengan crust tipis mengkilap di atas, sangat fudgy di dalam bertabur chocochips.",
			"price":       45000,
			"category":    "food",
			"stock":       20,
			"unit":        "box",
			"images":      []string{"/uploads/products/brownies.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 31,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[3]["location"],
		},
		{
			"seller":      s4ID,
			"name":        "Donat Kentang Tabur Gula",
			"description": "Donat kentang jadul yang super empuk dan mengembang sempurna, dibalut gula halus dingin melimpah.",
			"price":       6000,
			"category":    "food",
			"stock":       100,
			"unit":        "piece",
			"images":      []string{"/uploads/products/donat.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.9,
			"reviewCount": 82,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[3]["location"],
		},
		{
			"seller":      s4ID,
			"name":        "Pisang Cokelat Lumer (Piscok)",
			"description": "Pisang uli matang dibungkus kulit lumpia dengan cokelat melimpah, digoreng garing renyah.",
			"price":       5000,
			"category":    "food",
			"stock":       80,
			"unit":        "piece",
			"images":      []string{"/uploads/products/pisang-cokelat.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 46,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[3]["location"],
		},
		{
			"seller":      s4ID,
			"name":        "Risole Ragout Ayam Mayonaise",
			"description": "Risoles dengan isian ragout ayam gurih creamy dicampur mayonaise tebal dan irisan telur rebus.",
			"price":       4000,
			"category":    "food",
			"stock":       60,
			"unit":        "piece",
			"images":      []string{"/uploads/products/risole.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 38,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[3]["location"],
		},

		// --- Seller 5 Products (Grilled food & snacks/drinks) ---
		{
			"seller":      s5ID,
			"name":        "Sate Ayam Madura",
			"description": "Sate daging ayam pilihan dibakar kecap manis, disajikan dengan bumbu kacang tanah gurih dan irisan bawang merah.",
			"price":       25000,
			"category":    "food",
			"stock":       50,
			"unit":        "portion",
			"images":      []string{"/uploads/products/sate-ayam.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 54,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Ayam Goreng Kremes",
			"description": "Ayam goreng bumbu ungkep jawa yang gurih disajikan dengan taburan kremesan renyah bersari kelapa, lalapan, dan sambal terasi.",
			"price":       22000,
			"category":    "food",
			"stock":       30,
			"unit":        "portion",
			"images":      []string{"/uploads/products/ayam-goreng-kremes.jpeg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 27,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Ayam Penyet Sambal Korek",
			"description": "Ayam goreng gurih yang dimemarkan di atas ulekan sambal bawang (sambal korek) pedas ekstra segar.",
			"price":       20000,
			"category":    "food",
			"stock":       30,
			"unit":        "portion",
			"images":      []string{"/uploads/products/ayam-penyet.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 36,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Bakmi Ayam Jamur",
			"description": "Mie kenyal dengan suwiran ayam gurih, tumisan jamur kancing kecap manis, disajikan terpisah dengan kuah kaldu gurih hangat.",
			"price":       18000,
			"category":    "food",
			"stock":       40,
			"unit":        "portion",
			"images":      []string{"/uploads/products/bakmi.png"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 42,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Bacang Ayam Spesial",
			"description": "Bacang ketan pulen wangi berisi tumisan ayam cincang kecap manis gurih dibalut daun bambu tradisional.",
			"price":       12000,
			"category":    "food",
			"stock":       25,
			"unit":        "piece",
			"images":      []string{"/uploads/products/bacang-ayam.jpg"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.6,
			"reviewCount": 14,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Jus Alpukat Susu Cokelat",
			"description": "Jus alpukat matang segar dikocok kental disajikan dingin dengan siraman susu kental manis cokelat di dinding gelas.",
			"price":       12000,
			"category":    "drinks",
			"stock":       40,
			"unit":        "glass",
			"images":      []string{"/uploads/products/jus-alpukat.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.8,
			"reviewCount": 39,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Chocolate Milkshake Creamy",
			"description": "Susu milkshake cokelat pekat dicampur es krim vanila, disajikan super creamy dingin.",
			"price":       15000,
			"category":    "drinks",
			"stock":       30,
			"unit":        "glass",
			"images":      []string{"/uploads/products/chocolate-milkshake.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.7,
			"reviewCount": 18,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
		{
			"seller":      s5ID,
			"name":        "Thai Tea Asli Dingin",
			"description": "Teh tradisional Thailand berwarna oranye dengan campuran susu evaporasi legit dan creamy.",
			"price":       12000,
			"category":    "drinks",
			"stock":       50,
			"unit":        "glass",
			"images":      []string{"/uploads/products/thai-tea.webp"},
			"isAvailable": true,
			"status":      "active",
			"rating":      4.9,
			"reviewCount": 57,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
			"location":    sellers[4]["location"],
		},
	}

	for _, p := range products {
		productsCol.UpdateOne(ctx, bson.M{"name": p["name"], "seller": p["seller"]}, bson.M{"$set": p}, opts)
	}

	fmt.Println("\n✅ Database seeded successfully with realistic revamped Indonesian products!")
	fmt.Println("\n--- TEST ACCOUNTS ---")
	fmt.Println("🔐 All test accounts use a SECURE RANDOM password (not printed for security)")
	fmt.Println("   To use a specific password, set SEED_PASSWORD environment variable before running seed")
	fmt.Println("\n👨‍💼 Seller 1 (Padang food):    budi.seller@test.com  - Jakarta Pusat")
	fmt.Println("👩‍🍳 Seller 2 (Dishes/Catering): siti.seller@test.com  - Depok")
	fmt.Println("👨‍☕ Seller 3 (Coffee/Drinks):    joko.seller@test.com  - Jakarta Selatan")
	fmt.Println("👩‍🎂 Seller 4 (Cakes/Dessert):   dewi.seller@test.com  - Jakarta Barat")
	fmt.Println("👨‍🍖 Seller 5 (Grill/Meat):      eko.seller@test.com   - Jakarta Timur")
	fmt.Println("🛒 Buyer 1:                  andi.buyer@test.com   - Jakarta Pusat")
}
