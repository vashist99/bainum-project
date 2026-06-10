import { Users, BarChart3, LogOut, Building2, UserCircle, Menu, Home, ChevronRight, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = ({ onToggleSidebar, showSidebar = false, breadcrumbs = [] }) => {
  const { user, logout, isAdmin, isParent, isTeacher } = useAuth();

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
        
        {/* Mobile dropdown — only on pages WITHOUT a sidebar (when a sidebar
            exists, its hamburger toggle covers mobile navigation and these
            links would be redundant). */}
        {!onToggleSidebar && <div className="dropdown">
          <button 
            type="button"
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost lg:hidden ml-2"
            aria-label="Open navigation menu"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </button>
          <ul
            id="mobile-menu"
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            {isTeacher() && (
              <li>
                <a href={user?.username ? `/teachers/${user.username}` : "/profile"} className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </a>
              </li>
            )}
            {isAdmin() && (
              <>
                <li>
                  <a href="/centers" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Centers
                  </a>
                </li>
                <li>
                  <a href="/teachers" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Teachers
                  </a>
                </li>
              </>
            )}
            {!isParent() && (
              <li>
                <a href="/data" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Child Data
                </a>
              </li>
            )}
          </ul>
        </div>}
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
      
      {/* Top nav tabs — only on pages WITHOUT a sidebar; sidebar pages
          already list every destination, so the tabs would be redundant. */}
      {!onToggleSidebar && <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {isTeacher() && (
            <li>
              <a href={user?.username ? `/teachers/${user.username}` : "/profile"} className="btn btn-ghost flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                My Profile
              </a>
            </li>
          )}
          {isAdmin() && (
            <>
              <li>
                <a href="/centers" className="btn btn-ghost flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Centers
                </a>
              </li>
              <li>
                <a href="/teachers" className="btn btn-ghost flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teachers
                </a>
              </li>
            </>
          )}
          {!isParent() && (
            <li>
              <a href="/data" className="btn btn-ghost flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Child Data
              </a>
            </li>
          )}
        </ul>
      </div>}

      <div className="navbar-end">
        {/* Notifications */}
        <div className="dropdown dropdown-end mr-2">
          <button 
            type="button"
            className="btn btn-ghost btn-circle"
            aria-label="Notifications"
          >
            <div className="indicator">
              <Bell className="w-5 h-5" />
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>
          <div className="dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-80">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Notifications</h3>
              <div className="space-y-2">
                <div className="text-sm text-base-content/60 text-center py-4">
                  No new notifications
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* User Menu */}
        <div className="dropdown dropdown-end">
          <button 
            type="button"
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-circle avatar"
            aria-label="User menu"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
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

