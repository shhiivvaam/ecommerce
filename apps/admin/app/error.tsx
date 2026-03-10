"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error boundary caught:", error);
    }, [error]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-6 font-body"
            style={{ background: "var(--paper, #f5f3ef)", color: "var(--ink, #0a0a0a)" }}
        >
            <AlertTriangle size={48} style={{ color: "#c8ff00", strokeWidth: 1.5 }} />
            <div className="text-center max-w-md">
                <h1
                    className="font-display uppercase font-black mb-3"
                    style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-.01em" }}
                >
                    Something went wrong
                </h1>
                <p style={{ color: "var(--mid, #8a8a8a)", fontSize: 16, fontWeight: 300, lineHeight: 1.7 }}>
                    We hit an unexpected error. Try refreshing the page — if the issue persists, please come back later.
                </p>
                {error.digest && (
                    <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                className="btn-primary"
                style={{ fontSize: 13 }}
            >
                <RefreshCcw size={14} />
                Try again
            </button>
        </div>
    );
}
