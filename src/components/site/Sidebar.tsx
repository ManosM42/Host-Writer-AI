import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, FileText, LogOut, User, Instagram } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyPacks, getMyProfile } from "@/lib/packs.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInstagramCredentials } from "@/lib/instagram.service";
import { useState, useEffect } from "react";
import { ConnectInstagramDialog } from "./ConnectInstagramDialog";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramOpen, setInstagramOpen] = useState(false);

  useEffect(() => {
    getInstagramCredentials().then((creds) => {
      setInstagramConnected(!!creds);
    });
  }, []);

  const { data: packsData } = useQuery({
    queryKey: ["my-packs"],
    queryFn: () => listMyPacks(),
  });
  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const profile = profileData?.profile;
  const freeLimit = profileData?.freeLimit ?? 3;
  const used = profile?.packs_used ?? 0;
  const plan = profile?.plan ?? "free";
  const isPaid = plan !== "free";
  const remaining = Math.max(0, freeLimit - used);

  const planLabel: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    max: "Max",
  };

  const packsLabel: Record<string, string> = {
    free: `${remaining} of ${freeLimit} packs left`,
    starter: "10 packs / month",
    pro: "25 packs / month",
    max: "Unlimited packs",
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="w-full lg:w-72 lg:min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <Logo />
      </div>
      <div className="p-3">
        <Link
          to="/app"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            location.pathname === "/app"
              ? "bg-gold/10 text-gold"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          }`}
        >
          <Sparkles className="size-4" /> New pack
        </Link>
      </div>
      <div className="px-3 pb-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-3 py-2 flex items-center gap-2">
          <FileText className="size-3" /> My packs
        </div>
        <div className="space-y-0.5 max-h-[40vh] overflow-y-auto">
          {(packsData?.packs ?? []).map((p) => (
            <Link
              key={p.id}
              to="/packs/$id"
              params={{ id: p.id }}
              className={`block px-3 py-2 rounded-md text-sm truncate transition-colors ${
                location.pathname === `/packs/${p.id}`
                  ? "bg-gold/10 text-gold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <div className="truncate font-medium">{p.business_name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.location} · {p.business_type}</div>
            </Link>
          ))}
          {(!packsData?.packs || packsData.packs.length === 0) && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No packs yet. Generate your first.</p>
          )}
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-sidebar-border space-y-3">
        <Button
          variant="outline"
          className={`w-full text-xs h-9 ${
            instagramConnected
              ? "border-pink-500/40 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10"
              : "border-gold/40 text-gold hover:bg-gold/10"
          }`}
          onClick={() => setInstagramOpen(true)}
        >
          <Instagram className="size-3.5 mr-2" />
          {instagramConnected ? "✓ Instagram connected" : "Connect Instagram"}
        </Button>

        {isPaid ? (
          <div className="card-luxury rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Current plan</div>
            <div className="text-sm font-medium text-gold">{planLabel[plan] ?? plan}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{packsLabel[plan]}</div>
            <Link to="/pricing">
              <Button size="sm" variant="outline" className="w-full mt-2 border-gold/40 text-gold hover:bg-gold/10 h-8 text-xs">
                Manage plan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="card-luxury rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Free plan</div>
            <div className="text-sm font-medium">{remaining} of {freeLimit} packs left</div>
            <Link to="/pricing">
              <Button size="sm" className="w-full mt-2 gradient-gold text-background font-medium h-8 text-xs">
                Upgrade plan
              </Button>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gold/20 text-gold text-xs">
              {profile?.name?.[0]?.toUpperCase() ?? <User className="size-3.5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{profile?.name ?? "Account"}</div>
            <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      <ConnectInstagramDialog
        open={instagramOpen}
        onOpenChange={setInstagramOpen}
        onConnected={() => setInstagramConnected(true)}
      />
    </aside>
  );
}