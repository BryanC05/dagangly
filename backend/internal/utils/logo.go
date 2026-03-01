package utils

import (
	"fmt"
	"strings"
	"unicode"
)

// LogoSource represents the source of a business logo
type LogoSource string

const (
	LogoSourceBusiness  LogoSource = "business"  // From business.Logo field
	LogoSourceProfile   LogoSource = "profile"   // From user's profile image
	LogoSourceGenerated LogoSource = "generated" // AI-generated logo
	LogoSourceMonogram  LogoSource = "monogram"  // Auto-generated monogram
)

// LogoInfo contains logo URL and its source type
type LogoInfo struct {
	URL    string     `json:"url"`
	Source LogoSource `json:"source"`
}

// GenerateMonogram creates a monogram from business name initials
// Returns a URL to a dynamically generated avatar service
func GenerateMonogram(businessName string) string {
	if businessName == "" {
		return generateDefaultMonogram()
	}

	// Extract initials (up to 2 characters)
	initials := extractInitials(businessName)

	// Generate a consistent color based on the business name
	bgColor := generateColorFromString(businessName)
	textColor := "ffffff" // White text

	// Use UI Avatars service for monogram generation
	// This is a free service that generates initials avatars
	return fmt.Sprintf(
		"https://ui-avatars.com/api/?name=%s&background=%s&color=%s&size=256&bold=true&font-size=0.5",
		urlEncode(initials),
		bgColor,
		textColor,
	)
}

// extractInitials extracts up to 2 initials from a business name
func extractInitials(name string) string {
	// Clean the name
	name = strings.TrimSpace(name)
	if name == "" {
		return "B"
	}

	// Split by spaces and special characters
	words := splitWords(name)

	var initials strings.Builder
	count := 0

	for _, word := range words {
		if word == "" || count >= 2 {
			continue
		}

		// Get first letter of each word
		runes := []rune(word)
		for _, r := range runes {
			if unicode.IsLetter(r) {
				initials.WriteRune(unicode.ToUpper(r))
				count++
				break
			}
		}

		if count >= 2 {
			break
		}
	}

	result := initials.String()
	if result == "" {
		return "B"
	}

	return result
}

// splitWords splits a string into words, handling various separators
func splitWords(s string) []string {
	// Replace common separators with spaces
	replacer := strings.NewReplacer(
		"-", " ",
		"_", " ",
		"&", " ",
		"+", " ",
		"@", " ",
		".", " ",
	)
	s = replacer.Replace(s)

	return strings.Fields(s)
}

// generateColorFromString generates a consistent hex color from a string
func generateColorFromString(s string) string {
	// Predefined professional colors for businesses
	colors := []string{
		"2563eb", // Blue
		"7c3aed", // Purple
		"059669", // Green
		"dc2626", // Red
		"ea580c", // Orange
		"0891b2", // Cyan
		"be185d", // Pink
		"4338ca", // Indigo
		"047857", // Emerald
		"b45309", // Amber
	}

	// Simple hash function
	hash := 0
	for _, c := range s {
		hash = ((hash << 5) - hash) + int(c)
		hash = hash & hash // Keep it positive
	}

	// Use absolute value and modulo to select color
	idx := hash
	if idx < 0 {
		idx = -idx
	}
	return colors[idx%len(colors)]
}

// generateDefaultMonogram returns a default monogram for empty business names
func generateDefaultMonogram() string {
	return "https://ui-avatars.com/api/?name=B&background=2563eb&color=ffffff&size=256&bold=true"
}

// urlEncode URL-encodes a string for use in avatar API
func urlEncode(s string) string {
	// Simple URL encoding for common characters
	result := strings.ReplaceAll(s, " ", "%20")
	result = strings.ReplaceAll(result, "&", "%26")
	return result
}

// ResolveBusinessLogo determines the appropriate logo for a business
// Priority: Business.Logo > User.ProfileImage > Generated Monogram
func ResolveBusinessLogo(businessLogo, profileImage, businessName string) LogoInfo {
	// 1. Check if business has its own logo
	if businessLogo != "" {
		return LogoInfo{
			URL:    businessLogo,
			Source: LogoSourceBusiness,
		}
	}

	// 2. Fall back to user's profile image
	if profileImage != "" {
		return LogoInfo{
			URL:    profileImage,
			Source: LogoSourceProfile,
		}
	}

	// 3. Generate monogram from business name
	return LogoInfo{
		URL:    GenerateMonogram(businessName),
		Source: LogoSourceMonogram,
	}
}

// GetBusinessLogoURL is a convenience function that returns just the URL
func GetBusinessLogoURL(businessLogo, profileImage, businessName string) string {
	info := ResolveBusinessLogo(businessLogo, profileImage, businessName)
	return info.URL
}
