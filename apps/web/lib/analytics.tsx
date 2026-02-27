"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type EventType = 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'SEARCH' | 'CHECKOUT_START' | 'PURCHASE';

interface AnalyticsEvent {
    type: EventType;
    path: string;
    metadata?: Record<string, any>;
    timestamp: string;
}

class AnalyticsEngine {
    private static instance: AnalyticsEngine;
    private queue: AnalyticsEvent[] = [];
    private isProcessing = false;

    private constructor() { }

    public static getInstance(): AnalyticsEngine {
        if (!AnalyticsEngine.instance) {
            AnalyticsEngine.instance = new AnalyticsEngine();
        }
        return AnalyticsEngine.instance;
    }

    public track(type: EventType, metadata?: Record<string, any>) {
        const event: AnalyticsEvent = {
            type,
            path: window.location.pathname,
            metadata,
            timestamp: new Date().toISOString()
        };

        console.log(`[Intelligence Stream] ${type}:`, event);
        this.queue.push(event);
        this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        const events = [...this.queue];
        this.queue = [];

        try {
            // In a production environment, this would hit /api/analytics/batch
            // For now, we simulate the transmission
            await api.post('/analytics/events', { events }).catch(() => { });
        } catch (err) {
            console.error("Intelligence stream transmission failure", err);
        } finally {
            this.isProcessing = false;
        }
    }
}

export const analytics = AnalyticsEngine.getInstance();

export function AnalyticsProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        analytics.track('PAGE_VIEW', {
            url: pathname,
            query: searchParams.toString()
        });
    }, [pathname, searchParams]);

    return null;
}
