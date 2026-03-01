const ensureNoTrailingSlash = (value) => value.replace(/\/+$/, "");

const rawApiUrl = (import.meta.env.VITE_API_URL || "/api").trim();
const normalizedApiUrl = ensureNoTrailingSlash(rawApiUrl) || "/api";

const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
const normalizedBackendUrl = rawBackendUrl ? ensureNoTrailingSlash(rawBackendUrl) : "";

let derivedBackendUrl = "";
if (normalizedApiUrl.startsWith("http://") || normalizedApiUrl.startsWith("https://")) {
  derivedBackendUrl = normalizedApiUrl.replace(/\/api$/, "");
}

const API_URL = normalizedApiUrl;
const BACKEND_URL = normalizedBackendUrl || derivedBackendUrl;

export const getBackendUrl = () => BACKEND_URL;
export const getApiUrl = () => API_URL;
