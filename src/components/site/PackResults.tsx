import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import { Download, Share2, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { PostToInstagramDialog } from "./PostToInstagramDialog";

export type PackContent = {
  listing: {
    title: string;
    description: string;
    bullets: string[];
    seoMetaTitle: string;
    seoMetaDescription: string;
  };
  social: {
    instagramCaptions: string[];
    facebookCaptions: string[];
    contentCalendar: string;
  };
  gmb: {
    description: string;
    positiveReplies: string[];
    negativeReplies: string[];
    weeklyPosts: string[];
  };
  email: {
    welcome: { subject: string; body: string };
    reviewRequest: { subject: string; body: string };
    seasonal: { subject: string; body: string };
  };
  ads: {
    googleHeadlines: string[];
    googleDescriptions: string[];
    metaAd: { primaryText: string; headline: string };
    tagline: string;
  };
};

type Meta = {
  businessName: string;
  businessType: string;
  location: string;
  vibe: string;
};

// ── Publish action button ──────────────────────────────────────────────────
function PublishButton({
  label,
  icon,
  url,
  copyText,
  color = "default",
}: {
  label: string;
  icon: string;
  url: string;
  copyText: string;
  color?: "instagram" | "google" | "meta" | "email" | "default";
}) {
  const [copied, setCopied] = useState(false);

  const colorMap = {
    instagram: "border-pink-500/40 text-pink-400 hover:bg-pink-500/10",
    google: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
    meta: "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10",
    email: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10",
    default: "border-gold/40 text-gold hover:bg-gold/10",
  };

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success("✓ Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), 300);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to copy. Try again.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${colorMap[color]}`}
    >
      <span>{icon}</span>
      {copied ? (
        <><CheckCircle2 className="size-3" /> Copied & opening</>
      ) : (
        <><ExternalLink className="size-3" /> {label}</>
      )}
    </button>
  );
}

// ── Content block ──────────────────────────────────────────────────────────
function Block({
  label,
  value,
  multiline = false,
  publishActions,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  publishActions?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface border border-gold-soft p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs uppercase tracking-wider text-gold/80 font-medium">{label}</h4>
        <CopyButton text={value} />
      </div>
      {multiline ? (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm text-foreground/90 leading-relaxed">{value}</p>
      )}
      {publishActions && (
        <div className="pt-2 border-t border-gold-soft/50">
          <p className="text-xs text-muted-foreground mb-2">📤 Publish — copies text & opens platform:</p>
          <div className="flex flex-wrap gap-2">{publishActions}</div>
        </div>
      )}
    </div>
  );
}

function ListBlock({
  label,
  items,
  publishAction,
}: {
  label: string;
  items: string[];
  publishAction?: (item: string, i: number) => React.ReactNode;
}) {
  const all = items.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
  return (
    <div className="rounded-lg bg-surface border border-gold-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs uppercase tracking-wider text-gold/80 font-medium">{label}</h4>
        <CopyButton text={all} label="Copy all" />
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-md bg-background/40 border border-border/40 p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed flex-1">
                <span className="text-gold/60 font-medium mr-2">{i + 1}.</span>
                {item}
              </p>
              <CopyButton text={item} />
            </div>
            {publishAction && (
              <div className="flex flex-wrap gap-2 mt-2">{publishAction(item, i)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PDF export ─────────────────────────────────────────────────────────────
function downloadPdf(meta: Meta, c: PackContent) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - margin) { doc.addPage(); y = margin; }
  };
  const heading = (t: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(201, 168, 76);
    doc.text(t, margin, y); y += 22; doc.setTextColor(30, 30, 30);
  };
  const sub = (t: string) => {
    ensureSpace(24);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(80, 80, 80);
    doc.text(t.toUpperCase(), margin, y); y += 14; doc.setTextColor(30, 30, 30);
  };
  const para = (t: string) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const lines = doc.splitTextToSize(t, usable);
    for (const line of lines) { ensureSpace(14); doc.text(line, margin, y); y += 13; }
    y += 6;
  };

  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(201, 168, 76);
  doc.text("HostWriter AI", margin, y + 10); y += 50;
  doc.setFontSize(20); doc.setTextColor(20, 20, 20); doc.text("Marketing Pack", margin, y); y += 30;
  doc.setFontSize(12); doc.setTextColor(80, 80, 80);
  doc.text(`${meta.businessName} — ${meta.businessType}`, margin, y); y += 16;
  doc.text(`${meta.location} · ${meta.vibe}`, margin, y); y += 30;

  heading("Listing");
  sub("Title"); para(c.listing.title);
  sub("Description"); para(c.listing.description);
  sub("Highlights"); para(c.listing.bullets.map((b) => "• " + b).join("\n"));
  sub("SEO Meta Title"); para(c.listing.seoMetaTitle);
  sub("SEO Meta Description"); para(c.listing.seoMetaDescription);

  heading("Social Media");
  sub("Instagram (7 days)"); para(c.social.instagramCaptions.map((s, i) => `Day ${i + 1}: ${s}`).join("\n\n"));
  sub("Facebook"); para(c.social.facebookCaptions.map((s, i) => `${i + 1}. ${s}`).join("\n\n"));
  sub("Content Calendar"); para(c.social.contentCalendar);

  heading("Google My Business");
  sub("Description"); para(c.gmb.description);
  sub("Positive Review Replies"); para(c.gmb.positiveReplies.map((s, i) => `${i + 1}. ${s}`).join("\n\n"));
  sub("Negative Review Replies"); para(c.gmb.negativeReplies.map((s, i) => `${i + 1}. ${s}`).join("\n\n"));
  sub("Weekly Posts"); para(c.gmb.weeklyPosts.map((s, i) => `Week ${i + 1}: ${s}`).join("\n\n"));

  heading("Email Marketing");
  sub("Welcome — Subject"); para(c.email.welcome.subject);
  sub("Welcome — Body"); para(c.email.welcome.body);
  sub("Review Request — Subject"); para(c.email.reviewRequest.subject);
  sub("Review Request — Body"); para(c.email.reviewRequest.body);
  sub("Seasonal — Subject"); para(c.email.seasonal.subject);
  sub("Seasonal — Body"); para(c.email.seasonal.body);

  heading("Ad Copy");
  sub("Google Headlines"); para(c.ads.googleHeadlines.map((s, i) => `${i + 1}. ${s}`).join("\n"));
  sub("Google Descriptions"); para(c.ads.googleDescriptions.map((s, i) => `${i + 1}. ${s}`).join("\n\n"));
  sub("Meta Ad — Primary Text"); para(c.ads.metaAd.primaryText);
  sub("Meta Ad — Headline"); para(c.ads.metaAd.headline);
  sub("Tagline"); para(c.ads.tagline);

  doc.save(`HostWriter-${meta.businessName.replace(/\s+/g, "-")}.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────
export function PackResults({ meta, content }: { meta: Meta; content: PackContent }) {
  const [instagramPostingOpen, setInstagramPostingOpen] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<string>("");

  const summary = useMemo(
    () => `${meta.businessName} · ${meta.businessType} · ${meta.location} · ${meta.vibe}`,
    [meta],
  );

  const igUrl = "https://www.instagram.com";
  const fbUrl = "https://www.facebook.com";
  const gmbUrl = "https://business.google.com";
  const googleAdsUrl = "https://ads.google.com";
  const metaAdsUrl = "https://www.facebook.com/adsmanager/creation";

  const mailtoLink = (subject: string, body: string) =>
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleInstagramPost = (caption: string) => {
    setSelectedCaption(caption);
    setInstagramPostingOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-luxury rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold/80 mb-1">
            <Sparkles className="size-3.5" /> Your Marketing Pack
          </div>
          <h2 className="font-display text-2xl sm:text-3xl">{meta.businessName}</h2>
          <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied — share it with your team");
            }}
          >
            <Share2 className="size-4 mr-2" /> Share
          </Button>
          <Button
            className="gradient-gold text-background hover:opacity-90 font-medium"
            onClick={() => downloadPdf(meta, content)}
          >
            <Download className="size-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Publishing guide banner */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 px-5 py-4 flex items-start gap-3">
        <span className="text-xl">📤</span>
        <div>
          <p className="text-sm font-medium text-gold">Publishing dashboard</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each piece of content has a <strong>Publish</strong> button — it copies the text to your clipboard and opens the right platform so you can paste and go. No extra tools needed.
          </p>
        </div>
      </div>

      <Tabs defaultValue="listing">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 h-auto bg-surface p-1 border border-gold-soft">
          <TabsTrigger value="listing" className="data-[state=active]:bg-gold data-[state=active]:text-background py-2">📋 Listing</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-gold data-[state=active]:text-background py-2">📱 Social</TabsTrigger>
          <TabsTrigger value="gmb" className="data-[state=active]:bg-gold data-[state=active]:text-background py-2">🗺️ Google</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gold data-[state=active]:text-background py-2">📧 Email</TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-gold data-[state=active]:text-background py-2">📢 Ads</TabsTrigger>
        </TabsList>

        {/* LISTING */}
        <TabsContent value="listing" className="space-y-3 mt-6">
          <Block
            label="Listing title (Airbnb / Booking)"
            value={content.listing.title}
            publishActions={
              <>
                <PublishButton label="Post to Airbnb" icon="🏡" url="https://www.airbnb.com/hosting/listings" copyText={content.listing.title} />
                <PublishButton label="Post to Booking.com" icon="🛏️" url="https://admin.booking.com" copyText={content.listing.title} />
              </>
            }
          />
          <Block
            label="Full description"
            value={content.listing.description}
            multiline
            publishActions={
              <>
                <PublishButton label="Airbnb description" icon="🏡" url="https://www.airbnb.com/hosting/listings" copyText={content.listing.description} />
                <PublishButton label="Booking.com" icon="🛏️" url="https://admin.booking.com" copyText={content.listing.description} />
              </>
            }
          />
          <ListBlock label="Key feature bullets" items={content.listing.bullets} />
          <Block
            label="SEO meta title"
            value={content.listing.seoMetaTitle}
          />
          <Block
            label="SEO meta description"
            value={content.listing.seoMetaDescription}
          />
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="space-y-3 mt-6">
          <ListBlock
            label="Instagram — 7 daily captions"
            items={content.social.instagramCaptions}
            publishAction={(item) => (
              <button
                onClick={() => handleInstagramPost(item)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 text-xs font-medium transition-all"
              >
                <span>📸</span>
                <span className="flex items-center gap-1">
                  <ExternalLink className="size-3" /> Post to Instagram
                </span>
              </button>
            )}
          />
          <ListBlock
            label="Facebook captions"
            items={content.social.facebookCaptions}
            publishAction={(item) => (
              <PublishButton label="Post to Facebook" icon="👥" url={fbUrl} copyText={item} color="meta" />
            )}
          />
          <Block label="Monthly content calendar" value={content.social.contentCalendar} multiline />
        </TabsContent>

        {/* GMB */}
        <TabsContent value="gmb" className="space-y-3 mt-6">
          <Block
            label="Business description (750 chars)"
            value={content.gmb.description}
            multiline
            publishActions={
              <PublishButton label="Update on Google" icon="🗺️" url={gmbUrl} copyText={content.gmb.description} color="google" />
            }
          />
          <ListBlock
            label="Replies to positive reviews"
            items={content.gmb.positiveReplies}
            publishAction={(item) => (
              <PublishButton label="Reply on Google" icon="⭐" url={gmbUrl} copyText={item} color="google" />
            )}
          />
          <ListBlock
            label="Replies to negative reviews"
            items={content.gmb.negativeReplies}
            publishAction={(item) => (
              <PublishButton label="Reply on Google" icon="💬" url={gmbUrl} copyText={item} color="google" />
            )}
          />
          <ListBlock
            label="Weekly post ideas"
            items={content.gmb.weeklyPosts}
            publishAction={(item) => (
              <PublishButton label="Post to GMB" icon="📝" url={gmbUrl} copyText={item} color="google" />
            )}
          />
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email" className="space-y-3 mt-6">
          {(
            [
              { key: "welcome", label: "Welcome email", emoji: "👋" },
              { key: "reviewRequest", label: "Review request email", emoji: "⭐" },
              { key: "seasonal", label: "Seasonal promotional email", emoji: "🌞" },
            ] as const
          ).map(({ key, label, emoji }) => (
            <div key={key} className="rounded-lg bg-surface border border-gold-soft p-4 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gold/80 font-medium">{emoji} {label}</h4>
              <Block label="Subject" value={content.email[key].subject} />
              <Block label="Body" value={content.email[key].body} multiline />
              <div className="pt-2 border-t border-gold-soft/50">
                <p className="text-xs text-muted-foreground mb-2">📤 Send with:</p>
                <div className="flex flex-wrap gap-2">
                  <PublishButton
                    label="Open in Gmail"
                    icon="📧"
                    url={mailtoLink(content.email[key].subject, content.email[key].body)}
                    copyText={content.email[key].body}
                    color="email"
                  />
                  <PublishButton
                    label="Mailchimp"
                    icon="🐒"
                    url="https://mailchimp.com/create/email/"
                    copyText={`Subject: ${content.email[key].subject}\n\n${content.email[key].body}`}
                    color="email"
                  />
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ADS */}
        <TabsContent value="ads" className="space-y-3 mt-6">
          <ListBlock
            label="Google Ads headlines"
            items={content.ads.googleHeadlines}
            publishAction={(item) => (
              <PublishButton label="Use in Google Ads" icon="🔍" url={googleAdsUrl} copyText={item} color="google" />
            )}
          />
          <ListBlock
            label="Google Ads descriptions"
            items={content.ads.googleDescriptions}
            publishAction={(item) => (
              <PublishButton label="Use in Google Ads" icon="🔍" url={googleAdsUrl} copyText={item} color="google" />
            )}
          />
          <Block
            label="Meta ad — primary text"
            value={content.ads.metaAd.primaryText}
            multiline
            publishActions={
              <PublishButton label="Create Meta Ad" icon="📘" url={metaAdsUrl} copyText={content.ads.metaAd.primaryText} color="meta" />
            }
          />
          <Block
            label="Meta ad — headline"
            value={content.ads.metaAd.headline}
            publishActions={
              <PublishButton label="Create Meta Ad" icon="📘" url={metaAdsUrl} copyText={content.ads.metaAd.headline} color="meta" />
            }
          />
          <div className="rounded-lg gradient-gold p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-background/80 mb-2">Signature tagline</div>
            <p className="font-display text-2xl text-background italic">"{content.ads.tagline}"</p>
            <div className="mt-3 flex justify-center">
              <CopyButton text={content.ads.tagline} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upsell banner */}
      <div className="card-luxury rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-gold/30">
        <div>
          <p className="font-display text-lg">Liked your pack?</p>
          <p className="text-sm text-muted-foreground">Get unlimited generations and priority models.</p>
        </div>
        <Button className="gradient-gold text-background font-medium">Upgrade — €29 / month</Button>
      </div>

      {/* Instagram posting dialog */}
      <PostToInstagramDialog
        open={instagramPostingOpen}
        onOpenChange={setInstagramPostingOpen}
        caption={selectedCaption}
        businessName={meta.businessName}
        location={meta.location}
        vibe={meta.vibe}
      />
    </div>
  );
}