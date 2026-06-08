import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL")!;

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // JWT token passed from frontend
  const redirectUri = `${SUPABASE_URL}/functions/v1/instagram-oauth`;

  if (!code || !state) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), { status: 400 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    if (authError || !user) throw new Error("Invalid or expired session. Please try again.");

    // 2. Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error_type) throw new Error(tokenData.error_message);

    const shortToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // 3. Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    if (longTokenData.error) throw new Error(longTokenData.error.message);

    const longToken = longTokenData.access_token;

    // 4. Get Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/v20.0/${igUserId}?fields=username&access_token=${longToken}`
    );
    const profile = await profileRes.json();
    if (profile.error) throw new Error(profile.error.message);

    // 5. Save to user_integrations
    const { error: dbError } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        platform: "instagram",
        access_token: longToken,
        account_id: String(igUserId),
        account_username: profile.username,
      },
      { onConflict: "user_id,platform" }
    );
    if (dbError) throw new Error(dbError.message);

    // 6. Redirect back to dashboard
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/dashboard?ig=connected` },
    });
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    // Redirect to dashboard with error so user sees feedback
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/dashboard?ig=error&message=${encodeURIComponent(err.message)}` },
    });
  }
});