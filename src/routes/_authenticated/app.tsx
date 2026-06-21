import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/site/Sidebar";
import { GenerateForm, type FormValues } from "@/components/site/GenerateForm";
import { LoadingPack } from "@/components/site/LoadingPack";
import { PackResults, type PackContent } from "@/components/site/PackResults";
import { ProfileSheet } from "@/components/site/ProfileSheet";
import { generatePack, getMyProfile } from "@/lib/packs.functions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Generate — MedierAI" }] }),
  component: AppPage,
});

type ViewState =
  | { kind: "form" }
  | { kind: "loading" }
  | { kind: "result"; meta: FormValues; content: PackContent };

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 10,
  pro: 25,
  max: Infinity,
};

function AppPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>({ kind: "form" });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const profile = profileData?.profile;
  const plan = profile?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 3;
  const used = profile?.packs_used ?? 0;

  const mutation = useMutation({
    mutationFn: (data: FormValues) => generatePack(data),
    onMutate: () => setView({ kind: "loading" }),
    onSuccess: (res, vars) => {
      setView({ kind: "result", meta: vars, content: res.pack.content as PackContent });
      qc.invalidateQueries({ queryKey: ["my-packs"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Your marketing pack is ready");
    },
    onError: (err: Error) => {
      setView({ kind: "form" });
      if (err.message === "FREE_LIMIT_REACHED" || err.message === "PACK_LIMIT_REACHED") {
        setUpgradeOpen(true);
      } else {
        toast.error(err.message || "Something went wrong");
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-end px-5 py-4 lg:px-10 border-b border-gold/10">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 rounded-full pr-3 pl-1 py-1 border border-gold/20 hover:border-gold/40 hover:bg-gold/5 transition-all"
          >
            <Avatar className="size-7">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-gold/20 text-gold text-xs">
                {profile?.name?.[0]?.toUpperCase() ?? <User className="size-3.5" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground/80 max-w-[120px] truncate">
              {profile?.name ?? "Account"}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              plan === "max" ? "bg-purple-400/10 text-purple-400" :
              plan === "pro" ? "bg-gold/10 text-gold" :
              plan === "starter" ? "bg-blue-400/10 text-blue-400" :
              "bg-muted text-muted-foreground"
            }`}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="max-w-3xl mx-auto space-y-8">
            {view.kind === "form" && (
              <GenerateForm onSubmit={(v) => mutation.mutate(v)} loading={false} />
            )}
            {view.kind === "loading" && <LoadingPack />}
            {view.kind === "result" && (
              <>
                <PackResults
                  meta={{
                    businessName: view.meta.businessName,
                    businessType: view.meta.businessType,
                    location: view.meta.location,
                    vibe: view.meta.vibe,
                  }}
                  content={view.content}
                />
                <div className="text-center">
                  <Button variant="outline" onClick={() => setView({ kind: "form" })} className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold">
                    <Sparkles className="size-4 mr-2" /> Generate another pack
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Profile sheet */}
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Upgrade dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="card-luxury border-gold/30">
          <DialogHeader>
            <div className="size-12 rounded-full gradient-gold mx-auto mb-3 flex items-center justify-center">
              <Sparkles className="size-5 text-background" />
            </div>
            <DialogTitle className="font-display text-2xl text-center">
              You've reached your pack limit
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              You've used all {limit === Infinity ? "" : limit} packs on your {plan} plan. Upgrade to generate more.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Plans from</div>
            <div className="font-display text-4xl text-gradient-gold">
              €25<span className="text-base text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
          </div>
          <Button
            className="w-full h-11 gradient-gold text-background font-medium"
            onClick={() => {
              setUpgradeOpen(false);
              navigate({ to: "/pricing" });
            }}
          >
            See plans
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}