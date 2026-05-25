package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

type ImgbbService struct {
	APIKey string
}

type ImgbbResponse struct {
	Data struct {
		URL string `json:"url"`
	} `json:"data"`
	Success bool `json:"success"`
}

func NewImgbbService() (*ImgbbService, error) {
	apiKey := os.Getenv("IMGBB_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("missing IMGBB_API_KEY environment variable")
	}
	return &ImgbbService{APIKey: apiKey}, nil
}

func (s *ImgbbService) UploadFile(file multipart.File, fileHeader *multipart.FileHeader) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Attach the image file to the form data
	part, err := writer.CreateFormFile("image", fileHeader.Filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %v", err)
	}

	_, err = io.Copy(part, file)
	if err != nil {
		return "", fmt.Errorf("failed to copy file content: %v", err)
	}
	writer.Close()

	// Send request to ImgBB
	url := fmt.Sprintf("https://api.imgbb.com/1/upload?key=%s", s.APIKey)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ImgBB upload failed, status: %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	var result ImgbbResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	// Return the public, persistent image URL
	return result.Data.URL, nil
}
