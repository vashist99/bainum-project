import { useState } from "react";
import { useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Shared authenticated app shell: sidebar + navbar + scrollable content area.
 *
 * Every authenticated page composes this instead of hand-wiring Sidebar/Navbar,
 * so the navigation is identical on every page. The active sidebar item is
 * derived from the current route via useLocation — pages don't pass a path.
 *
 * Page content is rendered inside <main>; pages keep their own inner container
 * and padding. The content column is min-w-0 so wide content (tables, charts)
 * shrinks to fit beside the sidebar and triggers its own overflow handling
 * rather than widening the page.
 */
export default function AppLayout({ breadcrumbs = [], children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        currentPath={location.pathname}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={handleSidebarToggle}
          showSidebar={sidebarOpen}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
