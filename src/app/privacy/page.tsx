import type { Metadata } from "next";
import Link from "next/link";
import { DOMAIN, OPERATOR, PRIVACY_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Amen Circle collects, uses and protects your data.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Amen Circle
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: {PRIVACY_VERSION}
      </p>

      <Section title="1. Who we are">
        <p>
          Amen Circle ({DOMAIN}) is operated by {OPERATOR.legalName} (trading
          as {OPERATOR.tradingName}, company no. {OPERATOR.registrationNumber}
          ), registered at{" "}
          {OPERATOR.registeredAddress}. We are the data controller for the
          personal data described in this policy. You can contact us at{" "}
          <a className="underline" href={`mailto:${OPERATOR.contactEmail}`}>
            {OPERATOR.contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section title="2. What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account data</strong> — your email address and display
            name.
          </li>
          <li>
            <strong>Passkey metadata</strong> — a public key and device
            information used to sign you in. Your biometrics (fingerprint,
            face) never leave your device and are never sent to us.
          </li>
          <li>
            <strong>Prayer requests</strong> — the free-text requests you
            write. Because prayer content can reveal your religious beliefs,
            this is <strong>special category data</strong> under UK GDPR
            Article 9, and we only process it with your explicit consent.
          </li>
          <li>
            <strong>Circle membership</strong> — which circles you belong to
            and which requests are assigned to you.
          </li>
          <li>
            <strong>Session cookie</strong> — a single strictly-necessary
            cookie that keeps you signed in (see section 5).
          </li>
          <li>
            <strong>Access logs</strong> — our hosting provider (AWS) records
            IP addresses and request metadata in server logs for security and
            troubleshooting.
          </li>
        </ul>
      </Section>

      <Section title="3. Why we process it (lawful bases)">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Providing the service</strong> (account, circles,
            assignments): performance of a contract — UK GDPR Article 6(1)(b).
          </li>
          <li>
            <strong>Prayer request content</strong>: your explicit consent —
            Article 9(2)(a) — which you give at registration and can withdraw
            at any time by deleting your requests or your account.
          </li>
          <li>
            <strong>Security logging</strong>: our legitimate interest in
            keeping the service secure — Article 6(1)(f).
          </li>
        </ul>
      </Section>

      <Section title="4. Who processes it for us">
        <p>
          We use the following processors: Neon (database hosting), and Amazon
          Web Services — Amplify for hosting, SES for transactional email, and
          CloudWatch for logs — in the eu-west-2 (London) region. We do not
          sell or share your data with anyone else, and there is no
          advertising or analytics tracking on this site.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          We set exactly one cookie, <code>amen-circle-session</code>, which
          is strictly necessary to keep you signed in. It is httpOnly, lasts
          up to 30 days, and contains no tracking identifiers. Because it is
          strictly necessary, no cookie consent banner is required under PECR.
          We use no analytics or third-party cookies of any kind.
        </p>
      </Section>

      <Section title="6. How we protect it">
        <p>
          All prayer request content is encrypted at rest (AES-256-GCM) in
          addition to the disk-level encryption provided by our database host.
          Sign-in uses passkeys, so we never store passwords. Sign-in and
          recovery links are single-use, short-lived, and stored only as
          hashes.
        </p>
      </Section>

      <Section title="7. How long we keep it">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Account data is kept until you delete your account, at which point
            it is deleted immediately.
          </li>
          <li>
            Prayer requests are deleted when you delete them, leave a circle,
            a circle is deleted, or you delete your account.
          </li>
          <li>
            Expired sign-in and recovery links are purged automatically.
          </li>
          <li>Server access logs are retained for 30 days.</li>
        </ul>
      </Section>

      <Section title="8. Your rights">
        <p>Under UK GDPR you have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Access and portability</strong> — download everything we
            hold about you from Settings → Download my data.
          </li>
          <li>
            <strong>Erasure</strong> — delete your account (and all your data)
            from Settings → Delete account.
          </li>
          <li>
            <strong>Rectification</strong> — correct your details by
            contacting us.
          </li>
          <li>
            <strong>Withdraw consent</strong> — at any time, by deleting your
            requests or your account. Withdrawal doesn&apos;t affect
            processing that happened before.
          </li>
          <li>
            <strong>Restriction and objection</strong> — contact us at{" "}
            <a className="underline" href={`mailto:${OPERATOR.contactEmail}`}>
              {OPERATOR.contactEmail}
            </a>
            .
          </li>
          <li>
            <strong>Complain</strong> — to the Information Commissioner&apos;s
            Office at{" "}
            <a
              className="underline"
              href="https://ico.org.uk"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="9. Who can use Amen Circle">
        <p>
          Amen Circle is for adults only. You must be 18 or older to create an
          account.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          If we make material changes we will update this page and the
          &quot;last updated&quot; date above, and where appropriate ask for
          your consent again.
        </p>
      </Section>
    </main>
  );
}
