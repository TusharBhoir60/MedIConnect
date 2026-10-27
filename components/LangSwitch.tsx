"use client";

import { useStore } from "@/lib/store";
import { LANG_LABEL } from "@/lib/seed";
import type { Lang } from "@/lib/types";

export function LangSwitch() {
  const { lang, setLang } = useStore();
  return (
    <div className="inline-flex rounded-full bg-sand-200/80 p-0.5 text-xs font-medium">
      {(["mr", "hi", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 ${lang === l ? "bg-white text-forest-800 shadow-sm" : "text-forest-800/70"}`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
