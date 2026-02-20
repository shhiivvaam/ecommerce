"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, MapPin, Heart, Bell, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const navItems = [
        { name: "My Profile", href: "/dashboard", icon: User },
        { name: "Order History", href: "/dashboard/orders", icon: ShoppingBag },
        { name: "Addresses", href: "/dashboard/addresses", icon: MapPin },
        { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ];

    if (!user) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">You need to be logged in to view your dashboard</h2>
                <Link href="/login" className="text-primary hover:underline">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 shrink-0 space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                            <p className="font-semibold">{user.name || "Customer"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <nav className="flex flex-col space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4 text-left"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign out
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 min-w-0 bg-card rounded-xl border p-6 shadow-sm">
                    {children}
                </main>
            </div>
        </div>
    );
}
