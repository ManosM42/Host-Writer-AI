import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { startCheckout } from "@/lib/stripe.functions";

type BillingMode = "monthly" | "annual";

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: null,
    annualSaving: null,
    monthlyOnly: false,
    description: "Always free",
    cta: "Get started",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      { label: "1 pack (preview only)", included: true },
      { label: "All 5 channels visible", included: true },
      { label: "Copy / download", included: false },
      { label: "Auto-post", included: false },
      { label: "PDF export", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 25,
    annualPrice: 20,
    annualTotal: 240,
    annualSaving: 60,
    monthlyOnly: false,
    description: null,
    cta: "Choose Starter",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      { label: "10 packs / month", included: true },
      { label: "Full copy & paste", included: true },
      { label: "PDF download", included: true },
      { label: "Auto-post IG + FB (7×/week)", included: true },
      { label: "Post scheduling", included: false },
      { label: "Multi-property", included: false },
      { label: "Analytics", included: false },
    ],
    sectionLabel: "Free, plus:",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 39,
    annualTotal: 468,
    annualSaving: 120,
    monthlyOnly: false,
    description: null,
    cta: "Choose Pro",
    ctaVariant: "gold" as const,
    highlighted: true,
    badge: "Most popular",
    features: [
      { label: "25 packs / month", included: true },
      { label: "Smart post scheduling", included: true },
      { label: "Up to 3 properties", included: true },
      { label: "Basic analytics", included: true },
      { label: "Priority AI (Claude Opus)", included: false },
      { label: "Brand voice memory", included: false },
      { label: "White-label PDF", included: false },
      { label: "Team seats", included: false },
    ],
    sectionLabel: "Starter, plus:",
  },
  {
    id: "max",
    name: "Max",
    monthlyPrice: 70,
    annualPrice: null,
    annualTotal: null,
    annualSaving: null,
    monthlyOnly: true,
    description: "Monthly only",
    cta: "Choose Max",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      { label: "Unlimited packs", included: true },
      { label: "Unlimited auto-posting", included: true },
      { label: "Priority AI — Claude Opus", included: true },
      { label: "Brand voice memory", included: true },
      { label: "Unlimited properties", included: true },
      { label: "Full analytics dashboard", included: true },
      { label: "White-label PDF", included: true },
      { label: "2 team seats", included: true },
      { label: "Priority support (24h)", included: true },
      { label: "Smart posting times", included: true },
    ],
    sectionLabel: "Pro, plus:",
  },
];

function FeatureItem({ label, included }: { label: string; included: boolean }) {
  return (
    <div className={`flex items-start gap-2 text-xs leading-relaxed ${included ? "text-foreground/90" : "text-muted-foreground"}`}>
      <div className={`mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center ${included ? "bg-gold" : "bg-border"}`}>
        {included ? (
          <Check className="size-2.5 text-background" strokeWidth={3} />
        ) : (
          <X className="size-2.5 text-muted-foreground" strokeWidth={2.5} />
        )}
      </div>
      {label}
    </div>
  );
}

function PriceDisplay({
  plan,
  mode,
}: {
  plan: (typeof plans)[0];
  mode: BillingMode;
}) {
  const isAnnual = mode === "annual" && !plan.monthlyOnly && plan.annualPrice !== null;
  const price = isAnnual ? plan.annualPrice! : plan.monthlyPrice;

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl">€{price}</span>
        <span className="text-xs text-muted-foreground">/month</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 min-h-[16px]">
        {plan.monthlyOnly
          ? "Monthly only"
          : isAnnual && plan.annualTotal
          ? `€${plan.annualTotal}/year — save €${plan.annualSaving}`
          : plan.description ?? "\u00A0"}
      </p>
    </div>
  );
}

export function PricingPage() {
  const [mode, setMode] = useState<BillingMode>("monthly");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto max-w-6xl px-5 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-widest text-gold mb-4">
            <Sparkles className="size-3" /> Pricing
          </div>
          <h1 className="font-display text-4xl sm:text-5xl mb-3">
            Simple, honest pricing.
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No hidden fees.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-surface border border-gold-soft rounded-full p-1 gap-1">
            <button
              onClick={() => setMode("monthly")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                mode === "monthly"
                  ? "gradient-gold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setMode("annual")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                mode === "annual"
                  ? "gradient-gold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual{" "}
              <span className="text-xs opacity-70">— save 20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl flex flex-col gap-5 p-5 relative ${
                plan.highlighted
                  ? "border-2 border-gold bg-surface"
                  : "border border-gold-soft bg-surface"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-gold text-background text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <p className="text-xs uppercase tracking-widest text-gold/80 font-medium">
                {plan.name}
              </p>

              {/* Price */}
              <PriceDisplay plan={plan} mode={mode} />

              {/* CTA */}
             {plan.id === "free" ? (
  <Link to="/auth">
    <Button variant="outline" className="w-full border-gold/40 text-foreground hover:bg-gold/10">
      {plan.cta}
    </Button>
  </Link>
) : plan.highlighted ? (
  <Button
    className="w-full gradient-gold text-background font-medium hover:opacity-90"
    onClick={() => startCheckout(plan.id, mode)}
  >
    {plan.cta}
  </Button>
) : (
  <Button
    variant="outline"
    className="w-full border-gold/40 text-foreground hover:bg-gold/10"
    onClick={() => startCheckout(plan.id, mode)}
  >
    {plan.cta}
  </Button>
)}

              {/* Divider */}
              <div className="border-t border-gold-soft" />

              {/* Features */}
              <div className="flex flex-col gap-2">
                {plan.sectionLabel && (
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {plan.sectionLabel}
                  </p>
                )}
                {plan.features.map((f) => (
                  <FeatureItem key={f.label} label={f.label} included={f.included} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          All plans include a 7-day money-back guarantee. No credit card required for free.
        </p>
      </div>
    </div>
  );
}