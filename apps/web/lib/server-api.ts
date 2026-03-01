import axios from "axios";

// Use environment variables for API URL, defaulting to local dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Server-safe HTTP client for use in API routes and server components
export const serverApiClient = axios.create({
    baseURL: API_URL,
    timeout: 10_000, // 10 s — fail fast if API is down or slow
    headers: {
        "Content-Type": "application/json",
    },
});

// Helper function to create authenticated server client with token
export const createAuthenticatedServerClient = (token: string) => {
    return axios.create({
        baseURL: API_URL,
        timeout: 10_000,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
};
