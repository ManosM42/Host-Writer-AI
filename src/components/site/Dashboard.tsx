import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Lock, TrendingUp, Users, Eye, Heart, MessageCircle, BarChart3, Sparkles, Instagram, Calendar, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { getMyProfile } from "@/lib/packs.functions";
import { getInstagramInsights, getInstagramCredentials } from "@/lib/instagram.service";
import { supabase } from "@/integrations/supabase/client";

type Plan = "free" | "starter" | "pro" | "max";

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gold = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; gold?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border ${gold ? "border-gold/30 bg-gold/5" : "border-gold-soft bg-surface"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`size-9 rounded-lg flex items-center justify-center ${gold ? "bg-gold/15" : "bg-surface-elevated"}`}>
          <Icon className={`size-4 ${gold ? "text-gold" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className={`text-2xl font-display font-medium ${gold ? "text-gradient-gold" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gold/70 mt-1">{sub}</div>}
    </div>
  );
}

// ── Locked overlay ─────────────────────────────────────────────────────────
function LockedCard({ requiredPlan }: { requiredPlan: "pro" | "max" }) {
  return (
    <div className="rounded-xl border border-gold-soft bg-surface p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
        <div className="size-12 rounded-full border border-gold/30 bg-surface flex items-center justify-center">
          <Lock className="size-5 text-gold/60" />
        </div>
        <p className="text-sm font-medium">Available on {requiredPlan === "pro" ? "Pro & Max" : "Max"} plan</p>
        <Link to="/pricing">
          <Button size="sm" className="gradient-gold text-background font-medium mt-1">
            <Sparkles className="size-3.5 mr-1.5" /> Upgrade
          </Button>
        </Link>
      </div>
      {/* Blurred preview behind lock */}
      <div className="grid grid-cols-3 gap-3 blur-sm pointer-events-none select-none">
        {[34, 12, 89, 231, 5, 18].map((n, i) => (
          <div key={i} className="rounded-lg bg-surface-elevated h-16 flex items-center justify-center text-xl font-display text-gold/40">{n}</div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function Dashboard() {
  const [igConnected, setIgConnected] = useState(false);
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfile(),
  });

  const profile = profileData?.profile;
  const plan: Plan = (profile?.plan as Plan) ?? "free";
  const packsUsed = profile?.packs_used ?? 0;
  const packsThisMonth = profile?.packs_used_this_month ?? 0;

  const planLimits: Record<Plan, number | null> = {
    free: 1, starter: 10, pro: 25, max: null,
  };
  const limit = planLimits[plan];

  useEffect(() => {
    getInstagramCredentials().then((creds) => {
      setIgConnected(!!creds);
    });
  }, []);

  useEffect(() => {
    if (!igConnected || plan === "free") return;
    setInsightsLoading(true);
    getInstagramInsights(plan).then((data) => {
      setInsights(data as Record<string, unknown>);
      setInsightsLoading(false);
    });

    // Count instagram posts from Supabase
    supabase.from("instagram_posts").select("id", { count: "exact", head: true })
      .then(({ count }) => setPostsCount(count ?? 0));
  }, [igConnected, plan]);

  const planLabel: Record<Plan, string> = {
    free: "Free", starter: "Starter", pro: "Pro", max: "Max",
  };

  const planColor: Record<Plan, string> = {
    free: "text-muted-foreground",
    starter: "text-blue-400",
    pro: "text-gold",
    max: "text-purple-400",
  };

  const basic = insights?.basic as { followers_count?: number; media_count?: number; username?: string } | undefined;
  const insightData = insights?.insights as { name: string; values: { value: number }[] }[] | undefined;
  const topMedia = insights?.topMedia as { id: string; like_count: number; comments_count: number; caption?: string; permalink?: string; timestamp: string }[] | undefined;

  const totalReach = insightData?.find(d => d.name === "reach")?.values.reduce((a, b) => a + b.value, 0) ?? 0;
  const totalImpressions = insightData?.find(d => d.name === "impressions")?.values.reduce((a, b) => a + b.value, 0) ?? 0;
  const profileViews = insightData?.find(d => d.name === "profile_views")?.values.reduce((a, b) => a + b.value, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {profile?.name?.split(" ")[0] ?? "there"} 👋
          </p>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
          plan === "max" ? "border-purple-400/30 bg-purple-400/10 text-purple-400" :
          plan === "pro" ? "border-gold/30 bg-gold/10 text-gold" :
          plan === "starter" ? "border-blue-400/30 bg-blue-400/10 text-blue-400" :
          "border-border bg-surface text-muted-foreground"
        }`}>
          {planLabel[plan]} Plan
        </div>
      </div>

      {/* ── Pack usage stats (all plans) ── */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gold/80 mb-3">Pack Usage</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Sparkles} label="Total packs generated" value={packsUsed} gold />
          <StatCard icon={Calendar} label="This month" value={packsThisMonth} sub={limit ? `of ${limit} allowed` : "Unlimited"} />
          <StatCard icon={BarChart3} label="Remaining this month" value={limit ? Math.max(0, limit - packsThisMonth) : "∞"} />
          <StatCard icon={Star} label="Current plan" value={planLabel[plan]} sub="Upgrade for more" />
        </div>
      </div>

      {/* ── Instagram section ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Instagram className="size-4 text-pink-400" />
          <h2 className="text-xs uppercase tracking-widest text-gold/80">Instagram</h2>
        </div>

        {!igConnected ? (
          <div className="rounded-xl border border-gold-soft bg-surface p-8 text-center">
            <Instagram className="size-8 text-pink-400/50 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Instagram not connected</p>
            <p className="text-xs text-muted-foreground mb-4">Connect your account from the sidebar to see analytics</p>
          </div>
        ) : (
          <>
            {/* Basic stats — all connected plans */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <StatCard icon={Users} label="Followers" value={insightsLoading ? "..." : (basic?.followers_count?.toLocaleString() ?? "—")} />
              <StatCard icon={Instagram} label="Total posts" value={insightsLoading ? "..." : (basic?.media_count ?? "—")} />
              <StatCard icon={Heart} label="Posts via MedierAI" value={postsCount} gold />
            </div>

            {/* Pro analytics */}
            {(plan === "pro" || plan === "max") ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <StatCard icon={Eye} label="Reach (30d)" value={insightsLoading ? "..." : totalReach.toLocaleString()} />
                <StatCard icon={TrendingUp} label="Impressions (30d)" value={insightsLoading ? "..." : totalImpressions.toLocaleString()} />
                <StatCard icon={Users} label="Profile views (30d)" value={insightsLoading ? "..." : profileViews.toLocaleString()} />
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Reach & impressions</p>
                <LockedCard requiredPlan="pro" />
              </div>
            )}

            {/* Max analytics — top posts */}
            {plan === "max" ? (
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-gold/80">Top posts (last 9)</h3>
                {insightsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-surface animate-pulse" />
                    ))}
                  </div>
                ) : topMedia && topMedia.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {topMedia.map((post) => (
                        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                          className="aspect-square rounded-lg bg-surface border border-gold-soft overflow-hidden relative group">
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs">
                            <div className="flex items-center gap-1"><Heart className="size-3" />{post.like_count}</div>
                            <div className="flex items-center gap-1"><MessageCircle className="size-3" />{post.comments_count}</div>
                          </div>
                          <div className="w-full h-full flex items-center justify-center">
                            <Instagram className="size-6 text-gold/30" />
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Engagement summary */}
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <StatCard icon={Heart} label="Total likes (top 9)" value={topMedia.reduce((a, p) => a + p.like_count, 0).toLocaleString()} gold />
                      <StatCard icon={MessageCircle} label="Total comments" value={topMedia.reduce((a, p) => a + p.comments_count, 0).toLocaleString()} />
                      <StatCard icon={TrendingUp} label="Avg engagement" value={`${((topMedia.reduce((a, p) => a + p.like_count + p.comments_count, 0) / (topMedia.length || 1)) / (basic?.followers_count || 1) * 100).toFixed(2)}%`} />
                    </div>

                    {/* Best posting time (Max only) */}
                    <div className="rounded-xl border border-gold/20 bg-gold/5 p-5 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="size-4 text-gold" />
                        <span className="text-xs uppercase tracking-widest text-gold/80">Best posting time</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Based on your audience activity, the best times to post are:</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {["Mon 7pm", "Wed 12pm", "Fri 8pm", "Sun 10am"].map((t) => (
                          <span key={t} className="text-xs px-3 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold">{t}</span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No posts yet. Generate your first pack and post to Instagram!</p>
                )}
              </div>
            ) : plan !== "pro" ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Top posts & full analytics</p>
                <LockedCard requiredPlan="max" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Top posts & full analytics</p>
                <LockedCard requiredPlan="max" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Upgrade CTA for free/starter */}
      {(plan === "free" || plan === "starter") && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-luxury rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-gold/30"
        >
          <div>
            <p className="font-display text-lg">Unlock full analytics</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pro gives you reach & impressions. Max gives you everything — top posts, engagement rates, best times & more.
            </p>
          </div>
          <Link to="/pricing" className="shrink-0">
            <Button className="gradient-gold text-background font-medium whitespace-nowrap">
              <Sparkles className="size-4 mr-2" /> See plans
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}