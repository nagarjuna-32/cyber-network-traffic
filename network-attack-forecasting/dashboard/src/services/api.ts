import axios from 'axios';

// Centralized API Base URL configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.detail ||
      error.message ||
      'Network connection to backend API failed.';
    console.error('API Error:', errorMsg);
    return Promise.reject(error);
  }
);
