# Move the design-system page to `/design-system`

## Goal

Move the existing Vertex design-system page from the root URL `/` to `/design-system`, preserving its current UI, client-side interactions, styling, metadata, and behavior.

## Skills and guidance read

- Repository instructions in `AGENTS.md`.
- Next.js App Router project-structure guidance in `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`.
- No additional product or UI skill is needed because this is a route-only relocation with no design changes.

## Code inspected

- `app/page.tsx`: the complete client-side design-system page, including stateful tabs and select controls.
- `app/layout.tsx`: root metadata and layout wrapper.
- `app/globals.css`: shared styling used by the design-system page.
- `package.json`: available scripts (`dev`, `build`, `lint`) and Next.js `16.3.2`.

## Decisions and assumptions

- “Move” means `/` must no longer serve the design-system page; no redirect or replacement homepage is requested.
- Preserve the existing component source and CSS behavior exactly; only change the filesystem route location and any route-specific TypeScript typing that becomes invalid after the move.
- Keep the root layout and existing metadata unchanged unless the route move requires a minimal correction.
- Do not add navigation, redirects, a new homepage, or unrelated cleanup.

## Expected files to touch

- Move `app/page.tsx` to `app/design-system/page.tsx`.
- Do not modify `app/globals.css` or `app/layout.tsx` unless verification identifies a route-specific issue.

## Requirements

1. `/design-system` renders the same design-system page currently served at `/`.
2. The page remains a client component and its tabs/select interactions continue to work.
3. `/` no longer renders the design-system page.
4. Preserve all existing visual styling and content.
5. Do not introduce dependencies or unrelated changes.

## Security considerations

- This is a presentational route move with no authentication, data access, mutations, or new exposed configuration.
- Do not add client/server boundaries or environment variables.

## Acceptance criteria

- `app/design-system/page.tsx` exists and contains the existing page implementation.
- `app/page.tsx` is absent unless a replacement root route is explicitly needed; for this request, no replacement is expected.
- The production build recognizes `/design-system` and does not expose the old design-system page at `/`.
- TypeScript and lint checks pass.
- Manual checks confirm `/design-system` renders correctly and the interactive controls still respond.

## Checks to run

From the repository root:

1. `npm run lint`
2. `npm run build`

## Manual test steps

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/design-system` and confirm the complete design-system page renders.
3. Click the Courses/My Learning navigation tabs and confirm the active state changes.
4. Change the Select control and confirm its value updates.
5. Open `http://localhost:3000/` and confirm it no longer renders the design-system page.

