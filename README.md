# Next.js 16.4 Turbopack traces the whole project for a `process.cwd()` path

When server code reads a file whose path is built from `process.cwd()`, `next build` with Turbopack
on Next.js 16.4 adds **every file in the project directory**, including `public/`, to the function's
output file trace. Next.js 16.3 and the webpack build trace only the code that runs.

On Vercel, the instrumentation trace is shipped with every function, so every function grows.
Once `public/` is large enough, the deploy fails with `NEXT_REQUIRED_FILES_LIMIT`.

## The trigger

[`lib/load-manifest.js`](lib/load-manifest.js), imported from [`instrumentation.js`](instrumentation.js):

```js
export function loadManifest(manifestPath = join(process.cwd(), ".manifest.json")) {
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return undefined;
  }
}
```

`npm run build` first runs [`scripts/make-fixture.mjs`](scripts/make-fixture.mjs), which creates a
260 MB sparse file at `public/assets/large.bin`. It stands in for a real app's static assets and
costs no disk space.

## Reproduce

```bash
npm ci
npm run build
npm run traces                 # size of every .nft.json under .next/server
npx vercel@65.1.0 build --yes  # packages the functions the way Vercel does
```

`vercel build` needs `.vercel/project.json`. With no linked project, this file is enough:

```json
{ "projectId": "_", "orgId": "_", "settings": { "framework": "nextjs", "nodeVersion": "24.x" } }
```

To compare against 16.3, run `npm i next@16.3.8 --save-exact` and repeat.

## Results

Node 24.16.0, macOS, `next build` (Turbopack unless noted).

| Build | `instrumentation.js.nft.json` | `vercel build` |
|---|---|---|
| Next 16.3.8 | 3 files, 0.0 MB | succeeds |
| Next 16.4.1 | 13 files, **260.1 MB** (every project file, plus `public/assets/large.bin`) | **fails** |
| Next 16.4.1, `next build --webpack` | 3 files, 0.0 MB | not run |
| Next 16.4.1, `/* turbopackIgnore: true */` on the `readFileSync` argument | 3 files, 0.0 MB | not run |

`vercel build` on 16.4.1:

```
Warning: Max serverless function size of 262 MB uncompressed reached
Large Dependencies       Uncompressed size
public/assets/large.bin             260 MB
node_modules/next/dist           561.92 KB

Error: [NEXT_REQUIRED_FILES_LIMIT] Required files read using Node.js fs library and node_modules exceed max lambda size of 262144000 bytes
```

## Expected

A path the tracer cannot resolve at build time is left out, as in 16.3 and in the webpack build.
Or, at most, the trace includes the file the path could resolve to, never the whole project directory.

## Real-world impact

In a production app (cal.com, Yarn monorepo), this took functions from about 70 MB to 300 to 370 MB
uncompressed. A deploy on 16.4.1 failed with:

```
The Vercel Function "[user]/embed" is 303.37mb uncompressed which exceeds the maximum uncompressed size limit of 250mb.
```

That blocks the upgrade to 16.4.1, which carries the fix for GHSA-673q-mjm6-r5xr.
