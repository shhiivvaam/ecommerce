"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye, EyeOff, Link as LinkIcon, Image as ImageIcon, X, Zap, Activity, ExternalLink, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Banner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    subtitle?: string;
    isActive: boolean;
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        imageUrl: "",
        linkUrl: "",
        title: "",
        subtitle: "",
        isActive: true
    });

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/banners/all');
            setBanners(data);
        } catch {
            toast.error("Cloud visual synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedId) {
                await api.patch(`/banners/${selectedId}`, formData);
                toast.success("Visual node updated");
            } else {
                await api.post('/banners', formData);
                toast.success("New visual node initialized");
            }
            setShowForm(false);
            fetchBanners();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Protocol rejection");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Destroy this visual node?")) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success("Node purged from manifest");
            fetchBanners();
        } catch {
            toast.error("Purge sequence failed");
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            await api.patch(`/banners/${banner.id}`, { isActive: !banner.isActive });
            fetchBanners();
            toast.success(`Node ${!banner.isActive ? 'activated' : 'deactivated'}`);
        } catch {
            toast.error("Status modification rejected");
        }
    };

    const handleEdit = (b: Banner) => {
        setFormData({
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl || "",
            title: b.title || "",
            subtitle: b.subtitle || "",
            isActive: b.isActive
        });
        setSelectedId(b.id);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleNew = () => {
        setFormData({
            imageUrl: "",
            linkUrl: "",
            title: "",
            subtitle: "",
            isActive: true
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
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Visual Hub</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">Cinematic <br />Manifesto</h2>
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Control high-fidelity hero visuals and promotional sequences across the interface.</p>
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
                                <ImageIcon className="h-64 w-64 rotate-12" />
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">{isEditing ? "Modify Protocol" : "New Visual Protocol"}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">High-Fidelity Media Injection</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-2xl h-16 w-16 border-4 border-slate-100 dark:border-slate-800">
                                    <X className="h-8 w-8 text-black dark:text-white" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Media Source (URL)</label>
                                        <Input
                                            required
                                            placeholder="HTTPS://MANIFEST-STORAGE.NET/MEDIA..."
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xs font-black uppercase tracking-widest focus-visible:ring-primary/20 transition-all px-10"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Redirect Link</label>
                                        <Input
                                            placeholder="/COLLECTIONS/PROTOCOL-NEXUS..."
                                            value={formData.linkUrl}
                                            onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                                            className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xs font-black uppercase tracking-widest focus-visible:ring-primary/20 transition-all px-10"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Core Title</label>
                                            <Input
                                                placeholder="PHASE ZERO"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xl font-black uppercase tracking-tighter focus-visible:ring-primary/20 transition-all px-8"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Subtitle String</label>
                                            <Input
                                                placeholder="Execute Sequence..."
                                                value={formData.subtitle}
                                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                                className="rounded-[28px] h-20 bg-slate-50 dark:bg-transparent border-4 border-slate-50 dark:border-slate-800 text-xs font-bold uppercase tracking-widest transition-all px-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2 italic">Cinematic Projection Preview</label>
                                    <div className="aspect-[21/9] rounded-[48px] overflow-hidden bg-slate-50 dark:bg-[#050505] flex items-center justify-center relative border-4 border-slate-100 dark:border-slate-900 shadow-inner group">
                                        {formData.imageUrl ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end text-white">
                                                    <h4 className="text-3xl font-black uppercase tracking-tighter line-clamp-1">{formData.title || "PHASE HEADING"}</h4>
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mt-2 line-clamp-1 italic">{formData.subtitle || "Protocol descriptive string."}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <ImageIcon className="h-16 w-16 mx-auto text-slate-200 dark:text-slate-800 opacity-50" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 italic">Projection awaiting media stream...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-10 border-t-4 border-slate-50 dark:border-slate-900 relative z-10 mt-10">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-[24px] h-16 px-12 font-black uppercase text-[11px] tracking-widest text-slate-400 dark:text-slate-600">Deactivate</Button>
                                <Button type="submit" className="rounded-[24px] h-16 px-16 shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-widest min-w-[240px]">
                                    {isEditing ? "Commit Protocol" : "Publish Stream"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[16/10] bg-slate-50/50 dark:bg-white/5 animate-pulse rounded-[48px] border-4 border-slate-50 dark:border-slate-900" />
                    ))
                ) : banners.length > 0 ? (
                    banners.map((b, i) => (
                        <motion.div
                            layout
                            key={b.id}
                            className={`group relative aspect-[16/10] rounded-[56px] overflow-hidden border-4 border-slate-50 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] transition-all hover:shadow-3xl hover:-translate-y-2 ${!b.isActive ? 'grayscale opacity-60' : ''}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.imageUrl} alt={b.title || "Banner"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end text-white">
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">{b.title || "IDENTIFIER MISSING"}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 line-clamp-1 italic">{b.subtitle}</p>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center backdrop-blur-md bg-white/10 rounded-2xl border-2 border-white/20">
                                            <LinkIcon className="h-4 w-4" />
                                        </div>
                                        {b.isActive ? (
                                            <div className="h-10 w-10 flex items-center justify-center backdrop-blur-md bg-emerald-500/20 rounded-2xl border-2 border-emerald-500/20 text-emerald-400">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 flex items-center justify-center backdrop-blur-md bg-rose-500/20 rounded-2xl border-2 border-rose-500/20 text-rose-400">
                                                <Zap className="h-4 w-4 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <Button variant="ghost" size="icon" onClick={() => toggleActive(b)} className="h-11 w-11 backdrop-blur-md bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-2xl text-white">
                                            {b.isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(b)} className="h-11 w-11 backdrop-blur-md bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-2xl text-white">
                                            <Pencil className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="h-11 w-11 backdrop-blur-md bg-rose-600/20 hover:bg-rose-600/40 border-2 border-rose-600/20 rounded-2xl text-white">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {!b.isActive && (
                                <div className="absolute top-8 right-8 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-white/50 border-2 border-white/10 shadow-2xl">
                                    PROTOCOL: INACTIVE
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-60 text-center bg-slate-50/30 dark:bg-white/5 rounded-[64px] border-4 border-dashed border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors">
                        <ImageIcon className="h-32 w-32 mx-auto text-slate-100 dark:text-slate-900 mb-10 opacity-50" />
                        <h3 className="text-4xl font-black uppercase tracking-[0.2em] text-slate-200 dark:text-slate-800">Visual Void</h3>
                        <p className="text-sm font-black text-slate-300 dark:text-slate-700 mt-4 max-w-sm mx-auto italic uppercase tracking-widest leading-relaxed">No high-fidelity media nodes detected in the current stream.</p>
                        <Button
                            onClick={handleNew}
                            className="mt-12 rounded-[28px] h-20 px-16 font-black uppercase tracking-[0.2em] text-[11px] shadow-3xl"
                        >
                            Initialize First Node
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
