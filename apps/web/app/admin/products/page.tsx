"use client";

import { useState } from "react";
import { Plus, Search, Trash2, RefreshCw, Pencil, Package, AlertTriangle, CheckCircle, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useProducts, useDeleteProduct } from "@/lib/hooks/useProducts";
import { useAdminStats } from "@/lib/hooks/useAdminStats";

const INK = "#0a0a0a";
const PAPER = "#f5f3ef";
const MID = "#8a8a8a";
const BORDER = "rgba(10,10,10,0.1)";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading: productsLoading, refetch } = useProducts({ limit: 100, search: search || undefined });
  const { data: statsData, isLoading: statsLoading } = useAdminStats();
  const { mutate: deleteProduct } = useDeleteProduct();

  const products = productsData?.data ?? [];
  const loading = productsLoading;

  const stats = {
    total: statsData?.totalProducts ?? productsData?.total ?? 0,
    outOfStock: statsData?.outOfStockCount ?? products.filter(p => (p.stock ?? 0) === 0).length,
    lowStock: statsData?.lowStockCount ?? products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length,
  };

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this product?")) return;
    deleteProduct(id, { onSuccess: () => { toast.success("Product deleted"); refetch(); } });
  };

  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
                .ap-wrap { font-family:'DM Sans',sans-serif; color:${INK}; padding-bottom:80px; }
                .ap-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,72px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.02em; }
                .ap-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1px; background:${BORDER}; border:1px solid ${BORDER}; border-radius:10px; overflow:hidden; margin-bottom:32px; }
                .ap-kpi { background:#fff; padding:18px 24px; }
                .ap-kpi-val { font-family:'Barlow Condensed',sans-serif; font-size:36px; font-weight:900; line-height:1; letter-spacing:-.02em; }
                .ap-kpi-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:${MID}; margin-top:4px; }
                .ap-toolbar { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:24px; }
                .ap-search { flex:1; min-width:200px; max-width:360px; position:relative; }
                .ap-search input { width:100%; height:40px; padding:0 14px 0 38px; border:1.5px solid ${BORDER}; border-radius:6px; background:${PAPER}; font-family:'DM Sans',sans-serif; font-size:13px; color:${INK}; outline:none; transition:border-color .2s; }
                .ap-search input:focus { border-color:${INK}; }
                .ap-search svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:${MID}; pointer-events:none; }
                .ap-table { width:100%; border-collapse:collapse; background:#fff; border:1px solid ${BORDER}; border-radius:10px; overflow:hidden; }
                .ap-th { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:${MID}; padding:12px 20px; text-align:left; border-bottom:1px solid ${BORDER}; background:${PAPER}; }
                .ap-td { padding:14px 20px; font-size:13px; border-bottom:1px solid ${BORDER}; vertical-align:middle; }
                tr:last-child .ap-td { border-bottom:none; }
                .ap-row { transition:background .15s; }
                .ap-row:hover { background:${PAPER}; }
                .ap-btn { height:32px; padding:0 14px; border-radius:6px; border:1.5px solid ${BORDER}; background:transparent; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:6px; text-decoration:none; }
                .ap-btn-ink { background:${INK}; border-color:${INK}; color:#fff; }
                .ap-btn-ink:hover:not(:disabled) { background:#222; }
                .ap-btn:hover:not(:disabled):not(.ap-btn-ink) { border-color:${INK}; color:${INK}; }
                .ap-skel { background:rgba(10,10,10,0.06); border-radius:6px; animation:ap-pulse 1.4s ease-in-out infinite; }
                @keyframes ap-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
                .ap-empty { text-align:center; padding:60px 24px; border:1.5px dashed ${BORDER}; border-radius:10px; }
            `}</style>

      <div className="ap-wrap">
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>Product Catalog</span>
            <h1 className="ap-title">Products</h1>
            <p style={{ fontSize: 13, color: MID, fontWeight: 300, marginTop: 6 }}>Manage all products, control stock levels and visibility.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => refetch()} className="ap-btn" style={{ color: MID }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link href="/admin/products/new" className="ap-btn ap-btn-ink">
              <Plus size={13} /> Add Product
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="ap-kpi-grid">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="ap-kpi"><div className="ap-skel" style={{ height: 40 }} /></div>
            ))
          ) : (
            [
              { label: "Total Products", val: stats.total, color: INK },
              { label: "Out of Stock", val: stats.outOfStock, color: stats.outOfStock > 0 ? "#c0392b" : INK },
              { label: "Low Stock", val: stats.lowStock, color: stats.lowStock > 0 ? "#e67e22" : INK },
            ].map(({ label, val, color }) => (
              <div key={label} className="ap-kpi">
                <div className="ap-kpi-val" style={{ color }}>{val}</div>
                <div className="ap-kpi-label">{label}</div>
              </div>
            ))
          )}
        </div>

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p style={{ fontSize: 11, color: MID, fontWeight: 300, marginLeft: "auto" }}>
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="ap-skel" style={{ height: 280, borderRadius: 10 }} />
        ) : products.length > 0 ? (
          <table className="ap-table">
            <thead>
              <tr>
                {["Product", "Price", "Stock", "Category", "Actions"].map((h, i) => (
                  <th key={h} className="ap-th" style={{ textAlign: i >= 4 ? "center" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => {
                const stock = product.stock ?? 0;
                let stockColor = "#16a34a", stockIcon = <CheckCircle size={12} />, stockBg = "#f0fdf4";
                if (stock === 0) { stockColor = "#c0392b"; stockIcon = <AlertTriangle size={12} />; stockBg = "#fff0f0"; }
                else if (stock < 10) { stockColor = "#e67e22"; stockIcon = <Clock size={12} />; stockBg = "#fff8f0"; }

                return (
                  <motion.tr key={product.id} className="ap-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}>
                    <td className="ap-td">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {product.gallery?.[0] ? (
                          <div style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                            <Image src={product.gallery[0]} alt={product.title} width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                          </div>
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: PAPER, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={16} style={{ color: MID }} />
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 500, color: INK, lineHeight: 1.3 }}>{product.title}</p>
                          <p style={{ fontSize: 11, color: MID, fontWeight: 300, marginTop: 2, fontFamily: "monospace" }}>{product.id.slice(0, 12)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="ap-td" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="ap-td">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, backgroundColor: stockBg, color: stockColor }}>
                        {stockIcon} {stock}
                      </span>
                    </td>
                    <td className="ap-td">
                      {product.category ? (
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, backgroundColor: PAPER, color: INK }}>{product.category.name}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: MID, fontWeight: 300 }}>—</span>
                      )}
                    </td>
                    <td className="ap-td">
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <Link href={`/product/${product.id}`} target="_blank" className="ap-btn" style={{ color: MID }} title="View in store">
                          <ExternalLink size={12} />
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`} className="ap-btn" style={{ color: MID }} title="Edit product">
                          <Pencil size={12} />
                        </Link>
                        <button className="ap-btn" style={{ color: "#c0392b", borderColor: "rgba(192,57,43,0.2)" }}
                          onClick={() => handleDelete(product.id)} title="Delete product">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="ap-empty">
            <Package size={36} style={{ color: "rgba(10,10,10,0.15)", margin: "0 auto 12px" }} />
            <p style={{ color: MID, fontSize: 14, fontWeight: 300 }}>{search ? "No products match your search." : "No products yet."}</p>
            {!search && (
              <Link href="/admin/products/new" className="ap-btn ap-btn-ink" style={{ display: "inline-flex", marginTop: 16 }}>
                <Plus size={13} /> Add First Product
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
