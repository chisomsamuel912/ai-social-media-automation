import { describe, expect, it } from "vitest";
import { escapeXml, renderVisual } from "../lib/templates";

describe("template renderer ($0, no API)", () => {
  it("renders an image slide containing headline + brand color", () => {
    const [svg] = renderVisual({ format: "image", headline: "Save ₦5k weekly", businessName: "TestCo", colors: ["#4A5D4E"] });
    expect(svg).toContain("<svg");
    expect(svg).toContain("Save");
    expect(svg).toContain("#4A5D4E");
  });
  it("renders 3 carousel slides", () => {
    const slides = renderVisual({ format: "carousel", headline: "Tip one, tip two, tip three" });
    expect(slides).toHaveLength(3);
    expect(slides[0]).toContain("SLIDE 1 / 3");
  });
  it("renders a video-script storyboard", () => {
    const [svg] = renderVisual({ format: "script", headline: "My story" });
    expect(svg).toContain("Hook (0");
  });
  it("escapes XML so markup cannot break", () => {
    const [svg] = renderVisual({ format: "image", headline: "<b>bold</b> & proud" });
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).not.toContain("<b>bold</b>");
  });
  it("renders in milliseconds (p95 <10s budget)", () => {
    const t = Date.now();
    for (let i = 0; i < 50; i++) renderVisual({ format: "image", headline: "Speed test " + i });
    expect(Date.now() - t).toBeLessThan(5000);
  });
});

describe("escapeXml", () => {
  it("escapes quotes and brackets", () => {
    expect(escapeXml(`"hi" <a>`)).toBe("&quot;hi&quot; &lt;a&gt;");
  });
});
