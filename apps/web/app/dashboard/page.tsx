"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Phone, User as UserIcon, AlertTriangle, Save, Trash2, Smartphone } from "lucide-react";

export default function DashboardOverviewPage() {
    const { user, updateUser, logout } = useAuthStore();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (user?.name) {
            const parts = user.name.split(" ");
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const newName = `${firstName} ${lastName}`.trim();
            await api.patch("/users/me", { name: newName });

            updateUser({ name: newName });
            toast.success("Identity records synchronized", { icon: '👤' });
        } catch (error) {
            console.error(error);
            toast.error("Protocol rejection: Update failure");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("CRITICAL PROTOCOL: Are you sure you want to purge this identity node? This action is irreversible.")) return;
        setIsDeleting(true);
        try {
            await api.delete("/users/me");
            toast.success("Identity purged");
            logout();
            router.push("/");
        } catch (error) {
            console.error(error);
            toast.error("Purge failure: Database rejection");
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-16 bg-white dark:bg-transparent transition-colors duration-500">
            <header className="space-y-6">
                <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Operational Profile</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black dark:text-white transition-colors">Identity <br />Management</h1>
                <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Configure your primary user parameters and security protocols.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                            <UserIcon className="h-3.5 w-3.5" /> Designated First Name
                        </label>
                        <Input
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            placeholder="e.g. MARCUS"
                            className="h-16 rounded-[24px] border-2 dark:border-slate-800 bg-white dark:bg-black font-bold px-8 focus-visible:ring-primary/20 text-black dark:text-white transition-colors uppercase tracking-widest text-xs"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                            <UserIcon className="h-3.5 w-3.5" /> Designated Last Name
                        </label>
                        <Input
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            placeholder="e.g. AURELIUS"
                            className="h-16 rounded-[24px] border-2 dark:border-slate-800 bg-white dark:bg-black font-bold px-8 focus-visible:ring-primary/20 text-black dark:text-white transition-colors uppercase tracking-widest text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> Protocol Email Hub
                        </label>
                        <div className="relative group">
                            <Input value={user?.email || ''} disabled className="h-16 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-bold px-8 opacity-60 dark:opacity-40 text-black dark:text-white transition-colors" />
                            <div className="absolute top-1/2 -translate-y-1/2 right-6">
                                <ShieldCheck className="h-6 w-6 text-emerald-500/30 dark:text-emerald-500/10" />
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest italic ml-2">Read-only field. Contact administration for modifications.</p>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 flex items-center gap-2">
                            <Smartphone className="h-3.5 w-3.5" /> Mobile Link Node
                        </label>
                        <Input disabled placeholder="TRANSMISSION LINK INACTIVE" className="h-16 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-black tracking-[0.2em] px-8 italic text-[10px] opacity-40 transition-colors" />
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest italic ml-2">Two-factor authentication module offline.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-3xl transition-all active:scale-95 group"
                    >
                        {isSaving ? "Synchronizing..." : "Initialize Identity Sync"}
                        <Save className="h-5 w-5 transition-transform group-hover:translate-y-[-2px]" />
                    </Button>
                </div>
            </form>

            <section className="pt-20 border-t-4 border-slate-50 dark:border-slate-900 mt-20 transition-colors">
                <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-[56px] border-4 border-rose-100/50 dark:border-rose-900/20 p-12 xl:p-16 space-y-10 relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <AlertTriangle className="h-64 w-64 rotate-12 text-rose-500" />
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4 text-rose-500 dark:text-rose-400">
                            <AlertTriangle className="h-6 w-6" />
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Danger Zone</h2>
                        </div>
                        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 max-w-2xl italic leading-relaxed">
                            Initializing the identity purge protocol will permanently eliminate your presence from the NexusOS database. All transactions, curations, and logistics history will be purged asynchronously. This action is irreversible.
                        </p>
                    </div>

                    <div className="relative z-10 pt-4">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-20 px-16 rounded-[30px] font-black uppercase tracking-widest text-[10px] gap-4 shadow-3xl shadow-rose-200 dark:shadow-rose-950/20 transition-all active:scale-95 group"
                        >
                            {isDeleting ? "Purging Node..." : "Establish Identity Purge"}
                            <Trash2 className="h-5 w-5 transition-transform group-hover:scale-110" />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
