# Vertex Studio

Standalone Sanity Studio for Vertex. The canonical schema lives in `../sanity/schemaTypes` and is shared by the web app and this Studio.

```bash
npm install
npm run dev
```

Open http://localhost:3333 and sign in with the Sanity account that has access to the linked project.

## Offline video ingestion

The pipeline accepts a normalized JSON manifest containing `videos`, where each record has an HTTPS YouTube, Vimeo, or Bunny `url`, a `transcript` array of `{startSeconds, text}`, and optional `chapters` of `{startSeconds, label}`. Timestamps are integer seconds. Authored chapters are preferred; transcript entries are cleaned and merged into short timestamped chunks.

Check the example without writing output:

```bash
npm run video:check
```

Generate Sanity documents to a reviewed output file:

```bash
npm run video:ingest -- --input /absolute/path/manifest.json --output /absolute/path/videos.ndjson
```

The command is offline and does not write to Sanity. After reviewing the NDJSON, an operator can explicitly import it from this directory with `npx sanity datasets import /absolute/path/videos.ndjson --replace`, then verify with a query such as `*[_type == "video"]{_id,id,url,chapters,chunks}`. Never use the supplied `scripts/seed/videos.json` as an ingestion manifest: it contains metadata only and no captions or chapters.

To extract real public English captions and YouTube chapter metadata for the seeded lessons without downloading video media, use an isolated Python environment with `yt-dlp` installed:

```bash
/private/tmp/vertex-video-tools/bin/python scripts/video-ingestion/extract-youtube.py
```

This writes private raw snapshots, a normalized manifest, and a status report under the ignored `raw/`, `generated/`, and `reports/` directories. Review the report and generated manifest, then run the TypeScript transformer:

```bash
npm run video:ingest -- --input scripts/video-ingestion/generated/manifest.json --output scripts/video-ingestion/generated/videos.ndjson
```

The extractor reports restricted videos, missing captions, and metadata errors; it never invents transcript data and never imports into Sanity.
