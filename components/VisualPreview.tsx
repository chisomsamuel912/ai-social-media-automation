"use client";
import { useEffect, useState } from "react";
import type { VisualFormat } from "@/lib/templates";

const FORMATS: Array<{ id: VisualFormat; label: string }> = [
  { id: "image", label: "🖼 Image" },
  { id: "carousel", label: "🎠 Carousel" },
  { id: "script", label: "🎬 Script" }
];

export default function VisualPreview({ topic, angle, businessName, order = 0 }: { topic: string; angle: string; businessName?: string; order?: number }) {
  const [format, setFormat] = useState<VisualFormat>("image");
  const [slides, setSlides] = useState<string[]>([]);
  const [slide, setSlide] = useState(0);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let live = true;
    // Stagger image requests so the free queue isn't hit 5-at-once.
    const wait = format === "image" ? order * 5000 : 0;
    const timer = setTimeout(() => {
      if (!live) return;
    setSlides([]);
    setSlide(0);
    setAiImage(null);
    setAiLoading(format === "image");
    fetch("/api/visual", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, headline: topic, subline: angle, businessName })
    })
      .then((r) => r.json())
      .then((b) => {
        if (!live) return;
        if (b.slides) setSlides(b.slides);
        if (b.aiImage) setAiImage(b.aiImage);
        setAiLoading(false);
      })
      .catch(() => { if (live) setAiLoading(false); });
    }, wait);
    return () => { live = false; clearTimeout(timer); };
  }, [format, topic, angle, businessName, order]);

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
        {aiImage ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aiImage} alt={topic} className="h-auto w-full" />
            <span className="pill absolute left-2 top-2" style={{ background: "rgba(43,41,38,.8)", color: "#fff", border: "none" }}>✨ AI picture</span>
          </div>
        ) : (
          <>
            {slides.length === 0 && <p className="p-6 text-center text-xs text-muted">{aiLoading ? "Painting AI picture…" : "Rendering visual…"}</p>}
            {slides.length > 0 && (
              <div dangerouslySetInnerHTML={{ __html: slides[Math.min(slide, slides.length - 1)] }} />
            )}
          </>
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
