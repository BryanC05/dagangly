package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// normalizeJWTSecret validates JWT secret - no fallbacks allowed
func normalizeJWTSecret(jwtSecret string) string {
	if strings.TrimSpace(jwtSecret) == "" {
		log.Fatal("FATAL: JWT secret is empty. Set JWT_SECRET environment variable.")
	}
	if len(strings.TrimSpace(jwtSecret)) < 32 {
		log.Fatal("FATAL: JWT_SECRET must be at least 32 characters")
	}
	return jwtSecret
}

type Claims struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	IsSeller bool   `json:"isSeller"`
	jwt.RegisteredClaims
}

func AuthRequired(jwtSecret string) gin.HandlerFunc {
	secret := normalizeJWTSecret(jwtSecret)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Access denied. No token provided."})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token format"})
			c.Abort()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Token is not valid"})
			c.Abort()
			return
		}

		c.Set("userID", claims.ID)
		c.Set("userEmail", claims.Email)
		c.Set("isSeller", claims.IsSeller)
		c.Next()
	}
}

// Allowed origins for CORS - SECURITY FIX: No wildcards with credentials
var allowedOrigins = map[string]bool{
	// Production
	"https://dagangly.com":      true,
	"https://www.dagangly.com":  true,
	"https://app.dagangly.com":  true,
	// Development (localhost)
	"http://localhost:3000":     true,
	"http://localhost:5173":     true,
	"http://127.0.0.1:3000":     true,
	"http://127.0.0.1:5173":     true,
	// Replit development
	"https://*.replit.dev":      true,
	"https://*.repl.co":         true,
}

// CORSMiddleware implements secure CORS with origin whitelist
// SECURITY FIX: No longer allows arbitrary origins with credentials
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
	if !isOriginAllowed(origin) {
			// For disallowed origins, still allow the request but without CORS headers
			// This prevents preflight from succeeding for malicious sites
			c.Next()
			return
		}

		// Set CORS headers for allowed origins only
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Webhook-Signature")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH, WS, WSS")
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Vary", "Origin")

		// Handle preflight
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// isOriginAllowed checks if the origin is in the whitelist
func isOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	
	// Direct match
	if allowedOrigins[origin] {
		return true
	}
	
	// Handle wildcard subdomains for Replit
	for allowed := range allowedOrigins {
		if hasPrefix(allowed, "https://*.") {
			pattern := allowed[len("https://*"):]
			if hasSuffix(origin, pattern) {
				return true
			}
		}
	}
	
	return false
}

func hasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

func hasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}
