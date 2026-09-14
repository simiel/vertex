# Implement grounded video-moment search links

## Goal

Make Vertex search return trustworthy, clickable video moments. When a learner searches for a concept, a video result must identify the real lesson and the exact chapter or transcript timestamp where that concept is taught. Activating the result must stay inside Vertex, open the lesson page, and initialize the embedded provider player at that timestamp instead of at the beginning.

## Guidance used

- `AGENTS.md`: server/client boundaries, grounded search, chapters-first matching, provider embeds, and required checks.
- `.agents/skills/create-agent-with-sanity-context/SKILL.md` and its Next.js reference: server-only Context MCP access, cached initial context, tool filtering, and structured model output.
- `.agents/skills/dial-your-context/SKILL.md`: keep non-obvious Sanity query relationships in Context instructions and avoid duplicating schema facts.
- `.agents/skills/shape-your-agent/SKILL.md`: concise grounded search behavior and honest no-result handling.
- `.agents/skills/sanity-best-practices/references/groq.md` and `references/nextjs.md`: typed GROQ projections, reverse references, Portable Text text projections, and App Router server boundaries.
- `node_modules/next/dist/docs/` for the installed Next.js 16 App Router and server/client behavior.

## Inspected code and decisions

- `app/api/search/route.ts`, `lib/search/search.ts`, and `lib/search/search-types.ts` already provide a server-side MCP/OpenAI search path and a discriminated `video`/`lesson` result shape.
- `app/search/search-results.tsx` already creates an on-site `/lessons/<slug>?start=<seconds>` link for video results and records the result-open event.
- `app/lessons/[slug]/page.tsx` already reads `searchParams.start` and passes it to `LessonVideo`.
- `app/lessons/[slug]/lesson-video.tsx` already adds YouTube's `start` embed parameter and loads the YouTube IFrame API for analytics.
- `sanity/schemaTypes/video.ts` stores internal `video` documents with ordered `chapters[]` and timestamped transcript `chunks[]`; `sanity/schemaTypes/lesson.ts` stores `videoUrl`, `poster`, and `durationSeconds`.
- `sanity/queries/index.ts` still projects legacy `thumbnail`/`duration` names in course and lesson queries, while the current schema uses `poster`/`durationSeconds`. Normalize the query contract as part of this task so the lesson page, search enrichment, thumbnails, and durations use the actual schema fields.
- Do not redesign the existing search page or lesson page. Make the smallest focused changes needed to make grounded timestamps and playback reliable.

## Expected files to touch

- `sanity/queries/index.ts`: correct lesson/course projections and add the minimum video/lesson projections needed for stable enrichment, reverse course context, and image URLs.
- `lib/search/search.ts`: strengthen the structured result schema, normalize only validated lesson-backed results, enforce numeric bounded timestamps, preserve model ranking, and keep video documents internal. Ensure chapter matches win over transcript matches and that a transcript fallback carries its real `startSeconds`.
- `lib/search/search-types.ts`: keep the result discriminated union aligned with the validated response, including the matched timestamp/label for video results.
- `app/lessons/[slug]/page.tsx`: parse and clamp the `start` parameter against the real lesson duration, use the corrected Sanity field names, and extract the supported provider/video identifier safely.
- `app/lessons/[slug]/lesson-video.tsx` or a small provider utility: build the embed URL for the supported provider(s) already represented in the data, pass the validated start parameter, and preserve the existing player analytics. Do not build a custom video player.
- `app/search/search-results.tsx`: preserve on-site links and ensure the displayed “Watch from” label and encoded `start` value come from the validated matched timestamp.
- `sanity/queries/index.ts` or `lib/search/`: add focused tests/helpers if needed for timestamp/provider parsing; do not add a second backend.
- `prompts/implement-video-moment-search-links.md`: this implementation prompt.

## Functional requirements

1. For a query that matches a video chapter, return a `video` result tied to the lesson that references the video; return the chapter's real `startSeconds` and label.
2. If no chapter matches, allow a matching transcript chunk to produce a video result using that chunk's real `startSeconds`; never invent or estimate a timestamp.
3. Never return an internal `video` document as a standalone result. Every video result must have a real lesson slug and enough course/module context to render the existing card.
4. Do not send whole transcript/chunks arrays to the model or browser. Use filtered, bounded matches in the search path and keep the response limited to the result shape.
5. Validate model output and normalized data with Zod. Reject or omit results with missing lesson slugs, invalid kind, negative/non-integer timestamps, nonexistent lessons, or timestamps beyond the lesson duration. Do not silently turn invalid data into a fake result.
6. Correct all read projections involved in this flow to use `poster` and `durationSeconds` from the current schema, while preserving the UI's existing derived display fields where needed.
7. For YouTube URLs, support normal watch URLs, short URLs, and embed URLs without accidentally using the entire URL as the video ID. Keep playback on the Vertex lesson page and append `start=<integer>` only when the validated start is greater than zero.
8. If the repository's existing content includes another provider, implement its existing provider-specific embed/start parameter only when its playback path is already supported. Otherwise fail safely and do not claim support for it.
9. A video result link must be `/lessons/<validated-slug>?start=<validated-seconds>`; a lesson result link remains `/lessons/<validated-slug>`.
10. The lesson page must still start from zero when `start` is missing, malformed, negative, or beyond the duration. It must not redirect learners to YouTube/Vimeo/Bunny.
11. Preserve the search page's current result count, sort control, empty/error states, accessibility, and analytics behavior. Do not add auth, progress writes, chat UI, or unrelated redesigns.
12. Keep all Sanity tokens, MCP calls, model calls, and server read clients server-only. The browser may call only `/api/search` and navigate to the internal lesson URL.

## Security and data integrity

- Treat MCP/model output as untrusted and validate before rendering or building links.
- Build links from validated slugs and bounded integer seconds; never accept arbitrary model-provided URLs for navigation.
- Keep the Sanity read token, Context MCP URL, and OpenAI credentials server-only.
- Do not log transcript text, secrets, or full upstream payloads.
- Do not add a client-side Sanity client or a custom player.

## Acceptance criteria

- A real search result for a chapter opens the correct Vertex lesson page with the chapter second in `start`.
- A real transcript fallback opens the correct Vertex lesson page with the transcript chunk second in `start`.
- The embedded player starts at that second; a direct lesson visit or invalid `start` starts at zero.
- YouTube watch, short, and embed URLs resolve to the correct embed ID.
- Lesson/course cards and lesson metadata use the current `poster`/`durationSeconds` schema fields without undefined values caused by legacy projections.
- No internal video document appears as a user-facing standalone result.
- TypeScript, lint, and production build pass, or their actual failures are recorded.
- If search credentials are available, a live MCP/API smoke test confirms a representative concept returns a validated lesson slug and timestamp.

## Checks to run after approval

1. `npm run typecheck`.
2. `npm run lint`.
3. `npm run build` because server route, query, and lesson runtime behavior change.
4. Start `npm run dev` and manually test a chapter match, transcript fallback, lesson result, direct lesson visit, malformed start, and narrow viewport.
5. When credentials are configured, POST a representative query to `/api/search` and inspect that the response contains only validated result objects and no transcript arrays.

## Exact manual test steps

1. Configure the documented server env vars and start `npm run dev`.
2. Open `/search?q=<known chapter concept>` and submit the search if needed.
3. Open a `VIDEO` result and confirm the URL remains on `localhost:3000/lessons/...` with an integer `start` query parameter.
4. Confirm the YouTube player begins at the displayed `Watch from` timestamp rather than at 0:00.
5. Search a concept present only in a transcript chunk and repeat the check; confirm the fallback timestamp is the chunk's real timestamp.
6. Open a lesson directly without `start`, with `start=-5`, with a non-number, and with a value larger than the lesson duration; confirm playback begins at 0:00.
7. Test a normal YouTube watch URL, a `youtu.be` URL, and an embed URL if representative content exists; confirm each resolves to the right video.
8. Confirm lesson/course thumbnails and durations render from the current Sanity schema fields.
9. Confirm no browser request goes directly to Sanity Context or OpenAI and no internal `video` record is shown as a result.
