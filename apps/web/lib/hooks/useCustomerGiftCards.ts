import { apiClient } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface GiftCardBalance {
    id: string;
    code: string;
    initialBalance: number;
    currentBalance: number;
}

export function useBuyGiftCard() {
    return useMutation<{ id: string, code: string, balance: number }, Error, { amount: number }>({
        mutationFn: async ({ amount }) => {
            const { data } = await apiClient.post('/gift-cards/purchase', { amount });
            return data;
        },
        onSuccess: (data) => {
            toast.success(`Successfully activated a $${data.balance} Gift Card! Code: ${data.code}`, { duration: 6000 });
        },
        onError: () => {
            toast.error("Failed to generate gift card. Please try again.");
        }
    });
}
