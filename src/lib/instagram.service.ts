import { supabase } from "@/integrations/supabase/client";

export type InstagramCredentials = {
  accessToken: string;
  instagramBusinessAccountId: string;
  instagramUsername: string;
};

// ── Credentials ────────────────────────────────────────────────────────────
export async function saveInstagramCredentials(credentials: InstagramCredentials) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_integrations")
    .upsert(
      {
        user_id: user.id,
        platform: "instagram",
        access_token: credentials.accessToken,
        account_id: credentials.instagramBusinessAccountId,
        account_username: credentials.instagramUsername,
      },
      { onConflict: "user_id,platform" }
    );

  if (error) throw new Error(error.message);
}

export async function getInstagramCredentials(): Promise<InstagramCredentials | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .single();

  if (!data) return null;

  return {
    accessToken: data.access_token,
    instagramBusinessAccountId: data.account_id,
    instagramUsername: data.account_username,
  };
}

// ── Upload image to Supabase Storage → get public URL ─────────────────────
export async function uploadImageForInstagram(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `instagram/${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error("Image upload failed: " + error.message);

  const { data: urlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(path);

  if (!urlData?.publicUrl) throw new Error("Could not get public URL for image");

  return urlData.publicUrl;
}

// ── Caption formatter ──────────────────────────────────────────────────────
export function formatInstagramCaption(
  caption: string,
  businessName: string,
  location: string,
  vibe: string
): string {
  const vibeEmoji: Record<string, string> = {
    Luxury: "✨", "Family-friendly": "👨‍👩‍👧‍👦",
    Romantic: "💕", Rustic: "🌾", Modern: "🏢",
    Boho: "🌸", Minimalist: "🤍",
  };

  const emoji = vibeEmoji[vibe] ?? "✨";
  const hashtags = generateHashtags(vibe, location);

  return `${emoji} ${caption}\n\n📍 ${location}\n\n${hashtags}\n\n#${businessName.replace(/\s+/g, "")}`;
}

function generateHashtags(vibe: string, location: string): string {
  const base = ["#Greece", "#GreekHospitality", "#Travel", "#VacationRental", "#Staycation"];

  const vibeHashtags: Record<string, string[]> = {
    Luxury: ["#LuxuryStay", "#HighEnd", "#Exclusive", "#Prestige"],
    "Family-friendly": ["#FamilyVacation", "#KidFriendly", "#FamilyTravel"],
    Romantic: ["#RomanticGetaway", "#CoupleGoals", "#HoneymoonDestination"],
    Rustic: ["#RusticCharm", "#AuthenticGreece", "#TraditionalStyle"],
    Modern: ["#ModernDesign", "#ContemporaryStyle", "#DesignerHome"],
    Boho: ["#BohoStyle", "#FreeSpirit", "#NaturalLiving"],
    Minimalist: ["#MinimalistDesign", "#LessIsMore", "#CleanAesthetic"],
  };

  const locationTags = location
    .split(",")
    .map((l) => `#${l.trim().replace(/\s+/g, "")}`)
    .slice(0, 2);

  return [...base, ...(vibeHashtags[vibe] ?? []), ...locationTags].join(" ");
}

// ── Post to Instagram via Graph API ───────────────────────────────────────
export async function postToInstagramFeed(
  caption: string,
  imageUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const credentials = await getInstagramCredentials();
  if (!credentials) {
    return { success: false, error: "Instagram not connected." };
  }

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: credentials.accessToken,
        }),
      }
    );

    if (!containerRes.ok) {
      const err = await containerRes.json();
      throw new Error(err.error?.message ?? "Failed to create media container");
    }

    const { id: creationId } = await containerRes.json();

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: credentials.accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.json();
      throw new Error(err.error?.message ?? "Failed to publish post");
    }

    const { id: postId } = await publishRes.json();

    // Step 3: Save post record to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("instagram_posts").insert({
        user_id: user.id,
        post_id: postId,
        caption,
        image_url: imageUrl,
        posted_at: new Date().toISOString(),
      });
    }

    return { success: true, postId };
  } catch (err) {
    console.error("Instagram post error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Fetch Instagram insights ───────────────────────────────────────────────
export async function getInstagramInsights(plan: string) {
  const credentials = await getInstagramCredentials();
  if (!credentials) return null;

  try {
    // Basic: follower count + recent media count
    const accountRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}?fields=followers_count,media_count,username&access_token=${credentials.accessToken}`
    );
    const account = await accountRes.json();

    if (plan === "starter" || plan === "free") {
      return { basic: account };
    }

    // Pro: add reach + impressions from last 30 days
    const insightsRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/insights?metric=reach,impressions,profile_views&period=day&since=${Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)}&until=${Math.floor(Date.now() / 1000)}&access_token=${credentials.accessToken}`
    );
    const insights = await insightsRes.json();

    if (plan === "pro") {
      return { basic: account, insights: insights.data };
    }

    // Max: also fetch top media
    const mediaRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/media?fields=id,caption,like_count,comments_count,timestamp,media_url,permalink&limit=9&access_token=${credentials.accessToken}`
    );
    const media = await mediaRes.json();

    return { basic: account, insights: insights.data, topMedia: media.data };
  } catch (err) {
    console.error("Instagram insights error:", err);
    return null;
  }
}

// ── OAuth URL ──────────────────────────────────────────────────────────────
export function getInstagramOAuthUrl(redirectUri: string): string {
  const clientId = import.meta.env.VITE_INSTAGRAM_APP_ID;
  if (!clientId) throw new Error("Instagram App ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights",
    response_type: "code",
  });

  return `https://api.instagram.com/oauth/authorize?${params}`;
}