import axios from "axios";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, FALLBACK_API_URL, isLocalApi, isUsingLocal, OFFLINE_TESTING_MODE } from "../config";

let useFallback = false;

const getBaseURL = () => useFallback ? FALLBACK_API_URL : API_URL;

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  // In offline testing mode, use mock token
  if (OFFLINE_TESTING_MODE) {
    const token = await AsyncStorage.getItem("mock_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // In offline testing mode, fail immediately without retry
    if (OFFLINE_TESTING_MODE) {
      return Promise.reject(error);
    }

    // Try fallback to Railway if local fails (and not already tried)
    if (!config?._fallbackRetried && !useFallback && !isUsingLocal) {
      const isNetworkError = !error.response;
      const isServerError = error.response?.status >= 500;
            
      if (isNetworkError || isServerError) {
        console.log("[API] Primary failed, trying Railway fallback...");
        useFallback = true;
        return api.request({
          ...config,
          baseURL: FALLBACK_API_URL,
          _fallbackRetried: true,
        });
      }
    }

    // Initialize retry count
    if (config && (!config.retryCount)) {
      config.retryCount = 0;
    }

    // Retry on network errors or 5xx server errors
    const shouldRetry = config
            && !config._skipRetry
            && (!error.response || error.response.status >= 500)
            && config.retryCount < 2;

    if (shouldRetry) {
      config.retryCount += 1;
      console.log(`[API] Retrying request (${config.retryCount}/2): ${config.url}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(config);
    }

    // Global Error Handling
    const suppressGlobalErrors = Boolean(config?._suppressGlobalErrors);

    if (!error.response) {
      if (!suppressGlobalErrors) {
        const isTimeout = error.code === "ECONNABORTED";
        Alert.alert(
          isTimeout ? "Request Timeout" : "Network Error",
          isTimeout
            ? "The request took too long. Please try again."
            : "Please check your internet connection and try again."
        );
      }
    } else if (error.response?.status === 401) {
      if (!OFFLINE_TESTING_MODE) {
        await SecureStore.deleteItemAsync("token");
      }
      if (config && !config._hasAlerted && !suppressGlobalErrors) {
        config._hasAlerted = true;
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
      }
    } else if (error.response?.status >= 500) {
      if (!suppressGlobalErrors) {
        Alert.alert("Server Error", "We are having trouble connecting to the server. Please try again later.");
      }
    } else if (error.response?.data?.message && error.response.status !== 404) {
      if (!suppressGlobalErrors) {
        Alert.alert("Error", error.response.data.message);
      }
    }

    return Promise.reject(error);
  }
);

// Export a function to check if we're in offline mode
export const isOfflineMode = () => OFFLINE_TESTING_MODE;

export default api;
