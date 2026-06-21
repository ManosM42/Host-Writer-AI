import { supabase } from "@/integrations/supabase/client";

export async function startCheckout(plan: string, period: "monthly" | "annual") {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("NOT_LOGGED_IN");
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan, period }),
  });

  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("NOT_LOGGED_IN");
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
  });

  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}