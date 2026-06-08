import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Sparkles, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: Props) {
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const isAdult = (): boolean => {
    const day = parseInt(birthDay);
    const month = parseInt(birthMonth);
    const year = parseInt(birthYear);
    if (!day || !month || !year || year < 1900) return false;
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age >= 18;
  };

  const handleComplete = async () => {
    if (!birthDay || !birthMonth || !birthYear) {
      toast.error("Please enter your date of birth.");
      return;
    }
    if (!isAdult()) {
      toast.error("You must be 18 or older to use Medier AI.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    const { error } = await supabase.from("profiles").update({
      onboarding_completed: true,
      terms_accepted_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      setBusy(false);
      return;
    }

    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="card-luxury border-gold/20 sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80 mb-2">
            <Sparkles className="size-3" /> One last step
          </div>
          <DialogTitle className="font-display text-2xl">Welcome to Medier AI</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Before you start, we need to verify your age and confirm you agree to our terms.
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Date of birth */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" /> Date of birth (must be 18+)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Day"
                min={1} max={31}
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="bg-surface border-gold-soft/50 focus:border-gold/50 text-center"
              />
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="rounded-md border border-gold-soft/50 bg-surface px-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
              >
                <option value="">Month</option>
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Year"
                min={1900} max={new Date().getFullYear()}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="bg-surface border-gold-soft/50 focus:border-gold/50 text-center"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used only for age verification, never stored.
            </p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <div className={`size-4 rounded border transition-all ${
                acceptTerms
                  ? "bg-gold border-gold"
                  : "border-gold-soft/60 bg-surface group-hover:border-gold/40"
              } flex items-center justify-center`}>
                {acceptTerms && (
                  <svg viewBox="0 0 12 12" fill="none" className="size-3">
                    <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link to="/terms" target="_blank" className="text-gold hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" target="_blank" className="text-gold hover:underline">Privacy Policy</Link>
            </span>
          </label>

          <Button
            onClick={handleComplete}
            disabled={busy}
            className="w-full h-11 gradient-gold text-background font-medium"
          >
            <Sparkles className="size-4 mr-2" />
            {busy ? "Please wait..." : "Continue to Medier AI"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}