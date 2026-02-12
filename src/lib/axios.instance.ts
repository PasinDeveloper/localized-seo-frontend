import axios from "axios";

/*
  Shared Axios client for frontend-to-backend calls.

  Centralizes base URL, timeout, and default headers.
*/

// Shared Axios instance for all frontend API calls.
export const apiClient = axios.create({
  // Directly call backend API.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010",
  // Timeout to avoid hanging requests.
  timeout: 10000,
  headers: {
    // Default response format expected from the backend.
    Accept: "application/json",
  },
});

