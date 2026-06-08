import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import {
  Sparkles,
  Wand2,
  Mail,
  Megaphone,
  Instagram,
  MapPin,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedierAI — Marketing packs for Greek hospitality" },
      {
        name: "description",
        content:
          "AI-crafted listing copy, social media, emails and ads for Greek villas, taverns and boutique hotels — in 30 seconds.",
      },
      { property: "og:title", content: "MedierAI" },
      {
        property: "og:description",
        content: "AI-crafted marketing packs for Greek tourism businesses.",
      },
    ],
  }),
  component: Index,
});

// ── Background Video ───────────────────────────────────────────────────────
function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const HLS_SRC =
      "https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8";

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(HLS_SRC);
          hls.attachMedia(video);
        }
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,148,10,0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Glassmorphism styles ───────────────────────────────────────────────────
const liquidGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backgroundBlendMode: "luminosity",
  backdropFilter: "blur(12px) saturate(150%)",
  WebkitBackdropFilter: "blur(12px) saturate(150%)",
  border: "1px solid rgba(201,148,10,0.25)",
  boxShadow:
    "inset 0 1px 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)",
};

const glassPill: React.CSSProperties = {
  background: "rgba(201,148,10,0.12)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  borderRadius: "9999px",
  border: "1px solid rgba(201,148,10,0.3)",
};

// ── Smooth scroll helper ───────────────────────────────────────────────────
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 px-6 py-5 w-full"
    >
      <div
        className="max-w-5xl mx-auto rounded-full px-6 py-3 flex items-center justify-between"
        style={liquidGlass}
      >
        {/* Left */}
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("features")}
              className="text-white/70 text-sm font-medium hover:text-[#D4A012] transition-colors duration-300"
            >
              Features
            </button>
            <Link
              to="/pricing"
              className="text-white/70 text-sm font-medium hover:text-[#D4A012] transition-colors duration-300"
            >
              Pricing
            </Link>
            <button
              onClick={() => scrollTo("about")}
              className="text-white/70 text-sm font-medium hover:text-[#D4A012] transition-colors duration-300"
            >
              About
            </button>
          </div>
        </div>
        {/* Right */}
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium cursor-pointer">
              Sign in
            </button>
          </Link>
          <Link to="/auth">
            <button
              className="px-5 py-2 text-sm font-medium text-white rounded-full cursor-pointer transition-opacity hover:opacity-90"
              style={glassPill}
            >
              Get started
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Hero CTA with typewriter ───────────────────────────────────────────────
function HeroCTA() {
  const [mode, setMode] = useState<"button" | "form" | "done">("button");
  const [email, setEmail] = useState("");
  const [placeholder, setPlaceholder] = useState("");

  const PLACEHOLDER_TEXT = "Enter your email for early access";
  const DONE_TEXT = "You're on the list ✓";

  useEffect(() => {
    if (mode !== "form" && mode !== "done") return;
    const target = mode === "form" ? PLACEHOLDER_TEXT : DONE_TEXT;
    let i = 0;
    setPlaceholder("");
    const interval = setInterval(() => {
      setPlaceholder(target.slice(0, i + 1));
      i++;
      if (i >= target.length) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode !== "done") return;
    const t = setTimeout(() => setMode("button"), 4000);
    return () => clearTimeout(t);
  }, [mode]);

  return (
    <AnimatePresence mode="wait">
      {mode === "button" && (
        <motion.button
          key="btn"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMode("form")}
          className="px-10 py-3 text-sm font-medium rounded-full text-white/90 cursor-pointer transition-all duration-300 hover:border-[#D4A012]/60"
          style={{
            border: "1px solid rgba(201,148,10,0.35)",
            background: "rgba(201,148,10,0.08)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#D4A012]" />
            Generate your first pack — free
          </span>
        </motion.button>
      )}

      {(mode === "form" || mode === "done") && (
        <motion.form
          key="form"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onSubmit={(e) => {
            e.preventDefault();
            setMode("done");
          }}
          className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full w-full max-w-xs"
          style={{
            border: "1px solid rgba(201,148,10,0.4)",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40 min-w-0"
          />
          <button
            type="submit"
            className="size-8 rounded-full flex items-center justify-center shrink-0 transition-all"
            style={{ background: "rgba(201,148,10,0.9)" }}
          >
            {mode === "done" ? (
              <Check className="size-4 text-black" strokeWidth={2.5} />
            ) : (
              <ArrowRight className="size-4 text-black" strokeWidth={2.5} />
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: Wand2,
    title: "Listing copy",
    desc: "Airbnb / Booking title, 300-word description, SEO meta — all polished.",
  },
  {
    icon: Instagram,
    title: "Social content",
    desc: "7 Instagram captions, 3 Facebook posts, a monthly calendar.",
  },
  {
    icon: MapPin,
    title: "Google My Business",
    desc: "Description, review replies, weekly post ideas — all ready.",
  },
  {
    icon: Mail,
    title: "Email sequences",
    desc: "Welcome, review request and seasonal promo emails.",
  },
  {
    icon: Megaphone,
    title: "Ad copy",
    desc: "Google Ads, Meta ads, plus one memorable tagline.",
  },
];

// ── Main Page ──────────────────────────────────────────────────────────────
function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">

      {/* ── HERO ── */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <BackgroundVideo />
        <Navbar />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase"
              style={{ color: "rgba(212,160,18,0.9)" }}
            >
              For Greek Hospitality · AI Marketing
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-[64px] font-medium tracking-[-0.02em] leading-[1.05]"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your full marketing pack,
              <br />
              <span
                style={{
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #F5E09A 0%, #D4A012 45%, #8B6000 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                crafted in 30 seconds.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="text-base md:text-lg max-w-2xl leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Listings, social posts, Google My Business, emails and ad copy —
              written by AI that understands Greek tourism, your villa, your
              tavern, your guests.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col items-center gap-3 w-full max-w-sm"
            >
              <HeroCTA />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                1 pack free · No credit card required
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              onClick={() => scrollTo("features")}
              className="text-xs font-medium tracking-wide cursor-pointer transition-colors duration-300 hover:text-[#D4A012]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              ↓ See what's inside every pack
            </motion.button>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
        />
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="container mx-auto max-w-6xl px-5 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "rgba(212,160,18,0.8)" }}
          >
            What's inside every pack
          </div>
          <h2
            className="text-3xl sm:text-4xl font-medium"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Five channels. One brief. One click.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="rounded-xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(201,148,10,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "rgba(201,148,10,0.12)" }}
              >
                <Icon className="size-5" style={{ color: "#D4A012" }} />
              </div>
              <h3
                className="text-lg font-medium mb-1"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DEMO SAMPLE ── */}
      <section className="container mx-auto max-w-5xl px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl p-8 sm:p-12"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(201,148,10,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: "rgba(212,160,18,0.8)" }}
          >
            Sample output
          </div>
          <h3
            className="text-2xl sm:text-3xl font-medium mb-6"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Villa Aegean Pearl — Oia, Santorini
          </h3>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "rgba(212,160,18,0.8)" }}>
                Listing title
              </div>
              <p className="text-lg font-medium mb-5 italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#F5E09A" }}>
                "Caldera Sunsets · Private Pool · Adults-Only Hideaway"
              </p>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "rgba(212,160,18,0.8)" }}>
                Tagline
              </div>
              <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(255,255,255,0.85)" }}>
                "Where the Aegean meets your private horizon."
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "rgba(212,160,18,0.8)" }}>
                Instagram caption — Sunday
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                Pink-gold light, the gentle hum of cicadas, and nowhere to be.
                Sundays at Villa Aegean Pearl are a slow exhale. ✨{" "}
                <span style={{ color: "rgba(212,160,18,0.7)" }}>
                  #santorini #oia #luxuryvilla #greekislands #caldera
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="container mx-auto max-w-4xl px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl p-10 sm:p-14 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(201,148,10,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(212,160,18,0.8)" }}>
            About Medier AI
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Built for Greek hospitality
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Medier AI was created to solve a real problem: Greek hospitality owners — villas, taverns, boutique hotels — spend hours writing marketing content that rarely goes viral and often misses the mark with international guests.
          </p>
          <p className="text-base leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            We built an AI that thinks like an elite Greek tourism copywriter. It understands the language of Santorini sunsets, Cretan taverns, Mykonos nightlife, and everything in between — and generates content that converts visitors into bookings.
          </p>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            From Airbnb listings to Instagram reels to Google Ads — one form, 30 seconds, your entire marketing presence done.
          </p>
          <div className="mt-8">
            <a href="mailto:support.medierai@gmail.com" className="text-sm hover:underline" style={{ color: "rgba(212,160,18,0.8)" }}>
              support.medierai@gmail.com
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="container mx-auto max-w-3xl px-5 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-medium text-center mb-10"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Frequently asked
        </motion.h2>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { q: "How long does a pack take?", a: "Usually 15–30 seconds. One click, one form, all five channels at once." },
            { q: "Can I get content in Greek?", a: "Yes — choose Greek only, English only, or both side by side." },
            { q: "Is it really free to start?", a: "Yes. Your first 3 packs are free, no credit card needed. Upgrade from €25/month for more packs and auto-posting." },
            { q: "Who writes the copy?", a: "An AI fine-tuned to act as an elite Greek hospitality copywriter. You can always edit before publishing." },
            { q: "Can I cancel my subscription?", a: "Yes, anytime. You keep access until the end of your billing period. No questions asked." },
          ].map((f) => (
            <AccordionItem
              key={f.q}
              value={f.q}
              className="rounded-xl px-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(201,148,10,0.2)",
              }}
            >
              <AccordionTrigger
                className="text-base font-medium hover:no-underline"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                <span className="hover:text-[#D4A012] transition-colors">{f.q}</span>
              </AccordionTrigger>
              <AccordionContent style={{ color: "rgba(255,255,255,0.6)" }}>
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="container mx-auto max-w-4xl px-5 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl p-12 relative overflow-hidden"
          style={{
            background: "rgba(201,148,10,0.06)",
            border: "1px solid rgba(201,148,10,0.3)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(201,148,10,0.15), transparent)",
            }}
          />
          <h2
            className="text-3xl sm:text-4xl font-medium mb-3 relative z-10"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Ready to fill your calendar?
          </h2>
          <p className="mb-8 relative z-10" style={{ color: "rgba(255,255,255,0.55)" }}>
            Generate your first pack — free, in under a minute.
          </p>
          <Link to="/auth" className="relative z-10">
            <button
              className="px-10 py-3.5 text-sm font-semibold rounded-full text-black transition-opacity hover:opacity-90 flex items-center gap-2 mx-auto"
              style={{
                background: "linear-gradient(135deg, #F5E09A 0%, #D4A012 50%, #A87008 100%)",
                boxShadow: "0 0 32px rgba(201,148,10,0.4)",
              }}
            >
              <Sparkles className="size-4" /> Get started free
            </button>
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative mt-auto"
        style={{ borderTop: "1px solid rgba(201,148,10,0.15)" }}
      >
        <div className="container mx-auto max-w-6xl px-5 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <div className="mb-3">
                <Logo />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                AI-crafted marketing packs for Greek hospitality businesses. Villas, taverns, boutique hotels — done in 30 seconds.
              </p>
              
               <a href="mailto:support.medierai@gmail.com"
                className="text-xs mt-3 block hover:underline"
                style={{ color: "rgba(212,160,18,0.7)" }}
              >
                support.medierai@gmail.com
              </a>
            </div>

            {/* Product */}
            <div>
              <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(212,160,18,0.6)" }}>
                Product
              </div>
              <div className="space-y-2">
                {[
                  { label: "Features", action: () => scrollTo("features") },
                  { label: "Pricing", href: "/pricing" },
                  { label: "About", action: () => scrollTo("about") },
                  { label: "Sign in", href: "/auth" },
                ].map((item) => (
                  item.href ? (
                    <Link
                      key={item.label}
                      to={item.href as any}
                      className="block text-sm transition-colors hover:text-[#D4A012]"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="block text-sm transition-colors hover:text-[#D4A012] text-left"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(212,160,18,0.6)" }}>
                Legal
              </div>
              <div className="space-y-2">
                <Link
                  to="/terms"
                  className="block text-sm transition-colors hover:text-[#D4A012]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Terms of Service
                </Link>
                <Link
                  to="/privacy"
                  className="block text-sm transition-colors hover:text-[#D4A012]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Privacy Policy
                </Link>
                
                <a  href="mailto:support.medierai@gmail.com"
                  className="block text-sm transition-colors hover:text-[#D4A012]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: "1px solid rgba(201,148,10,0.1)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} Medier AI · For the hospitality of Greece
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/terms"
                className="text-xs hover:text-[#D4A012] transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-xs hover:text-[#D4A012] transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Privacy
              </Link>
              
               <a href="mailto:support.medierai@gmail.com"
                className="text-xs hover:text-[#D4A012] transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                support.medierai@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}