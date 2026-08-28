# Import the provided Vertex seed into Sanity

## Goal

Import the existing Vertex content using the provided seed files. Do not generate, rewrite, normalize, or modify either source file:

- `studio/scripts/seed/seed.ndjson`
- `studio/scripts/seed/videos.json`

Use the Sanity CLI from the Studio workspace, targeting the project and dataset already configured by `studio/env` and `studio/sanity.cli.ts`.

## Guidance read

- `sanity-best-practices`: use CLI NDJSON import for bulk content, preserve stable source IDs, and validate counts and references.
- `sanity-migration`: import the supplied snapshot as-is, respect the existing document relationships and `_sanityAsset` directives, and verify the result after loading.

## Inspected code and data

- `studio/package.json`: Sanity 5.31.2; no custom seed script.
- `studio/sanity.cli.ts`: CLI project and dataset come from `./env`.
- `studio/sanity.config.ts`: standalone Studio configuration.
- `seed.ndjson`: 141 JSONL documents with stable `_id` values and Sanity image asset directives.
- `videos.json`: 120 keyed video metadata records; it is an input fixture and must not be transformed or edited.
- Expected NDJSON document counts: category 6, instructor 5, course 10, lesson 120.

## Decisions and assumptions

- The NDJSON file is the authoritative import payload; no new content will be authored.
- `videos.json` is used only as provided if the existing repository's documented seed/import workflow requires it; do not synthesize Sanity documents from it or alter it without an explicit existing command/workflow that consumes it.
- Use `sanity datasets import` with the supplied NDJSON and the appropriate idempotent behavior for the existing dataset. Do not delete unrelated documents.
- The import may update existing documents matching the supplied stable IDs, but it must not perform a dataset-wide destructive reset.

## Requirements

1. Confirm the active Sanity project/dataset and CLI authentication before writing.
2. Run the Sanity CLI import from `studio/` using `studio/scripts/seed/seed.ndjson`.
3. Preserve all source files byte-for-byte.
4. Verify post-import document counts by `_type` using the Sanity CLI (or an equivalent CLI query), with expected counts of 6/5/10/120.
5. Verify representative documents and references, including at least one category, instructor, course, and lesson, plus the lesson-to-video URL data.
6. Report exact command output and any asset import warnings or failures.

## Security and safety

- Keep Sanity credentials and tokens in the CLI/auth environment; do not print secrets.
- Do not use MCP content tools for this bulk write.
- Do not run `sanity datasets delete`, a dataset reset, or any broad delete operation.
- Do not edit the seed files or unrelated application files.

## Acceptance criteria

- CLI import completes successfully, or any failure is reported with the exact blocking error.
- Sanity contains the expected counts: category 6, instructor 5, course 10, lesson 120.
- Representative documents and relationships are queryable after import.
- `git diff -- studio/scripts/seed/seed.ndjson studio/scripts/seed/videos.json` is empty.
- No source seed file was modified.

## Checks and manual verification

Run from `studio/`:

```sh
npx sanity datasets list
npx sanity datasets import scripts/seed/seed.ndjson <appropriate import flags>
npx sanity documents query '*[_type in ["category", "instructor", "course", "lesson"]] | order(_type) { _type }'
npx sanity documents query '*[_id in ["category.web-development", "instructor.mira-kovac", "course.nextjs-app-router-in-depth", "lesson.nextjs-app-router-in-depth-file-system-routing"]]'
```

Use the actual course ID present in the seed if the illustrative ID differs. Compare returned counts to the expected inventory and inspect import output for asset issues. Finally verify the two source files are unchanged with `git diff --check` and a targeted `git diff`.

## Files expected to change

None. This task is an external Sanity dataset import and verification only.
