import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="size-8 rounded-md gradient-gold flex items-center justify-center text-background font-display font-bold text-lg shadow-lg">
          H
        </div>
      </div>
      <span className="font-display text-lg tracking-tight">
        HostWriter <span className="text-gradient-gold">AI</span>
      </span>
    </Link>
  );
}