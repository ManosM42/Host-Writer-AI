import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/site/Sidebar";
import { GenerateForm, type FormValues } from "@/components/site/GenerateForm";
import { LoadingPack } from "@/components/site/LoadingPack";
import { PackResults, type PackContent } from "@/components/site/PackResults";
import { generatePack, getMyProfile } from "@/lib/packs.functions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Generate — HostWriter AI" }] }),
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

  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const plan = profileData?.profile?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 3;
  const used = profileData?.profile?.packs_used ?? 0;
  const remaining = plan === "max" ? "Unlimited" : `${Math.max(0, limit - used)} of ${limit}`;

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
      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
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
      </main>

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