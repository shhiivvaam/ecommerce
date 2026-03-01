import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

// Use environment variables for API URL, defaulting to local dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10_000, // 10 s — fail fast if API is down or slow
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically intercept requests and attach the JWT token if the user is authenticated
api.interceptors.request.use(
    (config) => {
        // We fetch the token directly from the Zustand store (localStorage)
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// We can also intercept responses to handle global token expires / 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth store if the server rejects our token
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);
