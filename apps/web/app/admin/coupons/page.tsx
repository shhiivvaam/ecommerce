"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Ticket, Plus, Trash2, Calendar, Percent, Banknote, X, Activity, DollarSign, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Coupon {
    id: string;
    code: string;
    discount: number;
    isFlat: boolean;
    expiryDate: string;
    usageLimit?: number;
    usedCount: number;
    minTotal: number;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        discount: 0,
        isFlat: false,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 100,
        minTotal: 0
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/coupons');
            setCoupons(data);
        } catch {
            toast.error("Cloud promotional synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedId) {
                await api.patch(`/coupons/${selectedId}`, {
                    ...formData,
                    expiryDate: new Date(formData.expiryDate).toISOString()
                });
                toast.success("Promotional node updated");
            } else {
                await api.post('/coupons', {
                    ...formData,
                    expiryDate: new Date(formData.expiryDate).toISOString()
                });
                toast.success("New promotional node initialized");
            }
            setShowForm(false);
            fetchCoupons();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Protocol rejection");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Destroy this promotional node?")) return;
        try {
            await api.delete(`/coupons/${id}`);
            toast.success("Node purged from manifest");
            fetchCoupons();
        } catch {
            toast.error("Purge sequence failed");
        }
    };

    const handleEdit = (c: Coupon) => {
        setFormData({
            code: c.code,
            discount: c.discount,
            isFlat: c.isFlat,
            expiryDate: c.expiryDate.split('T')[0],
            usageLimit: c.usageLimit || 100,
            minTotal: c.minTotal
        });
        setSelectedId(c.id);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleNew = () => {
        setFormData({
            code: "",
            discount: 0,
            isFlat: false,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            usageLimit: 100,
            minTotal: 0
        });
        setIsEditing(false);
        setShowForm(true);
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Promotion Core</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">Discount <br />Manifests</h2>
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Control discount codes and promotional sequences across the ecosystem.</p>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button onClick={handleNew} className="rounded-[24px] h-16 px-10 gap-4 shadow-2xl shadow-primary/20 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all">
                        <Plus className="h-5 w-5" /> Initialize Node
                    </Button>
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-black border-4 border-primary/20 rounded-[56px] p-12 shadow-3xl space-y-12 relative overflow-hidden transition-colors">
                            <div className="absolute top-0 right-0 p-20 opacity-[0.05] pointer-events-none dark:invert">
                                <Ticket className="h-64 w-64 rotate-12" />
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">{isEditing ? "Modify Protocol" : "New Promotional Protocol"}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Liability Reduction Injection</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-2xl h-16 w-16 border-4 border-slate-100 dark:border-slate-800">
                                    <X className="h-8 w-8 text-black dark:text-white" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Node Identifier (Code)</label>
                                    <Input
                                        required
                                        placeholder="E.G. NEXUS-50"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        disabled={isEditing}
                                        className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xl font-black uppercase tracking-widest focus-visible:ring-primary/20 transition-all px-10"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Reduction Magnitude</label>
                                    <div className="flex gap-4">
                                        <Input
                                            type="number"
                                            required
                                            value={formData.discount}
                                            onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                                            className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-2xl font-black uppercase tracking-widest focus-visible:ring-primary/20 transition-all px-10 flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setFormData({ ...formData, isFlat: !formData.isFlat })}
                                            className="rounded-[24px] h-20 w-20 border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center transition-all bg-white dark:bg-black shadow-xl"
                                        >
                                            {formData.isFlat ? <Banknote className="h-8 w-8 text-emerald-500" /> : <Percent className="h-8 w-8 text-primary" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Temporal Threshold (Expiry)</label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xs font-black uppercase tracking-widest transition-all px-10"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Sequence Limit (Usage)</label>
                                    <Input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                                        className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xl font-black tracking-widest transition-all px-10"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Min. Purchase Liability</label>
                                    <Input
                                        type="number"
                                        value={formData.minTotal}
                                        onChange={e => setFormData({ ...formData, minTotal: parseFloat(e.target.value) })}
                                        className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xl font-black tracking-widest transition-all px-10"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-10 border-t-4 border-slate-50 dark:border-slate-900 relative z-10 mt-10">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-[24px] h-16 px-12 font-black uppercase text-[11px] tracking-widest text-slate-400 dark:text-slate-600">Deactivate</Button>
                                <Button type="submit" className="rounded-[24px] h-16 px-16 shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-widest min-w-[240px]">
                                    {isEditing ? "Commit Protocol" : "Activate Node"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-50/50 dark:bg-white/5 animate-pulse rounded-[48px] border-4 border-slate-50 dark:border-slate-900" />
                    ))
                ) : coupons.length > 0 ? (
                    coupons.map((c, i) => {
                        const isExpired = new Date(c.expiryDate) < new Date();
                        const isLimitReached = c.usageLimit ? c.usedCount >= c.usageLimit : false;
                        const isActive = !isExpired && !isLimitReached;

                        return (
                            <motion.div
                                layout
                                key={c.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`group relative p-10 rounded-[56px] border-4 border-slate-50 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] transition-all hover:shadow-3xl hover:-translate-y-2 hover:border-primary/20 ${!isActive ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center border-2 shadow-inner transition-colors ${isActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'}`}>
                                        <Ticket className="h-8 w-8" />
                                    </div>
                                    <div className="flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-11 w-11 border-2 border-slate-50 dark:border-slate-800 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                                            <Pencil className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-11 w-11 border-2 border-slate-50 dark:border-slate-800 rounded-2xl text-slate-300 dark:text-slate-700 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 hover:border-transparent">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black tracking-[0.1em] uppercase text-black dark:text-white font-mono">{c.code}</span>
                                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 shadow-sm ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/30'}`}>
                                            {isActive ? 'NOMINAL' : isExpired ? 'EXPIRED' : 'VOIDED'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-primary tracking-tighter tabular-nums">
                                            {c.isFlat ? `$${c.discount}` : `${c.discount}%`}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] italic">Liability Drop</span>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t-4 border-dashed border-slate-50 dark:border-slate-900 space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic text-slate-400 dark:text-slate-600">
                                        <span className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4" /> Threshold
                                        </span>
                                        <span className="text-black dark:text-white">{new Date(c.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic text-slate-400 dark:text-slate-600">
                                        <span className="flex items-center gap-3">
                                            <Activity className="h-4 w-4" /> Sequences
                                        </span>
                                        <span className="text-black dark:text-white">{c.usedCount} / {c.usageLimit || '∞'}</span>
                                    </div>
                                    {c.minTotal > 0 && (
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic text-slate-400 dark:text-slate-600">
                                            <span className="flex items-center gap-3">
                                                <DollarSign className="h-4 w-4" /> Min. Capture
                                            </span>
                                            <span className="text-black dark:text-white">${c.minTotal}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-60 text-center bg-slate-50/30 dark:bg-white/5 rounded-[64px] border-4 border-dashed border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors">
                        <Ticket className="h-32 w-32 mx-auto text-slate-100 dark:text-slate-900 mb-10 opacity-50" />
                        <h3 className="text-4xl font-black uppercase tracking-[0.2em] text-slate-200 dark:text-slate-800">Promotional Void</h3>
                        <p className="text-sm font-black text-slate-300 dark:text-slate-700 mt-4 max-w-sm mx-auto italic uppercase tracking-widest leading-relaxed">No promotional manifests detected in the current stream.</p>
                        <Button
                            onClick={handleNew}
                            className="mt-12 rounded-[28px] h-20 px-16 font-black uppercase tracking-[0.2em] text-[11px] shadow-3xl"
                        >
                            Establish First Node
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
