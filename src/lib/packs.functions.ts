import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// ── Schema ─────────────────────────────────────────────────────────────────
export const PackInput = z.object({
  businessName: z.string().min(1).max(120),
  businessType: z.enum([
    "Villa", "Apartment", "Tavern", "Restaurant", "Boutique Hotel",
    "Café", "Bar", "Spa & Wellness", "Yacht Charter", "Tour Operator",
  ]),
  location: z.string().min(1).max(120),
  features: z.string().min(1).max(2000),
  vibe: z.enum(["Luxury", "Family-friendly", "Romantic", "Rustic", "Modern", "Boho", "Minimalist"]),
  audience: z.enum(["International tourists", "Greek travelers", "Both"]),
  language: z.enum(["English only", "Greek only", "Both EN + GR"]),
  photos: z.array(z.string()).optional(), // base64
});

export type PackInputType = z.infer<typeof PackInput>;

// ── Plan config ────────────────────────────────────────────────────────────
export type Plan = "free" | "starter" | "pro" | "max";

export const PLAN_LIMITS: Record<Plan, {
  packsPerMonth: number | null; // null = unlimited
  canCopy: boolean;
  canDownloadPdf: boolean;
  canAutoPost: boolean;
  canSchedule: boolean;
  canUsePhotos: boolean;
  maxProperties: number | null;
  aiModel: "standard" | "advanced";
  viralLevel: "basic" | "enhanced" | "viral" | "ultra";
}> = {
  free: {
    packsPerMonth: 1,
    canCopy: false,
    canDownloadPdf: false,
    canAutoPost: false,
    canSchedule: false,
    canUsePhotos: false,
    maxProperties: 1,
    aiModel: "standard",
    viralLevel: "basic",
  },
  starter: {
    packsPerMonth: 10,
    canCopy: true,
    canDownloadPdf: true,
    canAutoPost: true,
    canSchedule: false,
    canUsePhotos: true,
    maxProperties: 1,
    aiModel: "standard",
    viralLevel: "enhanced",
  },
  pro: {
    packsPerMonth: 25,
    canCopy: true,
    canDownloadPdf: true,
    canAutoPost: true,
    canSchedule: true,
    canUsePhotos: true,
    maxProperties: 3,
    aiModel: "advanced",
    viralLevel: "viral",
  },
  max: {
    packsPerMonth: null,
    canCopy: true,
    canDownloadPdf: true,
    canAutoPost: true,
    canSchedule: true,
    canUsePhotos: true,
    maxProperties: null,
    aiModel: "advanced",
    viralLevel: "ultra",
  },
};

// ── Profile helpers ────────────────────────────────────────────────────────
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);

  const plan: Plan = (data?.plan as Plan) ?? "free";
  const limits = PLAN_LIMITS[plan];

  return {
    profile: data,
    plan,
    limits,
  };
}

export async function listMyPacks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("packs")
    .select("id, business_name, business_type, location, vibe, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return { packs: data ?? [] };
}

export async function getPack(id: string) {
  const { data, error } = await supabase
    .from("packs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return { pack: data };
}

export async function deletePack(id: string) {
  const { error } = await supabase.from("packs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ── Plan gate check ────────────────────────────────────────────────────────
async function checkPlanGate(plan: Plan, profile: Record<string, unknown>) {
  const limits = PLAN_LIMITS[plan];

  // Monthly reset logic
  const now = new Date();
  const resetDate = profile?.packs_reset_date ? new Date(profile.packs_reset_date as string) : null;
  const isNewMonth = !resetDate || now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

  let packsUsedThisMonth = isNewMonth ? 0 : (profile?.packs_used_this_month as number ?? 0);

  if (limits.packsPerMonth !== null && packsUsedThisMonth >= limits.packsPerMonth) {
    throw new Error("PLAN_LIMIT_REACHED");
  }

  return { packsUsedThisMonth, isNewMonth };
}

// ── Main generate function ─────────────────────────────────────────────────
export async function generatePack(data: PackInputType) {
  const { profile, plan, limits } = await getMyProfile();

  // ── Plan gate ──
  const { packsUsedThisMonth, isNewMonth } = await checkPlanGate(plan, profile as Record<string, unknown>);

  // ── Photos only for starter+ ──
  if (data.photos && data.photos.length > 0 && !limits.canUsePhotos) {
    data = { ...data, photos: [] }; // strip photos for free plan
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API key missing");

  const prompt = buildPrompt(data, limits.viralLevel);

  // ── Call Groq ──
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: limits.aiModel === "advanced"
        ? "llama-3.3-70b-versatile"
        : "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: limits.viralLevel === "ultra" ? 0.85 : 0.75,
      max_tokens: limits.viralLevel === "ultra" ? 6000 : 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error:", err);
    throw new Error("Failed to generate pack. Please try again.");
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from AI");

  let content: unknown;
  try {
    content = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Invalid JSON from AI");
    content = JSON.parse(m[0]);
  }

  // ── Save pack ──
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data: pack, error: insertErr } = await supabase
    .from("packs")
    .insert({
      user_id: user.id,
      business_name: data.businessName,
      business_type: data.businessType,
      location: data.location,
      vibe: data.vibe,
      features: data.features,
      audience: data.audience,
      language: data.language,
      content: content as never,
      plan_at_generation: plan,
    })
    .select()
    .single();

  if (insertErr) throw new Error("Could not save your pack.");

  // ── Update usage counters ──
  await supabase
    .from("profiles")
    .update({
      packs_used: ((profile?.packs_used as number) ?? 0) + 1,
      packs_used_this_month: isNewMonth ? 1 : packsUsedThisMonth + 1,
      packs_reset_date: isNewMonth ? new Date().toISOString() : profile?.packs_reset_date,
    })
    .eq("id", user.id);

  return { pack, plan, limits };
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(
  d: PackInputType,
  viralLevel: "basic" | "enhanced" | "viral" | "ultra",
) {
  const langInstruction =
    d.language === "Both EN + GR"
      ? "Generate EVERY piece of content in BOTH English and Greek. Format each field as: '🇬🇧 [English version]\\n\\n🇬🇷 [Greek version]'"
      : d.language === "Greek only"
      ? "Generate ALL content in Greek only."
      : "Generate ALL content in English only.";

  const photoContext = d.photos && d.photos.length > 0
    ? `The business owner has uploaded ${d.photos.length} professional photo(s) of their property. Craft Instagram captions that reference specific visual elements a photographer would capture: golden-hour light, textured surfaces, architectural details, colour palettes, and mood. Make each caption paint a picture so vivid readers feel they are already there.`
    : `No photos provided. Write Instagram captions that create powerful mental imagery through sensory language — sounds, smells, textures, light — so readers visualise the experience perfectly.`;

  const viralInstructions = {
    basic: `Write clear, professional marketing copy.`,
    enhanced: `Write compelling, engaging copy that captures attention. Use storytelling and emotional triggers. Make content shareable.`,
    viral: `Write VIRAL-OPTIMISED copy engineered for maximum engagement and shares. Use these techniques:
- Hook-first: Open every Instagram caption with a scroll-stopping first line (question, bold statement, or surprising fact)
- Emotional triggers: nostalgia, wanderlust, FOMO, aspiration, exclusivity
- Sensory immersion: describe sounds, smells, textures, temperatures — not just visuals
- Micro-storytelling: each caption is a tiny story with a beginning, feeling, and invitation
- Strategic hashtag clusters: mix mega (1M+), mid (100K-1M), and niche (<100K) tags
- Call-to-action hooks: end with questions that invite comments ("What would you do with a view like this?")
- Pattern interrupts: use line breaks, emojis as bullets, and white space for readability`,
    ultra: `Write ULTRA-VIRAL, award-winning hospitality copy engineered by a CMO who has scaled 100+ luxury brands to millions of followers. Apply every technique:
- Dopamine hooks: First 3 words must stop the scroll cold
- The "jealousy gap": Make readers feel they're missing out on the most beautiful experience of their life
- Narrative architecture: Mini 3-act stories (the arrival → the moment → the feeling that stays with you)
- Luxury sensory theatre: hyper-specific details that signal premium (thread counts, scent notes, the exact colour of the water at sunset)
- Social proof language woven in naturally ("The kind of place people come back to every year")
- Platform-native formatting: Instagram gets line breaks + emoji rhythm; Facebook gets longer warm storytelling; GMB gets local authority + trust signals; Google Ads gets urgency + benefit stacking; Meta Ads gets scroll-stopping hooks + desire + CTA
- Hashtag science: 3-tier strategy (awareness / community / conversion) per post
- Email subject lines engineered for 45%+ open rates: curiosity gaps, personalisation tokens, power words
- Ad copy with proven direct-response formulas (AIDA, PAS, 4Ps) applied to luxury hospitality`,
  };

  return `You are the world's best hospitality marketing copywriter, specialising in Greek tourism and viral social media content.

BUSINESS: ${d.businessName}
TYPE: ${d.businessType}
LOCATION: ${d.location}, Greece
VIBE: ${d.vibe}
KEY FEATURES: ${d.features}
TARGET AUDIENCE: ${d.audience}
LANGUAGE: ${langInstruction}

VISUAL CONTEXT:
${photoContext}

CONTENT STRATEGY:
${viralInstructions[viralLevel]}

CRITICAL: Return ONLY valid JSON. No markdown. No explanation. Match this schema exactly:

{
  "listing": {
    "title": "Scroll-stopping Airbnb/Booking title (max 50 chars, unique selling point first)",
    "description": "300-word immersive property description that sells the feeling, not just the features. Open with the most magical moment a guest will experience.",
    "bullets": ["6 benefit-focused bullets starting with strong action verbs"],
    "seoMetaTitle": "SEO-optimised meta title with primary keyword + location (max 60 chars)",
    "seoMetaDescription": "Compelling meta description with CTA (max 155 chars)"
  },
  "social": {
    "instagramCaptions": [
      "7 captions. Each: hook line → 3-4 lines of story/sensory detail → 1 CTA line → 15-20 hashtags in a comment-style block. Each caption has a different angle: Day1=arrival feeling, Day2=morning ritual, Day3=the view, Day4=local secret, Day5=golden hour, Day6=the food/drink, Day7=the goodbye feeling"
    ],
    "facebookCaptions": [
      "3 longer-form captions (150-200 words each) with warm storytelling tone, one question to drive comments, and a soft booking CTA"
    ],
    "contentCalendar": "4-week content calendar with daily post themes, content types (Reel/Story/Carousel/Static), best posting times for Greek hospitality audience, and seasonal hooks"
  },
  "gmb": {
    "description": "750-char Google My Business description packed with local keywords, trust signals, and a clear value proposition",
    "positiveReplies": ["3 warm, personalised review replies that reinforce brand values and encourage rebooking"],
    "negativeReplies": ["2 professional, empathetic responses to negative reviews that show ownership and offer resolution — turning detractors into brand advocates"],
    "weeklyPosts": ["4 GMB weekly posts: mix of offers, behind-the-scenes, seasonal highlight, and local area tip"]
  },
  "email": {
    "welcome": {
      "subject": "High open-rate welcome subject line with personalisation token {first_name}",
      "body": "Warm 300-word welcome email that sets expectations, shares 3 insider tips, and invites guests to connect on Instagram"
    },
    "reviewRequest": {
      "subject": "Review request subject line that feels personal, not automated (45%+ open rate)",
      "body": "200-word review request that reminds guests of their best moment, makes reviewing feel easy, and links to Google + TripAdvisor"
    },
    "seasonal": {
      "subject": "Seasonal promo subject with urgency and curiosity gap",
      "body": "250-word seasonal email with exclusive offer, FOMO trigger, beautiful seasonal imagery description, and clear CTA button text"
    }
  },
  "ads": {
    "googleHeadlines": ["5 Google Ads headlines (max 30 chars each) — mix of: benefit, location, urgency, social proof, unique feature"],
    "googleDescriptions": ["3 Google Ads descriptions (max 90 chars each) — AIDA formula applied to short-form"],
    "metaAd": {
      "primaryText": "Facebook/Instagram ad primary text: hook (1 line) → problem/desire (2 lines) → solution/experience (3 lines) → social proof (1 line) → CTA (1 line)",
      "headline": "Meta ad headline (max 40 chars) — desire + outcome formula"
    },
    "tagline": "One unforgettable brand tagline (max 8 words) that captures the soul of this business — the kind people tattoo on their hearts"
  }
}`;
}