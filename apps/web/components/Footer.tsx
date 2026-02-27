"use client";

import Link from "next/link";
import { Github, Twitter, Instagram, ArrowUpRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) return null;

    return (
        <footer className="bg-white dark:bg-[#050505] border-t-2 border-slate-50 dark:border-slate-900 relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-8 pt-24 pb-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-24 mb-24">
                    {/* Brand Column */}
                    <div className="lg:col-span-5 space-y-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-12 w-12 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
                                <div className="h-6 w-6 border-2 border-white dark:border-black rounded-sm rotate-45" />
                            </div>
                            <span className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Nexus<span className="text-primary opacity-50 italic">OS</span></span>
                        </Link>
                        <p className="text-lg text-slate-400 font-medium max-w-sm italic leading-relaxed uppercase tracking-tighter">
                            A meticulously engineered ecosystem for the acquisition of high-fidelity lifestyle assets.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Github, Instagram].map((Icon, i) => (
                                <button key={i} className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all">
                                    <Icon className="h-5 w-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nav Columns */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Archives</h4>
                            <ul className="space-y-4">
                                {['All Products', 'Collections', 'New Arrivals', 'Sales'].map(item => (
                                    <li key={item}>
                                        <Link href="/products" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 group">
                                            {item} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Support</h4>
                            <ul className="space-y-4">
                                {['Help Center', 'Shipping', 'Returns', 'Contact'].map(item => (
                                    <li key={item}>
                                        <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors flex items-center gap-2 group">
                                            {item} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Legal</h4>
                            <ul className="space-y-4">
                                {['Privacy', 'Terms', 'Security', 'Cookie Policy'].map(item => (
                                    <li key={item}>
                                        <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors flex items-center gap-2 group">
                                            {item} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t-2 border-slate-50 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                        © 2026 NexusOS Digital Ecosystem. All Protocol Rights Reserved.
                    </p>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500/40" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">Ironclad Protocol</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary/40" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">Lightning Stream</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500/40" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">Global Node: US-EAST-1</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
