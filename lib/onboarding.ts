export interface OnboardingDraft {
  name: string;
  description: string;
  products: string;
  audience: string;
  location: string;
  tone: string;
  platforms: string[];
  frequency: string;
  publishingMode: string;
  salesChannel: string;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  name: "",
  description: "",
  products: "",
  audience: "",
  location: "",
  tone: "friendly",
  platforms: ["whatsapp", "facebook"],
  frequency: "let_ai_decide",
  publishingMode: "remind_me",
  salesChannel: "whatsapp"
};

/** MVP scope: WhatsApp + Facebook first. Others return later. */
export const MVP_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", enabled: true },
  { id: "facebook", label: "Facebook Page", enabled: true },
  { id: "instagram", label: "Instagram", enabled: false },
  { id: "tiktok", label: "TikTok", enabled: false }
];

/** Weighted completeness 0-100. Required fields weigh more. */
export function completeness(d: OnboardingDraft): number {
  const checks: Array<[boolean, number]> = [
    [d.name.trim().length > 1, 25],
    [d.description.trim().length > 9, 20],
    [d.products.trim().length > 2, 15],
    [d.audience.trim().length > 2, 20],
    [d.platforms.length > 0, 10],
    [d.salesChannel.trim().length > 0, 10]
  ];
  return checks.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
}
