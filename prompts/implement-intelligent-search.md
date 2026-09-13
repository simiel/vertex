# Implement intelligent search over Vertex courses and lessons

## Goal

Build the Vertex intelligent learning search end to end: connect a server-only Next.js search route to the Sanity Context MCP and an OpenAI-backed Vercel AI SDK agent, then expose a full results page with ranked video-moment and lesson results over the existing Sanity course and lesson content.

## Guidance used

- `AGENTS.md` repository rules, especially the search behavior, server/client boundaries, and required checks.
- `.agents/skills/create-agent-with-sanity-context/SKILL.md` and its Next.js reference: HTTP MCP transport, bearer authentication, cached `/initial-context`, tool discovery, and excluding `initial_context` after injection.
- `.agents/skills/dial-your-context/SKILL.md`: keep the content filter and dataset-specific query guidance in a Sanity Context document; do not duplicate obvious schema facts.
- `.agents/skills/shape-your-agent/SKILL.md` and `references/system-prompts.md`: concise role, grounded behavior, and honest no-result handling.
- `.agents/skills/sanity-best-practices/references/groq.md` and `references/nextjs.md`: `defineQuery`, reverse references, Portable Text projections, server-only Sanity reads, and App Router boundaries.
- `node_modules/next/dist/docs/` for the installed Next.js 16 App Router behavior.

## Inspected code and current decisions

- This is a single Next.js 16 app with an embedded Studio route at `app/studio/`; no separate Studio workspace exists in the repository. Do not relocate or redesign Studio as part of this search task.
- Sanity content types currently include `course`, embedded `module`, `lesson`, `instructor`, and `category`. Lessons use `poster`, `durationSeconds`, `notes`, and `keyPoints`; existing queries still contain a few legacy aliases (`thumbnail`/`duration`) that search work must not silently rely on.
- `sanity/lib/server-client.ts` is server-only and requires `SANITY_API_READ_TOKEN`; reuse that boundary. The browser must never receive the Sanity token, MCP URL, or OpenAI key.
- Existing pages use handcrafted CSS in `app/globals.css` and the Vertex cream/orange/serif visual language. Reuse these patterns and add only the search-specific styles needed for the results page.
- Search input on the home page is currently presentational. Convert it into a navigation entry point to `/search` while keeping the existing home composition intact.
- The Sanity Context MCP URL and model credentials are not currently present in the repository. Add canonical names to `.env.example` and read them only on the server. Expected names: `SANITY_CONTEXT_MCP_URL`, `OPENAI_API_KEY`, and optionally `SANITY_CONTEXT_AGENT_SLUG` if URL construction is supported by the existing Sanity project configuration.

## Files expected to touch

- `package.json` and `package-lock.json`: add the current compatible Vercel AI SDK OpenAI/MCP packages and `zod`; do not guess versions—use the installed/reference package conventions or package metadata.
- `.env.example`: document public Sanity identifiers and server-only search credentials without values.
- `sanity/schemaTypes/` and `sanity/schemaTypes/index.ts`: add the `video` internal lookup document and `sanity.agentContext` configuration schema only if they are not already provided by the deployed Studio/schema. Keep video documents out of user-facing result types.
- `sanity/queries/index.ts`: add or update typed GROQ projections needed by search-related server helpers, including reverse course/module/lesson context and `pt::text(notes)` projections where direct Portable Text matching is required.
- `app/api/search/route.ts`: new POST route. Validate `{query, sort}` with Zod, reject empty/oversized input, create the Sanity Context MCP HTTP client with the server token, fetch/cache initial context, inject a concise grounded-learning system prompt, let the model use Context `groq_query`, and return validated structured search results. Close the MCP client on completion/error.
- `lib/search/` (or the closest existing server utility location): define shared result schemas/types, prompt construction, MCP/initial-context helpers, result normalization, and provider embed/start URL helpers only if needed. Keep all MCP and OpenAI code server-only.
- `app/search/page.tsx` and a client results component: full results page driven by the URL query and POST route, with search input, result count, relevant-first sort control, video-moment cards, lesson cards, loading/error/empty states, and accessible links.
- `app/page.tsx`: make the existing hero search submit/navigate to `/search?q=...`.
- `app/globals.css`: style the search page/cards responsively using existing Vertex design tokens/patterns; do not restyle unrelated pages.
- `sanity/data.ts` or a new server search data helper only if necessary for stable result enrichment; retain read-only server fetching.
- A Sanity seed/import/config file under `sanity/` or `scripts/` only if the existing project convention supports it: create the `sanity.agentContext` document with the course/lesson/video content filter and concise query instructions. Do not create arbitrary production content.

## Functional requirements

1. Search is a full page at `/search`; a query may be supplied as `?q=` and the page must preserve it in the input.
2. The browser calls only `/api/search`. It never calls the Context MCP, Sanity with a token, or OpenAI directly.
3. The route uses the Sanity Context MCP over server-side HTTP with bearer authentication and injects cached `/initial-context` into the system prompt. Exclude the redundant `initial_context` tool from model tools.
4. The agent must search both lesson topics and video moments. Lesson matching uses title and a plain-text notes projection. Video matching checks `video.chapters` first and falls back to a small filtered subset of `video.chunks`; never return a whole transcript/chunks array to the model.
5. GROQ matching is token-based: split and sanitize query terms, wildcard terms, and OR them. Do not match the entire natural-language phrase as one pattern. If semantic search is attempted and unavailable because embeddings are disabled, use keyword matching without failing the request.
6. Results are grounded in returned Sanity data only. No invented course names, lesson labels, counts, descriptions, timestamps, or prices. Video documents are internal and never appear as standalone results.
7. A video result includes a stable result id, result kind, course name/icon when available, module title and derived lesson label, lesson title/slug, poster/thumbnail, duration, short grounded description, and matched seconds/label. Its link is the on-site lesson URL with an encoded `start` query parameter.
8. A lesson result includes the course/module context, derived lesson label, lesson title/slug, key points, and a short grounded description. Its link is the on-site lesson URL.
9. Preserve model ranking, with a deterministic client sort control defaulting to most relevant. Do not cap to an arbitrary handful; use pagination or a clearly bounded server-safe result shape only if required by model/output limits, and document the choice in code.
10. Show result count and course count from actual normalized results. Empty results point users back to the catalog/home page. Handle malformed model output, MCP failures, missing env vars, and OpenAI failures with a user-safe error state and server logs that do not include secrets.
11. Use a strict Zod schema for the model's structured result output and validate again before returning it. Strip unknown fields and reject invalid slugs/timestamps rather than rendering them.
12. Keep the system prompt concise and explicit: Vertex learning search agent; use tools for real content; return structured result data; chapters-first timestamp policy; no hallucination; no standalone video docs; no conversational prose in the result payload.
13. Add/maintain a Sanity Context document filter limited to the content needed for search: courses, lessons, instructors, categories, and internal videos (plus the agent context itself as required by Sanity). Include only non-obvious relationship/query guidance in `instructions`.

## Security and boundaries

- `SANITY_API_READ_TOKEN`, `SANITY_CONTEXT_MCP_URL`, and `OPENAI_API_KEY` remain server-only. Never prefix them with `NEXT_PUBLIC_` and never serialize them into client props.
- Treat model output and MCP content as untrusted data. Validate with Zod, escape through React rendering, and build links from validated slugs/seconds rather than arbitrary URLs.
- Keep the route public unless an existing product requirement explicitly marks search private. Do not add auth or progress writes in this task.
- Do not add a client-side Sanity client or a write token.
- Do not add semantic-index creation, transcript ingestion, custom video playback, chat UI, analytics, payments, or unrelated page redesigns.

## Acceptance criteria

- `/search?q=...` renders a polished responsive results page with both supported result card types, sort control, count, empty state, and accessible navigation.
- A valid request reaches the server-side Context MCP, uses the agent tools, and returns only schema-valid result objects tied to actual course/lesson slugs.
- A video result opens `/lessons/<slug>?start=<seconds>` and a lesson result opens `/lessons/<slug>` without leaving Vertex.
- Initial context is cached per server process and refreshed only according to the chosen safe cache strategy; no whole transcript is sent to the model.
- The home search input navigates to the results page with the entered query.
- Missing configuration and upstream failures are handled without exposing secrets or stack traces to the browser.
- TypeScript, lint, and production build pass, or their real failures are recorded. A live MCP smoke test is attempted when credentials/configuration are available.

## Checks to run after approval

1. `npm install` (only if dependency changes are needed).
2. `npx tsc --noEmit` (the repo currently has no typecheck script; add one only if consistent with existing conventions).
3. `npm run lint`.
4. `npm run build` because this adds a route and server modules.
5. `npm run dev` and manually exercise the page and API.
6. If the configured Sanity project is available: verify the deployed schema/config and POST a representative query to the live MCP endpoint or local `/api/search`; record the actual response/error.

## Exact manual test steps

1. Set the documented server env vars, start `npm run dev`, and open `http://localhost:3000/`.
2. Enter `how do I fetch data` in the hero search and submit; confirm navigation to `/search?q=how%20do%20I%20fetch%20data`.
3. Confirm the results page preserves the query, shows loading then result/empty/error state, and never makes a browser request directly to `api.sanity.io` or the OpenAI API.
4. For a video result, activate the card/link and confirm it opens the matching Vertex lesson URL with a numeric `start` value; verify the lesson page remains the playback destination.
5. For a lesson result, activate the link and confirm it opens the correct Vertex lesson slug without a provider redirect.
6. Change sort from most relevant and confirm the visible order changes deterministically without changing result data.
7. Test blank input, a nonsense query, an overlong query, malformed upstream output, and missing credentials; confirm safe validation/error/empty states.
8. Test a narrow viewport and keyboard navigation through the input, sort control, cards, and empty-state catalog link.

