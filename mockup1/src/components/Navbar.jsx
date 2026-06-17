import { Users, LogOut, Menu, Home, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = ({ onToggleSidebar, showSidebar = false, breadcrumbs = [] }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="navbar bg-base-100 shadow-lg border-b border-base-300 sticky top-0 z-30">
      <div className="navbar-start">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-circle lg:hidden"
            aria-label={showSidebar ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* Breadcrumbs for larger screens */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 ml-4">
            <Home className="w-4 h-4 text-base-content/50" />
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-base-content/30" />
                {crumb.href ? (
                  <a 
                    href={crumb.href} 
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-sm text-base-content/70 font-medium">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <a href="/home" className="btn btn-ghost text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ml-2 lg:ml-0">
          {/* Show abbreviated on mobile when sidebar toggle is present */}
          <span className={onToggleSidebar ? "lg:hidden" : ""}>
            BP
          </span>
          <span className={onToggleSidebar ? "hidden lg:inline" : ""}>
            Bainum Project
          </span>
        </a>
      </div>
      
      <div className="navbar-end items-center gap-1">
        <NotificationBell />

        {/* User Menu */}
        <div className="dropdown dropdown-end">
          <button 
            type="button"
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-circle"
            aria-label="User menu"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content">
              <Users className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            role="menu"
            aria-label="User account menu"
          >
            <li className="menu-title" role="none">
              <span>{user?.name || 'User'}</span>
            </li>
            <li className="menu-title" role="none">
              <span className="text-xs text-base-content/60 capitalize">{user?.role || 'No Role'}</span>
            </li>
            <div className="divider my-1" role="separator"></div>
            <li role="menuitem">
              <button 
                type="button"
                onClick={handleLogout} 
                className="flex items-center gap-2 text-error w-full text-left"
                aria-label="Logout from account"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

