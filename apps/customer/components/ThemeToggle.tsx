"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return (
        <div className="h-10 w-10 rounded-xl bg-slate-50 border-2 border-slate-100" />
    );

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center group overflow-hidden transition-all active:scale-90"
        >
            <AnimatePresence mode="wait">
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        className="text-amber-400"
                    >
                        <Moon className="h-4 w-4 fill-current" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        className="text-slate-400"
                    >
                        <Sun className="h-4 w-4" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}
