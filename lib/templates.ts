export type VisualFormat = "image" | "carousel" | "script";

export interface VisualInput {
  format: VisualFormat;
  headline: string;
  subline?: string;
  businessName?: string;
  colors?: string[];
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function palette(colors?: string[]) {
  return {
    bg: colors?.[0] ?? "#4A5D4E",
    bg2: colors?.[1] ?? "#3c4f40",
    paper: "#FBFAF7",
    ink: "#2B2926",
    muted: "#6E675C"
  };
}

function wrap(inner: string, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(label)}">${inner}</svg>`;
}

function header(p: ReturnType<typeof palette>, businessName: string, kicker: string): string {
  return `<text x="80" y="120" font-family="Georgia,serif" font-size="34" letter-spacing="4" fill="${p.paper}" opacity="0.85">${escapeXml(kicker.toUpperCase())}</text>
  <text x="80" y="990" font-family="Georgia,serif" font-size="36" fill="${p.paper}" opacity="0.9">${escapeXml(businessName)}</text>`;
}

function imageSlide(v: VisualInput, p: ReturnType<typeof palette>): string {
  const inner = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>
  <rect width="1080" height="1080" fill="url(#g)"/>
  <circle cx="950" cy="150" r="260" fill="#ffffff" opacity="0.07"/>
  <circle cx="120" cy="880" r="180" fill="#ffffff" opacity="0.06"/>
  ${header(p, v.businessName ?? "My Business", v.format === "image" ? "Growpilot" : v.format)}
  <text x="80" y="420" font-family="Georgia,serif" font-size="86" font-weight="bold" fill="${p.paper}">${escapeXml(v.headline.slice(0, 90))}</text>
  <text x="80" y="560" font-family="Verdana,sans-serif" font-size="38" fill="${p.paper}" opacity="0.85">${escapeXml((v.subline ?? "Save this for later · Share with a friend").slice(0, 110))}</text>`;
  return wrap(inner, v.headline);
}

function carouselSlides(v: VisualInput, p: ReturnType<typeof palette>): string[] {
  const parts = v.headline.split(/[,.;:—–-]/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  while (parts.length < 3) parts.push(v.subline ?? "Follow for part " + (parts.length + 1));
  return parts.slice(0, 3).map((part, i) => {
    const inner = `<rect width="1080" height="1080" fill="${i % 2 ? p.paper : p.bg}"/>
    <text x="80" y="120" font-family="Verdana,sans-serif" font-size="34" letter-spacing="4" fill="${i % 2 ? p.muted : p.paper}" opacity="0.8">SLIDE ${i + 1} / 3</text>
    <text x="80" y="480" font-family="Georgia,serif" font-size="80" font-weight="bold" fill="${i % 2 ? p.ink : p.paper}">${escapeXml(part.slice(0, 80))}</text>
    <text x="80" y="990" font-family="Georgia,serif" font-size="36" fill="${i % 2 ? p.muted : p.paper}" opacity="0.9">${escapeXml(v.businessName ?? "My Business")} · Swipe →</text>`;
    return wrap(inner, `${v.headline} slide ${i + 1}`);
  });
}

function scriptSlide(v: VisualInput, p: ReturnType<typeof palette>): string {
  const beats = ["Hook (0–2s)", "Value (3–15s)", "CTA (16–20s)"];
  const rows = beats.map((b, i) =>
    `<rect x="80" y="${300 + i * 200}" width="920" height="160" rx="24" fill="#ffffff" opacity="0.12"/>
     <text x="120" y="${365 + i * 200}" font-family="Verdana,sans-serif" font-size="34" font-weight="bold" fill="${p.paper}">${b}</text>
     <text x="120" y="${410 + i * 200}" font-family="Verdana,sans-serif" font-size="30" fill="${p.paper}" opacity="0.8">Captions on · face to camera</text>`
  ).join("");
  const inner = `<rect width="1080" height="1080" fill="${p.bg}"/>${header(p, v.businessName ?? "My Business", "Video script")}${rows}`;
  return wrap(inner, v.headline);
}

/** $0 renderer: pure SVG strings, no image API, renders locally in milliseconds. */
export function renderVisual(v: VisualInput): string[] {
  const p = palette(v.colors);
  if (v.format === "carousel") return carouselSlides(v, p);
  if (v.format === "script") return [scriptSlide(v, p)];
  return [imageSlide(v, p)];
}
