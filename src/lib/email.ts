import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

export async function sendRecoveryEmail(args: {
  to: string;
  recoverUrl: string;
}): Promise<void> {
  const { to, recoverUrl } = args;

  const text = [
    "Someone (hopefully you) asked to recover access to your Amen Circle account.",
    "",
    "Open this link to set up a new passkey. It expires in 20 minutes and can be",
    "used once. Setting up a new passkey removes any old passkeys on the account.",
    "",
    recoverUrl,
    "",
    "If you didn't request this, you can safely ignore this email — nothing changes.",
  ].join("\n");

  const html = `
    <p>Someone (hopefully you) asked to recover access to your <strong>Amen Circle</strong> account.</p>
    <p>
      <a href="${recoverUrl}">Set up a new passkey</a><br />
      This link expires in 20 minutes and can be used once. Setting up a new
      passkey removes any old passkeys on the account.
    </p>
    <p>If you didn't request this, you can safely ignore this email — nothing changes.</p>
  `;

  await getClient().send(
    new SendEmailCommand({
      Source: fromAddress(),
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: "Recover your Amen Circle account", Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    }),
  );
}

export async function sendLoginLinkEmail(args: {
  to: string;
  loginUrl: string;
}): Promise<void> {
  const { to, loginUrl } = args;

  const text = [
    "Someone (hopefully you) asked to sign in to Amen Circle with an email link.",
    "",
    "Open this link to sign in. It expires in 15 minutes and can be used once.",
    "",
    loginUrl,
    "",
    "If you didn't request this, you can safely ignore this email — nothing changes.",
  ].join("\n");

  const html = `
    <p>Someone (hopefully you) asked to sign in to <strong>Amen Circle</strong> with an email link.</p>
    <p>
      <a href="${loginUrl}">Sign in to Amen Circle</a><br />
      This link expires in 15 minutes and can be used once.
    </p>
    <p>If you didn't request this, you can safely ignore this email — nothing changes.</p>
  `;

  await getClient().send(
    new SendEmailCommand({
      Source: fromAddress(),
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: "Your Amen Circle sign-in link", Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    }),
  );
}
