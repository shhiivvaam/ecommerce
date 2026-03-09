"use client";

import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Package, Clock, ArrowUpRight, TrendingUp, BarChart } from "lucide-react";
import Link from "next/link";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useAnalyticsDashboard } from "@/lib/hooks/useAnalytics";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PENDING: { color: "#d97706", bg: "#fffbeb" },
  PROCESSING: { color: "#2563eb", bg: "#eff6ff" },
  SHIPPED: { color: "#7c3aed", bg: "#f5f3ff" },
  DELIVERED: { color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED: { color: "#e11d48", bg: "#fff0f3" },
};

export default function AdminOverview() {
  const { data, isLoading: loading } = useAdminStats();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsDashboard();

  const stats = {
    totalRevenue: data?.totalRevenue ?? 0,
    totalOrders: data?.totalOrders ?? 0,
    totalProducts: data?.totalProducts ?? 0,
    totalUsers: data?.totalUsers ?? 0,
    pendingOrders: data?.pendingOrders ?? 0,
  };
  const recentOrders = data?.recentOrders ?? [];

  const KPI = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, note: "All time" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, note: `${stats.pendingOrders} pending` },
    { label: "Products Listed", value: stats.totalProducts, icon: Package, note: "In catalog" },
    { label: "Average Order (AOV)", value: analyticsData ? `$${(analyticsData.averageOrderValue || 0).toFixed(2)}` : "--", icon: BarChart, note: "Trailing 30 days" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); }
        .ov-wrap { font-family:'DM Sans',sans-serif; color:var(--ink); padding-bottom:80px; }
        .ov-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,72px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-0.02em; }
        .ov-sub { font-size:13px; color:var(--mid); font-weight:300; margin-top:6px; }
        .ov-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:40px; }
        .ov-kpi { background:#fff; border:1px solid var(--border); border-radius:10px; padding:24px 20px; }
        .ov-kpi-icon { width:40px; height:40px; background:var(--paper); border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; color:var(--mid); }
        .ov-kpi-val { font-family:'Barlow Condensed',sans-serif; font-size:36px; font-weight:900; line-height:1; letter-spacing:-0.02em; }
        .ov-kpi-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); margin-top:6px; }
        .ov-kpi-note { font-size:11px; font-weight:300; color:var(--mid); margin-top:4px; }
        .ov-section-title { font-family:'Barlow Condensed',sans-serif; font-size:28px; font-weight:900; text-transform:uppercase; margin-bottom:16px; }
        .ov-table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .ov-th { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); padding:12px 20px; text-align:left; border-bottom:1px solid var(--border); background:var(--paper); }
        .ov-td { padding:14px 20px; font-size:13px; border-bottom:1px solid var(--border); }
        .ov-td:last-child { border-bottom:none; }
        tr:last-child .ov-td { border-bottom:none; }
        .ov-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; padding:3px 8px; border-radius:4px; }
        .ov-skel { background:rgba(10,10,10,0.06); border-radius:8px; animation:ov-pulse 1.4s ease-in-out infinite; }
        @keyframes ov-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      <div className="ov-wrap">
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--mid)" }}>
            Store Analytics
          </span>
          <h1 className="ov-title">Overview</h1>
          <p className="ov-sub">Your store at a glance — live stats and recent activity.</p>
        </div>

        {/* KPI Cards */}
        <div className="ov-kpi-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ov-skel" style={{ height: 140 }} />
            ))
            : KPI.map(({ label, value, icon: Icon, note }, i) => (
              <motion.div
                key={label}
                className="ov-kpi"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="ov-kpi-icon"><Icon size={18} strokeWidth={1.5} /></div>
                <div className="ov-kpi-val">{value}</div>
                <div className="ov-kpi-label">{label}</div>
                <div className="ov-kpi-note">{note}</div>
              </motion.div>
            ))}
        </div>

        {/* Pending Orders Banner */}
        {!loading && stats.pendingOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--ink)", color: "#fff", borderRadius: 10,
              padding: "16px 24px", marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={18} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 400 }}>
                <strong style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, color: "var(--accent)", marginRight: 8 }}>
                  {stats.pendingOrders}
                </strong>
                order{stats.pendingOrders !== 1 ? "s" : ""} awaiting review
              </span>
            </div>
            <Link
              href="/admin/orders"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)" }}
            >
              Manage <ArrowUpRight size={14} />
            </Link>
          </motion.div>
        )}

        {/* Recent Orders */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="ov-section-title" style={{ margin: 0 }}>
              <TrendingUp size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "text-top", color: "var(--mid)" }} />
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mid)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px" }}
            >
              View All <ArrowUpRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="ov-skel" style={{ height: 200 }} />
          ) : recentOrders.length > 0 ? (
            <table className="ov-table">
              <thead>
                <tr>
                  {["Order ID", "Customer", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="ov-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const style = STATUS_STYLE[order.status] ?? { color: "var(--mid)", bg: "var(--paper)" };
                  return (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="ov-td" style={{ fontFamily: "monospace", fontSize: 12 }}>#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="ov-td">{order.user.name || order.user.email}</td>
                      <td className="ov-td" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>
                        ${(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="ov-td">
                        <span className="ov-badge" style={{ background: style.bg, color: style.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: style.color, display: "inline-block" }} />
                          {order.status}
                        </span>
                      </td>
                      <td className="ov-td" style={{ color: "var(--mid)", fontSize: 12 }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px", border: "1.5px dashed var(--border)", borderRadius: 10 }}>
              <ShoppingBag size={32} style={{ color: "rgba(10,10,10,0.15)", marginBottom: 12 }} />
              <p style={{ color: "var(--mid)", fontSize: 14, fontWeight: 300 }}>No orders yet.</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div style={{ marginTop: 40 }}>
          <h2 className="ov-section-title" style={{ margin: 0, marginBottom: 16 }}>
            <Package size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "text-top", color: "var(--mid)" }} />
            Top Selling Products
          </h2>
          {analyticsLoading ? (
            <div className="ov-skel" style={{ height: 200 }} />
          ) : analyticsData && analyticsData.topProducts && analyticsData.topProducts.length > 0 ? (
            <table className="ov-table">
              <thead>
                <tr>
                  <th className="ov-th">Product</th>
                  <th className="ov-th" style={{ textAlign: "right" }}>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData.topProducts || []).map((p, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="ov-td" style={{ fontWeight: 500 }}>{p.title}</td>
                    <td className="ov-td" style={{ textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>
                      {p._count.orderItems}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px", border: "1.5px dashed var(--border)", borderRadius: 10 }}>
              <p style={{ color: "var(--mid)", fontSize: 14, fontWeight: 300 }}>No top products data yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
