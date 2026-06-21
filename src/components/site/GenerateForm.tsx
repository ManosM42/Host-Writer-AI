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

// 1. Καθολική Λίστα Επιχειρήσεων για την Ελλάδα με Categorization
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
  { id: "villa", label: "Βίλα / Πολυτελές Κατάλυμα (Villa)", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Ιδιωτική πισίνα, θέα θάλασσα, adults only, free transfer...", defaultVibe: "Luxury", defaultAudience: "International tourists" },
  { id: "hotel", label: "Boutique Ξενοδοχείο", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Κεντρική τοποθεσία, χειροποίητο πρωινό, roof garden bar...", defaultVibe: "Modern", defaultAudience: "Both" },
  { id: "tavern", label: "Παραδοσιακή Ταβέρνα", category: "Hospitality & Gastro", isTrending: false, placeholderFeatures: "Ζωντανή μουσική, αυθεντικές ελληνικές γεύσεις, αυλή, ντόπια κρέατα...", defaultVibe: "Rustic", defaultAudience: "Both" },
  { id: "restaurant", label: "Modern Restaurant / Gastronomy", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Fine dining, fusion ελληνική κουζίνα, ενημερωμένη λίστα κρασιών...", defaultVibe: "Romantic", defaultAudience: "Both" },
  { id: "cafe_bar", label: "Café / Bar / Beach Bar", category: "Hospitality & Gastro", isTrending: true, placeholderFeatures: "Signature cocktails, specialty coffee, DJ sets, μπροστά στο κύμα...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  
  // Retail & E-commerce
  { id: "eshop_fashion", label: "E-shop Μόδας (Ρούχα/Παπούτσια)", category: "Retail & E-commerce", isTrending: true, placeholderFeatures: "Δωρεάν μεταφορικά άνω των 50€, fast shipping, ελληνικής ραφής...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  { id: "jewelry", label: "Κοσμηματοπωλείο (Jewelry Store)", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Χειροποίητα κοσμήματα, ασήμι 925, custom δημιουργίες, premium συσκευασία...", defaultVibe: "Luxury", defaultAudience: "All / Broad" },
  { id: "cosmetics", label: "E-shop / Κατάστημα Καλλυντικών", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Vegan προϊόντα, βιολογικά συστατικά, cruelty-free, skin-routine sets...", defaultVibe: "Minimal / Clean", defaultAudience: "Local Greek community" },
  { id: "concept_store", label: "Concept Store / Δώρα", category: "Retail & E-commerce", isTrending: false, placeholderFeatures: "Minimal αισθητική, αντικείμενα Ελλήνων σχεδιαστών, eco-friendly...", defaultVibe: "Minimal / Clean", defaultAudience: "Both" },
  
  // Services & Professionals
  { id: "real_estate", label: "Μεσιτικό Γραφείο (Real Estate)", category: "Services & Professionals", isTrending: true, placeholderFeatures: "Golden Visa experts, πολυτελή ακίνητα στα νότια προάστια/νησιά...", defaultVibe: "Professional", defaultAudience: "International tourists" },
  { id: "car_rental", label: "Ενοικιάσεις Αυτοκινήτων / Σκαφών", category: "Services & Professionals", isTrending: false, placeholderFeatures: "Χωρίς εγγύηση πιστωτικής, free παραλαβή από αεροδρόμιο, 24/7 support...", defaultVibe: "Professional", defaultAudience: "International tourists" },
  { id: "law_accounting", label: "Δικηγορικό / Λογιστικό Γραφείο", category: "Services & Professionals", isTrending: false, placeholderFeatures: "Εξειδίκευση σε εταιρικά, φορολογικές συμβουλές, άμεση ανταπόκριση...", defaultVibe: "Professional", defaultAudience: "Local Greek community" },
  { id: "education", label: "Φροντιστήριο / Κέντρο Ξένων Γλωσσών", category: "Services & Professionals", isTrending: false, placeholderFeatures: "Διαδραστικοί πίνακες, native speakers, εγγύηση επιτυχίας, e-learning...", defaultVibe: "Family-friendly", defaultAudience: "Local Greek community" },

  // Health, Wellness & Beauty
  { id: "hair_salon", label: "Κομμωτήριο / Barber Shop / Νύχια", category: "Health, Wellness & Beauty", isTrending: true, placeholderFeatures: "Balayage experts, επώνυμα προϊόντα, nail art, χαλαρωτική ατμόσφαιρα...", defaultVibe: "Trendy", defaultAudience: "Local Greek community" },
  { id: "gym", label: "Γυμναστήριο / CrossFit / Pilates Studio", category: "Health, Wellness & Beauty", isTrending: true, placeholderFeatures: "Personal training, ολιγομελή τμήματα, σύγχρονος εξοπλισμός, nutrition tips...", defaultVibe: "Modern", defaultAudience: "Local Greek community" },
  { id: "dental", label: "Οδοντιατρείο / Ιατρείο", category: "Health, Wellness & Beauty", isTrending: false, placeholderFeatures: "Ανώδυνη οδοντιατρική, λεύκανση laser, παιδοδοντία, σύγχρονα μηχανήματα...", defaultVibe: "Professional", defaultAudience: "Local Greek community" },
  { id: "spa", label: "Κέντρο Spa / Μασάζ", category: "Health, Wellness & Beauty", isTrending: false, placeholderFeatures: "Αρωματοθεραπεία, jacuzzi, χαλαρωτικά πακέτα για ζευγάρια...", defaultVibe: "Romantic", defaultAudience: "All / Broad" },
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

  // Βρίσκουμε τα configs της τρέχουσας επιλεγμένης επιχείρησης για να αλλάζουμε δυναμικά placeholders
  const currentBiz = ALL_BUSINESS_TYPES.find((b) => b.id === v.businessTypeId) || ALL_BUSINESS_TYPES[0];

  const handleBusinessSelect = (id: string) => {
    const selected = ALL_BUSINESS_TYPES.find((b) => b.id === id);
    if (!selected) return;

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
        <p className="text-sm text-muted-foreground mt-1">Smart positioning for any business type in Greece.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" required maxLength={120} value={v.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Medier Boutique" />
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
                <CommandInput placeholder="Search 50+ business types... (e.g. E-shop, Γυμναστήριο)" />
                <CommandList>
                  <CommandEmpty>No business type found.</CommandEmpty>
                  
                  {/* Προτεινόμενα / Trending Section */}
                  <CommandGroup heading="🔥 Δημοφιλή στην Ελλάδα">
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

                  {/* Όλες οι κατηγορίες χωριστά */}
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

        {/* Location - Δυναμικό Placeholder */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="loc">Location / Target Area</Label>
          <Input 
            id="loc" 
            required 
            maxLength={120} 
            value={v.location} 
            onChange={(e) => set("location", e.target.value)} 
            placeholder={currentBiz.category === "Retail & E-commerce" ? "e.g. Πανελλαδικά (Έδρα: Θεσσαλονίκη)" : "e.g. Γλυφάδα, Αθήνα"} 
          />
        </div>

        {/* Key Features - Δυναμικό Placeholder βασισμένο στην επιλογή */}
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

        {/* Vibe / Style */}
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

        {/* Photos */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="photos">Reference Images (optional, max 5)</Label>
          <div className="border-2 border-dashed border-gold/30 rounded-lg p-4 text-center hover:border-gold/60 transition-colors cursor-pointer">
            <input id="photos" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <label htmlFor="photos" className="cursor-pointer block">
              <ImageIcon className="size-6 text-gold/60 mx-auto mb-2" />
              <p className="text-sm text-gold/80">Upload product/space images</p>
              <p className="text-xs text-muted-foreground mt-1">AI matches copy strategies to your visual assets</p>
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