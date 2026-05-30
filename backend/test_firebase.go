package main

import (
	"context"
	"fmt"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func main() {
	config := &firebase.Config{ProjectID: "dagangly-24a52"}
	app, err := firebase.NewApp(context.Background(), config, option.WithoutAuthentication())
	if err != nil {
		fmt.Println("App error:", err)
		return
	}
	client, err := app.Auth(context.Background())
	if err != nil {
		fmt.Println("Auth error:", err)
		return
	}
	fmt.Println("Success!", client != nil)
}
