// Single source of truth for operator identity and legal-document versions.
// Values are hard-coded (not env vars) because the static /privacy and /terms
// pages are prerendered and can't reliably read Amplify runtime env.
// REPLACE the bracketed placeholders before relying on these pages.

export const OPERATOR = {
  legalName: "IPHREN LTD",
  tradingName: "IHS Technology",
  registrationNumber: "12398659",
  registeredAddress: "Iphren Ltd, 124 City Road, London, England, EC1V 2NX",
  contactEmail: "hello@ihs.technology",
} as const;

export const DOMAIN = "amencircle.com";

// Bump these dates whenever the corresponding document materially changes.
// ISO (YYYY-MM-DD) so the /privacy and /terms pages can render them in the
// viewer's locale via formatDate (e.g. "4 July 2026" / "2026年7月4日").
export const PRIVACY_VERSION = "2026-07-04";
export const TERMS_VERSION = "2026-07-04";
