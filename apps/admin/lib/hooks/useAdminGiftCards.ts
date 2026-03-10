import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export interface GiftCard {
    id: string;
    code: string;
    initialBalance: number;
    currentBalance: number;
    expiresAt: string | null;
    createdAt: string;
}

export function useAdminGiftCards() {
    return useQuery<GiftCard[]>({
        queryKey: ["admin", "gift-cards"],
        queryFn: async () => {
            const { data } = await apiClient.get<GiftCard[]>('/admin/gift-cards');
            return data;
        }
    });
}
