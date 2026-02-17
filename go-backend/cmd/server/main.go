package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"msme-marketplace/internal/config"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/handlers"
	"msme-marketplace/internal/middleware"
	"msme-marketplace/internal/websocket"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	cfg := config.Load()

	err = database.Connect(cfg.MongoDBURI, "msme_marketplace")
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	r.Static("/uploads", "./uploads")

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"message": "MSME Marketplace API is running",
		})
	})

	websocket.Init()

	r.GET("/ws", websocket.GetHub().HandleWebSocket)

	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	productHandler := handlers.NewProductHandler()
	orderHandler := handlers.NewOrderHandler()
	chatHandler := handlers.NewChatHandler()
	forumHandler := handlers.NewForumHandler()
	workflowHandler := handlers.NewWorkflowHandler()
	logoHandler := handlers.NewLogoHandler()
	webhookHandler := handlers.NewWebhookHandler()

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.PUT("/profile", middleware.AuthRequired(), authHandler.UpdateProfile)
		}

		users := api.Group("/users")
		users.Use(middleware.AuthRequired())
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
			users.GET("/saved-products", userHandler.GetSavedProducts)
			users.POST("/saved-products/:productId", userHandler.SaveProduct)
			users.DELETE("/saved-products/:productId", userHandler.UnsaveProduct)
			users.GET("/saved-products/check/:productId", userHandler.CheckSavedProduct)
		}

		api.GET("/users/sellers/count", userHandler.GetSellersCount)
		api.GET("/users/nearby-sellers", userHandler.GetNearbySellers)
		api.GET("/users/seller/:id", userHandler.GetSellerByID)

		products := api.Group("/products")
		{
			products.GET("/", productHandler.GetProducts)
			products.GET("/categories/counts", productHandler.GetCategoryCounts)
			products.GET("/seller/:sellerId", productHandler.GetProductsBySeller)
			products.GET("/:id", productHandler.GetProductByID)

			products.POST("/", middleware.AuthRequired(), productHandler.CreateProduct)
			products.PUT("/:id", middleware.AuthRequired(), productHandler.UpdateProduct)
			products.DELETE("/:id", middleware.AuthRequired(), productHandler.DeleteProduct)

			products.GET("/my-products", middleware.AuthRequired(), productHandler.GetMyProducts)
		}

		orders := api.Group("/orders")
		orders.Use(middleware.AuthRequired())
		{
			orders.GET("/my-orders", orderHandler.GetMyOrders)
			orders.GET("/:id", orderHandler.GetOrderByID)
			orders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			orders.PUT("/:id/payment", orderHandler.UpdatePayment)
			orders.GET("/:id/chat-room", orderHandler.GetOrderChatRoom)
			orders.GET("/seller/product-tracking", orderHandler.GetProductTracking)

			orders.POST("/", orderHandler.CreateOrder)
		}

		chat := api.Group("/chat")
		chat.Use(middleware.AuthRequired())
		{
			chat.POST("/rooms", chatHandler.CreateChatRoom)
			chat.POST("/rooms/direct", chatHandler.CreateDirectChatRoom)
			chat.GET("/rooms", chatHandler.GetChatRooms)
			chat.GET("/rooms/direct/my-stores", chatHandler.GetMyStores)
			chat.GET("/rooms/direct/my-customers", chatHandler.GetMyCustomers)
			chat.GET("/rooms/:roomId/messages", chatHandler.GetMessages)
			chat.POST("/rooms/:roomId/messages", chatHandler.SendMessage)
			chat.GET("/rooms/:roomId/unread-count", chatHandler.GetUnreadCount)
		}

		forum := api.Group("/forum")
		{
			forum.GET("/", forumHandler.GetThreads)
			forum.GET("/:id", forumHandler.GetThread)

			forum.POST("/", middleware.AuthRequired(), forumHandler.CreateThread)
			forum.PUT("/:id", middleware.AuthRequired(), forumHandler.UpdateThread)
			forum.DELETE("/:id", middleware.AuthRequired(), forumHandler.DeleteThread)
			forum.POST("/:id/reply", middleware.AuthRequired(), forumHandler.CreateReply)
			forum.POST("/:id/like", middleware.AuthRequired(), forumHandler.LikeThread)
			forum.POST("/reply/:id/like", middleware.AuthRequired(), forumHandler.LikeReply)
		}

		workflows := api.Group("/workflows")
		workflows.Use(middleware.AuthRequired())
		{
			workflows.GET("/", workflowHandler.GetWorkflows)
			workflows.POST("/", workflowHandler.CreateWorkflow)
			workflows.PATCH("/:id/toggle", workflowHandler.ToggleWorkflow)
			workflows.DELETE("/:id", workflowHandler.DeleteWorkflow)
		}

		webhooks := api.Group("/webhooks")
		{
			webhooks.POST("/n8n/callback", webhookHandler.N8nCallback)
			webhooks.POST("/test", middleware.AuthRequired(), webhookHandler.TestWebhook)
		}

		logo := api.Group("/logo")
		logo.Use(middleware.AuthRequired())
		{
			logo.POST("/generate", logoHandler.GenerateLogo)
			logo.GET("/history", logoHandler.GetLogoHistory)
			logo.GET("/status", logoHandler.GetLogoStatus)
			logo.PUT("/select/:logoId", logoHandler.SelectLogo)
			logo.DELETE("/:logoId", logoHandler.DeleteLogo)
			logo.POST("/upload", logoHandler.UploadCustomLogo)
		}
	}

	os.MkdirAll("./uploads/logos", 0755)
	os.MkdirAll("./uploads/forum", 0755)

	port := cfg.Port
	if port == "" {
		port = "5000"
	}

	fmt.Printf("🚀 Server running on port %s\n", port)
	r.Run(":" + port)
}
