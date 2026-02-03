import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Decode the payload (second part)
    const payload = parts[1];
    // Base64 decode and parse JSON
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
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
        
        // Decode the JWT token to get user data
        const userData = decodeJWT(token);
        if (userData) {
          setUser(userData);
        } else {
          console.error('Failed to decode saved JWT token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    // Decode the JWT token to get user data
    const userData = decodeJWT(token);
    if (userData) {
      setUser(userData);
      // Store the token string for API calls
      localStorage.setItem('user', JSON.stringify(token));
    } else {
      console.error('Failed to decode JWT token');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isTeacher = () => {
    return user?.role === 'teacher';
  };

  const isResearcher = () => {
    return user?.role === 'researcher';
  };

  const isParent = () => {
    return user?.role === 'parent';
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isTeacher,
    isResearcher,
    isParent,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
