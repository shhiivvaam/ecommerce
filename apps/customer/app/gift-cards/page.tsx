"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { CreditCard, Gift, Loader2 } from "lucide-react";
import { useBuyGiftCard } from "@/lib/hooks/useCustomerGiftCards";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

const PREDEFINED_AMOUNTS = [10, 25, 50, 100, 250];

export default function BuyGiftCardPage() {
    const { isAuthenticated } = useAuthStore();
    const [selectedAmount, setSelectedAmount] = useState<number>(50);
    const buyMutation = useBuyGiftCard();

    const handlePurchase = () => {
        buyMutation.mutate({ amount: selectedAmount });
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="h-24 w-24 bg-card rounded-full flex items-center justify-center mb-6 border shadow-sm text-primary">
                    <Gift className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Digital Gift Cards</h1>
                <p className="text-muted-foreground mb-8 max-w-lg">
                    Give the perfect gift. Please sign in or create an account to purchase a digital gift card for you or a friend.
                </p>
                <Link href="/login?callbackUrl=/gift-cards">
                    <Button size="lg">Sign in to Purchase</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Digital Gift Cards</h1>
                <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                    The perfect present, delivered instantly. Generate a unique code to use across our entire catalog.
                </p>
            </div>

            <div className="bg-card border rounded-3xl p-8 md:p-12 md:pb-16 flex flex-col md:flex-row gap-12 items-center">

                {/* Visual Card */}
                <div className="w-full md:w-1/2 flex justify-center">
                    <div className="relative w-full max-w-sm aspect-[1.6/1] rounded-2xl bg-gradient-to-tr flex flex-col justify-between p-8 text-white shadow-xl overflow-hidden" style={{ background: 'linear-gradient(to top right, #111 0%, #333 100%)' }}>

                        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at center, white 0%, transparent 70%)' }} />

                        <div className="flex justify-between items-start relative z-10">
                            <span className="font-black uppercase tracking-widest text-sm opacity-80">Gift Card</span>
                            <Gift className="h-6 w-6 opacity-60" />
                        </div>

                        <div className="relative z-10">
                            <span className="text-md font-medium opacity-80 uppercase tracking-widest block mb-1">Value</span>
                            <span className="text-5xl font-black">₹{selectedAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Form Elements */}
                <div className="w-full md:w-1/2 space-y-10">
                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Amount</label>
                        <div className="grid grid-cols-3 gap-3">
                            {PREDEFINED_AMOUNTS.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setSelectedAmount(amount)}
                                    className={`h-14 rounded-lg border-2 font-bold transition-all ${selectedAmount === amount ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-foreground'}`}
                                >
                                    ₹{amount}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground font-medium">Total Cost:</span>
                            <span className="text-3xl font-bold">₹{selectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-16 text-lg"
                            onClick={handlePurchase}
                            disabled={buyMutation.isPending}
                        >
                            {buyMutation.isPending ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Card...</>
                            ) : (
                                <><CreditCard className="mr-2 h-5 w-5" /> Buy Gift Card</>
                            )}
                        </Button>
                        {buyMutation.isSuccess && (
                            <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900/50">
                                Success! Your code has been generated. Check the notification banner for your code!
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
