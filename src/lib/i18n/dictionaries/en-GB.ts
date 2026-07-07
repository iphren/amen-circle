import type { LegalSection } from "@/lib/i18n/types";

// The English (UK) dictionary — the source of truth for every user-facing
// string and the shape all other locales are validated against
// (`Dictionary = typeof enGB`). Add new copy here first.
export const enGB = {
  common: {
    appName: "Amen Circle",
    tagline:
      "Small circles of trusted friends, lifting each other up in prayer.",
    backToSignIn: "Back to sign in",
    backToDashboard: "Back to dashboard",
    goHome: "Go home",
    requestNewLink: "Request a new link",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    genericError: "Something went wrong.",
    failed: "failed",
    cancel: "Cancel",
    confirm: "Confirm",
  },

  metadata: {
    defaultTitle: "Amen Circle",
    titleTemplate: "%s · Amen Circle",
    description:
      "Create prayer rooms with friends, share requests, and pray for one another. Requests are encrypted and privately assigned. Give all glory to God.",
    signInTitle: "Sign in",
    emailLoginTitle: "Sign in with email",
    recoverTitle: "Recover account",
    joinTitle: "Join a room",
    roomsTitle: "Rooms",
    myPrayersTitle: "My prayers",
    settingsTitle: "Settings",
    roomFallbackTitle: "Room",
    privacyTitle: "Privacy Policy",
    privacyDescription: "How Amen Circle collects, uses and protects your data.",
    termsTitle: "Terms of Service",
    termsDescription: "The terms that govern your use of Amen Circle.",
  },

  nav: {
    dashboard: "Dashboard",
    myPrayers: "My prayers",
    settings: "Settings",
    signOut: "Sign out",
    signingOut: "Signing out…",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  footer: {
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact / report content",
    languageLabel: "Language",
  },

  landing: {
    register: "Register",
    signIn: "Sign in",
    prayerRulesTitle: "Prayer rules",
    prayerRules: [
      "Invite people you trust.",
      "Write down one prayer request.",
      "Each request goes to another member.",
      "Don't reveal who you pray for.",
      "You won't know who prays for you.",
      "Share your testimony when ready.",
      "Give all glory to God.",
    ],
  },

  auth: {
    createTitle: "Create your passkey",
    signInTitle: "Sign in with passkey",
    createDescription:
      "We'll save a passkey on this device — no password needed.",
    signInDescription: "Pick the passkey for the account you want to use.",
    displayNameLabel: "Display name",
    displayNamePlaceholder: "How others will see you",
    creatingPasskey: "Creating passkey…",
    createPasskey: "Create passkey",
    waitingForPasskey: "Waiting for passkey…",
    continueWithPasskey: "Continue with passkey",
    haveAccount: "Have an account? Sign in",
    newHere: "New here? Register",
    troublePasskey: "Trouble with your passkey? Email me a sign-in link",
    lostDevice: "Lost your device?",
    errors: {
      couldNotStartRegistration: "could not start registration",
      registrationVerificationFailed: "registration verification failed",
      registrationFailed: "registration failed",
      couldNotStartSignIn: "could not start sign-in",
      signInFailed: "sign-in failed",
    },
  },

  emailLogin: {
    title: "Sign in with an email link",
    checkInbox: "Check your inbox.",
    prompt:
      "Trouble with your passkey? Enter your email and we'll send you a link to sign in.",
    // {email} is replaced with the address the user typed.
    sentNote:
      "If an account exists for {email}, we've sent a sign-in link. It expires in 15 minutes and can be used once.",
    sending: "Sending…",
    sendLink: "Send sign-in link",
    confirmTitle: "Sign in to Amen Circle",
    confirmDescription: "Click below to finish signing in on this device.",
    signingIn: "Signing in…",
    signIn: "Sign in",
    invalidLink: "This sign-in link is invalid or expired.",
  },

  recover: {
    title: "Recover your account",
    checkInbox: "Check your inbox.",
    prompt:
      "Lost the device with your passkey? Enter your email and we'll send a recovery link.",
    // {email} is replaced with the address the user typed.
    sentNote:
      "If an account exists for {email}, we've sent a recovery link. It expires in 20 minutes. Setting up a new passkey will remove the old ones from your account.",
    sending: "Sending…",
    sendLink: "Send recovery link",
    enrollTitle: "Set up a new passkey",
    enrollDescription:
      "This finishes recovering your account. Your old passkeys will be removed and replaced with a new one on this device.",
    settingUp: "Setting up…",
    createNewPasskey: "Create new passkey",
    invalidLink: "This recovery link is invalid or expired.",
    couldNotSetup: "could not set up your new passkey",
    recoveryFailed: "recovery failed",
  },

  consent: {
    // markdown-lite: **bold** and [text](href)
    terms:
      "I am **18 or older** and accept the [Terms](/terms) and [Privacy Policy](/privacy).",
    religious:
      "I explicitly consent to Amen Circle storing and processing the prayer requests I write, which may reveal my religious beliefs. I can withdraw this at any time by deleting my requests or my account.",
    gateTitle: "Before you continue",
    gateDescription:
      "We've added a privacy policy and terms of service. Because prayer requests can reveal your religious beliefs, we need your explicit consent to keep storing them.",
    agreeAndContinue: "Agree and continue",
    saving: "Saving…",
    gateFootnote:
      "If you don't agree, you can delete your account and data from Settings.",
    couldNotSave: "could not save your consent",
  },

  dashboard: {
    startOrJoinTitle: "Start or join a room",
    startOrJoinDescription:
      "Enter a 6-character code to join someone's circle, or type a name to start your own.",
    roomInputLabel: "Room code or name",
    roomInputPlaceholder: "Room code (e.g. ABC234) or a name…",
    joining: "Joining…",
    joinRoom: "Join room",
    creating: "Creating…",
    createRoom: "Create room",
    hintLooksLikeCode: "Looks like a room code — you'll join that room.",
    hintNotACode: "Not a code — you'll create a new room with this name.",
    hintEmpty: "Type a code to join, or a name to create.",
    couldNotCreateRoom: "could not create room",
    couldNotJoin: "could not join",
    yourRooms: "Your rooms",
    noRooms:
      "You haven't joined any rooms yet. Create one or join with a code above.",
    // {code} and {count} interpolated; {plural} is "" or "s".
    roomMeta: "Code {code} · {count} member{plural}",
    youOwnThis: " · you own this",
    // {date} interpolated
    created: "Created {date}",
  },

  join: {
    title: "Join a room",
    invitedDescription: "You've been invited to this prayer circle.",
    signInDescription: "Sign in to join this prayer circle.",
    roomCodeLabel: "Room code",
    joining: "Joining…",
    joinRoom: "Join room",
    signInToJoin: "Sign in to join",
    newHereRegister: "New here? Register",
    invalidTitle: "Invalid link",
    invalidDescription:
      "This join link is missing or has an invalid room code.",
    couldNotJoin: "could not join",
  },

  myPrayers: {
    title: "My prayers",
    receivedSubtitle: "Requests entrusted to you across all your rooms.",
    sentSubtitle: "Requests you have shared with your rooms.",
    tabsLabel: "My prayers tabs",
    tabReceived: "Received",
    tabSent: "Sent",
    receivedEmpty:
      "Nothing here yet. Once a room you're in is closed, requests assigned to you will show up here.",
    sentEmpty:
      "Nothing here yet. Share a request in one of your rooms and it will show up here.",
    prayerAnswered: "Prayer answered",
    confidential: "Confidential",
    // {name} interpolated (rendered as a chip)
    fromLabel: "From",
    report: "Report",
    // {id} interpolated
    reportSubject: "Report content — request {id}",
    delete: "Delete",
    moreActions: "More actions",
    undo: "Undo",
    deleteConfirmTitle: "Delete this prayer request?",
    deleteConfirmDescription:
      "This permanently removes it, including from the list of anyone praying for it. This cannot be undone.",
    deleteConfirmText: "Delete",
    couldNotUpdate: "could not update your request",
    couldNotDelete: "could not delete your request",
  },

  room: {
    notMemberTitle: "Not a member",
    notMemberDescription: "Ask the owner to share the room code with you.",
    // {code}, {count}, {plural}
    roomMeta: "Code {code} · {count} member{plural}",
    membersTitle: "Members",
    // {submitted} of {total}
    membersSubmitted: "{submitted} of {total} have submitted",
    you: "(you)",
    ownerTag: "· owner",
    submitted: "✓ submitted",
    waiting: "waiting",
    ownerLabel: "Owner",
    remove: "Remove",
    // {name} interpolated
    removeConfirmTitle: "Remove {name}?",
    removeConfirmDescription:
      "They will be removed from this circle and the request they shared here will be deleted.",
    removeConfirmText: "Remove",
    couldNotRemoveMember: "could not remove member",
    share: "Copy link",
    shareCopied: "Copied!",
    closedTitle: "Room is closed",
    closedDescription:
      "Requests have been assigned. Head over to your prayers to see who you're lifting up.",
    goToMyPrayers: "Go to my prayers",
    yourRequestTitle: "Your prayer request",
    yourRequestUpdateDescription:
      "You can update this at any time before the room is closed.",
    yourRequestNewDescription:
      "Share what's on your heart. You can update it later if needed.",
    requestLabel: "Request",
    requestPlaceholder: "Type your prayer request…",
    confidentialRequestPlaceholder:
      "(Your previous request is confidential and not shown here. Type to replace it.)",
    confidentialLabel: "Confidential",
    confidentialHint:
      "Ask the person who receives this request to keep it confidential; the content is hidden until they tap to reveal it.",
    saving: "Saving…",
    updateRequest: "Update request",
    submitRequest: "Submit request",
    updated: "Updated.",
    submittedMsg: "Submitted.",
    couldNotSubmit: "could not submit",
    closeTitle: "Prayer assignment",
    closeDescription:
      "When everyone's ready, shuffle the requests and assign each one to someone other than its author.",
    closing: "Closing…",
    closeAction: "Close room",
    needTwoMembers: "Need at least 2 members to assign.",
    noRequestsYet: "No requests submitted yet.",
    closeConfirmTitle: "Close room & assign?",
    closeConfirmDescription:
      "Requests will be shuffled and assigned now — this can't be undone.",
    closeConfirmText: "Close & assign",
    closeCancelText: "Not yet",
    couldNotCloseRoom: "could not close room",
    cancelling: "Cancelling…",
    cancelRoom: "Cancel room",
    cancelConfirmTitle: "Cancel this room?",
    cancelConfirmDescription:
      "It will be deleted for everyone, along with all requests. This can't be undone.",
    cancelKeepText: "Keep room",
    leaving: "Leaving…",
    leaveRoom: "Leave room",
    leaveConfirmTitle: "Leave this room?",
    leaveConfirmDescription: "Your prayer request here will be removed.",
    leaveStayText: "Stay",
    somethingWentWrong: "something went wrong",
    revealConfidential: "Reveal confidential message",
    hideConfidential: "Hide confidential message",
    hide: "Hide",
    tapToReveal: "Tap to reveal message",
  },

  roomStatus: {
    open: "open",
    closed: "closed",
  },

  settings: {
    title: "Settings",
    subtitle: "Manage your passkeys, your data, and your account.",
    displayNameTitle: "Display name",
    displayNameDescription:
      "The name others see next to your prayers and in your circles.",
    couldNotSaveName: "could not save your name",
    dataTitle: "Your data",
    dataDescription:
      "Download a copy of everything we hold about you, profile, consent records, circles, and your prayer requests, as JSON.",
    downloadData: "Download my data",
    languageTitle: "Language",
    languageDescription:
      "Choose the language used across Amen Circle. This is saved to your account and syncs across your devices.",
    languageLabel: "Display language",
    languageSaving: "Saving…",
    couldNotSaveLanguage: "could not save your language",
    sessionTitle: "Session",
    sessionDescription: "Sign out of Amen Circle on this device.",
    passkeysTitle: "Passkeys",
    passkeysDescription:
      "Add a backup passkey on another device so you don't get locked out if you lose this one.",
    syncedPasskey: "Synced passkey",
    deviceBoundPasskey: "Device-bound passkey",
    // {date} interpolated
    passkeyAdded: "Added {date}",
    save: "Save",
    cancel: "Cancel",
    rename: "Rename",
    remove: "Remove",
    passkeyNameLabel: "Passkey name",
    nameCannotBeEmpty: "Name can't be empty.",
    onlyPasskeyNote: "You can't remove your only passkey. Add a backup first.",
    working: "Working…",
    addBackupPasskey: "Add a backup passkey",
    couldNotStartEnrollment: "could not start enrollment",
    enrollmentFailed: "enrollment failed",
    couldNotAddPasskey: "could not add passkey",
    couldNotRenamePasskey: "could not rename passkey",
    couldNotRemovePasskey: "could not remove passkey",
    dangerTitle: "Danger zone",
    // markdown-lite: [text](href)
    dangerDescription:
      "Deleting your account removes your prayer requests and any circles you own, for all their members. Consider [downloading your data](/api/my/export) first.",
    deleting: "Deleting…",
    deleteAccount: "Delete account",
    deleteConfirmTitle: "Delete your account?",
    deleteConfirmDescription:
      "This permanently deletes your account, your prayer requests, and any circles you own (for all their members). This cannot be undone.",
    deleteConfirmText: "Delete everything",
    couldNotDeleteAccount: "could not delete your account",
  },

  emails: {
    back: "← Amen Circle",
    orPasteLink: "Or paste this link into your browser:",
    // {appName} interpolated
    whyLine:
      "You're receiving this because this email address was used to sign in to {appName}.",
    ignoreLine:
      "If you didn't request this, you can safely ignore this email — nothing changes.",
    recovery: {
      subject: "Recover your Amen Circle account",
      previewLabel: "Account recovery",
      // {appName} interpolated
      bodyIntro: "You asked to recover access to your {appName} account.",
      ctaLabel: "Set up a new passkey",
      expiryNote:
        "This link expires in 20 minutes and can be used once. Setting up a new passkey removes any old passkeys on the account.",
    },
    loginLink: {
      subject: "Your Amen Circle sign-in link",
      previewLabel: "Email sign-in link",
      // {appName} interpolated
      bodyIntro: "You asked to sign in to {appName} with an email link.",
      ctaLabel: "Sign in",
      expiryNote: "This link expires in 15 minutes and can be used once.",
    },
  },

  // Error messages returned by API route handlers and shown to the user. The
  // route resolves the request locale and returns the translated string.
  errors: {
    unauthorized: "unauthorized",
    forbidden: "forbidden",
    notFound: "not found",
    verificationFailed: "verification failed",
    // Rooms
    roomNotFound: "room not found",
    roomClosed: "room is closed",
    alreadyClosed: "already closed",
    notAMember: "not a member",
    ownerOnly: "owner only",
    onlyOwnerCanRemove: "only the owner can remove members",
    ownerCannotBeRemoved: "the owner cannot be removed",
    ownerMustCancel: "owner must cancel the room, not leave",
    needTwoMembers: "need at least 2 members",
    noRequestsToAssign: "no requests to assign",
    couldNotGenerateAssignment: "could not generate valid assignment",
    couldNotGenerateCode: "could not generate unique code",
    codeRequired: "code required",
    nameRequired: "name required",
    contentRequired: "content required",
    // Auth
    noPendingEnrollment: "no pending enrollment",
    noPendingRegistration: "no pending registration",
    noPendingRecovery: "no pending recovery",
    noPendingLogin: "no pending login",
    unknownCredential: "unknown credential",
    couldNotStartRegistration: "could not start registration",
    emailAndDisplayNameRequired: "email and displayName required",
    accountExists: "An account with this email already exists. Please sign in.",
    recoveryLinkInvalid: "This recovery link is invalid or has expired.",
    signInLinkInvalid: "This sign-in link is invalid or has expired.",
    onlyPasskey:
      "You can't remove your only passkey. Add a backup first, or use account recovery.",
    // {max} interpolated
    passkeyNameLength: "Name must be 1–{max} characters.",
    // {max} interpolated
    displayNameLength: "Name must be 1–{max} characters.",
    // Misc
    mustAcceptTermsToRegister:
      "You must accept the terms and consent to the processing of your prayer requests to register.",
    mustAcceptTerms:
      "You must accept the terms and consent to the processing of your prayer requests.",
    unsupportedLanguage: "unsupported language",
    answeredMustBeBoolean: "answered must be a boolean",
  },

  notFound: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has moved.",
    backHome: "← Back to Amen Circle",
  },

  legal: {
    back: "← Amen Circle",
    // {version} interpolated
    lastUpdated: "Last updated: {version}",
    privacy: {
      title: "Privacy Policy",
      sections: [
        {
          title: "1. Who we are",
          blocks: [
            {
              type: "p",
              md: "Amen Circle ({domain}) is operated by {legalName} (trading as {tradingName}, company no. {registrationNumber}), registered at {registeredAddress}. We are the data controller for the personal data described in this policy. You can contact us at [{contactEmail}](mailto:{contactEmail}).",
            },
          ],
        },
        {
          title: "2. What we collect",
          blocks: [
            {
              type: "ul",
              items: [
                "**Account data** — your email address and display name.",
                "**Passkey metadata** — a public key and device information used to sign you in. Your biometrics (fingerprint, face) never leave your device and are never sent to us.",
                "**Prayer requests** — the free-text requests you write. Because prayer content can reveal your religious beliefs, this is **special category data** under UK GDPR Article 9, and we only process it with your explicit consent.",
                "**Circle membership** — which circles you belong to and which requests are assigned to you.",
                "**Session cookie** — a single strictly-necessary cookie that keeps you signed in (see section 5).",
                "**Access logs** — our hosting provider (AWS) records IP addresses and request metadata in server logs for security and troubleshooting.",
              ],
            },
          ],
        },
        {
          title: "3. Why we process it (lawful bases)",
          blocks: [
            {
              type: "ul",
              items: [
                "**Providing the service** (account, circles, assignments): performance of a contract — UK GDPR Article 6(1)(b).",
                "**Prayer request content**: your explicit consent — Article 9(2)(a) — which you give at registration and can withdraw at any time by deleting your requests or your account.",
                "**Security logging**: our legitimate interest in keeping the service secure — Article 6(1)(f).",
              ],
            },
          ],
        },
        {
          title: "4. Who processes it for us",
          blocks: [
            {
              type: "p",
              md: "We use Amazon Web Services as our processor: the application and its database run on an AWS server in the eu-west-2 (London) region, SES sends transactional email, and CloudFront carries traffic between you and the server — its edge locations may handle data in transit outside the UK, but your data is stored only in London. We do not sell or share your data with anyone else, and there is no advertising or analytics tracking on this site.",
            },
          ],
        },
        {
          title: "5. Cookies",
          blocks: [
            {
              type: "p",
              md: "We set exactly one cookie, `amen-circle-session`, which is strictly necessary to keep you signed in. It is httpOnly, lasts up to 30 days, and contains no tracking identifiers. Because it is strictly necessary, no cookie consent banner is required under PECR. We use no analytics or third-party cookies of any kind.",
            },
          ],
        },
        {
          title: "6. How we protect it",
          blocks: [
            {
              type: "p",
              md: "All prayer request content is encrypted at rest (AES-256-GCM), in addition to disk-level encryption on our server. Sign-in uses passkeys, so we never store passwords. Sign-in and recovery links are single-use, short-lived, and stored only as hashes.",
            },
          ],
        },
        {
          title: "7. How long we keep it",
          blocks: [
            {
              type: "ul",
              items: [
                "Account data is kept until you delete your account, at which point it is deleted immediately.",
                "Prayer requests are deleted when you delete them, leave a circle, a circle is deleted, or you delete your account.",
                "Expired sign-in and recovery links are purged automatically.",
                "Server access logs are retained for 30 days.",
              ],
            },
          ],
        },
        {
          title: "8. Your rights",
          blocks: [
            { type: "p", md: "Under UK GDPR you have the right to:" },
            {
              type: "ul",
              items: [
                "**Access and portability** — download everything we hold about you from Settings → Download my data.",
                "**Erasure** — delete your account (and all your data) from Settings → Delete account.",
                "**Rectification** — correct your details by contacting us.",
                "**Withdraw consent** — at any time, by deleting your requests or your account. Withdrawal doesn't affect processing that happened before.",
                "**Restriction and objection** — contact us at [{contactEmail}](mailto:{contactEmail}).",
                "**Complain** — to the Information Commissioner's Office at [ico.org.uk](https://ico.org.uk).",
              ],
            },
          ],
        },
        {
          title: "9. Who can use Amen Circle",
          blocks: [
            {
              type: "p",
              md: "Amen Circle is for adults only. You must be 18 or older to create an account.",
            },
          ],
        },
        {
          title: "10. Changes to this policy",
          blocks: [
            {
              type: "p",
              md: "If we make material changes we will update this page and the \"last updated\" date above, and where appropriate ask for your consent again.",
            },
          ],
        },
      ] as LegalSection[],
    },
    terms: {
      title: "Terms of Service",
      sections: [
        {
          title: "1. What Amen Circle is",
          blocks: [
            {
              type: "p",
              md: "Amen Circle ({domain}) lets small circles of trusted friends share prayer requests and pray for one another. The service is operated by {legalName} (trading as {tradingName}, company no. {registrationNumber}), registered at {registeredAddress}. By creating an account you agree to these terms.",
            },
          ],
        },
        {
          title: "2. Eligibility",
          blocks: [
            { type: "p", md: "You must be 18 or older to use Amen Circle." },
          ],
        },
        {
          title: "3. Your account",
          blocks: [
            {
              type: "p",
              md: "You sign in with passkeys or single-use email links. You are responsible for keeping your devices and email account secure, and for everything done through your account. Tell us promptly at [{contactEmail}](mailto:{contactEmail}) if you believe your account has been compromised.",
            },
          ],
        },
        {
          title: "4. Your content",
          blocks: [
            {
              type: "p",
              md: "Your prayer requests remain yours. You grant us a limited licence to store, encrypt, and display them to the members of the circle you shared them with — that is the whole purpose of the service and we use your content for nothing else.",
            },
            {
              type: "p",
              md: "**Remember that other members read what you share.** Circles are private, but the people in your circle will see the requests assigned to them. Do not share anything you would not want the other members of your circle to know, including other people's private information.",
            },
          ],
        },
        {
          title: "5. Acceptable use",
          blocks: [
            {
              type: "p",
              md: "You must not use Amen Circle to post or share content that is:",
            },
            {
              type: "ul",
              items: [
                "unlawful, or that infringes anyone else's rights;",
                "abusive, harassing, threatening, or hateful;",
                "deliberately deceptive, or spam or advertising of any kind.",
              ],
            },
            {
              type: "p",
              md: "You must not attempt to break, probe, or overload the service, or access other users' data.",
            },
          ],
        },
        {
          title: "6. Reporting content and moderation",
          blocks: [
            {
              type: "p",
              md: "If you see content that breaks these terms, report it to [{contactEmail}](mailto:{contactEmail}) (include the circle and, if possible, the request). We may remove content, remove members from circles, or suspend or terminate accounts that violate these terms. Circle owners can also remove members from their own circles.",
            },
          ],
        },
        {
          title: "7. Circles and account deletion",
          blocks: [
            {
              type: "p",
              md: "If you delete your account, your prayer requests are deleted, and **any circles you own are deleted for all their members**, including the requests in them. Leaving a circle deletes the requests you shared in it.",
            },
          ],
        },
        {
          title: "8. Not professional advice",
          blocks: [
            {
              type: "p",
              md: "Amen Circle is a tool for mutual prayer among friends. Nothing on the service is professional, medical, mental-health, legal, or pastoral advice. If you or someone you know is in crisis, contact local emergency services or a qualified professional.",
            },
          ],
        },
        {
          title: "9. The service is provided as is",
          blocks: [
            {
              type: "p",
              md: "Amen Circle is provided free of charge, \"as is\" and \"as available\", without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the service. Nothing in these terms limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence, or fraud.",
            },
          ],
        },
        {
          title: "10. Ending or changing the service",
          blocks: [
            {
              type: "p",
              md: "You can stop using Amen Circle and delete your account at any time. We may suspend or terminate accounts that break these terms, and we may change or discontinue the service; if we discontinue it we will give reasonable notice where practical. We may update these terms — material changes will be reflected in the \"last updated\" date above.",
            },
          ],
        },
        {
          title: "11. Governing law",
          blocks: [
            {
              type: "p",
              md: "These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.",
            },
          ],
        },
      ] as LegalSection[],
    },
  },
};

export type Dictionary = typeof enGB;
