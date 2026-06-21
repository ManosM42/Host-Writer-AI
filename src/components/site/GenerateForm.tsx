import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sparkles, X, Image as ImageIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Comprehensive Business Configuration for the Greek Market
export type BusinessConfig = {
  id: string;
  label: string;
  category: "Hospitality & Gastro" | "Retail & E-commerce" | "Services & Professionals" | "Health, Wellness & Beauty";
  isTrending?: boolean;
  placeholderFeatures: string;
  defaultVibe: string;
  defaultAudience: string;
};

const ALL_BUSINESS_TYPES: BusinessConfig[] = [
  // Hospitality & Gastro
  { id: "villa", label: "Luxury Villa / Accommodation", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Private infinity pool, Caldera sunset view, adults-only, complimentary airport transfer...", defaultVibe: "Luxury", defaultAudience: "International tourists" },
  { id: "hotel", label: "Boutique Hotel", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Central location, organic traditional breakfast, rooftop cocktail bar, wellness packages...", defaultVibe: "Modern", defaultAudience: "Both" },
  { id: "tavern", label: "Traditional Greek Tavern", category: "Hospitality & Gastro", isTrending: false, placeholderFeatures: "Live acoustic music, authentic local recipes, cozy courtyard, locally sourced meats...", defaultVibe: "Rustic", defaultAudience: "Both" },
  { id: "restaurant", label: "Modern Restaurant / Fine Dining", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Greek-fusion cuisine, curated wine pairing list, romantic seaside seating...", defaultVibe: "Romantic", defaultAudience: "Both" },
  { id: "cafe_bar", label: "Café / All-Day Bar / Beach Bar", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Specialty coffee blends, signature mixology, live DJ sets, waterfront sunbeds...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  
  // Retail & E-commerce
  { id: "eshop_fashion", label: "Fashion E-shop (Clothing/Shoes)", category: "Retail & E-commerce", isTrending: true, placeholderFeatures: "Free shipping over €50, designed in Greece, sustainable linen fabrics, next-day delivery...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  { id: "jewelry", label: "Jewelry Store / Atelier", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Handcrafted fine jewelry, 925 sterling silver, custom bridal designs, premium packaging...", defaultVibe: "Luxury", defaultAudience: "All / Broad" },
  { id: "cosmetics", label: "Cosmetics & Skincare Store", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Organic Mediterranean ingredients, vegan & cruelty-free, personalized skin routines...", defaultVibe: "Minimal / Clean", defaultAudience: "Local Greek community" },
  { id: "concept_store", label: "Concept Store / Gift Shop", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Curated minimal aesthetics, local Greek designers, eco-friendly homeware...", defaultVibe: "Minimal / Clean", defaultAudience: "Both" },
  
  // Services & Professionals
  { id: "real_estate", label: "Real Estate Agency", category: "Services & Professionals", isTrending: true, placeholderFeatures: "Golden Visa investment experts, premium commercial spaces, luxury villas in Cyclades...", defaultVibe: "Professional", defaultAudience: "International tourists" },
  { id: "car_rental", label: "Car & Yacht Rentals", category: "Services & Professionals", isTrending: false, placeholderFeatures: "No credit card deposit required, free airport delivery, 24/7 roadside assistance...", defaultVibe: "Professional", defaultAudience: "International tourists" },
  { id: "law_accounting", label: "Law / Accounting Firm", category: "Services & Professionals", isTrending: false, placeholderFeatures: "Corporate tax optimization, cross-border legal compliance, rapid digital response...", defaultVibe: "Professional", defaultAudience: "Local Greek community" },
  { id: "education", label: "Educational Center / Private Tutoring", category: "Services & Professionals", isTrending: false, placeholderFeatures: "Interactive learning models, native speaking instructors, exam prep guarantees...", defaultVibe: "Family-friendly", defaultAudience: "Local Greek community" },

  // Health, Wellness & Beauty
  { id: "hair_salon", label: "Hair & Beauty Salon / Barber Shop", category: "Health, Wellness & Beauty", isTrending: true, placeholderFeatures: "Balayage and color correction experts, premium hair treatments, urban luxury vibe...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  { id: "gym", label: "Gym / CrossFit / Pilates Studio", category: "Health, Wellness & Beauty", isTrending: true, placeholderFeatures: "Personal training modules, high-end equipment, small group reformer classes...", defaultVibe: "Modern", defaultAudience: "Local Greek community" },
  { id: "dental", label: "Dental Clinic / Medical Practice", category: "Health, Wellness & Beauty", isTrending: false, placeholderFeatures: "Painless laser dentistry, cosmetic smile design, state-of-the-art diagnostic tech...", defaultVibe: "Professional", defaultAudience: "Local Greek community" },
  { id: "spa", label: "Spa Center / Massage Therapy", category: "Health, Wellness & Beauty", isTrending: false, placeholderFeatures: "Holistic aromatherapy, thermal baths, couples relaxation packages...", defaultVibe: "Romantic", defaultAudience: "All / Broad" },
];

export type FormValues = {
  businessName: string;
  businessTypeId: string;
  location: string;
  features: string;
  vibe: "Luxury" | "Family-friendly" | "Romantic" | "Rustic" | "Modern" | "Professional" | "Minimal / Clean" | "Trendy";
  audience: "International tourists" | "Greek travelers" | "Local Greek community" | "All / Broad";
  language: "English only" | "Greek only" | "Both EN + GR";
  photos?: string[];
};

const initial: FormValues = {
  businessName: "",
  businessTypeId: "villa",
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
  const [openCombo, setOpenCombo] = useState(false);

  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  // Find the currently selected business configuration to inject dynamic fields
  const currentBiz = ALL_BUSINESS_TYPES.find((b) => b.id === v.businessTypeId) || ALL_BUSINESS_TYPES[0];

  const handleBusinessSelect = (id: string) => {
    const selected = ALL_BUSINESS_TYPES.find((b) => b.id === id);
    if (!selected) return;

    // Smart auto-setup: adjust vibe and target audience dynamically based on industry defaults
    setV((s) => ({
      ...s,
      businessTypeId: id,
      vibe: selected.defaultVibe as FormValues["vibe"],
      audience: selected.defaultAudience as FormValues["audience"],
    }));
    setOpenCombo(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const currentPhotosCount = v.photos?.length || 0;
    if (currentPhotosCount + files.length > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }
    
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
          <Sparkles className="size-3.5" /> Medier AI • Omnichannel Marketing Plan
        </div>
        <h2 className="font-display text-2xl sm:text-3xl">Build your strategic plan</h2>
        <p className="text-sm text-muted-foreground mt-1">Smart positioning for any business sector in Greece.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" required maxLength={120} value={v.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Medier Luxury Boutique" />
        </div>

        {/* Searchable Combobox for Business Types */}
        <div className="space-y-1.5 sm:col-span-2 flex flex-col">
          <Label>What is your business type?</Label>
          <Popover open={openCombo} onOpenChange={setOpenCombo}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombo}
                className="w-full justify-between font-normal text-left"
              >
                {currentBiz ? currentBiz.label : "Search or select business type..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search 50+ business types... (e.g. E-shop, Gym, Villa)" />
                <CommandList>
                  <CommandEmpty>No business type found.</CommandEmpty>
                  
                  {/* Pinned/Trending Section */}
                  <CommandGroup heading="🔥 Pinned / Trending in Greece">
                    {ALL_BUSINESS_TYPES.filter(b => b.isTrending).map((biz) => (
                      <CommandItem
                        key={biz.id}
                        value={biz.label}
                        onSelect={() => handleBusinessSelect(biz.id)}
                      >
                        <Check className={cn("mr-2 h-4 w-4", v.businessTypeId === biz.id ? "opacity-100" : "opacity-0")} />
                        {biz.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* Fully categorised blocks */}
                  {Array.from(new Set(ALL_BUSINESS_TYPES.map(b => b.category))).map((cat) => (
                    <CommandGroup key={cat} heading={cat}>
                      {ALL_BUSINESS_TYPES.filter(b => b.category === cat).map((biz) => (
                        <CommandItem
                          key={biz.id}
                          value={biz.label}
                          onSelect={() => handleBusinessSelect(biz.id)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", v.businessTypeId === biz.id ? "opacity-100" : "opacity-0")} />
                          {biz.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Dynamic Location Placeholder based on industry context */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="loc">Location / Target Operating Area</Label>
          <Input 
            id="loc" 
            required 
            maxLength={120} 
            value={v.location} 
            onChange={(e) => set("location", e.target.value)} 
            placeholder={currentBiz.category === "Retail & E-commerce" ? "e.g. Nationwide Delivery (Based in Athens)" : "e.g. Glyfada, Athens"} 
          />
        </div>

        {/* Dynamic Key Features Placeholder mapping to selected item */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="feat">Key features & Unique Selling Points (USPs)</Label>
          <Textarea 
            id="feat" 
            required 
            maxLength={2000} 
            rows={4} 
            value={v.features} 
            onChange={(e) => set("features", e.target.value)} 
            placeholder={`e.g. ${currentBiz.placeholderFeatures}`}
          />
        </div>

        {/* Vibe / Tone of Voice */}
        <div className="space-y-1.5">
          <Label>Vibe / Tone of Voice</Label>
          <Select value={v.vibe} onValueChange={(x) => set("vibe", x as FormValues["vibe"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Luxury", "Family-friendly", "Romantic", "Rustic", "Modern", "Professional", "Minimal / Clean", "Trendy"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Audience */}
        <div className="space-y-1.5">
          <Label>Target Audience</Label>
          <Select value={v.audience} onValueChange={(x) => set("audience", x as FormValues["audience"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["International tourists", "Greek travelers", "Local Greek community", "All / Broad"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Output */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Language Output</Label>
          <Select value={v.language} onValueChange={(x) => set("language", x as FormValues["language"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["English only", "Greek only", "Both EN + GR"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reference Photos */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="photos">Reference Images (optional, max 5)</Label>
          <div className="border-2 border-dashed border-gold/30 rounded-lg p-4 text-center hover:border-gold/60 transition-colors cursor-pointer">
            <input id="photos" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <label htmlFor="photos" className="cursor-pointer block">
              <ImageIcon className="size-6 text-gold/60 mx-auto mb-2" />
              <p className="text-sm text-gold/80">Upload product or venue images</p>
              <p className="text-xs text-muted-foreground mt-1">AI matches content strategies directly to your visual identity</p>
            </label>
          </div>
          {(v.photos || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {v.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo} alt={`Asset ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
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
        {loading ? "Analyzing & Planning…" : "Generate Full Marketing Pack"}
      </Button>
    </form>
  );
}