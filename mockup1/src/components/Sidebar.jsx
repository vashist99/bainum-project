import { useState } from "react";
import {
  Home, Users, Building2, BarChart3, UserCircle, Settings,
  LogOut, Menu, X, ChevronDown, ChevronRight, School
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SidebarItem = ({ icon: IconComponent, label, href, isActive, onClick, hasSubmenu = false, isOpen = false, children }) => { // eslint-disable-line no-unused-vars
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(isOpen);

  const handleClick = (e) => {
    e.preventDefault();
    if (hasSubmenu) {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <div className="w-full">
      <a
        href={href || "#"}
        onClick={handleClick}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? "bg-primary text-primary-content shadow-md" 
            : "hover:bg-base-200 text-base-content"
        }`}
      >
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${isActive ? "text-primary-content" : "text-base-content/70 group-hover:text-primary"}`} />
          <span className="font-medium">{label}</span>
        </div>
        {hasSubmenu && (
          <div className="transition-transform duration-200">
            {isSubmenuOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        )}
      </a>
      
      {hasSubmenu && isSubmenuOpen && children && (
        <div className="ml-8 mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, onToggle, currentPath = "/" }) => {
  const { user, logout, isAdmin, isParent, isTeacher } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navigationItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/home",
      isActive: currentPath === "/home" || currentPath === "/"
    },
    // Classrooms: admins get the full list page; teachers land on their
    // classrooms view on the homepage. Hidden for parents.
    ...(isAdmin() || isTeacher() ? [
      {
        icon: School,
        label: "Classrooms",
        href: isAdmin() ? "/classrooms" : "/home",
        isActive: currentPath.startsWith("/classrooms")
      }
    ] : []),
    ...(isAdmin() ? [
      {
        icon: Building2,
        label: "Centers",
        href: "/centers",
        isActive: currentPath.startsWith("/centers")
      },
      {
        icon: Users,
        label: "Teachers",
        href: "/teachers",
        isActive: currentPath.startsWith("/teachers")
      }
    ] : []),
    ...(isTeacher() ? [
      {
        icon: UserCircle,
        label: "My Profile",
        href: user?.username ? `/teachers/${user.username}` : "/profile",
        isActive: currentPath.includes("/teachers/") || currentPath === "/profile"
      }
    ] : []),
    ...(!isParent() ? [
      {
        icon: BarChart3,
        label: "Child Data",
        href: "/data",
        isActive: currentPath.startsWith("/data")
      }
    ] : [])
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-base-100 border-r border-base-300 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-72
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-primary-content font-bold text-sm">🎓</span>
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Bainum Project
                </h1>
                <p className="text-xs text-base-content/60">Educational Platform</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden btn btn-ghost btn-sm btn-circle"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{user?.name || 'User'}</h3>
                <p className="text-xs text-base-content/60 capitalize truncate">
                  {user?.role || 'No Role'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item, index) => (
                <SidebarItem key={index} {...item} />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-base-300">
            <div className="space-y-2">
              <SidebarItem
                icon={Settings}
                label="Settings"
                href="/settings"
                isActive={currentPath === "/settings"}
              />
              <SidebarItem
                icon={LogOut}
                label="Logout"
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;