const HF_API = "https://api-inference.huggingface.co/models";
const DEFAULT_IMAGE_MODEL = process.env.HF_IMAGE_MODEL ?? "black-forest-labs/FLUX.1-schnell";

/** Prompt builder: headline + business + style → image prompt. Pure, tested. */
export function buildImagePrompt(headline: string, businessName?: string, style?: string): string {
  const who = businessName && businessName !== "My Business" ? ` for ${businessName}` : "";
  const look = style || "warm, clean small-business social media aesthetic, soft natural light, no text overlay";
  return `Square social media graphic: ${headline}${who}. ${look}. High quality, professional food-and-lifestyle photography style.`;
}

/**
 * Real AI picture via Hugging Face free inference (BYO free token).
 * Returns a data URI on success, null on any failure (rate limit, model
 * loading, no token) so callers fall back to SVG templates. Never throws.
 */
export async function generateImage(headline: string, businessName?: string): Promise<string | null> {
  const token = process.env.HF_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${HF_API}/${DEFAULT_IMAGE_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: buildImagePrompt(headline, businessName) })
    });
    if (res.status === 503) return null; // model warming up — try next time
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) return null; // JSON error payload, not an image
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
