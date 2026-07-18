package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware adds essential security HTTP headers
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking attacks
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// XSS protection for legacy browsers
		c.Header("X-XSS-Protection", "1; mode=block")

		// HSTS - enforce HTTPS (enable after HTTPS is confirmed working)
		// c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// Content Security Policy - restrict resource loading
		c.Header("Content-Security-Policy",
			"default-src 'self'; "+
				"script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; "+
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "+
				"img-src 'self' data: https: blob:; "+
				"font-src 'self' data: https://fonts.gstatic.com; "+
				"connect-src 'self' https://api.midtrans.com https://api.imgbb.com; "+
				"frame-ancestors 'none';")

		// Referrer Policy - control referrer information
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy - disable unnecessary browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(self)")

		c.Next()
	}
}
