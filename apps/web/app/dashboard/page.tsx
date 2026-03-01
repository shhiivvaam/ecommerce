"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--mid, #8a8a8a)",
            marginBottom: 8,
          }}
        >
          Overview
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "var(--mid, #8a8a8a)",
            maxWidth: 420,
          }}
        >
          Use the dashboard navigation to manage your profile, orders, addresses,
          wishlist and notifications.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 8,
        }}
      >
        <QuickLink href="/dashboard/profile" label="Profile" />
        <QuickLink href="/dashboard/orders" label="Orders" />
        <QuickLink href="/dashboard/addresses" label="Addresses" />
        <QuickLink href="/dashboard/wishlist" label="Wishlist" />
        <QuickLink href="/dashboard/notifications" label="Notifications" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        padding: "10px 16px",
        borderRadius: 6,
        border: "1px solid var(--border, rgba(10,10,10,0.1))",
        background: "white",
        color: "var(--ink, #0a0a0a)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
