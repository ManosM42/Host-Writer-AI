import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/packs.functions";
import { supabase } from "@/integrations/supabase/client";
import { openBillingPortal } from "@/lib/stripe.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Camera, CreditCard, Check, Sparkles, Zap, Crown, Star, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";

const PLAN_CONFIG: Record<string, {
  label: string;
  color: string;
  icon: React.ReactNode;
  perks: string[];
}> = {
  free: {
    label: "Free",
    color: "text-muted-foreground border-muted-foreground/30 bg-muted/10",
    icon: <Star className="size-3" />,
    perks: ["3 packs total", "Preview only", "All 5 channels visible"],
  },
  starter: {
    label: "Starter",
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    icon: <Zap className="size-3" />,
    perks: ["10 packs / month", "Full copy & paste", "PDF download", "Auto-post IG + FB (7×/week)"],
  },
  pro: {
    label: "Pro",
    color: "text-gold border-gold/30 bg-gold/10",
    icon: <Sparkles className="size-3" />,
    perks: ["25 packs / month", "Smart post scheduling", "Up to 3 properties", "Basic analytics"],
  },
  max: {
    label: "Max",
    color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    icon: <Crown className="size-3" />,
    perks: ["Unlimited packs", "Priority AI — Claude Opus", "Brand voice memory", "Unlimited properties", "Full analytics", "White-label PDF", "2 team seats", "Priority support"],
  },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProfileSheet({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const profile = profileData?.profile;
  const plan = profile?.plan ?? "free";
  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio((profile as any).bio ?? "");
      setAvatarPreview(null);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast.error("Could not upload image.");
      setAvatarPreview(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Profile photo updated.");
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ name, bio } as any)
      .eq("id", user.id);

    if (error) {
      toast.error("Could not save changes.");
    } else {
      toast.success("Profile saved.");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    }
    setSaving(false);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch {
      toast.error("Could not open billing portal.");
      setPortalLoading(false);
    }
  };

  // Format renewal date from subscription
  const renewalDate = (profile as any)?.subscription_period_end
    ? new Date((profile as any).subscription_period_end * 1000).toLocaleDateString("el-GR", {
        day: "numeric", month: "long", year: "numeric"
      })
    : null;

  const periodLabel = (profile as any)?.plan_period === "annual" ? "Annual" : "Monthly";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background border-gold/20">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl">My Profile</SheetTitle>
        </SheetHeader>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-gold/20 text-gold text-xl">
                {profile?.name?.[0]?.toUpperCase() ?? <User className="size-6" />}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-7 rounded-full gradient-gold flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            >
              <Camera className="size-3.5 text-background" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="text-center">
            <div className="font-medium">{profile?.name ?? "Account"}</div>
            <div className="text-xs text-muted-foreground">{(profile as any)?.email}</div>
            {(profile as any)?.bio && (
              <div className="text-xs text-muted-foreground mt-1 max-w-[260px]">{(profile as any).bio}</div>
            )}
          </div>
        </div>

        {/* Plan badge */}
        <div className={`flex items-center gap-2 w-fit mx-auto px-3 py-1.5 rounded-full border text-xs font-medium mb-6 ${planConfig.color}`}>
          {planConfig.icon}
          {planConfig.label} Plan
          {plan !== "free" && <span className="opacity-60">· {periodLabel}</span>}
        </div>

        {/* Plan card */}
        <div className="card-luxury rounded-xl p-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Your privileges</div>
          <div className="space-y-2">
            {planConfig.perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-sm">
                <div className="size-4 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <Check className="size-2.5 text-gold" strokeWidth={3} />
                </div>
                {perk}
              </div>
            ))}
          </div>

          {/* Renewal date */}
          {plan !== "free" && renewalDate && (
            <div className="mt-3 pt-3 border-t border-gold-soft flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              Next renewal: {renewalDate}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gold-soft space-y-2">
            {plan === "free" ? (
              <Link to="/pricing" onClick={() => onOpenChange(false)}>
                <Button size="sm" className="w-full gradient-gold text-background font-medium h-8 text-xs">
                  Upgrade plan
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-gold/40 text-gold hover:bg-gold/10 h-8 text-xs"
                  onClick={handlePortal}
                  disabled={portalLoading}
                >
                  <CreditCard className="size-3.5 mr-2" />
                  {portalLoading ? "Opening..." : "Manage billing"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Cancel anytime — you keep access until {renewalDate ?? "end of period"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Edit profile */}
        <div className="space-y-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Edit profile</div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Display name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-surface border-gold/20 focus:border-gold/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your business..."
              className="bg-surface border-gold/20 focus:border-gold/50 resize-none"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-gold text-background font-medium"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}