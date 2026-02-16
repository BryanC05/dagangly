# How to Install MSME Marketplace Mobile App

## Prerequisites

- **Node.js**: Ensure you have Node.js installed on your computer.
- **Expo Go App**: Install "Expo Go" on your Android or iOS device from the App Store or Play Store.

## Option 1: Run with Expo Go (Development Mode)

This is the easiest way to test the app without building a full APK.

1.  **Navigate to the mobile directory:**
    ```bash
    cd mobile
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    *   This will display a QR code in your terminal.

4.  **Scan the QR Code:**
    *   **Android:** Open Expo Go and scan the QR code.
    *   **iOS:** Open the Camera app and scan the QR code.

5.  **Use the App:** The app will load on your phone. Make sure your phone and computer are on the same Wi-Fi network.

## Option 2: Build an APK (Android)

To create a standalone installation file (.apk) for Android:

1.  **Install EAS CLI (Locally):**
    ```bash
    npm install eas-cli
    ```
    *   *Note: If you get a permission error, do not use -g. Installing valid locally is fine.*

2.  **Login to Expo:**
    ```bash
    npx eas login
    ```

3.  **Configure the build:**
    ```bash
    npx eas build:configure
    ```

4.  **Run the build command:**
    ```bash
    npx eas build -p android --profile preview
    ```
    *   This will upload your code to Expo's build servers.
    *   Once done, you will get a link to download the `.apk` file.

5.  **Install on Phone:** Transfer the `.apk` to your phone and install it.

## Troubleshooting

- **"Network request failed":** Ensure your backend server is running and your mobile device can reach your computer's IP address. Update `mobile/src/config/index.js` with your computer's local IP (e.g., `http://192.168.1.5:5000`).
- **White screen or crash:** Check the terminal for error logs.
