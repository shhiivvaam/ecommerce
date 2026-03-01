"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function StoreModeRedirect() {
    const router = useRouter();

    // Single-product store mode: redirect if the store is configured for one product
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/settings").catch(() => ({ data: null }));
                if (res.data?.storeMode === "single" && res.data?.singleProductId) {
                    router.push(`/products/${res.data.singleProductId}`);
                }
            } catch {
                // Silently ignore — settings are optional
            }
        };
        fetchSettings();
    }, [router]);

    return null;
}
