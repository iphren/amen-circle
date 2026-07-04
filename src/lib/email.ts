import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { OPERATOR } from "./legal";

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

const APP_NAME = "Amen Circle";

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
  bodyIntro: string;
  ctaLabel: string;
  ctaUrl: string;
  expiryNote: string;
}): { html: string; text: string } {
  const { bodyIntro, ctaLabel, ctaUrl, expiryNote } = args;

  const safeUrl = escapeHtml(ctaUrl);
  const whyLine = `You're receiving this because this email address was used to sign in to ${APP_NAME}.`;
  const ignoreLine =
    "If you didn't request this, you can safely ignore this email — nothing changes.";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(APP_NAME)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
            <tr>
              <td style="padding:24px 24px 8px;font-size:18px;font-weight:600;">${escapeHtml(APP_NAME)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px;font-size:15px;line-height:1.5;">
                <p style="margin:8px 0 16px;">${escapeHtml(bodyIntro)}</p>
                <p style="margin:0 0 16px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">${escapeHtml(ctaLabel)}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#52525b;">Or paste this link into your browser:</p>
                <p style="margin:0 0 16px;font-size:13px;word-break:break-all;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
                <p style="margin:0 0 16px;font-size:13px;color:#52525b;">${escapeHtml(expiryNote)}</p>
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
    APP_NAME,
    "",
    bodyIntro,
    "",
    `${ctaLabel}:`,
    ctaUrl,
    "",
    expiryNote,
    "",
    ignoreLine,
    "",
    "—",
    whyLine,
    ORG_POSTAL_ADDRESS,
  ].join("\n");

  return { html, text };
}

type EmailTemplate = { subject: string; html: string; text: string };

function recoveryEmailTemplate(recoverUrl: string): EmailTemplate {
  const { html, text } = renderEmail({
    bodyIntro: `You asked to recover access to your ${APP_NAME} account.`,
    ctaLabel: "Set up a new passkey",
    ctaUrl: recoverUrl,
    expiryNote:
      "This link expires in 20 minutes and can be used once. Setting up a new passkey removes any old passkeys on the account.",
  });
  return { subject: "Recover your Amen Circle account", html, text };
}

function loginLinkEmailTemplate(loginUrl: string): EmailTemplate {
  const { html, text } = renderEmail({
    bodyIntro: `You asked to sign in to ${APP_NAME} with an email link.`,
    ctaLabel: "Sign in",
    ctaUrl: loginUrl,
    expiryNote: "This link expires in 15 minutes and can be used once.",
  });
  return { subject: "Your Amen Circle sign-in link", html, text };
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
}): Promise<void> {
  await deliver(args.to, recoveryEmailTemplate(args.recoverUrl));
}

export async function sendLoginLinkEmail(args: {
  to: string;
  loginUrl: string;
}): Promise<void> {
  await deliver(args.to, loginLinkEmailTemplate(args.loginUrl));
}

// Sample data for local template previews (see src/app/dev/emails). Building
// these doesn't touch the SES client, so no AWS credentials are needed.
export const PREVIEW_EMAIL_TEMPLATES: Record<
  string,
  { label: string; build: () => EmailTemplate }
> = {
  recovery: {
    label: "Account recovery",
    build: () =>
      recoveryEmailTemplate(
        "https://amencircle.com/auth/recover?token=sample-preview-token",
      ),
  },
  "login-link": {
    label: "Email sign-in link",
    build: () =>
      loginLinkEmailTemplate(
        "https://amencircle.com/auth/email-login?token=sample-preview-token",
      ),
  },
};
