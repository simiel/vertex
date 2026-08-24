# Implement the Vertex home page at `/`

## Goal

Build the Vertex learning-platform home page at `/` to match the provided reference image `design/vertex-home.png`. Keep the existing design-system page available at `/design-system` and do not restyle or regress it.

## Skills and guidance read

- Repository instructions in `AGENTS.md`.
- Next.js App Router project structure guidance in `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`.
- `build-web-apps:frontend-app-builder` guidance. Because the user supplied an exact visual reference and requested faithful implementation of an existing UI, use the reference as the source of truth and do not generate an alternative design.

## Code and assets inspected

- `app/design-system/page.tsx`: existing client-side design-system route that must remain unchanged in behavior.
- `app/globals.css`: current global CSS, fonts, color variables, and design-system styles.
- `app/layout.tsx`: root layout and current metadata.
- `design/vertex-home.png`: supplied desktop reference for the new home page.
- `package.json`: Next.js 16.3.2, React 19, TypeScript, Tailwind/PostCSS, and available scripts.

## Decisions and assumptions

- The new home page belongs at `app/page.tsx`, mapping to `/`.
- The supplied screenshot is the desktop source of truth at approximately 1024px wide and should be reproduced closely in layout, spacing, typography, borders, colors, and visual density.
- The page should be responsive below the reference width: stack the course cards, allow the header navigation to wrap or collapse sensibly, preserve readable typography, and avoid horizontal overflow.
- Use CSS/SVG/code-native UI for the logo mark, icons, search field, course cards, and decorative bars. Do not use the screenshot itself as a page background or a static image of the UI.
- Since no backend/content source exists in the current repo, use the exact visible sample course content from the reference image as local typed data. Keep controls presentational unless an interaction is necessary for usability.
- The design-system page currently relies on global styles. Scope new home-page styles under a dedicated root class so existing `/design-system` styling remains intact.
- The image shows a header notification icon and avatar; use accessible code-native placeholders that match the reference geometry, with no new authentication or user-data integration.

## Expected files to touch

- Create `app/page.tsx` for the home page.
- Update `app/globals.css` with scoped home-page styles and responsive rules.
- Update `app/layout.tsx` metadata from design-system-only wording to Vertex learning-platform home-page metadata, while preserving the shared layout.
- Do not modify `app/design-system/page.tsx`.

## Visual requirements

1. Warm off-white page background with a centered white content canvas and subtle vertical/diagonal edge treatment matching the reference.
2. Header with Vertex orange mark and wordmark on the left, `Courses` and `My Learning` navigation, notification icon, and circular user avatar on the right.
3. Hero centered below the header with the orange outlined `INTELLIGENT LEARNING` label, large Playfair Display headline split over two lines, supporting copy, orange `Explore Courses` button, and large bordered search field with search icon, placeholder, and `⌘ K` key hint.
4. Course section with `All Courses`, `View all courses →`, and three equal course cards for Next.js for Production, Docker Essentials, and TypeScript Deep Dive.
5. Cards must reproduce the visible logos, titles, descriptions, dividers, metadata icons, levels, durations, and module counts from the reference.
6. Bottom decorative area with the star message `New courses and lessons added every week.` and the soft orange vertical-bar motif.
7. Match the reference’s restrained border radius, thin warm borders, orange accent, slate supporting text, typography hierarchy, and generous whitespace.

## Interaction and accessibility requirements

- The `Explore Courses`, `View all courses`, course cards, nav items, notification control, avatar control, and search field must be semantic interactive elements or links with accessible labels.
- The search field may be presentational for now, but must be a real input and support focus styling.
- Provide visible keyboard focus states without changing the visual language.
- Use meaningful heading hierarchy and alt text/labels for the course marks and controls.
- Do not add authentication, API calls, analytics, or dependencies for this static home-page implementation.

## Security considerations

- No secrets, tokens, server writes, external data fetching, or new client/server integrations are needed.
- Keep the implementation local and code-native; do not expose or invent environment configuration.

## Acceptance criteria

- `/` renders the new Vertex home page and matches `design/vertex-home.png` on desktop.
- `/design-system` continues to render the existing design-system page without visual or behavioral regressions.
- The home page is responsive down to mobile without horizontal scrolling or clipped content.
- The page includes all visible reference sections and copy listed above.
- `npm run lint` passes with no new errors.
- `npm run build` is attempted and its real result is reported; unrelated repository-wide reference-file failures remain documented rather than “fixed” as part of this task.

## Checks to run

From the repository root:

1. `npm run lint`
2. `npm run build`
3. Start the app with `npm run dev` for manual browser verification.

## Exact manual test steps

1. Open `http://localhost:3000/` at a desktop viewport near the reference size.
2. Compare the header, hero, search control, course cards, and decorative footer area against `design/vertex-home.png`.
3. Focus the search input and confirm it has a visible accessible focus state.
4. Resize to a mobile viewport and confirm the header, hero, cards, and decorative motif remain readable with no horizontal overflow.
5. Open `http://localhost:3000/design-system` and confirm the existing design-system page still loads and its Courses/My Learning and select interactions still work.

