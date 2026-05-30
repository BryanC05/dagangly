package database

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var firebaseApp *firebase.App
var authClient *auth.Client

// InitFirebase initializes the Firebase Admin SDK
func InitFirebase() error {
	ctx := context.Background()
	
	var app *firebase.App
	var err error
	
	// We only need token verification, which doesn't strictly require a service account 
	// if we provide the ProjectID and use option.WithoutAuthentication()
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "dagangly-24a52"
	}
	
	config := &firebase.Config{ProjectID: projectID}
	app, err = firebase.NewApp(ctx, config, option.WithoutAuthentication())
	
	if err != nil {
		log.Printf("[Firebase] Failed to initialize: %v", err)
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
