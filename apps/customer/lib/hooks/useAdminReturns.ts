import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface AdminReturnRequest {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    createdAt: string;
    user: { id: string, name: string, email: string };
    items: {
        id: string;
        quantity: number;
        product: { title: string };
    }[];
}

export function useAdminReturns() {
    return useQuery<AdminReturnRequest[]>({
        queryKey: ["admin", "returns"],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminReturnRequest[]>('/admin/returns');
            return data;
        }
    });
}

export function useProcessReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, adminNotes }: { id: string, status: string, adminNotes?: string }) => {
            const { data } = await apiClient.patch(`/admin/returns/${id}`, { status, adminNotes });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
            toast.success("RMA process successful.");
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to process RMA.");
        }
    });
}
