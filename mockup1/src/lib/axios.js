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
// Priority 1: If in development, ALWAYS use empty string (leverages Vite proxy) - ignore VITE_API_URL
// Priority 2: If in production and VITE_API_URL is set, use it
// Priority 3: If in production and no VITE_API_URL, warn and use empty (will fail, but won't break)
let API_BASE_URL = '';

if (isDevelopment) {
  // Development mode - ALWAYS use Vite proxy, ignore VITE_API_URL
  API_BASE_URL = '';
} else if (envApiUrl) {
  // Production mode with env var - use it (remove trailing slash if present)
  API_BASE_URL = envApiUrl.replace(/\/$/, '');
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

// Add request interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        // Parse the stored value (could be a string or JSON string)
        let token = savedUser;
        try {
          token = JSON.parse(savedUser);
        } catch {
          // If parsing fails, it's already a string
          token = savedUser;
        }
        
        // Add Authorization header if token exists
        if (token && typeof token === 'string') {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Debug logging for teacher invitations endpoint
          if (config.url && config.url.includes('teacher-invitations')) {
            console.log('Teacher invitation request:', {
              url: config.url,
              hasAuthHeader: !!config.headers.Authorization,
              authHeaderPreview: config.headers.Authorization ? `${config.headers.Authorization.substring(0, 30)}...` : 'none',
              tokenLength: token.length,
              tokenPreview: token.substring(0, 20) + '...'
            });
          }
        } else {
          console.warn('Token is not a string:', typeof token, token);
        }
      } catch (error) {
        console.error('Error parsing token from localStorage:', error);
      }
    } else {
      // Debug: log if no token found for teacher invitations
      if (config.url && config.url.includes('teacher-invitations')) {
        console.warn('No token found in localStorage for teacher invitation request');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to log errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log 403 errors for teacher invitations
    if (error.config?.url?.includes('teacher-invitations') && error.response?.status === 403) {
      console.error('403 Forbidden on teacher invitation:', {
        url: error.config.url,
        status: error.response.status,
        message: error.response.data?.message,
        headers: error.response.headers,
        requestHeaders: error.config.headers
      });
    }
    return Promise.reject(error);
  }
);

// Export both the configured instance and the original axios for flexibility
export default apiClient;
export { axios as axiosOriginal };

