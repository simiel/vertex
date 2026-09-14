# Implement PostHog product analytics

## Goal

Extend the existing PostHog setup across the Vertex learner experience. Use a small, typed event vocabulary with stable snake_case event names and properties that describe the product action, not raw UI state. Capture actions in the layer where they occur: client-side interaction events in browser components, and server-side search execution in the search route. Do not send personally identifiable content beyond the Clerk user ID that PostHog already uses as the distinct ID.

## Skills and guidance read

- `posthog` skill: use the existing PostHog integration, prefer current SDK behavior, and keep event/property naming consistent.
- Next.js `instrumentation-client.ts`, Route Handler, and `use client` documentation: keep browser-only PostHog code in the client boundary, and keep server capture in the route handler/server module.
- Repository `AGENTS.md`: preserve Clerk/server boundaries, keep private values server-side, and do not invent missing progress functionality.

## Code inspected

- `instrumentation-client.ts` initializes `posthog-js`.
- `app/layout.tsx` mounts `PostHogIdentity`.
- `app/courses/[slug]/course-content.tsx` currently captures module expansion, course start, and bookmarking, and currently sends email/name in `posthog.identify`.
- `app/search/search-results.tsx` owns search submission and result-card links.
- `app/api/search/route.ts` executes the server-side search.
- `app/lessons/[slug]/page.tsx` renders a YouTube iframe but has no client player bridge, progress UI, resume action, or completion control.
- `app/page.tsx` renders the catalog and search entry point.
- `package.json` contains `posthog-js` but no server PostHog SDK.
- Existing uncommitted user changes are present in `app/globals.css`, `app/search/search-results.tsx`, and `prompts/implement-search-page-design.md`; preserve them.

## Decisions and assumptions

1. Keep the current `posthog-js` browser integration and add a small shared client analytics helper rather than scattering configuration checks and string literals.
2. Remove email and name from the identify call. Continue using `posthog.identify(user.id)` so Clerk user IDs are the only application identity value sent explicitly.
3. Add server-side capture for a successful search execution using a server-only PostHog client. Add the server dependency if needed and add a server-only project API key variable to `.env.example`; never expose that key to the browser. Server capture must be best-effort and must not make search fail when analytics is unavailable.
4. Do not put the raw search query into PostHog properties. Track query length and a coarse query category only if it can be derived without retaining the query text; otherwise omit category. The client and server events must not duplicate the same action.
5. The current video is a YouTube iframe. Add a client video analytics component around the iframe using the provider’s supported postMessage/IFrame API. Track play once per lesson view and watch depth at meaningful quartiles (25, 50, 75, 90, 100), deduplicated per playback session. Include watched seconds and percent, but no transcript text, video URL, title copy, or user-entered text.
6. Resume-used, lesson-completed, and progress-saved events should be supported by the existing progress/resume/completion UI if present in the inspected tree. Since the current tree has no such implementation, do not create a progress backend or fake controls just for analytics. Add a typed helper/API contract and document the exact event calls to use when those actions are implemented; if an existing action appears during implementation, instrument it immediately.
7. Track useful non-PII engagement already present: catalog viewed, course viewed, lesson viewed, search results opened, course learning started, course module expanded, course bookmarked, notes tab opened, resource opened, and next/previous lesson navigation. Avoid tracking notification clicks because the bell has no behavior.
8. Use PostHog’s reserved autocapture/pageview behavior as-is; do not add duplicate generic pageview events unless needed for a page-specific view event.

## Event taxonomy

Use these event names and properties. Every property value must be a primitive, bounded, non-PII value.

| Event | Capture location | Properties |
| --- | --- | --- |
| `catalog_viewed` | client page view | `course_count` |
| `course_viewed` | client page view | `course_slug`, `lesson_count`, `module_count` |
| `lesson_viewed` | client page view | `lesson_slug`, `course_slug`, `module_number`, `lesson_number`, `duration_seconds`, `has_resume_position` |
| `search_performed` | server search route | `query_length`, `result_count`, `course_count`, `search_status` |
| `search_result_opened` | result link click | `result_type` (`video`/`lesson`), `result_position`, `lesson_slug`, `course_slug`, `matched_seconds` only for video results |
| `video_played` | client player bridge | `lesson_slug`, `course_slug`, `provider`, `start_seconds`, `resume_used` |
| `video_watch_depth_reached` | client player bridge | `lesson_slug`, `course_slug`, `provider`, `depth_percent`, `watched_seconds`, `duration_seconds` |
| `resume_used` | existing resume action, if present | `lesson_slug`, `course_slug`, `resume_seconds`, `duration_seconds`, `resume_source` |
| `lesson_completed` | existing completion action, if present | `lesson_slug`, `course_slug`, `duration_seconds`, `completion_source` |
| `course_learning_started` | existing client action | `course_slug`, `entry_point` |
| `course_module_expanded` | existing client action | `course_slug`, `module_position` |
| `course_bookmarked` | existing client action | `course_slug`, `is_bookmarked` |
| `lesson_notes_opened` | Notes tab click | `lesson_slug`, `course_slug` |
| `lesson_resource_opened` | resource click | `lesson_slug`, `course_slug`, `resource_type` |
| `lesson_navigated` | previous/next lesson click | `course_slug`, `direction`, `from_lesson_slug`, `to_lesson_slug` |

Use a stable event name for each action. Do not include email, name, search text, notes, transcript chunks, full URLs, referrer query strings, IP-derived data, or arbitrary DOM text.

## Expected files

- `lib/analytics/events.ts` or an equivalent shared client-safe analytics helper with typed event payloads and a no-op when PostHog is not configured.
- `instrumentation-client.ts` and `app/courses/[slug]/course-content.tsx` for privacy-safe identity and migration of existing event calls.
- `app/page.tsx`, `app/courses/[slug]/page.tsx`, `app/search/search-results.tsx`, and `app/lessons/[slug]/page.tsx` or small client components extracted from them for view and interaction tracking.
- A lesson video client component and any provider utility needed for YouTube playback/depth tracking.
- `app/api/search/route.ts` plus a server-only analytics module for successful/failed search capture.
- `app/.env.example` or root `.env.example` (whichever is canonical in this repo) for the server-only PostHog key, without modifying local secrets.
- `package.json` and lockfile only if a server SDK is required.

## Security and privacy

- Keep `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` client-safe only.
- Keep the server PostHog API key server-only and never import the server client from a client module.
- Identify with the Clerk user ID only; remove existing email/name properties.
- Do not send raw query, lesson notes, transcript text, resource URLs, video URLs, or arbitrary content as event properties.
- Analytics failures must not break page rendering, video playback, search, or navigation.
- Avoid duplicate events caused by React Strict Mode, rerenders, repeated iframe messages, or repeated result clicks.

## Acceptance criteria

- A configured app emits the event taxonomy above with the documented properties and no PII beyond Clerk user ID.
- Search execution is captured server-side and remains successful if the server analytics call fails.
- Search result opens identify result type and position; video opens include a bounded matched second.
- Lesson and course/catalog views are deduplicated per mounted view.
- YouTube play and depth events are deduplicated, include quartile depth, and do not require a custom video player.
- Existing events retain behavior but use the shared helper and include stable context where available.
- Resume/completion events are not fabricated where the feature is absent; any existing implementation is instrumented if found.
- `.env.example` documents every required analytics variable without committing local values.

## Checks

Run from the web workspace/root as applicable:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. Start the dev server with `npm run dev` and manually exercise the catalog, course, search, result-card, lesson, Notes, resource, bookmark, module, and YouTube playback flows.
5. Confirm in browser devtools/PostHog debug mode that no event property contains the raw query or other content/PII, and that server-side search events arrive independently of the client.

## Manual test steps

1. Open `/` and verify one `catalog_viewed`; open a course and verify `course_viewed`; expand a module and verify `course_module_expanded`.
2. Start learning and bookmark/unbookmark the course; verify the corresponding events and `course_slug` only.
3. Search for a test phrase; verify `search_performed` contains only bounded metadata, not the phrase; open both a video and lesson result and verify `search_result_opened` has the correct type and position.
4. Open a lesson directly and via a video result; verify `lesson_viewed`, `video_played`, and quartile `video_watch_depth_reached` events without duplicate quartiles.
5. Open Notes and a resource; verify the corresponding interaction events contain lesson/course slugs and resource type only.
6. Disconnect or omit analytics configuration and verify the app still renders, searches, navigates, and plays video.
