package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

func (h *ChatHandler) CreateChatRoom(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		OrderID string `json:"orderId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	orderObjID, err := primitive.ObjectIDFromHex(req.OrderID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid order ID"})
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&order)
	if err != nil {
		c.JSON(404, gin.H{"message": "Order not found"})
		return
	}

	if order.Buyer != userObjID && order.Seller != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized for this order"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var existingChatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{
		"order":  orderObjID,
		"buyer":  order.Buyer,
		"seller": order.Seller,
	}).Decode(&existingChatRoom)

	var chatRoom models.ChatRoom
	if err != nil {
		chatRoom = models.ChatRoom{
			Order:    &orderObjID,
			Buyer:    order.Buyer,
			Seller:   order.Seller,
			ChatType: "order",
		}
		result, err := chatRoomsCollection.InsertOne(context.Background(), chatRoom)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create chat room"})
			return
		}
		chatRoom.ID = result.InsertedID.(primitive.ObjectID)
	} else {
		chatRoom = existingChatRoom
	}

	c.JSON(201, chatRoom)
}

func (h *ChatHandler) CreateDirectChatRoom(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	var req struct {
		SellerID string `json:"sellerId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	sellerObjID, err := primitive.ObjectIDFromHex(req.SellerID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid seller ID"})
		return
	}

	if userObjID == sellerObjID {
		c.JSON(400, gin.H{"message": "Cannot create chat with yourself"})
		return
	}

	usersCollection := database.GetDB().Collection("users")
	var seller models.User
	err = usersCollection.FindOne(context.Background(), bson.M{"_id": sellerObjID}).Decode(&seller)
	if err != nil {
		c.JSON(404, gin.H{"message": "User not found"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var existingChatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{
		"buyer":    userObjID,
		"seller":   sellerObjID,
		"chatType": "direct",
		"order":    nil,
	}).Decode(&existingChatRoom)

	var chatRoom models.ChatRoom
	if err != nil {
		// Create new chat room
		chatRoom = models.ChatRoom{
			Buyer:    userObjID,
			Seller:   sellerObjID,
			ChatType: "direct",
		}
		result, err := chatRoomsCollection.InsertOne(context.Background(), chatRoom)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create chat room"})
			return
		}
		chatRoom.ID = result.InsertedID.(primitive.ObjectID)
	} else {
		chatRoom = existingChatRoom

		// Check if chat was hidden by this user - if so, unhide it
		hiddenBy := chatRoom.HiddenBy
		if hiddenBy == nil {
			hiddenBy = []primitive.ObjectID{}
		}
		isHidden := false
		for _, id := range hiddenBy {
			if id == userObjID {
				isHidden = true
				break
			}
		}
		if isHidden {
			// Remove user from hiddenBy array
			chatRoomsCollection.UpdateOne(context.Background(), bson.M{"_id": chatRoom.ID}, bson.M{
				"$pull": bson.M{"hiddenBy": userObjID},
			})
		}
	}

	// Populate buyer and seller info for response
	var buyerInfo models.User
	var sellerInfo models.User
	usersCollection.FindOne(context.Background(), bson.M{"_id": chatRoom.Buyer}).Decode(&buyerInfo)
	usersCollection.FindOne(context.Background(), bson.M{"_id": chatRoom.Seller}).Decode(&sellerInfo)

	c.JSON(201, gin.H{
		"_id":       chatRoom.ID,
		"buyer":     gin.H{"_id": buyerInfo.ID, "name": buyerInfo.Name, "businessName": buyerInfo.BusinessName},
		"seller":    gin.H{"_id": sellerInfo.ID, "name": sellerInfo.Name, "businessName": sellerInfo.BusinessName},
		"chatType":  chatRoom.ChatType,
		"createdAt": chatRoom.CreatedAt,
		"updatedAt": chatRoom.UpdatedAt,
	})
}

func (h *ChatHandler) GetChatRooms(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	chatType := c.Query("chatType")

	filter := bson.M{
		"$or": []bson.M{
			{"seller": userObjID},
			{"buyer": userObjID},
		},
		"hiddenBy": bson.M{
			"$ne": userObjID,
		},
	}
	if chatType != "" {
		filter["chatType"] = chatType
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	cursor, err := chatRoomsCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var chatRooms []models.ChatRoom
	if err := cursor.All(context.Background(), &chatRooms); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	usersCollection := database.GetDB().Collection("users")
	messagesCollection := database.GetDB().Collection("messages")

	var roomsWithUnread []gin.H
	for _, room := range chatRooms {
		isRoomSeller := room.Seller == userObjID
		unreadCount := 0
		if isRoomSeller {
			unreadCount = room.UnreadCount.Seller
		} else {
			unreadCount = room.UnreadCount.Buyer
		}

		// Populate buyer and seller info
		var buyer models.User
		var seller models.User
		usersCollection.FindOne(context.Background(), bson.M{"_id": room.Buyer}).Decode(&buyer)
		usersCollection.FindOne(context.Background(), bson.M{"_id": room.Seller}).Decode(&seller)

		// Populate lastMessage content
		var lastMsg models.Message
		var lastMessageContent interface{}
		if room.LastMessage != nil {
			err := messagesCollection.FindOne(context.Background(), bson.M{"_id": *room.LastMessage}).Decode(&lastMsg)
			if err == nil {
				lastMessageContent = gin.H{
					"_id":       lastMsg.ID,
					"content":   lastMsg.Content,
					"createdAt": lastMsg.CreatedAt,
				}
			}
		}

		roomsWithUnread = append(roomsWithUnread, gin.H{
			"_id":         room.ID,
			"order":       room.Order,
			"buyer":       gin.H{"_id": buyer.ID, "name": buyer.Name, "businessName": buyer.BusinessName},
			"seller":      gin.H{"_id": seller.ID, "name": seller.Name, "businessName": seller.BusinessName},
			"chatType":    room.ChatType,
			"lastMessage": lastMessageContent,
			"unreadCount": unreadCount,
			"createdAt":   room.CreatedAt,
			"updatedAt":   room.UpdatedAt,
		})
	}

	c.JSON(200, roomsWithUnread)
}

func (h *ChatHandler) GetMyStores(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	cursor, err := chatRoomsCollection.Find(context.Background(), bson.M{
		"buyer":    userObjID,
		"chatType": "direct",
		"hiddenBy": bson.M{
			"$ne": userObjID,
		},
	})
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var chatRooms []models.ChatRoom
	if err := cursor.All(context.Background(), &chatRooms); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	var roomsWithUnread []gin.H
	for _, room := range chatRooms {
		roomsWithUnread = append(roomsWithUnread, gin.H{
			"_id":         room.ID,
			"seller":      room.Seller,
			"chatType":    room.ChatType,
			"lastMessage": room.LastMessage,
			"unreadCount": room.UnreadCount.Buyer,
			"createdAt":   room.CreatedAt,
			"updatedAt":   room.UpdatedAt,
		})
	}

	c.JSON(200, roomsWithUnread)
}

func (h *ChatHandler) GetMyCustomers(c *gin.Context) {
	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	cursor, err := chatRoomsCollection.Find(context.Background(), bson.M{
		"seller":   userObjID,
		"chatType": "direct",
		"hiddenBy": bson.M{
			"$ne": userObjID,
		},
	})
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var chatRooms []models.ChatRoom
	if err := cursor.All(context.Background(), &chatRooms); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	var roomsWithUnread []gin.H
	for _, room := range chatRooms {
		roomsWithUnread = append(roomsWithUnread, gin.H{
			"_id":         room.ID,
			"buyer":       room.Buyer,
			"chatType":    room.ChatType,
			"lastMessage": room.LastMessage,
			"unreadCount": room.UnreadCount.Seller,
			"createdAt":   room.CreatedAt,
			"updatedAt":   room.UpdatedAt,
		})
	}

	c.JSON(200, roomsWithUnread)
}

func (h *ChatHandler) HideChatRoom(c *gin.Context) {
	userID := c.GetString("userID")
	roomID := c.Param("roomId")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid room ID"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var chatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{"_id": roomObjID}).Decode(&chatRoom)
	if err != nil {
		c.JSON(404, gin.H{"message": "Chat room not found"})
		return
	}

	// Check if user is part of this chat
	if chatRoom.Buyer != userObjID && chatRoom.Seller != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized for this chat"})
		return
	}

	// Check if already hidden
	hiddenBy := chatRoom.HiddenBy
	if hiddenBy == nil {
		hiddenBy = []primitive.ObjectID{}
	}
	for _, id := range hiddenBy {
		if id == userObjID {
			c.JSON(200, gin.H{"message": "Chat already hidden"})
			return
		}
	}

	// Add user to hiddenBy array using $addToSet to avoid duplicates
	_, err = chatRoomsCollection.UpdateOne(context.Background(), bson.M{"_id": roomObjID}, bson.M{
		"$addToSet": bson.M{"hiddenBy": userObjID},
	})
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to hide chat"})
		return
	}

	c.JSON(200, gin.H{"message": "Chat hidden successfully"})
}

func (h *ChatHandler) GetMessages(c *gin.Context) {
	userID := c.GetString("userID")
	roomID := c.Param("roomId")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid room ID"})
		return
	}

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	skip := (page - 1) * limit

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var chatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{"_id": roomObjID}).Decode(&chatRoom)
	if err != nil {
		c.JSON(404, gin.H{"message": "Chat room not found"})
		return
	}

	if chatRoom.Buyer != userObjID && chatRoom.Seller != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized for this chat"})
		return
	}

	messagesCollection := database.GetDB().Collection("messages")
	cursor, err := messagesCollection.Find(context.Background(), bson.M{"chatRoom": roomObjID})
	if err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}
	defer cursor.Close(context.Background())

	var messages []models.Message
	if err := cursor.All(context.Background(), &messages); err != nil {
		c.JSON(500, gin.H{"message": err.Error()})
		return
	}

	messagesCollection.UpdateMany(context.Background(), bson.M{
		"chatRoom": roomObjID,
		"sender":   bson.M{"$ne": userObjID},
		"isRead":   false,
	}, bson.M{"$set": bson.M{"isRead": true, "readAt": time.Now()}})

	isRoomSeller := chatRoom.Seller == userObjID
	update := bson.M{}
	if isRoomSeller {
		update["unreadCount.seller"] = 0
	} else {
		update["unreadCount.buyer"] = 0
	}
	update["updatedAt"] = time.Now()
	chatRoomsCollection.UpdateOne(context.Background(), bson.M{"_id": roomObjID}, bson.M{"$set": update})

	// Populate sender info for each message
	usersCollection := database.GetDB().Collection("users")
	type PopulatedMessage struct {
		ID          primitive.ObjectID  `json:"_id"`
		ChatRoom    primitive.ObjectID  `json:"chatRoom"`
		Sender      interface{}         `json:"sender"`
		Content     string              `json:"content"`
		MessageType string              `json:"messageType"`
		Attachments []models.Attachment `json:"attachments"`
		IsRead      bool                `json:"isRead"`
		ReadAt      *time.Time          `json:"readAt"`
		CreatedAt   time.Time           `json:"createdAt"`
	}

	var populatedMessages []PopulatedMessage
	for _, msg := range messages {
		var sender models.User
		senderErr := usersCollection.FindOne(context.Background(), bson.M{"_id": msg.Sender}).Decode(&sender)

		var senderInfo interface{}
		if senderErr == nil {
			// Return both name and businessName for the mobile app
			senderInfo = gin.H{
				"_id":          sender.ID,
				"name":         sender.Name,
				"businessName": sender.BusinessName,
			}
		} else {
			senderInfo = gin.H{
				"_id": msg.Sender,
			}
		}

		populatedMessages = append(populatedMessages, PopulatedMessage{
			ID:          msg.ID,
			ChatRoom:    msg.ChatRoom,
			Sender:      senderInfo,
			Content:     msg.Content,
			MessageType: msg.MessageType,
			Attachments: msg.Attachments,
			IsRead:      msg.IsRead,
			ReadAt:      msg.ReadAt,
			CreatedAt:   msg.CreatedAt,
		})
	}

	reversed := make([]PopulatedMessage, len(populatedMessages))
	for i, j := 0, len(populatedMessages)-1; i < j; i, j = i+1, j-1 {
		reversed[i], reversed[j] = populatedMessages[j], populatedMessages[i]
	}

	if len(reversed) > limit {
		reversed = reversed[:limit]
	}
	if skip > 0 && len(reversed) > skip {
		reversed = reversed[skip:]
	} else if skip > 0 {
		reversed = []PopulatedMessage{}
	}

	c.JSON(200, reversed)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID := c.GetString("userID")
	roomID := c.Param("roomId")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid room ID"})
		return
	}

	var req struct {
		Content     string              `json:"content" binding:"required"`
		MessageType string              `json:"messageType"`
		Attachments []models.Attachment `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var chatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{"_id": roomObjID}).Decode(&chatRoom)
	if err != nil {
		c.JSON(404, gin.H{"message": "Chat room not found"})
		return
	}

	if chatRoom.Buyer != userObjID && chatRoom.Seller != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized for this chat"})
		return
	}

	messageType := "text"
	if req.MessageType != "" {
		messageType = req.MessageType
	}

	message := models.Message{
		ChatRoom:    roomObjID,
		Sender:      userObjID,
		Content:     req.Content,
		MessageType: messageType,
		Attachments: req.Attachments,
	}

	messagesCollection := database.GetDB().Collection("messages")
	result, err := messagesCollection.InsertOne(context.Background(), message)
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to send message"})
		return
	}

	message.ID = result.InsertedID.(primitive.ObjectID)

	isRoomSeller := chatRoom.Seller == userObjID
	update := bson.M{
		"lastMessage": message.ID,
		"updatedAt":   time.Now(),
	}
	if isRoomSeller {
		update["unreadCount.buyer"] = chatRoom.UnreadCount.Buyer + 1
	} else {
		update["unreadCount.seller"] = chatRoom.UnreadCount.Seller + 1
	}
	chatRoomsCollection.UpdateOne(context.Background(), bson.M{"_id": roomObjID}, bson.M{"$set": update})

	// Get sender info
	usersCollection := database.GetDB().Collection("users")
	var sender models.User
	usersCollection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&sender)

	// Notify the other participant
	recipientID := chatRoom.Buyer
	if chatRoom.Buyer == userObjID {
		recipientID = chatRoom.Seller
	}

	preview := req.Content
	if len(preview) > 50 {
		preview = preview[:50] + "..."
	}
	go CreateAndSend(recipientID, "new_message", "New Message",
		fmt.Sprintf("%s: %s", sender.Name, preview),
		map[string]interface{}{"chatRoomId": roomID},
	)

	// Return message with populated sender info
	response := gin.H{
		"_id":         message.ID,
		"chatRoom":    message.ChatRoom,
		"sender":      gin.H{"_id": sender.ID, "name": sender.Name, "businessName": sender.BusinessName},
		"content":     message.Content,
		"messageType": message.MessageType,
		"attachments": message.Attachments,
		"isRead":      message.IsRead,
		"readAt":      message.ReadAt,
		"createdAt":   message.CreatedAt,
	}

	c.JSON(201, response)
}

func (h *ChatHandler) GetUnreadCount(c *gin.Context) {
	userID := c.GetString("userID")
	roomID := c.Param("roomId")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid user ID"})
		return
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid room ID"})
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	var chatRoom models.ChatRoom
	err = chatRoomsCollection.FindOne(context.Background(), bson.M{"_id": roomObjID}).Decode(&chatRoom)
	if err != nil {
		c.JSON(404, gin.H{"message": "Chat room not found"})
		return
	}

	if chatRoom.Buyer != userObjID && chatRoom.Seller != userObjID {
		c.JSON(403, gin.H{"message": "Not authorized for this chat"})
		return
	}

	isRoomSeller := chatRoom.Seller == userObjID
	unreadCount := 0
	if isRoomSeller {
		unreadCount = chatRoom.UnreadCount.Seller
	} else {
		unreadCount = chatRoom.UnreadCount.Buyer
	}

	c.JSON(200, gin.H{"unreadCount": unreadCount})
}
