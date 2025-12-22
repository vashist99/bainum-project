import { Users, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAdmin, isParent } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="navbar bg-base-100 shadow-lg border-b border-base-300">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            {isAdmin() && (
              <li>
                <a href="/teachers" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Teachers
                </a>
              </li>
            )}
            {!isParent() && (
            <li>
              <a href="/data" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Data
              </a>
            </li>
            )}
          </ul>
        </div>
        {isParent() ? (
          <span className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-default">
            Bainum Project
          </span>
        ) : (
        <a href="/home" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bainum Project
        </a>
        )}
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {isAdmin() && (
            <li>
              <a href="/teachers" className="btn btn-ghost flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teachers
              </a>
            </li>
          )}
          {!isParent() && (
          <li>
            <a href="/data" className="btn btn-ghost flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Data
            </a>
          </li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li className="menu-title">
              <span>{user?.name || 'User'}</span>
            </li>
            <li className="menu-title">
              <span className="text-xs text-base-content/60 capitalize">{user?.role || 'No Role'}</span>
            </li>
            <div className="divider my-1"></div>
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li><a>Settings</a></li>
            <li>
              <a onClick={handleLogout} className="flex items-center gap-2 text-error">
                <LogOut className="w-4 h-4" />
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

