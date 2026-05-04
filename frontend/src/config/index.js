const ensureNoTrailingSlash = (value) => value.replace(/\/+$/, "");

// Primary API - production Railway
const rawApiUrl = (import.meta.env.VITE_API_URL || "https://dagangly-production.up.railway.app/api").trim();
const normalizedApiUrl = ensureNoTrailingSlash(rawApiUrl) || "/api";

// Fallback API - localhost
const FALLBACK_API_URL = "http://localhost:5000/api";
const FALLBACK_BACKEND_URL = "http://localhost:5000";

const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
const normalizedBackendUrl = rawBackendUrl ? ensureNoTrailingSlash(rawBackendUrl) : "";

let derivedBackendUrl = "";
if (normalizedApiUrl.startsWith("http://") || normalizedApiUrl.startsWith("https://")) {
  derivedBackendUrl = normalizedApiUrl.replace(/\/api$/, "");
}

const API_URL = normalizedApiUrl;
const BACKEND_URL = normalizedBackendUrl || derivedBackendUrl;

// Track if primary API failed
let apiFailed = false;

export const getBackendUrl = () => BACKEND_URL;
export const getApiUrl = () => API_URL;
export const getFallbackApiUrl = () => FALLBACK_API_URL;
export const getFallbackBackendUrl = () => FALLBACK_BACKEND_URL;

// Mark API as failed to enable fallback
export const setApiFailed = (failed) => { apiFailed = failed; };
export const isApiFailed = () => apiFailed;

// Get API URL with fallback support
export const getApiUrlWithFallback = () => {
  return apiFailed ? FALLBACK_API_URL : API_URL;
};

// Get backend URL with fallback support
export const getBackendUrlWithFallback = () => {
  return apiFailed ? FALLBACK_BACKEND_URL : BACKEND_URL;
};
