"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye, EyeOff, Link as LinkIcon, Image as ImageIcon, X } from "lucide-react";
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
            toast.error("Failed to fetch banners");
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
                toast.success("Banner updated");
            } else {
                await api.post('/banners', formData);
                toast.success("Banner created");
            }
            setShowForm(false);
            fetchBanners();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success("Banner deleted");
            fetchBanners();
        } catch {
            toast.error("Delete failed");
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            await api.patch(`/banners/${banner.id}`, { isActive: !banner.isActive });
            fetchBanners();
            toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`);
        } catch {
            toast.error("Status update failed");
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Homepage Banners</h2>
                    <p className="text-muted-foreground mt-2">Manage the sliding carousels and promotional graphics on your home page.</p>
                </div>
                <Button onClick={handleNew} className="gap-2 shrink-0 rounded-full h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Add New Banner
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
                    >
                        <h3 className="text-xl font-bold">{isEditing ? "Edit Carousel Slide" : "New Carousel Slide"}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Image URL</label>
                                    <Input
                                        required
                                        placeholder="https://images.unsplash.com/..."
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Link Destination (Optional)</label>
                                    <Input
                                        placeholder="/products/clx-id-..."
                                        value={formData.linkUrl}
                                        onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Main Heading</label>
                                    <Input
                                        placeholder="e.g. Winter Collection 2024"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Subtitle / Call to Action</label>
                                    <Input
                                        placeholder="e.g. Shop now for 40% discount"
                                        value={formData.subtitle}
                                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-sm font-medium ml-1 underline decoration-primary/20">Live Preview</label>
                                <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-muted flex items-center justify-center relative border border-primary/10">
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-end text-white">
                                                <h4 className="text-xl font-black uppercase tracking-tight line-clamp-1">{formData.title || "Headline Here"}</h4>
                                                <p className="text-sm font-medium opacity-90 line-clamp-1">{formData.subtitle || "Your secondary text goes here."}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Image Preview will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-2xl px-6">Cancel</Button>
                            <Button type="submit" className="rounded-2xl px-8 shadow-md">
                                {isEditing ? "Update Slide" : "Publish Slide"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[16/10] bg-muted/40 animate-pulse rounded-3xl border" />
                    ))
                ) : banners.length > 0 ? (
                    banners.map((b) => (
                        <motion.div
                            layout
                            key={b.id}
                            className={`group relative aspect-[16/10] rounded-3xl overflow-hidden border bg-card transition-all hover:shadow-xl ${!b.isActive ? 'grayscale opacity-60' : ''}`}
                        >
                            <img src={b.imageUrl} alt={b.title || "Banner"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black uppercase tracking-tighter leading-none">{b.title || "Untitled"}</h4>
                                    <p className="text-sm font-medium opacity-80 line-clamp-1">{b.subtitle}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="p-2 backdrop-blur-md bg-white/10 rounded-full border border-white/10">
                                            <LinkIcon className="h-4 w-4" />
                                        </div>
                                        {b.isActive ? (
                                            <div className="p-2 backdrop-blur-md bg-green-500/20 rounded-full border border-green-500/20 text-green-400">
                                                <Eye className="h-4 w-4" />
                                            </div>
                                        ) : (
                                            <div className="p-2 backdrop-blur-md bg-red-500/20 rounded-full border border-red-500/20 text-red-400">
                                                <EyeOff className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                        <Button variant="outline" size="icon" onClick={() => toggleActive(b)} className="h-9 w-9 backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                            {b.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(b)} className="h-9 w-9 backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                            <X className="h-4 w-4 rotate-45" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleDelete(b.id)} className="h-9 w-9 backdrop-blur-md bg-destructive/20 hover:bg-destructive/40 border-destructive/20 text-white">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {!b.isActive && (
                                <div className="absolute top-4 right-4 bg-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                                    Hidden
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">No banners created</h3>
                        <p className="text-muted-foreground mt-2">Add a banner to make your homepage more vibrant.</p>
                        <Button variant="link" onClick={handleNew} className="mt-4">Create your first banner</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
