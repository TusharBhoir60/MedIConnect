"use client";

import { useRef, useState } from "react";
import { Mic, Play, Pause, Square, Trash2 } from "lucide-react";
import { tx } from "@/lib/i18n";
import type { Lang, Urgency } from "@/lib/types";

/* ─────────────────────────────────────────────
   VoiceRecorder
   – Records audio via MediaRecorder
   – Converts blob → base64 dataUrl
   – Shows saved clips inline with real playback
   – Urgency prop tints the record button
───────────────────────────────────────────── */
export function VoiceRecorder({
  onSave,
  lang,
  urgency,
}: {
  onSave: (payload: { durationSec: number; dataUrl?: string; transcript: string }) => void;
  lang?: Lang;
  urgency?: Urgency;
}) {
  const l = lang ?? "mr";

  const [rec,     setRec]     = useState(false);
  const [sec,     setSec]     = useState(0);
  const [saved,   setSaved]   = useState<{ id: string; dataUrl: string; durationSec: number }[]>([]);
  const [denied,  setDenied]  = useState(false);

  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* record button colour follows urgency */
  const btnCls = urgency === "emergency"
    ? "bg-clay-500 hover:bg-clay-600"
    : urgency === "urgent"
    ? "bg-clay-400 hover:bg-clay-500"
    : "bg-forest-800 hover:bg-forest-700";

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      /* pick a supported mime type */
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob    = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        const dur     = sec || 1;

        /* add to local preview list */
        const id = `vn-${Date.now()}`;
        setSaved((prev) => [...prev, { id, dataUrl, durationSec: dur }]);

        /* pass to parent */
        onSave({
          durationSec: dur,
          dataUrl,
          transcript: tx("voiceNoteDefault", l),
        });
        setSec(0);
      };

      mediaRef.current = mr;
      mr.start(250); /* collect every 250ms so we get data even for short clips */
      setRec(true);
      setDenied(false);

      const t0 = Date.now();
      timerRef.current = setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 200);
    } catch {
      /* mic permission denied or not available */
      setDenied(true);
      onSave({
        durationSec: 12,
        transcript:  tx("voiceNoteOffline", l),
      });
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setRec(false);
  }

  function removeClip(id: string) {
    setSaved((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-900">{tx("voiceNoteTitle", l)}</p>
          <p className="text-[11px] text-ink/50">{tx("voiceNoteSub", l)}</p>
        </div>

        {rec ? (
          /* Stop button */
          <button
            onClick={stopRecording}
            aria-label={tx("ariaStopRecording", l)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-500 text-white shadow-lg animate-pulse"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          /* Start button */
          <button
            onClick={startRecording}
            aria-label={tx("ariaStartRecording", l)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition ${btnCls}`}
          >
            <Mic size={18} />
          </button>
        )}
      </div>

      {/* Recording indicator */}
      {rec && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-clay-50 px-3 py-2">
          <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-clay-500 animate-ping" />
          <span className="text-xs font-medium tabular-nums text-clay-600">
            {sec}s — {tx("recording", l)}
          </span>
          <span className="ml-auto text-[10px] text-ink/40">{tx("tapToStop", l)}</span>
        </div>
      )}

      {/* Mic denied warning */}
      {denied && (
        <p className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-[11px] text-ink/55">
          {tx("voiceNoteOffline", l)}
        </p>
      )}

      {/* Saved clips list */}
      {saved.length > 0 && (
        <div className="mt-3 space-y-2">
          {saved.map((clip, i) => (
            <div key={clip.id} className="flex items-center gap-2 rounded-xl bg-sand-50 px-3 py-2">
              <span className="shrink-0 text-[11px] font-medium text-ink/40">#{i + 1}</span>
              <audio
                controls
                src={clip.dataUrl}
                className="h-8 min-w-0 flex-1"
                style={{ height: 32 }}
              />
              <span className="shrink-0 text-[10px] tabular-nums text-ink/40">{clip.durationSec}s</span>
              <button
                onClick={() => removeClip(clip.id)}
                aria-label={tx("ariaDeleteClip", l)}
                className="shrink-0 rounded-full p-1 text-ink/30 hover:bg-clay-100 hover:text-clay-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r  = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

/* ─────────────────────────────────────────────
   AudioPlay
   Used on the doctor dashboard to play ASHA voice notes.
   – If dataUrl exists: render a real <audio> element
   – If not: show a clear "No audio" placeholder (not a broken wave)
───────────────────────────────────────────── */
export function AudioPlay({ dataUrl, label, lang }: { dataUrl?: string; label: string; lang?: Lang }) {
  const l = lang ?? "mr";
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!dataUrl) {
    /* Seed data / offline placeholder — no real audio available */
    return (
      <div className="flex items-center gap-2 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink/45">
        <Mic size={12} className="shrink-0 opacity-50" />
        <span className="italic">{label} — {tx("offlineAudioNote", l)}</span>
      </div>
    );
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-sand-50 px-2 py-1.5">
      {/* Custom play button */}
      <button
        onClick={togglePlay}
        aria-label={playing ? tx("ariaPause", l) : tx("ariaPlay", l)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
          playing ? "bg-clay-500 text-white" : "bg-forest-800 text-white"
        }`}
      >
        {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
      </button>

      {/* Native audio element — hidden visually but provides controls */}
      <audio
        ref={audioRef}
        src={dataUrl}
        onPlay={()  => setPlaying(true)}
        onPause={()  => setPlaying(false)}
        onEnded={()  => setPlaying(false)}
        className="hidden"
      />

      {/* Progress / waveform bar — CSS only, no animation when not playing */}
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              playing ? "bg-forest-600 animate-pulse" : "bg-sand-300"
            }`}
            style={{ height: `${6 + (i % 5) * 3}px` }}
          />
        ))}
      </div>

      <span className="shrink-0 text-[10px] tabular-nums text-ink/40">{label}</span>
    </div>
  );
}
