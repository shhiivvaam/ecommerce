"use client";

import { useAffiliate, useRegisterAffiliate } from "@/lib/hooks/useAffiliate";
import { Button } from "@repo/ui";
import { CopyIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function AffiliatePage() {
    const { data: affiliate, isLoading } = useAffiliate();
    const registerMutation = useRegisterAffiliate();

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Affiliate code copied to clipboard!");
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading affiliate details...</div>;
    }

    if (affiliate === undefined && !isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Affiliate Program</h2>
                    <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
                        Earn recurring commissions by referring customers to our platform.
                        Get a flat 5% cut of every order placed using your unique affiliate code!
                    </p>
                </div>

                <div className="border rounded-lg p-8 text-center bg-card">
                    <h3 className="text-lg font-semibold mb-2">You are not currently enrolled.</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Join our affiliate program today and start earning immediately.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => registerMutation.mutate()}
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? "Registering..." : "Join the Affiliate Program"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Affiliate Dashboard</h2>
                <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
                    Track your earnings and grab your shareable code here.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="border rounded-lg p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Earned</p>
                        <h3 className="text-3xl font-bold text-primary">
                            ${affiliate?.totalEarned.toFixed(2)}
                        </h3>
                    </div>
                </div>

                <div className="border rounded-lg p-6 bg-card shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Commission Rate</p>
                        <h3 className="text-3xl font-bold text-green-500">
                            {(affiliate?.commissionRate || 0.05) * 100}%
                        </h3>
                    </div>
                </div>

                <div className="border rounded-lg p-6 bg-card shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Your Referral Code</p>
                        <h3 className="text-2xl font-mono tracking-wider font-semibold text-foreground bg-secondary/50 p-2 rounded inline-block">
                            {affiliate?.code}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                        onClick={() => affiliate && handleCopy(affiliate.code)}
                    >
                        <CopyIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

        </div>
    );
}
