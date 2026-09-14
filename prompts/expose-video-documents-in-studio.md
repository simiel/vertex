# Expose imported video documents in Sanity Studio

## Goal

Make the imported internal `video` documents visible in the Sanity Studio sidebar so editors can inspect their IDs, URLs, chapter markers, and transcript chunks. Do not change the web search behavior, lesson pages, schema shape, or imported data.

## Inspected code

- `sanity/structure.ts`: shared Studio structure currently lists Courses, Lessons, Instructors, and Categories only.
- `sanity/schemaTypes/video.ts`: registered internal `video` document with `id`, `url`, `chapters`, and `chunks`.
- `studio/sanity.config.ts`: standalone Studio imports the shared structure.
- Live Sanity verification: 120 `video` documents exist in the dataset.

## Implementation

- Add a `video` document type list item to the shared Studio structure, titled `Video transcripts` or `Video data`.
- Keep it as a normal inspection list; do not add editing restrictions or data mutations beyond existing Studio behavior.
- Optionally use the existing internal title to make its purpose clear.
- Do not alter documents or bulk-import anything.

## Acceptance criteria

- The Studio sidebar shows a video data list.
- Opening the list shows the imported 120 video documents.
- Opening a document shows its provider ID, URL, chapters, and timestamped transcript chunks.
- Existing Studio lists and web routes remain unchanged.

## Checks

- Run `npm run build` from `studio/`.
- Run the focused Studio TypeScript check and root lint.
- Deploy the Studio explicitly with `npx sanity deploy` after review.
