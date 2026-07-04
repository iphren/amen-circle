"use client";

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
          I am <strong>18 or older</strong> and accept the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Privacy Policy
          </a>
          .
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
        <span>
          I explicitly consent to Amen Circle storing and processing the
          prayer requests I write, which may reveal my religious beliefs. I
          can withdraw this at any time by deleting my requests or my account.
        </span>
      </label>
    </div>
  );
}
