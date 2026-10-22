import { readFileSync } from "node:fs";
import { join } from "node:path";

// Trigger 1: a runtime path built from process.cwd() with a default argument.
export function loadManifest(manifestPath = join(process.cwd(), ".manifest.json")) {
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return undefined;
  }
}
