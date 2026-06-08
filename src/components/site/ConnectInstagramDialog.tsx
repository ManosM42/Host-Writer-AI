import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Instagram } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramOAuthUrl } from "@/lib/instagram.service";

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in first");
      return;
    }

    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-oauth`;
    const oauthUrl = getInstagramOAuthUrl(redirectUri);

    const url = new URL(oauthUrl);
    url.searchParams.set("state", session.access_token);

    window.location.href = url.toString();
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
                Συνδέσου με τον Instagram Business λογαριασμό σου με ένα κλικ. Δεν χρειάζεται να αντιγράψεις tokens.
              </p>
            </div>

            <Button
              className="w-full h-12 gradient-gold text-background font-medium text-base"
              onClick={handleOAuthConnect}
            >
              <Instagram className="size-5 mr-2" /> Connect with Instagram
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Θα ανακατευθυνθείς στο Instagram για να εγκρίνεις τα permissions.
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