# Android Deployment Guide

Complete guide to deploy the MSME Marketplace Android app using Expo EAS.

## Prerequisites

- Node.js 18+ installed
- Expo account (free at https://expo.dev)
- Google Maps API key (Android SDK enabled)
- Backend API deployed and accessible

## Quick Start (5 Minutes)

### Step 1: Login to EAS

```bash
cd mobile
npx eas-cli@latest login
```

### Step 2: Configure Secrets

```bash
# Set your Google Maps API key as EAS secret
npx eas secret:create --name GOOGLEMAPS_API_KEY --value "YOUR_GOOGLE_MAPS_API_KEY"

# Verify secrets are set
npx eas secret:list
```

### Step 3: Build Preview APK (FREE Distribution)

```bash
# Build APK for direct distribution
npx eas build --platform android --profile preview
```

This creates an APK you can share directly via WhatsApp, email, or QR code.

### Step 4: Build Production AAB (For Play Store)

```bash
# Validate configuration first
npm run check:release

# Build production AAB
npm run build:android:production
```

## Build Profiles

### 1. Development Build
```bash
npx eas build --platform android --profile development
```
- For local development with expo-dev-client
- Includes debugging tools

### 2. Preview Build (RECOMMENDED for Testing)
```bash
npx eas build --platform android --profile preview
```
- Creates APK file
- Free distribution to testers
- No Play Store required

### 3. Production Build
```bash
npx eas build --platform android --profile production
```
- Creates AAB (Android App Bundle)
- For Play Store submission
- Optimized for release

## Environment Configuration

### Current Setup (in eas.json)

```json
{
  "production": {
    "autoIncrement": true,
    "env": {
      "EXPO_PUBLIC_API_HOST": "https://umkm-marketplace-production.up.railway.app"
    }
  }
}
```

### Required EAS Secrets

| Secret Name | Status | How to Set |
|-------------|--------|------------|
| `GOOGLEMAPS_API_KEY` | Required | `npx eas secret:create --name GOOGLEMAPS_API_KEY --value "..."` |

## Distribution Options

### Option 1: Direct APK Distribution (FREE)
1. Build with preview profile
2. Download APK from EAS dashboard
3. Share via WhatsApp, Telegram, or QR code
4. Users install by enabling "Unknown Sources"

### Option 2: Alternative App Stores (FREE)
- Amazon Appstore
- Samsung Galaxy Store
- Xiaomi GetApps
- APKPure

### Option 3: Google Play Store ($25 one-time)
1. Create Play Console account ($25)
2. Upload production AAB
3. Complete store listing
4. Submit for review

## Pre-Deployment Checklist

- [ ] Backend API is live and accessible
- [ ] Google Maps API key is configured as EAS secret
- [ ] App icons are finalized in assets/
- [ ] Privacy policy URL is ready
- [ ] App has been tested on physical Android device
- [ ] All features work: login, products, cart, chat, maps

## Troubleshooting

### Build Fails
```bash
# Clear cache and retry
npx eas build --platform android --profile preview --clear-cache
```

### Maps Not Showing
- Verify `GOOGLEMAPS_API_KEY` is set as EAS secret
- Check API key has "Maps SDK for Android" enabled in Google Cloud Console

### API Connection Issues
- Verify `EXPO_PUBLIC_API_HOST` points to deployed backend
- Check backend allows requests from mobile app origin

## Cost Breakdown

| Item | Cost |
|------|------|
| EAS Free Tier | $0 (30 builds/month) |
| Direct APK Distribution | $0 |
| Alternative App Stores | $0 |
| Google Play Store | $25 one-time |
| **Total for Free Distribution** | **$0** |

## Next Steps

1. Get Google Maps API key from Google Cloud Console
2. Set EAS secret
3. Build preview APK
4. Test on Android device
5. Distribute to your first users!

## Support

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- Google Maps Setup: See GOOGLE_MAPS_SETUP.md
