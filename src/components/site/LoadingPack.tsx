import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🏠", label: "Studying your business", detail: "Reading location, vibe & features" },
  { icon: "📋", label: "Crafting listing copy", detail: "Title, description, SEO meta & bullets" },
  { icon: "📱", label: "Writing social content", detail: "7 Instagram + 3 Facebook captions" },
  { icon: "🗺️", label: "Building GMB profile", detail: "Description, review replies & weekly posts" },
  { icon: "📧", label: "Composing email sequences", detail: "Welcome, review request & seasonal" },
  { icon: "📢", label: "Polishing ad copy", detail: "Google Ads, Meta ads & your tagline" },
];

const STEP_DURATION = 4200; // ms per step

export function LoadingPack() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => {
        const next = s < STEPS.length - 1 ? s + 1 : s;
        return next;
      });
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / STEP_DURATION) * 100, 98);
      setProgress(pct);
      if (pct < 98) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [currentStep]);

  const overallProgress = Math.round(
    ((currentStep / STEPS.length) * 100) + (progress / STEPS.length)
  );

  return (
    <div className="card-luxury rounded-2xl p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="relative size-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-gold/20" />
          <div className="absolute inset-0 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <div className="absolute inset-0 rounded-full border-2 border-gold/40 border-b-transparent animate-spin [animation-duration:3s] [animation-direction:reverse]" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {STEPS[currentStep].icon}
          </div>
        </div>
        <div>
          <h3 className="font-display text-2xl">Crafting your marketing pack</h3>
          <p className="text-sm text-muted-foreground mt-1">Powered by Gemini AI · Usually 15–30 seconds</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall progress</span>
          <span className="text-gold font-medium">{overallProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface border border-gold-soft overflow-hidden">
          <div
            className="h-full rounded-full gradient-gold transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={step.label}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 ${
                active
                  ? "bg-gold/10 border border-gold/30"
                  : done
                  ? "opacity-50"
                  : "opacity-30"
              }`}
            >
              {/* Status dot */}
              <div className="shrink-0 size-6 rounded-full flex items-center justify-center">
                {done ? (
                  <svg className="size-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <div className="size-2.5 rounded-full bg-gold animate-pulse" />
                ) : (
                  <div className="size-2.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              {/* Icon + text */}
              <span className="text-lg">{step.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${active ? "text-gold" : done ? "text-foreground/70" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
                {active && (
                  <div className="text-xs text-muted-foreground mt-0.5 animate-pulse">
                    {step.detail}
                  </div>
                )}
              </div>

              {/* Per-step progress bar (only for active) */}
              {active && (
                <div className="w-20 shrink-0">
                  <div className="h-1 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-gold transition-all duration-300 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {done && (
                <span className="text-xs text-gold/60 shrink-0">Done</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        AI is writing tailored copy for your specific business — good things take a moment ✨
      </p>
    </div>
  );
}