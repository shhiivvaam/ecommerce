"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useCartStore } from "@/store/useCartStore";

interface ProductCardProps {
    product: {
        id: string;
        title: string;
        description: string;
        price: number;
        image: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: product.image,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg backdrop-blur-sm bg-white/50 dark:bg-black/50"
        >
            <Link href={`/products/${product.id}`} className="block block-aspect-w-1 block-aspect-h-1 relative">
                <div className="relative h-64 w-full overflow-hidden bg-muted/50 rounded-t-2xl">
                    <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="p-5">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">{product.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                        <Button size="icon" variant="secondary" className="rounded-full shadow-sm" onClick={handleAddToCart}>
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
