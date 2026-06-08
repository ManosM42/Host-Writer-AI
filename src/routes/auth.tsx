import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — MedierAI" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const base = import.meta.env.PROD
    ? "https://host-writer-demo.vercel.app"
    : "http://localhost:3000";

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${base}/app` },
    });
    if (error) {
      toast.error("Could not sign in with Google.");
      setBusy(false);
    }
  };

  // ── Age check ─────────────────────────────────────────────────────────────
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

  // ── Email sign in ─────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Wrong email or password."
        : error.message);
      setBusy(false);
    }
    // on success Supabase redirects automatically via onAuthStateChange
  };

  // ── Email sign up ─────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      toast.error("Please enter your date of birth.");
      return;
    }
    if (!isAdult()) {
      toast.error("You must be 18 or older to use MedierAI.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${base}/app`,
      },
    });

    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else {
      // Mark onboarding as completed since they already did age + terms here
      if (data.user) {
        await supabase.from("profiles").update({
          onboarding_completed: true,
          terms_accepted_at: new Date().toISOString(),
        }).eq("id", data.user.id);
      }
      toast.success("Account created! Welcome to Medier AI.");
      setBusy(false);
    }
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto max-w-6xl px-5 py-5 flex items-center justify-between">
        <Logo />
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md card-luxury rounded-2xl p-8 space-y-6">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80 mb-3">
              <Sparkles className="size-3" /> Welcome
            </div>
            <h1 className="font-display text-3xl">
              {mode === "signin" ? "Sign in to MedierAI" : "Create your account"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {mode === "signin"
                ? "Generate your full marketing pack in 30 seconds."
                : "Start with 1 free pack. No credit card required."}
            </p>
          </div>

          {/* Google button */}
          <Button
            onClick={signInGoogle}
            disabled={busy}
            variant="outline"
            className="w-full h-12 bg-surface-elevated border-gold-soft hover:bg-gold/10 hover:border-gold/40"
          >
            <GoogleIcon className="size-5 mr-3" />
            {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
          </Button>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gold-soft/40" />
            <span className="text-xs text-muted-foreground">or with email</span>
            <div className="flex-1 border-t border-gold-soft/40" />
          </div>

          {/* Email form */}
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">

            {/* Name — signup only */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-9 bg-surface border-gold-soft/50 focus:border-gold/50"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-surface border-gold-soft/50 focus:border-gold/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                  className="pl-9 pr-10 bg-surface border-gold-soft/50 focus:border-gold/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Date of birth — signup only */}
            {mode === "signup" && (
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
                  Your date of birth is only used for age verification and is never stored.
                </p>
              </div>
            )}

            {/* Terms checkbox — signup only */}
            {mode === "signup" && (
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
                  <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                </span>
              </label>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 gradient-gold text-background font-medium"
            >
              <Sparkles className="size-4 mr-2" />
              {busy
                ? "Please wait..."
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          {/* Toggle mode */}
          <p className="text-xs text-center text-muted-foreground">
            {mode === "signin" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-gold hover:underline font-medium">
                  Create one
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-gold hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}