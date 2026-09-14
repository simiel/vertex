# Implement the Vertex search results page from the supplied design

## Goal

Re-implement the existing `/search` page so it matches the supplied reference image at `design/vertex-search.png` while preserving and improving the existing intelligent search behavior. The page must make search feel useful at lesson granularity: a video result links to the matching lesson page with a numeric `start` query parameter so the provider embed begins at the exact matched second; a lesson result links to the lesson without a timestamp. Search remains a full results page, not a chatbox or compact widget.

## Guidance and skills read

- `AGENTS.md`: prompt-before-code workflow, Vertex boundaries, search requirements, security rules, and checks.
- `build-web-apps:frontend-app-builder` (`/Users/samuel/.codex/plugins/cache/openai-curated-remote/build-web-apps/0.1.2/skills/frontend-app-builder/SKILL.md`): use the supplied image as the accepted visual reference, build a small design system from it, implement faithfully, and verify in-browser.
- `create-agent-with-sanity-context` (`agent/skills/create-agent-with-sanity-context/SKILL.md`): preserve server-only Sanity Context MCP access, cached initial context, grounded results, and chapters-first transcript lookup.
- `dial-your-context` and `shape-your-agent`: preserve the existing content-scoped search configuration and concise grounded system prompt; do not turn the results page into a conversational agent.
- Installed Next.js 16 docs: App Router pages are server components by default, interactive search/sort belongs in a client boundary, and the existing POST route handler remains the browser/server boundary.

## Code inspected

- `app/search/page.tsx`: server route reads `?q` and renders `SearchResults`.
- `app/search/search-results.tsx`: current client search, sort, result-card rendering, and lesson/timestamp link construction.
- `lib/search/search-types.ts`: current video and lesson result unions.
- `lib/search/search.ts`: current Context MCP/OpenAI agent, cached initial context, structured output validation, and lesson enrichment.
- `app/api/search/route.ts`: current request validation and safe error handling.
- `app/globals.css`: existing Vertex typography, warm paper/orange palette, page shells, and related home/course/lesson patterns.
- `app/page.tsx`: existing home header/search entry point and shared visual language.
- `design/vertex-search.png`: source of truth for layout, spacing, copy hierarchy, cards, colors, icon treatment, and visible states.
- `prompts/implement-intelligent-search.md`: prior search architecture and security decisions; reuse them, do not duplicate or broaden scope.

## Decisions and assumptions

- Treat `design/vertex-search.png` as the accepted visual spec; do not invent a new visual direction or add sections not present in the image.
- Keep the existing Next.js/TypeScript/Sanity/Clerk/PostHog stack and handcrafted CSS conventions. Do not add a UI library for this page.
- Keep the page public. Search must not introduce auth gates, progress writes, or client-side Sanity access.
- Preserve the existing result union and server route where possible, but add only the fields needed to faithfully render the reference (for example, stable course icon/mark, thumbnail/poster, duration, matched label, result kind, and exact lesson/module context) if existing data supports them.
- When live data is unavailable in development, render a safe empty/error/loading state rather than inventing production search results. If a browser-only visual fixture is needed for QA, keep it test-only and remove it before handoff.
- Use accessible inline SVG icons or existing icon patterns for search, bell, folder/file, play, external-link, chevron, and completion marks. Avoid emoji glyphs that vary by platform.

## Reference design requirements

- Outer page: pale warm background with subtle diagonal edge texture, centered white paper canvas, thin warm borders, and generous desktop gutters.
- Header: Vertex mark/wordmark at left, `Courses` active in orange, `My Learning`, notification bell, and user avatar/auth affordance at right. Match the existing product header patterns and keep it responsive.
- Main content: centered `SEARCH RESULTS` orange label, serif heading `Results for “data fetching”` with the query highlighted orange, and muted line `Found 28 results across 8 courses`.
- Search field: wide bordered field under the heading, search icon, current query, and `⌘ K` keyboard hint. It must submit through `/search?q=` and preserve the query in the URL.
- Results toolbar: actual result count at left and `Most Relevant` sort control at right. Keep most relevant as the default and provide a deterministic alternate sort without changing the data.
- Video result card: horizontal bordered card with a large 16:9 thumbnail/poster at left, provider/course mark and course name, lesson title, grounded description, lesson/module metadata, `VIDEO` badge, and orange `Watch from mm:ss` action with play icon and chevron. The card action must open `/lessons/<validated-slug>?start=<validated-seconds>`.
- Lesson result card: same family of card, but use a notes/key-points visual at left, `LESSON` badge, key-point list/check mark, and `View lesson` action with external-link/chevron. It must open `/lessons/<validated-slug>`.
- Result cards should support the visible density of the reference and remain readable with longer real data. Do not cap results to six merely because the screenshot shows six; render all normalized relevant results returned by the server.
- Bottom callout: warm tinted panel with search icon, `Can’t find what you’re looking for?`, guidance to try other keywords, and `Browse all courses` action to the catalog/home.
- Responsive behavior: maintain desktop fidelity; on narrow widths stack thumbnail/copy sensibly, keep actions reachable, collapse header navigation if needed, and ensure no horizontal overflow.

## Functional requirements

1. `/search?q=<query>` renders the visual design and preserves the decoded query in the input and heading.
2. Submitting a valid query updates the URL and calls only `/api/search`; the browser never calls Sanity, Context MCP, or OpenAI directly.
3. Show loading, safe error, and empty states within the same design system. Empty results must point to the full course catalog.
4. Render both `video` and `lesson` result kinds with their distinct card anatomy.
5. Video result links must use a validated lesson slug and nonnegative integer seconds. The lesson page remains the playback destination; never navigate to YouTube/Vimeo/Bunny directly.
6. Keep the search agent grounded: chapters are matched before transcript chunks, transcript responses remain filtered/small, videos are never standalone results, and no names/timestamps/slugs are invented.
7. Keep server-only values server-only (`SANITY_API_READ_TOKEN`, Context MCP URL/token, OpenAI key). Do not add client env vars for them.
8. Preserve or add PostHog capture for a search performed if existing instrumentation conventions support it; do not broaden analytics beyond the existing product requirement.
9. Keep keyboard navigation and labels accessible: form label, result links, sort control, icons marked decorative when appropriate, focus-visible states, and useful image alt text.

## Expected files to touch

- `app/search/page.tsx` if page metadata/prop typing or shell composition needs adjustment.
- `app/search/search-results.tsx` for the redesigned interactive UI and robust result-card rendering.
- `app/globals.css` for search-only design tokens, layout, card variants, icons, states, and responsive rules; do not regress home/course/lesson styling.
- `lib/search/search-types.ts` only if a small validated field extension is required.
- `lib/search/search.ts` only if enrichment/normalization is required to supply real data for the new card details or to harden timestamp/slugs.
- `app/api/search/route.ts` only if request/response validation needs to align with the UI.
- `app/page.tsx` only if the existing hero search needs a small navigation/accessibility correction.
- `prompts/implement-search-page-design.md` (this file).

Do not modify Sanity schemas, ingestion, lesson playback, unrelated page styles, or dependency versions unless a concrete blocker is found and documented.

## Security and data integrity

- Treat all MCP/model content as untrusted; validate the response before rendering.
- Render text through React, never as HTML.
- Build lesson URLs from validated slugs and integer timestamps, not arbitrary model URLs.
- Never render internal video documents as results or expose transcript arrays wholesale.
- Do not log secrets or send them to client props.

## Acceptance criteria

- The current `/search` page is visibly faithful to `design/vertex-search.png` in desktop layout, typography hierarchy, palette, borders, spacing, card anatomy, and controls.
- The page has polished responsive behavior with no overflow at mobile widths.
- Video and lesson result cards are visibly distinct and each action works as specified.
- Search input submission, URL persistence, loading/error/empty states, and deterministic sorting work.
- Real normalized results determine all counts and visible content; no fabricated fallback result data is shipped.
- Existing server-side intelligent search and security boundaries remain intact.
- TypeScript, lint, and production build pass, or actual failures are recorded.

## Checks after approval

1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. Run `npm run build` because a route/client component/server integration is being changed.
4. Start `npm run dev` and use the built-in browser to inspect `/search?q=data%20fetching` at desktop and narrow viewport sizes.
5. Exercise a video result and confirm the destination is the Vertex lesson URL with `?start=<seconds>`.
6. Exercise a lesson result and confirm the destination is the Vertex lesson URL without a timestamp.
7. Test empty, invalid, loading, and upstream error states; keyboard navigation; and no direct browser requests to Sanity/OpenAI.
8. Use `view_image` on the supplied reference and the latest browser screenshot before handoff; fix meaningful visual mismatches found.

## Exact manual test steps

1. Start the dev server with the documented server environment configured.
2. Open `/search?q=data%20fetching` and confirm the header, centered heading, query field, count/sort toolbar, mixed cards, and catalog callout match the supplied image.
3. Submit `how do I fetch data`; confirm the URL changes to `/search?q=how%20do%20I%20fetch%20data`, the input/heading update, and the result state changes without a full-page redesign.
4. Activate a video result’s `Watch from` action; confirm the lesson page URL contains a numeric nonnegative `start` parameter and playback stays embedded on Vertex.
5. Activate a lesson result’s `View lesson` action; confirm it opens the corresponding lesson page.
6. Change the sort control and confirm ordering changes deterministically; switch back to Most Relevant.
7. Test a nonsense query and missing/upstream configuration; confirm a useful empty/error state with no secrets or stack traces.
8. Resize to mobile and keyboard through the form, sort, result links, and catalog link; confirm focus visibility, readable wrapping, and no horizontal scroll.
