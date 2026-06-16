// Single place to change branding, pricing, and credit packs.
export const BRAND = {
  name: "Qoppy",
  tagline: "Enterprise codebases, shipped in days.",
  product: {
    id: "d4insights",
    title: "d4insights",
    blurb:
      "Full source codebase — frontend, backend, workflow engine, and deploy scripts.",
    // Access costs this many credits (deducted when the client requests access).
    priceCredits: 1000,
  },
  // Simulated recharge packs (no real payment is taken). USD shown for display only.
  rechargePacks: [
    { credits: 1000, usd: 449 },
    { credits: 2000, usd: 899 },
    { credits: 5000, usd: 1499 },
  ],
};

export type RechargePack = (typeof BRAND.rechargePacks)[number];
