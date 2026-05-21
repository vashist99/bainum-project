import axios from 'axios';

// Base URL resolution order:
//   1. Local dev (vite dev server / localhost host): empty string so requests hit
//      the Vite proxy configured in vite.config.js, which forwards /api to the
//      local backend on :5000.
//   2. Production with VITE_API_URL set at build time: use it (trailing slash
//      stripped). This is the override hook for staging / alt-backends.
//   3. Production fallback: a hardcoded production backend URL so the app
//      keeps working even when VITE_API_URL is missing or misconfigured on the
//      hosting provider (Vercel env-var didn't reach the build, build cache
//      reused, GitHub Actions overwrote the deploy, etc.). The previous
//      empty-string fallback caused axios to resolve /api/* against the
//      frontend's own origin, which Vercel's SPA rewrite rejected with 405.

const PRODUCTION_API_URL = 'https://bainum-project-backend.onrender.com';

const isDevelopment = import.meta.env.DEV ||
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';

const envApiUrl = import.meta.env.VITE_API_URL;

let API_BASE_URL = '';

if (isDevelopment) {
  API_BASE_URL = '';
} else if (envApiUrl) {
  API_BASE_URL = envApiUrl.replace(/\/$/, '');
} else {
  console.warn(`VITE_API_URL not set at build time; falling back to ${PRODUCTION_API_URL}.`);
  API_BASE_URL = PRODUCTION_API_URL;
}


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
          
        } else {
          console.warn('Token is not a string:', typeof token, token);
        }
      } catch (error) {
        console.error('Error parsing token from localStorage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiry and log errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only 401 means invalid/expired session. 403 is authorization denied — keep user logged in.
    const status = error.response?.status;
    if (status === 401 && !error.config?.url?.includes('login')) {
      localStorage.removeItem('user');
      window.location.href = '/?session_expired=1';
      return Promise.reject(error);
    }
    // Log 403 errors for teacher invitations
    if (error.config?.url?.includes('teacher-invitations') && status === 403) {
      console.error('403 Forbidden on teacher invitation:', {
        url: error.config.url,
        status,
        message: error.response?.data?.message,
        headers: error.response?.headers,
        requestHeaders: error.config?.headers
      });
    }
    return Promise.reject(error);
  }
);

// Export both the configured instance and the original axios for flexibility
export default apiClient;
export { axios as axiosOriginal };

