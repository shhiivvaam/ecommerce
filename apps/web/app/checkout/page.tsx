"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CreditCard, MapPin, Package, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const steps = [
    { id: 1, name: "Shipping Address", icon: MapPin },
    { id: 2, name: "Payment Method", icon: CreditCard },
    { id: 3, name: "Review Order", icon: Package },
];

export default function CheckoutPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const { items, total, clearCart } = useCartStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    if (items.length === 0 && currentStep !== 4) {
        return (
            <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Cart is empty</h2>
                <p className="text-muted-foreground mb-6">You need items in your cart to checkout.</p>
                <Link href="/products"><Button>Go Shopping</Button></Link>
            </div>
        );
    }

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        // Real implementation would hit the NestJS `POST /payments/checkout`
        // Returning a Stripe session URL and redirecting. We mock the delay here.
        await new Promise(r => setTimeout(r, 1500));
        setIsProcessing(false);
        clearCart();
        setCurrentStep(4);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl bg-muted/10 min-h-[80vh]">
            {/* Progress Stepper */}
            {currentStep < 4 && (
                <div className="mb-12">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500 rounded-full"
                            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        />

                        {steps.map((step) => {
                            const isActive = currentStep >= step.id;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-background p-2">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                                        }`}>
                                        {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                    </div>
                                    <span className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                        {step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Steps Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border shadow-sm rounded-xl p-6 sm:p-10"
                >
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Shipping Details</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-sm font-medium">First Name</label><Input placeholder="John" /></div>
                                <div className="space-y-2"><label className="text-sm font-medium">Last Name</label><Input placeholder="Doe" /></div>
                                <div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium">Street Address</label><Input placeholder="123 Main St" /></div>
                                <div className="space-y-2"><label className="text-sm font-medium">City</label><Input placeholder="New York" /></div>
                                <div className="space-y-2"><label className="text-sm font-medium">ZIP Code</label><Input placeholder="10001" /></div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button size="lg" onClick={handleNext}>Continue to Payment</Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Payment Setup</h2>
                            <p className="text-muted-foreground">You will be redirected securely to Stripe to complete your transaction after reviewing your order.</p>

                            <div className="border rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-muted/30">
                                <Lock className="h-8 w-8 text-primary" />
                                <div className="text-center">
                                    <p className="font-semibold">Secure Stripe Gateway</p>
                                    <p className="text-sm text-muted-foreground">We never store your raw credit card information.</p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button variant="ghost" onClick={handleBack}>Back</Button>
                                <Button size="lg" onClick={handleNext}>Review Order</Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Review Order</h2>
                            <div className="space-y-4 border rounded-lg p-4 divide-y">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between py-2 items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-muted rounded overflow-hidden">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium line-clamp-1">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                <div className="pt-4 flex justify-between text-lg font-bold">
                                    <span>Total Amount Due</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button variant="ghost" onClick={handleBack} disabled={isProcessing}>Back</Button>
                                <Button size="lg" onClick={handlePlaceOrder} disabled={isProcessing}>
                                    {isProcessing ? "Processing..." : "Place Order Securely"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center space-y-6 py-10">
                            <div className="mx-auto h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h2>
                            <p className="text-lg text-muted-foreground max-w-md mx-auto">
                                Thank you for your purchase. We have received your order and will send you a confirmation email shortly.
                            </p>
                            <div className="pt-8">
                                <Button size="lg" onClick={() => router.push('/dashboard/orders')} variant="outline" className="mr-4">View Order</Button>
                                <Button size="lg" onClick={() => router.push('/')}>Continue Shopping</Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
