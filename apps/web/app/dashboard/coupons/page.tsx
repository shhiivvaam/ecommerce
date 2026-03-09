"use client";

import { useEffect, useState } from "react";
import { Tag, Ticket, Clock, CheckCircle, Copy, Info } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Coupon {
    id: string;
    code: string;
    type: string;
    discount: number;
    expiryDate: string;
    minTotal: number;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await api.get('/coupons/active');
                setCoupons(data);
            } catch (error) {
                console.error("Promo retrieval failure:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoupons();
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Access code ${code} copied to terminal.`, { icon: '📋' });
    };

    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse">
                <div className="h-20 w-80 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-50 dark:bg-slate-900/50 rounded-[40px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-16">
            <header className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Promotional Directives</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black dark:text-white">Active <br />Vouchers</h1>
                <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Verified cryptocodes for valuation reduction during checkout protocols.</p>
            </header>

            {coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 bg-slate-50/30 dark:bg-slate-900/10 rounded-[64px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="h-24 w-24 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-800 shadow-sm">
                        <Ticket className="h-10 w-10" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">No active promos</h3>
                        <p className="text-base font-medium text-slate-400 dark:text-slate-600 max-w-sm mx-auto italic leading-relaxed"> Check back later for new promotional signals.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {coupons.map((coupon, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={coupon.id}
                            className="bg-white dark:bg-[#0a0a0a] rounded-[48px] border-2 border-slate-50 dark:border-slate-800 p-10 relative overflow-hidden group hover:border-primary transition-all shadow-2xl shadow-slate-200/50 dark:shadow-none"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="h-14 w-14 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-black transition-all rotate-3 group-hover:rotate-0">
                                    <Tag className="h-7 w-7" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 mb-1">Valuation Shift</p>
                                    <p className="text-3xl font-black tracking-tighter text-primary">
                                        {coupon.type === 'PERCENTAGE' ? `${coupon.discount}%` : `$${coupon.discount}`}
                                        <span className="text-xs uppercase ml-1 opacity-50">OFF</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 flex justify-between items-center group/btn active:scale-95 transition-all"
                            >
                                <span className="font-black text-xl uppercase tracking-widest text-black dark:text-white">{coupon.code}</span>
                                <Copy className="h-5 w-5 text-slate-300 group-hover/btn:text-primary transition-colors" />
                            </button>

                            <div className="space-y-4 text-[10px] font-black uppercase tracking-[0.15em]">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    Expiring {format(new Date(coupon.expiryDate), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Info className="h-3.5 w-3.5" />
                                    Min order: ${coupon.minTotal.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-3 text-emerald-500/60">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Status: Verified Active
                                </div>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Tag className="h-40 w-40 rotate-12" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
