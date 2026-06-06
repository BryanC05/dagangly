# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Build the Go backend
# We navigate to the backend directory where go.mod is located
RUN cd backend && \
    go mod download && \
    CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Final Stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/server .

# Copy uploads directory and ensure it exists
COPY --from=builder /app/backend/uploads ./uploads
RUN mkdir -p uploads/logos uploads/products uploads/forum

EXPOSE 8080

ENV PORT=8080
ENV GIN_MODE=release

CMD ["./server"]
