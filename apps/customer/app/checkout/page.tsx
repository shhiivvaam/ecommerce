"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/hooks/useCart";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, CreditCard, MapPin, Package, Lock,
    Plus, Tag, X, ChevronRight, ShieldCheck, Zap, ShieldAlert, Pencil,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const AddressMap = dynamic(() => import("@/components/AddressMap"), { 
    ssr: false,
    loading: () => <div style={{ height: "300px", width: "100%", background: "rgba(10,10,10,.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Map...</div>
});

interface AppliedCoupon {
    couponId?: string;
    affiliateId?: string;
    affiliateCode?: string;
    code: string;
    discountAmount: number;
    finalTotal: number;
}

interface SavedAddress {
    id: string;
    firstName?: string;
    lastName?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
    label: string;
    phone: string;
    latitude?: number | null;
    longitude?: number | null;
}

const steps = [
    { id: 1, name: "Shipping", icon: MapPin, label: "Delivery address" },
    { id: 2, name: "Payment", icon: CreditCard, label: "Secure payment" },
    { id: 3, name: "Review", icon: Package, label: "Order summary" },
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --ink: #0a0a0a;
  --paper: #f5f3ef;
  --accent: #c8ff00;
  --mid: #8a8a8a;
  --border: rgba(10,10,10,0.1);
  --card: #ffffff;
}

*, *::before, *::after { box-sizing: border-box; }

.co-root {
  font-family: 'DM Sans', sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
}

/* ─── Header ───────────────────────────────────────── */
.co-header {
  background: var(--ink);
  padding: 88px 0 40px;
}
.co-header-inner {
  max-width: 960px; margin: 0 auto; padding: 0 40px;
  display: flex; align-items: flex-end;
  justify-content: space-between; gap: 32px; flex-wrap: wrap;
}
.co-eyebrow {
  font-size: 10px; font-weight: 500; letter-spacing: .18em;
  text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 10px;
}
.co-page-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(40px, 5.5vw, 64px); font-weight: 900;
  text-transform: uppercase; line-height: .92;
  color: #fff; letter-spacing: -.01em;
}

/* ─── Stepper ──────────────────────────────────────── */
.co-stepper { display: flex; align-items: center; gap: 0; }
.co-step { display: flex; align-items: center; gap: 10px; }
.co-step-dot {
  width: 36px; height: 36px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid rgba(255,255,255,0.18);
  background: transparent; color: rgba(255,255,255,0.3);
  transition: background .2s, border-color .2s, color .2s; flex-shrink: 0;
}
.co-step-dot.active { background: var(--accent); border-color: var(--accent); color: var(--ink); }
.co-step-dot.done { background: rgba(200,255,0,.12); border-color: rgba(200,255,0,.35); color: var(--accent); }
.co-step-name { font-size: 11px; font-weight: 500; color: rgba(255,255,255,.45); line-height: 1; }
.co-step-name.on { color: #fff; }
.co-step-sub { font-size: 10px; font-weight: 300; color: rgba(255,255,255,.25); margin-top: 2px; }
.co-connector { width: 28px; height: 1px; background: rgba(255,255,255,.1); margin: 0 8px; flex-shrink: 0; }
.co-connector.done { background: rgba(200,255,0,.3); }

/* ─── Body shell ───────────────────────────────────── */
.co-body { max-width: 960px; margin: 0 auto; padding: 48px 40px 100px; }

/* ─── Step header ──────────────────────────────────── */
.co-step-eyebrow {
  font-size: 10px; font-weight: 500; letter-spacing: .16em;
  text-transform: uppercase; color: var(--mid); display: block; margin-bottom: 8px;
}
.co-step-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(32px, 4.5vw, 48px); font-weight: 900;
  text-transform: uppercase; line-height: .95; margin-bottom: 6px;
}
.co-step-desc { font-size: 13px; font-weight: 300; color: var(--mid); line-height: 1.65; }

/* ─── Inputs ───────────────────────────────────────── */
.co-label {
  display: block; font-size: 10px; font-weight: 500;
  letter-spacing: .16em; text-transform: uppercase;
  color: var(--mid); margin-bottom: 8px;
}
.co-input {
  width: 100%; height: 48px; padding: 0 16px;
  border-radius: 6px; border: 1.5px solid var(--border);
  background: var(--paper); font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 400; color: var(--ink);
  outline: none; transition: border-color .2s, background .2s;
  -webkit-appearance: none;
}
.co-input:focus { border-color: var(--ink); background: #fff; }
.co-input::placeholder { color: rgba(10,10,10,.26); }
.co-input:disabled { opacity: .4; cursor: not-allowed; }

/* ─── Buttons ──────────────────────────────────────── */
.co-btn {
  height: 52px; padding: 0 28px; border-radius: 6px; border: none;
  background: var(--ink); color: #fff; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  transition: background .2s, transform .15s;
}
.co-btn:hover:not(:disabled) { background: #1c1c1c; transform: translateY(-1px); }
.co-btn:active:not(:disabled) { transform: translateY(0); }
.co-btn:disabled { opacity: .36; cursor: not-allowed; transform: none; }

.co-btn-ghost {
  height: 52px; padding: 0 24px; border-radius: 6px;
  border: 1.5px solid var(--border); background: transparent; color: var(--mid);
  cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px;
  font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 8px;
  transition: border-color .2s, color .2s;
}
.co-btn-ghost:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); }
.co-btn-ghost:disabled { opacity: .36; cursor: not-allowed; }

.co-btn-dashed {
  width: 100%; height: 46px; border-radius: 6px;
  border: 1.5px dashed var(--border); background: transparent; color: var(--mid);
  cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px;
  font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: border-color .2s, color .2s, background .2s;
}
.co-btn-dashed:hover { border-color: var(--ink); color: var(--ink); background: rgba(10,10,10,.02); }

/* ─── Address tile ─────────────────────────────────── */
.co-addr {
  padding: 18px 20px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--card);
  cursor: pointer; transition: border-color .2s, box-shadow .2s, opacity .2s;
}
.co-addr.selected { border-color: var(--ink); box-shadow: 0 2px 16px rgba(10,10,10,.09); opacity: 1; }
.co-addr:not(.selected) { opacity: .68; }
.co-addr:not(.selected):hover { opacity: 1; border-color: rgba(10,10,10,.28); }

/* ─── Inset form panel ─────────────────────────────── */
.co-inset {
  background: var(--paper); border: 1px solid var(--border);
  border-radius: 10px; padding: 28px;
}

/* ─── Card wrapper ─────────────────────────────────── */
.co-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
}

/* ─── Order item row ───────────────────────────────── */
.co-item-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 18px 24px;
  border-bottom: 1px solid var(--border);
}
.co-item-row:last-child { border-bottom: none; }

/* ─── Coupon applied ───────────────────────────────── */
.co-coupon-tag {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 16px; border-radius: 6px;
  background: rgba(200,255,0,.1); border: 1px solid rgba(200,255,0,.26);
}

/* ─── Total panel ──────────────────────────────────── */
.co-totals {
  background: var(--ink); color: #fff;
  padding: 24px 28px;
  border-radius: 0 0 9px 9px;
}
.co-totals-row {
  display: flex; align-items: baseline;
  justify-content: space-between; gap: 16px;
}

/* ─── Payment info card ────────────────────────────── */
.co-pay-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; padding: 48px 40px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.co-pay-icon {
  width: 60px; height: 60px; border-radius: 10px;
  background: var(--paper); border: 1.5px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px; color: var(--ink);
}
.co-pay-badge {
  height: 32px; padding: 0 14px; border-radius: 5px;
  border: 1.5px solid var(--border); background: var(--paper);
  font-size: 10px; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--mid);
  display: inline-flex; align-items: center;
}

/* ─── Nav row ──────────────────────────────────────── */
.co-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 24px; border-top: 1px solid var(--border);
  gap: 16px; flex-wrap: wrap;
}

/* ─── Success ──────────────────────────────────────── */
.co-success-icon {
  width: 72px; height: 72px; border-radius: 12px; background: #16a34a;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28px; color: #fff;
}

/* ─── Rule ─────────────────────────────────────────── */
.co-rule { height: 1px; background: var(--border); border: none; margin: 0; }

/* ─── Responsive ───────────────────────────────────── */
@media (max-width: 680px) {
  .co-header-inner, .co-body { padding-left: 20px; padding-right: 20px; }
  .co-stepper { display: none; }
  .co-btn, .co-btn-ghost { height: 48px; padding: 0 18px; font-size: 10px; }
  .co-pay-card { padding: 28px 20px; }
  .co-totals { padding: 20px; }
  .co-item-row { padding: 14px 16px; }
}
`;

export default function CheckoutPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const { data: cart } = useCart();
    const items = cart?.items ?? [];
    const [isProcessing, setIsProcessing] = useState(false);

    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const finalTotal = appliedCoupon ? appliedCoupon.finalTotal : total;

    const [address, setAddress] = useState({
        firstName: "", lastName: "", email: "", phone: "", label: "Home",
        street: "", city: "", zipCode: "", state: "", country: "",
        latitude: null as number | null, longitude: null as number | null,
    });
    const [customLabel, setCustomLabel] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const updateAddress = (f: string, v: string | number | null) => {
        setAddress((p) => ({ ...p, [f]: v }));
        if (formErrors[f]) setFormErrors(prev => {
            const next = { ...prev };
            delete next[f];
            return next;
        });
    };

    const [isDetecting, setIsDetecting] = useState(false);
    const handleDetectLocation = () => {
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                handleMapChange(latitude, longitude);
            } catch {
                toast.error("Failed to detect address details");
            } finally {
                setIsDetecting(false);
            }
        }, () => {
            toast.error("Location access denied or unavailable");
            setIsDetecting(false);
        });
    };

    const handleMapChange = async (lat: number, lng: number) => {
        setAddress(p => ({ ...p, latitude: lat, longitude: lng }));
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data.address) {
                setAddress(p => ({
                    ...p,
                    street: data.address.road || data.address.suburb || data.address.neighbourhood || p.street,
                    city: data.address.city || data.address.town || data.address.village || p.city,
                    state: data.address.state || p.state,
                    zipCode: data.address.postcode?.replace(/\s/g, '') || p.zipCode,
                }));
            }
        } catch (e) { console.error("Reverse geocode failed", e); }
    };
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!address.firstName?.trim()) errors.firstName = "First name is required";
        if (!address.lastName?.trim()) errors.lastName = "Last name is required";
        if (!address.street?.trim()) errors.street = "Street address is required";
        if (!address.city?.trim()) errors.city = "City is required";
        if (!address.state?.trim()) errors.state = "State is required";
        if (!address.zipCode?.match(/^\d{6}$/)) errors.zipCode = "Enter a valid 6-digit PIN code";
        if (!address.phone?.match(/^\d{10}$/)) errors.phone = "Enter a valid 10-digit mobile number";
        if (address.label === "Custom" && !customLabel.trim()) errors.customLabel = "Enter a label name";
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditAddress = (addr: SavedAddress) => {
        setEditingAddressId(addr.id);
        const standardLabels = ["Home", "Office", "Other"];
        const isCustom = addr.label && !standardLabels.includes(addr.label);
        
        setAddress(p => ({
            ...p,
            firstName: addr.firstName || "",
            lastName: addr.lastName || "",
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            phone: addr.phone || "",
            label: isCustom ? "Custom" : (addr.label || "Home"),
            latitude: addr.latitude || null,
            longitude: addr.longitude || null,
        }));
        if (isCustom) setCustomLabel(addr.label || "");
        setIsAddingNew(true);
    };

    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const saveNewAddressProfile = async () => {
        if (!validateForm()) {
            toast.error("Please fill all the required values.");
            return;
        }
        setIsSavingAddress(true);
        try {
            const finalLabel = address.label === "Custom" ? customLabel : address.label;
            const payload = {
                firstName: address.firstName,
                lastName: address.lastName,
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                country: address.country || "IN",
                phone: address.phone,
                label: finalLabel,
                latitude: address.latitude,
                longitude: address.longitude,
                isDefault: savedAddresses.length === 0
            };

            if (editingAddressId) {
                const { data } = await api.patch(`/addresses/${editingAddressId}`, payload);
                setSavedAddresses(prev => prev.map(a => a.id === data.id ? data : a));
                toast.success("Address updated successfully");
            } else {
                const { data } = await api.post("/addresses", payload);
                setSavedAddresses(prev => [...prev, data]);
                setSelectedAddressId(data.id);
                toast.success("Address saved to your profile");
            }

            setIsAddingNew(false);
            setEditingAddressId(null);
            setAddress({
                firstName: "", lastName: "", email: "", phone: "", label: "Home",
                street: "", city: "", zipCode: "", state: "", country: "",
                latitude: null, longitude: null,
            });
            setCustomLabel("");
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || "Failed to save address");
        } finally {
            setIsSavingAddress(false);
        }
    };

    useEffect(() => {
        if (address.zipCode?.length === 6) {
            (async () => {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${address.zipCode}`);
                    const data = await res.json();
                    if (data[0]?.Status === "Success") {
                        const postOffice = data[0].PostOffice[0];
                        setAddress(p => ({
                            ...p,
                            city: postOffice.District || postOffice.Name,
                            state: postOffice.State
                        }));
                        toast.success(`Detected: ${postOffice.District}, ${postOffice.State}`);
                    }
                } catch { /* silent fail */ }
            })();
        }
    }, [address.zipCode]);

    const { isAuthenticated, _hasHydrated } = useAuthStore();

    useEffect(() => {
        if (!_hasHydrated) return;
        // isAuthenticated is always true here — middleware protects /checkout
        (async () => {
            try {
                const { data } = await api.get("/addresses");
                setSavedAddresses(data);
                if (data.length > 0) {
                    const def = data.find((a: SavedAddress) => a.isDefault);
                    setSelectedAddressId(def ? def.id : data[0].id);
                } else setIsAddingNew(true);
            } catch { setIsAddingNew(true); }
        })();
    }, [isAuthenticated, _hasHydrated]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("canceled") === "true")
            toast.error("Payment canceled. Your cart has been preserved.");
    }, []);

    const handleApplyCouponOrAffiliate = async () => {
        if (!couponCode.trim()) return;
        setIsApplyingCoupon(true);
        try {
            try {
                const aff = await api.get(`/affiliates/verify/${couponCode.trim()}`);
                if (aff.data?.valid) {
                    const disc = total * aff.data.commissionRate;
                    setAppliedCoupon({ affiliateId: aff.data.affiliateId, affiliateCode: couponCode.trim(), code: couponCode.trim(), discountAmount: disc, finalTotal: total - disc });
                    toast.success(`Referral applied: -₹${disc.toFixed(2)}`);
                    setIsApplyingCoupon(false); return;
                }
            } catch { /* not affiliate */ }
            const { data } = await api.post("/coupons/apply", { code: couponCode.trim(), cartTotal: total });
            setAppliedCoupon(data);
            toast.success(`Coupon applied: -₹${data.discountAmount.toFixed(2)}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || "Invalid coupon or referral code");
        } finally { setIsApplyingCoupon(false); }
    };

    const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(""); };
    const handleNext = () => {
        if (currentStep === 1 && isAddingNew) {
            if (!validateForm()) {
                toast.error("Please save your address details before continuing");
                return;
            }
            // If valid but not saved, prompt user? Actually most users expect 'Continue' to save if they are in 'AddingNew' mode.
            // But here we have a dedicated save button. Let's make it robust.
            toast.error("Please click 'Save to Address Book' or 'Apply Update' before continuing");
            return;
        }
        if (currentStep === 1 && !selectedAddressId) {
            toast.error("Please select or add a shipping address");
            return;
        }
        setCurrentStep((p) => Math.min(p + 1, 3));
    };
    const handleBack = () => setCurrentStep((p) => Math.max(p - 1, 1));

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            const payload: Record<string, unknown> = {
                items: items.map((i) => ({ productId: i.productId, variantId: i.variantId || undefined, quantity: i.quantity })),
                expectedTotal: finalTotal,
                ...(appliedCoupon?.couponId && { couponId: appliedCoupon.couponId }),
                ...(appliedCoupon?.affiliateCode && { affiliateCode: appliedCoupon.affiliateCode }),
            };
            if (selectedAddressId && !isAddingNew) payload.addressId = selectedAddressId;
            else payload.address = { street: address.street, city: address.city, state: address.state, country: address.country, zipCode: address.zipCode, phone: address.phone, label: address.label, latitude: address.latitude, longitude: address.longitude };

            const { data: order } = await api.post("/orders", payload);
            sessionStorage.setItem("pendingOrderId", order.id);
            const { data: pay } = await api.post("/payments/checkout", {
                orderId: order.id,
                ...(appliedCoupon && { discountAmount: appliedCoupon.discountAmount }),
            });

            if (pay.id) {
                const opts = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
                    amount: pay.amount, currency: pay.currency,
                    name: "Reyva", description: "Order Payment", order_id: pay.id,
                    handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                        try {
                            setIsProcessing(true);
                            await api.post("/payments/verify", {
                                orderId: order.id,
                                razorpayOrderId: r.razorpay_order_id,
                                razorpayPaymentId: r.razorpay_payment_id,
                                signature: r.razorpay_signature,
                            });
                            setCurrentStep(4);
                        } catch (err: unknown) {
                            const e = err as { response?: { data?: { message?: string } } };
                            toast.error(e.response?.data?.message || "Payment verification failed.");
                        } finally { setIsProcessing(false); }
                    },
                    prefill: { name: `${address.firstName} ${address.lastName}`.trim(), email: address.email || "" },
                    theme: { color: "#0a0a0a" },
                };
                type RzpWindow = { Razorpay: new (o: Record<string, unknown>) => { on: (e: string, cb: (r: { error: { description: string } }) => void) => void; open: () => void } };
                const rzp = new (window as unknown as RzpWindow).Razorpay(opts);
                rzp.on("payment.failed", (r) => { toast.error(r.error.description); setIsProcessing(false); });
                rzp.open();
            } else { setCurrentStep(4); }
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { statusCode?: number; message?: string | string[] } } };
            if (e.response?.status === 409 || e.response?.data?.statusCode === 409)
                toast.error("Prices or stock have changed. Please review your cart.", { duration: 8000 });
            else if (e.response?.data?.message) {
                const m = e.response.data.message;
                toast.error(Array.isArray(m) ? m.join(", ") : m);
            } else toast.error("Something went wrong. Please try again.");
            setIsProcessing(false);
        }
    };

    /* ── empty cart ── */
    if (items.length === 0 && currentStep !== 4) return (
        <>
            <style>{STYLES}</style>
            <div className="co-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "0 32px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <ShieldAlert size={22} style={{ color: "var(--mid)" }} />
                </div>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 40, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>Cart Is Empty</h2>
                <p style={{ fontSize: 14, fontWeight: 300, color: "var(--mid)", marginBottom: 24 }}>Add products to your cart before checking out.</p>
                <Link href="/products"><button className="co-btn">Browse Products</button></Link>
            </div>
        </>
    );

    return (
        <>
            <style>{STYLES}</style>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" crossOrigin="anonymous" strategy="lazyOnload" />

            <div className="co-root">

                {/* ── HEADER ── */}
                <div className="co-header">
                    <div className="co-header-inner">
                        <div>
                            <span className="co-eyebrow">Secure Checkout</span>
                            <h1 className="co-page-title">Complete<br />Your Order</h1>
                        </div>

                        {currentStep < 4 && (
                            <div className="co-stepper">
                                {steps.map((step, idx) => {
                                    const active = currentStep >= step.id;
                                    const done = currentStep > step.id;
                                    return (
                                        <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
                                            <div className="co-step">
                                                <div className={`co-step-dot${done ? " done" : active ? " active" : ""}`}>
                                                    {done ? <CheckCircle2 size={15} /> : <step.icon size={15} />}
                                                </div>
                                                <div>
                                                    <p className={`co-step-name${active ? " on" : ""}`}>{step.name}</p>
                                                    <p className="co-step-sub">{step.label}</p>
                                                </div>
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className={`co-connector${done ? " done" : ""}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="co-body">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -14 }}
                            transition={{ duration: 0.27 }}
                        >

                            {/* ══ STEP 1 ── SHIPPING ══ */}
                            {currentStep === 1 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                                    <div>
                                        <span className="co-step-eyebrow">Step 1 of 3</span>
                                        <h2 className="co-step-title">Shipping Address</h2>
                                        <p className="co-step-desc">Choose a saved address or enter a new one.</p>
                                    </div>

                                    {savedAddresses.length > 0 && !isAddingNew && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                                                {savedAddresses.map((addr) => (
                                                    <div
                                                        key={addr.id}
                                                        className={`co-addr${selectedAddressId === addr.id ? " selected" : ""}`}
                                                        onClick={() => setSelectedAddressId(addr.id)}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid var(--border)", background: selectedAddressId === addr.id ? "var(--ink)" : "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <MapPin size={13} style={{ color: selectedAddressId === addr.id ? "#fff" : "var(--mid)" }} />
                                                            </div>
                                                            {addr.isDefault && (
                                                                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: "rgba(200,255,0,.14)", color: "#3d5200", border: "1px solid rgba(200,255,0,.28)", marginRight: 6 }}>Default</span>
                                                            )}
                                                            {addr.label && (
                                                                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: "var(--ink)", color: "#fff", border: "1px solid var(--ink)" }}>{addr.label}</span>
                                                            )}
                                                        </div>
                                                        {(addr.firstName || addr.lastName) && (
                                                            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--mid)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
                                                                👤 {addr.firstName} {addr.lastName}
                                                            </p>
                                                        )}
                                                        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={addr.street}>{addr.street}</p>
                                                        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--mid)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr.city}, {addr.state} {addr.zipCode}</p>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            {addr.phone ? <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>📞 +91 {addr.phone}</p> : <div />}
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", padding: "4px", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}
                                                            >
                                                                <Pencil size={11} /> Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="co-btn-dashed" onClick={() => setIsAddingNew(true)}>
                                                <Plus size={13} /> Add New Address
                                            </button>
                                        </div>
                                    )}

                                    {isAddingNew && (
                                        <div className="co-inset">
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                                {savedAddresses.length > 0 && (
                                                    <button
                                                        onClick={() => { setIsAddingNew(false); setEditingAddressId(null); }}
                                                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--mid)", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
                                                    >
                                                        ← Back to saved
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleDetectLocation}
                                                    disabled={isDetecting}
                                                    style={{ background: "var(--ink)", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: "#fff", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", marginLeft: "auto" }}
                                                >
                                                    <MapPin size={12} /> {isDetecting ? "Detecting..." : "Detect Location"}
                                                </button>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                                <div style={{ gridColumn: "1 / -1", marginBottom: 8 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                        <label className="co-label" style={{ margin: 0 }}>Pinpoint Location</label>
                                                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: "rgba(200,255,0,.15)", color: "#3d5200", border: "1px solid rgba(200,255,0,.3)" }}>
                                                            Label: {address.label === "Custom" ? (customLabel || "Custom") : address.label}
                                                        </span>
                                                    </div>
                                                    <AddressMap 
                                                        lat={address.latitude} 
                                                        lng={address.longitude} 
                                                        onChange={handleMapChange} 
                                                    />
                                                    <p style={{ fontSize: 10, color: "var(--mid)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                                        <Zap size={10} /> Drag the marker to your exact doorstep for faster delivery.
                                                    </p>
                                                </div>

                                                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                                                    {["Home", "Office", "Other", "Custom"].map(lbl => (
                                                        <button
                                                            key={lbl}
                                                            type="button"
                                                            onClick={() => {
                                                                updateAddress("label", lbl);
                                                                if (formErrors.customLabel) setFormErrors(prev => {
                                                                    const n = {...prev}; delete n.customLabel; return n;
                                                                });
                                                            }}
                                                            style={{
                                                                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500, border: "1px solid", cursor: "pointer",
                                                                background: address.label === lbl ? "var(--ink)" : "var(--paper)",
                                                                color: address.label === lbl ? "#fff" : "var(--mid)",
                                                                borderColor: address.label === lbl ? "var(--ink)" : "var(--border)"
                                                            }}
                                                        >
                                                            {lbl}
                                                        </button>
                                                    ))}
                                                    {address.label === "Custom" && (
                                                        <div style={{ width: "100%" }}>
                                                            <input 
                                                                className={`co-input ${formErrors.customLabel ? "error" : ""}`}
                                                                style={{ height: 32, marginTop: 4, fontSize: 11, letterSpacing: ".05em", borderColor: formErrors.customLabel ? "#ef4444" : "" }}
                                                                placeholder="ENTER CUSTOM LABEL" 
                                                                maxLength={20}
                                                                value={customLabel} 
                                                                onChange={(e) => {
                                                                    setCustomLabel(e.target.value.toUpperCase());
                                                                    if (formErrors.customLabel) setFormErrors(prev => {
                                                                        const n = {...prev}; delete n.customLabel; return n;
                                                                    });
                                                                }} 
                                                            />
                                                            {formErrors.customLabel && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.customLabel}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="co-label">First Name</label>
                                                    <input className={`co-input ${formErrors.firstName ? "error" : ""}`} style={{ borderColor: formErrors.firstName ? "#ef4444" : "" }} placeholder="First name" maxLength={50} value={address.firstName} onChange={(e) => updateAddress("firstName", e.target.value)} />
                                                    {formErrors.firstName && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.firstName}</p>}
                                                </div>
                                                <div>
                                                    <label className="co-label">Last Name</label>
                                                    <input className={`co-input ${formErrors.lastName ? "error" : ""}`} style={{ borderColor: formErrors.lastName ? "#ef4444" : "" }} placeholder="Last name" maxLength={50} value={address.lastName} onChange={(e) => updateAddress("lastName", e.target.value)} />
                                                    {formErrors.lastName && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.lastName}</p>}
                                                </div>
                                                <div>
                                                    <label className="co-label">Phone Number</label>
                                                    <input className="co-input" style={{ borderColor: formErrors.phone ? "#ef4444" : "" }} placeholder="10-digit mobile" type="tel" maxLength={10} value={address.phone} onChange={(e) => updateAddress("phone", e.target.value.replace(/\D/g, ''))} />
                                                    {formErrors.phone && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.phone}</p>}
                                                </div>
                                                {!isAuthenticated && (
                                                    <div>
                                                        <label className="co-label">Email Address</label>
                                                        <input className="co-input" type="email" placeholder="you@example.com" value={address.email} onChange={(e) => updateAddress("email", e.target.value)} />
                                                    </div>
                                                )}
                                                <div style={{ gridColumn: "1 / -1" }}>
                                                    <label className="co-label">Street Address / House No.</label>
                                                    <input className="co-input" style={{ borderColor: formErrors.street ? "#ef4444" : "" }} placeholder="House No, Floor, Street, Area" maxLength={100} value={address.street} onChange={(e) => updateAddress("street", e.target.value)} />
                                                    {formErrors.street && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.street}</p>}
                                                </div>
                                                <div>
                                                    <label className="co-label">PIN Code</label>
                                                    <input className="co-input" style={{ borderColor: formErrors.zipCode ? "#ef4444" : "" }} placeholder="6-digit PIN" maxLength={6} value={address.zipCode} onChange={(e) => updateAddress("zipCode", e.target.value.replace(/\D/g, ''))} />
                                                    {formErrors.zipCode && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.zipCode}</p>}
                                                </div>
                                                <div>
                                                    <label className="co-label">City</label>
                                                    <input className="co-input" style={{ borderColor: formErrors.city ? "#ef4444" : "" }} placeholder="Detecting..." maxLength={50} value={address.city} onChange={(e) => updateAddress("city", e.target.value)} />
                                                    {formErrors.city && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.city}</p>}
                                                </div>
                                                <div style={{ gridColumn: "1 / -1" }}>
                                                    <label className="co-label">State</label>
                                                    <input className="co-input" style={{ borderColor: formErrors.state ? "#ef4444" : "" }} placeholder="Detecting..." maxLength={50} value={address.state} onChange={(e) => updateAddress("state", e.target.value)} />
                                                    {formErrors.state && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 500 }}>{formErrors.state}</p>}
                                                </div>
                                                
                                                <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                                                    <button 
                                                        className="co-btn" 
                                                        style={{ width: "100%", justifyContent: "center" }}
                                                        onClick={saveNewAddressProfile}
                                                        disabled={isSavingAddress}
                                                    >
                                                        {isSavingAddress ? "Saving..." : editingAddressId ? "Apply Update" : "Save to Address Book"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="co-nav">
                                        <span style={{ fontSize: 12, fontWeight: 300, color: "var(--mid)" }}>
                                            {items.length} item{items.length !== 1 ? "s" : ""} &nbsp;·&nbsp; ₹{total.toFixed(2)}
                                        </span>
                                        <button className="co-btn" onClick={handleNext}>
                                            Continue <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 2 ── PAYMENT ══ */}
                            {currentStep === 2 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                                    <div>
                                        <span className="co-step-eyebrow">Step 2 of 3</span>
                                        <h2 className="co-step-title">Payment</h2>
                                        <p className="co-step-desc">You&apos;ll be redirected to Razorpay&apos;s secure gateway to complete payment.</p>
                                    </div>

                                    <div className="co-pay-card">
                                        <div className="co-pay-icon">
                                            <Lock size={24} />
                                        </div>
                                        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 10 }}>
                                            Razorpay Secure Payment
                                        </h3>
                                        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--mid)", maxWidth: 380, lineHeight: 1.7, marginBottom: 24 }}>
                                            All major Indian payment methods supported — UPI, cards, net banking, and wallets. Fully encrypted.
                                        </p>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                                            {["UPI", "Cards", "Net Banking", "Wallets"].map((m) => (
                                                <span key={m} className="co-pay-badge">{m}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="co-nav">
                                        <button className="co-btn-ghost" onClick={handleBack}>← Back</button>
                                        <button className="co-btn" onClick={handleNext}>
                                            Review Order <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 3 ── REVIEW ══ */}
                            {currentStep === 3 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                                    <div>
                                        <span className="co-step-eyebrow">Step 3 of 3</span>
                                        <h2 className="co-step-title">Review Order</h2>
                                        <p className="co-step-desc">Confirm your items and apply any discount codes before placing your order.</p>
                                    </div>

                                    <div className="co-card">
                                        {/* Item list */}
                                        <div>
                                            {items.map((item) => (
                                                <div key={item.id} className="co-item-row">
                                                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                                                        <div style={{ position: "relative", width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0, background: "var(--paper)" }}>
                                                            <Image src={item.image ?? ""} alt={item.title} fill unoptimized style={{ objectFit: "cover" }} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                                                            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--mid)" }}>Qty {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                                                        ₹{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Coupon zone */}
                                        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--paper)" }}>
                                            <label className="co-label" style={{ marginBottom: 10 }}>Coupon / Referral Code</label>
                                            {appliedCoupon ? (
                                                <div className="co-coupon-tag">
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <Tag size={13} style={{ color: "#3d5200", flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase" }}>{appliedCoupon.code}</p>
                                                            <p style={{ fontSize: 10, fontWeight: 300, color: "var(--mid)", marginTop: 1 }}>Discount applied</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "#3d5200" }}>
                                                            -₹{appliedCoupon.discountAmount.toFixed(2)}
                                                        </span>
                                                        <button
                                                            onClick={handleRemoveCoupon}
                                                            style={{ width: 28, height: 28, borderRadius: 5, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mid)" }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <input
                                                        className="co-input"
                                                        style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 500 }}
                                                        placeholder="Enter code"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                        onKeyDown={(e) => e.key === "Enter" && handleApplyCouponOrAffiliate()}
                                                    />
                                                    <button
                                                        className="co-btn-ghost"
                                                        onClick={handleApplyCouponOrAffiliate}
                                                        disabled={isApplyingCoupon || !couponCode.trim()}
                                                        style={{ flexShrink: 0 }}
                                                    >
                                                        {isApplyingCoupon ? "…" : "Apply"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Totals */}
                                        <div className="co-totals">
                                            <div className="co-totals-row" style={{ marginBottom: 10, opacity: .48 }}>
                                                <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase" }}>Subtotal</span>
                                                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>₹{total.toFixed(2)}</span>
                                            </div>
                                            {appliedCoupon && (
                                                <div className="co-totals-row" style={{ marginBottom: 10, color: "var(--accent)" }}>
                                                    <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase" }}>Discount</span>
                                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "16px 0" }} />
                                            <div className="co-totals-row" style={{ alignItems: "flex-end" }}>
                                                <div>
                                                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent)", display: "block", marginBottom: 4 }}>Total</span>
                                                    <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,.38)" }}>Including all taxes</span>
                                                </div>
                                                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
                                                    ₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="co-nav">
                                        <button className="co-btn-ghost" onClick={handleBack} disabled={isProcessing}>← Back</button>
                                        <button
                                            className="co-btn"
                                            onClick={handlePlaceOrder}
                                            disabled={isProcessing}
                                            style={{ minWidth: 172, justifyContent: "center" }}
                                        >
                                            {isProcessing ? "Processing…" : <><Zap size={14} /> Place Order</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 4 ── SUCCESS ══ */}
                            {currentStep === 4 && (
                                <div style={{ textAlign: "center", padding: "72px 32px" }}>
                                    <motion.div
                                        initial={{ scale: 0.55, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", damping: 14, stiffness: 120 }}
                                    >
                                        <div className="co-success-icon">
                                            <ShieldCheck size={32} />
                                        </div>
                                    </motion.div>

                                    <span className="co-eyebrow" style={{ color: "var(--mid)", display: "block", marginBottom: 10 }}>
                                        Order Confirmed
                                    </span>
                                    <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(44px,7vw,80px)", fontWeight: 900, textTransform: "uppercase", lineHeight: .9, marginBottom: 16 }}>
                                        Order Placed<br />
                                        <span style={{ color: "#16a34a" }}>Successfully.</span>
                                    </h2>
                                    <p style={{ fontSize: 15, fontWeight: 300, color: "var(--mid)", maxWidth: 380, margin: "0 auto 36px", lineHeight: 1.7 }}>
                                        Your order is confirmed and will be dispatched shortly. You&apos;ll receive an email with tracking details.
                                    </p>

                                    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                                        <Link href="/dashboard/orders">
                                            <button className="co-btn-ghost">View Orders</button>
                                        </Link>
                                        <Link href="/">
                                            <button className="co-btn">Continue Shopping</button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}