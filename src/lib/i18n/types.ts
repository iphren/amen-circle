// Shared i18n types. Kept dependency-free so both server and client code can
// import them.

// A block inside a legal document (privacy / terms). `md` strings support a
// tiny markdown-lite subset rendered by <Inline> (see legal-doc.tsx):
//   **bold**            -> <strong>
//   [text](href)        -> <a href>
// and `{token}` interpolation for operator identity values.
export interface LegalBlock {
  type: "p" | "ul";
  // Present for type "p".
  md?: string;
  // Present for type "ul".
  items?: string[];
}

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

// Recursively makes every field optional so a locale file can fill keys
// incrementally; anything omitted (or left blank) falls back to en-GB.
export type DeepPartial<T> = T extends string
  ? string
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : { [K in keyof T]?: DeepPartial<T[K]> };
