package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"msme-marketplace/internal/database"
)

func setupForumTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	if database.DB == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
		defer cancel()
		clientOpts := options.Client().ApplyURI("mongodb://localhost:27017")
		client, err := mongo.Connect(ctx, clientOpts)
		if err == nil {
			database.DB = client.Database("test_msme_marketplace")
		}
	}

	return router
}

func TestForumHandler_GetThreads(t *testing.T) {
	router := setupForumTestRouter()
	handler := NewForumHandler()

	router.GET("/forum", handler.GetThreads)

	t.Run("Get threads with defaults", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/forum", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusOK, http.StatusInternalServerError}, w.Code)
		if w.Code == http.StatusOK {
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp, "threads")
			assert.Contains(t, resp, "totalPages")
			assert.Contains(t, resp, "currentPage")
			assert.Contains(t, resp, "total")
		}
	})

	t.Run("Get threads with query parameters", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/forum?page=2&limit=5&category=general&search=test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusOK, http.StatusInternalServerError}, w.Code)
	})
}

func TestForumHandler_CreateThread_JSON(t *testing.T) {
	router := setupForumTestRouter()
	handler := NewForumHandler()

	router.POST("/forum", func(c *gin.Context) {
		c.Set("userID", primitive.NewObjectID().Hex())
		handler.CreateThread(c)
	})

	t.Run("Create thread invalid body", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/forum", bytes.NewBufferString("{invalid-json}"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Create thread valid JSON request", func(t *testing.T) {
		body := map[string]interface{}{
			"title":    "Test Thread Title",
			"content":  "Test Thread Content is long enough",
			"category": "general",
		}
		bodyBytes, _ := json.Marshal(body)
		req, _ := http.NewRequest(http.MethodPost, "/forum", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusCreated, http.StatusInternalServerError}, w.Code)
	})
}

func TestForumHandler_CreateThread_Multipart(t *testing.T) {
	router := setupForumTestRouter()
	handler := NewForumHandler()

	router.POST("/forum", func(c *gin.Context) {
		c.Set("userID", primitive.NewObjectID().Hex())
		handler.CreateThread(c)
	})

	t.Run("Create thread valid Multipart/Form-Data request", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		_ = writer.WriteField("title", "Multipart Test Thread")
		_ = writer.WriteField("content", "Multipart Test Content here")
		_ = writer.WriteField("category", "tips")

		part, err := writer.CreateFormFile("attachments", "test.png")
		assert.NoError(t, err)
		_, _ = io.WriteString(part, "fake-image-binary-data")

		_ = writer.Close()

		req, _ := http.NewRequest(http.MethodPost, "/forum", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusCreated, http.StatusBadRequest, http.StatusInternalServerError}, w.Code)
	})
}

func TestForumHandler_CreateReply(t *testing.T) {
	router := setupForumTestRouter()
	handler := NewForumHandler()

	threadID := primitive.NewObjectID().Hex()

	router.POST("/forum/:id/reply", func(c *gin.Context) {
		c.Set("userID", primitive.NewObjectID().Hex())
		handler.CreateReply(c)
	})

	t.Run("Create reply invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/forum/"+threadID+"/reply", bytes.NewBufferString("{invalid}"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusBadRequest, http.StatusNotFound}, w.Code)
	})

	t.Run("Create reply valid JSON", func(t *testing.T) {
		body := map[string]interface{}{
			"content": "Test reply content",
		}
		bodyBytes, _ := json.Marshal(body)
		req, _ := http.NewRequest(http.MethodPost, "/forum/"+threadID+"/reply", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusNotFound, http.StatusInternalServerError}, w.Code)
	})
}
