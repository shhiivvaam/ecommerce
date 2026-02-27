"use client";

import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag, Minus, Plus, ChevronLeft, ShieldCheck, Zap, Info } from "lucide-react";

export default function CartPage() {
    const { items, total, removeItem, updateQuantity } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="container min-h-[70vh] flex flex-col items-center justify-center text-center px-8 py-20 bg-white dark:bg-[#050505] transition-colors">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                >
                    <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center mx-auto text-slate-200 dark:text-slate-800">
                        <ShoppingBag className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white">Registry Empty.</h2>
                        <p className="text-slate-400 dark:text-slate-600 font-medium mt-3 italic">Establish your first collection entry to proceed with acquisition.</p>
                    </div>
                    <Link href="/products">
                        <Button size="lg" className="rounded-2xl h-16 px-12 font-black uppercase tracking-widest text-[10px] shadow-2xl">Return to Archives</Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#050505] min-h-screen pb-40 transition-colors duration-500">
            <header className="pt-20 pb-12 border-b-2 border-slate-50 dark:border-slate-900 relative overflow-hidden transition-colors">
                <div className="absolute top-0 left-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="container mx-auto px-8 relative z-10">
                    <div className="space-y-4">
                        <Link href="/products" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-black dark:hover:text-white transition-colors mb-8">
                            <ChevronLeft className="h-3 w-3" /> Back to Collections
                        </Link>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">Consignment <br />Registry</h1>
                        <p className="text-slate-400 font-medium text-lg italic mt-4 uppercase tracking-tighter">Review and finalize your pending acquisitions.</p>
                    </div>
                </div>
            </header>

            <div className="container px-8 py-16 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    {/* Item Manifest */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="flex justify-between items-center pb-6 border-b-2 border-slate-50 dark:border-slate-900 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">Asset Designation</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">Total Valuation</span>
                        </div>

                        <div className="space-y-8">
                            <AnimatePresence mode="popLayout">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group relative flex items-center gap-8 p-6 rounded-[32px] border-2 border-slate-50 dark:border-slate-900 hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                                    >
                                        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                            <Image src={item.image ?? ''} alt={item.title} fill unoptimized className="object-cover" />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-5">
                                            <div className="space-y-1">
                                                <Link href={`/products/${item.productId}`} className="text-xl font-black uppercase tracking-tight text-black dark:text-white hover:text-primary transition-colors block truncate">
                                                    {item.title}
                                                </Link>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 italic">Global Item Ref: {item.productId.slice(0, 8)}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-white dark:bg-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl h-10 px-1 shadow-sm transition-colors">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        className="h-8 w-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-black dark:text-white"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-10 text-center text-xs font-black tabular-nums text-black dark:text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="h-8 w-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-black dark:text-white"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-2" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-2xl text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border-2 border-transparent hover:border-rose-100 dark:hover:border-rose-900"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-2xl font-black tracking-tighter tabular-nums text-black dark:text-white">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-tighter mt-2">${item.price.toFixed(2)}/unit</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Summary Cockpit */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-40 bg-black dark:bg-slate-900 text-white rounded-[48px] p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] dark:shadow-none space-y-12 transition-colors border border-white/5">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Acquisition <br />Summary</h2>
                                <p className="text-[10px] text-white/40 dark:text-white/30 font-bold uppercase tracking-[0.3em] italic leading-relaxed">System-calculated valuation and logistics estimates.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex justify-between items-baseline border-b border-white/10 pb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtotal Valuation</span>
                                    <span className="text-3xl font-black tracking-tighter tabular-nums">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center group cursor-help">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Logistics Fee</span>
                                            <Info className="h-3 w-3 text-white/20" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Calculated Below</span>
                                    </div>
                                    <div className="flex justify-between items-center group cursor-help">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Tax Protocol</span>
                                            <Info className="h-3 w-3 text-white/20" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 font-bold">Dynamic Protocol</span>
                                    </div>
                                </div>

                                <div className="pt-8 border-t-2 border-white/20 flex justify-between items-end">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-widest">Total Liability</h3>
                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] italic">Subject to Final Verification</p>
                                    </div>
                                    <span className="text-5xl font-black tracking-tighter tabular-nums text-primary underline decoration-primary/20 decoration-8 underline-offset-8">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Link href="/checkout">
                                    <Button className="w-full h-20 bg-white text-black hover:bg-slate-100 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-2xl transition-all active:scale-95 group" size="lg">
                                        Initialize Checkout <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="flex flex-col items-center gap-3 p-5 bg-white/5 rounded-3xl border border-white/10 transition-colors hover:bg-white/10">
                                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Secure Node</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-3 p-5 bg-white/5 rounded-3xl border border-white/10 transition-colors hover:bg-white/10">
                                        <Zap className="h-6 w-6 text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Priority Stream</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
