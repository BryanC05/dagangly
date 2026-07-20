package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// BiteshipService handles Biteship API interactions
type BiteshipService struct {
	apiKey    string
	baseURL   string
	httpClient *http.Client
}

// BiteshipAPIConfig holds configuration
type BiteshipAPIConfig struct {
	APIKey string
	BaseURL string // Optional, defaults to https://api.biteship.com/v1
}

// NewBiteshipService creates a new Biteship service instance
func NewBiteshipService(config BiteshipAPIConfig) *BiteshipService {
	baseURL := config.BaseURL
	if baseURL == "" {
		baseURL = "https://api.biteship.com/v1"
	}

	return &BiteshipService{
		apiKey: config.APIKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetBiteshipConfigFromEnv gets Biteship config from environment variables
func GetBiteshipConfigFromEnv() BiteshipAPIConfig {
	return BiteshipAPIConfig{
		APIKey:  os.Getenv("BITESHIP_API_KEY"),
		BaseURL: os.Getenv("BITESHIP_API_URL"), // Optional
	}
}

// ============== Shipping Rates ==============

// RateRequest represents a shipping rate calculation request
type RateRequest struct {
	DeliverFrom  Address  `json:"deliver_from"`
	DeliverTo    Address  `json:"deliver_to"`
	CourierCodes []string `json:"courier_codes,omitempty"` // Optional filter
	Items        []Item   `json:"items,omitempty"`
}

// Address represents a location for shipping
type Address struct {
	LocationID   string  `json:"location_id,omitempty"` // Use if you have a saved location
	Latitude     float64 `json:"latitude,omitempty"`
	Longtitude   float64 `json:"longitude,omitempty"`
	Address      string  `json:"address,omitempty"`
	CityName     string  `json:"city_name,omitempty"`
	StateName    string  `json:"state_name,omitempty"`
	ZipCode      string  `json:"zipcode,omitempty"`
	CountryISO2  string  `json:"country_iso2,omitempty"`
	LocationType string  `json:"location_type,omitempty"` // residential, business, etc.
}

// RateResponse represents the shipping rate calculation response
type RateResponse struct {
	Status string        `json:"status"`
	Data   RateData      `json:"data"`
	Error  *APIError     `json:"error,omitempty"`
}

// RateData contains rate calculation results
type RateData struct {
	RequestID   string        `json:"request_id"`
	Rates       []CourierRate `json:"rates"`
	DeliverFrom LocationInfo  `json:"deliver_from"`
	DeliverTo   LocationInfo  `json:"deliver_to"`
}

// CourierRate contains rate information for a courier
type CourierRate struct {
	CourierCode     string  `json:"courier_code"`
	CourierName     string  `json:"courier_name"`
	ServiceCode     string  `json:"service_code"`
	ServiceName     string  `json:"service_name"`
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
	EstimatedDays   int     `json:"estimated_delivery_day"`
	EstimatedDaysMin int    `json:"estimated_delivery_day_min,omitempty"`
	EstimatedDaysMax int    `json:"estimated_delivery_day_max,omitempty"`
	PickupTime      string  `json:"pickup_time,omitempty"`
	DeliveryTime    string  `json:"delivery_time,omitempty"`
	DimensionRestriction *DimensionRestriction `json:"dimension_restriction,omitempty"`
	WeightRestriction  *WeightRestriction      `json:"weight_restriction,omitempty"`
}

// DimensionRestriction for courier
type DimensionRestriction struct {
	MinLength float64 `json:"min_length"`
	MinWidth  float64 `json:"min_width"`
	MinHeight float64 `json:"min_height"`
	MaxLength float64 `json:"max_length"`
	MaxWidth  float64 `json:"max_width"`
	MaxHeight float64 `json:"max_height"`
	Unit      string  `json:"unit"`
}

// WeightRestriction for courier
type WeightRestriction struct {
	MinWeight float64 `json:"min_weight"`
	MaxWeight float64 `json:"max_weight"`
	Unit      string  `json:"unit"`
}

// LocationInfo contains location details
type LocationInfo struct {
	LocationID  string  `json:"location_id"`
	Latitude    float64 `json:"latitude"`
	Longtitude  float64 `json:"longitude"`
	Address     string  `json:"address"`
	CityName    string  `json:"city_name"`
	StateName   string  `json:"state_name"`
	ZipCode     string  `json:"zipcode"`
	CountryISO2 string  `json:"country_iso2"`
}

// CalculateRates calculates shipping rates
func (s *BiteshipService) CalculateRates(ctx context.Context, req RateRequest) (*RateResponse, error) {
	url := fmt.Sprintf("%s/rates", s.baseURL)
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var rateResp RateResponse
	if err := json.Unmarshal(body, &rateResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if rateResp.Status != "success" {
		return &rateResp, fmt.Errorf("API returned non-success status: %s", rateResp.Status)
	}

	return &rateResp, nil
}

// ============== Create Shipment ==============

// CreateShipmentRequest represents a shipment creation request
type CreateShipmentRequest struct {
	CourierCode   string     `json:"courier_code"`
	ServiceCode   string     `json:"service_code"`
	DeliverFrom   Address    `json:"deliver_from"`
	DeliverTo     Address    `json:"deliver_to"`
	PickupDate    string     `json:"pickup_date,omitempty"` // YYYY-MM-DD
	Package       Package    `json:"package"`
	Customs       *Customs   `json:"customs,omitempty"`
	Insurance     *Insurance `json:"insurance,omitempty"`
	COD           *COD       `json:"cod,omitempty"`
	Payment       string     `json:"payment"` // "receiver" or "shipper"
	Reference     string     `json:"reference,omitempty"` // Order ID
	Note          string     `json:"note,omitempty"`
	Items         []Item     `json:"items,omitempty"`
}

// Package represents shipment package details
type Package struct {
	Length    float64 `json:"length"`
	Width     float64 `json:"width"`
	Height    float64 `json:"height"`
	Weight    float64 `json:"weight"`
	Unit      string  `json:"unit"` // cm, kg
	Content   string  `json:"content"`
	Category  string  `json:"category,omitempty"`
	
	// For multiple packages
	ItemsCount int `json:"items_count,omitempty"`
	PieceCount int `json:"piece_count,omitempty"`
}

// Customs for international shipping
type Customs struct {
	InvoiceNumber string   `json:"invoice_number"`
	HsCode        string   `json:"hs_code"`
	Description   string   `json:"description"`
	OriginCountry string   `json:"origin_country"`
	Items         []CustomsItem `json:"items"`
}

// CustomsItem for customs declaration
type CustomsItem struct {
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	Weight      float64 `json:"weight"`
	Value       float64 `json:"value"`
	Currency    string  `json:"currency"`
	HsCode      string  `json:"hs_code,omitempty"`
	OriginCountry string `json:"origin_country,omitempty"`
}

// Insurance for shipment
type Insurance struct {
	Enabled    bool    `json:"enabled"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	ProviderCode string `json:"provider_code,omitempty"`
}

// COD (Cash on Delivery) configuration
type COD struct {
	Enabled  bool    `json:"enabled"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Note     string  `json:"note,omitempty"`
}

// Item represents a shipment item
type Item struct {
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	Weight    float64 `json:"weight"`
	Value     float64 `json:"value,omitempty"`
	Sku       string  `json:"sku,omitempty"`
}

// CreateShipmentResponse represents the shipment creation response
type CreateShipmentResponse struct {
	Status string          `json:"status"`
	Data   ShipmentData    `json:"data"`
	Error  *APIError       `json:"error,omitempty"`
}

// ShipmentData contains shipment details
type ShipmentData struct {
	ShipmentID    string `json:"shipment_id"`
	TrackingID    string `json:"tracking_id"`
	AwbNumber     string `json:"awb_number"`
	CourierCode   string `json:"courier_code"`
	CourierName   string `json:"courier_name"`
	ServiceCode   string `json:"service_code"`
	ServiceName   string `json:"service_name"`
	RateAmount    float64 `json:"rate_amount"`
	Currency      string  `json:"currency"`
	Status        string  `json:"status"`
	LabelURL      string  `json:"label_url,omitempty"`
	CreatedAt     string  `json:"created_at"`
	QRCode        string  `json:"qr_code,omitempty"`
	PDFManifest   string  `json:"pdf_manifest,omitempty"`
}

// CreateShipment creates a new shipment
func (s *BiteshipService) CreateShipment(ctx context.Context, req CreateShipmentRequest) (*CreateShipmentResponse, error) {
	url := fmt.Sprintf("%s/shipments", s.baseURL)
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var shipmentResp CreateShipmentResponse
	if err := json.Unmarshal(body, &shipmentResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if shipmentResp.Status != "success" {
		return &shipmentResp, fmt.Errorf("API returned non-success status: %s", shipmentResp.Status)
	}

	return &shipmentResp, nil
}

// ============== Track Shipment ==============

// TrackResponse represents the shipment tracking response
type TrackResponse struct {
	Status string      `json:"status"`
	Data   TrackingData `json:"data"`
	Error  *APIError    `json:"error,omitempty"`
}

// TrackingData contains tracking information
type TrackingData struct {
	ShipmentID    string         `json:"shipment_id"`
	TrackingID    string         `json:"tracking_id"`
	AwbNumber     string         `json:"awb_number"`
	CourierCode   string         `json:"courier_code"`
	Status        string         `json:"status"`
	StatusDetail  string         `json:"status_detail"`
	DeliveredAt   *time.Time     `json:"delivered_at,omitempty"`
	ETD           *time.Time     `json:"etd,omitempty"`
	PodImage      string         `json:"pod_image,omitempty"`
	Events        []TrackingEvent `json:"events"`
}

// TrackingEvent represents a tracking event
type TrackingEvent struct {
	Status    string    `json:"status"`
	StatusDetail string `json:"status_detail"`
	Address   string    `json:"address,omitempty"`
	City      string    `json:"city,omitempty"`
	State     string    `json:"state,omitempty"`
	Country   string    `json:"country,omitempty"`
	ZipCode   string    `json:"zipcode,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message,omitempty"`
}

// TrackShipment tracks a shipment by tracking ID
func (s *BiteshipService) TrackShipment(ctx context.Context, trackingID string) (*TrackResponse, error) {
	url := fmt.Sprintf("%s/shipments/%s/track", s.baseURL, trackingID)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var trackResp TrackResponse
	if err := json.Unmarshal(body, &trackResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if trackResp.Status != "success" {
		return &trackResp, fmt.Errorf("API returned non-success status: %s", trackResp.Status)
	}

	return &trackResp, nil
}

// ============== API Error ==============

// APIError represents a Biteship API error
type APIError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
	StackTrace string `json:"stack_trace,omitempty"`
}

func (e *APIError) Error() string {
	return fmt.Sprintf("Biteship API Error [%s]: %s", e.Code, e.Message)
}

// UnmarshalJSON custom unmarshaler to support both JSON string and JSON object formats
func (e *APIError) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		return nil
	}

	// If the JSON value starts with a double quote, it is a JSON string
	if data[0] == '"' {
		var s string
		if err := json.Unmarshal(data, &s); err != nil {
			return err
		}
		e.Message = s
		return nil
	}

	// Otherwise, unmarshal as standard JSON object
	type Alias APIError
	var aux Alias
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	*e = APIError(aux)
	return nil
}

// ============== Webhook Validation ==============

// WebhookEvent represents a Biteship webhook event
type WebhookEvent struct {
	Type      string          `json:"type"` // "tracking.updated", "shipment.created", etc.
	Data      WebhookEventData `json:"data"`
	Timestamp string          `json:"timestamp"`
}

// WebhookEventData contains webhook event data
type WebhookEventData struct {
	ShipmentID    string `json:"shipment_id"`
	TrackingID    string `json:"tracking_id"`
	AwbNumber     string `json:"awb_number"`
	CourierCode   string `json:"courier_code"`
	Status        string `json:"status"`
	StatusDetail  string `json:"status_detail"`
	UpdatedAt     string `json:"updated_at"`
	DeliveredAt   string `json:"delivered_at,omitempty"`
}

// ValidateWebhook validates Biteship webhook signature
func (s *BiteshipService) ValidateWebhook(secretKey, payload, signature string) bool {
	// Biteship uses HMAC SHA256 for webhook signatures
	// Implementation depends on Biteship's exact signature format
	// This is a placeholder - adjust based on actual Biteship webhook docs
	
	if secretKey == "" {
		log.Printf("Warning: BITESHIP_WEBHOOK_SECRET not set, skipping webhook validation")
		return true // Allow in development
	}
	
	// TODO: Implement HMAC validation based on Biteship's webhook signature format
	// For now, return true - adjust this based on actual Biteship webhook documentation
	log.Printf("Webhook validation placeholder - signature: %s", signature)
	return true
}
