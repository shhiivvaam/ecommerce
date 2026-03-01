"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Tag, Ticket, LogOut, Settings, Image as ImageIcon,
  Menu, X, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Nav items ──────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { name: "Overview",   href: "/admin",            icon: LayoutDashboard },
  { name: "Products",   href: "/admin/products",   icon: Package },
  { name: "Orders",     href: "/admin/orders",     icon: ShoppingCart },
  { name: "Categories", href: "/admin/categories", icon: Tag },
  { name: "Banners",    href: "/admin/banners",    icon: ImageIcon },
  { name: "Coupons",    href: "/admin/coupons",    icon: Ticket },
  { name: "Customers",  href: "/admin/customers",  icon: Users },
  { name: "Settings",   href: "/admin/settings",   icon: Settings },
];

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:    #0a0a0a;
    --paper:  #f5f3ef;
    --accent: #c8ff00;
    --mid:    #8a8a8a;
    --border: rgba(10,10,10,0.1);
    --card:   #ffffff;
    --sidebar-w: 248px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* ── Layout shell ───────────────────────────── */
  .al-root {
    display: flex;
    min-height: 100svh;
    background: var(--paper);
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
  }

  /* ── Sidebar ────────────────────────────────── */
  .al-sidebar {
    display: none;
    flex-direction: column;
    width: var(--sidebar-w);
    position: fixed;
    inset-block: 0;
    left: 0;
    background: var(--ink);
    z-index: 80;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  @media (min-width: 1024px) {
    .al-sidebar { display: flex; }
  }

  /* Subtle grain overlay on sidebar */
  .al-sidebar::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px;
  }

  /* ── Sidebar logo ───────────────────────────── */
  .al-logo-wrap {
    padding: 28px 24px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .al-logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .al-logo:hover { opacity: 0.65; }
  .al-logo-pill {
    font-family: 'DM Sans', sans-serif;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: var(--accent);
    color: var(--ink);
    padding: 2px 7px;
    border-radius: 3px;
  }

  /* ── Sidebar nav ────────────────────────────── */
  .al-nav {
    flex: 1;
    padding: 16px 14px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .al-nav-label {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    padding: 0 10px;
    margin-bottom: 6px;
    margin-top: 4px;
    display: block;
  }
  .al-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    border-radius: 6px;
    margin-bottom: 1px;
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.38);
    transition: background 0.18s, color 0.18s;
  }
  .al-nav-item:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.75);
  }
  .al-nav-item.is-active {
    background: var(--accent);
    color: var(--ink);
  }
  .al-nav-item.is-active:hover {
    background: var(--accent);
    color: var(--ink);
  }
  .al-nav-item-left {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .al-nav-icon { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Sidebar footer ─────────────────────────── */
  .al-sidebar-foot {
    padding: 14px;
    border-top: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .al-user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 8px;
    min-width: 0;
  }
  .al-user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    background: var(--accent);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 900;
    flex-shrink: 0;
  }
  .al-user-name {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .al-user-role {
    font-size: 9px;
    font-weight: 400;
    color: rgba(255,255,255,0.22);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 1px;
  }
  .al-logout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    height: 38px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
  }
  .al-logout:hover {
    background: rgba(220,50,50,0.12);
    border-color: rgba(220,50,50,0.2);
    color: #e05050;
  }

  /* ── Mobile top bar ─────────────────────────── */
  .al-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 58px;
    background: var(--ink);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 20px;
    z-index: 90;
  }
  @media (min-width: 1024px) { .al-topbar { display: none; } }

  .al-topbar-logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 21px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .al-topbar-pill {
    font-family: 'DM Sans', sans-serif;
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: var(--accent);
    color: var(--ink);
    padding: 2px 6px;
    border-radius: 3px;
  }
  .al-menu-btn {
    width: 34px;
    height: 34px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s;
  }
  .al-menu-btn:hover {
    border-color: rgba(255,255,255,0.35);
    color: #fff;
  }

  /* Mobile drawer (full-screen, below topbar) */
  .al-drawer {
    position: fixed;
    inset: 58px 0 0;
    background: var(--ink);
    z-index: 89;
    padding: 20px 14px 32px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .al-drawer-logout {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 6px;
    border: 1px solid rgba(220,50,50,0.2);
    background: rgba(220,50,50,0.07);
    color: #e05050;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: background 0.18s;
    width: 100%;
  }
  .al-drawer-logout:hover { background: rgba(220,50,50,0.14); }

  /* ── Main content ───────────────────────────── */
  .al-main {
    flex: 1;
    min-height: 100svh;
    padding: 70px 20px 60px;
  }
  @media (min-width: 1024px) {
    .al-main {
      margin-left: var(--sidebar-w);
      padding: 44px 44px 80px;
    }
  }
  @media (min-width: 1280px) {
    .al-main { padding: 48px 56px 80px; }
  }

  .al-inner { max-width: 1320px; }

  /* Active page breadcrumb strip */
  .al-breadcrumb {
    display: none;
    align-items: center;
    gap: 6px;
    margin-bottom: 0;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 36px;
  }
  @media (min-width: 1024px) { .al-breadcrumb { display: flex; } }
  .al-breadcrumb-item {
    font-size: 11px;
    font-weight: 400;
    color: var(--mid);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
  }
  .al-breadcrumb-item:hover { color: var(--ink); }
  .al-breadcrumb-sep {
    font-size: 10px;
    color: rgba(10,10,10,0.2);
  }
  .al-breadcrumb-current {
    font-size: 11px;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  const currentPage = NAV_ITEMS.find((i) => isActive(i.href));

  return (
    <>
      <style>{CSS}</style>

      <div className="al-root">

        {/* ── Desktop sidebar ──────────────────────────────── */}
        <aside className="al-sidebar">

          {/* Logo */}
          <div className="al-logo-wrap">
            <Link href="/admin" className="al-logo">
              Reyva
              <span className="al-logo-pill">Admin</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="al-nav">
            <span className="al-nav-label">Menu</span>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`al-nav-item${isActive(item.href) ? " is-active" : ""}`}
              >
                <span className="al-nav-item-left">
                  <item.icon className="al-nav-icon" strokeWidth={1.5} />
                  {item.name}
                </span>
                {isActive(item.href) && (
                  <ChevronRight size={12} strokeWidth={2} style={{ opacity: 0.55 }} />
                )}
              </Link>
            ))}
          </nav>

          {/* User + logout */}
          <div className="al-sidebar-foot">
            {user && (
              <div className="al-user-card">
                <div className="al-user-avatar">
                  {(user.name || user.email || "A").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="al-user-name">{user.name || user.email}</p>
                  <p className="al-user-role">Admin</p>
                </div>
              </div>
            )}
            <button className="al-logout" onClick={() => logout()}>
              <LogOut size={13} strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Mobile top bar ────────────────────────────────── */}
        <div className="al-topbar">
          <Link href="/admin" className="al-topbar-logo">
            Reyva
            <span className="al-topbar-pill">Admin</span>
          </Link>
          <button
            className="al-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="al-drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="al-nav-label">Menu</span>

              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <Link
                    href={item.href}
                    className={`al-nav-item${isActive(item.href) ? " is-active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="al-nav-item-left">
                      <item.icon className="al-nav-icon" strokeWidth={1.5} />
                      {item.name}
                    </span>
                    {isActive(item.href) && (
                      <ChevronRight size={12} strokeWidth={2} style={{ opacity: 0.55 }} />
                    )}
                  </Link>
                </motion.div>
              ))}

              <button
                className="al-drawer-logout"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content ──────────────────────────────────── */}
        <main className="al-main">
          <div className="al-inner">

            {/* Breadcrumb strip (desktop only) */}
            {currentPage && (
              <nav className="al-breadcrumb" aria-label="Breadcrumb">
                <Link href="/admin" className="al-breadcrumb-item">Admin</Link>
                {currentPage.href !== "/admin" && (
                  <>
                    <span className="al-breadcrumb-sep">/</span>
                    <span className="al-breadcrumb-current">{currentPage.name}</span>
                  </>
                )}
              </nav>
            )}

            {children}
          </div>
        </main>

      </div>
    </>
  );
}
