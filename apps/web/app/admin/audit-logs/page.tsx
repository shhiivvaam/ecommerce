"use client";

import { useAuditLogs } from "@/lib/hooks/useAuditLogs";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@repo/ui";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useAuditLogs(page, 20);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor system activity, administrative actions, and critical events.
                    </p>
                </div>
            </div>

            <div className="border rounded-md bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium w-48">Timestamp</th>
                            <th className="px-4 py-3 font-medium w-48">User</th>
                            <th className="px-4 py-3 font-medium">Action</th>
                            <th className="px-4 py-3 font-medium w-48">Entity</th>
                            <th className="px-4 py-3 font-medium">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                                    Failed to load audit logs.
                                </td>
                            </tr>
                        ) : (!data?.data || data.data.length === 0) ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No activity recorded yet.
                                </td>
                            </tr>
                        ) : (
                            data.data.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.user ? (
                                            <div>
                                                <p className="font-medium text-xs">{log.user.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">System</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs font-semibold">{log.entityType}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]" title={log.entityId}>
                                            {log.entityId}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-[10px] font-mono bg-muted/50 p-2 rounded whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                            Page {data.page} of {data.totalPages} ({data.total} total events)
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === data.totalPages}
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
