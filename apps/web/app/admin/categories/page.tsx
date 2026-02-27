"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2, Edit2, X, Package } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
    id: string;
    name: string;
    description?: string;
    slug: string;
    _count: { products: number };
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch { toast.error("Failed to load categories"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await api.patch(`/categories/${editingId}`, formData);
                toast.success("Category updated");
            } else {
                await api.post('/categories', formData);
                toast.success("Category created");
            }
            setFormData({ name: "", description: "" });
            setShowForm(false);
            setEditingId(null);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category? Products will remain but will be uncategorized.")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success("Category deleted");
            fetchCategories();
        } catch { toast.error("Failed to delete category"); }
    };

    const startEdit = (c: Category) => {
        setFormData({ name: c.name, description: c.description || "" });
        setEditingId(c.id);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Categories</h2>
                    <p className="text-muted-foreground mt-2">Organize your products into browseable collections.</p>
                </div>
                <Button onClick={() => setShowForm(true)} disabled={showForm} className="gap-2 shrink-0 rounded-full h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Add Category
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
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">{editingId ? "Edit Category" : "New Category"}</h3>
                                <Button type="button" variant="ghost" size="icon" onClick={cancelForm} className="rounded-full">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Category Name</label>
                                    <Input
                                        required
                                        placeholder="e.g. Menswear"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Description (Optional)</label>
                                    <Input
                                        placeholder="Short summary of what's in this category..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="rounded-2xl h-11"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={cancelForm} className="rounded-2xl px-6">Cancel</Button>
                                <Button type="submit" disabled={saving} className="rounded-2xl px-8 shadow-md min-w-[120px]">
                                    {saving ? "Processing..." : editingId ? "Save Changes" : "Create Category"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 bg-muted/40 animate-pulse rounded-3xl border" />
                    ))
                ) : categories.length > 0 ? (
                    categories.map((c) => (
                        <motion.div
                            layout
                            key={c.id}
                            className="group p-6 rounded-3xl border bg-card transition-all hover:shadow-lg hover:border-primary/20 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-bold">{c.name}</h4>
                                        <div className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{c.slug}</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{c.description || "No description provided."}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-full border border-muted-foreground/10">
                                <Package className="h-3 w-3" /> {c._count?.products || 0} Products
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">Empty Collections</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Start organizing your storefront by defining product categories.</p>
                        <Button variant="link" onClick={() => setShowForm(true)} className="mt-4">Define your first category</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
