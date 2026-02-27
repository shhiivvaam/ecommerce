"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { isAxiosError } from "axios";
import { ShieldPlus, Mail, Lock, User as UserIcon, ArrowRight, Zap, ChevronLeft } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Designation requires at least 2 characters"),
    email: z.string().email("Invalid email address signature"),
    password: z.string().min(6, "Security protocol requires 6+ characters"),
});

export default function RegisterPage() {
    const login = useAuthStore(state => state.login);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const { data } = await api.post("/auth/register", values);
            login(data.user, data.access_token);
            toast.success("Entity initialized successfully. Access granted.", { icon: '🛡️' });
            router.push("/");
        } catch (error) {
            console.error(error);
            const message = isAxiosError(error)
                ? error.response?.data?.message
                : undefined;
            toast.error(message || "Initialization rejected. Identifier already exists in registry.");
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors duration-500 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Visual Flux */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0a0a0a] rounded-[60px] border-4 border-slate-50 dark:border-slate-900 shadow-3xl overflow-hidden relative z-10 transition-colors">

                {/* Brand Monolith */}
                <div className="hidden lg:flex flex-col bg-black p-16 text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-tl from-primary/20 via-transparent to-transparent opacity-50" />

                    <div className="relative z-20">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 fill-current" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-[0.3em]">NexusOS</span>
                        </Link>
                    </div>

                    <div className="relative z-20 mt-auto space-y-8">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Entity Initialization</span>
                            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Spawn into <br />Reality.</h2>
                        </div>
                        <blockquote className="space-y-4 max-w-sm">
                            <p className="text-lg font-medium italic opacity-60 leading-relaxed border-l-4 border-primary/30 pl-6">
                                &quot;Access to the world&apos;s most exclusive product archives begins here. NexusOS isn&apos;t just a platform; it&apos;s a technological advancement.&quot;
                            </p>
                            <footer className="text-xs font-black uppercase tracking-widest text-primary/80">— Unit Lead: ALEX_J</footer>
                        </blockquote>
                    </div>

                    <div className="absolute bottom-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                        <ShieldPlus className="h-64 w-64 rotate-12" />
                    </div>
                </div>

                {/* Registration Panel */}
                <div className="p-10 lg:p-20 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-10"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">
                                <span className="h-px w-6 bg-current" /> New Entity Protocol
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">Begin Initialization</h1>
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">Define your unique parameters for ecosystem inclusion.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> Designated Name
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...register("name")}
                                            type="text"
                                            placeholder="e.g. MARCUS AURELIUS"
                                            className="h-16 rounded-[24px] border-2 dark:border-slate-800 bg-white dark:bg-black font-bold px-8 focus-visible:ring-primary/20 text-black dark:text-white transition-colors uppercase tracking-widest text-xs"
                                        />
                                        {errors.name && <p className="absolute -bottom-5 left-4 text-[9px] font-black uppercase text-rose-500 tracking-widest">{errors.name.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Protocol Email Hub
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...register("email")}
                                            type="email"
                                            placeholder="ENTITY@NEXUS.SH"
                                            className="h-16 rounded-[24px] border-2 dark:border-slate-800 bg-white dark:bg-black font-bold px-8 focus-visible:ring-primary/20 text-black dark:text-white transition-colors uppercase tracking-widest text-xs"
                                        />
                                        {errors.email && <p className="absolute -bottom-5 left-4 text-[9px] font-black uppercase text-rose-500 tracking-widest">{errors.email.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                                        <Lock className="h-3 w-3" /> Security Protocol
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...register("password")}
                                            type="password"
                                            placeholder="••••••••"
                                            className="h-16 rounded-[24px] border-2 dark:border-slate-800 bg-white dark:bg-black font-bold px-8 focus-visible:ring-primary/20 text-black dark:text-white transition-colors"
                                        />
                                        {errors.password && <p className="absolute -bottom-5 left-4 text-[9px] font-black uppercase text-rose-500 tracking-widest">{errors.password.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <Button disabled={isSubmitting} type="submit" className="w-full h-20 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-3xl transition-all active:scale-95 group relative overflow-hidden mt-4">
                                <span className="relative z-10">{isSubmitting ? "Processing Entity..." : "Establish Entity"}</span>
                                <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-2" />
                                {isSubmitting && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                            </Button>
                        </form>

                        <div className="pt-8 border-t-2 border-slate-50 dark:border-slate-900 transition-colors flex flex-col items-center gap-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                                Existing identity node?{" "}
                                <Link href="/login" className="text-primary hover:underline underline-offset-8 decoration-2 italic">
                                    Re-sync Link
                                </Link>
                            </p>
                            <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 hover:text-black dark:hover:text-white transition-colors">
                                <ChevronLeft className="h-3 w-3" /> Escape to Core
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
