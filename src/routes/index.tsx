import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { Sparkles, Check, Wand2, Mail, Megaphone, Instagram, MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HostWriter AI — Marketing packs for Greek hospitality" },
      { name: "description", content: "AI-crafted listing copy, social media, emails and ads for Greek villas, taverns and boutique hotels — in 30 seconds." },
      { property: "og:title", content: "HostWriter AI" },
      { property: "og:description", content: "AI-crafted marketing packs for Greek tourism businesses." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Wand2, title: "Listing copy", desc: "Airbnb / Booking title, 300-word description, SEO meta — all polished." },
  { icon: Instagram, title: "Social content", desc: "7 Instagram captions, 3 Facebook posts, a monthly calendar." },
  { icon: MapPin, title: "Google My Business", desc: "Description, review replies, weekly post ideas — all ready." },
  { icon: Mail, title: "Email sequences", desc: "Welcome, review request and seasonal promo emails." },
  { icon: Megaphone, title: "Ad copy", desc: "Google Ads, Meta ads, plus one memorable tagline." },
];

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="container mx-auto max-w-6xl px-5 py-5 flex items-center justify-between">
        <Logo />
        <Link to="/auth">
          <Button variant="ghost" className="text-foreground/80 hover:text-gold hover:bg-gold/10">Sign in</Button>
        </Link>
        <Link to="/pricing">
  <Button variant="ghost" className="text-foreground/80 hover:text-gold hover:bg-gold/10">
    Pricing
  </Button>
</Link>
      </header>

      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-5 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-widest text-gold mb-6">
          <Sparkles className="size-3" /> For Greek hospitality
        </div>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6">
          Your full marketing pack,<br />
          <span className="text-gradient-gold italic">crafted in 30 seconds.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Listings, social posts, Google My Business, emails and ad copy — written by AI that understands Greek tourism, your villa, your tavern, your guests.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth">
            <Button size="lg" className="gradient-gold text-background font-medium glow-gold h-12 px-8">
              <Sparkles className="size-4 mr-2" /> Generate your first pack — free
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">3 packs free · No credit card required</p>
      </section>

      {/* What's inside */}
      <section className="container mx-auto max-w-6xl px-5 pb-20">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-gold/80 mb-2">What's inside every pack</div>
          <h2 className="font-display text-3xl sm:text-4xl">Five channels. One brief. One click.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-luxury rounded-xl p-5">
              <div className="size-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section className="container mx-auto max-w-5xl px-5 pb-20">
        <div className="card-luxury rounded-2xl p-6 sm:p-10">
          <div className="text-xs uppercase tracking-widest text-gold/80 mb-2">Sample output</div>
          <h3 className="font-display text-2xl sm:text-3xl mb-4">Villa Aegean Pearl — Oia, Santorini</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gold/80 uppercase tracking-wider mb-1">Listing title</div>
              <p className="font-display text-lg mb-4 italic">"Caldera Sunsets · Private Pool · Adults-Only Hideaway"</p>
              <div className="text-xs text-gold/80 uppercase tracking-wider mb-1">Tagline</div>
              <p className="font-display text-lg italic">"Where the Aegean meets your private horizon."</p>
            </div>
            <div>
              <div className="text-xs text-gold/80 uppercase tracking-wider mb-2">Instagram caption — Sunday</div>
              <p className="text-sm leading-relaxed text-foreground/90">Pink-gold light, the gentle hum of cicadas, and nowhere to be. Sundays at Villa Aegean Pearl are a slow exhale. ✨ #santorini #oia #luxuryvilla #greekislands #caldera</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-3xl px-5 pb-20">
        <h2 className="font-display text-3xl text-center mb-8">Frequently asked</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { q: "How long does a pack take?", a: "Usually 15–30 seconds. One click, one form, all five channels at once." },
            { q: "Can I get content in Greek?", a: "Yes — choose Greek only, English only, or both side by side." },
            { q: "Is it really free to start?", a: "Yes. Your first 3 packs are free, no credit card needed. After that it's €29/month for unlimited." },
            { q: "Who writes the copy?", a: "An AI fine-tuned to act as an elite Greek hospitality copywriter. You can always edit before publishing." },
          ].map((f) => (
            <AccordionItem key={f.q} value={f.q} className="card-luxury rounded-xl px-5 border-gold-soft">
              <AccordionTrigger className="font-display text-base hover:text-gold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-4xl px-5 pb-24 text-center">
        <div className="card-luxury rounded-2xl p-10">
          <h2 className="font-display text-3xl sm:text-4xl mb-3">Ready to fill your calendar?</h2>
          <p className="text-muted-foreground mb-6">Generate your first pack — free, in under a minute.</p>
          <Link to="/auth">
            <Button size="lg" className="gradient-gold text-background font-medium glow-gold h-12 px-8">
              <Sparkles className="size-4 mr-2" /> Get started
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gold-soft py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HostWriter AI · For the hospitality of Greece
      </footer>
    </div>
  );
}
