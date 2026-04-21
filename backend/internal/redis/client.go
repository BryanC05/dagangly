package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

var client *redis.Client
var ctx = context.Background()

type Message struct {
	ID          string    `json:"_id"`
	ChatRoom    string    `json:"chatRoom"`
	Sender      Sender    `json:"sender"`
	Content     string    `json:"content"`
	MessageType string    `json:"messageType"`
	IsRead      bool      `json:"isRead"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Sender struct {
	ID           string `json:"_id"`
	Name         string `json:"name"`
	BusinessName string `json:"businessName,omitempty"`
}

func Init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Println("⚠️  REDIS_URL not set, Redis will not be available")
		return
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("⚠️  Failed to parse Redis URL: %v", err)
		return
	}

	client = redis.NewClient(opt)

	_, err = client.Ping(ctx).Result()
	if err != nil {
		log.Printf("⚠️  Failed to connect to Redis: %v", err)
		client = nil
		return
	}

	log.Println("✅ Connected to Redis")
}

func GetClient() *redis.Client {
	return client
}

func IsAvailable() bool {
	return client != nil
}

func CacheMessage(roomID string, msg Message) error {
	if client == nil {
		return nil
	}

	key := fmt.Sprintf("chat:%s:messages", roomID)
	score := float64(msg.CreatedAt.Unix())

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	err = client.ZAdd(ctx, key, redis.Z{
		Score:  score,
		Member: string(data),
	}).Err()
	if err != nil {
		return err
	}

	err = client.Expire(ctx, key, 24*time.Hour).Err()
	if err != nil {
		return err
	}

	return nil
}

func GetRecentMessages(roomID string, limit int) ([]Message, error) {
	if client == nil {
		return []Message{}, nil
	}

	key := fmt.Sprintf("chat:%s:messages", roomID)

	results, err := client.ZRevRange(ctx, key, 0, int64(limit-1)).Result()
	if err != nil {
		return []Message{}, err
	}

	var messages []Message
	for _, data := range results {
		var msg Message
		if err := json.Unmarshal([]byte(data), &msg); err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

func UpdateUserActiveRooms(userID string, roomIDs []string) error {
	if client == nil {
		return nil
	}

	key := fmt.Sprintf("user:%s:active_rooms", userID)
	pipe := client.Pipeline()

	pipe.Del(ctx, key)
	if len(roomIDs) > 0 {
		interfaceSlice := make([]interface{}, len(roomIDs))
		for i, v := range roomIDs {
			interfaceSlice[i] = v
		}
		pipe.SAdd(ctx, key, interfaceSlice...)
		pipe.Expire(ctx, key, 5*time.Minute)
	}

	_, err := pipe.Exec(ctx)
	return err
}

func GetUserActiveRooms(userID string) ([]string, error) {
	if client == nil {
		return []string{}, nil
	}

	key := fmt.Sprintf("user:%s:active_rooms", userID)
	return client.SMembers(ctx, key).Result()
}

func UpdateRoomLastActivity(roomID string) error {
	if client == nil {
		return nil
	}

	key := "room:last_activity"
	now := strconv.FormatInt(time.Now().Unix(), 10)
	return client.HSet(ctx, key, roomID, now).Err()
}

func GetRoomsByLastActivity(limit int) ([]string, error) {
	if client == nil {
		return []string{}, nil
	}

	key := "room:last_activity"
	results, err := client.HGetAll(ctx, key).Result()
	if err != nil {
		return []string{}, err
	}

	type roomActivity struct {
		roomID    string
		timestamp int64
	}

	var activities []roomActivity
	for roomID, ts := range results {
		t, _ := strconv.ParseInt(ts, 10, 64)
		activities = append(activities, roomActivity{roomID, t})
	}

	for i := 0; i < len(activities)-1; i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[j].timestamp > activities[i].timestamp {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	var roomIDs []string
	for i, a := range activities {
		if i >= limit {
			break
		}
		roomIDs = append(roomIDs, a.roomID)
	}

	return roomIDs, nil
}

func SetUserRoomLimit(userID string, roomIDs []string, limit int) error {
	if client == nil {
		return nil
	}

	key := fmt.Sprintf("user:%s:room_limit", userID)
	pipe := client.Pipeline()

	pipe.Del(ctx, key)
	if len(roomIDs) > 0 {
		interfaceSlice := make([]interface{}, len(roomIDs))
		for i, v := range roomIDs {
			interfaceSlice[i] = v
		}
		pipe.SAdd(ctx, key, interfaceSlice...)
	}
	pipe.Expire(ctx, key, 24*time.Hour)

	_, err := pipe.Exec(ctx)
	return err
}

func GetUserRoomLimit(userID string) ([]string, error) {
	if client == nil {
		return []string{}, nil
	}

	key := fmt.Sprintf("user:%s:room_limit", userID)
	return client.SMembers(ctx, key).Result()
}
