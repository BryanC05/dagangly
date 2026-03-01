# Play Store Release Checklist (Android, Expo/EAS)

This checklist is tailored to the current project configuration:
- Android package: `com.msmemarketplace.mobile` (`mobile/app.config.js`)
- EAS project ID: `034edfa1-ecd5-47df-b050-47725a620224` (`mobile/app.config.js`)
- Production build profile: `production` (`mobile/eas.json`)

**Last Updated:** 2026-02-28  
**Overall Status:** ⚠️ **NOT READY** - Several critical items pending

---

## 1. One-Time Setup

- [ ] Create Google Play Developer account ($25 one-time fee).
- [ ] Create app in Play Console with package name `com.msmemarketplace.mobile`.
- [ ] Create Expo account (if not already).
- [ ] Login with EAS CLI (no global install required):

```bash
cd mobile
npx eas-cli@latest login
```

**Status:** ❌ Not started

---

## 2. Pre-Release Checks

- [x] Backend is deployed and reachable from mobile (`mobile/src/config/index.js`).
  - **Configured:** `https://umkm-marketplace-production.up.railway.app`
- [x] `EXPO_PUBLIC_API_HOST` is set in EAS `production` profile env.
  - **Location:** `mobile/eas.json` production profile
- [ ] `GOOGLEMAPS_API_KEY` is configured as EAS secret for Android builds. 🔴 **CRITICAL**
  - **Action Required:**
    ```bash
    cd mobile
    npx eas secret:create --name GOOGLEMAPS_API_KEY --value "your_actual_api_key"
    ```
- [ ] Location permission flows work on physical device.
- [ ] Login/register works on physical Android device.
- [ ] Product list, product detail, cart, checkout, nearby sellers, chat all work.
- [ ] No critical crash in release-like testing.
- [ ] App icon/splash are final (`mobile/app.config.js`, `mobile/assets`).
- [ ] Privacy policy URL is ready. 🔴 **REQUIRED for Play Store**

**Status:** ⚠️ Partially complete - Testing and privacy policy needed

---

## 3. Build Configuration

### ✅ Completed:
- [x] `app.config.js` created with dynamic configuration
- [x] Google Maps SDK configured for Android (`provider={PROVIDER_GOOGLE}`)
- [x] EAS project ID configured
- [x] `eas.json` with production profile and auto-increment
- [x] Environment variables set for all build profiles
- [x] `react-native-maps` installed and configured

### Build Commands:

**Preview Build (APK for testing):**
```bash
cd mobile
npx eas build --platform android --profile preview
```

**Production Build (AAB for Play Store):**
```bash
cd mobile
npm run check:release
npx eas build --platform android --profile production
```

**Notes:**
- `preview` profile creates APK for internal install/testing.
- Play Store upload should use AAB from `production`.

---

## 4. Play Console (Internal Testing First)

- [ ] Go to `Testing > Internal testing`.
- [ ] Create release and upload the AAB from EAS build.
- [ ] Add release notes.
- [ ] Add tester emails/group.
- [ ] Roll out internal test.

**Status:** ❌ Not started - Requires Play Console setup first

---

## 5. Play Console Mandatory Forms

- [ ] App access (if login required).
- [ ] Data safety form.
- [ ] Content rating questionnaire.
- [ ] Ads declaration.
- [ ] Target audience/News declaration (if prompted).
- [ ] Privacy policy URL added.

**Status:** ❌ Not started

---

## 6. Production Rollout

- [ ] Promote tested build to production.
- [ ] Use staged rollout (example: 10% -> 50% -> 100%).
- [ ] Monitor crashes/ANR and user feedback after each stage.

**Status:** ❌ Not started

---

## 7. EAS Secrets Setup

The following secrets should be configured in EAS:

| Secret Name | Status | Description |
|-------------|--------|-------------|
| `GOOGLEMAPS_API_KEY` | ❌ Missing | Google Maps API key for Android |
| `EXPO_PUBLIC_API_HOST` | ✅ Set | Backend API URL (in eas.json) |

**To add missing secrets:**
```bash
cd mobile
npx eas secret:create --name GOOGLEMAPS_API_KEY --value "AIza..."
```

---

## 8. Common Issues

- `eas: command not found`:
  - Use `npx eas-cli@latest ...` instead of global install.
- `EACCES` during global npm install:
  - Avoid `npm install -g eas-cli`; use `npx` flow.
- Build uploaded but not accepted:
  - Verify package name matches Play app exactly: `com.msmemarketplace.mobile`.
- App cannot call API after install:
  - Verify `mobile/src/config/index.js` points to deployed backend, not localhost.
- Google Maps shows blank/gray tiles:
  - Verify `GOOGLEMAPS_API_KEY` is set as EAS secret and API key has Maps SDK for Android enabled.

---

## 9. Testing Checklist (Before Release)

Test on a physical Android device (not emulator):

- [ ] App launches without crash
- [ ] Login works
- [ ] Registration works
- [ ] Product list loads
- [ ] Product detail opens
- [ ] Add to cart works
- [ ] Cart shows items
- [ ] Checkout flow works
- [ ] Nearby sellers map loads with Google Maps
- [ ] Location picker works
- [ ] Chat functionality works
- [ ] Push notifications work
- [ ] No console errors in production build

---

## Summary

| Phase | Status | Blockers |
|-------|--------|----------|
| Configuration | ✅ Complete | None |
| One-Time Setup | ❌ Not Started | Google Play account ($25) |
| EAS Secrets | ⚠️ Partial | Missing GOOGLEMAPS_API_KEY |
| Testing | ❌ Not Started | Physical device needed |
| Play Console | ❌ Not Started | Account setup required |
| Mandatory Forms | ❌ Not Started | Privacy policy URL needed |

**Estimated Time to Release:** 2-5 days (depending on account setup and testing)
