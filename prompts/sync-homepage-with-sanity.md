# Sync the Vertex homepage with seeded Sanity content

## Goal

Replace the homepage’s hardcoded mock course cards with the real seeded Sanity catalog. Preserve the existing homepage design in `design/vertex-home.png` and its current interactions, but make course content, links, metadata, and imagery come from Sanity.

## Guidance read

- `build-web-apps:frontend-app-builder`: preserve the accepted existing visual reference and use reusable components with responsive browser verification.
- `sanity-best-practices`: fetch private Sanity content on the server, use the existing cached data helper/GROQ query, resolve references, and avoid exposing tokens to the browser.
- `node_modules/next/dist/docs/01-app/index.md`: keep the homepage as an App Router server component unless a focused client component is required for interaction.

## Code and data inspected

- `app/page.tsx`: homepage currently defines three hardcoded mock courses and links cards to `#courses`.
- `app/globals.css`: homepage visual system and responsive card grid already exist.
- `sanity/data.ts`: existing server-only `getCourses` helper.
- `sanity/queries/index.ts`: `COURSES_QUERY` already returns course marketing fields, outcomes, instructor/category, module count, modules, referenced lessons, thumbnails, and durations.
- Seeded catalog: 10 courses, all with real titles, summaries, levels, prices, popularity flags, student counts, four modules, cover images, and referenced lessons.

## Decisions and assumptions

- Remove the homepage mock `courses` array entirely.
- Fetch the catalog with `getCourses()` in the server-rendered homepage.
- Display the fetched courses in the existing card family. Use the Sanity cover image as the card media/mark treatment where appropriate, while retaining the current compact visual language.
- Use actual course title, summary, level, computed total duration, module count, student count, popularity, slug, and cover image.
- Compute total course duration from referenced lesson `duration` values because the seeded content does not store a course duration.
- Link each card to `/courses/[slug]` using the fetched slug.
- Show the complete seeded catalog, not invented substitutes. If the existing layout needs a truthful heading, use `All Courses` and allow the grid to grow responsively beyond three cards.
- Preserve the hero copy/search shell unless it is directly contradicted by Sanity data; this task is catalog synchronization, not a new marketing-content model.

## Requirements

1. Update the homepage to call `getCourses()` server-side.
2. Add or update the GROQ projection only if needed to support the actual seeded fields; keep `thumbnail`/`duration` aligned with imported data.
3. Render all seeded courses with real Sanity values and stable keys.
4. Use Sanity image URLs through the existing `urlFor` helper; do not hardcode course logos or stock course names.
5. Preserve Clerk header behavior and existing homepage layout/styles.
6. Add a graceful empty/error-safe state if the catalog is empty, without inventing course content.
7. Keep Sanity credentials server-only.

## Acceptance criteria

- No hardcoded course array or mock course titles remain in `app/page.tsx`.
- The homepage renders the imported Sanity catalog, including seeded courses such as `Next.js App Router in Depth`, `Building AI Apps with LLMs`, and `Practical Web Security`.
- Course cards link to their matching `/courses/<slug>` routes.
- Card metadata is derived from Sanity, including duration and module count.
- The seeded cover images load from Sanity asset directives through the image URL helper.
- Existing homepage hero/header design and responsive behavior remain intact.
- Existing course detail route remains intact.

## Checks to run

- `npm run lint`
- `npx tsc --noEmit` and distinguish pre-existing repository errors from changes in this task.
- `npm run build` or `npx next build --webpack`; report any pre-existing failures accurately.
- Run the dev server with `SANITY_API_READ_TOKEN` present and open `/`.
- Confirm the response contains multiple seeded course titles and no old mock titles such as `Docker Essentials` or `TypeScript Deep Dive`.
- Click a rendered course card and confirm it opens the matching course route.
- Verify at a narrow viewport that the catalog remains readable.

## Files expected to change

- `app/page.tsx`
- `app/globals.css` only if needed for real image/card content or grid responsiveness.
- `sanity/queries/index.ts` only if the existing course projection needs a data-shape correction.
- `prompts/sync-homepage-with-sanity.md` (this prompt).
