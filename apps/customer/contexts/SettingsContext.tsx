"use client";

import {
    createContext,
    useContext,
    type ReactNode,
} from "react";
import { useSettings } from "@/lib/hooks/useSettings";
import type { StoreSettings } from "@repo/types";

interface SettingsContextValue {
    settings: StoreSettings | undefined;
    isLoading: boolean;
    isError: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
    settings: undefined,
    isLoading: false,
    isError: false,
});

/**
 * SettingsProvider — wraps the app with store settings.
 * Must be used INSIDE QueryProvider (it relies on TanStack Query internally).
 *
 * Access anywhere with: const { settings } = useStoreSettings()
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
    const { data: settings, isLoading, isError } = useSettings();

    return (
        <SettingsContext.Provider value={{ settings, isLoading, isError }}>
            {children}
        </SettingsContext.Provider>
    );
}

/** Access store settings from any component without additional fetches */
export function useStoreSettings() {
    return useContext(SettingsContext);
}
