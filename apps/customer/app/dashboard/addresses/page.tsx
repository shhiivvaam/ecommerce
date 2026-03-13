"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { MapPin, Plus, Trash2, Star, Globe, Zap, ShieldCheck, X, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const AddressMap = dynamic(() => import("@/components/AddressMap"), { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 rounded-2xl flex items-center justify-center animate-pulse text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Map Terminal...</div>
});

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
    firstName?: string;
    lastName?: string;
    label?: string;
    phone?: string;
    latitude?: number | null;
    longitude?: number | null;
}

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newAddress, setNewAddress] = useState({
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        isDefault: false,
        label: "Home",
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const [customLabel, setCustomLabel] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isDetecting, setIsDetecting] = useState(false);

    const updateField = (f: string, v: string | number | boolean | null) => {
        setNewAddress(prev => ({ ...prev, [f]: v }));
        if (formErrors[f]) setFormErrors(p => { const n = {...p}; delete n[f]; return n; });
    };

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

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!newAddress.firstName?.trim()) errors.firstName = "Requirement: First name mandatory";
        if (!newAddress.lastName?.trim()) errors.lastName = "Requirement: Last name mandatory";
        if (!newAddress.street?.trim()) errors.street = "Requirement: Street address mandatory";
        if (!newAddress.city?.trim()) errors.city = "Requirement: City hub mandatory";
        if (!newAddress.state?.trim()) errors.state = "Requirement: Territorial division mandatory";
        if (!newAddress.zipCode?.match(/^\d{6}$/)) errors.zipCode = "Invalid PIN: 6-digit numeric reference required";
        if (!newAddress.phone?.match(/^\d{10}$/)) errors.phone = "Invalid Phone: 10-digit mobile conduit required";
        if (newAddress.label === "Custom" && !customLabel.trim()) errors.customLabel = "Requirement: Custom marker name mandatory";
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveAddress = async () => {
        if (!validateForm()) {
            toast.error("Operation halted: Invalid parameters detected.");
            return;
        }

        const finalLabel = newAddress.label === "Custom" ? customLabel : newAddress.label;
        const payload = { ...newAddress, label: finalLabel };

        try {
            if (editingId) {
                await api.patch(`/addresses/${editingId}`, payload);
                toast.success("Logistics node updated.", { icon: '🔄' });
            } else {
                await api.post('/addresses', payload);
                toast.success("Logistics node established.", { icon: '📍' });
            }
            setIsAdding(false);
            setEditingId(null);
            setNewAddress({ firstName: "", lastName: "", street: "", city: "", state: "", zipCode: "", country: "", phone: "", isDefault: false, label: "Home", latitude: null, longitude: null });
            setCustomLabel("");
            setFormErrors({});
            fetchAddresses();
        } catch (error) {
            console.error("Node operation failure:", error);
            toast.error("Database rejection: Could not commit node.");
        }
    };

    const handleEditAddress = (addr: Address) => {
        setEditingId(addr.id);
        const standardLabels = ["Home", "Office", "Other"];
        const isCustom = addr.label && !standardLabels.includes(addr.label);
        
        setNewAddress({
            firstName: addr.firstName || "",
            lastName: addr.lastName || "",
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            phone: addr.phone || "",
            isDefault: addr.isDefault,
            label: isCustom ? "Custom" : (addr.label || "Home"),
            latitude: addr.latitude || null,
            longitude: addr.longitude || null,
        });
        if (isCustom) setCustomLabel(addr.label || "");
        setIsAdding(true);
    };

    const handleDetectLocation = () => {
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                handleMapChange(latitude, longitude);
            } catch {
                toast.error("Geolocation sync failed.");
            } finally {
                setIsDetecting(false);
            }
        }, () => {
            toast.error("Coordinate access denied.");
            setIsDetecting(false);
        });
    };

    const handleMapChange = async (lat: number, lng: number) => {
        setNewAddress(p => ({ ...p, latitude: lat, longitude: lng }));
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data.address) {
                setNewAddress(p => ({
                    ...p,
                    street: data.address.road || data.address.suburb || data.address.neighbourhood || p.street,
                    city: data.address.city || data.address.town || data.address.village || p.city,
                    state: data.address.state || p.state,
                    zipCode: data.address.postcode?.replace(/\s/g, '') || p.zipCode,
                }));
                setFormErrors({}); // Clear errors when mapping succeeds
            }
        } catch (e) { console.error("Reverse geocode failed", e); }
    };

    useEffect(() => {
        if (newAddress.zipCode?.length === 6) {
            (async () => {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${newAddress.zipCode}`);
                    const data = await res.json();
                    if (data[0]?.Status === "Success") {
                        const postOffice = data[0].PostOffice[0];
                        setNewAddress(p => ({
                            ...p,
                            city: postOffice.District || postOffice.Name,
                            state: postOffice.State
                        }));
                        toast.success(`Hub Detected: ${postOffice.District}`);
                    }
                } catch { /* silent */ }
            })();
        }
    }, [newAddress.zipCode]);

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
                                <Globe className="h-5 w-5 text-primary" /> {editingId ? "Node Rectification" : "Node Configuration"}
                            </h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting}
                                    className="h-10 px-4 rounded-xl border-2 border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                                >
                                    <MapPin className="h-4 w-4" /> {isDetecting ? "Detecting..." : "Detect Location"}
                                </button>
                                <button onClick={() => { setIsAdding(false); setEditingId(null); setFormErrors({}); }} className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Pinpoint Location</label>
                                <div className="h-64 rounded-3xl overflow-hidden border-2 border-slate-100 relative group">
                                    <AddressMap 
                                        lat={newAddress.latitude} 
                                        lng={newAddress.longitude} 
                                        onChange={handleMapChange} 
                                    />
                                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Drag marker to your exact doorstep for faster logistics.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Logistics Marker (Label)</label>
                            <div className="flex flex-wrap gap-3">
                                {["Home", "Office", "Other", "Custom"].map(lbl => (
                                    <button
                                        key={lbl}
                                        type="button"
                                        onClick={() => {
                                            updateField("label", lbl);
                                            if (formErrors.customLabel) setFormErrors(p => { const n = {...p}; delete n.customLabel; return n; });
                                        }}
                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newAddress.label === lbl ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                             {newAddress.label === "Custom" && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                                    <Input 
                                        value={customLabel} 
                                        onChange={e => {
                                            setCustomLabel(e.target.value.toUpperCase());
                                            if (formErrors.customLabel) setFormErrors(p => { const n = {...p}; delete n.customLabel; return n; });
                                        }} 
                                        placeholder="E.G. WAREHOUSE" 
                                        maxLength={20}
                                        className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.customLabel ? 'border-rose-300 bg-rose-50/30' : ''}`} 
                                    />
                                    {formErrors.customLabel && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.customLabel}</p>}
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Receiver (First Name)</label>
                                <Input value={newAddress.firstName} onChange={e => updateField("firstName", e.target.value)} placeholder="FIRST NAME" maxLength={50} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.firstName ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.firstName && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.firstName}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Receiver (Last Name)</label>
                                <Input value={newAddress.lastName} onChange={e => updateField("lastName", e.target.value)} placeholder="LAST NAME" maxLength={50} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.lastName ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.lastName && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.lastName}</p>}
                            </div>
                             <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Logistics conduit (Mobile)</label>
                                <Input value={newAddress.phone} onChange={e => updateField("phone", e.target.value.replace(/\D/g, ''))} placeholder="10-DIGIT MOBILE" maxLength={10} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.phone ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.phone && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.phone}</p>}
                            </div>
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Primary Conduit (Street)</label>
                                <Input value={newAddress.street} onChange={e => updateField("street", e.target.value)} placeholder="123 MAIN ST" maxLength={100} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.street ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.street && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.street}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City Hub</label>
                                <Input value={newAddress.city} onChange={e => updateField("city", e.target.value)} placeholder="CITY NAME" maxLength={50} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.city ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.city && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.city}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px) font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Territorial Division</label>
                                <Input value={newAddress.state} onChange={e => updateField("state", e.target.value)} placeholder="STATE NAME" maxLength={50} className={`h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${formErrors.state ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.state && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.state}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Postal Reference</label>
                                <Input value={newAddress.zipCode} onChange={e => updateField("zipCode", e.target.value.replace(/\D/g, ''))} placeholder="6-DIGIT PIN" maxLength={6} className={`h-16 rounded-2xl border-2 font-black tracking-widest text-[10px] ${formErrors.zipCode ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                                {formErrors.zipCode && <p className="text-[9px] font-black uppercase tracking-tight text-rose-500 ml-1">{formErrors.zipCode}</p>}
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Global Domain</label>
                                <Input value={newAddress.country} onChange={e => updateField("country", e.target.value)} placeholder="COUNTRY" maxLength={20} className="h-16 rounded-2xl border-2 font-black tracking-widest text-[10px]" />
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
                            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400">Cancel Protocol</Button>
                            <Button onClick={handleSaveAddress} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3">
                                <Zap className="h-4 w-4" /> {editingId ? "Commit Rectification" : "Save Node Records"}
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
                                    className={`p-10 rounded-[40px] border-2 relative transition-all group flex flex-col min-h-[320px] ${addr.isDefault ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/5' : 'bg-white border-slate-50 hover:border-slate-100 hover:shadow-xl'}`}
                                >
                                    {addr.isDefault && (
                                        <div className="absolute top-8 right-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-white px-4 py-2 rounded-full shadow-sm border border-primary/10">
                                            <Star className="h-3 w-3 fill-primary" /> Primary Node
                                        </div>
                                    )}

                                    <div className="mb-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-black transition-colors">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            {addr.label ? (
                                                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-black group-hover:text-white transition-all">
                                                    {addr.label}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2 rounded-xl bg-slate-50/50 border border-dashed border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-300">
                                                    UNLABELED
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {addr.firstName} {addr.lastName}
                                            </p>
                                            <p className="font-black text-2xl uppercase tracking-tighter text-slate-800 truncate" title={addr.street}>{addr.street}</p>
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-300 italic truncate">{addr.city}, {addr.state} {addr.zipCode}</p>
                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                                    <Globe className="h-3.5 w-3.5" /> {addr.country}
                                                </p>
                                                {addr.phone && (
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                                        <Zap className="h-3.5 w-3.5" /> +91 {addr.phone}
                                                    </p>
                                                )}
                                            </div>
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
                                        <Button variant="ghost" size="sm" onClick={() => handleEditAddress(addr)} className="h-12 w-12 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-black border border-slate-100 transition-all">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(addr.id)} className="h-12 w-12 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 border border-rose-50 transition-all">
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
