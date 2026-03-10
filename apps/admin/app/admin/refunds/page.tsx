"use client";

import { useAdminRefunds, useProcessRefund } from "@/lib/hooks/useAdminRefunds";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@repo/ui";
import { ChevronDown, RefreshCw, Banknote } from "lucide-react";
import { motion } from "framer-motion";


export default function AdminRefundsPage() {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, error, refetch } = useAdminRefunds(page, limit);
    const { mutate: updateStatus, isPending: isUpdating } = useProcessRefund();

    const refunds = data?.refunds ?? [];
    const total = data?.total ?? 0;

    const handleStatusChange = (refundId: string, status: "APPROVED" | "REJECTED" | "COMPLETED") => {
        updateStatus({ id: refundId, status });
    };

    if (error) {
        return <div className="text-red-500 p-8">Error loading refunds</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and process customer refund requests.
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
            </div>

            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                            <th className="px-6 py-4">Refund ID / Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Order / Reason</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                                    Loading refund requests...
                                </td>
                            </tr>
                        ) : refunds.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <Banknote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No refund requests found.</p>
                                </td>
                            </tr>
                        ) : (
                            refunds.map((refund, i) => (
                                <motion.tr key={refund.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-mono text-xs">{refund.id.split('-')[0].toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(refund.createdAt), "MMM d, yyyy")}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-sm">{refund.order?.user?.name || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">{refund.order?.user?.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-mono text-muted-foreground mb-1">Ord: {refund.orderId.split('-')[0].toUpperCase()}</p>
                                        <p className="text-sm">{refund.reason || <span className="italic text-muted-foreground">No reason provided</span>}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-bold text-lg text-foreground">${refund.amount.toFixed(2)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${refund.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            refund.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {refund.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block text-left">
                                            <select
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                value={refund.status}
                                                onChange={(e) => handleStatusChange(refund.id, e.target.value as "APPROVED" | "REJECTED" | "COMPLETED")}
                                            />
                                            <Button variant="outline" size="sm" className="gap-2 min-w-[120px] justify-between">
                                                Update <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                        {isUpdating && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="p-4 bg-muted rounded-xl shadow-lg animate-pulse text-sm font-medium">Updating Status...</div>
                            </div>
                        )}
                    </tbody>
                </table>

                {data && Math.ceil(total / limit) > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                            Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
