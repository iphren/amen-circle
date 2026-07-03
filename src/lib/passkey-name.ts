// Community AAGUID -> authenticator/provider name map, sourced from
// https://github.com/passkeydeveloper/passkey-authenticator-aaguids
// (combined_aaguid.json, icons stripped). Refresh occasionally as new
// authenticators appear. Last synced: 2026-07-03.
import aaguids from "@/lib/aaguid.json";

const AAGUID_NAMES = aaguids as Record<string, string>;

// Authenticators that omit their AAGUID (e.g. some device-bound security keys,
// or privacy-preserving platforms) report this all-zero value, which carries no
// provider information.
const ZERO_AAGUID = "00000000-0000-0000-0000-000000000000";

/**
 * Derive a friendly, human-readable name for a freshly enrolled passkey from its
 * authenticator AAGUID, falling back to a deviceType-based label when the AAGUID
 * is unknown or absent. The returned name is stored so the settings manager can
 * distinguish otherwise-identical passkeys; users can rename it afterwards.
 */
export function derivePasskeyName(args: {
  aaguid: string;
  deviceType: string; // "multiDevice" | "singleDevice"
}): string {
  const provider =
    args.aaguid && args.aaguid !== ZERO_AAGUID
      ? AAGUID_NAMES[args.aaguid]
      : undefined;
  if (provider) return provider;

  return args.deviceType === "multiDevice"
    ? "Synced passkey"
    : "Device-bound passkey";
}
