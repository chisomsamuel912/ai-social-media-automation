"use client";
import { useEffect, useState } from "react";
import type { VisualFormat } from "@/lib/templates";

const FORMATS: Array<{ id: VisualFormat; label: string }> = [
  { id: "image", label: "🖼 Image" },
  { id: "carousel", label: "🎠 Carousel" },
  { id: "script", label: "🎬 Script" }
];

export default function VisualPreview({ topic, angle, businessName }: { topic: string; angle: string; businessName?: string }) {
  const [format, setFormat] = useState<VisualFormat>("image");
  const [slides, setSlides] = useState<string[]>([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let live = true;
    setSlides([]);
    setSlide(0);
    fetch("/api/visual", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, headline: topic, subline: angle, businessName })
    })
      .then((r) => r.json())
      .then((b) => { if (live && b.slides) setSlides(b.slides); })
      .catch(() => {});
    return () => { live = false; };
  }, [format, topic, angle, businessName]);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted">AI chose: {format}</span>
        <div className="ml-auto flex gap-1">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className={`pill ${format === f.id ? "on" : ""}`}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="glass-soft relative mt-2 overflow-hidden">
        {slides.length === 0 && <p className="p-6 text-center text-xs text-muted">Rendering visual…</p>}
        {slides.length > 0 && (
          <div dangerouslySetInnerHTML={{ __html: slides[Math.min(slide, slides.length - 1)] }} />
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{ width: i === slide ? 22 : 8, background: i === slide ? "#2B2926" : "rgba(43,41,38,.3)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
