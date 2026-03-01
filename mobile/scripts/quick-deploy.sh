#!/bin/bash
# Quick Deployment Script for MSME Marketplace Android App
# This script automates the deployment process for free distribution

set -e

echo "=========================================="
echo "MSME Marketplace - Quick Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the mobile directory${NC}"
    exit 1
fi

echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"

# Check if EAS CLI is available
if ! npx eas-cli@latest --version &> /dev/null; then
    echo -e "${YELLOW}⚠ EAS CLI not found. It will be installed automatically.${NC}"
fi

echo ""
echo "Step 2: Validating configuration..."
echo "-----------------------------------"

# Run validation script
if npm run check:release; then
    echo -e "${GREEN}✓ Configuration validation passed${NC}"
else
    echo -e "${YELLOW}⚠ Configuration validation had warnings. Check output above.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 3: Select build type"
echo "-----------------------------------"
echo "1) Preview APK (FREE distribution - recommended for testing)"
echo "2) Production AAB (for Play Store submission)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        BUILD_PROFILE="preview"
        echo -e "${GREEN}Building Preview APK...${NC}"
        ;;
    2)
        BUILD_PROFILE="production"
        echo -e "${GREEN}Building Production AAB...${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Step 4: Starting EAS Build"
echo "-----------------------------------"
echo "This will build the app in the cloud."
echo "You can monitor progress at: https://expo.dev"
echo ""
read -p "Press Enter to start build..."

# Start the build
npx eas-cli@latest build --platform android --profile $BUILD_PROFILE --non-interactive

echo ""
echo "=========================================="
echo -e "${GREEN}Build Started Successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Monitor build progress at: https://expo.dev"
echo "2. Download the artifact when complete"
if [ "$BUILD_PROFILE" = "preview" ]; then
    echo "3. Share the APK via WhatsApp, email, or QR code"
    echo "4. Users install by enabling 'Install from Unknown Sources'"
else
    echo "3. Upload AAB to Google Play Console"
    echo "4. Complete store listing and submit for review"
fi
echo ""
echo "For help, see: DEPLOYMENT_GUIDE.md"
