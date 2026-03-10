"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function JoinCTA() {
    return (
        <section className="px-6 md:px-12 lg:px-20 py-24 lg:py-36" style={{ background: "var(--paper)" }}>
            <div className="max-w-4xl mx-auto text-center">
                <span className="tag tag-inv mb-6" style={{ display: "inline-block" }}>Membership</span>
                <h2
                    className="font-display uppercase mb-6"
                    style={{ fontSize: "clamp(44px, 8vw, 88px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.02em" }}
                >
                    Join the Movement
                </h2>
                <p style={{ color: "var(--mid)", fontSize: 18, fontWeight: 300, maxWidth: 480, margin: "0 auto 48px" }}>
                    Early access to drops. Exclusive perks. A community that moves.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/register">
                        <button className="btn-primary" style={{ fontSize: 14 }}>
                            Create Account – It&apos;s Free <ArrowRight size={15} />
                        </button>
                    </Link>
                    <Link href="/products">
                        <button className="btn-outline" style={{ fontSize: 14 }}>Shop as Guest</button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
