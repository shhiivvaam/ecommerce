import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
    createdAt: string;
    user?: { id: string; name: string; email: string };
}

export function useAuditLogs(page = 1, limit = 20) {
    return useQuery<{ data: AuditLog[]; total: number; page: number; totalPages: number }>({
        queryKey: ["admin", "audit-logs", page, limit],
        queryFn: async () => {
            const { data } = await apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
            return data;
        }
    });
}
