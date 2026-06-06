import { supabase } from "@/integrations/supabase/client";

export async function startCheckout(plan: string, period: "monthly" | "annual") {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/auth?next=pricing";
    return;
  }

  try {
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
  } catch (e) {
    console.error("Checkout error:", e);
    throw e; // re-throw so the button can show a toast
  }
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/auth";
    return;
  }

  try {
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
  } catch (e) {
    console.error("Portal error:", e);
    throw e;
  }
}