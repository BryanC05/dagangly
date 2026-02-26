import axios from 'axios';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 seconds for logo generation
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Initialize retry count
        if (config && (!config.retryCount)) {
            config.retryCount = 0;
        }

        // Retry on network errors or 5xx server errors, up to 2 times.
        // Some endpoints (e.g. notifications) can opt out via _skipRetry.
        const shouldRetry = config
            && !config._skipRetry
            && (!error.response || error.response.status >= 500)
            && config.retryCount < 2;

        if (shouldRetry) {
            config.retryCount += 1;
            console.log(`[API] Retrying request (${config.retryCount}/2): ${config.url}`);
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return api(config);
        }

        // Global Error Handling
        const suppressGlobalErrors = Boolean(config?._suppressGlobalErrors);

        if (!error.response) {
            if (!suppressGlobalErrors) {
                const isTimeout = error.code === 'ECONNABORTED';
                Alert.alert(
                    isTimeout ? 'Request Timeout' : 'Network Error',
                    isTimeout
                        ? 'The request took too long. Please try again.'
                        : 'Please check your internet connection and try again.'
                );
            }
        } else if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('token');
            // Prevent multiple alerts
            if (config && !config._hasAlerted && !suppressGlobalErrors) {
                config._hasAlerted = true;
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
            }
            // Auth store will handle navigation via its listener
        } else if (error.response?.status >= 500) {
            if (!suppressGlobalErrors) {
                Alert.alert('Server Error', 'We are having trouble connecting to the server. Please try again later.');
            }
        } else if (error.response?.data?.message && error.response.status !== 404) {
            // Don't alert on 404s (like missing profile image) to avoid noise
            if (!suppressGlobalErrors) {
                Alert.alert('Error', error.response.data.message);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
