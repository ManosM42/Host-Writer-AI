import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  getInstagramCredentials,
  formatInstagramCaption,
  postToInstagramFeed,
} from "@/lib/instagram.service";

export function PostToInstagramDialog({
  open,
  onOpenChange,
  caption,
  businessName,
  location,
  vibe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: string;
  businessName: string;
  location: string;
  vibe: string;
}) {
  const [step, setStep] = useState<"prepare" | "image" | "posting" | "success">("prepare");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [postId, setPostId] = useState<string>("");

  const formattedCaption = formatInstagramCaption(caption, businessName, location, vibe);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handlePost = async () => {
    // Check if user has Instagram connected
    const credentials = await getInstagramCredentials();
    if (!credentials) {
      toast.error("Connect your Instagram account first");
      onOpenChange(false);
      return;
    }

    if (!imagePreview) {
      toast.error("Please select or provide an image");
      return;
    }

    setLoading(true);
    setStep("posting");

    try {
      // If using file, would need to upload to a CDN first (e.g., Supabase storage)
      // For now, we'll use the imageUrl directly
      const result = await postToInstagramFeed(formattedCaption, imagePreview);

      if (result.success) {
        setPostId(result.postId || "posted");
        setStep("success");
        toast.success("✨ Posted to Instagram!");
      } else {
        throw new Error(result.error || "Failed to post");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post to Instagram");
      setStep("image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-luxury border-gold/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">📸 Post to Instagram</DialogTitle>
        </DialogHeader>

        {step === "prepare" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gold/80">Caption</Label>
              <Textarea
                value={formattedCaption}
                readOnly
                className="min-h-[150px] text-sm bg-surface border-gold-soft/50"
              />
              <p className="text-xs text-muted-foreground text-right">
                {formattedCaption.length} characters (Instagram limit: 2,200)
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-gold text-background"
                onClick={() => setStep("image")}
              >
                <Sparkles className="size-4 mr-2" /> Next: Add Image
              </Button>
            </div>
          </div>
        )}

        {step === "image" && (
          <div className="space-y-4">
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border border-gold/20"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImageFile(null);
                    setImageUrl("");
                    setImagePreview("");
                  }}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="ig-image"
                  />
                  <label htmlFor="ig-image" className="cursor-pointer block">
                    <ImageIcon className="size-8 text-gold/60 mx-auto mb-2" />
                    <p className="text-sm text-gold/80">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">Min 1080x1080px, max 10MB</p>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gold-soft/30" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-background text-muted-foreground">Or paste URL</span>
                  </div>
                </div>

                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  className="bg-surface border-gold-soft/50"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("prepare")}
              >
                Back
              </Button>
              <Button
                className="flex-1 gradient-gold text-background"
                disabled={!imagePreview || loading}
                onClick={handlePost}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" /> Post to Instagram
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "posting" && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="size-8 text-gold animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Publishing to Instagram...</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8 space-y-4">
            <div className="size-12 rounded-full gradient-gold mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6 text-background" />
            </div>
            <div>
              <h3 className="font-display text-xl">Posted!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your post is now live on Instagram
              </p>
            </div>
            <Button
              className="w-full gradient-gold text-background"
              onClick={() => {
                onOpenChange(false);
                setStep("prepare");
                setImagePreview("");
                setImageUrl("");
                setImageFile(null);
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
