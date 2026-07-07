import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { OPERATOR } from "./legal";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// Amplify WEB_COMPUTE SSR does not expose an assumable role to the runtime AWS
// SDK, so the default provider chain finds no credentials. We pass an explicit,
// tightly-scoped IAM access key via env vars instead (built lazily so a missing
// var surfaces a clear error at send time rather than crashing on import).
let client: SESClient | undefined;

function getClient(): SESClient {
  if (client) return client;

  const region = process.env.SES_REGION;
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "SES_REGION, SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY are required to send email",
    );
  }

  client = new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function fromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM env var is required to send email");
  return from;
}

// A monitored reply address signals a legitimate transactional sender. A
// no-reply From with no Reply-To at all is itself a mild phishing signal, so we
// always set one — falling back to the From address when EMAIL_REPLY_TO is unset.
function replyToAddress(): string {
  return process.env.EMAIL_REPLY_TO || fromAddress();
}

// Postal address shown in the footer. A physical address is a strong "this is
// legitimate transactional mail, not phishing" signal for spam filters (and is
// expected by anti-spam law for bulk senders). REPLACE the placeholder below
// with the real registered address — overridable via EMAIL_POSTAL_ADDRESS.
const ORG_POSTAL_ADDRESS =
  process.env.EMAIL_POSTAL_ADDRESS || `© ${new Date().getFullYear()} ${OPERATOR.tradingName}, ${OPERATOR.registeredAddress}`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Shared layout for transactional emails. Produces a full HTML document plus a
// matching plain-text part. Key anti-phishing properties:
//   - the action link's visible text is a plain action label AND the full,
//     literal URL is shown as text, so the displayed link matches its href
//     (eliminates the brand-name/URL-mismatch heuristic);
//   - real branding, an explanation of why the email was received, and a
//     postal address in the footer (so it reads as legitimate, not sparse).
function renderEmail(args: {
  locale: Locale;
  bodyIntro: string;
  ctaLabel: string;
  ctaUrl: string;
  expiryNote?: string;
  // Defaults to the generic "you can safely ignore this" line, which assumes
  // no action has been taken yet. Override for templates like welcome, where
  // the account already exists and ignoring it doesn't undo anything.
  ignoreLine?: string;
}): { html: string; text: string } {
  const { locale, bodyIntro, ctaLabel, ctaUrl, expiryNote } = args;
  const t = getDictionary(locale);
  const appName = t.common.appName;

  const safeUrl = escapeHtml(ctaUrl);
  const whyLine = interpolate(t.emails.whyLine, { appName });
  const ignoreLine = args.ignoreLine ?? t.emails.ignoreLine;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(appName)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
            <tr>
              <td style="padding:24px 24px 8px;font-size:18px;font-weight:600;">${escapeHtml(appName)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px;font-size:15px;line-height:1.5;">
                <p style="margin:8px 0 16px;">${escapeHtml(bodyIntro)}</p>
                <p style="margin:0 0 16px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">${escapeHtml(ctaLabel)}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#52525b;">${escapeHtml(t.emails.orPasteLink)}</p>
                <p style="margin:0 0 16px;font-size:13px;word-break:break-all;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
                ${expiryNote ? `<p style="margin:0 0 16px;font-size:13px;color:#52525b;">${escapeHtml(expiryNote)}</p>` : ""}
                <p style="margin:0 0 8px;font-size:13px;color:#52525b;">${escapeHtml(ignoreLine)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.5;color:#71717a;">
                <p style="margin:8px 0 4px;">${escapeHtml(whyLine)}</p>
                <p style="margin:0;">${escapeHtml(ORG_POSTAL_ADDRESS)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    appName,
    "",
    bodyIntro,
    "",
    `${ctaLabel}:`,
    ctaUrl,
    "",
    ...(expiryNote ? [expiryNote, ""] : []),
    ignoreLine,
    "",
    "—",
    whyLine,
    ORG_POSTAL_ADDRESS,
  ].join("\n");

  return { html, text };
}

type EmailTemplate = { subject: string; html: string; text: string };

function recoveryEmailTemplate(
  recoverUrl: string,
  locale: Locale,
): EmailTemplate {
  const t = getDictionary(locale);
  const { html, text } = renderEmail({
    locale,
    bodyIntro: interpolate(t.emails.recovery.bodyIntro, {
      appName: t.common.appName,
    }),
    ctaLabel: t.emails.recovery.ctaLabel,
    ctaUrl: recoverUrl,
    expiryNote: t.emails.recovery.expiryNote,
  });
  return { subject: t.emails.recovery.subject, html, text };
}

function loginLinkEmailTemplate(
  loginUrl: string,
  locale: Locale,
): EmailTemplate {
  const t = getDictionary(locale);
  const { html, text } = renderEmail({
    locale,
    bodyIntro: interpolate(t.emails.loginLink.bodyIntro, {
      appName: t.common.appName,
    }),
    ctaLabel: t.emails.loginLink.ctaLabel,
    ctaUrl: loginUrl,
    expiryNote: t.emails.loginLink.expiryNote,
  });
  return { subject: t.emails.loginLink.subject, html, text };
}

function registrationLinkEmailTemplate(
  activateUrl: string,
  locale: Locale,
): EmailTemplate {
  const t = getDictionary(locale);
  const { html, text } = renderEmail({
    locale,
    bodyIntro: interpolate(t.emails.registrationLink.bodyIntro, {
      appName: t.common.appName,
    }),
    ctaLabel: t.emails.registrationLink.ctaLabel,
    ctaUrl: activateUrl,
    expiryNote: t.emails.registrationLink.expiryNote,
  });
  return { subject: t.emails.registrationLink.subject, html, text };
}

function welcomeEmailTemplate(appUrl: string, locale: Locale): EmailTemplate {
  const t = getDictionary(locale);
  const { html, text } = renderEmail({
    locale,
    bodyIntro: interpolate(t.emails.welcome.bodyIntro, {
      appName: t.common.appName,
    }),
    ctaLabel: t.emails.welcome.ctaLabel,
    ctaUrl: appUrl,
    ignoreLine: t.emails.welcome.ignoreLine,
  });
  return { subject: t.emails.welcome.subject, html, text };
}

async function deliver(to: string, template: EmailTemplate): Promise<void> {
  await getClient().send(
    new SendEmailCommand({
      Source: fromAddress(),
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: [replyToAddress()],
      Message: {
        Subject: { Data: template.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: template.text, Charset: "UTF-8" },
          Html: { Data: template.html, Charset: "UTF-8" },
        },
      },
    }),
  );
}

export async function sendRecoveryEmail(args: {
  to: string;
  recoverUrl: string;
  locale?: Locale;
}): Promise<void> {
  await deliver(
    args.to,
    recoveryEmailTemplate(args.recoverUrl, args.locale ?? DEFAULT_LOCALE),
  );
}

export async function sendLoginLinkEmail(args: {
  to: string;
  loginUrl: string;
  locale?: Locale;
}): Promise<void> {
  await deliver(
    args.to,
    loginLinkEmailTemplate(args.loginUrl, args.locale ?? DEFAULT_LOCALE),
  );
}

export async function sendRegistrationLinkEmail(args: {
  to: string;
  activateUrl: string;
  locale?: Locale;
}): Promise<void> {
  await deliver(
    args.to,
    registrationLinkEmailTemplate(args.activateUrl, args.locale ?? DEFAULT_LOCALE),
  );
}

export async function sendWelcomeEmail(args: {
  to: string;
  appUrl: string;
  locale?: Locale;
}): Promise<void> {
  await deliver(
    args.to,
    welcomeEmailTemplate(args.appUrl, args.locale ?? DEFAULT_LOCALE),
  );
}

// Sample data for local template previews (see src/app/dev/emails). Building
// these doesn't touch the SES client, so no AWS credentials are needed. Preview
// labels use the default locale.
export const PREVIEW_EMAIL_TEMPLATES: Record<
  string,
  { label: string; build: (locale?: Locale) => EmailTemplate }
> = {
  recovery: {
    label: getDictionary(DEFAULT_LOCALE).emails.recovery.previewLabel,
    build: (locale = DEFAULT_LOCALE) =>
      recoveryEmailTemplate(
        "https://amencircle.com/auth/recover?token=sample-preview-token",
        locale,
      ),
  },
  "login-link": {
    label: getDictionary(DEFAULT_LOCALE).emails.loginLink.previewLabel,
    build: (locale = DEFAULT_LOCALE) =>
      loginLinkEmailTemplate(
        "https://amencircle.com/auth/email-login?token=sample-preview-token",
        locale,
      ),
  },
  "registration-link": {
    label: getDictionary(DEFAULT_LOCALE).emails.registrationLink.previewLabel,
    build: (locale = DEFAULT_LOCALE) =>
      registrationLinkEmailTemplate(
        "https://amencircle.com/auth/email-login?token=sample-preview-token",
        locale,
      ),
  },
  welcome: {
    label: getDictionary(DEFAULT_LOCALE).emails.welcome.previewLabel,
    build: (locale = DEFAULT_LOCALE) =>
      welcomeEmailTemplate("https://amencircle.com/dashboard", locale),
  },
};
