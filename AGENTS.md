# AGENTS.md

## Cursor Cloud specific instructions

This is a single-product, client-side React 18 + Vite 5 SPA (the Integration2U marketing landing page). There is **no backend, database, or API server** — the whole product is the static frontend.

### Services
- **Vite dev server** is the only service. Standard scripts live in `package.json`: `npm run dev` (port `5173`), `npm run build` (output to `dist/`), `npm run preview`. There is no lint or test script.

### Non-obvious notes
- `vite.config.js` sets `build.minify: 'terser'`, so `npm run build` requires the optional `terser` package. It is declared in `devDependencies`, so `npm install` covers it — but if a build ever fails with "terser not found", run `npm install -D terser`.
- The contact form and floating WhatsApp button do not POST anywhere; they build a `wa.me` / `api.whatsapp.com` deep link and open it. Submitting the form successfully = a WhatsApp redirect, not a server response.
- No environment variables are needed to run or build.
- Placeholder avatars (`via.placeholder.com`) and the Inter Google Font load from external CDNs; the page renders fine without network access via fallback fonts.
