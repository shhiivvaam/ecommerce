"use client";

import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
    const { items, total, removeItem, updateQuantity } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Your cart is empty</h2>
                <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything to your cart yet.</p>
                <Link href="/products">
                    <Button size="lg" className="rounded-full">Start Shopping</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container px-4 py-12 mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-6 p-4 rounded-xl border bg-card"
                            >
                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.productId}`} className="text-lg font-medium hover:underline block truncate">
                                        {item.title}
                                    </Link>
                                    <p className="font-bold mt-1">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                    >
                                        -
                                    </Button>
                                    <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="lg:col-span-1 border rounded-xl p-6 bg-card h-fit sticky top-24 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping estimate</span>
                            <span className="font-medium">Calculated at checkout</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax estimate</span>
                            <span className="font-medium">Calculated at checkout</span>
                        </div>
                        <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button className="w-full mt-6 h-12 rounded-full font-medium" size="lg">
                        Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
