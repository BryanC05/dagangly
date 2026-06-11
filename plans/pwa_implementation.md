# Progressive Web App (PWA) Integration Specification

This document details the PWA assets, caching rules, and registration logic implemented in the Dagangly marketplace application. This configuration enables offline support, asset caching, and makes the app installable on mobile devices (Android/iOS) and desktop platforms.

---

## 1. PWA Architecture Overview

```mermaid
graph TD
    User[User / Browser] -->|Requests Page| ServiceWorker[Service Worker (sw.js)]
    ServiceWorker -->|Check Cache| CacheStorage[(Cache Storage)]
    ServiceWorker -->|Fetch Failure| OfflineFallback[Offline Shell index.html]
    ServiceWorker -->|Fetch Success| Network[(Network Server)]
    Network -->|Update Cache| CacheStorage
```

Dagangly uses a standard PWA shell architecture:
1. **Web App Manifest (`manifest.json`)**: Dictates browser shell styling, icon arrays, app name, background theme color, and launches standalone (without web browser address bars).
2. **Service Worker (`sw.js`)**: Acts as a client-side proxy to intercept fetch calls, serving cached JS/CSS bundles and asset scripts when offline.

---

## 2. PWA Files & Configuration

All static assets reside under the public folder to ensure they are served from the root domain.

### A. Web App Manifest (`frontend/public/manifest.json`)
Defines the installation identity of the application:
```json
{
  "name": "Dagangly - MSME Marketplace",
  "short_name": "Dagangly",
  "description": "Connect with local MSMEs and shop nearby",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#14b8a6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/uploads/DaganglyLogo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/uploads/DaganglyLogo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### B. Service Worker (`frontend/public/sw.js`)
Configures client-side caching of static code bundles and routes:
* **Install Phase**: Caches core shell assets (HTML shell, logo, icons).
* **Activate Phase**: Prunes outdated caches when a new service worker version is deployed.
* **Fetch Phase**: Employs a **Network-First** strategy with a fallback cache check to ensure users always receive the latest content if online, but can still view static pages when offline.

---

## 3. App Shell Registration

### HTML Setup (`frontend/index.html`)
The manifest and the mobile theme-color metadata are linked inside the `<head>` of the main page:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#14b8a6" />
```

### JavaScript Registration (`frontend/src/main.jsx`)
The service worker is registered dynamically when the window loads:
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered successfully: ', registration.scope);
      })
      .catch(error => {
        console.error('SW registration failed: ', error);
      });
  });
}
```

---

## 4. How to Verify Installation & Performance

You can inspect and audit your PWA implementation using Chrome DevTools:

1. **Verify Registration**:
   * Open your site in Chrome.
   * Open DevTools (`F12`) and navigate to the **Application** tab.
   * Click **Service Workers** in the left sidebar to confirm `/sw.js` is active and running.
2. **Verify Manifest**:
   * In the same **Application** tab, click **Manifest**.
   * Confirm that the app name, colors, and icons are parsed correctly.
3. **Verify Installability**:
   * If all parameters are correct, a small **"Install App"** icon (desktop monitor with a down-arrow) will automatically appear in the browser's address bar next to the bookmark star.
4. **Audit with Lighthouse**:
   * Go to the **Lighthouse** tab in DevTools.
   * Check the **Progressive Web App** category.
   * Click **Analyze page load** to verify the PWA checklist score.
