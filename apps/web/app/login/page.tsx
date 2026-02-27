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
import { ShieldCheck, Mail, Lock, ArrowRight, Zap, ChevronLeft } from "lucide-react";

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
    const login = useAuthStore(state => state.login);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const { data } = await api.post("/auth/login", values);
            login(data.user, data.access_token);
            toast.success("Signed in successfully.", { icon: '🛍️' });
            router.push("/");
        } catch (error) {
            console.error(error);
            const message = isAxiosError(error)
                ? error.response?.data?.message
                : undefined;
            toast.error(message || "We couldn’t sign you in. Please check your email and password.");
        }
    };

    return (
        <div className="min-h-screen bg-background transition-colors duration-500 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Visual Flux */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-card rounded-[40px] border border-border shadow-3xl overflow-hidden relative z-10 transition-colors">
                {/* Brand panel */}
                <div className="hidden lg:flex flex-col bg-black p-16 text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />

                    <div className="relative z-20">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 fill-current" />
                            </div>
                            <span className="text-xl font-semibold tracking-tight">
                                Nex<span className="text-primary">Cart</span>
                            </span>
                        </Link>
                    </div>

                    <div className="relative z-20 mt-auto space-y-8">
                        <div className="space-y-3">
                            <span className="text-xs font-medium tracking-wide text-primary uppercase">
                                Welcome back
                            </span>
                            <h2 className="text-4xl font-semibold tracking-tight leading-snug">
                                Sign in to NexCart
                            </h2>
                        </div>
                        <blockquote className="space-y-3 max-w-sm">
                            <p className="text-sm font-medium opacity-70 leading-relaxed border-l-4 border-primary/40 pl-6">
                                &quot;Checking out is fast, simple, and secure – my details are saved and I can reorder in a few clicks.&quot;
                            </p>
                            <footer className="text-xs font-semibold tracking-wide text-primary/80 uppercase">
                                — NexCart customer
                            </footer>
                        </blockquote>
                    </div>

                    <div className="absolute bottom-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                        <ShieldCheck className="h-64 w-64 rotate-12" />
                    </div>
                </div>

                {/* Authentication Panel */}
                <div className="p-10 lg:p-20 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-12"
                    >
                        <div className="space-y-3">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                                Sign in
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your details to access your account and continue shopping.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            {...register("email")}
                                            type="email"
                                            placeholder="you@example.com"
                                            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
                                        />
                                        {errors.email && (
                                            <p className="absolute -bottom-5 left-1 text-[11px] text-rose-500">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                            <Lock className="h-3 w-3" /> Password
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            {...register("password")}
                                            type="password"
                                            placeholder="••••••••"
                                            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
                                        />
                                        {errors.password && (
                                            <p className="absolute -bottom-5 left-1 text-[11px] text-rose-500">
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full h-11 rounded-full text-sm font-semibold gap-2 shadow-md transition-all active:scale-95 group relative overflow-hidden"
                            >
                                <span className="relative z-10">
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </span>
                                <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                                {isSubmitting && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                            </Button>
                        </form>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-900 transition-colors flex flex-col items-center gap-4">
                            <p className="text-xs text-muted-foreground">
                                New to NexCart?{" "}
                                <Link href="/register" className="text-primary font-medium hover:underline">
                                    Create an account
                                </Link>
                            </p>
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="h-3 w-3" /> Back to home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
