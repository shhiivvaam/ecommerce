"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, Star, ShieldCheck, Truck, ArrowLeft, Send, Heart, ChevronRight, Zap, Award, Info, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { ProductCard } from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";

interface Variant {
    id: string;
    size?: string;
    color?: string;
    sku?: string;
    stock: number;
    priceDiff: number;
}

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number;
    image: string;
    gallery: string[];
    stock: number;
    category?: { id: string; name: string; slug: string };
    variants?: Variant[];
}

interface RelatedProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    discounted?: number;
    gallery: string[];
}

interface Review {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: { id: string; name?: string; avatar?: string };
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    const addItem = useCartStore(state => state.addItem);
    const { isAuthenticated, user } = useAuthStore();
    const [quantity, setQuantity] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/products/${params.id}/reviews`);
            setReviews(data.reviews);
            setAvgRating(data.avgRating);
        } catch (err) {
            console.error("Reviews sync failure", err);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${params.id}`);
                setProduct({
                    ...data,
                    image: data.gallery && data.gallery.length > 0 ? data.gallery[0] : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
                    gallery: data.gallery || ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop"],
                });

                if (data.category?.id) {
                    api.get(`/products?categoryId=${data.category.id}&limit=5`)
                        .then(({ data: related }) => {
                            setRelatedProducts(related.products.filter((p: RelatedProduct) => p.id !== data.id).slice(0, 4));
                        })
                        .catch(() => { });
                }
            } catch (err) {
                console.error("Product core retrieval failure", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        fetchReviews();

        if (isAuthenticated) {
            api.get(`/wishlist/${params.id}/check`)
                .then(({ data }) => setWishlisted(data.inWishlist))
                .catch(() => { });
        }
    }, [params.id, isAuthenticated]);

    const handleAddToCart = () => {
        if (!product) return;
        const basePrice = product.discounted ?? product.price;
        const variantPrice = basePrice + (selectedVariant?.priceDiff ?? 0);
        addItem({
            productId: product.id,
            title: product.title + (selectedVariant ? ` (${[selectedVariant.size, selectedVariant.color].filter(Boolean).join(', ')})` : ''),
            price: variantPrice,
            quantity,
            image: product.image,
        });
        toast.success("Consignment staging successful", { icon: '🛍️' });
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) { toast.error("Authentication required for curation"); return; }
        if (!product) return;
        setWishlistLoading(true);
        try {
            if (wishlisted) {
                await api.delete(`/wishlist/${product.id}`);
                setWishlisted(false);
                toast.success("Curation entry removed");
            } else {
                await api.post(`/wishlist/${product.id}`);
                setWishlisted(true);
                toast.success("Asset saved to curation", { icon: '🤍' });
            }
        } catch {
            toast.error("Curation sync failed");
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userRating === 0) { toast.error("Rating magnitude undefined"); return; }
        setIsSubmittingReview(true);
        try {
            await api.post(`/products/${params.id}/reviews`, { rating: userRating, comment: userComment });
            toast.success("Social proof established");
            setUserRating(0);
            setUserComment("");
            await fetchReviews();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Protocol rejection");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const basePrice = product?.discounted ?? product?.price ?? 0;
    const displayPrice = basePrice + (selectedVariant?.priceDiff ?? 0);
    const originalPrice = product?.discounted ? product.price + (selectedVariant?.priceDiff ?? 0) : undefined;
    const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);

    const sizes = Array.from(new Set((product?.variants ?? []).map(v => v.size).filter((s): s is string => Boolean(s))));
    const colors = Array.from(new Set((product?.variants ?? []).map(v => v.color).filter((c): c is string => Boolean(c))));

    if (loading) {
        return (
            <div className="container mx-auto px-8 py-40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 animate-pulse">
                    <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 rounded-[40px]" />
                    <div className="space-y-10">
                        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
                        <div className="h-40 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
                        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-8 py-40 text-center space-y-8 bg-white dark:bg-[#050505] transition-colors">
                <h1 className="text-6xl font-black uppercase tracking-tighter text-black dark:text-white">Asset Lost.</h1>
                <p className="text-xl text-slate-400 font-medium italic">The requested item has been purged from our active directories.</p>
                <Link href="/products">
                    <Button size="lg" className="rounded-2xl px-12 h-16 font-black uppercase tracking-widest text-[10px] shadow-2xl">Return to Gallery</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#050505] min-h-screen pb-32 transition-colors duration-500">
            <div className="container mx-auto px-8 pt-12">
                {/* Unified Header / Breadcrumbs */}
                <div className="flex items-center justify-between mb-12">
                    <Link href="/products" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                        <div className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        Back to Archives
                    </Link>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">
                        Index <ChevronRight className="h-3 w-3" /> {product.category?.name} <ChevronRight className="h-3 w-3" /> <span className="text-black dark:text-white italic">{product.title}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
                    {/* Media Engine */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="relative aspect-[4/5] w-full bg-slate-50 dark:bg-slate-900 rounded-[48px] overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-2xl shadow-slate-200/50 dark:shadow-none transition-colors">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={product.gallery[activeImage]}
                                        alt={product.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            <div className="absolute top-8 left-8 flex flex-col gap-3">
                                {product.discounted && (
                                    <span className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Archive Sale -{Math.round((1 - (product.discounted / product.price)) * 100)}%</span>
                                )}
                                {product.stock < 5 && product.stock > 0 && (
                                    <span className="bg-rose-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Critical Inventory</span>
                                )}
                            </div>
                        </div>

                        {/* Gallery Thumbnails */}
                        {product.gallery.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {product.gallery.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative h-28 aspect-[4/5] rounded-[24px] overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-black dark:border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image src={img} alt={`${product.title} view ${idx}`} fill unoptimized className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Information Cockpit */}
                    <div className="lg:col-span-5 space-y-12 py-4">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-black/10 dark:bg-white/10" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{product.category?.name}</span>
                            </div>
                            <h1 className="text-5xl xl:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black dark:text-white uppercase">{product.title}</h1>

                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Standard Unit Price</span>
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-4xl font-black tracking-tighter text-black dark:text-white transition-colors">${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        {originalPrice && (
                                            <span className="text-lg text-slate-300 dark:text-slate-700 font-bold line-through italic decoration-primary/50">${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        )}
                                    </div>
                                </div>

                                {reviews.length > 0 && (
                                    <div className="pl-8 border-l-2 border-slate-100 dark:border-slate-800 transition-colors">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Consensus</span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex text-black dark:text-white">
                                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-current" : "opacity-10"}`} />)}
                                            </div>
                                            <span className="text-sm font-black italic text-black dark:text-white">({reviews.length})</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-slate-100/50 dark:border-slate-800/50 space-y-6 transition-colors">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-black dark:text-white opacity-50">
                                <Info className="h-3 w-3" /> Summary Protocol
                            </h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                                {product.description}
                            </p>
                        </div>

                        {/* Configuration Engine */}
                        <div className="space-y-12">
                            {sizes.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">Dimensions</label>
                                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase">Archive Chart</span>
                                    </div>
                                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => {
                                                    const match = product.variants?.find(v => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
                                                    setSelectedVariant(match ?? product.variants?.find(v => v.size === size) ?? null);
                                                }}
                                                className={`h-14 min-w-[80px] px-6 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${selectedVariant?.size === size ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-2xl shadow-black/20" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600"}`}
                                            >{size}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {colors.length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 px-1">Chromatic Selection</label>
                                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                                        {colors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    const match = product.variants?.find(v => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
                                                    setSelectedVariant(match ?? product.variants?.find(v => v.color === color) ?? null);
                                                }}
                                                className={`group flex items-center gap-3 pr-8 h-14 rounded-2xl border-2 transition-all active:scale-90 shrink-0 ${selectedVariant?.color === color ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-2xl" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600"}`}
                                            >
                                                <div className="h-10 w-10 m-1.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: color.toLowerCase() }} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{color}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6 pt-6">
                                <div className="flex items-center bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[30px] p-2 h-20 w-full md:w-auto transition-colors">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-16 w-16 flex items-center justify-center hover:bg-white dark:hover:bg-black rounded-full transition-colors text-black dark:text-white"><Minus className="h-5 w-5" /></button>
                                    <span className="w-16 text-center text-xl font-black tabular-nums text-black dark:text-white">{quantity}</span>
                                    <button onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))} className="h-16 w-16 flex items-center justify-center hover:bg-white dark:hover:bg-black rounded-full transition-colors text-black dark:text-white"><Plus className="h-5 w-5" /></button>
                                </div>
                                <Button
                                    size="lg"
                                    className="h-20 flex-1 rounded-[30px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] font-black uppercase tracking-widest text-[10px] gap-4 group active:scale-95 transition-all"
                                    onClick={handleAddToCart}
                                    disabled={effectiveStock === 0}
                                >
                                    {effectiveStock === 0 ? "Purged from Archives" : "Initialize Acquisition"}
                                    <ShoppingCart className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className={`h-20 w-20 rounded-[30px] border-4 p-0 flex-shrink-0 transition-all active:scale-90 ${wishlisted ? 'bg-rose-50 dark:bg-rose-950 border-rose-100 dark:border-rose-900 text-rose-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-rose-500 hover:text-rose-500'}`}
                                    onClick={handleToggleWishlist}
                                    disabled={wishlistLoading}
                                >
                                    <Heart className={`h-6 w-6 ${wishlisted ? "fill-current" : ""}`} />
                                </Button>
                            </div>

                            <div className="pt-12 border-t-2 border-slate-50 dark:border-slate-900 grid grid-cols-2 gap-10 transition-colors">
                                <div className="space-y-4">
                                    <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-500"><Truck className="h-7 w-7" /></div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black dark:text-white">Global Flow</h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase leading-tight italic tracking-tighter">Complimentary transit for acquisitions exceeding 100.00 Credits.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-500"><ShieldCheck className="h-7 w-7" /></div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black dark:text-white">Ironclad Protection</h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase leading-tight italic tracking-tighter">365-day extended validation and hardware protection cycles included.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <section className="mt-52 max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Social Proof Protocol</span>
                            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">User <br />Consensus</h2>
                        </div>
                        {reviews.length > 0 && (
                            <div className="flex gap-16 pr-4">
                                <div className="text-center">
                                    <div className="text-6xl font-black text-black dark:text-white">{avgRating}</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 mt-3 italic">Aggregate Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-6xl font-black text-black dark:text-white">{reviews.length}</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 mt-3 italic">Verified Logs</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-8 space-y-10">
                            {reviews.length === 0 ? (
                                <div className="py-32 text-center border-4 border-dashed rounded-[56px] border-slate-100 dark:border-slate-800 transition-colors">
                                    <Award className="h-24 w-24 mx-auto text-slate-100 dark:text-slate-900 mb-8" />
                                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-200 dark:text-slate-800">Manifest Empty</h3>
                                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] mt-3 italic">No field reports submitted yet.</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        key={review.id}
                                        className="p-12 bg-slate-50 dark:bg-slate-900/40 rounded-[48px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-12 transition-colors relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                                            <Award className="h-32 w-32" />
                                        </div>
                                        <div className="flex flex-col items-center gap-6 shrink-0 relative z-10">
                                            <div className="h-24 w-24 rounded-[32px] bg-white dark:bg-black border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-3xl shadow-sm italic text-black dark:text-white transition-colors">
                                                {review.user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black dark:text-white">{review.user.name || 'Anonymous'}</p>
                                                <p className="text-[9px] text-slate-300 dark:text-slate-700 font-bold uppercase mt-2 tracking-widest">Verified User</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-8 relative z-10">
                                            <div className="flex justify-between items-center">
                                                <div className="flex text-black dark:text-white">
                                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-5 w-5 ${i <= review.rating ? "fill-current" : "opacity-10"}`} />)}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">"{review.comment}"</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="lg:col-span-4">
                            {isAuthenticated && !reviews.some(r => r.user.id === user?.id) ? (
                                <div className="sticky top-24 p-12 bg-black dark:bg-slate-900 text-white rounded-[56px] shadow-3xl space-y-10 border border-white/5">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter">Submit Log</h3>
                                        <p className="text-[10px] text-white/30 dark:text-white/20 font-bold uppercase tracking-[0.4em] italic">Asset Contribution Protocol</p>
                                    </div>
                                    <form onSubmit={handleSubmitReview} className="space-y-10">
                                        <div className="flex justify-between px-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setUserRating(star)}
                                                    className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all border-2 active:scale-90 ${star <= userRating ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/30"}`}
                                                >
                                                    <Star className={`w-6 h-6 ${star <= userRating ? "fill-current" : ""}`} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={userComment}
                                            onChange={e => setUserComment(e.target.value)}
                                            placeholder="Transmit your conclusions..."
                                            className="w-full min-h-[200px] bg-white/5 border-2 border-white/10 rounded-[32px] p-8 text-sm font-medium focus:outline-none focus:border-white/20 transition-all resize-none italic text-white placeholder:text-white/20"
                                        />
                                        <Button type="submit" disabled={isSubmittingReview} className="w-full h-20 bg-white text-black hover:bg-slate-100 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-2xl transition-all active:scale-95">
                                            {isSubmittingReview ? "Transmitting..." : "Initialize Transmission"} <Send className="h-5 w-5" />
                                        </Button>
                                    </form>
                                </div>
                            ) : !isAuthenticated && (
                                <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[56px] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-8 transition-colors">
                                    <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm"><Zap className="h-10 w-10" /></div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black uppercase tracking-widest text-black dark:text-white leading-tight">Authentication <br />Required</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold leading-relaxed italic uppercase tracking-[0.2em] px-4">Log in to contribute to the social proof manifest.</p>
                                    </div>
                                    <Link href="/auth/login" className="w-full">
                                        <Button variant="outline" className="w-full h-18 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-4 dark:bg-slate-800 dark:border-slate-700 active:scale-95 transition-all">Initialize Login</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Related Assets */}
                {relatedProducts.length > 0 && (
                    <section className="mt-52">
                        <div className="flex justify-between items-end mb-20 px-4">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Temporal Associations</span>
                                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black dark:text-white uppercase">Similar <br />Architecture</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
                            {relatedProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={{
                                        id: p.id,
                                        title: p.title,
                                        description: p.description,
                                        price: p.price,
                                        discounted: p.discounted,
                                        image: p.gallery?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
