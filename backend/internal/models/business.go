package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Business represents a registered business entity that can be associated with a user
type Business struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	OwnerID      primitive.ObjectID `bson:"ownerId" json:"ownerId"`           // Reference to the user who owns this business
	Name         string             `bson:"name" json:"name"`                 // Business name
	Description  string             `bson:"description" json:"description"`   // Business description
	Logo         *string            `bson:"logo" json:"logo"`                 // Business logo URL
	Email        string             `bson:"email" json:"email"`               // Business contact email
	Phone        string             `bson:"phone" json:"phone"`               // Business contact phone
	Website      *string            `bson:"website,omitempty" json:"website"` // Business website
	BusinessType string             `bson:"businessType" json:"businessType"` // micro, small, medium

	// Address information
	Address  string   `bson:"address" json:"address"`
	City     string   `bson:"city" json:"city"`
	State    string   `bson:"state" json:"state"`
	Pincode  string   `bson:"pincode" json:"pincode"`
	Country  string   `bson:"country" json:"country"`
	Location Location `bson:"location" json:"location"` // GeoJSON location

	// Verification and status
	IsVerified bool       `bson:"isVerified" json:"isVerified"` // Whether the business is verified
	VerifiedAt *time.Time `bson:"verifiedAt,omitempty" json:"verifiedAt"`
	IsActive   bool       `bson:"isActive" json:"isActive"` // Whether the business is active/visible

	// Business registration details
	RegistrationNumber *string `bson:"registrationNumber,omitempty" json:"registrationNumber"` // Business registration number
	TaxID              *string `bson:"taxId,omitempty" json:"taxId"`                           // Tax ID / NPWP

	// Social media and online presence
	Instagram *string `bson:"instagram,omitempty" json:"instagram"`
	Facebook  *string `bson:"facebook,omitempty" json:"facebook"`
	TikTok    *string `bson:"tiktok,omitempty" json:"tiktok"`

	// Metadata
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}

// LogoInfo contains logo URL and its source type
type LogoInfo struct {
	URL    string `json:"url"`
	Source string `json:"source"` // business, profile, generated, monogram
}

// BusinessResponse represents the business data returned in API responses
type BusinessResponse struct {
	ID           string    `json:"_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Logo         *string   `json:"logo"`     // Original business logo
	LogoInfo     LogoInfo  `json:"logoInfo"` // Resolved logo with source
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Website      *string   `json:"website"`
	BusinessType string    `json:"businessType"`
	Address      string    `json:"address"`
	City         string    `json:"city"`
	State        string    `json:"state"`
	IsVerified   bool      `json:"isVerified"`
	IsActive     bool      `json:"isActive"`
	Instagram    *string   `json:"instagram"`
	Facebook     *string   `json:"facebook"`
	TikTok       *string   `json:"tiktok"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CreateBusinessRequest represents the request body for creating a business
type CreateBusinessRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	Email        string  `json:"email" binding:"required,email"`
	Phone        string  `json:"phone" binding:"required"`
	Website      *string `json:"website"`
	BusinessType string  `json:"businessType" binding:"required"` // micro, small, medium
	Address      string  `json:"address"`
	City         string  `json:"city"`
	State        string  `json:"state"`
	Pincode      string  `json:"pincode"`
	Country      string  `json:"country"`
	Instagram    *string `json:"instagram"`
	Facebook     *string `json:"facebook"`
	TikTok       *string `json:"tiktok"`
}

// UpdateBusinessRequest represents the request body for updating a business
type UpdateBusinessRequest struct {
	Name         *string `json:"name"`
	Description  *string `json:"description"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	Website      *string `json:"website"`
	BusinessType *string `json:"businessType"`
	Address      *string `json:"address"`
	City         *string `json:"city"`
	State        *string `json:"state"`
	Pincode      *string `json:"pincode"`
	Country      *string `json:"country"`
	IsActive     *bool   `json:"isActive"`
	Instagram    *string `json:"instagram"`
	Facebook     *string `json:"facebook"`
	TikTok       *string `json:"tiktok"`
}

// UpdateBusinessLogoRequest represents the request for updating business logo
type UpdateBusinessLogoRequest struct {
	LogoURL string `json:"logoUrl" binding:"required"`
}

// ToResponse converts a Business model to BusinessResponse
func (b *Business) ToResponse() BusinessResponse {
	return BusinessResponse{
		ID:           b.ID.Hex(),
		Name:         b.Name,
		Description:  b.Description,
		Logo:         b.Logo,
		Email:        b.Email,
		Phone:        b.Phone,
		Website:      b.Website,
		BusinessType: b.BusinessType,
		Address:      b.Address,
		City:         b.City,
		State:        b.State,
		IsVerified:   b.IsVerified,
		IsActive:     b.IsActive,
		Instagram:    b.Instagram,
		Facebook:     b.Facebook,
		TikTok:       b.TikTok,
		CreatedAt:    b.CreatedAt,
	}
}
