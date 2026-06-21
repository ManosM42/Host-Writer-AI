import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Instagram } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Σιγουρευόμαστε ότι τραβάμε σωστά το Supabase URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function ConnectInstagramDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}) {
  const [step, setStep] = useState<"intro" | "success">("intro");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ig") === "connected") {
      setStep("success");
      onConnected?.();
    } else if (url.searchParams.get("ig") === "error") {
      const msg = url.searchParams.get("message") ?? "Connection failed";
      toast.error(msg);
    }
    if (url.searchParams.has("ig")) {
      url.searchParams.delete("ig");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleOAuthConnect = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in first");
      return;
    }

    // 1. Το endpoint της Supabase που ΠΡΕΠΕΙ να χτυπήσει η Meta
    const redirectUri = `${SUPABASE_URL}/functions/v1/instagram-oauth`;

    // 2. Το App ID σου (Hardcoded για ασφάλεια)
    const appId = "1504992394453563";

    // 3. Τα απαραίτητα permissions για να διαβάζεις σελίδες και να κάνεις post στο Instagram
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement"
    ].join(",");

    // 4. Χτίσιμο του επίσημου Facebook OAuth URL (Από εδώ παίρνουμε τα σωστά tokens)
    const oauthUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");
    oauthUrl.searchParams.set("client_id", appId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("response_type", "code");
    
    // Περνάμε το Supabase session token στο 'state' για να ξέρει το Edge Function ποιος χρήστης είσαι
    oauthUrl.searchParams.set("state", session.access_token);

    console.log("Redirecting to Meta OAuth via URL:", oauthUrl.toString());

    // Ανακατεύθυνση στη Meta
    window.location.href = oauthUrl.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-luxury border-gold/30">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Connect Instagram</DialogTitle>
          <DialogDescription>
            Post your marketing content directly to Instagram
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gold/5 border border-gold/20 p-4">
              <p className="text-sm text-muted-foreground">
                Συνδέσου με τον Instagram Business λογαριασμό σου με ένα κλικ.
                Δεν χρειάζεται να αντιγράψεις tokens.
              </p>
            </div>

            <Button
              className="w-full h-12 gradient-gold text-background font-medium text-base"
              onClick={handleOAuthConnect}
            >
              <Instagram className="size-5 mr-2" />
              Connect with Instagram
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Θα ανακατευθυνθείς στο Facebook/Instagram για να εγκρίνεις τα permissions.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6 space-y-3">
            <div className="size-12 rounded-full gradient-gold mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6 text-background" />
            </div>
            <h3 className="font-display text-xl">Connected!</h3>
            <p className="text-sm text-muted-foreground">
              Μπορείς τώρα να κάνεις post απευθείας στο Instagram από το MedierAI
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}