"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Eye, EyeOff, Link as LinkIcon, Image as ImageIcon, X, Pencil, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  isActive: boolean;
}

const EMPTY_FORM = {
  imageUrl: "",
  linkUrl: "",
  title: "",
  subtitle: "",
  isActive: true,
};

/* ─── Shared style tokens ────────────────────────────────────────────────── */

const INK = "#0a0a0a";
const PAPER = "#f5f3ef";
const ACCENT = "#c8ff00";
const MID = "#8a8a8a";
const BORDER = "rgba(10,10,10,0.1)";

/* ─── Sub-components ─────────────────────────────────────────────────────── */

/** Small lime pill above every section heading */
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2.5 py-1 text-[10px] uppercase font-medium mb-3"
      style={{
        backgroundColor: ACCENT,
        color: INK,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.14em",
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}

/** Shared label style for form inputs */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10px] uppercase mb-2"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        color: MID,
        letterSpacing: "0.14em",
      }}
    >
      {children}
    </label>
  );
}

/** Shared input style */
function Field({
  placeholder,
  value,
  onChange,
  required,
  type = "text",
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 text-sm outline-none transition-all duration-200"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        color: INK,
        backgroundColor: PAPER,
        border: `1.5px solid ${BORDER}`,
        borderRadius: 6,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = INK;
        e.currentTarget.style.backgroundColor = "#fff";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.backgroundColor = PAPER;
      }}
    />
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 px-6 py-5"
      style={{
        backgroundColor: accent ? INK : "#fff",
        border: `1px solid ${accent ? "transparent" : BORDER}`,
        borderRadius: 10,
      }}
    >
      <span
        className="text-4xl uppercase leading-none"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          color: accent ? ACCENT : INK,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          color: accent ? "rgba(255,255,255,0.45)" : MID,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Banner Card ────────────────────────────────────────────────────────── */

function BannerCard({
  banner,
  onEdit,
  onDelete,
  onToggle,
}: {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onToggle: (b: Banner) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        opacity: banner.isActive ? 1 : 0.6,
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {banner.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: PAPER }}
          >
            <ImageIcon size={32} style={{ color: BORDER }} />
          </div>
        )}

        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0) 55%)",
          }}
        />

        {/* Overlay text */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {banner.title && (
            <p
              className="text-white uppercase leading-tight"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: "-0.01em",
              }}
            >
              {banner.title}
            </p>
          )}
          {banner.subtitle && (
            <p
              className="text-white/60 text-xs mt-0.5"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {banner.subtitle}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-medium"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.1em",
              borderRadius: 4,
              backgroundColor: banner.isActive ? ACCENT : "rgba(10,10,10,0.7)",
              color: banner.isActive ? INK : "rgba(255,255,255,0.6)",
            }}
          >
            {banner.isActive ? (
              <CheckCircle2 size={10} strokeWidth={2} />
            ) : (
              <XCircle size={10} strokeWidth={2} />
            )}
            {banner.isActive ? "Live" : "Hidden"}
          </span>
        </div>

        {/* Link indicator */}
        {banner.linkUrl && (
          <div className="absolute top-3 right-3">
            <span
              className="w-7 h-7 flex items-center justify-center"
              style={{
                backgroundColor: "rgba(10,10,10,0.55)",
                borderRadius: 4,
              }}
              title={banner.linkUrl}
            >
              <LinkIcon size={12} strokeWidth={1.5} className="text-white/70" />
            </span>
          </div>
        )}
      </div>

      {/* Footer action row */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-1.5">
          {/* Toggle visibility */}
          <button
            onClick={() => onToggle(banner)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase transition-all duration-200 hover:bg-black/5"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: MID,
              letterSpacing: "0.1em",
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
            }}
            title={banner.isActive ? "Hide banner" : "Show banner"}
          >
            {banner.isActive ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
            {banner.isActive ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Edit */}
          <button
            onClick={() => onEdit(banner)}
            className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-black/5"
            style={{
              borderRadius: 5,
              border: `1px solid ${BORDER}`,
              color: MID,
            }}
            title="Edit banner"
          >
            <Pencil size={13} strokeWidth={1.5} />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(banner.id); setConfirmDelete(false); }}
                className="px-3 py-1.5 text-[10px] uppercase font-medium transition-all duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: INK,
                  color: "#fff",
                  borderRadius: 5,
                  letterSpacing: "0.1em",
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-[10px] uppercase font-medium transition-all duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: MID,
                  borderRadius: 5,
                  letterSpacing: "0.1em",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
              style={{
                borderRadius: 5,
                border: `1px solid ${BORDER}`,
                color: MID,
              }}
              title="Delete banner"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* ── Data fetching ── */
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/banners/all");
      setBanners(data);
    } catch {
      toast.error("Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  /* ── CRUD ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedId) {
        await api.patch(`/banners/${selectedId}`, formData);
        toast.success("Banner updated.");
      } else {
        await api.post("/banners", formData);
        toast.success("Banner added.");
      }
      setShowForm(false);
      fetchBanners();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/banners/${id}`);
      toast.success("Banner deleted.");
      fetchBanners();
    } catch {
      toast.error("Could not delete banner.");
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await api.patch(`/banners/${banner.id}`, { isActive: !banner.isActive });
      toast.success(`Banner ${!banner.isActive ? "published" : "hidden"}.`);
      fetchBanners();
    } catch {
      toast.error("Could not update banner status.");
    }
  };

  const handleEdit = (b: Banner) => {
    setFormData({
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || "",
      title: b.title || "",
      subtitle: b.subtitle || "",
      isActive: b.isActive,
    });
    setSelectedId(b.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNew = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setSelectedId(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData(EMPTY_FORM);
  };

  /* ── Derived stats ── */
  const total = banners.length;
  const live = banners.filter((b) => b.isActive).length;
  const hidden = total - live;

  /* ─── Render ── */
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: PAPER }}>

      {/* ── Dark ink page header ───────────────────────────── */}
      <div style={{ backgroundColor: INK }}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            {/* Left: title block */}
            <div>
              <SectionTag>Admin · Site Banners</SectionTag>
              <h1
                className="text-white uppercase leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(44px, 6vw, 80px)",
                  letterSpacing: "-0.02em",
                }}
              >
                Manage Banners
              </h1>
              <p
                className="mt-2 text-sm"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Add, edit, and schedule hero banners shown on the storefront.
              </p>
            </div>

            {/* Right: Add button */}
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 text-xs uppercase font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] shrink-0"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: ACCENT,
                color: INK,
                letterSpacing: "0.12em",
                borderRadius: 6,
              }}
            >
              <Plus size={15} strokeWidth={2} />
              Add Banner
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-3 mt-8">
            <StatCard value={total} label="Total Banners" />
            <StatCard value={live} label="Live" accent />
            <StatCard value={hidden} label="Hidden" />
          </div>
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-10">

        {/* ── Inline form ─────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="banner-form"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10"
            >
              <form
                onSubmit={handleSubmit}
                style={{
                  backgroundColor: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {/* Form header */}
                <div
                  className="flex items-center justify-between px-6 py-5"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <div>
                    <SectionTag>{isEditing ? "Edit Banner" : "New Banner"}</SectionTag>
                    <h2
                      className="uppercase leading-none"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: 28,
                        color: INK,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {isEditing ? "Update Banner Details" : "Add a New Banner"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-9 h-9 flex items-center justify-center transition-colors duration-200 hover:bg-black/5"
                    style={{ borderRadius: 5, border: `1px solid ${BORDER}`, color: MID }}
                    aria-label="Close form"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Form body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">

                  {/* Left: fields */}
                  <div className="space-y-5">
                    <div>
                      <FieldLabel>Image URL *</FieldLabel>
                      <Field
                        required
                        placeholder="https://example.com/banner.jpg"
                        value={formData.imageUrl}
                        onChange={(v) => setFormData({ ...formData, imageUrl: v })}
                      />
                    </div>
                    <div>
                      <FieldLabel>Link URL (optional)</FieldLabel>
                      <Field
                        placeholder="/products?collection=summer-25"
                        value={formData.linkUrl}
                        onChange={(v) => setFormData({ ...formData, linkUrl: v })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Headline</FieldLabel>
                        <Field
                          placeholder="Summer 2025"
                          value={formData.title}
                          onChange={(v) => setFormData({ ...formData, title: v })}
                        />
                      </div>
                      <div>
                        <FieldLabel>Subheading</FieldLabel>
                        <Field
                          placeholder="Shop the new drop"
                          value={formData.subtitle}
                          onChange={(v) => setFormData({ ...formData, subtitle: v })}
                        />
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5"
                      style={{
                        backgroundColor: PAPER,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                      }}
                    >
                      <div>
                        <p
                          className="text-xs font-medium uppercase"
                          style={{ fontFamily: "'DM Sans', sans-serif", color: INK, letterSpacing: "0.1em" }}
                        >
                          Publish banner
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                        >
                          Show this banner on the storefront immediately.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className="relative w-11 h-6 transition-colors duration-300 shrink-0"
                        style={{
                          backgroundColor: formData.isActive ? ACCENT : "rgba(10,10,10,0.12)",
                          borderRadius: 999,
                        }}
                        aria-checked={formData.isActive}
                        role="switch"
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white transition-transform duration-300 shadow-sm"
                          style={{
                            borderRadius: 999,
                            transform: formData.isActive ? "translateX(20px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Right: preview */}
                  <div>
                    <FieldLabel>Preview</FieldLabel>
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: "16/9", borderRadius: 8, backgroundColor: PAPER, border: `1px solid ${BORDER}` }}
                    >
                      {formData.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                          <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to top, rgba(10,10,10,0.65) 0%, transparent 55%)" }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            {formData.title && (
                              <p
                                className="text-white uppercase leading-tight"
                                style={{
                                  fontFamily: "'Barlow Condensed', sans-serif",
                                  fontWeight: 900,
                                  fontSize: 22,
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {formData.title}
                              </p>
                            )}
                            {formData.subtitle && (
                              <p
                                className="text-white/60 text-xs mt-0.5"
                                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                              >
                                {formData.subtitle}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <ImageIcon size={32} strokeWidth={1} style={{ color: "rgba(10,10,10,0.15)" }} />
                          <p
                            className="text-xs uppercase"
                            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "rgba(10,10,10,0.3)", letterSpacing: "0.12em" }}
                          >
                            Enter an image URL to preview
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form footer */}
                <div
                  className="flex items-center justify-end gap-3 px-6 py-4"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 text-xs uppercase font-medium transition-colors duration-200 hover:bg-black/5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: MID,
                      letterSpacing: "0.1em",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 6,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-2.5 text-xs uppercase font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: INK,
                      color: "#fff",
                      letterSpacing: "0.12em",
                      borderRadius: 6,
                    }}
                  >
                    {submitting ? "Saving…" : isEditing ? "Save Changes" : "Add Banner"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Banner grid ──────────────────────────────────── */}
        <div>
          {/* Grid header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <SectionTag>All Banners</SectionTag>
              <h2
                className="uppercase leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px, 4vw, 48px)",
                  color: INK,
                  letterSpacing: "-0.02em",
                }}
              >
                {loading ? "Loading…" : `${total} Banner${total !== 1 ? "s" : ""}`}
              </h2>
            </div>
            {!showForm && (
              <button
                onClick={handleNew}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: INK,
                  color: "#fff",
                  letterSpacing: "0.12em",
                  borderRadius: 6,
                }}
              >
                <Plus size={14} strokeWidth={2} />
                Add Banner
              </button>
            )}
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{ aspectRatio: "16/9", backgroundColor: "rgba(10,10,10,0.06)", borderRadius: 10 }}
                />
              ))}
            </div>
          )}

          {/* Cards */}
          {!loading && banners.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {banners.map((b) => (
                  <BannerCard
                    key={b.id}
                    banner={b}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && banners.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-28 text-center"
              style={{
                backgroundColor: "#fff",
                border: `1px dashed rgba(10,10,10,0.15)`,
                borderRadius: 10,
              }}
            >
              <ImageIcon size={40} strokeWidth={1} style={{ color: "rgba(10,10,10,0.15)", marginBottom: 16 }} />
              <h3
                className="uppercase"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: 32,
                  color: "rgba(10,10,10,0.2)",
                  letterSpacing: "-0.01em",
                }}
              >
                No Banners Yet
              </h3>
              <p
                className="text-sm mt-2 mb-8 max-w-xs"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
              >
                Add your first banner to start promoting collections and campaigns on your storefront.
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs uppercase font-medium transition-all duration-200 hover:opacity-90"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: INK,
                  color: "#fff",
                  letterSpacing: "0.12em",
                  borderRadius: 6,
                }}
              >
                <Plus size={14} strokeWidth={2} />
                Add First Banner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}