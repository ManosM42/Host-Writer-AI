import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const PackInput = z.object({
  businessName: z.string().min(1).max(120),
  businessType: z.enum(["Villa", "Apartment", "Tavern", "Restaurant", "Boutique Hotel"]),
  location: z.string().min(1).max(120),
  features: z.string().min(1).max(2000),
  vibe: z.enum(["Luxury", "Family-friendly", "Romantic", "Rustic", "Modern"]),
  audience: z.enum(["International tourists", "Greek travelers", "Both"]),
  language: z.enum(["English only", "Greek only", "Both EN + GR"]),
  photos: z.array(z.string()).optional(),
});

export type PackInputType = z.infer<typeof PackInput>;

const FREE_LIMIT = 3;

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { profile: data, freeLimit: FREE_LIMIT };
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

export async function generatePack(data: PackInputType) {
  const { profile } = await getMyProfile();
  if (profile && profile.plan === "free" && (profile.packs_used ?? 0) >= FREE_LIMIT) {
    throw new Error("FREE_LIMIT_REACHED");
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const prompt = buildPrompt(data);

  // Note: llama-3.3 is text-only, so we pass photo info as text hint
  const photoHint = data.photos && data.photos.length > 0 
    ? `\n\n[User uploaded ${data.photos.length} high-quality photo(s) of the property. Create Instagram captions that assume professional, visually appealing imagery will accompany each post.]`
    : "";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt + photoHint }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error", err);
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
    })
    .select()
    .single();

  if (insertErr) throw new Error("Could not save your pack.");

  await supabase
    .from("profiles")
    .update({ packs_used: (profile?.packs_used ?? 0) + 1 })
    .eq("id", user.id);

  return { pack };
}
function buildPrompt(d: PackInputType) {
  const langInstruction =
    d.language === "Both EN + GR"
      ? "Generate EVERY piece of content in BOTH English and Greek. Format: '🇬🇧 EN: ...\\n\\n🇬🇷 GR: ...'"
      : d.language === "Greek only"
      ? "Generate ALL content in Greek only."
      : "Generate ALL content in English only.";

  const photoInstruction = d.photos && d.photos.length > 0
    ? `You have been provided ${d.photos.length} photo(s) of the property. Analyze the images carefully to understand the visual style, atmosphere, and key features visible in them. Use these visual insights to create Instagram captions that highlight what guests will actually see, with specific references to the visual elements in the photos (e.g., architecture, views, ambiance, decor details).

`
    : "";

  return `You are an elite hospitality marketing copywriter specialising in Greek tourism. Write for ${d.businessName}, a ${d.businessType} in ${d.location}, Greece. Vibe: ${d.vibe}. Features: ${d.features}. Target: ${d.audience}. Language: ${langInstruction}.

${photoInstruction}Return ONLY valid JSON matching this schema exactly:
{
  "listing": { "title": "string", "description": "string", "bullets": ["6 items"], "seoMetaTitle": "string", "seoMetaDescription": "string" },
  "social": { "instagramCaptions": ["7 captions with visual details from photos if provided"], "facebookCaptions": ["3 captions"], "contentCalendar": "string" },
  "gmb": { "description": "string", "positiveReplies": ["3 replies"], "negativeReplies": ["2 replies"], "weeklyPosts": ["4 posts"] },
  "email": { "welcome": { "subject": "string", "body": "string" }, "reviewRequest": { "subject": "string", "body": "string" }, "seasonal": { "subject": "string", "body": "string" } },
  "ads": { "googleHeadlines": ["3 headlines"], "googleDescriptions": ["2 descriptions"], "metaAd": { "primaryText": "string", "headline": "string" }, "tagline": "string" }
}`;
}
