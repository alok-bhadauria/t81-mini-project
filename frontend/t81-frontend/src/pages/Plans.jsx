import { useState } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Check, Zap, Crown, Building2, Loader2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { api } from "../services/api";

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "forever",
        icon: Star,
        description: "Perfect for getting started and casual users.",
        features: [
            "5 Document Uploads",
            "Basic Text-to-ASL Translation",
            "Standard 3D Avatar Models",
            "Community Support"
        ],
        buttonText: "Switch to Free",
        popular: false
    },
    {
        id: "basic",
        name: "Basic",
        price: "$9",
        period: "per month",
        icon: Zap,
        description: "Great for students and regular learners.",
        features: [
            "50 Document Uploads",
            "Advanced Grammar Translation",
            "Custom Voice Models",
            "Priority Email Support"
        ],
        buttonText: "Upgrade to Basic",
        popular: false
    },
    {
        id: "premium",
        name: "Premium",
        price: "$29",
        period: "per month",
        icon: Crown,
        description: "Ideal for professionals and educators.",
        features: [
            "500 Document Uploads",
            "Real-time Speech Translation",
            "All Custom Avatars & Voices",
            "24/7 Priority Support",
            "Analytics Dashboard"
        ],
        buttonText: "Upgrade to Premium",
        popular: true
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "tailored pricing",
        icon: Building2,
        description: "For organizations and large-scale deployment.",
        features: [
            "Unlimited Document Uploads",
            "Custom 3D Avatar Creation",
            "API Access",
            "Dedicated Account Manager",
            "White-label Options"
        ],
        buttonText: "Contact Sales",
        popular: false
    }
];

export function Plans() {
    useDocumentTitle("Plans & Pricing");
    const { user, updateUserState } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(null);

    const handleUpgrade = async (planId) => {
        if (planId === "enterprise") {
            addToast({ title: "Enterprise Inquiry", description: "Our sales team will contact you shortly.", type: "info" });
            return;
        }

        if (user?.plan === planId) {
            addToast({ title: "Already Active", description: "You are already on this plan.", type: "info" });
            return;
        }

        setIsLoading(planId);
        try {
            const updatedData = await api.put("/auth/me", { plan: planId });
            updateUserState({ plan: planId });
            addToast({ title: "Plan Activated!", description: `Successfully upgraded to ${planId.toUpperCase()} plan.`, type: "success" });
        } catch (error) {
            addToast({ title: "Upgrade Failed", description: error.message || "Failed to update plan.", type: "error" });
        } finally {
            setIsLoading(null);
        }
    };

    const currentPlanId = user?.plan || "free";

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Simple, transparent pricing
                </h2>
                <p className="text-lg text-[var(--text-secondary)]">
                    Choose the perfect plan to accelerate your ASL translation workflow. Upgrade anytime.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = currentPlanId === plan.id;
                    const isProcessing = isLoading === plan.id;

                    return (
                        <Card 
                            key={plan.id} 
                            className={`relative flex flex-col p-8 transition-all duration-300 hover:shadow-xl ${
                                plan.popular ? 'border-2 border-[var(--primary)] shadow-lg shadow-orange-500/10 scale-105 z-10' : 'border-[var(--border-color)] hover:border-[var(--primary)]/50'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                    Most Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl ${plan.popular ? 'bg-orange-100 text-[var(--primary)] dark:bg-[var(--primary)]/20' : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)]'}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold text-[var(--text-primary)]">{plan.price}</span>
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">/{plan.period}</span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mt-3">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full p-0.5 shrink-0">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                variant={plan.popular ? "default" : isCurrentPlan ? "outline" : "secondary"}
                                className={`w-full py-6 rounded-xl font-bold text-md ${isCurrentPlan ? 'opacity-50 cursor-not-allowed border-green-500 text-green-500 bg-transparent hover:bg-transparent' : ''}`}
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={isCurrentPlan || isProcessing}
                            >
                                {isProcessing ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : isCurrentPlan ? (
                                    <span className="flex items-center gap-2"><Check size={18} /> Active Plan</span>
                                ) : (
                                    plan.buttonText
                                )}
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
