package config

import (
	"os"
)

type Config struct {
	Port                string
	MongoDBURI          string
	JWTSecret           string
	NodeEnv             string
	LogoGenerationLimit int
	LogoRetentionDays   int
}

func Load() *Config {
	return &Config{
		Port:                getEnv("PORT", "5000"),
		MongoDBURI:          getEnv("MONGODB_URI", "mongodb://localhost:27017/msme_marketplace"),
		JWTSecret:           getEnv("JWT_SECRET", "your-secret-key"),
		NodeEnv:             getEnv("NODE_ENV", "development"),
		LogoGenerationLimit: 5,
		LogoRetentionDays:   7,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
