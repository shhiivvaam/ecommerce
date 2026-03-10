"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";

export default function ProductsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Products error boundary caught:", error);
    }, [error]);

    return (
        <div
            className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 font-body"
            style={{ color: "var(--ink, #0a0a0a)" }}
        >
            <AlertTriangle size={40} style={{ color: "#c8ff00", strokeWidth: 1.5 }} />
            <div className="text-center max-w-md">
                <h2
                    className="font-display uppercase font-black mb-2"
                    style={{ fontSize: "clamp(24px, 4vw, 40px)" }}
                >
                    Failed to load products
                </h2>
                <p style={{ color: "var(--mid, #8a8a8a)", fontSize: 15, fontWeight: 300, lineHeight: 1.7 }}>
                    We couldn&apos;t load the product listings. Check your connection or try again.
                </p>
            </div>
            <div className="flex gap-3">
                <button onClick={reset} className="btn-primary" style={{ fontSize: 13 }}>
                    <RefreshCcw size={14} /> Try again
                </button>
                <Link href="/">
                    <button className="btn-outline" style={{ fontSize: 13 }}>
                        <ArrowLeft size={14} /> Go home
                    </button>
                </Link>
            </div>
        </div>
    );
}
