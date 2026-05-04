#!/bin/bash
# Build script for Deta Space deployment

echo "Building Go binary for Deta Space..."
cd /Users/user/OpenCode/dagangly/backend

# Build for Linux AMD64 (Deta Space)
GOOS=linux GOARCH=amd64 go build -o server ./cmd/server/main.go

echo "Build complete!"
echo "Binary size: $(ls -lh server | awk '{print $5}')"
echo ""
echo "To deploy to Deta Space:"
echo "1. Install Deta CLI: curl -fsSL https://get.deta.dev/space-cli.sh | sh"
echo "2. Login: deta login"
echo "3. Deploy: deta push"
echo ""
echo "Then add these environment variables in Deta dashboard:"
echo "- MONGODB_URL"
echo "- JWT_SECRET"
echo "- GROQ_API_KEY"
echo "- Other API keys from .env"