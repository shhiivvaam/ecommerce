"use client";

import { useAdminGiftCards } from "@/lib/hooks/useAdminGiftCards";
import { format } from "date-fns";

export default function AdminGiftCardsPage() {
    const { data: cards, isLoading, error } = useAdminGiftCards();

    if (isLoading) {
        return <div className="p-8 animate-pulse text-muted-foreground">Loading generated gift cards...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-8">Error loading gift cards: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gift Cards Registry</h1>
                <p className="text-muted-foreground mt-2">
                    Monitor all actively circulating gift cards and their remaining balances.
                </p>
            </div>

            <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium">Card Code</th>
                            <th className="px-4 py-3 font-medium">Initial Amount</th>
                            <th className="px-4 py-3 font-medium">Remaining Balance</th>
                            <th className="px-4 py-3 font-medium">Created On</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {cards?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No gift cards have been generated yet.
                                </td>
                            </tr>
                        ) : (
                            cards?.map((card) => {
                                const isDepleted = card.currentBalance <= 0;
                                return (
                                    <tr key={card.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{card.code}</td>
                                        <td className="px-4 py-3">${card.initialBalance.toFixed(2)}</td>
                                        <td className="px-4 py-3 font-bold">${card.currentBalance.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(new Date(card.createdAt), "MMM d, yyyy")}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isDepleted ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    Depleted
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
