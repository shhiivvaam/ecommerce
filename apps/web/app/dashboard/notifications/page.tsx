"use client";

import { useState } from "react";
import { Bell, Package, Tag, MessageSquare, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_NOTIFICATIONS = [
  {
    id: "1",
    type: "order",
    icon: Package,
    title: "Order Shipped",
    message: "Your order #ORD_ABC123 has been shipped and is on its way to you.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "promo",
    icon: Tag,
    title: "New Coupon Available",
    message: "Use code SAVE20 to get 20% off your next order over $50.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "3",
    type: "review",
    icon: MessageSquare,
    title: "Review Request",
    message: "How was your recent purchase? Leave a review and help other shoppers decide.",
    time: "3 days ago",
    read: true,
  },
];

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  order:  { bg: "rgba(200,255,0,0.12)",       color: "#4d5c00" },
  promo:  { bg: "rgba(10,10,10,0.06)",         color: "#0a0a0a" },
  review: { bg: "rgba(10,10,10,0.06)",         color: "#8a8a8a" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const visible = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --ink: #0a0a0a;
          --paper: #f5f3ef;
          --accent: #c8ff00;
          --mid: #8a8a8a;
          --border: rgba(10,10,10,0.1);
          --card: #ffffff;
        }
        .nf-wrap { font-family: 'DM Sans', sans-serif; color: var(--ink); }
        .d { font-family: 'Barlow Condensed', sans-serif; }

        /* ── SECTION TAG ── */
        .nf-section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--mid); margin-bottom: 10px;
        }
        .nf-section-tag::before {
          content: ''; width: 16px; height: 1.5px;
          background: var(--accent); display: inline-block;
        }

        /* ── FILTER CHIPS ── */
        .nf-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 5px; border: 1.5px solid var(--border);
          background: transparent; color: var(--mid);
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s;
        }
        .nf-chip:hover { border-color: var(--ink); color: var(--ink); }
        .nf-chip.active { background: var(--ink); border-color: var(--ink); color: #fff; }
        .nf-chip-count {
          width: 18px; height: 18px; border-radius: 3px;
          background: var(--accent); color: var(--ink);
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── ACTION BUTTONS ── */
        .nf-text-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 5px; border: 1.5px solid var(--border);
          background: transparent; color: var(--mid);
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .nf-text-btn:hover { border-color: var(--ink); color: var(--ink); }

        /* ── NOTIFICATION CARD ── */
        .nf-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 20px; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--card);
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .nf-card:hover { border-color: rgba(10,10,10,0.2); box-shadow: 0 4px 20px rgba(10,10,10,0.06); }
        .nf-card.unread { border-color: rgba(10,10,10,0.15); background: #fff; }
        .nf-card.unread::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: var(--accent); border-radius: 0;
        }

        /* ── ICON WRAP ── */
        .nf-icon {
          width: 40px; height: 40px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ── CARD ACTIONS ── */
        .nf-actions {
          display: flex; gap: 6px;
          opacity: 0; transition: opacity 0.2s;
          flex-shrink: 0; margin-left: auto;
        }
        .nf-card:hover .nf-actions { opacity: 1; }
        .nf-action-btn {
          width: 30px; height: 30px; border-radius: 5px;
          border: 1.5px solid var(--border); background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--mid); transition: all 0.2s;
        }
        .nf-action-btn:hover.mark { border-color: var(--ink); color: var(--ink); background: rgba(10,10,10,0.04); }
        .nf-action-btn:hover.del { border-color: #e11d48; color: #e11d48; background: #fff0f3; }

        /* ── EMPTY ── */
        .nf-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px;
          padding: 64px 24px; text-align: center;
          border: 1.5px dashed var(--border); border-radius: 8px;
          background: var(--card);
        }
        .nf-empty-icon {
          width: 64px; height: 64px; border-radius: 10px;
          border: 1.5px solid var(--border); background: var(--paper);
          display: flex; align-items: center; justify-content: center;
          color: var(--mid);
        }
      `}</style>

      <div className="nf-wrap" style={{ maxWidth: 680 }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 28 }}>
          <p className="nf-section-tag">Activity</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h1 className="d" style={{ fontSize: "clamp(36px,6vw,56px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button className="nf-text-btn" onClick={markAllRead}>
                <Check size={12} strokeWidth={2} />
                Mark all read
              </button>
            )}
          </div>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--mid)", marginTop: 8 }}>
            {unreadCount > 0
              ? <>{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</>
              : "You're all caught up."}
          </p>
        </div>

        {/* ── FILTER CHIPS ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            className={`nf-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
            <span className="nf-chip-count" style={{ background: filter === "all" ? "var(--accent)" : "var(--border)", color: filter === "all" ? "var(--ink)" : "var(--mid)" }}>
              {notifications.length}
            </span>
          </button>
          <button
            className={`nf-chip ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <span className="nf-chip-count">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: 16 }} />

        {/* ── LIST ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="nf-empty">
                  <div className="nf-empty-icon">
                    <Bell size={26} strokeWidth={1.25} />
                  </div>
                  <div>
                    <p className="d" style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
                      All Caught Up
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 300, color: "var(--mid)", maxWidth: 280 }}>
                      No {filter === "unread" ? "unread " : ""}notifications right now. Check back later.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              visible.map((notif) => {
                const style = TYPE_STYLES[notif.type] ?? TYPE_STYLES.review;
                const Icon = notif.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.22 } }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`nf-card ${!notif.read ? "unread" : ""}`}>

                      {/* Icon */}
                      <div className="nf-icon" style={{ background: style.bg }}>
                        <Icon size={17} strokeWidth={1.5} color={style.color} />
                      </div>

                      {/* Body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: notif.read ? 400 : 600, color: "var(--ink)", lineHeight: 1.3 }}>
                            {notif.title}
                          </p>
                          <span style={{ fontSize: 11, fontWeight: 300, color: "var(--mid)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}>
                            {notif.time}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 300, color: "var(--mid)", lineHeight: 1.65 }}>
                          {notif.message}
                        </p>
                      </div>

                      {/* Hover actions */}
                      <div className="nf-actions">
                        {!notif.read && (
                          <button
                            className="nf-action-btn mark"
                            onClick={() => markRead(notif.id)}
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          className="nf-action-btn del"
                          onClick={() => dismiss(notif.id)}
                          aria-label="Dismiss notification"
                          title="Dismiss"
                        >
                          <Trash2 size={12} strokeWidth={1.75} />
                        </button>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: "var(--accent)", flexShrink: 0, marginTop: 6, marginLeft: 4 }} />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER ── */}
        {visible.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--mid)" }}>
              Showing {visible.length} of {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
            <button
              className="nf-text-btn"
              style={{ padding: "6px 12px", fontSize: 10 }}
              onClick={() => setNotifications([])}
            >
              Clear all
            </button>
          </div>
        )}

      </div>
    </>
  );
}
