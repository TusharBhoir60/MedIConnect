"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { tx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallBanner({ app }: { app: "asha" | "patient" }) {
  const { lang } = useStore();
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [hide, setHide] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const stand =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setStandalone(stand);
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (hide || standalone) return null;

  const label = app === "asha" ? tx("installAsha", lang) : tx("installPatient", lang);

  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-3 py-2 text-xs text-sand-50">
      <Download size={14} className="shrink-0" />
      <p className="flex-1 leading-snug">
        {deferred ? label : tx("installFallback", lang)}
      </p>
      {deferred && (
        <button
          className="rounded-full bg-sand-50 px-2.5 py-1 font-medium text-forest-900"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
            setHide(true);
          }}
        >
          {tx("install", lang)}
        </button>
      )}
      <button onClick={() => setHide(true)} className="p-1 opacity-70" aria-label="dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
