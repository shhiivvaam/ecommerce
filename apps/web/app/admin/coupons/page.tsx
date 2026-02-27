"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Plus, Trash2, Calendar, Percent, Banknote, Power, Search } from "lucide-react";
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
        } catch (err) {
            toast.error("Failed to fetch coupons");
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
                toast.success("Coupon updated");
            } else {
                await api.post('/coupons', {
                    ...formData,
                    expiryDate: new Date(formData.expiryDate).toISOString()
                });
                toast.success("Coupon created");
            }
            setShowForm(false);
            fetchCoupons();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/coupons/${id}`);
            toast.success("Coupon deleted");
            fetchCoupons();
        } catch (err) {
            toast.error("Delete failed");
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Coupons & Promotions</h2>
                    <p className="text-muted-foreground mt-2">Manage discount codes and promotional offers.</p>
                </div>
                <Button onClick={handleNew} className="gap-2 shrink-0 rounded-full h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Create Coupon
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                            <h3 className="text-xl font-bold">{isEditing ? "Edit Coupon" : "New Promotional Code"}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Coupon Code</label>
                                    <Input
                                        required
                                        placeholder="e.g. SUMMER50"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        disabled={isEditing}
                                        className="rounded-2xl h-11 uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Discount Value</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            required
                                            value={formData.discount}
                                            onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                                            className="rounded-2xl h-11"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFormData({ ...formData, isFlat: !formData.isFlat })}
                                            className="rounded-2xl aspect-square p-0 h-11 w-11 shrink-0"
                                            title={formData.isFlat ? "Fixed Amount" : "Percentage"}
                                        >
                                            {formData.isFlat ? <Banknote className="h-4 w-4" /> : <Percent className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Expiry Date</label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Usage Limit</label>
                                    <Input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Min. Purchase Total</label>
                                    <Input
                                        type="number"
                                        value={formData.minTotal}
                                        onChange={e => setFormData({ ...formData, minTotal: parseFloat(e.target.value) })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-2xl px-6">Cancel</Button>
                                <Button type="submit" className="rounded-2xl px-8 shadow-md">
                                    {isEditing ? "Update Coupon" : "Activate Coupon"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-muted/40 animate-pulse rounded-3xl border" />
                    ))
                ) : coupons.length > 0 ? (
                    coupons.map((c) => {
                        const isExpired = new Date(c.expiryDate) < new Date();
                        const isLimitReached = c.usageLimit ? c.usedCount >= c.usageLimit : false;
                        const isActive = !isExpired && !isLimitReached;

                        return (
                            <motion.div
                                layout
                                key={c.id}
                                className={`group relative p-6 rounded-3xl border bg-card transition-all hover:shadow-lg hover:border-primary/20 ${!isActive ? 'opacity-70 bg-muted/20' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <Ticket className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black tracking-wider uppercase font-mono">{c.code}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {isActive ? 'Active' : isExpired ? 'Expired' : 'Limit Reached'}
                                        </span>
                                    </div>
                                    <div className="text-3xl font-extrabold text-primary">
                                        {c.isFlat ? `$${c.discount}` : `${c.discount}%`} <span className="text-sm font-medium text-muted-foreground uppercase">Off</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-dashed space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" /> Expiry
                                        </span>
                                        <span className="font-medium">{new Date(c.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Power className="h-3.5 w-3.5" /> Usage
                                        </span>
                                        <span className="font-medium">{c.usedCount} / {c.usageLimit || '∞'}</span>
                                    </div>
                                    {c.minTotal > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Min. Spend</span>
                                            <span className="font-medium">${c.minTotal}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute inset-0 border-2 border-primary/20 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100 rounded-3xl transition-all pointer-events-none" />
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">No coupons found</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Start by creating your first promotional code to boost your sales.</p>
                        <Button variant="link" onClick={handleNew} className="mt-4">Create your first coupon</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
