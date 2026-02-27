"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Truck, XCircle, RefreshCcw, ArrowRight, ShieldCheck, ChevronRight, Activity, Calendar, Hash, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-900/50';
        case 'PROCESSING': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-500 border-blue-100 dark:border-blue-900/50';
        case 'SHIPPED': return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-500 border-indigo-100 dark:border-indigo-900/50';
        case 'DELIVERED': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-900/50';
        case 'CANCELLED': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-500 border-rose-100 dark:border-rose-900/50';
        case 'RETURNED': return 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-500 border-slate-100 dark:border-slate-800';
        default: return 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-500 border-slate-100 dark:border-slate-800';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'PENDING': return <Clock className="h-4 w-4" />;
        case 'PROCESSING': return <RefreshCcw className="h-4 w-4 animate-spin-slow" />;
        case 'SHIPPED': return <Truck className="h-4 w-4" />;
        case 'DELIVERED': return <CheckCircle className="h-4 w-4" />;
        case 'CANCELLED': return <XCircle className="h-4 w-4" />;
        case 'RETURNED': return <RefreshCcw className="h-4 w-4" />;
        default: return <Package className="h-4 w-4" />;
    }
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<{
        id: string;
        createdAt: string;
        totalAmount: number;
        status: string;
        items: {
            id: string;
            productTitle: string;
            quantity: number;
            price: number;
        }[];
    }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders');
                setOrders(response.data);
            } catch (error) {
                console.error('Manifest retrieval failure:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        if (searchParams.get('success') === 'true') {
            toast.success('Acquisition authorized. Registry updated.', { icon: '🛡️' });
        }
    }, [searchParams]);

    const handleCancel = async (orderId: string) => {
        if (!confirm('PROTOCOL PROTOCOL: Cancel acquisition authorization?')) return;
        try {
            await api.patch(`/orders/${orderId}/cancel`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
            toast.success('Acquisition terminated. Assets restored to archives.');
        } catch {
            toast.error('Termination failure. Fulfillment in progress.');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse bg-white dark:bg-transparent">
                <div className="h-20 w-80 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
                <div className="space-y-8">
                    {[1, 2].map(i => <div key={i} className="h-72 bg-slate-50 dark:bg-slate-900/50 rounded-[48px] border-2 border-slate-50 dark:border-slate-800" />)}
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 bg-white dark:bg-transparent transition-colors">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-800 shadow-sm">
                    <Package className="h-10 w-10" />
                </div>
                <div className="space-y-4">
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Manifest Empty</h3>
                    <p className="text-base font-medium text-slate-400 dark:text-slate-600 max-w-sm mx-auto italic leading-relaxed"> No verified transactions detected in current user identity profile.</p>
                </div>
                <Link href="/products">
                    <Button size="lg" className="h-16 px-12 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95">Explore Archives</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16 bg-white dark:bg-transparent transition-colors duration-500">
            <header className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Transaction Ledger</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black dark:text-white">Historical <br />Archives</h1>
                <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Inventory of all verified acquisitions and fulfillment states within the NexusOS ecosystem.</p>
            </header>

            <div className="space-y-10">
                {orders.map((order, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        key={order.id}
                        className="group bg-white dark:bg-[#0a0a0a] rounded-[56px] border-2 border-slate-50 dark:border-slate-900 hover:border-slate-100 dark:hover:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all"
                    >
                        <div className="p-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 bg-slate-50/50 dark:bg-slate-900/30 border-b-2 border-slate-50 dark:border-slate-900 transition-colors">
                            <div className="space-y-8 flex-1 w-full">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700 flex items-center gap-3">
                                            <Hash className="h-3.5 w-3.5" /> Registry ID
                                        </p>
                                        <p className="font-black uppercase text-xs tracking-tight text-black dark:text-slate-400 tabular-nums">{order.id.slice(0, 16)}...</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700 flex items-center gap-3">
                                            <Calendar className="h-3.5 w-3.5" /> Timestamp
                                        </p>
                                        <p className="font-black uppercase text-xs tracking-tight text-black dark:text-white tabular-nums">
                                            {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700 flex items-center gap-3">
                                            <DollarSign className="h-3.5 w-3.5" /> Total Valuation
                                        </p>
                                        <p className="font-black text-2xl tracking-tighter tabular-nums text-black dark:text-white underline decoration-primary/20 decoration-4 underline-offset-8">${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:text-right flex flex-col lg:items-end gap-6 shrink-0 w-full lg:w-auto">
                                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </div>
                                {['PENDING', 'PROCESSING'].includes(order.status) && (
                                    <button
                                        onClick={() => handleCancel(order.id)}
                                        className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors italic px-2"
                                    >
                                        Terminate Protocol
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-12 space-y-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 flex items-center gap-4">
                                <Activity className="h-5 w-5" /> Manifest Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center group/item border-b border-slate-50 dark:border-slate-900 pb-6 last:border-0 transition-colors">
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-lg font-black uppercase tracking-tight text-black dark:text-white group-hover/item:text-primary transition-colors">{item.productTitle}</span>
                                            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">Verified Qty: {item.quantity}</span>
                                        </div>
                                        <span className="font-black text-lg tracking-tighter tabular-nums text-black dark:text-white underline decoration-slate-100 dark:decoration-slate-800 decoration-2 underline-offset-4">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-20 border-t-2 border-slate-50 dark:border-slate-900 flex justify-center">
                <Link href="/products">
                    <Button variant="outline" className="h-16 px-12 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all active:scale-95 group">
                        Back to Core Archives <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
