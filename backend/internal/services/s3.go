package services

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type S3Service struct {
	Client *s3.Client
	Bucket string
	Region string
}

func NewS3Service() (*S3Service, error) {
	region := os.Getenv("AWS_REGION")
	bucket := os.Getenv("AWS_BUCKET_NAME")
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if region == "" || bucket == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("missing AWS S3 environment variables")
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %v", err)
	}

	return &S3Service{
		Client: s3.NewFromConfig(cfg),
		Bucket: bucket,
		Region: region,
	}, nil
}

func (s *S3Service) UploadFile(file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
	ext := filepath.Ext(fileHeader.Filename)
	newFileName := fmt.Sprintf("%s/%d_%s%s", folder, time.Now().Unix(), uuid.New().String()[:8], ext)

	_, err := s.Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(newFileName),
		Body:   file,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3: %v", err)
	}

	fileURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.Bucket, s.Region, newFileName)
	return fileURL, nil
}
