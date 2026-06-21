import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Διαχείριση CORS για να επιτρέπεται η κλήση από το Vercel frontend
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateToken = url.searchParams.get('state') 
  const errorReason = url.searchParams.get('error')

  if (errorReason || !code || !stateToken) {
    const reason = url.searchParams.get('error_description') || "Authentication canceled"
    return new Response(JSON.stringify({ error: reason }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Ταυτοποίηση του χρήστη μέσω του state token (access token)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(stateToken)
    if (authError || !user) throw new Error("Could not verify your Supabase session context.")

    const appId = "1504992394453563" 
    const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET')

    if (!appSecret) {
      throw new Error("INSTAGRAM_APP_SECRET is missing from Supabase environment variables.")
    }

    // ⚡ ΚΡΙΣΙΜΟ: Το redirect_uri εδώ πρέπει να είναι το VERCEL URL, 
    // γιατί αυτό χρησιμοποιήθηκε για να παραχθεί ο κώδικας στη Meta!
    const redirectUriForMeta = "https://host-writer-demo.vercel.app/dashboard"

    // 1. Ανταλλαγή code με Short-Lived Token
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUriForMeta,
      code: code
    })

    const exchangeRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${tokenParams.toString()}`)
    const tokenData = await exchangeRes.json()
    if (tokenData.error) throw new Error(`Meta short token error: ${tokenData.error.message}`)

    const shortToken = tokenData.access_token

    // 2. Αναβάθμιση σε Long-Lived Access Token (60 ημέρες)
    const longLivedParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken
    })

    const longRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${longLivedParams.toString()}`)
    const longData = await longRes.json()
    if (longData.error) throw new Error(`Meta long token error: ${longData.error.message}`)
    
    const longToken = longData.access_token

    // 3. Εύρεση του συνδεδεμένου Instagram Business Account
    const accountsRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${longToken}`)
    const accountsData = await accountsRes.json()
    if (accountsData.error) throw new Error(`Facebook page query error: ${accountsData.error.message}`)
    
    let instagramBusinessId = null
    let instagramUsername = "Connected Business Account"

    for (const page of accountsData.data || []) {
      const igRes = await fetch(`https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`)
      const igData = await igRes.json()
      if (igData.instagram_business_account?.id) {
        instagramBusinessId = igData.instagram_business_account.id
        
        const usernameRes = await fetch(`https://graph.facebook.com/v20.0/${instagramBusinessId}?fields=username&access_token=${longToken}`)
        const usernameData = await usernameRes.json()
        instagramUsername = usernameData.username || instagramUsername
        break
      }
    }

    if (!instagramBusinessId) {
      throw new Error("No Instagram Business account found linked to your Facebook page.")
    }

    // 4. Αποθήκευση στη βάση δεδομένων
    const { error: dbError } = await supabaseClient
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        platform: "instagram",
        access_token: longToken,
        account_id: instagramBusinessId,
        account_username: instagramUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,platform" })

    if (dbError) throw dbError

    // Επιστρέφουμε JSON επιτυχίας στο frontend αντί για redirect
    return new Response(JSON.stringify({ success: true, username: instagramUsername }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error("OAuth edge handler crashed:", error)
    return new Response(JSON.stringify({ error: error.message || "Unknown internal failure" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})