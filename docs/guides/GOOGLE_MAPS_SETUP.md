# Google Maps Setup for MSME Marketplace Mobile

## Overview
Google Maps is now fully integrated into the MSME Marketplace mobile app using the Google Maps SDK for Android and iOS.

## Configuration

### Environment Variable
The API key is read from the `.env` file using the variable name `GOOGLEMAPS_API_KEY`:

```
GOOGLEMAPS_API_KEY=your_api_key_here
```

### Dynamic Configuration
The app uses `app.config.js` (replacing the static `app.json`) to dynamically configure Google Maps:

- **Android**: Uses `config.googleMaps.apiKey` with the API key from `process.env.GOOGLEMAPS_API_KEY`
- **iOS**: Uses `config.googleMapsApiKey` with the same environment variable

## Updated Components

All map components now use `PROVIDER_GOOGLE`:

1. **Map.js** (`src/components/Map.js`)
   - Base reusable map component with error handling
   - Custom map styling for better app integration
   - Loading indicators with theme colors

2. **LocationPicker.js** (`src/components/location/LocationPicker.js`)
   - Location selection modal with Google Maps
   - Custom marker styling
   - Loading state indicators

3. **LiveTrackingMap.js** (`src/screens/location/LiveTrackingMap.js`)
   - Real-time delivery tracking
   - Store and driver markers
   - Route polyline visualization

4. **ActiveDeliveryScreen.js** (`src/screens/delivery/ActiveDeliveryScreen.js`)
   - Active delivery tracking for drivers
   - Store and delivery location markers

## Features

### Common Features Across All Maps
- **Google Maps Provider**: All maps use `PROVIDER_GOOGLE` for consistent rendering
- **Loading States**: Maps show loading indicators while tiles load
- **Theme Integration**: Loading indicators use the app's primary color
- **User Location**: Maps display and track user's current location
- **Error Handling**: Graceful fallback when maps fail to load

### Custom Map Styling
The base Map component includes a custom map style that:
- Hides POI labels for cleaner appearance
- Hides transit labels to reduce clutter
- Uses a light blue color for water
- Uses a light gray color for landscape

## Building with Google Maps

### Prerequisites
1. Ensure you have a valid Google Maps API key with:
   - Maps SDK for Android enabled
   - Maps SDK for iOS enabled
   - Places API (for geocoding)

2. The API key should be set in:
   - `.env` file as `GOOGLEMAPS_API_KEY`

### Development Build
To test Google Maps properly, you need a development build:

```bash
cd mobile
npx expo prebuild --platform android
npx expo run:android
```

### Production Build
For production builds using EAS:

```bash
cd mobile
eas build --platform android --profile production
```

## Troubleshooting

### Map Not Showing
1. Check that `GOOGLEMAPS_API_KEY` is set correctly in `.env`
2. Ensure the API key has the correct APIs enabled in Google Cloud Console
3. Verify you're using a development or production build (not Expo Go)

### API Key Restrictions
Make sure to restrict your API key in Google Cloud Console:
- Android: Add your app package name and SHA-1 certificate fingerprint
- iOS: Add your iOS bundle identifier

### Common Issues
1. **"Google Maps API key is not configured" error**: The app falls back to a placeholder view when the API key is missing or invalid
2. **Blank map tiles**: Usually indicates API key issues or missing API enablement
3. **Slow loading**: Check network connectivity and API key quotas

## Testing

To verify Google Maps is working:
1. Open the Nearby screen
2. Check that the map loads with Google Maps styling
3. Verify that user location is displayed
4. Test marker interactions
5. Check the Location Picker from Add Product screen

## API Usage Notes

Google Maps API calls count against your quota:
- Map tile loading
- Geocoding (converting addresses to coordinates)
- Reverse geocoding (converting coordinates to addresses)

Monitor your usage in the Google Cloud Console to avoid unexpected charges.
