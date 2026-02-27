"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Shield, ShieldOff, Search, RefreshCw, Users, UserCheck, UserX, Mail, X, MapPin, Calendar, ShoppingBag, Activity, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface User {
    id: string;
    name?: string;
    email: string;
    deletedAt?: string | null;
    createdAt: string;
    role: { name: string };
    _count: { orders: number };
    orders?: Order[];
    addresses?: Address[];
}

export default function AdminCustomersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const fetchUsers = async (q = "") => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`);
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch {
            toast.error("Failed to load user segment");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (userId: string) => {
        setIsFetchingDetail(true);
        try {
            const { data } = await api.get(`/users/${userId}`);
            setSelectedUser(data);
        } catch {
            toast.error("User metadata recovery failed");
        } finally {
            setIsFetchingDetail(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const handleToggleBlock = async (id: string, isBlocked: boolean) => {
        try {
            const { data } = await api.patch(`/users/${id}/block`);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, deletedAt: data.deletedAt } : u));
            if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, deletedAt: data.deletedAt });
            toast.success(`Access ${isBlocked ? "reinstated" : "revoked"} for user`);
        } catch {
            toast.error("Access modification failed");
        }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        try {
            const { data } = await api.patch(`/users/${id}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role: data.role } : u));
            if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, role: data.role });
            toast.success(`Privileges elevated to ${newRole}`);
        } catch {
            toast.error("Role reassignment rejected");
        }
    };

    const stats = {
        total: total,
        active: users.filter(u => !u.deletedAt).length,
        blocked: users.filter(u => !!u.deletedAt).length,
    };

    return (
        <div className="space-y-16 pb-20 relative min-h-screen bg-white dark:bg-transparent transition-colors duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-black/10 dark:bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Directory</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">Customer <br />Population</h2>
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500 italic max-w-xl">Govern registered nodes, access permissions, and behavioral data.</p>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => fetchUsers(search)} className="rounded-[20px] h-16 px-10 gap-3 border-4 border-slate-50 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Sync Directory
                    </Button>
                </div>
            </header>

            {/* Population Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Total Population", value: total, icon: Users, color: "bg-indigo-600 dark:bg-indigo-500" },
                    { label: "Verified Active", value: stats.active, icon: UserCheck, color: "bg-emerald-600 dark:bg-emerald-500" },
                    { label: "Revoked Access", value: stats.blocked, icon: UserX, color: "bg-rose-600 dark:bg-rose-500" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white dark:bg-[#0a0a0a] border-4 border-slate-50 dark:border-slate-800 rounded-[40px] p-10 flex items-center gap-8 shadow-sm transition-all hover:shadow-2xl"
                    >
                        <div className={`h-20 w-20 rounded-[28px] ${stat.color} text-white flex items-center justify-center shadow-2xl`}>
                            <stat.icon className="h-10 w-10" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] italic mb-1">{stat.label}</p>
                            <h4 className="text-5xl font-black tracking-tighter text-black dark:text-white">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border-4 border-slate-50 dark:border-slate-800 rounded-[56px] overflow-hidden shadow-2xl transition-colors">
                <div className="p-10 border-b-4 border-slate-50 dark:border-slate-900 flex flex-col md:flex-row gap-8 items-center justify-between bg-slate-50/30 dark:bg-white/5">
                    <form onSubmit={handleSearch} className="relative w-full md:max-w-xl group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 dark:text-slate-700 transition-colors group-focus-within:text-primary" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="QUERY IDENTIFIER SIGNATURE..."
                            className="pl-20 h-20 bg-white dark:bg-black rounded-[30px] border-4 dark:border-slate-800 text-xs font-black uppercase tracking-widest focus-visible:ring-primary/20 transition-all"
                        />
                    </form>
                    <div className="flex items-center gap-4 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Directory Node Stream
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/5 border-b-4 border-slate-50 dark:border-slate-900">
                                <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-left">Entity Profile</th>
                                <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-left">Access Layer</th>
                                <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-center">Engagement</th>
                                <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-center">Node Status</th>
                                <th className="h-20 px-10 font-black text-black dark:text-white uppercase text-[10px] tracking-[0.4em] text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-4 divide-slate-50 dark:divide-slate-900">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="p-10"><div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-[32px]" /></td>
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map(u => {
                                    const isBlocked = !!u.deletedAt;
                                    return (
                                        <motion.tr
                                            layout
                                            key={u.id}
                                            className={`group hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer ${isBlocked ? "opacity-60 grayscale" : ""}`}
                                            onClick={() => fetchUserDetail(u.id)}
                                        >
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-[24px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 font-black text-2xl border-2 border-slate-100 dark:border-slate-800 transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary/20 shadow-inner">
                                                        {(u.name?.[0] || u.email[0]).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-lg text-black dark:text-white leading-none uppercase tracking-tight">{u.name || "Anonymous Entity"}</p>
                                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 font-medium italic">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            <span className="text-xs uppercase tracking-tighter">{u.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10" onClick={e => e.stopPropagation()}>
                                                <div className="relative group/select">
                                                    <select
                                                        value={u.role?.name || "CUSTOMER"}
                                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                                        className="appearance-none text-[10px] font-black border-4 border-slate-50 dark:border-slate-800 rounded-2xl px-6 py-3 pr-12 bg-white dark:bg-black text-black dark:text-white cursor-pointer group-hover/select:border-primary/20 transition-all uppercase tracking-widest outline-none"
                                                    >
                                                        <option value="CUSTOMER">CUSTOMER</option>
                                                        <option value="ADMIN">ADMINISTRATOR</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-slate-700 pointer-events-none group-hover/select:text-primary" />
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <span className="text-2xl font-black text-black dark:text-white tabular-nums">{u._count?.orders || 0}</span>
                                                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-none italic">Sequences</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <span className={`inline-flex items-center rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm transition-colors ${isBlocked
                                                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/30"
                                                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30"
                                                    }`}>
                                                    {isBlocked ? "Restricted" : "Status: Active"}
                                                </span>
                                            </td>
                                            <td className="px-10 py-10 text-right" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-14 w-14 rounded-[20px] border-2 transition-all active:scale-95 ${isBlocked ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-100 dark:border-emerald-950/20" : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-100 dark:border-rose-950/20"}`}
                                                    onClick={() => handleToggleBlock(u.id, isBlocked)}
                                                >
                                                    {isBlocked ? <Shield className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-40 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-8">
                                            <div className="h-24 w-24 bg-slate-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-slate-100 dark:text-slate-900 border-2 border-slate-50 dark:border-slate-900">
                                                <Users className="h-12 w-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Population Zero</h4>
                                                <p className="text-sm font-medium text-slate-400 dark:text-slate-600 italic">No matches detected in the current query stream.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile Detail Slide-over */}
            <AnimatePresence>
                {(selectedUser || isFetchingDetail) && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 35, stiffness: 250 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border-l-4 border-slate-50 dark:border-slate-900 shadow-3xl z-[101] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-12 border-b-4 border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 relative transition-colors">
                                <div className="flex items-center gap-8">
                                    <div className="h-24 w-24 rounded-[32px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-4xl font-black shadow-2xl transition-all">
                                        {(selectedUser?.name?.[0] || selectedUser?.email?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">{selectedUser?.name || "Anonymous Entity"}</h3>
                                        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-bold italic">
                                            <Mail className="h-4 w-4" />
                                            <p className="text-sm uppercase tracking-tighter">{selectedUser?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="rounded-2xl h-14 w-14 border-4 border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X className="h-8 w-8 text-black dark:text-white" />
                                </Button>
                                {isFetchingDetail && (
                                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary/20 animate-pulse overflow-hidden">
                                        <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full origin-left" />
                                    </div>
                                )}
                            </div>

                            {/* Scrollable Content */}
                            {selectedUser && (
                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar transition-colors">
                                    {/* Action Bar */}
                                    <div className="flex flex-wrap gap-6">
                                        <div className="flex-1 min-w-[240px] bg-slate-50 dark:bg-white/5 border-4 border-slate-100 dark:border-slate-900 rounded-[32px] p-6 flex items-center justify-between transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 italic">Access Mode</span>
                                            <Button
                                                onClick={() => handleToggleBlock(selectedUser.id, !!selectedUser.deletedAt)}
                                                className={`h-12 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${selectedUser.deletedAt ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
                                            >
                                                {selectedUser.deletedAt ? "Reinstate Node" : "Restrict Access"}
                                            </Button>
                                        </div>
                                        <div className="flex-1 min-w-[240px] bg-slate-50 dark:bg-white/5 border-4 border-slate-100 dark:border-slate-900 rounded-[32px] p-6 flex items-center justify-between transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 italic">Role Allocation</span>
                                            <select
                                                value={selectedUser.role?.name}
                                                onChange={e => handleRoleChange(selectedUser.id, e.target.value)}
                                                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-black dark:text-white cursor-pointer"
                                            >
                                                <option value="CUSTOMER">CUSTOMER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section: Metrics */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 border-4 border-slate-50 dark:border-slate-900 space-y-4 hover:border-primary/20 transition-all shadow-sm">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 flex items-center gap-3 italic">
                                                <ShoppingBag className="h-5 w-5" /> Revenue Contribution
                                            </h4>
                                            <div className="space-y-1">
                                                <span className="text-4xl font-black tracking-tighter text-black dark:text-white tabular-nums">${selectedUser.orders?.reduce((sum: number, o: Order) => sum + o.totalAmount, 0).toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 border-4 border-slate-50 dark:border-slate-900 space-y-4 hover:border-primary/20 transition-all shadow-sm">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 flex items-center gap-3 italic">
                                                <Calendar className="h-5 w-5" /> Node Seniority
                                            </h4>
                                            <p className="text-4xl font-black tracking-tighter text-black dark:text-white tabular-nums">
                                                {Math.floor((new Date().getTime() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} DAYS
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section: Transaction Feed */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-4">
                                            <Activity className="h-5 w-5 text-primary" />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 italic">Latest Acquisitions</h4>
                                        </div>
                                        <div className="bg-white dark:bg-[#050505] border-4 border-slate-50 dark:border-slate-900 rounded-[40px] overflow-hidden transition-colors shadow-inner">
                                            {selectedUser.orders && selectedUser.orders.length > 0 ? (
                                                <div className="divide-y-4 divide-slate-50 dark:divide-slate-900">
                                                    {selectedUser.orders.map((order: Order) => (
                                                        <div key={order.id} className="p-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                            <div className="space-y-1">
                                                                <p className="font-black text-base uppercase text-black dark:text-white tracking-widest group-hover:text-primary transition-colors">#{(order.id || "").slice(-8).toUpperCase()}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase italic">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <p className="font-black text-xl text-black dark:text-white tabular-nums">${order.totalAmount.toFixed(2)}</p>
                                                                <span className="inline-block px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">{order.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-20 text-center space-y-4">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200 dark:text-slate-800 italic">No Sequences Detected.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section: Static Nodes (Addresses) */}
                                    <div className="space-y-8 pb-10">
                                        <div className="flex items-center gap-4 px-4">
                                            <MapPin className="h-5 w-5 text-indigo-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700 italic">Registered Nodes</h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            {selectedUser.addresses && selectedUser.addresses.length > 0 ? selectedUser.addresses.map((addr: Address) => (
                                                <div key={addr.id} className="p-8 bg-slate-50 dark:bg-white/5 border-4 border-slate-100 dark:border-slate-900 rounded-[32px] flex items-start gap-6 hover:shadow-xl transition-all group">
                                                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-black border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-inner group-hover:text-indigo-500 transition-colors">
                                                        <MapPin className="h-6 w-6" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-black uppercase tracking-widest leading-none text-black dark:text-white">{addr.street}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter italic">{addr.city}, {addr.state} {addr.zipCode}</p>
                                                        <div className="pt-2">
                                                            <span className="text-[9px] font-black bg-white dark:bg-black px-3 py-1 rounded-full text-slate-300 dark:text-slate-800 uppercase tracking-[0.3em] border-2 border-slate-100 dark:border-slate-900">{addr.country}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-20 bg-slate-50/50 dark:bg-white/5 border-4 border-dashed border-slate-100 dark:border-slate-900 rounded-[40px] text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200 dark:text-slate-800 italic">No physical manifests linked.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="p-12 border-t-4 border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-[#050505] flex justify-end transition-colors">
                                <Button variant="outline" className="h-20 px-16 rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] border-4 border-slate-100 dark:border-slate-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95" onClick={() => setSelectedUser(null)}>
                                    Exit Profile Protocol
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
