"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingCart, User, LogOut, Search, ShieldAlert, Heart, Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
    const { isAuthenticated, logout, user } = useAuthStore();
    const cartItems = useCartStore((state) => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    const isAdmin = user?.role === 'admin';

    // Don't show public navbar on admin pages
    if (pathname?.startsWith('/admin')) return null;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                ? "py-4 px-6 md:px-12"
                : "py-8 px-8 md:px-20"
                }`}
        >
            <div className={`container mx-auto max-w-7xl h-20 px-8 flex items-center justify-between transition-all duration-500 rounded-[32px] border-2 shadow-2xl relative overflow-hidden ${scrolled
                ? "bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-slate-100/50 dark:border-slate-800/50 shadow-slate-200/40 dark:shadow-none"
                : "bg-white dark:bg-slate-900 border-transparent shadow-transparent"
                }`}>
                {/* Brand Layer */}
                <div className="flex items-center gap-12 z-10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
                            <div className="h-5 w-5 border-2 border-white dark:border-black rounded-sm rotate-45" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">Nexus<span className="text-primary opacity-50 italic">OS</span></span>
                    </Link>

                    <div className="hidden lg:flex items-center gap-8">
                        {['Products', 'Collections', 'Archives'].map(item => {
                            const href = item === 'Products' ? '/products' : `/${item.toLowerCase()}`;
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={item}
                                    href={href}
                                    className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-black dark:hover:text-white ${isActive ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                                >
                                    {item}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Search Engine Expansion */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 bg-white dark:bg-black z-[20] flex items-center px-12"
                        >
                            <Search className="h-5 w-5 text-slate-300 mr-4" />
                            <form onSubmit={handleSearchSubmit} className="flex-1">
                                <input
                                    ref={inputRef}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Enter search parameters..."
                                    className="w-full bg-transparent h-12 text-sm font-black uppercase tracking-widest outline-none placeholder:text-slate-200"
                                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                                />
                            </form>
                            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Utility Hub */}
                <div className="flex items-center gap-2 z-10">
                    <ThemeToggle />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                        className="rounded-xl h-12 w-12 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    <Link href="/cart">
                        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-xl hover:bg-slate-50 group">
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-black text-white group-hover:scale-110 transition-transform">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                    </Link>

                    <div className="h-8 w-px bg-slate-100 mx-2" />

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm" className="hidden md:flex h-12 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 hover:text-primary transition-colors pr-4">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        Administrative Port
                                    </Button>
                                </Link>
                            )}
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-slate-50">
                                    <User className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => logout()}
                                className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">Sign In</Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
