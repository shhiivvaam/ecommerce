"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
    id: string;
    title: string;
    price: number;
    stock: number;
    category?: { name: string };
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    const fetchProducts = async (q = "") => {
        setLoading(true);
        try {
            const { data } = await api.get(`/products?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`);
            setProducts(data.products);
            setTotal(data.total);
        } catch {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success("Product deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(search);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground mt-1">{total} products total</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => fetchProducts(search)} title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button className="gap-2 shrink-0">
                        <Plus className="h-4 w-4" /> Add Product
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow">
                <div className="p-4 border-b">
                    <form onSubmit={handleSearch} className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="pl-8 bg-background"
                        />
                    </form>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b bg-muted/30">
                            <tr>
                                <th className="h-11 px-4 font-medium text-muted-foreground">Product</th>
                                <th className="h-11 px-4 font-medium text-muted-foreground">Category</th>
                                <th className="h-11 px-4 font-medium text-muted-foreground text-right">Price</th>
                                <th className="h-11 px-4 font-medium text-muted-foreground text-right">Stock</th>
                                <th className="h-11 px-4 font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="p-4">
                                                <div className="h-4 bg-muted animate-pulse rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : products.map(p => (
                                <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                    <td className="p-4 font-medium max-w-[220px] truncate">{p.title}</td>
                                    <td className="p-4 text-muted-foreground">{p.category?.name ?? "—"}</td>
                                    <td className="p-4 text-right font-semibold">${p.price.toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.stock === 0
                                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            : p.stock < 10
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            }`}>
                                            {p.stock === 0 ? "Out of stock" : p.stock <= 10 ? `Low (${p.stock})` : p.stock}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && products.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No products found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
