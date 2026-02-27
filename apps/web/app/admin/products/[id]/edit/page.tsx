"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ProductForm } from "@/components/admin/ProductForm";
import toast from "react-hot-toast";

export default function EditProductPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${params.id}`);
                setProduct(data);
            } catch (err) {
                toast.error("Failed to load product");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading product details...</div>;
    if (!product) return <div className="p-8 text-center">Product not found.</div>;

    return (
        <div className="container mx-auto py-4">
            <ProductForm initialData={product} isEditing />
        </div>
    );
}
