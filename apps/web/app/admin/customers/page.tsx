"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Shield, ShieldOff, Search, RefreshCw, Users, UserCheck, UserX,
  Mail, X, MapPin, Calendar, ShoppingBag, ChevronDown, ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  deletedAt?: string | null;
  createdAt: string;
  role: { name: string };
  _count: { orders: number };
  orders?: Order[];
  addresses?: Address[];
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */

const INK    = "#0a0a0a";
const PAPER  = "#f5f3ef";
const ACCENT = "#c8ff00";
const MID    = "#8a8a8a";
const BORDER = "rgba(10,10,10,0.1)";

/* ─── Shared primitives ──────────────────────────────────────────────────── */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2.5 py-1 text-[10px] uppercase font-medium mb-3"
      style={{
        backgroundColor: ACCENT, color: INK,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.14em", borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}

function DisplayHeading({
  children, light = false, size = "lg",
}: { children: React.ReactNode; light?: boolean; size?: "sm" | "md" | "lg" }) {
  const fs = size === "lg" ? "clamp(44px,6vw,80px)" : size === "md" ? "clamp(28px,4vw,48px)" : 24;
  return (
    <h2
      className="uppercase leading-none"
      style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: fs, letterSpacing: "-0.02em",
        color: light ? "#ffffff" : INK,
      }}
    >
      {children}
    </h2>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */

function StatCard({
  value, label, icon: Icon, accent = false,
}: { value: number; label: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div
      className="flex items-center gap-5 px-6 py-5"
      style={{
        backgroundColor: accent ? INK : "#fff",
        border: `1px solid ${accent ? "transparent" : BORDER}`,
        borderRadius: 10,
      }}
    >
      <div
        className="w-11 h-11 flex items-center justify-center shrink-0"
        style={{
          backgroundColor: accent ? "rgba(200,255,0,0.12)" : PAPER,
          borderRadius: 8,
        }}
      >
        <Icon size={18} strokeWidth={1.5} style={{ color: accent ? ACCENT : MID }} />
      </div>
      <div>
        <p
          className="text-3xl uppercase leading-none"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            letterSpacing: "-0.02em", color: accent ? ACCENT : INK,
          }}
        >
          {value}
        </p>
        <p
          className="text-[10px] uppercase mt-0.5"
          style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            color: accent ? "rgba(255,255,255,0.4)" : MID,
            letterSpacing: "0.12em",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-medium"
      style={{
        fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em",
        borderRadius: 4,
        backgroundColor: blocked ? "rgba(10,10,10,0.07)" : ACCENT,
        color: blocked ? MID : INK,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: blocked ? MID : INK }}
      />
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

/* ─── Order status chip ──────────────────────────────────────────────────── */

function OrderChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = PAPER, color = MID;
  if (s === "delivered" || s === "completed") { bg = "#e8ffc4"; color = "#2d6a00"; }
  else if (s === "pending")                   { bg = "#fff8e0"; color = "#8a6500"; }
  else if (s === "cancelled")                 { bg = "#ffe8e8"; color = "#8a0000"; }
  return (
    <span
      className="px-2.5 py-1 text-[10px] uppercase font-medium"
      style={{
        fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em",
        borderRadius: 4, backgroundColor: bg, color,
      }}
    >
      {status}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminCustomersPage() {
  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ── Data ── */
  const fetchUsers = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/users?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`
      );
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/users/${id}`);
      setSelectedUser(data);
    } catch {
      toast.error("Could not load customer details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ── Actions ── */
  const handleToggleBlock = async (id: string, isBlocked: boolean) => {
    try {
      const { data } = await api.patch(`/users/${id}/block`);
      const patch = (u: User) => u.id === id ? { ...u, deletedAt: data.deletedAt } : u;
      setUsers((prev) => prev.map(patch));
      if (selectedUser?.id === id) setSelectedUser((u) => u ? patch(u) : u);
      toast.success(`Customer ${isBlocked ? "unblocked" : "blocked"}.`);
    } catch {
      toast.error("Could not update customer status.");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const { data } = await api.patch(`/users/${id}/role`, { role });
      const patch = (u: User) => u.id === id ? { ...u, role: data.role } : u;
      setUsers((prev) => prev.map(patch));
      if (selectedUser?.id === id) setSelectedUser((u) => u ? patch(u) : u);
      toast.success(`Role updated to ${role}.`);
    } catch {
      toast.error("Could not update role.");
    }
  };

  /* ── Derived stats ── */
  const active  = users.filter((u) => !u.deletedAt).length;
  const blocked = users.filter((u) => !!u.deletedAt).length;

  /* ─── Render ── */
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: PAPER }}>

      {/* ── Dark ink page header ──────────────────────────────── */}
      <div style={{ backgroundColor: INK }}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            {/* Title */}
            <div>
              <SectionTag>Admin · Customers</SectionTag>
              <DisplayHeading light>Manage Customers</DisplayHeading>
              <p
                className="mt-2 text-sm"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                View profiles, order history, and manage access for all registered customers.
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchUsers(search)}
              className="inline-flex items-center gap-2.5 px-5 py-3 text-xs uppercase font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.98] shrink-0"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.12em", borderRadius: 6,
              }}
            >
              <RefreshCw size={13} strokeWidth={1.5} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-3 mt-8">
            <StatCard value={total}   label="Total Customers" icon={Users} />
            <StatCard value={active}  label="Active"          icon={UserCheck} accent />
            <StatCard value={blocked} label="Blocked"         icon={UserX} />
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-10">

        {/* ── Table card ──────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {/* Search row */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5"
            style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: PAPER }}
          >
            <SectionTag>All Customers</SectionTag>
            <form
              onSubmit={(e) => { e.preventDefault(); fetchUsers(search); }}
              className="relative w-full sm:max-w-xs"
            >
              <Search
                size={15}
                strokeWidth={1.5}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: MID }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
                  backgroundColor: "#fff",
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 6, color: INK,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = INK)}
                onBlur={(e)  => (e.currentTarget.style.borderColor = BORDER)}
              />
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: PAPER }}>
                  {["Customer", "Role", "Orders", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-[10px] uppercase font-medium whitespace-nowrap"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: MID, letterSpacing: "0.14em",
                        textAlign: i >= 2 ? "center" : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ── Skeleton ── */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td colSpan={5} className="px-6 py-4">
                      <div
                        className="animate-pulse h-10 w-full"
                        style={{ backgroundColor: PAPER, borderRadius: 6 }}
                      />
                    </td>
                  </tr>
                ))}

                {/* ── Rows ── */}
                {!loading && users.map((u) => {
                  const isBlocked = !!u.deletedAt;
                  const initials  = (u.name?.[0] || u.email[0]).toUpperCase();

                  return (
                    <motion.tr
                      layout
                      key={u.id}
                      onClick={() => fetchDetail(u.id)}
                      className="cursor-pointer group transition-colors duration-150"
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        opacity: isBlocked ? 0.55 : 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PAPER)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Customer info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 flex items-center justify-center text-sm font-bold shrink-0 select-none"
                            style={{
                              backgroundColor: INK, color: ACCENT,
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 900, borderRadius: 6,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p
                              className="font-medium leading-tight"
                              style={{ fontFamily: "'DM Sans', sans-serif", color: INK }}
                            >
                              {u.name || "—"}
                            </p>
                            <p
                              className="text-xs flex items-center gap-1 mt-0.5"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                            >
                              <Mail size={11} strokeWidth={1.5} />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block">
                          <select
                            value={u.role?.name || "CUSTOMER"}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="appearance-none pr-7 pl-3 py-1.5 text-xs uppercase outline-none cursor-pointer transition-all duration-200"
                            style={{
                              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                              letterSpacing: "0.1em",
                              border: `1.5px solid ${BORDER}`,
                              borderRadius: 6, color: INK,
                              backgroundColor: PAPER,
                            }}
                            onFocus={(e)  => (e.currentTarget.style.borderColor = INK)}
                            onBlur={(e)   => (e.currentTarget.style.borderColor = BORDER)}
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <ChevronDown
                            size={12}
                            strokeWidth={1.5}
                            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: MID }}
                          />
                        </div>
                      </td>

                      {/* Orders count */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className="text-sm font-medium tabular-nums"
                          style={{ fontFamily: "'DM Sans', sans-serif", color: INK }}
                        >
                          {u._count?.orders ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <StatusBadge blocked={isBlocked} />
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {/* View detail */}
                          <button
                            onClick={() => fetchDetail(u.id)}
                            className="px-3 py-1.5 text-[11px] uppercase font-medium flex items-center gap-1.5 transition-all duration-200 hover:bg-black/5"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              color: MID, letterSpacing: "0.1em",
                              border: `1px solid ${BORDER}`, borderRadius: 5,
                            }}
                            title="View profile"
                          >
                            <ArrowRight size={12} strokeWidth={1.5} />
                            View
                          </button>

                          {/* Block / unblock */}
                          <button
                            onClick={() => handleToggleBlock(u.id, isBlocked)}
                            className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                            style={{
                              borderRadius: 5,
                              border: `1px solid ${isBlocked ? "rgba(10,10,10,0.12)" : "rgba(200,0,0,0.15)"}`,
                              backgroundColor: isBlocked ? "rgba(200,255,0,0.1)" : "rgba(200,0,0,0.05)",
                              color: isBlocked ? "#2d6a00" : "#8a0000",
                            }}
                            title={isBlocked ? "Unblock customer" : "Block customer"}
                          >
                            {isBlocked
                              ? <Shield   size={13} strokeWidth={1.5} />
                              : <ShieldOff size={13} strokeWidth={1.5} />
                            }
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {/* ── Empty state ── */}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div
                        className="flex flex-col items-center justify-center py-24 text-center"
                        style={{ borderRadius: 10 }}
                      >
                        <Users size={36} strokeWidth={1} style={{ color: "rgba(10,10,10,0.15)", marginBottom: 14 }} />
                        <DisplayHeading size="sm">
                          <span style={{ color: "rgba(10,10,10,0.2)" }}>No customers found</span>
                        </DisplayHeading>
                        <p
                          className="text-sm mt-2"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                        >
                          Try a different search term.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && users.length > 0 && (
            <div
              className="px-6 py-3.5 flex items-center justify-between"
              style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: PAPER }}
            >
              <p
                className="text-xs"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
              >
                Showing {users.length} of {total} customers
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer detail slide-over ──────────────────────── */}
      <AnimatePresence>
        {(selectedUser || loadingDetail) && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedUser(null)}
            />

            {/* Panel */}
            <motion.aside
              className="fixed right-0 top-0 h-full z-[110] flex flex-col"
              style={{
                width: "min(600px, 100vw)",
                backgroundColor: "#fff",
                borderLeft: `1px solid ${BORDER}`,
                boxShadow: "-8px 0 40px rgba(10,10,10,0.12)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Panel header (ink) */}
              <div
                className="flex items-center justify-between px-8 py-6 shrink-0"
                style={{ backgroundColor: INK, borderBottom: `1px solid rgba(255,255,255,0.08)` }}
              >
                {selectedUser ? (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center text-lg font-bold shrink-0"
                      style={{
                        backgroundColor: ACCENT, color: INK,
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, borderRadius: 6,
                      }}
                    >
                      {(selectedUser.name?.[0] || selectedUser.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="text-white uppercase leading-tight"
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 900, fontSize: 22, letterSpacing: "-0.01em",
                        }}
                      >
                        {selectedUser.name || "No name"}
                      </p>
                      <p
                        className="text-sm mt-0.5 flex items-center gap-1.5"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "rgba(255,255,255,0.5)" }}
                      >
                        <Mail size={12} strokeWidth={1.5} />
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span
                    className="text-white/50 text-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                  >
                    Loading…
                  </span>
                )}

                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Loading bar */}
              {loadingDetail && (
                <div style={{ height: 2, backgroundColor: PAPER, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", backgroundColor: ACCENT }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}

              {/* Panel body */}
              {selectedUser && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8 space-y-8">

                    {/* ── Quick actions ── */}
                    <div
                      className="flex flex-wrap gap-3 p-5"
                      style={{ backgroundColor: PAPER, borderRadius: 8, border: `1px solid ${BORDER}` }}
                    >
                      {/* Block / unblock */}
                      <button
                        onClick={() => handleToggleBlock(selectedUser.id, !!selectedUser.deletedAt)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                        style={{
                          fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em",
                          borderRadius: 6,
                          backgroundColor: selectedUser.deletedAt ? ACCENT : INK,
                          color: selectedUser.deletedAt ? INK : "#fff",
                        }}
                      >
                        {selectedUser.deletedAt
                          ? <><Shield size={13} strokeWidth={1.5} /> Unblock Customer</>
                          : <><ShieldOff size={13} strokeWidth={1.5} /> Block Customer</>
                        }
                      </button>

                      {/* Role selector */}
                      <div className="relative">
                        <select
                          value={selectedUser.role?.name || "CUSTOMER"}
                          onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                          className="appearance-none pl-4 pr-8 py-2.5 text-xs uppercase outline-none cursor-pointer transition-all duration-200"
                          style={{
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                            letterSpacing: "0.1em",
                            border: `1.5px solid ${BORDER}`,
                            borderRadius: 6, color: INK,
                            backgroundColor: "#fff",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = INK)}
                          onBlur={(e)  => (e.currentTarget.style.borderColor = BORDER)}
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown size={12} strokeWidth={1.5}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: MID }}
                        />
                      </div>

                      {/* Current status */}
                      <StatusBadge blocked={!!selectedUser.deletedAt} />
                    </div>

                    {/* ── Summary stats ── */}
                    <div>
                      <SectionTag>Overview</SectionTag>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {/* Total spent */}
                        <div
                          className="px-5 py-5"
                          style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag size={14} strokeWidth={1.5} style={{ color: MID }} />
                            <p
                              className="text-[10px] uppercase"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: MID, letterSpacing: "0.12em" }}
                            >
                              Total Spent
                            </p>
                          </div>
                          <p
                            className="text-3xl uppercase leading-none"
                            style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 900, letterSpacing: "-0.02em", color: INK,
                            }}
                          >
                            ${selectedUser.orders
                              ?.reduce((s, o) => s + o.totalAmount, 0)
                              .toFixed(2) ?? "0.00"}
                          </p>
                        </div>

                        {/* Member since */}
                        <div
                          className="px-5 py-5"
                          style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} strokeWidth={1.5} style={{ color: MID }} />
                            <p
                              className="text-[10px] uppercase"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: MID, letterSpacing: "0.12em" }}
                            >
                              Member For
                            </p>
                          </div>
                          <p
                            className="text-3xl uppercase leading-none"
                            style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 900, letterSpacing: "-0.02em", color: INK,
                            }}
                          >
                            {Math.floor(
                              (Date.now() - new Date(selectedUser.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                            )}{" "}
                            <span className="text-xl">days</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Orders ── */}
                    <div>
                      <SectionTag>Order History</SectionTag>
                      <DisplayHeading size="sm">
                        {selectedUser.orders?.length ?? 0} Order
                        {(selectedUser.orders?.length ?? 0) !== 1 ? "s" : ""}
                      </DisplayHeading>

                      <div className="mt-4 space-y-2">
                        {selectedUser.orders && selectedUser.orders.length > 0 ? (
                          selectedUser.orders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between px-4 py-4 transition-colors duration-150"
                              style={{
                                backgroundColor: "#fff",
                                border: `1px solid ${BORDER}`,
                                borderRadius: 8,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PAPER)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                            >
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ fontFamily: "'DM Sans', sans-serif", color: INK }}
                                >
                                  #{order.id.slice(-8).toUpperCase()}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                                >
                                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <OrderChip status={order.status} />
                                <p
                                  className="text-sm font-medium tabular-nums"
                                  style={{ fontFamily: "'DM Sans', sans-serif", color: INK }}
                                >
                                  ${order.totalAmount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            className="py-10 text-center"
                            style={{
                              backgroundColor: PAPER,
                              border: `1px dashed rgba(10,10,10,0.15)`,
                              borderRadius: 8,
                            }}
                          >
                            <p
                              className="text-sm"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                            >
                              No orders placed yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Addresses ── */}
                    <div>
                      <SectionTag>Saved Addresses</SectionTag>
                      <DisplayHeading size="sm">
                        {selectedUser.addresses?.length ?? 0} Address
                        {(selectedUser.addresses?.length ?? 0) !== 1 ? "es" : ""}
                      </DisplayHeading>

                      <div className="mt-4 space-y-2">
                        {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                          selectedUser.addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className="flex items-start gap-4 px-4 py-4"
                              style={{
                                backgroundColor: "#fff",
                                border: `1px solid ${BORDER}`,
                                borderRadius: 8,
                              }}
                            >
                              <div
                                className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                                style={{
                                  backgroundColor: PAPER,
                                  borderRadius: 6, border: `1px solid ${BORDER}`,
                                }}
                              >
                                <MapPin size={14} strokeWidth={1.5} style={{ color: MID }} />
                              </div>
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ fontFamily: "'DM Sans', sans-serif", color: INK }}
                                >
                                  {addr.street}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                                >
                                  {addr.city}, {addr.state} {addr.zipCode} · {addr.country}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            className="py-10 text-center"
                            style={{
                              backgroundColor: PAPER,
                              border: `1px dashed rgba(10,10,10,0.15)`,
                              borderRadius: 8,
                            }}
                          >
                            <p
                              className="text-sm"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: MID }}
                            >
                              No addresses saved.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel footer */}
              <div
                className="px-8 py-5 flex justify-end shrink-0"
                style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: PAPER }}
              >
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-2.5 text-xs uppercase font-medium transition-all duration-200 hover:bg-black/5 active:scale-[0.98]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.12em",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 6, color: MID,
                  }}
                >
                  Close
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
