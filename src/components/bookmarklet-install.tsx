"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Grip, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-button";

export function BookmarkletInstall() {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const bookmarklet = useMemo(() => {
    if (!origin) return "";
    const captureUrl = `${origin}/capture`;
    const script = `(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);window.open('${captureUrl}?source=bookmarklet&url='+u+'&title='+t,'_blank','noopener,noreferrer,width=620,height=760');})();`;
    return `javascript:${script}`;
  }, [origin]);

  async function copyBookmarklet() {
    try {
      if (!bookmarklet) return;
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <GlassCard variant="bordered" className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-accent-cyan/10 p-2 text-accent-cyan">
          <Grip className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-white">Browser bookmarklet</h2>
          <p className="text-sm text-white/50 mt-1">Save the page you are viewing with one click. It opens the capture form with the current URL and title filled in.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-white/70">
        <div className="flex gap-3"><span className="text-accent-cyan font-semibold">1</span><span>Copy the bookmarklet code.</span></div>
        <div className="flex gap-3"><span className="text-accent-cyan font-semibold">2</span><span>Create a new browser bookmark and paste the code into its URL field.</span></div>
        <div className="flex gap-3"><span className="text-accent-cyan font-semibold">3</span><span>Open any page and click that bookmark to capture it.</span></div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <LiquidButton type="button" variant="secondary" size="sm" onClick={copyBookmarklet} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
          {copied ? "Copied" : "Copy bookmarklet"}
        </LiquidButton>
        <a href="/capture" className="inline-flex items-center gap-1.5 h-8 px-3 text-sm text-white/60 hover:text-white transition-colors">
          Open capture page
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="mt-5 flex items-start gap-2 text-xs text-white/40">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>The bookmarklet uses this dashboard&apos;s current origin, so it works in local, preview, and deployed environments.</span>
      </div>
    </GlassCard>
  );
}
