export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadManifest } = await import("./lib/load-manifest.js");
    loadManifest();
  }
}
