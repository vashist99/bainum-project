import axios from 'axios';

// Get API base URL from environment variable
// In development (localhost), use empty string to leverage Vite proxy
// In production, set VITE_API_URL to your backend URL (e.g., https://your-backend.vercel.app)
// Vite requires environment variables to be prefixed with VITE_ to be accessible in the browser

// Check if we're in development mode (localhost)
const isDevelopment = import.meta.env.DEV || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';

// Get the API URL from environment variable
const envApiUrl = import.meta.env.VITE_API_URL;

// Determine the base URL:
// Priority 1: If VITE_API_URL is explicitly set, always use it (for production)
// Priority 2: If in development and no VITE_API_URL, use empty string (leverages Vite proxy)
// Priority 3: If in production and no VITE_API_URL, warn and use empty (will fail, but won't break)
let API_BASE_URL = '';

if (envApiUrl) {
  // Environment variable is set - use it (remove trailing slash if present)
  API_BASE_URL = envApiUrl.replace(/\/$/, '');
} else if (isDevelopment) {
  // Development mode without env var - use Vite proxy
  API_BASE_URL = '';
} else {
  // Production mode without env var - this is an error, but use empty to prevent breaking
  console.error('⚠️ VITE_API_URL is not set in production! API requests will fail.');
  API_BASE_URL = '';
}

// Log for debugging
console.log("API Configuration:", {
  isDevelopment,
  envApiUrl: envApiUrl || '(not set)',
  API_BASE_URL: API_BASE_URL || '(using relative URLs)',
  hostname: window.location.hostname,
  mode: import.meta.env.MODE
});

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type here - let axios handle it automatically
  // This allows multipart/form-data to work correctly
});

// Export both the configured instance and the original axios for flexibility
export default apiClient;
export { axios as axiosOriginal };

