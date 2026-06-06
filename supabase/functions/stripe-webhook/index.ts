import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" });

const PRICE_TO_PLAN: Record<string, { plan: string; period: string }> = {
  "price_1TfGob1KsXiRNqhDysKV8VEr": { plan: "starter", period: "monthly" },
  "price_1TfGpa1KsXiRNqhD1Tx42i2h": { plan: "starter", period: "annual" },
  "price_1TfGqB1KsXiRNqhD6jDMzJHL": { plan: "pro",     period: "monthly" },
  "price_1TfGqZ1KsXiRNqhDdJGwvDxv": { plan: "pro",     period: "annual" },
  "price_1TfGr01KsXiRNqhDRDwlpvhH": { plan: "max",     period: "monthly" },
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const subId  = session.subscription as string;
      if (!userId || !subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const priceId = sub.items.data[0]?.price.id;
      const mapped  = priceId ? PRICE_TO_PLAN[priceId] : null;

      await supabase.from("profiles").update({
        plan: mapped?.plan ?? "starter",
        plan_period: mapped?.period ?? "monthly",
        stripe_subscription_id: subId,
        packs_used: 0,
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId  = sub.items.data[0]?.price.id;
      const mapped   = priceId ? PRICE_TO_PLAN[priceId] : null;
      const customer = await stripe.customers.retrieve(sub.customer as string);
      const userId   = (customer as Stripe.Customer).metadata?.supabase_user_id;
      if (!userId) break;

      await supabase.from("profiles").update({
        plan: mapped?.plan ?? "starter",
        plan_period: mapped?.period ?? "monthly",
        stripe_subscription_id: sub.id,
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(sub.customer as string);
      const userId   = (customer as Stripe.Customer).metadata?.supabase_user_id;
      if (!userId) break;

      await supabase.from("profiles").update({
        plan: "free",
        plan_period: null,
        stripe_subscription_id: null,
      }).eq("id", userId);
      break;
    }
  }

  return new Response("ok");
});