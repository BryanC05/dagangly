package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"msme-marketplace/internal/database"
	"msme-marketplace/internal/models"
	"msme-marketplace/internal/redis"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	clients             map[*Client]bool
	rooms               map[string]map[*Client]bool
	broadcast           chan *Message
	register            chan *Client
	unregister          chan *Client
	jwtSecret           string
	mutex               sync.RWMutex
	userActiveRooms     map[string][]string
	roomLastActivity    map[string]time.Time
	activeChatRoomLimit int
}

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	userID   string
	userName string
	rooms    []string
}

type Message struct {
	Type   string      `json:"type"`
	RoomID string      `json:"roomId,omitempty"`
	Data   interface{} `json:"data,omitempty"`
	Sender interface{} `json:"sender,omitempty"`
}

func NewHub(jwtSecret string) *Hub {
	return &Hub{
		clients:             make(map[*Client]bool),
		rooms:               make(map[string]map[*Client]bool),
		broadcast:           make(chan *Message, 256),
		register:            make(chan *Client),
		unregister:          make(chan *Client),
		jwtSecret:           jwtSecret,
		userActiveRooms:     make(map[string][]string),
		roomLastActivity:    make(map[string]time.Time),
		activeChatRoomLimit: 3,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			// Auto-join personal notification room
			h.JoinRoom(client, "user-"+client.userID)
			log.Printf("Client connected: %s", client.userName)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				for _, room := range client.rooms {
					h.LeaveRoom(client, room)
				}
			}
			h.mutex.Unlock()
			log.Printf("Client disconnected: %s", client.userName)

		case message := <-h.broadcast:
			h.mutex.RLock()
			roomClients := h.rooms[message.RoomID]
			h.mutex.RUnlock()

			data, err := json.Marshal(message)
			if err != nil {
				log.Printf("Error marshaling message: %v", err)
				continue
			}

			for client := range roomClients {
				select {
				case client.send <- data:
				default:
					h.mutex.Lock()
					delete(h.clients, client)
					close(client.send)
					h.mutex.Unlock()
				}
			}
		}
	}
}

func (h *Hub) JoinRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
	client.rooms = append(client.rooms, roomID)

	if isChatRoom(roomID) {
		h.userActiveRooms[client.userID] = append(h.userActiveRooms[client.userID], roomID)
		h.roomLastActivity[roomID] = time.Now()
		if redis.IsAvailable() {
			redis.UpdateRoomLastActivity(roomID)
		}
		h.enforceActiveRoomLimit(client.userID)
	}

	log.Printf("%s joined room: %s", client.userName, roomID)
}

func (h *Hub) LeaveRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.rooms[roomID] != nil {
		delete(h.rooms[roomID], client)
	}

	for i, r := range client.rooms {
		if r == roomID {
			client.rooms = append(client.rooms[:i], client.rooms[i+1:]...)
			break
		}
	}

	if isChatRoom(roomID) {
		h.removeUserActiveRoom(client.userID, roomID)
	}

	log.Printf("%s left room: %s", client.userName, roomID)
}

func isChatRoom(roomID string) bool {
	return len(roomID) == 24
}

func (h *Hub) enforceActiveRoomLimit(userID string) {
	rooms := h.userActiveRooms[userID]
	if len(rooms) <= h.activeChatRoomLimit {
		return
	}

	roomsToKeep := h.getTopActiveRooms(userID, h.activeChatRoomLimit)
	h.userActiveRooms[userID] = roomsToKeep

	if redis.IsAvailable() {
		redis.SetUserRoomLimit(userID, roomsToKeep, h.activeChatRoomLimit)
	}

	for _, room := range rooms {
		keep := false
		for _, keepRoom := range roomsToKeep {
			if room == keepRoom {
				keep = true
				break
			}
		}
		if !keep {
			h.leaveRoomByUserID(userID, room)
		}
	}
}

func (h *Hub) getTopActiveRooms(userID string, limit int) []string {
	type roomActivity struct {
		roomID    string
		timestamp time.Time
	}

	var activities []roomActivity
	rooms := h.userActiveRooms[userID]
	for _, roomID := range rooms {
		if ts, ok := h.roomLastActivity[roomID]; ok {
			activities = append(activities, roomActivity{roomID, ts})
		} else {
			activities = append(activities, roomActivity{roomID, time.Now()})
		}
	}

	for i := 0; i < len(activities)-1; i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[j].timestamp.After(activities[i].timestamp) {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	var result []string
	for i, a := range activities {
		if i >= limit {
			break
		}
		result = append(result, a.roomID)
	}

	return result
}

func (h *Hub) removeUserActiveRoom(userID, roomID string) {
	rooms := h.userActiveRooms[userID]
	for i, r := range rooms {
		if r == roomID {
			h.userActiveRooms[userID] = append(rooms[:i], rooms[i+1:]...)
			break
		}
	}
}

func (h *Hub) leaveRoomByUserID(userID, roomID string) {
	h.mutex.RLock()
	var client *Client
	for c := range h.rooms[roomID] {
		if c.userID == userID {
			client = c
			break
		}
	}
	h.mutex.RUnlock()

	if client != nil {
		h.LeaveRoom(client, roomID)
	}
}

func (h *Hub) HandleWebSocket(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		token = c.GetHeader("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	claims := &jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})

	if err != nil || claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	userID := (*claims)["id"].(string)

	usersCollection := database.GetDB().Collection("users")
	var user models.User
	objID, _ := primitive.ObjectIDFromHex(userID)
	err = usersCollection.FindOne(c.Request.Context(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading: %v", err)
		return
	}

	client := &Client{
		hub:      h,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		userName: user.Name,
		rooms:    []string{},
	}

	h.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "join-room":
			if roomID, ok := msg.Data.(string); ok {
				c.hub.JoinRoom(c, roomID)
			}
		case "leave-room":
			if roomID, ok := msg.Data.(string); ok {
				c.hub.LeaveRoom(c, roomID)
			}
		case "send-message":
			c.handleSendMessage(msg)
		case "typing":
			c.handleTyping(msg)
		case "stop-typing":
			c.handleStopTyping(msg)
		case "driver-location":
			c.handleDriverLocation(msg)
		case "join-order-tracking":
			c.handleJoinOrderTracking(msg)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(10*time.Second)); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleSendMessage(msg Message) {
	roomID := msg.RoomID
	if roomID == "" {
		return
	}

	chatRoomsCollection := database.GetDB().Collection("chatrooms")
	roomObjID, _ := primitive.ObjectIDFromHex(roomID)
	var chatRoom models.ChatRoom
	err := chatRoomsCollection.FindOne(context.Background(), bson.M{"_id": roomObjID}).Decode(&chatRoom)
	if err != nil {
		return
	}

	content := ""
	if m, ok := msg.Data.(map[string]interface{}); ok {
		if c, ok := m["content"].(string); ok {
			content = c
		}
	}

	userObjID, _ := primitive.ObjectIDFromHex(c.userID)
	message := models.Message{
		ChatRoom:    roomObjID,
		Sender:      userObjID,
		Content:     content,
		MessageType: "text",
	}

	messagesCollection := database.GetDB().Collection("messages")
	result, err := messagesCollection.InsertOne(context.Background(), message)
	if err != nil {
		return
	}

	message.ID = result.InsertedID.(primitive.ObjectID)

	if redis.IsAvailable() {
		redisMsg := redis.Message{
			ID:          message.ID.Hex(),
			ChatRoom:    roomID,
			Sender:      redis.Sender{ID: c.userID, Name: c.userName},
			Content:     content,
			MessageType: "text",
			IsRead:      false,
			CreatedAt:   message.CreatedAt,
		}
		redis.CacheMessage(roomID, redisMsg)
	}

	isRoomSeller := chatRoom.Seller.Hex() == c.userID
	update := bson.M{
		"lastMessage": result.InsertedID,
		"updatedAt":   time.Now(),
	}
	if isRoomSeller {
		update["unreadCount.buyer"] = chatRoom.UnreadCount.Buyer + 1
	} else {
		update["unreadCount.seller"] = chatRoom.UnreadCount.Seller + 1
	}
	chatRoomsCollection.UpdateOne(context.Background(), bson.M{"_id": roomObjID}, bson.M{"$set": update})

	broadcastMsg := &Message{
		Type:   "receive-message",
		RoomID: roomID,
		Data: map[string]interface{}{
			"content": message.Content,
			"sender": map[string]string{
				"_id":  c.userID,
				"name": c.userName,
			},
		},
	}
	c.hub.broadcast <- broadcastMsg
}

func (c *Client) handleTyping(msg Message) {
	roomID := msg.RoomID
	if roomID == "" {
		return
	}

	broadcastMsg := &Message{
		Type:   "user-typing",
		RoomID: roomID,
		Data: map[string]interface{}{
			"userId": c.userID,
			"name":   c.userName,
		},
	}
	c.hub.broadcast <- broadcastMsg
}

func (c *Client) handleStopTyping(msg Message) {
	roomID := msg.RoomID
	if roomID == "" {
		return
	}

	broadcastMsg := &Message{
		Type:   "user-stop-typing",
		RoomID: roomID,
		Data: map[string]interface{}{
			"userId": c.userID,
		},
	}
	c.hub.broadcast <- broadcastMsg
}

func (c *Client) handleDriverLocation(msg Message) {
	orderID, ok := msg.Data.(map[string]interface{})["orderId"].(string)
	if !ok {
		return
	}

	lat, latOk := msg.Data.(map[string]interface{})["latitude"].(float64)
	lng, lngOk := msg.Data.(map[string]interface{})["longitude"].(float64)
	if !latOk || !lngOk {
		return
	}

	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return
	}

	driverObjID, _ := primitive.ObjectIDFromHex(c.userID)
	ordersCollection := database.GetDB().Collection("orders")
	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{
		"_id":       orderObjID,
		"claimedBy": driverObjID,
	}).Decode(&order)
	if err != nil {
		return
	}

	ordersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": orderObjID},
		bson.M{
			"$set": bson.M{
				"driverLocation": bson.M{
					"latitude":  lat,
					"longitude": lng,
					"timestamp": time.Now(),
				},
			},
		},
	)

	broadcastMsg := &Message{
		Type:   "driver-location-update",
		RoomID: "order-" + orderID,
		Data: map[string]interface{}{
			"orderId":   orderID,
			"latitude":  lat,
			"longitude": lng,
			"timestamp": time.Now(),
		},
	}
	c.hub.broadcast <- broadcastMsg
}

func (c *Client) handleJoinOrderTracking(msg Message) {
	orderID, ok := msg.Data.(string)
	if !ok {
		return
	}

	orderObjID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return
	}

	ordersCollection := database.GetDB().Collection("orders")
	var order models.Order
	err = ordersCollection.FindOne(context.Background(), bson.M{"_id": orderObjID}).Decode(&order)
	if err != nil {
		return
	}

	if order.Buyer.Hex() != c.userID {
		return
	}

	roomID := "order-" + orderID
	c.hub.JoinRoom(c, roomID)

	if order.DriverLocation != nil {
		locationMsg := &Message{
			Type:   "driver-location-update",
			RoomID: roomID,
			Data: map[string]interface{}{
				"orderId":   orderID,
				"latitude":  order.DriverLocation.Latitude,
				"longitude": order.DriverLocation.Longitude,
				"timestamp": order.DriverLocation.Timestamp,
			},
		}
		data, _ := json.Marshal(locationMsg)
		c.send <- data
	}
}

var hub *Hub

func Init(jwtSecret string) {
	hub = NewHub(jwtSecret)
	go hub.Run()
}

func GetHub() *Hub {
	return hub
}

// SendToUser sends a raw message to all clients in a user's personal room
func (h *Hub) SendToUser(userID string, data []byte) {
	roomID := "user-" + userID
	h.mutex.RLock()
	roomClients := h.rooms[roomID]
	h.mutex.RUnlock()

	for client := range roomClients {
		select {
		case client.send <- data:
		default:
			h.mutex.Lock()
			delete(h.clients, client)
			close(client.send)
			h.mutex.Unlock()
		}
	}
}

func (h *Hub) BroadcastNewOrder(orderID, sellerID string, orderData map[string]interface{}) {
	msg := &Message{
		Type:   "new-order",
		RoomID: "user-" + sellerID,
		Data:   orderData,
	}
	data, _ := json.Marshal(msg)
	h.SendToUser(sellerID, data)

	redisMsg := redis.Message{
		ID:          orderID,
		ChatRoom:    "user-" + sellerID,
		Sender:      redis.Sender{ID: "system", Name: "System"},
		Content:     "New order received",
		MessageType: "system",
		IsRead:      false,
		CreatedAt:   time.Now(),
	}
	redis.CacheMessage("user-"+sellerID, redisMsg)
}

func (h *Hub) BroadcastOrderStatus(orderID, userID string, status string) {
	msg := &Message{
		Type:   "order-status-update",
		RoomID: "user-" + userID,
		Data: map[string]interface{}{
			"orderId": orderID,
			"status":  status,
		},
	}
	data, _ := json.Marshal(msg)
	h.SendToUser(userID, data)
}
