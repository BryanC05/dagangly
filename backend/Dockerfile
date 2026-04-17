FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN mkdir -p uploads/logos uploads/products uploads/forum
# Force rebuild to ensure latest changes are included
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .

COPY --from=builder /app/uploads ./uploads

RUN mkdir -p uploads/logos uploads/forum

EXPOSE 8080

ENV PORT=8080

CMD ["./server"]
