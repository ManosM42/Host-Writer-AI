import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, X, Image as ImageIcon } from "lucide-react";

export type FormValues = {
  businessName: string;
  businessType: "Villa" | "Apartment" | "Tavern" | "Restaurant" | "Boutique Hotel";
  location: string;
  features: string;
  vibe: "Luxury" | "Family-friendly" | "Romantic" | "Rustic" | "Modern";
  audience: "International tourists" | "Greek travelers" | "Both";
  language: "English only" | "Greek only" | "Both EN + GR";
  photos?: string[]; // base64 encoded images
};

const initial: FormValues = {
  businessName: "",
  businessType: "Villa",
  location: "",
  features: "",
  vibe: "Luxury",
  audience: "International tourists",
  language: "English only",
  photos: [],
};

export function GenerateForm({
  onSubmit,
  loading,
  defaultValues,
}: {
  onSubmit: (v: FormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}) {
  const [v, setV] = useState<FormValues>({ ...initial, ...defaultValues });
  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large. Max 5MB per image.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        setV(s => ({ ...s, photos: [...(s.photos || []), base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setV(s => ({ ...s, photos: (s.photos || []).filter((_, i) => i !== idx) }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.businessName.trim() || !v.location.trim() || !v.features.trim()) return;
    onSubmit(v);
  };

  return (
    <form onSubmit={submit} className="card-luxury rounded-2xl p-6 sm:p-8 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80 mb-2">
          <Sparkles className="size-3.5" /> Your Marketing Pack
        </div>
        <h2 className="font-display text-2xl sm:text-3xl">Tell us about your business</h2>
        <p className="text-sm text-muted-foreground mt-1">One form, one click, a complete pack in seconds.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" required maxLength={120} value={v.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Villa Aegean Pearl" />
        </div>
        <div className="space-y-1.5">
          <Label>Business type</Label>
          <Select value={v.businessType} onValueChange={(x) => set("businessType", x as FormValues["businessType"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Villa", "Apartment", "Tavern", "Restaurant", "Boutique Hotel"] as const).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="loc">Location in Greece</Label>
          <Input id="loc" required maxLength={120} value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="Oia, Santorini" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="feat">Key features</Label>
          <Textarea id="feat" required maxLength={2000} rows={4} value={v.features} onChange={(e) => set("features", e.target.value)} placeholder="Caldera sea view, private infinity pool, sleeps 6, adults only, walking distance to sunset spot..." />
        </div>
        <div className="space-y-1.5">
          <Label>Vibe / style</Label>
          <Select value={v.vibe} onValueChange={(x) => set("vibe", x as FormValues["vibe"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Luxury", "Family-friendly", "Romantic", "Rustic", "Modern"] as const).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Target audience</Label>
          <Select value={v.audience} onValueChange={(x) => set("audience", x as FormValues["audience"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["International tourists", "Greek travelers", "Both"] as const).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Language output</Label>
          <Select value={v.language} onValueChange={(x) => set("language", x as FormValues["language"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["English only", "Greek only", "Both EN + GR"] as const).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="photos">Photos (optional, for AI-powered Instagram posts)</Label>
          <div className="border-2 border-dashed border-gold/30 rounded-lg p-4 text-center hover:border-gold/60 transition-colors cursor-pointer">
            <input
              id="photos"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label htmlFor="photos" className="cursor-pointer block">
              <ImageIcon className="size-6 text-gold/60 mx-auto mb-2" />
              <p className="text-sm text-gold/80">Click to upload images (max 5 per pack, 5MB each)</p>
              <p className="text-xs text-muted-foreground mt-1">AI will analyze them to create visual Instagram posts</p>
            </label>
          </div>
          {(v.photos || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {v.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 text-base gradient-gold text-background font-medium glow-gold hover:opacity-95 transition-opacity"
      >
        <Sparkles className="size-4 mr-2" />
        {loading ? "Crafting your pack…" : "Generate Full Marketing Pack"}
      </Button>
    </form>
  );
}