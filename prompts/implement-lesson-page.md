# Implement the Vertex lesson detail page

## Goal

Build the lesson detail page shown in `design/vertex-lesson.png`, using seeded Sanity content and an on-site provider embed. The primary verification route is the seeded lesson slug `nextjs-app-router-in-depth-fetching-in-server-components`.

## Guidance read

- `build-web-apps:frontend-app-builder`: use the supplied screenshot as the visual source of truth, build reusable components, and verify the rendered surface at the reference dimensions and mobile width.
- `sanity-best-practices`: keep Sanity reads server-side, use GROQ reference resolution and Portable Text, and keep video playback on a dedicated provider rather than storing video files in Sanity.
- `node_modules/next/dist/docs/01-app/index.md`: use App Router server/client boundaries and dynamic route conventions.

## Code and data inspected

- Existing App Router routes: homepage and course detail route; no lesson route exists.
- `sanity/data.ts`: cached server-only data helpers.
- `sanity/queries/index.ts`: lesson query currently projects `poster` and `durationSeconds`, but seeded lessons use `thumbnail` and `duration`; it also includes reverse course lookup.
- `studio/scripts/seed/seed.ndjson`: lesson `nextjs-app-router-in-depth-fetching-in-server-components` has YouTube URL `https://www.youtube.com/watch?v=WKfPctdIDek`, 261 seconds, 12,586 students, Portable Text notes, key points, resources, and belongs to the `Data Fetching and Caching` module of `Next.js App Router in Depth`.
- `app/globals.css`: existing Vertex typography, paper background, orange accent, borders, course page styles, and responsive conventions.
- `app/courses/[slug]/page.tsx`: existing seeded course page and navigation conventions.

## Data requirements

- Add a dynamic route at `app/lessons/[slug]/page.tsx` and fetch with `getLessonBySlug()`.
- Correct `LESSON_BY_SLUG_QUERY` to project seeded fields `thumbnail` and `duration`, not `poster` and `durationSeconds`.
- Resolve the reverse course and module containing the lesson, derive module/lesson numbers from array order, and derive previous/next lesson links from the ordered module/lesson list.
- Render the actual lesson title, duration, level, student count, course/module breadcrumbs, key points, pro tip when present, resources, and Portable Text notes.
- Do not invent lesson copy, duration, student count, or completion percentage. Presentational progress may say `Not started` when no progress backend exists.

## Video requirements

- Embed the seeded YouTube video on the lesson page using YouTube’s official embed URL and the lesson’s thumbnail/video URL.
- Keep playback on the Vertex lesson page; never send the learner to YouTube as the primary action.
- Use a real provider iframe/player frame with accessible title, responsive aspect ratio, poster/thumbnail treatment where supported, and no custom video-download logic.
- Add a small client component only for player UI state if needed; do not expose Sanity tokens or create a fake player that cannot play the seeded video.

## Visual requirements

Match `design/vertex-lesson.png`:

- Header with Vertex branding, Courses/My Learning nav, notification icon, and Clerk user affordance.
- Two-column learning shell: left course/module lesson navigation and right lesson content; collapse the sidebar sensibly on mobile.
- Sidebar back-to-course link, course identity/progress block, module list, completed/current lesson states, and lesson numbering derived from the fetched course structure.
- Main breadcrumbs, lesson badge, title, description, bookmark control, metadata row, video player, tabs, overview/notes content, key points, pro tip, resources, and previous/next footer navigation.
- Preserve the screenshot’s warm paper background, thin peach borders, orange active states, serif headings, rounded cards, spacing, and responsive behavior.
- Use semantic headings, accessible controls, keyboard focus states, and meaningful iframe labels.

## Architecture and security

- Keep the route and Sanity data fetching server-rendered.
- Keep only player/tabs/sidebar interactions in client components.
- Use `@portabletext/react` if available; otherwise add the minimal supported Portable Text renderer dependency and render notes from Sanity’s block array, never as raw HTML or markdown.
- Keep `SANITY_API_READ_TOKEN` server-only.
- Do not implement progress persistence, analytics, search, payments, or new Sanity content in this task.

## Acceptance criteria

- `/lessons/nextjs-app-router-in-depth-fetching-in-server-components` renders HTTP 200 with seeded lesson data.
- The page embeds and can play the seeded YouTube video on-site.
- Lesson notes render from Portable Text; key points/resources come from Sanity.
- Course/module/lesson navigation and previous/next links are derived from Sanity references and array order.
- Unknown lesson slugs return 404.
- No Sanity token reaches client code.
- Existing homepage and course route remain intact.
- The desktop layout faithfully follows the supplied screenshot and remains usable on mobile.

## Checks to run

- `npm run lint`
- `npx tsc --noEmit`, distinguishing pre-existing repository errors.
- `npx next build --webpack`, reporting any pre-existing failures.
- Run the dev server with `SANITY_API_READ_TOKEN` present.
- Verify the lesson route returns 200 and includes the seeded lesson title, notes, resource, and YouTube embed.
- Verify an unknown lesson slug returns 404.
- Manually test video play, tab/sidebar interactions, previous/next links, and responsive layout.
- Compare a screenshot at the supplied reference dimensions and a narrow mobile viewport.

## Expected files

- `app/lessons/[slug]/page.tsx`
- Focused lesson client components as needed.
- `sanity/queries/index.ts` and/or `sanity/data.ts` for the seeded field and navigation projection.
- `app/globals.css` for lesson-specific styles.
- `package.json`/lockfile only if Portable Text rendering dependency is required.
- `prompts/implement-lesson-page.md` (this prompt).
