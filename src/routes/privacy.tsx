import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Medier AI" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto max-w-4xl px-5 py-5 flex items-center justify-between">
        <Logo />
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
        </Link>
      </header>

      <main className="container mx-auto max-w-4xl px-5 py-12 space-y-8">
        <div>
          <h1 className="font-display text-4xl mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: June 2026</p>
        </div>

        <Section title="1. Introduction">
          Medier AI ("we", "our", "us") is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and Greek law. This Privacy Policy explains how we collect, use, store, and protect your information when you use our Service.
        </Section>

        <Section title="2. Data Controller">
          Medier AI is the data controller for personal data collected through this Service. For any privacy-related inquiries, contact us at{" "}
          <a href="mailto:support.medierai@gmail.com" className="text-gold hover:underline">
            support.medierai@gmail.com
          </a>
        </Section>

        <Section title="3. Data We Collect">
          We collect the following categories of personal data:
          <ul className="list-disc pl-6 mt-3 space-y-2 text-sm text-foreground/80">
            <li><strong>Account data:</strong> Name, email address, profile photo (if provided via Google OAuth)</li>
            <li><strong>Payment data:</strong> Billing information processed and stored securely by Stripe — we never store card details directly</li>
            <li><strong>Usage data:</strong> Packs generated, features used, subscription plan</li>
            <li><strong>Content data:</strong> Business information you enter to generate marketing packs</li>
            <li><strong>Technical data:</strong> IP address, browser type, device information, log data</li>
          </ul>
          <p className="mt-3">We do not store your date of birth — it is used only for age verification at the time of registration.</p>
        </Section>

        <Section title="4. Legal Basis for Processing">
          We process your personal data based on the following legal grounds:
          <ul className="list-disc pl-6 mt-3 space-y-1 text-sm text-foreground/80">
            <li><strong>Contract performance:</strong> To provide the Service you subscribed to</li>
            <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
            <li><strong>Legitimate interests:</strong> To improve the Service and prevent fraud</li>
            <li><strong>Consent:</strong> For optional features such as marketing communications</li>
          </ul>
        </Section>

        <Section title="5. How We Use Your Data">
          We use your personal data to:
          <ul className="list-disc pl-6 mt-3 space-y-1 text-sm text-foreground/80">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process payments and manage your subscription</li>
            <li>Send transactional emails (account confirmation, payment receipts)</li>
            <li>Respond to your support requests</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="6. Data Sharing">
          We do not sell your personal data. We share data only with trusted third-party service providers necessary to operate the Service:
          <ul className="list-disc pl-6 mt-3 space-y-1 text-sm text-foreground/80">
            <li><strong>Supabase:</strong> Database and authentication infrastructure</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Anthropic / Google:</strong> AI content generation</li>
            <li><strong>Vercel:</strong> Application hosting</li>
          </ul>
          All providers are contractually bound to protect your data and comply with GDPR.
        </Section>

        <Section title="7. Data Retention">
          We retain your personal data for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or tax purposes.
        </Section>

        <Section title="8. Your Rights (GDPR)">
          Under GDPR, you have the following rights:
          <ul className="list-disc pl-6 mt-3 space-y-1 text-sm text-foreground/80">
            <li><strong>Right of access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to rectification:</strong> Correct inaccurate data</li>
            <li><strong>Right to erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Right to restriction:</strong> Limit how we process your data</li>
            <li><strong>Right to portability:</strong> Receive your data in a portable format</li>
            <li><strong>Right to object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to withdraw consent:</strong> At any time, where processing is based on consent</li>
          </ul>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:support.medierai@gmail.com" className="text-gold hover:underline">
            support.medierai@gmail.com
          </a>
          . We will respond within 30 days.
        </Section>

        <Section title="9. Cookies">
          We use essential cookies necessary for the Service to function (authentication sessions). We do not use advertising or tracking cookies. You can control cookies through your browser settings.
        </Section>

        <Section title="10. Data Security">
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit (HTTPS) and at rest. Payment data is handled exclusively by Stripe, which is PCI DSS compliant.
        </Section>

        <Section title="11. International Transfers">
          Some of our service providers may process data outside the European Economic Area (EEA). In such cases, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
        </Section>

        <Section title="12. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the Service. The date at the top of this page indicates when the policy was last updated.
        </Section>

        <Section title="13. Contact & Complaints">
          For privacy questions or to exercise your rights, contact us at{" "}
          <a href="mailto:support.medierai@gmail.com" className="text-gold hover:underline">
            support.medierai@gmail.com
          </a>
          . You also have the right to lodge a complaint with the Hellenic Data Protection Authority (HDPA) at{" "}
          <a href="https://www.dpa.gr" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            www.dpa.gr
          </a>
          .
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl text-gold">{title}</h2>
      <div className="text-foreground/80 leading-relaxed text-sm">{children}</div>
    </div>
  );
}