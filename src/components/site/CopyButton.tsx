import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2 text-xs text-muted-foreground hover:text-gold hover:bg-gold/10"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="ml-1.5">{copied ? "Copied" : label}</span>
    </Button>
  );
}