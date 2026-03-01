"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Package, Clock, Users, ArrowUpRight, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface RecentOrder {
  id: string;
  user: { email: string; name?: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PENDING:    { color: "#d97706", bg: "#fffbeb" },
  PROCESSING: { color: "#2563eb", bg: "#eff6ff" },
  SHIPPED:    { color: "#7c3aed", bg: "#f5f3ff" },
  DELIVERED:  { color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED:  { color: "#e11d48", bg: "#fff0f3" },
};

export default function AdminOverview() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats({
          totalRevenue: data.totalRevenue,
          totalOrders: data.totalOrders,
          totalProducts: data.totalProducts,
          totalUsers: data.totalUsers || 0,
          pendingOrders: data.statusCounts?.find((sc: { status: string }) => sc.status === "PENDING")?._count || 0,
        });
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { title: "Revenue",   value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, trend: "+12.5%" },
    { title: "Orders",    value: stats.totalOrders,   icon: ShoppingBag, trend: "+3.2%" },
    { title: "Products",  value: stats.totalProducts, icon: Package,    trend: "Stable" },
    { title: "Customers", value: stats.totalUsers,    icon: Users,      trend: "+24 today" },
  ];

  const quickLinks = [
    { label: "Products",  href: "/admin/products",  icon: Package },
    { label: "Orders",    href: "/admin/orders",    icon: ShoppingBag },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Settings",  href: "/admin/settings",  icon: DollarSign },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); --card:#fff; }

        .ao-wrap { font-family:'DM Sans',sans-serif; color:var(--ink); padding-bottom:80px; display:flex; flex-direction:column; gap:32px; }

        /* Header */
        .ao-header { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:20px; }
        .ao-header-tag { font-size:11px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:10px; }
        .ao-header-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,64px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.01em; }
        .ao-header-sub { font-size:14px; font-weight:300; color:var(--mid); margin-top:8px; }
        .ao-live-dot { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#16a34a; }
        .ao-dot { width:7px; height:7px; border-radius:50%; background:#16a34a; animation:ao-pulse 2s ease-in-out infinite; }
        @keyframes ao-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        /* KPI grid */
        .ao-kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
        @media(min-width:768px){ .ao-kpis { grid-template-columns:repeat(4,1fr); } }
        .ao-kpi { background:var(--card); padding:24px 28px; position:relative; overflow:hidden; transition:background .2s; }
        .ao-kpi:hover { background:var(--paper); }
        .ao-kpi-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:6px; }
        .ao-kpi-val { font-family:'Barlow Condensed',sans-serif; font-size:clamp(32px,4vw,44px); font-weight:900; line-height:1; }
        .ao-kpi-trend { display:inline-flex; align-items:center; margin-top:6px; font-size:11px; font-weight:500; color:var(--mid); }
        .ao-kpi-icon { position:absolute; right:-8px; bottom:-8px; opacity:.04; }

        /* Main grid */
        .ao-grid { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:1024px){ .ao-grid { grid-template-columns:1fr 320px; } }

        /* Panel base */
        .ao-panel { background:var(--card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
        .ao-panel-head { padding:24px 28px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .ao-panel-title { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:900; text-transform:uppercase; display:flex; align-items:center; gap:10px; }
        .ao-panel-sub { font-size:13px; font-weight:300; color:var(--mid); margin-top:2px; }

        /* Chart */
        .ao-chart-bars { display:flex; align-items:flex-end; gap:3px; height:160px; padding:0 4px; }
        .ao-bar { flex:1; border-radius:3px 3px 0 0; background:rgba(10,10,10,.07); cursor:pointer; transition:background .2s; min-width:0; }
        .ao-bar:hover { background:var(--accent); }
        .ao-chart-labels { display:flex; justify-content:space-between; padding:10px 4px 0; }
        .ao-chart-label { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--mid); }

        /* Quick links */
        .ao-quicklinks { display:flex; flex-direction:column; gap:0; }
        .ao-quicklink { display:flex; align-items:center; justify-content:space-between; padding:16px 28px; border-bottom:1px solid var(--border); text-decoration:none; color:var(--ink); transition:background .2s; }
        .ao-quicklink:last-child { border-bottom:none; }
        .ao-quicklink:hover { background:var(--paper); }
        .ao-quicklink-left { display:flex; align-items:center; gap:14px; }
        .ao-quicklink-icon { width:34px; height:34px; border-radius:6px; background:var(--paper); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--mid); transition:background .2s, color .2s; }
        .ao-quicklink:hover .ao-quicklink-icon { background:var(--ink); color:#fff; border-color:var(--ink); }
        .ao-quicklink-label { font-size:13px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; }
        .ao-quicklink-arrow { color:var(--mid); opacity:0; transition:opacity .2s, transform .2s; }
        .ao-quicklink:hover .ao-quicklink-arrow { opacity:1; transform:translate(2px,-2px); }

        /* Orders table */
        .ao-orders { }
        .ao-order-row { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding:16px 28px; border-bottom:1px solid var(--border); transition:background .15s; }
        .ao-order-row:last-child { border-bottom:none; }
        .ao-order-row:hover { background:var(--paper); }
        .ao-order-id { width:40px; height:40px; border-radius:6px; background:var(--paper); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:var(--mid); flex-shrink:0; }
        .ao-order-name { font-size:14px; font-weight:500; line-height:1.2; }
        .ao-order-email { font-size:11px; font-weight:300; color:var(--mid); }
        .ao-order-amount { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:900; }
        .ao-order-date { font-size:11px; font-weight:300; color:var(--mid); }
        .ao-status-badge { display:inline-flex; align-items:center; padding:4px 12px; border-radius:4px; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; }

        /* All orders link */
        .ao-view-all { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:var(--mid); text-decoration:none; transition:color .2s; }
        .ao-view-all:hover { color:var(--ink); }

        /* Empty */
        .ao-empty { padding:48px 24px; text-align:center; }
        .ao-empty-icon { width:48px; height:48px; border-radius:8px; background:var(--paper); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:var(--mid); }
        .ao-empty p { font-size:13px; font-weight:300; color:var(--mid); }

        /* Skeleton */
        .ao-skeleton { background:rgba(10,10,10,.06); border-radius:6px; animation:ao-sk 1.4s ease-in-out infinite; }
        @keyframes ao-sk { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      <div className="ao-wrap">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="ao-header">
          <div>
            <span className="ao-header-tag">Dashboard</span>
            <h1 className="ao-header-title">Overview</h1>
            <p className="ao-header-sub">Your store&apos;s performance at a glance.</p>
          </div>
          <div className="ao-live-dot">
            <span className="ao-dot" />
            Live
          </div>
        </div>

        {/* ── KPIs ───────────────────────────────────────────── */}
        <div className="ao-kpis">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              className="ao-kpi"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="ao-kpi-label">{kpi.title}</span>
              <p className="ao-kpi-val">{loading ? "—" : kpi.value}</p>
              <p className="ao-kpi-trend">{kpi.trend}</p>
              <kpi.icon size={80} className="ao-kpi-icon" />
            </motion.div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────── */}
        <div className="ao-grid">

          {/* Chart + Recent Orders stacked left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Bar chart */}
            <motion.div className="ao-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>
              <div className="ao-panel-head">
                <div>
                  <p className="ao-panel-title"><TrendingUp size={18} /> Sales (Last 24h)</p>
                  <p className="ao-panel-sub">Hourly order volume</p>
                </div>
              </div>
              <div style={{ padding: "24px 24px 16px" }}>
                <div className="ao-chart-bars">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="ao-bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 80 + 10}%` }}
                      transition={{ delay: .3 + i * 0.02, type: "spring", stiffness: 60 }}
                    />
                  ))}
                </div>
                <div className="ao-chart-labels">
                  <span className="ao-chart-label">Yesterday</span>
                  <span className="ao-chart-label">Midday</span>
                  <span className="ao-chart-label">Now</span>
                </div>
              </div>
            </motion.div>

            {/* Recent orders */}
            <motion.div className="ao-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }}>
              <div className="ao-panel-head">
                <div>
                  <p className="ao-panel-title">Recent Orders</p>
                  <p className="ao-panel-sub">Latest activity</p>
                </div>
                <Link href="/admin/orders" className="ao-view-all">
                  View All <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="ao-orders">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ padding: "12px 28px" }}>
                      <div className="ao-skeleton" style={{ height: 44 }} />
                    </div>
                  ))
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order, i) => {
                    const s = STATUS_STYLE[order.status] || { color: "var(--mid)", bg: "var(--paper)" };
                    return (
                      <motion.div
                        key={order.id}
                        className="ao-order-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: .4 + i * 0.05 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div className="ao-order-id">#{order.id.slice(-3)}</div>
                          <div>
                            <p className="ao-order-name">{order.user?.name || "Guest"}</p>
                            <p className="ao-order-email">{order.user?.email}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <div style={{ textAlign: "right" }}>
                            <p className="ao-order-amount">${(order.totalAmount || 0).toFixed(2)}</p>
                            <p className="ao-order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="ao-status-badge" style={{ background: s.bg, color: s.color }}>
                            {order.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="ao-empty">
                    <div className="ao-empty-icon"><Clock size={22} /></div>
                    <p>No orders yet. They&apos;ll appear here when customers start buying.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Quick links right */}
          <motion.div className="ao-panel" style={{ height: "fit-content" }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}>
            <div className="ao-panel-head">
              <div>
                <p className="ao-panel-title">Quick Access</p>
                <p className="ao-panel-sub">Jump to a section</p>
              </div>
            </div>
            <div className="ao-quicklinks">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="ao-quicklink">
                  <div className="ao-quicklink-left">
                    <div className="ao-quicklink-icon"><item.icon size={16} /></div>
                    <span className="ao-quicklink-label">{item.label}</span>
                  </div>
                  <ArrowUpRight size={14} className="ao-quicklink-arrow" />
                </Link>
              ))}
            </div>

            {/* Pending orders callout */}
            {stats.pendingOrders > 0 && (
              <div style={{ margin: "0 16px 16px", padding: "16px", borderRadius: 6, background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#d97706", marginBottom: 6 }}>
                  Action Required
                </p>
                <p style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1, color: "var(--ink)", marginBottom: 8 }}>
                  {stats.pendingOrders} Pending
                </p>
                <Link href="/admin/orders" style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#d97706", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  Review Orders <ArrowUpRight size={12} />
                </Link>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </>
  );
}