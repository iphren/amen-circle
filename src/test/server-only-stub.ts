// Test stub for the `server-only` marker package. In the app it guards modules
// against being pulled into a client bundle; under vitest (plain Node) there is
// no bundler to resolve it, so we alias it to this no-op (see vitest.config.ts).
export {};
