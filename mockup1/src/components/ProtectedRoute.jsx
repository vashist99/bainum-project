import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';

const ProtectedRoute = ({ children, requiredRole = null, excludeRoles = [] }) => {
  const { user, hasRole, loading, isParent } = useAuth();

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/8ed3ab10-f37b-4a7f-b1ef-b646b3b66295',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:4',message:'ProtectedRoute rendered',data:{pathname:window.location.pathname,loading,hasUser:!!user,userRole:user?.role,requiredRole,excludeRoles},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [loading, user, requiredRole, excludeRoles]);
  // #endregion

  // Show loading while checking authentication
  if (loading) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8ed3ab10-f37b-4a7f-b1ef-b646b3b66295',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:8',message:'Showing loading state',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8ed3ab10-f37b-4a7f-b1ef-b646b3b66295',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:17',message:'No user, redirecting to login',data:{pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return <Navigate to="/" replace />;
  }

  // Redirect parents to their child's page if they try to access restricted pages
  if (isParent() && user?.childId && excludeRoles.length === 0 && !requiredRole) {
    return <Navigate to={`/data/child/${user.childId}`} replace />;
  }

  // Check if role is excluded
  if (excludeRoles.length > 0 && excludeRoles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="card-title justify-center text-2xl mb-2">Access Denied</h2>
            <p className="text-base-content/70 mb-4">
              This page is not available for your role.
            </p>
            {user?.childId && (
              <div className="card-actions justify-center">
                <a href={`/data/child/${user.childId}`} className="btn btn-primary">
                  Go to Child's Page
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="card-title justify-center text-2xl mb-2">Access Denied</h2>
            <p className="text-base-content/70 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-base-content/50 mb-6">
              Required role: <span className="font-semibold capitalize">{requiredRole}</span>
            </p>
            <div className="card-actions justify-center">
              <button 
                onClick={() => window.history.back()} 
                className="btn btn-primary"
              >
                Go Back
              </button>
              <a href="/home" className="btn btn-ghost">
                Go Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
