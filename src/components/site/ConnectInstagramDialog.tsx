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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      // Αν βρούμε κώδικα από τη Meta στο URL, τον στέλνουμε εμείς χειροκίνητα στη Supabase!
      if (code && state) {
        setLoading(true);
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          
          // Καλούμε το Edge Function απευθείας από το frontend
          const response = await fetch(`${supabaseUrl}/functions/v1/instagram-oauth?code=${code}&state=${state}`);
          
          if (!response.ok) {
            throw new Error("Failed to exchange token via Supabase");
          }

          setStep("success");
          toast.success("Instagram connected successfully!");
          onConnected?.();
        } catch (err: any) {
          console.error(err);
          toast.error("Σφάλμα κατά την αποθήκευση στη βάση δεδομένων.");
        } finally {
          setLoading(false);
          // Καθαρίζουμε το URL
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState({}, "", url.toString());
        }
      }
    };

    handleCallback();
  }, []);

  const handleOAuthConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in first");
      return;
    }

    const appId = "1504992394453563";
    
    // ⚡ Η ΑΛΛΑΓΗ: Η Meta σε γυρίζει πλέον στο VERCEL, όχι στη Supabase
    const redirectUri = "https://host-writer-demo.vercel.app/dashboard";

    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement"
    ].join(",");

    const oauthUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");
    oauthUrl.searchParams.set("client_id", appId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("state", session.access_token);

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
              </p>
            </div>

            <Button
              className="w-full h-12 gradient-gold text-background font-medium text-base"
              onClick={handleOAuthConnect}
              disabled={loading}
            >
              <Instagram className="size-5 mr-2" />
              {loading ? "Connecting..." : "Connect with Instagram"}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6 space-y-3">
            <div className="size-12 rounded-full gradient-gold mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6 text-background" />
            </div>
            <h3 className="font-display text-xl">Connected!</h3>
            <p className="text-sm text-muted-foreground">
              Μπορείς τώρα να κάνεις post απευθείας στο Instagram!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}