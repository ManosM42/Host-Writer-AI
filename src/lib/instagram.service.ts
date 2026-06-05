import { supabase } from "@/integrations/supabase/client";

export type InstagramCredentials = {
  accessToken: string;
  instagramBusinessAccountId: string;
  instagramUsername: string;
};

// Save Instagram credentials for user (stored in Supabase)
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

// Get saved Instagram credentials
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

// Format caption beautifully with emojis and hashtags
export function formatInstagramCaption(
  caption: string,
  businessName: string,
  location: string,
  vibe: string
): string {
  // Get emoji based on vibe
  const vibe_emoji: Record<string, string> = {
    Luxury: "✨",
    "Family-friendly": "👨‍👩‍👧‍👦",
    Romantic: "💕",
    Rustic: "🌾",
    Modern: "🏢",
  };

  const emoji = vibe_emoji[vibe] || "✨";

  // Build hashtags based on vibe and location
  const hashtags = generateHashtags(vibe, location);

  // Format the caption
  return `${emoji} ${caption}

📍 ${location}

${hashtags}

#${businessName.replace(/\s+/g, "")}`;
}

// Generate relevant hashtags
function generateHashtags(vibe: string, location: string): string {
  const baseHashtags = [
    "#Greece",
    "#GreekHospitality",
    "#Travel",
    "#VacationRental",
    "#Staycation",
  ];

  const vibeHashtags: Record<string, string[]> = {
    Luxury: ["#LuxuryStay", "#HighEnd", "#Exclusive", "#Prestige"],
    "Family-friendly": ["#FamilyVacation", "#KidFriendly", "#FamilyTravel"],
    Romantic: ["#RomanticGetaway", "#CoupleGoals", "#HoneymoonDestination"],
    Rustic: ["#RusticCharm", "#AuthenticGreece", "#TraditionalStyle"],
    Modern: ["#ModernDesign", "#ContemporaryStyle", "#DesignerHome"],
  };

  const locationHashtags = location
    .split(",")
    .map((loc) => `#${loc.trim().replace(/\s+/g, "")}`)
    .slice(0, 2);

  const selected = [
    ...baseHashtags,
    ...(vibeHashtags[vibe] || []),
    ...locationHashtags,
  ];

  return selected.join(" ");
}

// Post to Instagram Feed using Graph API
export async function postToInstagramFeed(
  caption: string,
  imageUrl: string, // URL of the image
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const credentials = await getInstagramCredentials();
  if (!credentials) {
    return { success: false, error: "Instagram not connected. Connect your account first." };
  }

  try {
    // Step 1: Create media container
    const mediaCreateRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: credentials.accessToken,
        }),
      }
    );

    if (!mediaCreateRes.ok) {
      const err = await mediaCreateRes.json();
      throw new Error(err.error?.message || "Failed to create media");
    }

    const mediaData = await mediaCreateRes.json();
    const mediaId = mediaData.id;

    // Step 2: Publish the media
    const publishRes = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.instagramBusinessAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaId,
          access_token: credentials.accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.json();
      throw new Error(err.error?.message || "Failed to publish post");
    }

    const publishData = await publishRes.json();

    return {
      success: true,
      postId: publishData.id,
    };
  } catch (error) {
    console.error("Instagram posting error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post to Instagram",
    };
  }
}

// Get Instagram OAuth URL for user to connect account
export function getInstagramOAuthUrl(redirectUri: string): string {
  const clientId = import.meta.env.VITE_INSTAGRAM_APP_ID;
  if (!clientId) throw new Error("Instagram App ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic,instagram_business_content_publish",
    response_type: "code",
  });

  return `https://api.instagram.com/oauth/authorize?${params}`;
}
