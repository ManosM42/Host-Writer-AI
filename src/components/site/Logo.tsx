import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/medier-logo.jpg";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoSrc}
        alt=""
        className="h-9 w-auto object-contain"
      />
      <span className="font-display text-lg tracking-tight">
        Medier <span className="text-gradient-gold">AI</span>
      </span>
    </Link>
  );
}