# Ingest real YouTube transcripts and chapters for Vertex lessons

## Goal

Replace the example video-ingestion fixture with real transcript and chapter data for every lesson in the existing Vertex seed content, then generate Sanity `video` documents for review and explicit import. Preserve the existing lesson/course seed files and report videos that have no usable captions or chapters.

## Scope and current inventory

- `studio/scripts/seed/seed.ndjson` contains 120 lessons across 10 courses.
- Lesson records contain YouTube `videoUrl` values and durations.
- `studio/scripts/seed/videos.json` contains 120 matching YouTube metadata records but no transcript or chapter data; it must remain unchanged.
- The offline transformer is in `studio/scripts/video-ingestion/` and accepts normalized `{videos: [...]}` JSON.
- No `yt-dlp` or `youtube-transcript-api` executable is currently installed.

## Plan

1. Add a deterministic manifest-builder that extracts lesson ID, YouTube URL, and duration from the existing seed NDJSON without modifying it.
2. Use a documented, isolated YouTube caption/chapter extraction tool in a separate extraction step. Prefer a machine-readable captions route that does not download video media; use provider metadata for chapter markers when available.
3. Snapshot raw extraction responses in a private, gitignored directory before transforming them. Never commit cookies, tokens, raw customer data, or large transcript snapshots.
4. Convert available captions and chapters to the existing normalized manifest format and run the existing validation/chunking pipeline.
5. Generate deterministic NDJSON under a private/generated path and a validation report containing counts, missing captions, missing chapters, provider errors, and lesson-to-video mismatches.
6. Stop before importing to Sanity. Import is a separate explicit operator action after review.

## Decisions and guardrails

- Do not download video/audio media.
- Do not bypass age gates, login requirements, bot protections, geo restrictions, or YouTube access controls.
- Do not use copyrighted transcripts outside this project’s authorized content workflow; report unavailable or restricted videos instead.
- Captions may be auto-generated or manually authored; record the source/language/quality in the local report, not in the existing Sanity schema unless explicitly approved.
- Prefer English captions unless a lesson explicitly requires another language. Fail or report missing language rather than silently substituting unrelated captions.
- Preserve lesson duration as an upper-bound validation value.
- Preserve authored/source chapters when available; do not invent chapter labels from transcript text.
- Keep whole transcripts out of the Next.js request path. Only generated timestamped `chunks[]` enter the Sanity `video` documents.
- Sanity credentials are not needed for extraction or generation. A Sanity write/import token is needed only for the later explicit import.

## Expected files

- Add a manifest-builder/extraction adapter under `studio/scripts/video-ingestion/`.
- Add narrowly scoped ignored directories for raw snapshots, generated output, and reports.
- Add operator documentation for installing/running the chosen extractor and handling missing captions.
- Update package scripts/dependencies only if necessary and only after reviewing the tool’s license and behavior.
- Do not modify `studio/scripts/seed/seed.ndjson`, `studio/scripts/seed/videos.json`, lesson documents, or application routes.

## Acceptance criteria

- All 120 lessons are enumerated and matched to a unique YouTube video identity before extraction.
- Extraction produces a clear per-video status: usable, missing captions, missing chapters, restricted/error, or mismatch.
- No media files are downloaded.
- Available captions become clean bounded timestamped chunks; available chapters become ordered clean chapter markers.
- The generated NDJSON is deterministic and passes the existing ingestion checks.
- Missing or restricted videos are not fabricated and are listed in the report for follow-up.
- Seed files remain byte-for-byte unchanged.
- No Sanity dataset write occurs without a separate explicit approval.

## Checks

1. Build and validate the 120-lesson source manifest.
2. Run extraction with bounded concurrency and retry limits.
3. Validate generated normalized data and inspect representative lessons from multiple courses.
4. Generate output twice and compare byte-for-byte.
5. Run Studio typecheck/focused tests and root lint.
6. Report exact counts and the missing/error list before any import.

## Required external input

Before extraction, confirm that the user authorizes fetching publicly available YouTube caption/metadata endpoints for these lesson videos and specify whether auto-generated English captions are acceptable when authored captions are unavailable. If extraction requires authentication or a paid/API credential, stop and request it rather than guessing.
