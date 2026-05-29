export default {
  expo: {
    name: "MSME Marketplace",
    slug: "msme-marketplace-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.msmemarketplace.mobile",
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleMapsApiKey: process.env.GOOGLEMAP_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We need your location to show nearby sellers and products."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.msmemarketplace.mobile",
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLEMAP_API_KEY
        }
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "034edfa1-ecd5-47df-b050-47725a620224"
      },
      EXPO_PUBLIC_API_HOST: process.env.EXPO_PUBLIC_API_HOST || "http://localhost:5000",
      EXPO_PUBLIC_USE_FIREBASE_AUTH: process.env.EXPO_PUBLIC_USE_FIREBASE_AUTH || "false"
    },
    updates: {
      enabled: false,
      checkAutomatically: "ON_ERROR_RECOVERY"
    },
    plugins: [
      "expo-web-browser",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to show nearby sellers and products."
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          "ios": { "useFrameworks": "static" }
        }
      ]
    ]
  }
};
