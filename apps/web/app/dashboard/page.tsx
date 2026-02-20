"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function DashboardOverviewPage() {
    const { user } = useAuthStore();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Personal Information</h1>
                <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
            </div>

            <form className="space-y-6 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">First Name</label>
                        <Input defaultValue={user?.name?.split(' ')[0] || ''} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Last Name</label>
                        <Input defaultValue={user?.name?.split(' ')[1] || ''} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <Input type="email" defaultValue={user?.email || ''} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">To change your email address, please contact support.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" />
                </div>

                <Button type="button">Save Changes</Button>
            </form>

            <div className="pt-6 border-t mt-10">
                <h2 className="text-xl font-bold text-destructive mb-4">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="destructive">Delete Account</Button>
            </div>
        </motion.div>
    );
}
