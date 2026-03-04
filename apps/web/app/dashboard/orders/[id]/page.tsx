"use client";

import { useOrderDetails, useInitiateReturn } from "@/lib/hooks/useOrderReturns";
import { format } from "date-fns";
import { Button } from "@repo/ui";
import { ArrowLeft, Package, Clock, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: order, isLoading, error } = useOrderDetails(id);
    const returnMutation = useInitiateReturn();
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState("");

    if (isLoading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading specific order manifesto...</div>;
    }

    if (error || !order) {
        return <div className="p-8 text-center text-red-500">Failed to retrieve order locus.</div>;
    }

    // Safely parse items
    const renderItems = () => {
        if (!order.items || !Array.isArray(order.items)) return null;
        return order.items.map((item: { id: string, productId: string, product?: { title: string }, quantity: number, price: number }) => (
            <div key={item.id} className="flex gap-6 py-6 border-b border-border/50 items-center">
                <div className="relative h-20 w-20 bg-muted rounded-xl overflow-hidden shrink-0">
                    {/* Placeholder for real product image if available, fallback to grey box */}
                </div>
                <div className="flex-1 space-y-1">
                    <p className="font-bold uppercase tracking-tight">{item.product?.title || `Product Locus: ${item.productId}`}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold tabular-nums">${item.price.toFixed(2)}</p>
                </div>
            </div>
        ));
    };

    const isShipped = order.status === "SHIPPED" || order.status === "DELIVERED";
    const hasActiveReturn = order.returns && order.returns.length > 0;

    const handleReturnSubmit = () => {
        if (!returnReason.trim()) return;
        returnMutation.mutate({
            orderId: order.id,
            reason: returnReason,
            items: order.items.map((i: { productId: string, variantId?: string, quantity: number }) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))
        }, {
            onSuccess: () => {
                setIsReturnModalOpen(false);
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <Link href="/dashboard/orders" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8">
                <ArrowLeft className="h-4 w-4" /> Operations History
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Manifest #{order.id.split('-')[0]}</h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Created on {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Tracking Banner if shipped */}
            {isShipped && order.trackingNumber && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-sm tracking-widest uppercase">Logistics Core Active</p>
                            <p className="text-sm font-medium text-muted-foreground">Carrier: {order.carrier}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Waybill Protocol</p>
                        <p className="font-mono font-bold tracking-widest">{order.trackingNumber}</p>
                    </div>
                </div>
            )}

            <div className="bg-card border rounded-3xl overflow-hidden">
                <div className="bg-muted/30 px-8 py-4 border-b">
                    <h3 className="text-xs font-black uppercase tracking-widest">Asset Details</h3>
                </div>
                <div className="px-8 flex flex-col">
                    {renderItems()}
                </div>
                <div className="px-8 py-6 bg-muted/10 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground uppercase tracking-widest font-bold text-xs">Gross Subtotal</span>
                        <span className="font-bold tabular-nums text-right">${order.total - order.tax - order.shipping}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground uppercase tracking-widest font-bold text-xs">Logistics Transit</span>
                        <span className="font-bold tabular-nums text-right">${order.shipping}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground uppercase tracking-widest font-bold text-xs">Regulatory Fees</span>
                        <span className="font-bold tabular-nums text-right">${order.tax}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <span className="font-black uppercase tracking-tighter text-lg">Final Liability</span>
                        <span className="font-black tabular-nums text-2xl text-primary">${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Logistics & RMA actions */}
            <div className="flex justify-end pt-8 gap-4">
                {isShipped && !hasActiveReturn && (
                    <Button
                        variant="outline"
                        className="h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-xs gap-3 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 border-border"
                        onClick={() => setIsReturnModalOpen(true)}
                    >
                        <RefreshCcw className="h-4 w-4" /> Request Asset Return
                    </Button>
                )}
                {hasActiveReturn && (
                    <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex items-center gap-3 text-yellow-800 dark:text-yellow-500 text-sm font-bold tracking-widest uppercase">
                        <AlertCircle className="h-5 w-5" /> Return Manifest Active
                    </div>
                )}
                <Button className="h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-xs gap-3">
                    <CheckCircle2 className="h-4 w-4" /> Acquire Support
                </Button>
            </div>

            {/* Return Modal Override */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[32px] border shadow-2xl p-8 space-y-6">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Initiate Asset Return</h3>
                            <p className="text-sm font-medium text-muted-foreground mt-2">To process your RMA, please describe the fault or conflict with the deployed assets.</p>
                        </div>

                        <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Please clearly describe why these items are malfunctioning or incompatible..."
                            className="w-full min-h-[120px] p-4 rounded-2xl border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y text-sm font-medium"
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setIsReturnModalOpen(false)} className="rounded-xl px-6 font-bold uppercase tracking-widest text-xs">Revert</Button>
                            <Button
                                onClick={handleReturnSubmit}
                                disabled={!returnReason.trim() || returnMutation.isPending}
                                className="rounded-xl px-8 font-bold uppercase tracking-widest text-xs bg-red-500 hover:bg-red-600 text-white"
                            >
                                {returnMutation.isPending ? "Transmitting..." : "Authorize RMA"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
