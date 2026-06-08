import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { OnboardingModal } from "@/components/site/OnboardingModal";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_completed) {
        setShowOnboarding(true);
      }
      setChecked(true);
    };

    checkOnboarding();
  }, []);

  if (!checked) return null;

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      <Outlet />
    </>
  );
}