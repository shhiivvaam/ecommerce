"use client";

import { useAdminReturns, useProcessReturn } from "@/lib/hooks/useAdminReturns";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@repo/ui";

export default function AdminReturnsPage() {
    const { data: returns, isLoading, error } = useAdminReturns();
    const processMutation = useProcessReturn();
    const [actionNotes, setActionNotes] = useState<{ [key: string]: string }>({});

    if (isLoading) {
        return <div className="p-8 animate-pulse text-muted-foreground">Loading specific RMAs...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-8">Error locating RMAs: {error.message}</div>;
    }

    const handleAction = (id: string, status: "APPROVED" | "REJECTED") => {
        processMutation.mutate({ id, status, adminNotes: actionNotes[id] });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Return Merchandise Authorization (RMA)</h1>
                <p className="text-muted-foreground mt-2">
                    Review and process customer requests to return physical assets.
                </p>
            </div>

            <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium">RMA ID / Order</th>
                            <th className="px-4 py-3 font-medium">Customer</th>
                            <th className="px-4 py-3 font-medium">Reason & Items</th>
                            <th className="px-4 py-3 font-medium">Status & Date</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {(!returns || returns.length === 0) ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No active RMAs found in the registry.
                                </td>
                            </tr>
                        ) : (
                            returns.map((req) => (
                                <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <p className="font-mono text-xs">{req.id.split('-')[0]}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ord: {req.orderId.split('-')[0]}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium">{req.user?.name || "Unknown Entity"}</p>
                                        <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                                    </td>
                                    <td className="px-4 py-4 max-w-sm">
                                        <p className="font-medium mb-2 opacity-80 italic">&quot;{req.reason}&quot;</p>
                                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                                            {req.items.map(i => (
                                                <li key={i.id}>{i.quantity}x {i.product?.title || 'Unknown Asset'}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {req.status}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(req.createdAt), 'MMM d, yyyy')}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        {req.status === 'PENDING' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <input
                                                    placeholder="Internal resolution notes..."
                                                    className="text-xs p-2 rounded-md border w-full max-w-[200px]"
                                                    value={actionNotes[req.id] || ""}
                                                    onChange={e => setActionNotes({ ...actionNotes, [req.id]: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-bold text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleAction(req.id, "REJECTED")}>Reject</Button>
                                                    <Button size="sm" className="h-8 text-[10px] uppercase font-bold" onClick={() => handleAction(req.id, "APPROVED")}>Approve</Button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        {processMutation.isPending && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                <div className="p-4 bg-muted rounded-xl text-sm font-bold animate-pulse shadow-lg">Transmitting Update...</div>
                            </div>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
