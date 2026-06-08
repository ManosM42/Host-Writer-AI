import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL")!;

// The redirect URI must exactly match what's registered in your Instagram app dashboard
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth`;

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // Supabase JWT passed from frontend

  // Handle direct visits or missing params gracefully
  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: "Missing code or state. This endpoint is an OAuth callback." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Verify the JWT (passed as state) and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    if (authError || !user) {
      throw new Error("Invalid or expired session. Please reconnect.");
    }

    // 2. Exchange the code for a short-lived access token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error_type) {
      throw new Error(`Instagram token error: ${tokenData.error_message}`);
    }

    const shortToken: string = tokenData.access_token;
    const igUserId: string = String(tokenData.user_id);

    // 3. Exchange short-lived token for a long-lived token (valid 60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    if (longTokenData.error) {
      throw new Error(`Long-lived token error: ${longTokenData.error.message}`);
    }

    const longToken: string = longTokenData.access_token;

    // 4. Fetch Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/v20.0/${igUserId}?fields=username&access_token=${longToken}`
    );
    const profile = await profileRes.json();
    if (profile.error) {
      throw new Error(`Profile fetch error: ${profile.error.message}`);
    }

    // 5. Save (or update) the integration in your database
    const { error: dbError } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        platform: "instagram",
        access_token: longToken,
        account_id: igUserId,
        account_username: profile.username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 6. Redirect to dashboard with success
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/dashboard?ig=connected` },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Instagram OAuth error:", message);

    // Redirect to dashboard with error message
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${SITE_URL}/dashboard?ig=error&message=${encodeURIComponent(message)}`,
      },
    });
  }
});