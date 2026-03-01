 "use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PRODUCTS_API_PATH } from "@/lib/paths";
import { Plus, Search, Trash2, RefreshCw, Pencil, Package, AlertTriangle, CheckCircle, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category?: { name: string };
  gallery: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, outOfStock: 0, lowStock: 0 });

  const fetchProducts = async (q = "") => {
    setLoading(true);
    try {
      const url = `${PRODUCTS_API_PATH}?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products ?? []);
      if (!q) {
        const { data: s } = await api.get("/admin/stats");
        setStats({ total: s.totalProducts, outOfStock: s.outOfStockCount, lowStock: s.lowStockCount });
      } else {
        setStats({
          total: data.total,
          outOfStock: data.products.filter((p: Product) => p.stock === 0).length,
          lowStock: data.products.filter((p: Product) => p.stock > 0 && p.stock < 10).length,
        });
      }
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
      fetchProducts(search);
    } catch { toast.error("Could not delete product"); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProducts(search); };

  const stockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "#e11d48", bg: "#fff0f3", icon: <AlertTriangle size={12} /> };
    if (stock < 10) return { label: "Low Stock", color: "#d97706", bg: "#fffbeb", icon: <Clock size={12} /> };
    return { label: "In Stock", color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={12} /> };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); --card:#fff; }

        .ap-wrap { font-family:'DM Sans',sans-serif; color:var(--ink); padding-bottom:80px; }

        /* ── HEADER ── */
        .ap-header { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:36px; }
        .ap-header-tag { font-size:11px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:10px; }
        .ap-header-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,64px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.01em; }
        .ap-header-sub { font-size:14px; font-weight:300; color:var(--mid); margin-top:8px; }
        .ap-header-actions { display:flex; gap:10px; align-items:center; }

        .ap-icon-btn { width:44px; height:44px; border-radius:6px; border:1.5px solid var(--border); background:var(--card); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--mid); transition:border-color .2s,color .2s; }
        .ap-icon-btn:hover { border-color:var(--ink); color:var(--ink); }
        .ap-primary-btn { display:inline-flex; align-items:center; gap:8px; padding:0 22px; height:44px; border-radius:6px; border:none; background:var(--ink); color:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; transition:background .2s; text-decoration:none; }
        .ap-primary-btn:hover { background:#222; }

        /* ── STATS ── */
        .ap-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom:32px; }
        .ap-stat { background:var(--card); padding:22px 24px; }
        .ap-stat-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:6px; }
        .ap-stat-val { font-family:'Barlow Condensed',sans-serif; font-size:40px; font-weight:900; line-height:1; }
        .ap-stat-sub { font-size:11px; color:var(--mid); font-weight:300; margin-top:3px; }

        /* ── TABLE PANEL ── */
        .ap-panel { background:var(--card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }

        .ap-toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid var(--border); background:var(--paper); }
        .ap-search { display:flex; align-items:center; gap:0; background:#fff; border:1.5px solid var(--border); border-radius:6px; height:42px; overflow:hidden; flex:1; max-width:480px; transition:border-color .2s; }
        .ap-search:focus-within { border-color:var(--ink); }
        .ap-search-icon { padding:0 12px; color:var(--mid); flex-shrink:0; }
        .ap-search input { flex:1; background:transparent; border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--ink); height:100%; }
        .ap-search input::placeholder { color:rgba(10,10,10,.3); }
        .ap-sync-label { font-size:11px; font-weight:300; color:var(--mid); white-space:nowrap; }

        /* ── TABLE ── */
        .ap-table { width:100%; border-collapse:collapse; font-size:13px; }
        .ap-table thead th { padding:12px 20px; font-size:10px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--mid); border-bottom:1px solid var(--border); background:var(--paper); white-space:nowrap; }
        .ap-table thead th:first-child { padding-left:24px; }
        .ap-table thead th:last-child { padding-right:24px; }

        .ap-table tbody tr { border-bottom:1px solid var(--border); transition:background .15s; }
        .ap-table tbody tr:last-child { border-bottom:none; }
        .ap-table tbody tr:hover { background:var(--paper); }
        .ap-table td { padding:16px 20px; vertical-align:middle; }
        .ap-table td:first-child { padding-left:24px; }
        .ap-table td:last-child { padding-right:24px; }

        /* Product cell */
        .ap-product-img { width:56px; height:70px; border-radius:6px; overflow:hidden; background:#ede9e3; flex-shrink:0; }
        .ap-product-img img { width:100%; height:100%; object-fit:cover; transition:transform .5s; }
        tr:hover .ap-product-img img { transform:scale(1.06); }
        .ap-product-title { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; line-height:1.1; }
        .ap-product-id { font-size:10px; color:var(--mid); font-weight:300; margin-top:3px; }

        /* Category pill */
        .ap-cat-pill { display:inline-flex; align-items:center; padding:4px 12px; border-radius:4px; border:1px solid var(--border); background:var(--paper); font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:var(--mid); white-space:nowrap; }

        /* Price */
        .ap-price { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:900; }

        /* Stock badge */
        .ap-stock-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; }
        .ap-stock-units { font-size:11px; font-weight:300; color:var(--mid); margin-top:3px; display:block; }

        /* Action btns */
        .ap-action-btn { width:34px; height:34px; border-radius:6px; border:1.5px solid var(--border); background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--mid); transition:border-color .2s,color .2s,background .2s; text-decoration:none; }
        .ap-action-btn:hover { border-color:var(--ink); color:var(--ink); background:var(--paper); }
        .ap-action-btn.del:hover { border-color:#e11d48; color:#e11d48; background:#fff0f3; }

        /* Skeleton */
        .ap-skeleton { background:rgba(10,10,10,.06); border-radius:6px; animation:ap-pulse 1.4s ease-in-out infinite; }
        @keyframes ap-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* Empty */
        .ap-empty { padding:80px 24px; text-align:center; }
        .ap-empty-icon { width:56px; height:56px; border-radius:8px; background:var(--paper); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:var(--mid); }
        .ap-empty h4 { font-family:'Barlow Condensed',sans-serif; font-size:28px; font-weight:900; text-transform:uppercase; margin-bottom:8px; }
        .ap-empty p { font-size:13px; font-weight:300; color:var(--mid); }
      `}</style>

      <div className="ap-wrap">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="ap-header">
          <div>
            <span className="ap-header-tag">Inventory Management</span>
            <h1 className="ap-header-title">Products</h1>
            <p className="ap-header-sub">Manage your product catalog, stock levels, and pricing.</p>
          </div>
          <div className="ap-header-actions">
            <button className="ap-icon-btn" onClick={() => fetchProducts(search)} title="Refresh" aria-label="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <Link href="/admin/products/new" className="ap-primary-btn">
              <Plus size={15} /> Add Product
            </Link>
          </div>
        </div>

        {/* ── STATS ──────────────────────────────────────────── */}
        <div className="ap-stats">
          {[
            { label: "Total Products", val: stats.total, sub: "In catalog" },
            { label: "Out of Stock",   val: stats.outOfStock, sub: "Need restocking" },
            { label: "Low Stock",      val: stats.lowStock,   sub: "Under 10 units" },
          ].map(({ label, val, sub }) => (
            <div key={label} className="ap-stat">
              <span className="ap-stat-label">{label}</span>
              <span className="ap-stat-val">{val}</span>
              <p className="ap-stat-sub">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── TABLE PANEL ────────────────────────────────────── */}
        <div className="ap-panel">

          {/* Toolbar */}
          <div className="ap-toolbar">
            <form onSubmit={handleSearch} className="ap-search" style={{ flex: 1, maxWidth: 480 }}>
              <span className="ap-search-icon"><Search size={15} /></span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
              />
            </form>
            <span className="ap-sync-label">Last synced: {new Date().toLocaleTimeString()}</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Product</th>
                  <th style={{ textAlign: "left" }}>Category</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "center" }}>Stock</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} style={{ padding: "10px 24px" }}>
                        <div className="ap-skeleton" style={{ height: 56 }} />
                      </td>
                    </tr>
                  ))
                ) : products.length > 0 ? (
                  products.map((p, i) => {
                    const status = stockStatus(p.stock);
                    return (
                      <motion.tr
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      >
                        {/* Product */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div className="ap-product-img">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.gallery?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop"}
                                alt={p.title}
                              />
                            </div>
                            <div>
                              <p className="ap-product-title">{p.title}</p>
                              <p className="ap-product-id">{p.id.slice(0, 12).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="ap-cat-pill">{p.category?.name || "Uncategorized"}</span>
                        </td>

                        {/* Price */}
                        <td style={{ textAlign: "right" }}>
                          <span className="ap-price">${p.price.toFixed(2)}</span>
                        </td>

                        {/* Stock */}
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="ap-stock-badge"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.icon} {status.label}
                          </span>
                          <span className="ap-stock-units">{p.stock} units</span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <Link href={`/products/${p.id}`} target="_blank" className="ap-action-btn" aria-label="View">
                              <ExternalLink size={14} />
                            </Link>
                            <Link href={`/admin/products/${p.id}/edit`} className="ap-action-btn" aria-label="Edit">
                              <Pencil size={14} />
                            </Link>
                            <button className="ap-action-btn del" onClick={() => handleDelete(p.id)} aria-label="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="ap-empty">
                        <div className="ap-empty-icon"><Package size={24} /></div>
                        <h4>No Products Found</h4>
                        <p>Try adjusting your search, or add your first product.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}