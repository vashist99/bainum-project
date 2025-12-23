import axios from 'axios';

// Get API base URL from environment variable
// In development (localhost), use empty string to leverage Vite proxy
// In production, set VITE_API_URL to your backend URL (e.g., https://your-backend.vercel.app)
// Vite requires environment variables to be prefixed with VITE_ to be accessible in the browser

// Check if we're in development mode (localhost)
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In development, use empty baseURL to leverage Vite proxy
// In production, use the VITE_API_URL if set, otherwise empty (relative URLs)
const API_BASE_URL = isDevelopment ? '' : (import.meta.env.VITE_API_URL || '');

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type here - let axios handle it automatically
  // This allows multipart/form-data to work correctly
});

// Export both the configured instance and the original axios for flexibility
export default apiClient;
export { axios as axiosOriginal };

