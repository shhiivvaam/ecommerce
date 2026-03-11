"use client";

import { useState } from "react";
import {
  Ticket, Plus, Trash2, Calendar, Percent,
  Banknote, X, Activity, DollarSign, Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/lib/hooks/useAdminCoupons";

interface CouponFormData {
  code: string;
  discount: number;
  isFlat: boolean;
  expiryDate: string;
  usageLimit: number;
  minTotal: number;
}

const defaultForm = (): CouponFormData => ({
  code: "",
  discount: 0,
  isFlat: false,
  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  usageLimit: 100,
  minTotal: 0,
});

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

.cp-wrap {
  font-family: 'DM Sans', sans-serif;
  color: #0a0a0a;
}

/* ── Field label ── */
.cp-label {
  display: block;
  font-size: 10px; font-weight: 500;
  letter-spacing: .16em; text-transform: uppercase;
  color: #8a8a8a; margin-bottom: 8px;
}

/* ── Text input ── */
.cp-input {
  width: 100%; height: 48px;
  padding: 0 16px; border-radius: 6px;
  border: 1.5px solid rgba(10,10,10,0.1);
  background: #f5f3ef;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 400; color: #0a0a0a;
  outline: none; transition: border-color .2s;
}
.cp-input:focus { border-color: #0a0a0a; }
.cp-input::placeholder { color: rgba(10,10,10,.28); }
.cp-input:disabled { opacity: .45; cursor: not-allowed; }

/* ── Toggle type button ── */
.cp-type-toggle {
  height: 48px; width: 48px; border-radius: 6px; flex-shrink: 0;
  border: 1.5px solid rgba(10,10,10,0.1); background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .2s, border-color .2s;
}
.cp-type-toggle:hover { border-color: #0a0a0a; }
.cp-type-toggle.flat { background: #0a0a0a; border-color: #0a0a0a; }

/* ── Primary button ── */
.cp-btn-primary {
  height: 48px; padding: 0 28px; border-radius: 6px; border: none;
  background: #0a0a0a; color: #fff; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .2s, transform .15s; flex-shrink: 0;
}
.cp-btn-primary:hover { background: #1a1a1a; transform: translateY(-1px); }
.cp-btn-primary:active { transform: translateY(0); }

/* ── Ghost button ── */
.cp-btn-ghost {
  height: 48px; padding: 0 24px; border-radius: 6px;
  border: 1.5px solid rgba(10,10,10,0.1); background: transparent;
  color: #8a8a8a; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 8px;
  transition: border-color .2s, color .2s;
}
.cp-btn-ghost:hover { border-color: #0a0a0a; color: #0a0a0a; }

/* ── Icon button ── */
.cp-icon-btn {
  width: 36px; height: 36px; border-radius: 6px; flex-shrink: 0;
  border: 1.5px solid rgba(10,10,10,0.1); background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .2s, border-color .2s, color .2s;
  color: #8a8a8a;
}
.cp-icon-btn:hover { border-color: #0a0a0a; color: #0a0a0a; background: #fff; }
.cp-icon-btn.danger:hover { background: #e11d48; border-color: #e11d48; color: #fff; }

/* ── Form card ── */
.cp-form-card {
  background: #fff; border: 1px solid rgba(10,10,10,0.1); border-radius: 10px;
  padding: 36px; margin-bottom: 0;
}

/* ── Coupon card ── */
.cp-card {
  background: #fff; border: 1px solid rgba(10,10,10,0.1); border-radius: 10px;
  padding: 28px; display: flex; flex-direction: column;
  transition: box-shadow .2s, transform .2s, border-color .2s;
  position: relative; overflow: hidden;
}
.cp-card:hover {
  box-shadow: 0 8px 32px rgba(10,10,10,0.1);
  transform: translateY(-2px);
  border-color: rgba(10,10,10,0.18);
}
.cp-card.inactive { opacity: .55; }

/* ── Status badge ── */
.cp-badge {
  display: inline-flex; align-items: center;
  font-size: 9px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 4px;
}
.cp-badge.active { background: rgba(200,255,0,.18); color: #3d5200; border: 1px solid rgba(200,255,0,.35); }
.cp-badge.expired { background: rgba(225,29,72,.08); color: #be123c; border: 1px solid rgba(225,29,72,.15); }
.cp-badge.voided { background: rgba(10,10,10,.06); color: #8a8a8a; border: 1px solid rgba(10,10,10,.1); }

/* ── Dashed divider ── */
.cp-dashed { border: none; border-top: 1.5px dashed rgba(10,10,10,.1); margin: 20px 0; }

/* ── Skeleton ── */
@keyframes cp-pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
.cp-skel { background: rgba(10,10,10,.07); border-radius: 8px; animation: cp-pulse 1.6s ease-in-out infinite; }

/* ── Section eyebrow ── */
.cp-eyebrow {
  font-size: 10px; font-weight: 500; letter-spacing: .18em;
  text-transform: uppercase; color: #c8ff00;
  display: block; margin-bottom: 10px;
}
.cp-eyebrow-dark { color: #0a0a0a; }

/* ── Rule ── */
.cp-rule { height: 1px; background: rgba(10,10,10,.1); border: none; margin: 0; }
`;

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading: loading } = useAdminCoupons();
  const { mutate: createCoupon } = useCreateCoupon();
  const { mutate: updateCoupon } = useUpdateCoupon();
  const { mutate: deleteCoupon } = useDeleteCoupon();

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultForm());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
    };
    const onSuccess = () => {
      toast.success(isEditing ? "Coupon updated" : "Coupon created");
      setShowForm(false);
      setFormData(defaultForm());
      setIsEditing(false);
      setSelectedId(null);
    };
    if (isEditing && selectedId) {
      updateCoupon({ id: selectedId, ...payload }, { onSuccess });
    } else {
      createCoupon(payload, { onSuccess });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    deleteCoupon(id, { onSuccess: () => toast.success("Coupon deleted") });
  };

  const handleEdit = (c: (typeof coupons)[0]) => {
    setFormData({
      code: c.code,
      discount: c.discount,
      isFlat: c.isFlat,
      expiryDate: c.expiryDate.split("T")[0],
      usageLimit: c.usageLimit || 100,
      minTotal: c.minTotal,
    });
    setSelectedId(c.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData(defaultForm());
    setIsEditing(false);
    setShowForm(true);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="cp-wrap" style={{ paddingBottom: 80 }}>

        {/* ── PAGE HEADER ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 48,
          }}
        >
          <div>
            <span className="cp-eyebrow cp-eyebrow-dark">Promotions</span>
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 0.95,
                letterSpacing: "-.01em",
                margin: 0,
              }}
            >
              Discount
              <br />
              Coupons
            </h1>
          </div>
          <button className="cp-btn-primary" onClick={handleNew}>
            <Plus size={15} />
            New Coupon
          </button>
        </div>

        <hr className="cp-rule" style={{ marginBottom: 40 }} />

        {/* ── CREATE / EDIT FORM ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              style={{ marginBottom: 40 }}
            >
              <div className="cp-form-card">

                {/* Form header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 32,
                    gap: 16,
                  }}
                >
                  <div>
                    <span className="cp-eyebrow cp-eyebrow-dark">
                      {isEditing ? "Edit Coupon" : "Create Coupon"}
                    </span>
                    <h2
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 32,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      {isEditing ? "Update Details" : "New Promotion"}
                    </h2>
                  </div>
                  <button
                    className="cp-icon-btn"
                    onClick={() => setShowForm(false)}
                    style={{ width: 40, height: 40, marginTop: 4 }}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Fields grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 20,
                      marginBottom: 28,
                    }}
                  >
                    {/* Code */}
                    <div>
                      <label className="cp-label">Coupon Code</label>
                      <input
                        className="cp-input"
                        required
                        placeholder="e.g. SUMMER20"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        disabled={isEditing}
                        style={{
                          fontWeight: 600,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                        }}
                      />
                    </div>

                    {/* Discount + type toggle */}
                    <div>
                      <label className="cp-label">
                        Discount Amount&nbsp;
                        <span style={{ color: "#0a0a0a", fontWeight: 600 }}>
                          ({formData.isFlat ? "$" : "%"})
                        </span>
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="cp-input"
                          type="number"
                          required
                          min={0}
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discount: parseFloat(e.target.value),
                            })
                          }
                          style={{ fontWeight: 600 }}
                        />
                        <button
                          type="button"
                          className={`cp-type-toggle${formData.isFlat ? " flat" : ""}`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              isFlat: !formData.isFlat,
                            })
                          }
                          title={
                            formData.isFlat
                              ? "Flat amount — click to switch to %"
                              : "Percentage — click to switch to $"
                          }
                        >
                          {formData.isFlat ? (
                            <Banknote
                              size={17}
                              color={formData.isFlat ? "#c8ff00" : "#8a8a8a"}
                            />
                          ) : (
                            <Percent size={17} color="#8a8a8a" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="cp-label">Expiry Date</label>
                      <input
                        className="cp-input"
                        type="date"
                        required
                        value={formData.expiryDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Usage limit */}
                    <div>
                      <label className="cp-label">Usage Limit</label>
                      <input
                        className="cp-input"
                        type="number"
                        min={0}
                        value={formData.usageLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usageLimit: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    {/* Min total */}
                    <div>
                      <label className="cp-label">Min. Order Total ($)</label>
                      <input
                        className="cp-input"
                        type="number"
                        min={0}
                        value={formData.minTotal}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minTotal: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Form actions */}
                  <hr className="cp-rule" style={{ marginBottom: 24 }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      className="cp-btn-ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="cp-btn-primary">
                      {isEditing ? "Save Changes" : "Create Coupon"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COUPONS GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="cp-skel"
                style={{ height: 240, borderRadius: 10 }}
              />
            ))
          ) : coupons.length > 0 ? (
            coupons.map((c, i) => {
              const isExpired = new Date(c.expiryDate) < new Date();
              const isLimitReached = c.usageLimit
                ? c.usedCount >= c.usageLimit
                : false;
              const isActive = !isExpired && !isLimitReached;
              const statusLabel = isActive
                ? "Active"
                : isExpired
                ? "Expired"
                : "Voided";
              const statusClass = isActive
                ? "active"
                : isExpired
                ? "expired"
                : "voided";

              return (
                <motion.div
                  layout
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`cp-card${!isActive ? " inactive" : ""}`}
                >
                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive
                          ? "rgba(200,255,0,.14)"
                          : "rgba(10,10,10,.05)",
                        flexShrink: 0,
                      }}
                    >
                      <Ticket
                        size={18}
                        color={isActive ? "#3d5200" : "#8a8a8a"}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="cp-icon-btn"
                        onClick={() => handleEdit(c)}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="cp-icon-btn danger"
                        onClick={() => handleDelete(c.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Code + status */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        lineHeight: 1,
                      }}
                    >
                      {c.code}
                    </span>
                    <span className={`cp-badge ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Discount value */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 44,
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#0a0a0a",
                      }}
                    >
                      {c.isFlat ? `$${c.discount}` : `${c.discount}%`}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        color: "#8a8a8a",
                      }}
                    >
                      {c.isFlat ? "Flat Off" : "Discount"}
                    </span>
                  </div>

                  <hr className="cp-dashed" />

                  {/* Meta rows */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          color: "#8a8a8a",
                          fontWeight: 400,
                        }}
                      >
                        <Calendar size={12} />
                        Expires
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: isExpired ? "#be123c" : "#0a0a0a",
                        }}
                      >
                        {new Date(c.expiryDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          color: "#8a8a8a",
                          fontWeight: 400,
                        }}
                      >
                        <Activity size={12} />
                        Usage
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {c.usedCount}{" "}
                        <span style={{ color: "#8a8a8a", fontWeight: 300 }}>
                          / {c.usageLimit || "∞"}
                        </span>
                      </span>
                    </div>

                    {/* Usage progress bar */}
                    {typeof c.usageLimit === "number" && c.usageLimit > 0 && (
                      <div
                        style={{
                          height: 3,
                          borderRadius: 2,
                          background: "rgba(10,10,10,.08)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 2,
                            width: `${Math.min(100, (c.usedCount / (c.usageLimit || 1)) * 100)}%`,
                            background: isLimitReached
                              ? "#e11d48"
                              : "#c8ff00",
                            transition: "width .4s ease",
                          }}
                        />
                      </div>
                    )}

                    {c.minTotal > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: "#8a8a8a",
                            fontWeight: 400,
                          }}
                        >
                          <DollarSign size={12} />
                          Min. Order
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                          ${c.minTotal}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            /* ── Empty state ── */
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "80px 32px",
                textAlign: "center",
                border: "1.5px dashed rgba(10,10,10,.12)",
                borderRadius: 10,
              }}
            >
              <Ticket
                size={40}
                style={{ color: "#d0cec9", margin: "0 auto 20px" }}
              />
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 32,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                No Coupons Yet
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "#8a8a8a",
                  fontWeight: 300,
                  marginBottom: 28,
                }}
              >
                Create your first promotional coupon to get started.
              </p>
              <button className="cp-btn-primary" onClick={handleNew}>
                <Plus size={15} />
                Create First Coupon
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}