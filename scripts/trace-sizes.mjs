import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const serverDir = ".next/server";
const traces = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".nft.json")) traces.push(path);
  }
};
walk(serverDir);

const projectRoot = resolve(".");
for (const trace of traces.sort()) {
  const { files } = JSON.parse(readFileSync(trace, "utf8"));
  let bytes = 0;
  let appFiles = 0;
  for (const file of files) {
    const abs = resolve(dirname(trace), file);
    try {
      const st = statSync(abs);
      if (st.isFile()) bytes += st.size;
    } catch {}
    if (abs.startsWith(projectRoot) && !abs.includes("/node_modules/") && !abs.includes("/.next/")) appFiles++;
  }
  const mb = (bytes / 1024 / 1024).toFixed(1);
  console.log(`${trace.replace(serverDir + "/", "").padEnd(40)} files=${String(files.length).padStart(5)}  project-source-files=${String(appFiles).padStart(3)}  ${mb.padStart(7)} MB`);
}
