"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, Star, ShieldCheck, Truck, ArrowLeft, Send, Heart } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { ProductCard } from "@/components/ProductCard";

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
            console.error("Failed to load reviews", err);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${params.id}`);
                setProduct({
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    discounted: data.discounted,
                    stock: data.stock,
                    image: data.gallery && data.gallery.length > 0 ? data.gallery[0] : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
                    category: data.category,
                    variants: data.variants ?? [],
                });

                // Fetch related products from same category
                if (data.category?.id) {
                    api.get(`/products?categoryId=${data.category.id}&limit=4`)
                        .then(({ data: related }) => {
                            setRelatedProducts(related.products.filter((p: RelatedProduct) => p.id !== data.id));
                        })
                        .catch(() => { });
                }
            } catch (err) {
                console.error("Failed to load product details", err);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

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
        toast.success("Added to cart!");
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) { toast.error("Please log in to use wishlist"); return; }
        if (!product) return;
        setWishlistLoading(true);
        try {
            if (wishlisted) {
                await api.delete(`/wishlist/${product.id}`);
                setWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                await api.post(`/wishlist/${product.id}`);
                setWishlisted(true);
                toast.success("Added to wishlist!");
            }
        } catch {
            toast.error("Failed to update wishlist");
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userRating === 0) { toast.error("Please select a rating"); return; }
        setIsSubmittingReview(true);
        try {
            await api.post(`/products/${params.id}/reviews`, { rating: userRating, comment: userComment });
            toast.success("Review submitted!");
            setUserRating(0);
            setUserComment("");
            await fetchReviews();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit review";
            toast.error(msg);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const hasReviewed = reviews.some(r => r.user.id === user?.id);
    const basePrice = product?.discounted ?? product?.price ?? 0;
    const displayPrice = basePrice + (selectedVariant?.priceDiff ?? 0);
    const originalPrice = product?.discounted ? product.price : undefined;
    const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);

    // Unique sizes and colors from variants
    const sizes = Array.from(new Set((product?.variants ?? []).map(v => v.size).filter((s): s is string => Boolean(s))));
    const colors = Array.from(new Set((product?.variants ?? []).map(v => v.color).filter((c): c is string => Boolean(c))));

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center text-xl text-muted-foreground animate-pulse">
                Loading product...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col justify-center items-center text-center">
                <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
                <p className="text-muted-foreground mb-8">The product you are looking for does not exist.</p>
                <Link href="/products"><Button>Browse All Products</Button></Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                    <Image src={product.image} alt={product.title} fill unoptimized className="object-cover" />
                </div>

                <div className="flex flex-col justify-center">
                    {product.category && (
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{product.category.name}</span>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{product.title}</h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-2xl font-bold">${displayPrice?.toFixed(2)}</span>
                        {originalPrice !== undefined && (
                            <span className="text-lg text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                        )}
                        {reviews.length > 0 && (
                            <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} fill={i <= Math.round(avgRating) ? "currentColor" : "none"} className="w-4 h-4" />
                                ))}
                                <span className="text-muted-foreground text-sm ml-2">({reviews.length})</span>
                            </div>
                        )}
                    </div>

                    <p className="mt-6 text-base text-muted-foreground leading-relaxed">{product.description}</p>

                    {/* Variant Pickers */}
                    {sizes.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-semibold mb-2">Size</p>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            const match = product.variants?.find(v => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
                                            setSelectedVariant(match ?? product.variants?.find(v => v.size === size) ?? null);
                                        }}
                                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${selectedVariant?.size === size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                                    >{size}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colors.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-semibold mb-2">Color</p>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            const match = product.variants?.find(v => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
                                            setSelectedVariant(match ?? product.variants?.find(v => v.color === color) ?? null);
                                        }}
                                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${selectedVariant?.color === color ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                                    >{color}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {effectiveStock === 0 ? (
                        <p className="mt-4 text-sm font-semibold text-destructive">Out of stock</p>
                    ) : (
                        <p className="mt-4 text-sm text-muted-foreground">{effectiveStock} in stock</p>
                    )}

                    <div className="mt-8 flex items-center gap-3">
                        <div className="flex items-center border rounded-md h-12">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-lg hover:bg-muted transition-colors rounded-l-md">-</button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))} className="px-4 text-lg hover:bg-muted transition-colors rounded-r-md">+</button>
                        </div>
                        <Button size="lg" className="h-12 flex-1 rounded-full shadow-lg" onClick={handleAddToCart} disabled={effectiveStock === 0}>
                            <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 w-12 rounded-full p-0 flex-shrink-0"
                            onClick={handleToggleWishlist}
                            disabled={wishlistLoading}
                            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <Heart className={`h-5 w-5 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </Button>
                    </div>

                    <div className="mt-12 space-y-4 border-t pt-8">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Truck className="h-5 w-5 text-primary" /> Free shipping on orders over $100
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <ShieldCheck className="h-5 w-5 text-primary" /> 1-year extended warranty included
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <section className="mt-20 border-t pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
                        {reviews.length > 0 && (
                            <p className="text-muted-foreground mt-1">{avgRating} out of 5 &bull; {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                        )}
                    </div>
                </div>

                {/* Submit Review Form */}
                {isAuthenticated && !hasReviewed && (
                    <div className="border rounded-xl p-6 bg-card mb-10">
                        <h3 className="font-semibold mb-4">Write a Review</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setUserRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-7 h-7 ${star <= userRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={userComment}
                                onChange={e => setUserComment(e.target.value)}
                                placeholder="Share your thoughts about this product (optional)"
                                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                            <Button type="submit" disabled={isSubmittingReview} className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                {isSubmittingReview ? "Submitting..." : "Submit Review"}
                            </Button>
                        </form>
                    </div>
                )}

                {reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No reviews yet</p>
                        <p className="text-sm mt-1">Be the first to review this product.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="border rounded-xl p-6 bg-card">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                                            {review.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{review.user.name || 'Anonymous'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`w-4 h-4 ${i <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                                        ))}
                                    </div>
                                </div>
                                {review.comment && <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {relatedProducts.length > 0 && (
                <section className="mt-20">
                    <h2 className="text-2xl font-bold tracking-tight mb-8">You may also like</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={{
                                    id: p.id,
                                    title: p.title,
                                    description: p.description,
                                    price: p.price,
                                    discounted: p.discounted,
                                    image: p.gallery?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
