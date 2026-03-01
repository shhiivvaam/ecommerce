"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { Heart, ShoppingBag, User, LogOut, Search, X, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isAdmin = user?.role === "ADMIN";
  if (pathname?.startsWith("/admin")) return null;

  const navItems = [
    { label: "All", href: "/products" },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Sale", href: "/sale", accent: true },
  ];

  // Transparent on hero, ink-filled when scrolled
  const navBg = scrolled
    ? "rgba(10,10,10,0.97)"
    : "transparent";
  const navBorder = scrolled
    ? "rgba(255,255,255,0.08)"
    : "transparent";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background .35s cubic-bezier(.4,0,.2,1), border-color .35s, backdrop-filter .35s;
          border-bottom: 1px solid;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .nav-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }
        @media (max-width: 640px) { .nav-inner { padding: 0 20px; height: 56px; } }

        /* Logo */
        .nav-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px; font-weight: 900;
          letter-spacing: .04em; text-transform: uppercase;
          color: #fff; text-decoration: none;
          flex-shrink: 0;
          transition: opacity .2s;
        }
        .nav-logo:hover { opacity: .75; }

        /* Center nav links */
        .nav-links {
          display: flex; align-items: center; gap: 36px;
          list-style: none; margin: 0; padding: 0;
        }
        @media (max-width: 1023px) { .nav-links { display: none; } }

        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          color: rgba(255,255,255,.6);
          text-decoration: none;
          position: relative; padding-bottom: 2px;
          transition: color .2s;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; background: #c8ff00;
          transform: scaleX(0); transform-origin: left;
          transition: transform .3s cubic-bezier(.4,0,.2,1);
        }
        .nav-link:hover, .nav-link.active { color: #fff; }
        .nav-link:hover::after, .nav-link.active::after { transform: scaleX(1); }
        .nav-link.sale { color: #c8ff00; }
        .nav-link.sale:hover { color: #c8ff00; opacity: .8; }
        .nav-link.sale::after { background: #c8ff00; }

        /* Icon buttons */
        .nav-icon-btn {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,.7);
          transition: background .2s, color .2s;
        }
        .nav-icon-btn:hover { background: rgba(255,255,255,.1); color: #fff; }

        /* Cart badge */
        .nav-cart-badge {
          position: absolute; top: -2px; right: -2px;
          width: 17px; height: 17px; border-radius: 50%;
          background: #c8ff00; color: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }

        /* Text btns */
        .nav-text-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,.6); text-decoration: none;
          transition: color .2s; white-space: nowrap;
        }
        .nav-text-btn:hover { color: #fff; }

        .nav-join-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          padding: 9px 20px; border-radius: 4px;
          background: #c8ff00; color: #0a0a0a;
          border: none; cursor: pointer; text-decoration: none;
          transition: opacity .2s;
        }
        .nav-join-btn:hover { opacity: .85; }

        /* ── SEARCH OVERLAY ── */
        .search-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(10,10,10,.96);
          backdrop-filter: blur(16px);
          display: flex; flex-direction: column;
        }
        .search-inner {
          max-width: 800px; margin: 0 auto; padding: 0 32px;
          height: 80px; display: flex; align-items: center; gap: 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          width: 100%;
        }
        .search-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(24px, 4vw, 40px); font-weight: 300;
          color: #fff; caret-color: #c8ff00;
        }
        .search-input::placeholder { color: rgba(255,255,255,.2); }
        .search-hint {
          max-width: 800px; margin: 32px auto 0; padding: 0 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
          color: rgba(255,255,255,.25); width: 100%;
        }

        /* ── MOBILE MENU ── */
        .mobile-menu {
          position: fixed; inset: 0; z-index: 150;
          background: #0a0a0a;
          display: flex; flex-direction: column;
          padding: 24px 28px 48px;
          overflow-y: auto;
        }
        .mobile-menu-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 48px;
        }
        .mobile-nav-link {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 52px; font-weight: 900; text-transform: uppercase;
          color: rgba(255,255,255,.35);
          text-decoration: none; line-height: 1.1;
          transition: color .2s;
          display: block; padding: 4px 0;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active { color: #fff; }
        .mobile-nav-link.sale { color: #c8ff00 !important; }
        .mobile-menu-footer {
          margin-top: auto; padding-top: 48px;
          border-top: 1px solid rgba(255,255,255,.1);
          display: flex; gap: 16px; flex-wrap: wrap;
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav
        className="nav-root"
        style={{ background: navBg, borderColor: navBorder }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">Reyva</Link>

          {/* Center nav */}
          <ul className="nav-links">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`nav-link${active ? " active" : ""}${item.accent ? " sale" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Search */}
            <button
              className="nav-icon-btn"
              onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <button className="nav-icon-btn" aria-label="Wishlist">
              <Heart size={18} />
            </button>

            {/* Cart */}
            <Link href="/cart" style={{ position: "relative" }}>
              <button className="nav-icon-btn" aria-label="Cart">
                <ShoppingBag size={18} />
                {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </button>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <span className="nav-text-btn" style={{ color: "#c8ff00", marginLeft: 8 }}>Admin</span>
                  </Link>
                )}
                <Link href="/dashboard">
                  <button className="nav-icon-btn" aria-label="Profile"><User size={18} /></button>
                </Link>
                <button className="nav-icon-btn" onClick={() => logout()} aria-label="Sign out"
                  style={{ color: "rgba(255,255,255,.4)" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff6b6b")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3" style={{ marginLeft: 8 }}>
                <Link href="/login" className="nav-text-btn">Sign In</Link>
                <Link href="/register" className="nav-join-btn">Join</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="nav-icon-btn lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ──────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .25 }}
          >
            <div className="search-inner" style={{ maxWidth: "100%" }}>
              <Search size={22} style={{ color: "rgba(255,255,255,.3)", flexShrink: 0 }} />
              <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                <input
                  ref={inputRef}
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  autoFocus
                />
              </form>
              <button
                className="nav-icon-btn"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                aria-label="Close search"
              >
                <X size={22} />
              </button>
            </div>
            <p className="search-hint">Press Enter to search</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: .4, ease: [.4, 0, .2, 1] }}
          >
            <div className="mobile-menu-header">
              <Link href="/" className="nav-logo" onClick={() => setMobileOpen(false)}>Reyva</Link>
              <button className="nav-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>

            <nav style={{ flex: 1 }}>
              {navItems.map((item, i) => {
                const active = pathname === item.href;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      className={`mobile-nav-link${active ? " active" : ""}${item.accent ? " sale" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mobile-menu-footer">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="nav-join-btn">Profile</Link>
                  <button className="nav-text-btn" style={{ color: "rgba(255,255,255,.5)" }} onClick={() => logout()}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/register" className="nav-join-btn">Join – It&apos;s Free</Link>
                  <Link href="/login" className="nav-text-btn" style={{ color: "rgba(255,255,255,.5)" }}>Sign In</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}