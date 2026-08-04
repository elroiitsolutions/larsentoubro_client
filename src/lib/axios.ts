import axios from "axios";
import { getCookie, eraseCookie } from "@/lib/cookie";

/**
 * Centralized Axios instance configuration.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor
 * Reads JWT token from localStorage (key: "token") or cookies and attaches it to the Authorization header.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token") || getCookie("token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handles responses globally, including 401 Unauthorized cleanup and dev-only debug logging.
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;

        // Handle 401 Unauthorized globally
        if (status === 401) {
            localStorage.removeItem("token");
            eraseCookie("token");
            // TODO: Redirect user to login page when 401 occurs
        }

        // Log unexpected API errors in development mode only
        if (import.meta.env.DEV) {
            console.error("[API Error Debug]", {
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
                payload: error.config?.data,
                status: status || "NETWORK_ERROR",
                message: error.response?.data?.message || error.message,
            });
        }

        // Preserve original error response
        return Promise.reject(error);
    }
);

export default api;
