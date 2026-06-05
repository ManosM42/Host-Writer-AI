import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getInstagramCredentials, saveInstagramCredentials } from "@/lib/instagram.service";

export function ConnectInstagramDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}) {
  const [step, setStep] = useState<"intro" | "connecting" | "success">("intro");
  const [manualMode, setManualMode] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [username, setUsername] = useState("");

  const handleManualConnect = async () => {
    if (!accessToken.trim() || !accountId.trim() || !username.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await saveInstagramCredentials({
        accessToken,
        instagramBusinessAccountId: accountId,
        instagramUsername: username,
      });
      setStep("success");
      toast.success("Instagram connected! ✓");
      setTimeout(() => {
        onOpenChange(false);
        onConnected?.();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    }
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
              <p className="text-sm text-foreground">
                📸 To post directly to Instagram, you need:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4">
                <li>• Instagram Business Account (not personal)</li>
                <li>• Meta App with Instagram permissions</li>
                <li>• Access token with publishing rights</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full h-11 gradient-gold text-background font-medium"
                onClick={() => {
                  window.open(
                    "https://developers.facebook.com/docs/instagram-api/getting-started",
                    "_blank"
                  );
                }}
              >
                <ExternalLink className="size-4 mr-2" /> Get Setup Guide
              </Button>

              <Button
                variant="outline"
                className="w-full border-gold/40 text-gold hover:bg-gold/10"
                onClick={() => setManualMode(true)}
              >
                <Sparkles className="size-4 mr-2" /> I have credentials
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Already have an access token? Paste it below.
            </p>
          </div>
        )}

        {step === "intro" && manualMode && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="IGAB_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                From your Meta App Dashboard → Tokens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">Instagram Business Account ID</Label>
              <Input
                id="accountId"
                placeholder="17841400..."
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Instagram Username</Label>
              <Input
                id="username"
                placeholder="your_business_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setManualMode(false);
                  setAccessToken("");
                  setAccountId("");
                  setUsername("");
                }}
              >
                Back
              </Button>
              <Button className="flex-1 gradient-gold text-background" onClick={handleManualConnect}>
                Connect Account
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6 space-y-3">
            <div className="size-12 rounded-full gradient-gold mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6 text-background" />
            </div>
            <h3 className="font-display text-xl">Connected!</h3>
            <p className="text-sm text-muted-foreground">
              You can now post directly to Instagram from HostWriter
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
