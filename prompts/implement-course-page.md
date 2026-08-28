# Implement the Vertex course detail page

## Goal

Build the course detail page shown in `design/vertex-course.png` and wire it to the seeded Sanity content. The primary route is `/courses/nextjs-app-router-in-depth` (using the seeded course slug). Preserve the supplied desktop reference as the visual source of truth and make the layout sensibly responsive on smaller screens.

## Skills and guidance read

- `build-web-apps:frontend-app-builder`: use the supplied reference as the accepted design, extract a small design system, build reusable components, and verify with a browser screenshot.
- `sanity-best-practices`: keep page data server-side, use typed GROQ/data helpers, resolve references in GROQ, and preserve the standalone Studio/web boundary.
- `node_modules/next/dist/docs/01-app/index.md`: use the App Router and server component model for the route.

## Code and data inspected

- `app/page.tsx`: existing Vertex shell and icon conventions; home page currently uses local mock data.
- `app/globals.css`: existing typography, warm paper background, orange accent, borders, and responsive conventions.
- `app/layout.tsx`: Clerk provider and global metadata.
- `sanity/data.ts`: server-only fetch helpers with Next cache tags.
- `sanity/lib/server-client.ts`: private-token server Sanity client.
- `sanity/queries/index.ts`: existing course query, with a seeded-field mismatch for lesson media/duration.
- `sanity/schemaTypes/course.ts`, `lesson.ts`, and `objects/module.ts`: course, lesson, module, outcome, reference shapes.
- `studio/scripts/seed/seed.ndjson`: seeded course `course.nextjs-app-router-in-depth`, title `Next.js App Router in Depth`, 4 learning outcomes, 4 modules, and referenced lessons.
- `design/vertex-course.png`: accepted visual reference.

## Seed data decisions

- Fetch the course by slug from Sanity; do not recreate or hardcode the course content.
- Use the actual seeded title/summary, cover image, level, price/popular/student count, learning outcomes, instructor/category, modules, and lesson references.
- Correct the course GROQ projection to read the seeded lesson fields: `thumbnail` and `duration` (or use the exact schema/data shape verified in the repository). Keep the query field names aligned with the imported data and update any affected TypeScript inference/types.
- Calculate module numbers and lesson numbering from array order. Do not store derived numbers in Sanity.
- Calculate total module count and total duration from fetched module/lesson data where the seeded data requires it.
- Use Sanity image URLs for the cover and lesson thumbnails; do not introduce placeholder course content.

## Visual requirements

Match `design/vertex-course.png` closely:

- Vertex header with orange mark, brand, Courses/My Learning nav, notification icon, and Clerk user affordance.
- Breadcrumb row: `All Courses > Next.js for Production`-style hierarchy adapted to the fetched course title.
- Two-column hero: large rounded course cover on the left; popular badge, title, summary, metadata, Continue Learning and Bookmark controls on the right.
- Metadata icons for level, duration, modules, and students.
- “What you’ll learn” bordered panel with the four seeded outcomes and matching icon treatment.
- “Course Content” section with module rows, derived numbering, summaries, durations, expand/collapse affordances, and a show-all control.
- Bottom progress panel and Continue Learning affordance may be presentational until progress exists, but must use truthful seeded course data and not invent completion percentages.
- Preserve the reference’s warm off-white paper, orange accent, serif display headings, thin peach borders, restrained shadows, generous spacing, and diagonal edge decoration.
- Use accessible buttons/links, visible focus states, semantic headings, and responsive stacking/collapse behavior.

## Architecture

- Add an App Router dynamic route under `app/courses/[slug]/page.tsx` (or the repository’s equivalent route convention).
- Keep Sanity fetching in the server page/data layer. The browser must not receive Sanity tokens or call Sanity directly.
- Use small reusable page components for the header, breadcrumb, hero metadata, outcomes, module list, and progress footer.
- Use a small client component only where interaction is needed (bookmark/show modules or module expansion); keep the page and data fetching server-rendered.
- Reuse existing CSS variables and icon conventions where appropriate; add course-specific styles without restyling unrelated pages.
- Add `notFound()` for an unknown course slug and page metadata based on the fetched course.

## Security and scope

- Keep `SANITY_API_READ_TOKEN` server-only.
- Do not add progress persistence, payments, search, new content, or unrelated pages in this task.
- Do not modify `studio/scripts/seed/seed.ndjson` or `studio/scripts/seed/videos.json`.
- Do not embed the Studio in the web app.

## Acceptance criteria

- `/courses/nextjs-app-router-in-depth` renders from the live seeded Sanity course.
- The page displays the seeded title, summary, cover image, instructor/category relationship, four outcomes, four modules, and referenced lessons.
- Lesson thumbnails/durations are populated from the actual imported fields rather than null query aliases.
- Unknown slugs return a 404.
- Desktop layout matches the supplied reference’s composition and styling; responsive layout is usable on mobile.
- No Sanity token is exposed to client code.
- Existing home/design-system routes remain intact.

## Checks to run

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` because a route, GROQ query, and server data path change.
- Run the dev server and manually open `/courses/nextjs-app-router-in-depth`.
- Verify the page against `design/vertex-course.png` at the reference’s 1024px square viewport when practical, plus a narrow mobile viewport.
- Verify the unknown route returns 404.
- Inspect the browser network/source behavior to ensure no Sanity token reaches the browser.

## Expected files

- `app/courses/[slug]/page.tsx`
- New focused course page component/style files only if useful.
- `sanity/queries/index.ts` and/or `sanity/data.ts` for the field-shape correction.
- `app/globals.css` for course-specific styles.
- `prompts/implement-course-page.md` (this prompt).
