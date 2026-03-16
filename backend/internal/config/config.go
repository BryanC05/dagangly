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
	mongoURI := getEnv("MONGODB_URI", "")
	if mongoURI == "" {
		// Check for common alternative env var names used by different platforms
		mongoURI = getEnv("MONGODB_URL", "") // Railway, Render often use this
	}
	if mongoURI == "" {
		mongoURI = getEnv("MONGO_URL", "") // Some platforms use this
	}
	if mongoURI == "" {
		mongoURI = getEnv("DATABASE_URL", "") // Heroku, etc.
	}

	// In production, require MONGODB_URI to be set
	nodeEnv := getEnv("NODE_ENV", "development")
	if mongoURI == "" {
		if nodeEnv == "production" {
			return nil, fmt.Errorf("MONGODB_URI environment variable is required in production")
		}
		// Default for development only
		mongoURI = "mongodb://localhost:27017/msme_marketplace"
	}

	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" && nodeEnv == "production" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required in production")
	}
	if jwtSecret == "" {
		jwtSecret = "your-secret-key"
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
