"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreSettings } from "@/contexts/SettingsContext";

/**
 * Redirects to single-product page if store is in SINGLE mode.
 * Uses the globally available SettingsContext — no additional fetch needed.
 */
export function StoreModeRedirect() {
    const router = useRouter();
    const { settings } = useStoreSettings();

    useEffect(() => {
        if (settings?.storeMode === "SINGLE") {
            // If the backend exposes a singleProductId in settings, redirect to it
            const sid = (settings as unknown as Record<string, string>).singleProductId;
            if (sid) {
                router.push(`/products/${sid}`);
            }
        }
    }, [settings, router]);

    return null;
}
