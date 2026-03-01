"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, MapPin, Heart, Bell, LogOut, ShieldCheck, ChevronRight, Activity, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0a0a0a;
    --paper: #f5f3ef;
    --accent: #c8ff00;
    --mid: #8a8a8a;
    --border: rgba(10,10,10,0.1);
  }

  *, *::before, *::after { box-sizing: border-box; }

  .reyva-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--paper);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ═══════════════════════════════════════
     HEADER
  ═══════════════════════════════════════ */
  .dash-header {
    background: var(--ink);
    padding: 32px 0 28px;
    position: relative;
    z-index: 10;
  }
  .dash-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 40px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .dash-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .dash-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: clamp(40px, 6vw, 68px);
    line-height: 0.88;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: white;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    padding: 10px 14px;
  }
  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 18px;
    color: var(--ink);
    flex-shrink: 0;
  }
  .user-chip-name {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    color: white;
    line-height: 1.2;
  }
  .user-chip-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    font-size: 10px;
    color: rgba(255,255,255,0.38);
    letter-spacing: 0.04em;
  }
  .hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: white;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════════════
     BODY GRID
  ═══════════════════════════════════════ */
  .dash-body {
    max-width: 1280px;
    margin: 0 auto;
    padding: 40px 40px 120px;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 28px;
    align-items: start;
  }

  /* ═══════════════════════════════════════
     DESKTOP SIDEBAR
  ═══════════════════════════════════════ */
  .dash-sidebar {
    position: sticky;
    top: 24px;
  }
  .sidebar-section-label {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mid);
    padding: 0 12px;
    margin-bottom: 8px;
  }

  /* ═══════════════════════════════════════
     SHARED NAV ITEMS
  ═══════════════════════════════════════ */
  .nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 12px;
    border-radius: 6px;
    border: 1px solid transparent;
    text-decoration: none;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    margin-bottom: 2px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .nav-item-inner {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .nav-icon {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .nav-label {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    color: inherit;
    line-height: 1;
  }
  .nav-sublabel {
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 2px;
    color: inherit;
  }
  .nav-item-inactive { color: var(--mid); }
  .nav-item-inactive .nav-icon {
    background: var(--paper);
    border: 1px solid var(--border);
    color: var(--mid);
  }
  .nav-item-inactive .nav-sublabel { opacity: 0.5; }
  .nav-item-inactive:hover {
    background: var(--paper);
    border-color: var(--border);
    color: var(--ink);
  }
  .nav-item-inactive:hover .nav-icon {
    background: var(--ink);
    border-color: var(--ink);
    color: white;
  }
  .nav-item-inactive .nav-chevron {
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.12s ease, transform 0.12s ease;
  }
  .nav-item-inactive:hover .nav-chevron { opacity: 1; transform: translateX(0); }
  .nav-item-active {
    background: var(--ink);
    border-color: var(--ink);
    color: white;
  }
  .nav-item-active .nav-icon {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.12);
    color: white;
  }
  .nav-item-active .nav-sublabel { opacity: 0.4; color: white; }
  .nav-item-active .nav-chevron { color: rgba(255,255,255,0.4); }
  .nav-item-active::before {
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    margin-right: 2px;
  }
  .sidebar-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 12px 10px;
  }
  .nav-logout {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 12px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: #c0392b;
    cursor: pointer;
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    transition: background 0.12s ease, border-color 0.12s ease;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
  }
  .nav-logout:hover {
    background: rgba(192,57,43,0.05);
    border-color: rgba(192,57,43,0.12);
  }
  .nav-logout-icon {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    background: rgba(192,57,43,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════════════
     MOBILE DRAWER
  ═══════════════════════════════════════ */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,10,10,0.55);
    z-index: 100;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
  .drawer-panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(300px, 85vw);
    background: white;
    z-index: 101;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .drawer-header {
    background: var(--ink);
    padding: 24px 20px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .drawer-header-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .drawer-close {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .drawer-nav {
    padding: 16px 12px;
    flex: 1;
  }
  .drawer-section-label {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mid);
    padding: 0 10px;
    margin-bottom: 8px;
  }

  /* ═══════════════════════════════════════
     MOBILE BOTTOM TAB BAR
  ═══════════════════════════════════════ */
  .mobile-tab-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: white;
    border-top: 1px solid var(--border);
  }
  .mobile-tab-bar-inner {
    display: flex;
    align-items: stretch;
    height: 60px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: var(--mid);
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 8px 2px;
    position: relative;
    transition: color 0.12s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .tab-item-active { color: var(--ink); }
  .tab-item-active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: var(--accent);
  }
  .tab-icon-wrap {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background 0.12s ease;
  }
  .tab-item-active .tab-icon-wrap {
    background: var(--ink);
    color: white;
  }
  .tab-label {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
  }
  .tab-more-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: var(--mid);
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 8px 2px;
    -webkit-tap-highlight-color: transparent;
  }

  /* ═══════════════════════════════════════
     MAIN CONTENT
  ═══════════════════════════════════════ */
  .dash-main {
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    min-height: 600px;
    padding: 44px;
  }

  /* ═══════════════════════════════════════
     AUTH GATE
  ═══════════════════════════════════════ */
  .auth-gate {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    background: var(--paper);
  }
  .auth-gate-icon {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    background: white;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    color: var(--mid);
  }
  .auth-gate h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: clamp(32px, 6vw, 44px);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 10px;
  }
  .auth-gate p {
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    font-size: 14px;
    color: var(--mid);
    margin-bottom: 28px;
  }
  .auth-gate-btn {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: var(--ink);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0 32px;
    height: 48px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .auth-gate-btn:hover { background: var(--accent); color: var(--ink); }

  /* ═══════════════════════════════════════
     BREAKPOINTS
  ═══════════════════════════════════════ */

  /* Tablet (600–900px): drawer + bottom bar, no sidebar */
  @media (max-width: 900px) {
    .dash-header-inner { padding: 0 20px; }
    .hamburger { display: flex; }
    .dash-body {
      grid-template-columns: 1fr;
      padding: 24px 16px 80px;
      gap: 0;
    }
    .dash-sidebar { display: none; }
    .mobile-tab-bar { display: flex; flex-direction: column; }
    .dash-main { padding: 28px 20px; border-radius: 8px; min-height: 400px; }
  }

  /* Small mobile (<480px) */
  @media (max-width: 480px) {
    .dash-header-inner { padding: 0 16px; }
    .user-chip-text { display: none; }
    .user-chip { padding: 8px 10px; }
    .dash-body { padding: 16px 12px 80px; }
    .dash-main { padding: 20px 14px; }
    .dash-title { line-height: 0.92; }
  }
`;

const navItems = [
  { name: "My Profile",    href: "/dashboard",               icon: User,        sub: "Account"  },
  { name: "Orders",        href: "/dashboard/orders",        icon: ShoppingBag, sub: "Orders"   },
  { name: "Addresses",     href: "/dashboard/addresses",     icon: MapPin,      sub: "Shipping" },
  { name: "Wishlist",      href: "/dashboard/wishlist",      icon: Heart,       sub: "Saved"    },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell,        sub: "Alerts"   },
];

// Bottom tab bar: first 4 items + "More" to open drawer
const tabItems = navItems.slice(0, 4);

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`nav-item ${isActive ? "nav-item-active" : "nav-item-inactive"}`}
      style={{ textDecoration: "none" }}
    >
      <div className="nav-item-inner">
        <div className="nav-icon">
          <item.icon size={14} />
        </div>
        <div>
          <div className="nav-label">{item.name}</div>
          <div className="nav-sublabel">{item.sub}</div>
        </div>
      </div>
      <ChevronRight size={12} className="nav-chevron" />
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-gate">
          <div className="auth-gate-icon"><Activity size={24} /></div>
          <h2>Sign In Required</h2>
          <p>You need to be logged in to access your dashboard.</p>
          <Link href="/auth/login" className="auth-gate-btn">Sign In</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="reyva-root">

        {/* ── Header ── */}
        <header className="dash-header">
          <div className="dash-header-inner">
            <div>
              <p className="dash-eyebrow">Reyva / Dashboard</p>
              <h1 className="dash-title">My<br />Account</h1>
            </div>
            <div className="header-right">
              <div className="user-chip">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-chip-text">
                  <p className="user-chip-name">{user.name || "Customer"}</p>
                  <div className="user-chip-badge">
                    <ShieldCheck size={10} color="#c8ff00" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
              <button
                className="hamburger"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Mobile / Tablet Drawer ── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="drawer-panel"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
              >
                <div className="drawer-header">
                  <div className="drawer-header-user">
                    <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 16 }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="user-chip-name" style={{ fontSize: 13 }}>{user.name || "Customer"}</p>
                      <div className="user-chip-badge">
                        <ShieldCheck size={10} color="#c8ff00" />
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>
                  <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                    <X size={16} />
                  </button>
                </div>

                <div className="drawer-nav">
                  <p className="drawer-section-label">Navigation</p>
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => setDrawerOpen(false)}
                    />
                  ))}
                  <hr className="sidebar-divider" />
                  <button
                    className="nav-logout"
                    onClick={() => { logout(); setDrawerOpen(false); }}
                  >
                    <div className="nav-logout-icon">
                      <LogOut size={13} color="#c0392b" />
                    </div>
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Body ── */}
        <div className="dash-body">

          {/* Desktop sidebar — hidden below 900px via CSS */}
          <aside className="dash-sidebar">
            <p className="sidebar-section-label">Navigation</p>
            <nav>
              {navItems.map((item) => (
                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
              ))}
              <hr className="sidebar-divider" />
              <button className="nav-logout" onClick={() => logout()}>
                <div className="nav-logout-icon">
                  <LogOut size={13} color="#c0392b" />
                </div>
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Page content */}
          <main>
            <motion.div
              className="dash-main"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>

        </div>

        {/* ── Mobile Bottom Tab Bar — shown below 900px ── */}
        <nav className="mobile-tab-bar" aria-label="Bottom navigation">
          <div className="mobile-tab-bar-inner">
            {tabItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`tab-item ${isActive ? "tab-item-active" : ""}`}
                  style={{ textDecoration: "none" }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="tab-icon-wrap">
                    <item.icon size={16} />
                  </div>
                  <span className="tab-label">{item.sub}</span>
                </Link>
              );
            })}

            {/* More — opens drawer for Notifications + Sign Out */}
            <button
              className="tab-more-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="More options"
            >
              <div className="tab-icon-wrap">
                <Menu size={16} />
              </div>
              <span className="tab-label">More</span>
            </button>
          </div>
        </nav>

      </div>
    </>
  );
}