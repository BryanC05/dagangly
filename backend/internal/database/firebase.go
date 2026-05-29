package database

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var firebaseApp *firebase.App
var authClient *auth.Client

// InitFirebase initializes the Firebase Admin SDK
func InitFirebase() error {
	ctx := context.Background()
	
	// In a real production environment, you would provide a path to a service account JSON file
	// via environment variable FIREBASE_SERVICE_ACCOUNT_PATH.
	// For now, we initialize without specific credentials which works if running on GCP
	// or if GOOGLE_APPLICATION_CREDENTIALS is set.
	// If neither is available, it will fail, but we'll log it and continue.
	
	var app *firebase.App
	var err error
	
	// Try to initialize with default credentials
	app, err = firebase.NewApp(ctx, nil)
	if err != nil {
		log.Printf("[Firebase] Failed to initialize with default credentials: %v", err)
		return err
	}

	client, err := app.Auth(ctx)
	if err != nil {
		log.Printf("[Firebase] Failed to get Auth client: %v", err)
		return err
	}

	firebaseApp = app
	authClient = client
	fmt.Println("🔥 Firebase Admin SDK initialized")
	return nil
}

// VerifyIDToken verifies a Firebase ID token
func VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	if authClient == nil {
		return nil, fmt.Errorf("firebase auth client not initialized")
	}
	return authClient.VerifyIDToken(ctx, idToken)
}
