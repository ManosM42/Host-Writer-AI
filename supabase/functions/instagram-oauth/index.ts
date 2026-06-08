import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ✅ Hardcoded — το σωστό production URL
const SITE_URL = "https://host-writer-demo.vercel.app";
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth`;

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return Response.redirect(
      `${SITE_URL}/dashboard?ig=error&message=${encodeURIComponent("Missing code or state.")}`,
      302
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Verify user JWT from state
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    if (authError || !user) throw new Error("Invalid or expired session.");

    // 2. Exchange code for Facebook access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        })
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(`Token error: ${tokenData.error.message}`);

    const fbToken: string = tokenData.access_token;

    // 3. Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${fbToken}`
    );
    const pagesData = await pagesRes.json();
    if (pagesData.error) throw new Error(`Pages error: ${pagesData.error.message}`);

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error(
        "No Facebook Pages found. Make sure your account manages at least one Page."
      );
    }

    // 4. Find the Instagram Business Account connected to a Page
    let igAccountId: string | null = null;
    let igUsername: string | null = null;
    let pageToken: string | null = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(
        `https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        igAccountId = igData.instagram_business_account.id;
        pageToken = page.access_token;

        // 5. Get Instagram username
        const profileRes = await fetch(
          `https://graph.facebook.com/v20.0/${igAccountId}?fields=username&access_token=${pageToken}`
        );
        const profile = await profileRes.json();
        igUsername = profile.username ?? null;
        break;
      }
    }

    if (!igAccountId || !pageToken) {
      throw new Error(
        "No Instagram Business account found. Make sure your Instagram is connected to a Facebook Page."
      );
    }

    // 6. Save to database
    const { error: dbError } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        platform: "instagram",
        access_token: pageToken,
        account_id: igAccountId,
        account_username: igUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 7. Redirect back to dashboard ✅
    return Response.redirect(`${SITE_URL}/dashboard?ig=connected`, 302);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Instagram OAuth error:", message);
    return Response.redirect(
      `${SITE_URL}/dashboard?ig=error&message=${encodeURIComponent(message)}`,
      302
    );
  }
});