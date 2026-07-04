import type { Metadata } from "next";
import Link from "next/link";
import { DOMAIN, OPERATOR, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Amen Circle.",
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

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Amen Circle
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: {TERMS_VERSION}
      </p>

      <Section title="1. What Amen Circle is">
        <p>
          Amen Circle ({DOMAIN}) lets small circles of trusted friends share
          prayer requests and pray for one another. The service is operated by{" "}
          {OPERATOR.legalName} (trading as {OPERATOR.tradingName}, company
          no. {OPERATOR.registrationNumber}), registered at{" "}
          {OPERATOR.registeredAddress}. By creating an account
          you agree to these terms.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be 18 or older to use Amen Circle.</p>
      </Section>

      <Section title="3. Your account">
        <p>
          You sign in with passkeys or single-use email links. You are
          responsible for keeping your devices and email account secure, and
          for everything done through your account. Tell us promptly at{" "}
          <a className="underline" href={`mailto:${OPERATOR.contactEmail}`}>
            {OPERATOR.contactEmail}
          </a>{" "}
          if you believe your account has been compromised.
        </p>
      </Section>

      <Section title="4. Your content">
        <p>
          Your prayer requests remain yours. You grant us a limited licence to
          store, encrypt, and display them to the members of the circle you
          shared them with — that is the whole purpose of the service and we
          use your content for nothing else.
        </p>
        <p>
          <strong>Remember that other members read what you share.</strong>{" "}
          Circles are private, but the people in your circle will see the
          requests assigned to them. Do not share anything you would not want
          the other members of your circle to know, including other
          people&apos;s private information.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You must not use Amen Circle to post or share content that is:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>unlawful, or that infringes anyone else&apos;s rights;</li>
          <li>abusive, harassing, threatening, or hateful;</li>
          <li>
            deliberately deceptive, or spam or advertising of any kind.
          </li>
        </ul>
        <p>
          You must not attempt to break, probe, or overload the service, or
          access other users&apos; data.
        </p>
      </Section>

      <Section title="6. Reporting content and moderation">
        <p>
          If you see content that breaks these terms, report it to{" "}
          <a className="underline" href={`mailto:${OPERATOR.contactEmail}`}>
            {OPERATOR.contactEmail}
          </a>{" "}
          (include the circle and, if possible, the request). We may remove
          content, remove members from circles, or suspend or terminate
          accounts that violate these terms. Circle owners can also remove
          members from their own circles.
        </p>
      </Section>

      <Section title="7. Circles and account deletion">
        <p>
          If you delete your account, your prayer requests are deleted, and{" "}
          <strong>any circles you own are deleted for all their members</strong>
          , including the requests in them. Leaving a circle deletes the
          requests you shared in it.
        </p>
      </Section>

      <Section title="8. Not professional advice">
        <p>
          Amen Circle is a tool for mutual prayer among friends. Nothing on
          the service is professional, medical, mental-health, legal, or
          pastoral advice. If you or someone you know is in crisis, contact
          local emergency services or a qualified professional.
        </p>
      </Section>

      <Section title="9. The service is provided as is">
        <p>
          Amen Circle is provided free of charge, &quot;as is&quot; and
          &quot;as available&quot;, without warranties of any kind. To the
          fullest extent permitted by law, we are not liable for any indirect
          or consequential loss arising from your use of the service. Nothing
          in these terms limits liability that cannot lawfully be limited,
          including for death or personal injury caused by negligence, or
          fraud.
        </p>
      </Section>

      <Section title="10. Ending or changing the service">
        <p>
          You can stop using Amen Circle and delete your account at any time.
          We may suspend or terminate accounts that break these terms, and we
          may change or discontinue the service; if we discontinue it we will
          give reasonable notice where practical. We may update these terms —
          material changes will be reflected in the &quot;last updated&quot;
          date above.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These terms are governed by the law of England and Wales, and the
          courts of England and Wales have exclusive jurisdiction.
        </p>
      </Section>
    </main>
  );
}
