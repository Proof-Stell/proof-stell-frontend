// ─── Shared Landing Page Content Configuration ──────────────────────────────
// Single source of truth for all landing-section data.
// To add a new section or modify copy, edit this file only —
// no need to touch individual components.

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface Feature {
  id: string;
  title: string;
  tag: string;
  description: string;
  accent: string;
}

export interface FeatureStat {
  label: string;
  value: string;
}

export type TestimonialType = "issuer" | "verifier" | "user";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  org: string;
  type: TestimonialType;
  hash: string;
  txBlock: string;
}

export interface FlowStep {
  n: string;
  title: string;
  body: string;
}

export interface ProtocolFlow {
  id: string;
  title: string;
  color: string;
  steps: FlowStep[];
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLinkSection {
  [category: string]: FooterLink[];
}

// ─── Normalized Section IDs ─────────────────────────────────────────────────
// These IDs are used by Navbar scroll-spy AND must match the `id` attribute
// on each <section> element in FeaturesSection, HowItWorksSection,
// LeaderboardSection, and TestimonialsSection.

export const SECTION_IDS = {
  FEATURES: "features",
  HOW_IT_WORKS: "how-it-works",
  LEADERBOARD: "leaderboard",
  TESTIMONIALS: "testimonials",
} as const;

export const SECTION_IDS_LIST: string[] = Object.values(SECTION_IDS);

// ─── Navigation Links ───────────────────────────────────────────────────────

export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: `/#${SECTION_IDS.FEATURES}` },
  { label: "How It Works", href: `/#${SECTION_IDS.HOW_IT_WORKS}` },
  { label: "Leaderboard", href: `/#${SECTION_IDS.LEADERBOARD}` },
  { label: "Testimonials", href: `/#${SECTION_IDS.TESTIMONIALS}` },
];

// ─── Hero Section ───────────────────────────────────────────────────────────

export const HERO_STATS: HeroStat[] = [
  { value: "100%", label: "Tamper-Proof" },
  { value: "<3s", label: "Verify Time" },
  { value: "0", label: "Central Servers" },
];

// ─── Features Section ───────────────────────────────────────────────────────

export const FEATURES: Feature[] = [
  {
    id: "01",
    title: "On-Chain Document Proofs",
    tag: "CORE",
    description:
      "Institutions register documents by storing cryptographic hashes directly on Soroban smart contracts. Anyone can verify authenticity by comparing a file's hash with the immutable blockchain record.",
    accent: "#00dc96",
  },
  {
    id: "02",
    title: "Institutional Issuers",
    tag: "ISSUERS",
    description:
      "Verified institutions — universities, employers, NGOs — issue credentials directly to users' Stellar wallets. Certificates, employment letters, compliance approvals: all tamper-proof.",
    accent: "#00dc96",
  },
  {
    id: "03",
    title: "Wallet-Based Identity",
    tag: "IDENTITY",
    description:
      "No usernames. No passwords. Connect your Stellar wallet to receive credentials, share verifiable proofs, and manage all issued documents. Self-sovereign by design.",
    accent: "#00dc96",
  },
  {
    id: "04",
    title: "Instant Verification",
    tag: "VERIFY",
    description:
      "Upload a document — the platform hashes it, queries the Soroban contract, and returns a result in seconds. Valid, Not Found, or Revoked. No intermediary required.",
    accent: "#00dc96",
  },
  {
    id: "05",
    title: "Revocation Registry",
    tag: "REGISTRY",
    description:
      "Issuers can revoke credentials on-chain — fraudulent certificates, expired compliance docs, recalled licenses. Revocation state is permanently transparent and auditable.",
    accent: "#00dc96",
  },
  {
    id: "06",
    title: "Trustless Infrastructure",
    tag: "PROTOCOL",
    description:
      "Built entirely on Soroban smart contracts. No centralized databases, no trusted third parties. ProofStell anchors cryptographic proofs on Stellar — permanent and globally verifiable.",
    accent: "#00dc96",
  },
];

export const FEATURE_STATS: FeatureStat[] = [
  { label: "Contracts Deployed", value: "4" },
  { label: "Avg Verify Time", value: "<3s" },
  { label: "Trust Model", value: "Zero" },
  { label: "Network", value: "Stellar" },
];

// ─── Testimonials Section ───────────────────────────────────────────────────

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "0x3f8a",
    quote:
      "We issue hundreds of certificates a month. ProofStell eliminated fraud inquiries entirely — every employer can verify directly on-chain without calling us.",
    name: "Dr. Amara Osei",
    role: "Registrar",
    org: "University of Accra",
    type: "issuer",
    hash: "3f8a...c92d",
    txBlock: "#9,841,002",
  },
  {
    id: "0x7b2c",
    quote:
      "I verified a candidate's engineering certificate in under three seconds. No email chains, no PDF forgeries. This is how hiring should work.",
    name: "Kenji Watanabe",
    role: "Head of Engineering",
    org: "Meridian Labs",
    type: "verifier",
    hash: "7b2c...f14a",
    txBlock: "#9,843,551",
  },
  {
    id: "0x1d9e",
    quote:
      "My credentials live in my Stellar wallet. I share a proof link with anyone who needs verification — no waiting, no middlemen, no data leaks.",
    name: "Fatima Al-Rashid",
    role: "Compliance Officer",
    org: "Independent",
    type: "user",
    hash: "1d9e...a87b",
    txBlock: "#9,845,790",
  },
  {
    id: "0xc41f",
    quote:
      "We revoked an expired certification on-chain in one transaction. The status updated globally, instantly. Our legal team was impressed.",
    name: "Priya Menon",
    role: "Director of Ops",
    org: "NovaCert Authority",
    type: "issuer",
    hash: "c41f...0e3d",
    txBlock: "#9,846,120",
  },
  {
    id: "0x9a3b",
    quote:
      "Auditing compliance documents used to take days. With ProofStell's on-chain revocation registry, I can check any credential's status in real time.",
    name: "Marcus Eze",
    role: "Lead Auditor",
    org: "TrustFrame Partners",
    type: "verifier",
    hash: "9a3b...d25c",
    txBlock: "#9,847,019",
  },
];

export const TESTIMONIAL_TYPE_LABELS: Record<TestimonialType, string> = {
  issuer: "CREDENTIAL ISSUER",
  verifier: "THIRD-PARTY VERIFIER",
  user: "WALLET HOLDER",
};

export const TESTIMONIAL_TYPE_COLORS: Record<TestimonialType, string> = {
  issuer: "#00dc96",
  verifier: "#38bdf8",
  user: "#a78bfa",
};

// ─── How It Works Section ───────────────────────────────────────────────────

export const HOW_IT_WORKS_FLOWS: ProtocolFlow[] = [
  {
    id: "verification",
    title: "Document Verification",
    color: "#00dc96",
    steps: [
      { n: "01", title: "Upload Document", body: "Drag and drop any PDF, image, or text file. Your file never leaves the browser." },
      { n: "02", title: "Hash Generated", body: "A SHA-256 fingerprint is computed client-side using the Web Crypto API." },
      { n: "03", title: "Chain Queried", body: "The hash is sent to the Soroban smart contract on Stellar for lookup." },
      { n: "04", title: "Result Returned", body: "Valid, Revoked, or Not Found — with issuer identity and block reference." },
    ],
  },
  {
    id: "issuance",
    title: "Credential Issuance",
    color: "#38bdf8",
    steps: [
      { n: "01", title: "Institution Logs In", body: "Verified institutions authenticate via their Stellar wallet — no passwords." },
      { n: "02", title: "Credential Created", body: "Document hash, recipient wallet, metadata, and expiry are configured." },
      { n: "03", title: "On-Chain Record", body: "Soroban contract records the issuance permanently on Stellar mainnet." },
      { n: "04", title: "Publicly Verifiable", body: "Credential is instantly verifiable by anyone, globally, with no middleman." },
    ],
  },
];

// ─── Footer Links ───────────────────────────────────────────────────────────

export const FOOTER_LINKS: FooterLinkSection = {
  Platform: [
    { label: "Verify Document", href: "/verify" },
    { label: "My Dashboard", href: "/dashboard" },
    { label: "Issuer Portal", href: "/issuer" },
    { label: "Connect Wallet", href: "/signup" },
  ],
  Protocol: [
    { label: "How It Works", href: `/#${SECTION_IDS.HOW_IT_WORKS}` },
    { label: "Features", href: `/#${SECTION_IDS.FEATURES}` },
    { label: "Soroban Contracts", href: `/#${SECTION_IDS.FEATURES}` },
    { label: "Revocation Registry", href: `/#${SECTION_IDS.FEATURES}` },
  ],
  Community: [
    { label: "GitHub", href: "https://github.com/ProofStell", external: true },
    { label: "Contributing", href: "/CONTRIBUTING.md", external: true },
    { label: "MIT License", href: "#", external: false },
  ],
};
