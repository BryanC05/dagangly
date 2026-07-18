package middleware

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimitMiddleware implements rate limiting using token bucket algorithm
// Default: 100 requests per hour per IP
func RateLimitMiddleware() gin.HandlerFunc {
	rate := limiter.Rate{
		Limit:  100,
		Period: time.Hour,
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		limiterContext, err := instance.Get(context.Background(), clientIP)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limiter error"})
			c.Abort()
			return
		}

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", strconv.FormatInt(limiterContext.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(limiterContext.Remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(limiterContext.Reset, 10))

		if limiterContext.Reached {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests",
				"message":     "Rate limit exceeded. Please try again later.",
				"retry_after": strconv.FormatInt(limiterContext.Reset-time.Now().Unix(), 10),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// StrictRateLimitMiddleware for sensitive endpoints (login, register, password reset)
// 5 requests per minute per IP
func StrictRateLimitMiddleware() gin.HandlerFunc {
	rate := limiter.Rate{
		Limit:  5,
		Period: time.Minute,
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		limiterContext, err := instance.Get(context.Background(), clientIP)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limiter error"})
			c.Abort()
			return
		}

		c.Header("X-RateLimit-Limit", strconv.FormatInt(limiterContext.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(limiterContext.Remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(limiterContext.Reset, 10))

		if limiterContext.Reached {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests",
				"message":     "Too many attempts. Please try again in 1 minute.",
				"retry_after": strconv.FormatInt(limiterContext.Reset-time.Now().Unix(), 10),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIRateLimitMiddleware for general API endpoints
// 1000 requests per hour per IP
func APIRateLimitMiddleware() gin.HandlerFunc {
	rate := limiter.Rate{
		Limit:  1000,
		Period: time.Hour,
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		limiterContext, err := instance.Get(context.Background(), clientIP)
		if err != nil {
			c.Next() // Don't block on error, just log
			return
		}

		c.Header("X-RateLimit-Limit", strconv.FormatInt(limiterContext.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(limiterContext.Remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(limiterContext.Reset, 10))

		if limiterContext.Reached {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "API rate limit exceeded",
				"message": "You've exceeded the API rate limit. Please upgrade your plan or try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
