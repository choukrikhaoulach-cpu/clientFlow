import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Wallet,
  StickyNote,
  Settings,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getDashboardStats } from "../api/dashboard";
import { timeAgo } from "../utils/format";
import PageTransition from "../components/PageTransition";
import useClickOutside from "../hooks/useClickOutside";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("clientflow_sidebar_collapsed") === "1");
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);
  useClickOutside(searchRef, () => setSearchFocused(false));

  const [notifOpen, setNotifOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const notifRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useClickOutside(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    localStorage.setItem("clientflow_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    getDashboardStats()
      .then((data) => setActivity(data.recent_activity || []))
      .catch(() => setActivity([]));
  }, [location.pathname]);

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  function goTo(path) {
    navigate(path);
    setQuery("");
    setSearchFocused(false);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchResults.length > 0) goTo(searchResults[0].to);
  }

  return (
    <div className="app-shell">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-backdrop open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileOpen ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <span className="mark">CF</span>
          <span>ClientFlow</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={() => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="sidebar-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon className="icon" style={{ position: "relative" }} />
                <span style={{ position: "relative" }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <div>
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-link" style={{ width: "100%", marginTop: 6 }} onClick={logout} title={collapsed ? "Log out" : undefined}>
            <LogOut className="icon" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className={`main-area ${collapsed ? "collapsed" : ""}`}>
        <div className="topbar">
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <button
            className="topbar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="topbar-search" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search size={16} />
              <input
                placeholder="Quick jump… (clients, invoices, tasks)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
            </form>
            {searchFocused && searchResults.length > 0 && (
              <div className="topbar-search-results">
                {searchResults.map((item) => (
                  <button key={item.to} onClick={() => goTo(item.to)} type="button">
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="dropdown-wrap" ref={notifRef}>
              <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" title="Notifications">
                <Bell size={18} />
                {activity.length > 0 && <span className="dot" />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="dropdown-panel"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="dropdown-header">Recent activity</div>
                    {activity.length === 0 ? (
                      <div className="dropdown-empty">You're all caught up.</div>
                    ) : (
                      activity.slice(0, 6).map((item, idx) => (
                        <div className="dropdown-item" key={idx}>
                          <div>
                            <div>{item.message}</div>
                            <div className="muted">{timeAgo(item.timestamp)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="dropdown-wrap" ref={profileRef}>
              <button className="profile-trigger" onClick={() => setProfileOpen((o) => !o)}>
                <span className="avatar-sm">{initials}</span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="dropdown-panel profile-menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="profile-menu-header">
                      <div className="name">{user?.name}</div>
                      <div className="email">{user?.email}</div>
                    </div>
                    <NavLink to="/settings" className="profile-menu-link" onClick={() => setProfileOpen(false)}>
                      <UserCircle size={16} /> Settings
                    </NavLink>
                    <button className="profile-menu-link danger" onClick={logout} type="button">
                      <LogOut size={16} /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="content">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
