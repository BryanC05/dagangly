package main

import (
	"fmt"
	"log"
	"os"

	"msme-marketplace/internal/config"
	"msme-marketplace/internal/database"
	"msme-marketplace/internal/handlers"
	"msme-marketplace/internal/middleware"
	"msme-marketplace/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		if fallbackErr := godotenv.Load("../.env"); fallbackErr != nil {
			log.Println("Warning: .env file not found, using environment variables")
		}
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	// Log connection info (without exposing credentials)
	log.Printf("Connecting to MongoDB (NodeEnv: %s)...", cfg.NodeEnv)

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

	websocket.Init(cfg.JWTSecret)

	r.GET("/ws", websocket.GetHub().HandleWebSocket)

	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	productHandler := handlers.NewProductHandler()
	orderHandler := handlers.NewOrderHandler()
	driverHandler := handlers.NewDriverHandler()
	chatHandler := handlers.NewChatHandler()
	forumHandler := handlers.NewForumHandler()
	workflowHandler := handlers.NewWorkflowHandler()
	logoHandler := handlers.NewLogoHandler()
	businessHandler := handlers.NewBusinessHandler()
	navigationHandler := handlers.NewNavigationHandler()
	webhookHandler := handlers.NewWebhookHandler()
	productImageHandler := handlers.NewProductImageHandler(cfg)
	notificationHandler := handlers.NewNotificationHandler()
	reviewHandler := handlers.NewReviewHandler()
	promoHandler := handlers.NewPromoHandler()
	analyticsHandler := handlers.NewAnalyticsHandler()
	reportHandler := handlers.NewReportHandler()
	projectHandler := handlers.NewProjectHandler()
	recommendationHandler := handlers.NewRecommendationHandler()
	walletHandler := handlers.NewWalletHandler()
	whatsAppHandler := handlers.NewWhatsAppHandler()
	adminHandler := handlers.NewAdminHandler()
	videoCallHandler := handlers.NewVideoCallHandler()
	installmentHandler := handlers.NewInstallmentHandler()

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.PUT("/profile", middleware.AuthRequired(cfg.JWTSecret), authHandler.UpdateProfile)
		}

		users := api.Group("/users")
		users.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
			users.GET("/saved-products", userHandler.GetSavedProducts)
			users.POST("/saved-products/:productId", userHandler.SaveProduct)
			users.DELETE("/saved-products/:productId", userHandler.UnsaveProduct)
			users.GET("/saved-products/check/:productId", userHandler.CheckSavedProduct)

			// Membership routes
			users.GET("/membership/status", userHandler.GetMembershipStatus)
			users.POST("/membership/payment", userHandler.SubmitMembershipPayment)

			// Instagram routes
			users.GET("/instagram/status", handlers.InstagramStatus)
			users.GET("/instagram/connect", handlers.InstagramConnect)
			users.GET("/instagram/callback", handlers.InstagramCallback)
			users.POST("/instagram/disconnect", handlers.InstagramDisconnect)
			users.POST("/instagram/set-default", handlers.InstagramSetDefault)
			users.POST("/instagram/preference", handlers.InstagramSetPostPreference)
			users.GET("/instagram/preference", handlers.GetInstagramPostPreference)

			// Social links routes
			users.GET("/social-links", handlers.GetSocialLinks)
			users.PUT("/social-links", handlers.UpdateSocialLinks)
			users.POST("/social-links", handlers.AddSocialLink)
			users.DELETE("/social-links", handlers.RemoveSocialLink)
		}

		// Admin routes for membership management
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			admin.GET("/membership/pending", userHandler.GetPendingMemberships)
			admin.POST("/membership/approve/:memberId", userHandler.ApproveMembership)
			admin.POST("/membership/reject/:memberId", userHandler.RejectMembership)
			admin.POST("/membership/extend/:memberId", userHandler.ExtendMembership)

			// Dashboard & Stats
			admin.GET("/dashboard", adminHandler.GetDashboardStats)
			admin.GET("/revenue", adminHandler.GetRevenueReport)

			// User Management
			admin.GET("/users", adminHandler.GetUsers)
			admin.PUT("/users/:id/role", adminHandler.UpdateUserRole)
			admin.POST("/users/:id/ban", adminHandler.BanUser)

			// Product Management
			admin.GET("/products", adminHandler.GetProducts)
			admin.POST("/products/:id/approve", adminHandler.ApproveProduct)
			admin.POST("/products/:id/reject", adminHandler.RejectProduct)
			admin.DELETE("/products/:id", adminHandler.DeleteProduct)

			// Order Management
			admin.GET("/orders", adminHandler.GetOrders)
			admin.PUT("/orders/:id/status", adminHandler.UpdateOrderStatus)

			// Dispute Management
			admin.GET("/disputes", adminHandler.GetDisputes)
			admin.PUT("/disputes/:id/resolve", adminHandler.ResolveDispute)
		}

		api.GET("/users/sellers/count", userHandler.GetSellersCount)
		api.GET("/users/nearby-sellers", userHandler.GetNearbySellers)
		api.GET("/users/seller/:id", userHandler.GetSellerByID)
		api.GET("/users/:id/social-links", handlers.GetSocialLinks)
		api.GET("/navigation/route", navigationHandler.GetRoute)

		products := api.Group("/products")
		{
			products.GET("", productHandler.GetProducts)
			products.GET("/categories/counts", productHandler.GetCategoryCounts)
			products.GET("/seller/:sellerId", productHandler.GetProductsBySeller)
			products.GET("/:id", productHandler.GetProductByID)

			products.POST("", middleware.AuthRequired(cfg.JWTSecret), productHandler.CreateProduct)
			products.PUT("/:id", middleware.AuthRequired(cfg.JWTSecret), productHandler.UpdateProduct)
			products.DELETE("/:id", middleware.AuthRequired(cfg.JWTSecret), productHandler.DeleteProduct)

			products.GET("/my-products", middleware.AuthRequired(cfg.JWTSecret), productHandler.GetMyProducts)
			products.GET("/low-stock", middleware.AuthRequired(cfg.JWTSecret), productHandler.GetLowStockProducts)
			products.POST("/:id/adjust-stock", middleware.AuthRequired(cfg.JWTSecret), productHandler.AdjustStock)
		}

		projects := api.Group("/projects")
		{
			projects.GET("", projectHandler.GetProjects)
			projects.GET("/:id", projectHandler.GetProjectByID)
			projects.POST("", projectHandler.CreateProject)
			projects.PUT("/:id", middleware.AuthRequired(cfg.JWTSecret), projectHandler.UpdateProject)
			projects.DELETE("/:id", middleware.AuthRequired(cfg.JWTSecret), projectHandler.DeleteProject)
			projects.GET("/my-projects", middleware.AuthRequired(cfg.JWTSecret), projectHandler.GetMyProjects)
		}

		productImages := api.Group("/product-images")
		productImages.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			productImages.POST("/process", productImageHandler.ProcessImage)
			productImages.POST("/preview-enhance", productImageHandler.PreviewEnhance)
			productImages.DELETE("/cleanup", productImageHandler.Cleanup)
		}

		orders := api.Group("/orders")
		orders.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			orders.GET("/my-orders", orderHandler.GetMyOrders)
			orders.GET("/:id", orderHandler.GetOrderByID)
			orders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			orders.PUT("/:id/payment", orderHandler.UpdatePayment)
			orders.PUT("/:id/seller-response", orderHandler.SellerResponse)
			orders.PUT("/:id/buyer-confirm", orderHandler.BuyerConfirm)
			orders.GET("/:id/chat-room", orderHandler.GetOrderChatRoom)
			orders.GET("/seller/product-tracking", orderHandler.GetProductTracking)

			// Driver tracking routes
			orders.POST("/:id/driver/location", orderHandler.UpdateDriverLocation)
			orders.GET("/:id/driver/location", orderHandler.GetDriverLocation)
			orders.POST("/:id/driver/assign", orderHandler.AssignDriver)
			orders.GET("/:id/timeline", orderHandler.GetOrderTimeline)
		}

		// Payment routes (Midtrans)
		paymentHandler := handlers.NewPaymentHandler(cfg)
		payments := api.Group("/payments")
		payments.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			payments.POST("/create", paymentHandler.CreatePayment)
			payments.GET("/:orderId/status", paymentHandler.GetPaymentStatus)
		}
		api.POST("/webhooks/midtrans", paymentHandler.MidtransWebhook)

		// Device registration for push notifications
		deviceHandler := handlers.NewDeviceHandler()
		devices := api.Group("/devices")
		devices.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			devices.POST("/register", deviceHandler.RegisterDevice)
			devices.DELETE("/:token", deviceHandler.UnregisterDevice)
			devices.GET("", deviceHandler.GetRegisteredDevices)
			devices.PUT("/push-token", deviceHandler.UpdatePushToken)
		}

		// Cart Abandonment Tracking
		cartHandler := handlers.NewCartAbandonmentHandler()
		cartAbandonment := api.Group("/cart-abandonment")
		cartAbandonment.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			cartAbandonment.POST("/track", cartHandler.TrackCartAbandonment)
			cartAbandonment.POST("/recovered", cartHandler.MarkCartRecovered)
			cartAbandonment.GET("", cartHandler.GetAbandonedCarts)
		}

		driver := api.Group("/driver")
		driver.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			driver.POST("/toggle", driverHandler.ToggleDriverMode)
			driver.GET("/profile", driverHandler.GetDriverProfile)
			driver.PUT("/profile", driverHandler.UpdateDriverProfile)
			driver.PUT("/location", driverHandler.UpdateDriverLocation)
			driver.PUT("/push-token", driverHandler.SavePushToken)
			driver.GET("/stats", driverHandler.GetDriverStats)
			driver.GET("/available-orders", driverHandler.GetAvailableOrders)
			driver.POST("/claim/:id", driverHandler.ClaimOrder)
			driver.GET("/active-delivery", driverHandler.GetActiveDelivery)
			driver.POST("/status/:id", driverHandler.UpdateDeliveryStatus)
			driver.POST("/complete/:id", driverHandler.CompleteDelivery)
			driver.GET("/history", driverHandler.GetDeliveryHistory)
			driver.GET("/earnings", driverHandler.GetEarningsHistory)
		}

		driverRating := api.Group("/driver-rating")
		driverRating.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			driverRating.POST("/:orderId", driverHandler.RateDriver)
		}

		chat := api.Group("/chat")
		chat.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			chat.POST("/rooms", chatHandler.CreateChatRoom)
			chat.POST("/rooms/direct", chatHandler.CreateDirectChatRoom)
			chat.GET("/rooms", chatHandler.GetChatRooms)
			chat.DELETE("/rooms/:roomId", chatHandler.HideChatRoom)
			chat.GET("/rooms/direct/my-stores", chatHandler.GetMyStores)
			chat.GET("/rooms/direct/my-customers", chatHandler.GetMyCustomers)
			chat.GET("/rooms/:roomId/messages", chatHandler.GetMessages)
			chat.POST("/rooms/:roomId/messages", chatHandler.SendMessage)
			chat.GET("/rooms/:roomId/unread-count", chatHandler.GetUnreadCount)
		}

		forum := api.Group("/forum")
		{
			forum.GET("", forumHandler.GetThreads)
			forum.GET("/:id", forumHandler.GetThread)

			forum.POST("", middleware.AuthRequired(cfg.JWTSecret), forumHandler.CreateThread)
			forum.PUT("/:id", middleware.AuthRequired(cfg.JWTSecret), forumHandler.UpdateThread)
			forum.DELETE("/:id", middleware.AuthRequired(cfg.JWTSecret), forumHandler.DeleteThread)
			forum.POST("/:id/reply", middleware.AuthRequired(cfg.JWTSecret), forumHandler.CreateReply)
			forum.POST("/:id/like", middleware.AuthRequired(cfg.JWTSecret), forumHandler.LikeThread)
			forum.POST("/reply/:id/like", middleware.AuthRequired(cfg.JWTSecret), forumHandler.LikeReply)
		}

		workflows := api.Group("/workflows")
		workflows.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			workflows.GET("", workflowHandler.GetWorkflows)
			workflows.POST("", workflowHandler.CreateWorkflow)
			workflows.PATCH("/:id/toggle", workflowHandler.ToggleWorkflow)
			workflows.DELETE("/:id", workflowHandler.DeleteWorkflow)
		}

		webhooks := api.Group("/webhooks")
		{
			webhooks.POST("/n8n/callback", webhookHandler.N8nCallback)
			webhooks.POST("/test", middleware.AuthRequired(cfg.JWTSecret), webhookHandler.TestWebhook)
		}

		logo := api.Group("/logo")
		logo.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			logo.POST("/generate", logoHandler.GenerateLogo)
			logo.GET("/history", logoHandler.GetLogoHistory)
			logo.GET("/status", logoHandler.GetLogoStatus)
			logo.POST("/reset-limit", logoHandler.ResetLogoLimit)
			logo.PUT("/select/:logoId", logoHandler.SelectLogo)
			logo.DELETE("/:logoId", logoHandler.DeleteLogo)
			logo.POST("/upload", logoHandler.UploadCustomLogo)
		}

		// Business routes
		business := api.Group("/business")
		business.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			business.GET("/my", businessHandler.GetMyBusiness)
			business.POST("", businessHandler.CreateBusiness)
			business.PUT("", businessHandler.UpdateBusiness)
			business.PUT("/logo", businessHandler.UpdateBusinessLogo)
			business.DELETE("", businessHandler.DeleteBusiness)
		}
		// Public business endpoint
		api.GET("/business/:id", businessHandler.GetBusinessByID)

		notifications := api.Group("/notifications")
		notifications.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			notifications.GET("", notificationHandler.GetNotifications)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
			notifications.PUT("/read-all", notificationHandler.MarkAllRead)
			notifications.DELETE("/:id", notificationHandler.Delete)
			notifications.DELETE("/delete-all", notificationHandler.DeleteAll)
			notifications.POST("/test", notificationHandler.SendTestNotification)
		}

		// Reviews - public read, authenticated write
		api.GET("/products/:id/reviews", reviewHandler.GetProductReviews)
		reviews := api.Group("/reviews")
		reviews.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			reviews.POST("", reviewHandler.CreateReview)
			reviews.GET("/mine", reviewHandler.GetMyReviews)
			reviews.DELETE("/:id", reviewHandler.DeleteReview)
		}

		// Promos
		promos := api.Group("/promos")
		promos.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			promos.POST("", promoHandler.CreatePromo)
			promos.GET("", promoHandler.GetMyPromos)
			promos.POST("/validate", promoHandler.ValidatePromo)
			promos.DELETE("/:id", promoHandler.DeletePromo)
		}

		// Analytics
		analytics := api.Group("/analytics")
		{
			analytics.GET("/recommended", recommendationHandler.GetRecommendations)
			analytics.GET("/trending", recommendationHandler.GetTrendingProducts)
			analytics.GET("/similar/:id", recommendationHandler.GetSimilarProducts)
			analytics.GET("/frequently-bought/:id", recommendationHandler.GetFrequentlyBoughtTogether)
		}

		// User history (authenticated)
		userHistory := api.Group("/user")
		userHistory.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			userHistory.POST("/view-history", recommendationHandler.RecordViewHistory)
			userHistory.GET("/view-history", recommendationHandler.GetViewHistory)
			userHistory.DELETE("/view-history", recommendationHandler.ClearViewHistory)
		}

		// Analytics (authenticated)
		analyticsAuth := api.Group("/analytics")
		analyticsAuth.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			analyticsAuth.GET("/sales", analyticsHandler.GetSalesAnalytics)
			analyticsAuth.GET("/recommended", analyticsHandler.GetRecommended)
			analyticsAuth.GET("/seller", analyticsHandler.GetSellerAnalytics)
			analyticsAuth.GET("/customers", analyticsHandler.GetCustomerInsights)
			analyticsAuth.GET("/products", analyticsHandler.GetProductPerformance)
		}

		// Reports & Disputes
		reports := api.Group("/reports")
		reports.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			reports.POST("", reportHandler.CreateReport)
			reports.GET("", reportHandler.GetReports)
			reports.POST("/fraud", reportHandler.CreateFraudReport)
		}

		disputes := api.Group("/disputes")
		disputes.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			disputes.POST("", reportHandler.CreateDispute)
			disputes.GET("", reportHandler.GetMyDisputes)
			disputes.PUT("/:id/resolve", reportHandler.ResolveDispute)
		}

		// AI Features
		aiHandler := handlers.NewAIHandler()
		ai := api.Group("/ai")
		ai.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			ai.POST("/generate-description", aiHandler.GenerateDescription)
		}

		// Wishlists
		wishlistHandler := handlers.NewWishlistHandler()
		wishlists := api.Group("/wishlists")
		wishlists.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			wishlists.GET("", wishlistHandler.GetWishlists)
			wishlists.POST("", wishlistHandler.CreateWishlist)
			wishlists.GET("/check", wishlistHandler.CheckProductInWishlists)
			wishlists.GET("/:id", wishlistHandler.GetWishlistByID)
			wishlists.PUT("/:id", wishlistHandler.UpdateWishlist)
			wishlists.DELETE("/:id", wishlistHandler.DeleteWishlist)
			wishlists.POST("/:id/items", wishlistHandler.AddItemToWishlist)
			wishlists.DELETE("/:id/items/:productId", wishlistHandler.RemoveItemFromWishlist)
			wishlists.POST("/default/items", wishlistHandler.AddToDefaultWishlist)
			wishlists.DELETE("/default/items/:productId", wishlistHandler.RemoveFromDefaultWishlist)
		}
		api.GET("/wishlists/public/:shareLink", wishlistHandler.GetPublicWishlist)

		// Digital Wallet
		wallet := api.Group("/wallet")
		wallet.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			wallet.GET("", walletHandler.GetWallet)
			wallet.POST("/add-funds", walletHandler.AddFunds)
			wallet.POST("/deduct", walletHandler.DeductFunds)
			wallet.GET("/transactions", walletHandler.GetTransactions)
			wallet.POST("/transfer-bank", walletHandler.TransferToBank)
		}

		// WhatsApp Integration
		whatsapp := api.Group("/whatsapp")
		{
			whatsapp.POST("/generate-link", whatsAppHandler.GenerateWhatsAppLink)
			whatsapp.GET("/seller/:sellerId", whatsAppHandler.GetSellerWhatsApp)
		}

		// Video Call Integration
		videoCall := api.Group("/video-call")
		videoCall.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			videoCall.POST("/room", videoCallHandler.CreateRoom)
			videoCall.GET("/rooms", videoCallHandler.GetRooms)
			videoCall.GET("/room/:roomId", videoCallHandler.GetRoom)
			videoCall.PUT("/room/:roomId/status", videoCallHandler.UpdateRoomStatus)
			videoCall.POST("/room/:roomId/end", videoCallHandler.EndRoom)
			videoCall.GET("/upcoming", videoCallHandler.GetUpcomingCalls)
		}

		// Installment Payments
		installments := api.Group("/installments")
		installments.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			installments.POST("/calculate", installmentHandler.CalculateInstallment)
			installments.POST("/create-plan", installmentHandler.CreateInstallmentPlan)
			installments.GET("/my", installmentHandler.GetMyInstallments)
			installments.GET("/plan/:planId", installmentHandler.GetInstallmentPlan)
			installments.POST("/plan/:planId/pay", installmentHandler.PayInstallment)
		}
	}

	// Ensure database indexes
	businessHandler.EnsureIndexes()

	os.MkdirAll("./uploads/logos", 0755)
	os.MkdirAll("./uploads/products", 0755)
	os.MkdirAll("./uploads/forum", 0755)

	port := cfg.Port
	if port == "" {
		port = "5000"
	}

	fmt.Printf("🚀 Server running on port %s\n", port)
	r.Run("0.0.0.0:" + port)
}
