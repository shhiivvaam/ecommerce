"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { MapPin, Plus, Trash2, Star, Globe, Zap, ShieldCheck, X } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newAddress, setNewAddress] = useState({
        street: "",
        city: "",
        state: "NY",
        zipCode: "",
        country: "US",
        isDefault: false
    });

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/addresses');
            setAddresses(data);
        } catch (error) {
            console.error("Registry retrieval failure:", error);
            toast.error("Logistics manifest synchronization failed.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleSaveAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.zipCode) {
            toast.error("Protocol error: Required parameters missing.");
            return;
        }

        try {
            await api.post('/addresses', newAddress);
            toast.success("Logistics node established.", { icon: '📍' });
            setIsAdding(false);
            setNewAddress({ street: "", city: "", state: "NY", zipCode: "", country: "US", isDefault: false });
            fetchAddresses();
        } catch (error) {
            console.error("Node creation failure:", error);
            toast.error("Database rejection: Could not commit node.");
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!window.confirm("CRITICAL PROTOCOL: Decommission this logistics node?")) return;

        try {
            await api.delete(`/addresses/${id}`);
            toast.success("Node decommissioned.");
            fetchAddresses();
        } catch (error) {
            console.error("Decommissioning failure:", error);
            toast.error("Protocol rejection: Node deletion failed.");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await api.patch(`/addresses/${id}`, { isDefault: true });
            toast.success("Primary logistics link updated.");
            fetchAddresses();
        } catch (error) {
            console.error("Link update failure:", error);
            toast.error("Protocol rejection: Link update failed.");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-12 w-64 bg-slate-100 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-slate-50 rounded-[32px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-black/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logistics Terminal</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Physical Nodes</h1>
                    <p className="text-sm font-medium text-slate-400 italic">Manage and configure destination coordinates for fulfillment.</p>
                </div>
                {!isAdding && (
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Define New Node
                    </Button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-50/50 p-10 rounded-[40px] border-2 border-slate-100 space-y-10"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                <Globe className="h-5 w-5 text-primary" /> Node Configuration
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Primary Conduit (Street)</label>
                                <Input value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="123 MAIN ST" className="h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City Hub</label>
                                <Input value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="NEW YORK" className="h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Territorial Division</label>
                                <Input value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="NY" className="h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Postal Reference</label>
                                <Input value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} placeholder="10001" className="h-16 rounded-2xl border-2 font-black tracking-widest text-[10px]" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Global Domain</label>
                                <Input value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} placeholder="US" className="h-16 rounded-2xl border-2 font-black tracking-widest text-[10px]" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={newAddress.isDefault}
                                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <label htmlFor="isDefault" className="text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">Designate as Primary Logistics Link</label>
                        </div>

                        <div className="flex justify-end gap-6 pt-6 border-t-2 border-slate-100">
                            <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400">Cancel Protocol</Button>
                            <Button onClick={handleSaveAddress} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3">
                                <Zap className="h-4 w-4" /> Save Node Records
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-10"
                    >
                        {addresses.length === 0 ? (
                            <div className="col-span-full py-24 text-center space-y-8 bg-slate-50/50 rounded-[48px] border-4 border-dashed border-slate-50">
                                <div className="h-20 w-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-200 shadow-sm">
                                    <MapPin className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-300">No Nodes Registered</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed"> Registry empty. Define an address node to enable fulfillment operations.</p>
                                <Button onClick={() => setIsAdding(true)} variant="outline" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2">Initialize First Node</Button>
                            </div>
                        ) : (
                            addresses.map((addr, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={addr.id}
                                    className={`p-10 rounded-[40px] border-2 relative transition-all group ${addr.isDefault ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/5' : 'bg-white border-slate-50 hover:border-slate-100 hover:shadow-xl'}`}
                                >
                                    {addr.isDefault && (
                                        <div className="absolute top-8 right-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-white px-4 py-2 rounded-full shadow-sm border border-primary/10">
                                            <Star className="h-3 w-3 fill-primary" /> Primary Node
                                        </div>
                                    )}

                                    <div className="mb-10 space-y-6">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-black transition-colors">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-2xl uppercase tracking-tighter text-slate-800">{addr.street}</p>
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-300 italic">{addr.city}, {addr.state} {addr.zipCode}</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 pt-2">
                                                <Globe className="h-3.5 w-3.5" /> {addr.country}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-8 border-t-2 border-slate-50/50 mt-auto">
                                        {!addr.isDefault ? (
                                            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)} className="h-12 text-[10px] font-black uppercase tracking-widest flex-1 rounded-xl bg-slate-50 hover:bg-black hover:text-white transition-all">
                                                Designate Primary
                                            </Button>
                                        ) : (
                                            <div className="flex-1 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-4">
                                                <ShieldCheck className="h-4 w-4" /> Operations Linked
                                            </div>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(addr.id)} className="h-12 w-12 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
