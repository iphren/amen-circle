import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Region and credentials resolve from the Lambda execution role / environment
// (the default AWS provider chain) — no static keys. On Amplify WEB_COMPUTE the
// SSR Lambda provides AWS_REGION and role credentials automatically.
const client = new SESClient({});

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

  await client.send(
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
