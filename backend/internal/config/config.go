package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port                 string
	MongoDBURI           string
	JWTSecret            string
	NodeEnv              string
	LogoGenerationLimit  int
	LogoRetentionDays    int
	ClaidAPIKey          string
	ClaidBaseURL         string
	ClaidTimeoutSeconds  int
	ProductImageMaxSize  int
	ProductImageMaxCount int
	ProductEnhanceLimit  int
	MidtransServerKey    string
	MidtransClientKey    string
	MidtransIsProduction bool
}

func Load() (*Config, error) {
	mongoURI := getEnv("MONGODB_URL", "")
	if mongoURI == "" {
		// Check for common alternative env var names used by different platforms
		mongoURI = getEnv("MONGODB_URI", "") // fallback to MONGODB_URI
	}
	if mongoURI == "" {
		mongoURI = getEnv("MONGO_URL", "") // Some platforms use this
	}
	if mongoURI == "" {
		mongoURI = getEnv("DATABASE_URL", "") // Heroku, etc.
	}

	// Get environment
	nodeEnv := getEnv("NODE_ENV", "development")

	// Allow missing MONGODB_URL - server will start but won't have database
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/msme_marketplace"
		fmt.Printf("⚠️  MONGODB_URL not set, using default: %s\n", mongoURI)
	}

	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		jwtSecret = "default-dev-secret-key" // Use a default for development
		if nodeEnv == "production" {
			fmt.Println("⚠️  WARNING: JWT_SECRET not set in production, using default (INSECURE!)")
		}
	}

	return &Config{
		Port:                 getEnv("PORT", "5000"),
		MongoDBURI:           mongoURI,
		JWTSecret:            jwtSecret,
		NodeEnv:              nodeEnv,
		LogoGenerationLimit:  5,
		LogoRetentionDays:    7,
		ClaidAPIKey:          firstNonEmpty(getEnv("CLAID_API_KEY", ""), getEnv("CLAID_EDITING_API_KEY", "")),
		ClaidBaseURL:         getEnv("CLAID_BASE_URL", "https://api.claid.ai/v1"),
		ClaidTimeoutSeconds:  getEnvInt("CLAID_TIMEOUT_SECONDS", 45),
		ProductImageMaxSize:  getEnvInt("PRODUCT_IMAGE_MAX_SIZE_MB", 5),
		ProductImageMaxCount: getEnvInt("PRODUCT_IMAGE_MAX_COUNT", 4),
		ProductEnhanceLimit:  getEnvInt("PRODUCT_ENHANCE_DAILY_LIMIT", 20),
		MidtransServerKey:    getEnv("MIDTRANS_SERVER_KEY", ""),
		MidtransClientKey:    getEnv("MIDTRANS_CLIENT_KEY", ""),
		MidtransIsProduction: getEnv("MIDTRANS_IS_PRODUCTION", "false") == "true",
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return parsed
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
