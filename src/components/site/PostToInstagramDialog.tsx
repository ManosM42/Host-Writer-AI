import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Image as ImageIcon, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  getInstagramCredentials,
  formatInstagramCaption,
  postToInstagramFeed,
  uploadImageForInstagram,
} from "@/lib/instagram.service";

type Step = "prepare" | "image" | "posting" | "success";

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
  const [step, setStep] = useState<Step>("prepare");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [postId, setPostId] = useState("");

  const formattedCaption = formatInstagramCaption(caption, businessName, location, vibe);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      return;
    }
    setImageFile(file);
    setImageUrl("");
    const reader = new FileReader();
    reader.onload = (evt) => setImagePreview(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (url: string) => {
    setImageUrl(url);
    setImageFile(null);
    setImagePreview(url);
  };

  const reset = () => {
    setStep("prepare");
    setImageFile(null);
    setImageUrl("");
    setImagePreview("");
    setPostId("");
  };

  const handlePost = async () => {
    const credentials = await getInstagramCredentials();
    if (!credentials) {
      toast.error("Connect your Instagram account first (sidebar → Connect Instagram)");
      onOpenChange(false);
      return;
    }

    if (!imageFile && !imageUrl) {
      toast.error("Please select or provide an image");
      return;
    }

    setLoading(true);
    setStep("posting");

    try {
      let finalUrl = imageUrl;

      // If file selected → upload to Supabase Storage first
      if (imageFile) {
        toast.info("Uploading image...");
        finalUrl = await uploadImageForInstagram(imageFile);
      }

      toast.info("Publishing to Instagram...");
      const result = await postToInstagramFeed(formattedCaption, finalUrl);

      if (result.success) {
        setPostId(result.postId ?? "posted");
        setStep("success");
        toast.success("✨ Posted to Instagram!");
      } else {
        throw new Error(result.error ?? "Failed to post");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post to Instagram");
      setStep("image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="card-luxury border-gold/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">📸 Post to Instagram</DialogTitle>
        </DialogHeader>

        {/* Step 1 — caption review */}
        {step === "prepare" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gold/80">Caption preview</Label>
              <Textarea
                value={formattedCaption}
                readOnly
                rows={8}
                className="text-sm bg-surface border-gold-soft/50 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {formattedCaption.length} / 2,200 characters
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button className="flex-1 gradient-gold text-background" onClick={() => setStep("image")}>
                <Sparkles className="size-4 mr-2" /> Next: Add Image
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — image selection */}
        {step === "image" && (
          <div className="space-y-4">
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border border-gold/20"
                  onError={() => setImagePreview("")}
                />
                <Button variant="outline" className="w-full border-gold/30 text-muted-foreground"
                  onClick={() => { setImageFile(null); setImageUrl(""); setImagePreview(""); }}>
                  Change image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="ig-image"
                  className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold/60 transition-colors block">
                  <input id="ig-image" type="file" accept="image/*"
                    onChange={handleFileSelect} className="hidden" />
                  <ImageIcon className="size-8 text-gold/60 mx-auto mb-2" />
                  <p className="text-sm text-gold/80">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 1080×1080px · Max 10MB · JPG or PNG
                  </p>
                </label>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-gold-soft/30" />
                  <span className="text-xs text-muted-foreground">or paste URL</span>
                  <div className="flex-1 border-t border-gold-soft/30" />
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
              <Button variant="outline" className="flex-1" onClick={() => setStep("prepare")}>Back</Button>
              <Button
                className="flex-1 gradient-gold text-background"
                disabled={(!imageFile && !imageUrl) || loading}
                onClick={handlePost}
              >
                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Uploading...</> :
                  <><Sparkles className="size-4 mr-2" /> Post to Instagram</>}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — posting */}
        {step === "posting" && (
          <div className="text-center py-12 space-y-4">
            <div className="relative size-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-gold/20" />
              <div className="absolute inset-0 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">📸</div>
            </div>
            <p className="text-sm text-muted-foreground">Publishing to Instagram...</p>
            <p className="text-xs text-muted-foreground/60">This may take a few seconds</p>
          </div>
        )}

        {/* Step 4 — success */}
        {step === "success" && (
          <div className="text-center py-10 space-y-5">
            <div className="size-14 rounded-full gradient-gold mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-7 text-background" />
            </div>
            <div>
              <h3 className="font-display text-2xl">Posted! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">Your post is now live on Instagram.</p>
            </div>
            {postId && postId !== "posted" && (
              <a
                href={`https://www.instagram.com/p/${postId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                <ExternalLink className="size-3" /> View on Instagram
              </a>
            )}
            <Button className="w-full gradient-gold text-background" onClick={() => { reset(); onOpenChange(false); }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}