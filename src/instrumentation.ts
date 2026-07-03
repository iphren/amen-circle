// Next.js calls register() in both the Edge and Node.js runtimes. Keep this
// file free of Node built-in imports so it can be bundled for Edge; the
// Node-only work lives in instrumentation-node.ts and is pulled in with a
// dynamic import that's only reached in the Node runtime.
export async function register() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerNode } = await import("./instrumentation-node");
  await registerNode();
}
