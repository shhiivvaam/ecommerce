"use client";

import { VALUE_PROPS } from "@/constants/home";

export function ValueProps() {
    return (
        <section style={{ background: "var(--ink)", color: "#fff" }}>
            <div className="px-6 md:px-12 lg:px-20 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                    {VALUE_PROPS.map((item) => (
                        <div key={item.label} className="py-10 px-8 md:px-12">
                            <p className="font-display text-5xl font-black uppercase mb-1" style={{ color: "var(--accent)", lineHeight: 1 }}>
                                {item.stat}
                            </p>
                            <p className="font-display text-2xl font-bold uppercase mb-2" style={{ letterSpacing: ".02em" }}>
                                {item.label}
                            </p>
                            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, fontWeight: 300 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
