"use client";

import { Inline } from "@/components/inline-md";
import { useTranslations } from "@/components/i18n-provider";

// The two consent checkboxes required before an account can process prayer
// content. Kept separate on purpose: UK GDPR explicit consent (Art. 9(2)(a))
// for religious data must be unbundled from terms acceptance. Shared by the
// registration form and the existing-user ConsentGate.
export function ConsentCheckboxes({
  idPrefix,
  acceptTerms,
  onAcceptTermsChange,
  consentReligiousData,
  onConsentReligiousDataChange,
}: {
  idPrefix: string;
  acceptTerms: boolean;
  onAcceptTermsChange: (value: boolean) => void;
  consentReligiousData: boolean;
  onConsentReligiousDataChange: (value: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={`${idPrefix}-terms`}
        className="flex items-start gap-2 text-sm leading-snug"
      >
        <input
          id={`${idPrefix}-terms`}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
          checked={acceptTerms}
          onChange={(e) => onAcceptTermsChange(e.target.checked)}
        />
        <span>
          <Inline text={t.consent.terms} />
        </span>
      </label>

      <label
        htmlFor={`${idPrefix}-religious`}
        className="flex items-start gap-2 text-sm leading-snug"
      >
        <input
          id={`${idPrefix}-religious`}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
          checked={consentReligiousData}
          onChange={(e) => onConsentReligiousDataChange(e.target.checked)}
        />
        <span>{t.consent.religious}</span>
      </label>
    </div>
  );
}
