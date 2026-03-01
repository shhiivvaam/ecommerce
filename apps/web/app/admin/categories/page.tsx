"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/lib/useCategories";
import { api } from "@/lib/api";
import { Tag, Plus, Trash2, Pencil, X, Package, Layers, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: loading } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/categories/${editingId}`, formData);
        toast.success("Category updated");
      } else {
        await api.post("/categories", formData);
        toast.success("Category created");
      }
      setFormData({ name: "", description: "" });
      setShowForm(false);
      setEditingId(null);
      invalidate();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("This will unlink all products from this category. Continue?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      invalidate();
    } catch { toast.error("Could not delete category"); }
  };

  const startEdit = (c: Category) => {
    setFormData({ name: c.name, description: c.description || "" });
    setEditingId(c.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  const totalProducts = categories.reduce((s, c) => s + (c._count?.products || 0), 0);
  const avgProducts = categories.length ? (totalProducts / categories.length).toFixed(1) : "0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); --card:#fff; }

        .ac-wrap { font-family:'DM Sans',sans-serif; color:var(--ink); padding-bottom:80px; }

        /* ── HEADER ── */
        .ac-header { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:40px; }
        .ac-header-tag { font-size:11px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:10px; }
        .ac-header-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(40px,6vw,64px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.01em; }
        .ac-header-sub { font-size:14px; font-weight:300; color:var(--mid); margin-top:8px; }

        .ac-add-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 24px; border-radius:6px;
          background:var(--ink); color:#fff; border:none; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
          letter-spacing:.1em; text-transform:uppercase;
          transition:background .2s, transform .15s;
        }
        .ac-add-btn:hover:not(:disabled) { background:#222; transform:translateY(-1px); }
        .ac-add-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* ── STATS ── */
        .ac-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom:40px; }
        .ac-stat { background:var(--card); padding:24px 28px; }
        .ac-stat-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:8px; }
        .ac-stat-val { font-family:'Barlow Condensed',sans-serif; font-size:40px; font-weight:900; line-height:1; }
        .ac-stat-sub { font-size:11px; color:var(--mid); font-weight:300; margin-top:4px; }

        /* ── FORM ── */
        .ac-form { background:var(--card); border:1.5px solid var(--border); border-radius:8px; padding:32px; margin-bottom:32px; }
        .ac-form-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
        .ac-form-title { font-family:'Barlow Condensed',sans-serif; font-size:28px; font-weight:900; text-transform:uppercase; }
        .ac-form-tag { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); background:var(--ink); padding:3px 10px; border-radius:4px; margin-left:12px; }
        .ac-close-btn { width:36px; height:36px; border-radius:6px; border:1.5px solid var(--border); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--mid); transition:border-color .2s, color .2s; }
        .ac-close-btn:hover { border-color:var(--ink); color:var(--ink); }

        .ac-form-grid { display:grid; grid-template-columns:1fr; gap:20px; margin-bottom:28px; }
        @media(min-width:640px){ .ac-form-grid { grid-template-columns:1fr 1fr; } }

        .ac-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--mid); display:block; margin-bottom:8px; }
        .ac-input {
          width:100%; height:44px; padding:0 14px;
          border:1.5px solid var(--border); border-radius:6px;
          background:var(--paper); color:var(--ink);
          font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
          outline:none; transition:border-color .2s;
        }
        .ac-input:focus { border-color:var(--ink); }
        .ac-input::placeholder { color:rgba(10,10,10,.25); }

        .ac-form-footer { display:flex; justify-content:flex-end; gap:12px; padding-top:24px; border-top:1px solid var(--border); }
        .ac-cancel-btn { padding:11px 20px; border-radius:6px; border:1.5px solid var(--border); background:transparent; color:var(--mid); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; transition:border-color .2s, color .2s; }
        .ac-cancel-btn:hover { border-color:var(--ink); color:var(--ink); }
        .ac-save-btn { padding:11px 28px; border-radius:6px; border:none; background:var(--ink); color:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; transition:background .2s; min-width:160px; display:flex; align-items:center; justify-content:center; gap:8px; }
        .ac-save-btn:hover:not(:disabled) { background:#222; }
        .ac-save-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* ── GRID ── */
        .ac-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }

        .ac-card { background:var(--card); border:1.5px solid var(--border); border-radius:8px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; gap:20px; transition:border-color .2s, transform .25s; }
        .ac-card:hover { border-color:rgba(10,10,10,.25); transform:translateY(-3px); }

        .ac-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .ac-card-icon { width:44px; height:44px; border-radius:8px; background:var(--paper); border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--mid); flex-shrink:0; }
        .ac-card-actions { display:flex; gap:6px; }
        .ac-icon-btn { width:34px; height:34px; border-radius:6px; border:1.5px solid var(--border); background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--mid); transition:border-color .2s, color .2s, background .2s; }
        .ac-icon-btn:hover { border-color:var(--ink); color:var(--ink); background:var(--paper); }
        .ac-icon-btn.del:hover { border-color:#e11d48; color:#e11d48; background:#fff0f3; }

        .ac-card-name { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; line-height:1.1; margin-bottom:4px; }
        .ac-card-slug { font-size:10px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--mid); }
        .ac-card-desc { font-size:13px; font-weight:300; color:var(--mid); line-height:1.55; margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        .ac-card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border); }
        .ac-card-count { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:var(--mid); }
        .ac-card-accent { width:6px; height:6px; border-radius:50%; background:var(--accent); }

        /* skeleton */
        .ac-skeleton { border-radius:8px; background:rgba(10,10,10,.06); animation:ac-pulse 1.4s ease-in-out infinite; }
        @keyframes ac-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* empty */
        .ac-empty { grid-column:1/-1; text-align:center; padding:80px 24px; border:1.5px dashed var(--border); border-radius:8px; }
        .ac-empty h3 { font-family:'Barlow Condensed',sans-serif; font-size:32px; font-weight:900; text-transform:uppercase; margin-bottom:8px; }
        .ac-empty p { font-size:14px; font-weight:300; color:var(--mid); max-width:320px; margin:0 auto 28px; }
        .ac-empty-btn { display:inline-flex; align-items:center; gap:8px; padding:13px 28px; border-radius:6px; background:var(--ink); color:#fff; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; transition:background .2s; }
        .ac-empty-btn:hover { background:#222; }
      `}</style>

      <div className="ac-wrap">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="ac-header">
          <div>
            <span className="ac-header-tag">Catalog Management</span>
            <h1 className="ac-header-title">Categories</h1>
            <p className="ac-header-sub">Manage your product categories and catalog structure.</p>
          </div>
          <button className="ac-add-btn" onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus size={15} /> Add Category
          </button>
        </div>

        {/* ── STATS ──────────────────────────────────────── */}
        <div className="ac-stats">
          {[
            { label: "Total Categories", val: categories.length, sub: "Active", icon: <Layers size={16} /> },
            { label: "Total Products", val: totalProducts, sub: "Across all categories", icon: <Package size={16} /> },
            { label: "Avg per Category", val: avgProducts, sub: "Products / category", icon: <Activity size={16} /> },
          ].map(({ label, val, sub, icon }) => (
            <div key={label} className="ac-stat">
              <span className="ac-stat-label">{label}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="ac-stat-val">{val}</span>
                <span style={{ color: "var(--mid)", fontSize: 12, fontWeight: 300 }}>{icon}</span>
              </div>
              <p className="ac-stat-sub">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── FORM ───────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: .25 }}
            >
              <form onSubmit={handleSubmit} className="ac-form">
                <div className="ac-form-header">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <h3 className="ac-form-title">{editingId ? "Edit Category" : "New Category"}</h3>
                    {editingId && <span className="ac-form-tag">Editing</span>}
                  </div>
                  <button type="button" className="ac-close-btn" onClick={cancelForm}><X size={16} /></button>
                </div>

                <div className="ac-form-grid">
                  <div>
                    <label className="ac-label">Category Name *</label>
                    <input
                      required
                      className="ac-input"
                      placeholder="e.g. Running"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="ac-label">Description (optional)</label>
                    <input
                      className="ac-input"
                      placeholder="Brief description of this category"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ac-form-footer">
                  <button type="button" className="ac-cancel-btn" onClick={cancelForm}>Cancel</button>
                  <button type="submit" className="ac-save-btn" disabled={saving}>
                    {saving ? "Saving…" : editingId ? "Save Changes" : "Create Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CATEGORY GRID ──────────────────────────────── */}
        <div className="ac-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ac-skeleton" style={{ height: 180 }} />
            ))
          ) : categories.length > 0 ? (
            categories.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                className="ac-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div>
                  <div className="ac-card-top">
                    <div className="ac-card-icon"><Tag size={18} /></div>
                    <div className="ac-card-actions">
                      <button className="ac-icon-btn" onClick={() => startEdit(c)} aria-label="Edit"><Pencil size={14} /></button>
                      <button className="ac-icon-btn del" onClick={() => handleDelete(c.id)} aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <h4 className="ac-card-name">{c.name}</h4>
                    <p className="ac-card-slug">/{c.slug}</p>
                    {c.description && <p className="ac-card-desc">{c.description}</p>}
                  </div>
                </div>

                <div className="ac-card-footer">
                  <div className="ac-card-count">
                    <Package size={13} />
                    {c._count?.products || 0} product{c._count?.products !== 1 ? "s" : ""}
                  </div>
                  <span className="ac-card-accent" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="ac-empty">
              <Tag size={40} style={{ color: "var(--mid)", margin: "0 auto 20px" }} />
              <h3>No Categories Yet</h3>
              <p>Create your first category to start organizing your product catalog.</p>
              <button className="ac-empty-btn" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Add First Category
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
