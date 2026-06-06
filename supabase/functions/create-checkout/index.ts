import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const PRICE_IDS: Record<string, { monthly: string; annual?: string }> = {
  starter: {
    monthly: "price_1TfGob1KsXiRNqhDysKV8VEr",
    annual:  "price_1TfGpa1KsXiRNqhD1Tx42i2h",
  },
  pro: {
    monthly: "price_1TfGqB1KsXiRNqhD6jDMzJHL",
    annual:  "price_1TfGqZ1KsXiRNqhDdJGwvDxv",
  },
  max: {
    monthly: "price_1TfGr01KsXiRNqhDRDwlpvhH",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });

  try {
    const { plan, period = "monthly" } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const auth = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: userErr } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId: string = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const priceId = period === "annual"
      ? PRICE_IDS[plan]?.annual
      : PRICE_IDS[plan]?.monthly;

    if (!priceId) return json({ error: "Invalid plan/period" }, 400);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get("SITE_URL")}/app?upgraded=true`,
      cancel_url:  `${Deno.env.get("SITE_URL")}/pricing`,
      metadata: { supabase_user_id: user.id, plan, period },
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
});
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors(), "Content-Type": "application/json" } });