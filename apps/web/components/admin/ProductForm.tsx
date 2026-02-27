"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        price: initialData?.price || 0,
        discounted: initialData?.discounted || undefined,
        stock: initialData?.stock || 0,
        categoryId: initialData?.categoryId || "",
        gallery: initialData?.gallery || [""],
        tags: initialData?.tags?.join(", ") || "",
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get("/categories");
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories");
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "price" || name === "stock" || name === "discounted" ? parseFloat(value) : value
        }));
    };

    const handleGalleryChange = (index: number, value: string) => {
        const newGallery = [...formData.gallery];
        newGallery[index] = value;
        setFormData(prev => ({ ...prev, gallery: newGallery }));
    };

    const addGalleryItem = () => {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ""] }));
    };

    const removeGalleryItem = (index: number) => {
        if (formData.gallery.length <= 1) return;
        setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_: string, i: number) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            gallery: formData.gallery.filter((url: string) => url.trim() !== ""),
            tags: formData.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t !== ""),
            discounted: formData.discounted === 0 || isNaN(formData.discounted as any) ? null : formData.discounted
        };

        try {
            if (isEditing) {
                await api.patch(`/products/${initialData.id}`, payload);
                toast.success("Product updated!");
            } else {
                await api.post("/products", payload);
                toast.success("Product created!");
            }
            router.push("/admin/products");
            router.refresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon" type="button">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Product" : "New Product"}</h2>
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? "Saving..." : "Save Product"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                        <h3 className="font-semibold text-lg">General Information</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Title</label>
                            <Input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Premium Wireless Headphones" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea name="description" value={formData.description} onChange={handleChange} required rows={5} placeholder="Describe your product..." />
                        </div>
                    </div>

                    <div className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                        <h3 className="font-semibold text-lg">Media</h3>
                        <p className="text-xs text-muted-foreground">Enter image URLs for your product gallery.</p>
                        <div className="space-y-3">
                            {formData.gallery.map((url: string, index: number) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGalleryChange(index, e.target.value)}
                                        placeholder="https://..."
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeGalleryItem(index)}
                                        disabled={formData.gallery.length <= 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addGalleryItem} className="gap-2">
                                <Plus className="h-4 w-4" /> Add Image URL
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                        <h3 className="font-semibold text-lg">Pricing & Stock</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price</label>
                            <Input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" min="0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Discounted Price (Optional)</label>
                            <Input type="number" name="discounted" value={formData.discounted || ""} onChange={handleChange} step="0.01" min="0" placeholder="None" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Initial Stock</label>
                            <Input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" />
                        </div>
                    </div>

                    <div className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                        <h3 className="font-semibold text-lg">Organization</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                className="w-full h-10 px-3 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select a category</option>
                                {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tags (comma separated)</label>
                            <Input name="tags" value={formData.tags} onChange={handleChange} placeholder="new, summer, electronics" />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
