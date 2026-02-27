"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CreditCard, MapPin, Package, Lock, Plus, Tag, X, ChevronRight, ShieldCheck, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface AppliedCoupon {
    couponId: string;
    code: string;
    discountAmount: number;
    finalTotal: number;
}

const steps = [
    { id: 1, name: "Logistics", icon: MapPin, label: "Shipping Node" },
    { id: 2, name: "Protocol", icon: CreditCard, label: "Payment Gateway" },
    { id: 3, name: "Validate", icon: Package, label: "Manifest Review" },
];

interface SavedAddress {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export default function CheckoutPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const { items, total, clearCart } = useCartStore();
    const [isProcessing, setIsProcessing] = useState(false);

    // Address state
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const [address, setAddress] = useState({
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        zipCode: "",
        state: "NY",
        country: "US"
    });

    const router = useRouter();

    const finalTotal = appliedCoupon ? appliedCoupon.finalTotal : total;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplyingCoupon(true);
        try {
            const { data } = await api.post('/coupons/apply', { code: couponCode.trim(), cartTotal: total });
            setAppliedCoupon(data);
            toast.success(`Coupon authorized: -${data.discountAmount.toFixed(2)} Credits`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid coupon signature');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
    };

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { data } = await api.get('/addresses');
                setSavedAddresses(data);
                if (data.length > 0) {
                    const def = data.find((a: SavedAddress) => a.isDefault);
                    setSelectedAddressId(def ? def.id : data[0].id);
                } else {
                    setIsAddingNew(true);
                }
            } catch (error) {
                console.error("Address registry retrieval failure", error);
                setIsAddingNew(true);
            }
        };
        fetchAddresses();
    }, []);

    if (items.length === 0 && currentStep !== 4) {
        return (
            <div className="container mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center px-8 bg-white dark:bg-[#050505] transition-colors duration-500">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center mb-10 text-slate-200 dark:text-slate-800">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white">Manifest Empty.</h2>
                <p className="text-slate-400 dark:text-slate-600 font-medium mt-4 italic">Acquisition protocol requires active assets in current registry.</p>
                <Link href="/products" className="mt-10">
                    <Button size="lg" className="rounded-2xl h-16 px-12 font-black uppercase tracking-widest text-[10px] shadow-2xl">Return to Archives</Button>
                </Link>
            </div>
        );
    }

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            const orderPayload: Record<string, unknown> = {
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                ...(appliedCoupon && { couponId: appliedCoupon.couponId }),
            };

            if (selectedAddressId && !isAddingNew) {
                orderPayload.addressId = selectedAddressId;
            } else {
                orderPayload.address = {
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    country: address.country,
                    zipCode: address.zipCode
                };
            }

            const orderRes = await api.post('/orders', orderPayload);
            const orderId = orderRes.data.id;

            await clearCart();

            const checkoutPayload = {
                orderId,
                items: items.map(i => ({
                    title: i.title,
                    price: i.price,
                    quantity: i.quantity
                })),
                successUrl: `${window.location.origin}/dashboard/orders?success=true`,
                cancelUrl: `${window.location.origin}/checkout?canceled=true`,
                ...(appliedCoupon && { discountAmount: appliedCoupon.discountAmount }),
            };

            const paymentRes = await api.post('/payments/checkout', checkoutPayload);

            if (paymentRes.data.url) {
                window.location.href = paymentRes.data.url;
            } else {
                setCurrentStep(4);
            }

        } catch (error) {
            console.error("Acquisition failure", error);
            toast.error("Protocol rejection. Verify data integrity and re-initialize.");
            setIsProcessing(false);
        }
    };

    const updateAddress = (field: string, value: string) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const canProceedFromAddress = () => {
        if (!isAddingNew && selectedAddressId) return true;
        if (isAddingNew && address.street && address.city && address.zipCode) return true;
        return false;
    };

    return (
        <div className="bg-white dark:bg-[#050505] min-h-screen pb-40 transition-colors duration-500">
            {/* Architectural Header */}
            <header className="pt-20 pb-12 border-b-2 border-slate-50 dark:border-slate-900 transition-colors">
                <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Finalization Stage</span>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">Acquisition <br />Protocol</h1>
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-lg italic mt-4 max-w-lg leading-tight uppercase tracking-tighter">Securely transferring ownership of selected assets to your physical location.</p>
                    </div>

                    {/* Progress Stepper */}
                    {currentStep < 4 && (
                        <div className="flex gap-4 md:gap-10 pb-4 w-full md:w-auto overflow-x-auto no-scrollbar">
                            {steps.map((step) => {
                                const isActive = currentStep >= step.id;
                                const isDone = currentStep > step.id;
                                return (
                                    <div key={step.id} className="flex items-center gap-6 shrink-0">
                                        <div className={`h-16 w-16 rounded-[24px] border-2 flex items-center justify-center transition-all ${isActive ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-2xl" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700"}`}>
                                            {isDone ? <CheckCircle2 className="h-7 w-7" /> : <step.icon className="h-7 w-7" />}
                                        </div>
                                        <div className="hidden xl:block space-y-1">
                                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-black dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>{step.name}</p>
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-tighter italic">{step.label}</p>
                                        </div>
                                        {step.id < 3 && <div className="hidden lg:block h-px w-16 bg-slate-100 dark:bg-slate-900" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </header>

            <div className="container px-8 py-20 mx-auto max-w-7xl">
                <div className="max-w-4xl mx-auto">
                    {/* Execution Panel */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-16"
                        >
                            {currentStep === 1 && (
                                <div className="space-y-12">
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Physical Logistics</h2>
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">Destination node identification</p>
                                    </div>

                                    {savedAddresses.length > 0 && !isAddingNew && (
                                        <div className="space-y-8">
                                            <div className="grid gap-8 sm:grid-cols-2">
                                                {savedAddresses.map((addr) => (
                                                    <motion.div
                                                        whileHover={{ y: -5 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        key={addr.id}
                                                        onClick={() => setSelectedAddressId(addr.id)}
                                                        className={`p-10 rounded-[40px] border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-3xl shadow-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 opacity-60 dark:opacity-40'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-10">
                                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 ${selectedAddressId === addr.id ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-slate-100 dark:border-slate-800 text-slate-200 dark:text-slate-800'}`}>
                                                                <MapPin className="h-6 w-6" />
                                                            </div>
                                                            {selectedAddressId === addr.id && <div className="h-3 w-3 rounded-full bg-primary animate-pulse mt-4" />}
                                                        </div>
                                                        <p className="text-xl font-black uppercase tracking-tight text-black dark:text-white">{addr.street}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2 italic">{addr.city}, {addr.state} {addr.zipCode}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <Button variant="outline" onClick={() => setIsAddingNew(true)} className="w-full h-20 rounded-[30px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all gap-4 font-black uppercase tracking-widest text-[10px]">
                                                <Plus className="h-5 w-5" /> Define New Protocol Address
                                            </Button>
                                        </div>
                                    )}

                                    {isAddingNew && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[56px] border-2 border-slate-100 dark:border-slate-800 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500 transition-colors">
                                            {savedAddresses.length > 0 && (
                                                <Button variant="ghost" onClick={() => setIsAddingNew(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-black dark:hover:text-white p-0 h-auto">
                                                    &larr; Return to Registry
                                                </Button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2">Acquirer First Name</label>
                                                    <Input value={address.firstName} onChange={e => updateAddress('firstName', e.target.value)} placeholder="e.g. MARCUS" className="h-16 rounded-2xl border-2 dark:border-slate-800 dark:bg-black font-bold focus-visible:ring-primary/20 text-black dark:text-white uppercase tracking-widest text-xs" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2">Acquirer Last Name</label>
                                                    <Input value={address.lastName} onChange={e => updateAddress('lastName', e.target.value)} placeholder="e.g. AURELIUS" className="h-16 rounded-2xl border-2 dark:border-slate-800 dark:bg-black font-bold focus-visible:ring-primary/20 text-black dark:text-white uppercase tracking-widest text-xs" />
                                                </div>
                                                <div className="space-y-4 sm:col-span-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2">Primary Conduit (Street)</label>
                                                    <Input value={address.street} onChange={e => updateAddress('street', e.target.value)} placeholder="e.g. 742 EVERGREEN TERRACE" className="h-16 rounded-2xl border-2 dark:border-slate-800 dark:bg-black font-bold focus-visible:ring-primary/20 text-black dark:text-white uppercase tracking-widest text-xs" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2">City Node</label>
                                                    <Input value={address.city} onChange={e => updateAddress('city', e.target.value)} placeholder="e.g. SPRINGFIELD" className="h-16 rounded-2xl border-2 dark:border-slate-800 dark:bg-black font-bold focus-visible:ring-primary/20 text-black dark:text-white uppercase tracking-widest text-xs" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2">Postal Reference</label>
                                                    <Input value={address.zipCode} onChange={e => updateAddress('zipCode', e.target.value)} placeholder="e.g. 52401" className="h-16 rounded-2xl border-2 dark:border-slate-800 dark:bg-black font-black tracking-[0.4em] focus-visible:ring-primary/20 text-black dark:text-white text-xs text-center" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-12 flex justify-between items-center border-t-2 border-slate-50 dark:border-slate-900 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">Step 01 / 03 — Operational Verification</p>
                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            disabled={!canProceedFromAddress()}
                                            className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-3xl transition-all active:scale-95"
                                        >
                                            Authorize & Proceed <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-12">
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Acquisition Gateway</h2>
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">Financial synchronization protocol</p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[64px] p-16 border-4 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-10 text-center relative overflow-hidden transition-colors">
                                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform hover:scale-110 duration-700">
                                            <CreditCard className="h-64 w-64 -rotate-12 text-black dark:text-white" />
                                        </div>

                                        <div className="h-32 w-32 bg-white dark:bg-black rounded-3xl flex items-center justify-center text-primary shadow-3xl relative z-10 transition-colors">
                                            <Lock className="h-12 w-12 fill-primary/10" />
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">IRONCLAD STRIPE PROTOCOL</h3>
                                            <p className="text-base font-medium text-slate-400 dark:text-slate-500 max-w-md mx-auto italic leading-relaxed">External redirection to military-grade encryption hub for financial settlement. No card data persist on locale servers.</p>
                                        </div>

                                        <div className="flex gap-6 pt-6 relative z-10">
                                            {['VISA', 'AMEX', 'MC', 'PAYPAL'].map(brand => (
                                                <div key={brand} className="h-12 w-20 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center grayscale opacity-40 dark:opacity-20 font-black text-[10px] tracking-widest">
                                                    {brand}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-12 flex justify-between items-center border-t-2 border-slate-50 dark:border-slate-900 transition-colors">
                                        <Button variant="ghost" onClick={handleBack} className="h-20 px-10 rounded-[24px] font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-600 hover:text-black dark:hover:text-white transition-all">Revert Stage</Button>
                                        <Button
                                            size="lg"
                                            onClick={handleNext}
                                            className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-3xl transition-all active:scale-95"
                                        >
                                            Initialize Review <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-12">
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Manifest Finalization</h2>
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">Asset validation & loyalty synchronization</p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[56px] border-2 border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 transition-colors shadow-2xl dark:shadow-none">
                                        <div className="p-12 space-y-10">
                                            {items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center gap-12">
                                                    <div className="flex items-center gap-10">
                                                        <div className="relative h-24 w-24 bg-white dark:bg-black border-2 border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shrink-0 shadow-sm transition-colors">
                                                            <Image src={item.image ?? ''} alt={item.title} fill unoptimized className="object-cover" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-xl font-black uppercase tracking-tight line-clamp-1 text-black dark:text-white">{item.title}</p>
                                                            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">QUANTITY: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-black tracking-tighter tabular-nums text-black dark:text-white underline decoration-primary/20 decoration-4 underline-offset-4">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-12 bg-white/50 dark:bg-black/20 space-y-8 transition-colors">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 ml-2">Loyalty Credits / Coupon Protocol</label>

                                            {appliedCoupon ? (
                                                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-100 dark:border-emerald-900/50 rounded-[32px] px-10 py-6 text-emerald-800 dark:text-emerald-400">
                                                    <div className="flex items-center gap-6">
                                                        <Tag className="h-6 w-6" />
                                                        <div className="space-y-1">
                                                            <span className="font-black uppercase tracking-[0.2em] text-xs leading-none">{appliedCoupon.code} Authorized</span>
                                                            <p className="text-[10px] font-bold italic opacity-60 uppercase tracking-widest text-emerald-400 dark:text-emerald-600">Protocol Discount Applied</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-xl font-black tabular-nums">-${appliedCoupon.discountAmount.toFixed(2)}</span>
                                                        <button onClick={handleRemoveCoupon} className="h-12 w-12 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-500 flex items-center justify-center transition-all bg-emerald-100 dark:bg-emerald-900/50">
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-6">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            value={couponCode}
                                                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                                            placeholder="ENTER CODE"
                                                            className="h-20 rounded-[28px] border-2 dark:border-slate-800 dark:bg-black font-black tracking-[0.5em] uppercase text-center focus-visible:ring-primary/20 placeholder:text-slate-200 dark:placeholder:text-slate-800 text-black dark:text-white"
                                                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleApplyCoupon}
                                                        disabled={isApplyingCoupon || !couponCode.trim()}
                                                        className="h-20 px-12 rounded-[28px] border-4 dark:border-slate-800 dark:bg-slate-900 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                                                    >
                                                        {isApplyingCoupon ? '...' : 'Validate'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-12 bg-black dark:bg-black text-white space-y-6 transition-colors border-t border-white/5">
                                            <div className="flex justify-between items-baseline opacity-30">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gross Subtotal</span>
                                                <span className="text-2xl font-black tabular-nums">${total.toFixed(2)}</span>
                                            </div>
                                            {appliedCoupon && (
                                                <div className="flex justify-between items-baseline text-emerald-400">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Coupon Override</span>
                                                    <span className="text-2xl font-black tabular-nums">-${appliedCoupon.discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end pt-10 border-t-4 border-white/10">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Final Liability</span>
                                                    <p className="text-[10px] font-bold text-white/30 dark:text-white/20 uppercase tracking-[0.2em] italic">Authorized for Ownership Transfer</p>
                                                </div>
                                                <span className="text-7xl font-black tracking-tighter tabular-nums text-primary underline decoration-primary/20 decoration-8 underline-offset-16">${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-12 flex justify-between items-center border-t-2 border-slate-50 dark:border-slate-900 transition-colors">
                                        <Button variant="ghost" onClick={handleBack} disabled={isProcessing} className="h-20 px-10 rounded-[28px] font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-600 hover:text-black dark:hover:text-white transition-all">Revert Manifest</Button>
                                        <Button
                                            size="lg"
                                            onClick={handlePlaceOrder}
                                            disabled={isProcessing}
                                            className="h-20 px-20 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] transition-all active:scale-95 group relative overflow-hidden"
                                        >
                                            <span className="relative z-10">{isProcessing ? "Transmitting..." : "Establish Final Acquisition"}</span>
                                            <Zap className="h-6 w-6 relative z-10 transition-transform group-hover:scale-125" />
                                            {isProcessing && (
                                                <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="text-center space-y-16 py-32 px-12 bg-slate-50 dark:bg-slate-900/50 rounded-[72px] border-4 border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", damping: 12, stiffness: 100 }}
                                        className="mx-auto h-40 w-40 bg-emerald-500 text-white rounded-[48px] flex items-center justify-center shadow-[0_40px_80px_-15px_rgba(16,185,129,0.4)] dark:shadow-none"
                                    >
                                        <ShieldCheck className="h-20 w-20" />
                                    </motion.div>

                                    <div className="space-y-6">
                                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-black dark:text-white uppercase leading-[0.9]">Acquisition <br /><span className="text-emerald-500 dark:text-emerald-400">Authorized.</span></h2>
                                        <p className="text-xl text-slate-400 dark:text-slate-500 font-medium max-w-xl mx-auto italic leading-relaxed">
                                            Registry updated successfully. Your assets have been committed to the logistics flow and will materialize at the destination node shortly.
                                        </p>
                                    </div>

                                    <div className="pt-16 flex flex-col md:flex-row justify-center gap-8">
                                        <Link href="/dashboard/orders">
                                            <Button size="lg" variant="outline" className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] border-4 dark:border-slate-800 dark:bg-slate-900 transition-all active:scale-95 shadow-xl dark:shadow-none">Monitor Dispatch</Button>
                                        </Link>
                                        <Link href="/">
                                            <Button size="lg" className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] shadow-3xl transition-all active:scale-95">Return to Core</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
