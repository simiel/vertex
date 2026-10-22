# Vertex

Vertex is a learning platform for people who want to find a specific moment inside a course, not just a course title. Authors model courses, lessons, and instructors in Sanity. Learners browse a catalog, open a course, and watch the lesson on the site. A plain-language search returns ranked cards for lesson topics and video moments, and a video result opens that lesson at the matched second.

**Author:** [Samuel Mensah](https://github.com/simiel)

## Key features

- **Catalog and course pages.** The home page lists published courses from Sanity, with level, duration, module count, and cover image. A course page shows the summary, learning outcomes, module list, and free-preview labels.
- **Lesson pages.** Each lesson renders Portable Text notes, key points, a pro tip, and resources, with previous and next lessons derived from module order. The player is a YouTube embed. A `start` query parameter seeks to that second, which is how search results jump into a video.
- **Grounded search.** `POST /api/search` runs an OpenAI model through the Vercel AI SDK against the Sanity Context MCP. The agent is instructed to match lesson titles and notes, prefer chapter labels over transcript text, and return only tool-backed hits. The server then loads each lesson from Sanity, fills course, module, and lesson labels from stored data, and validates the payload with Zod before the results page renders it. Results are video-moment cards and lesson cards, with a count, a most-relevant / title sort, and an empty state that links back to the catalog.
- **Sanity content model.** Courses, lessons, instructors, categories, internal video documents, and a search-agent context document. Modules are ordered objects inside a course. A lesson does not store its parent course; queries resolve it with a reverse reference. Video documents hold chapters (`startSeconds`, `label`) and short transcript chunks (`startSeconds`, `text`).
- **Offline video ingestion.** A TypeScript pipeline canonicalizes YouTube, Vimeo, and Bunny URLs, validates timestamps, and merges caption lines into chunks of at most 30 seconds or 480 characters, splitting on chapter boundaries. It writes NDJSON and does not write to Sanity. A Python extractor pulls public English YouTube captions and chapter metadata for seeded lessons without downloading video files.
- **Accounts and analytics.** Clerk provides sign-in, sign-up, and the signed-in user button. PostHog records named events for catalog, course, and lesson views, search, result opens, video play, and watch depth (25/50/75/90/100), plus module expands, learning starts, bookmarks, and notes opens. Search events can also be captured on the server.
- **Design system.** `/design-system` is an in-repo sheet for color, type, spacing, and the course, lesson, and search card patterns. Reference layouts live in `design/`.

## Tech stack

- [Next.js 16](https://nextjs.org) App Router, React 19, TypeScript
- [Sanity](https://www.sanity.io) 5 with `next-sanity`, `@sanity/image-url`, and Portable Text (`@portabletext/react`)
- [Clerk](https://clerk.com) for authentication (`@clerk/nextjs`)
- [PostHog](https://posthog.com) (`posthog-js`) for product analytics
- [Vercel AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/openai`, `@ai-sdk/mcp`) and Zod for search
- Tailwind CSS 4
- Sanity Studio, standalone and also mounted in the Next.js app
- Python 3, `yt-dlp`, and `youtube-transcript-api` for the YouTube caption extractor

## Architecture

The repo is two npm projects that share one schema. It is not an npm workspaces monorepo.

| Path | Responsibility |
| --- | --- |
| `app/` | App Router pages: catalog (`/`), course (`/courses/[slug]`), lesson (`/lessons/[slug]`), search (`/search`), sign-in, sign-up, design system, and embedded Studio (`/studio`). `app/api/search/route.ts` is the search endpoint. |
| `lib/search/` | Server-only search agent. It caches the MCP initial context, calls Sanity Context tools, and re-fetches lesson context before returning cards. |
| `lib/analytics/` | Browser event types and server-side PostHog capture for search. |
| `sanity/` | Schema (`schemaTypes/`), GROQ queries, image builder, and the server-only read client. Content reads use `SANITY_API_READ_TOKEN` and the published perspective. |
| `sanity.config.ts` | Studio configuration for the `/studio` route inside Next.js. |
| `studio/` | Standalone Studio (`vertex-studio`) on port 3333. It imports the same schema and structure from `../sanity`. |
| `studio/scripts/seed/` | Seed catalog (`seed.ndjson`) and a video metadata index (`videos.json`). The seed contains 10 courses, 120 lessons, 5 instructors, and 6 categories. |
| `studio/scripts/video-ingestion/` | Normalize, chunk, test, and extract tooling. Generated raw files, manifests, and reports are gitignored. |
| `proxy.ts` | Clerk middleware. Routes are public; Clerk still runs so the user button and analytics identity work. |
| `design/` | Desktop reference images for the home, course, lesson, search, and design-system screens. |

Pages load content on the server. The browser does not hold a Sanity token and does not call the model or the Context MCP. Search, playback, and analytics identity stay on the boundaries above: the search route is the only caller of the model, the lesson page embeds YouTube, and PostHog identifies the Clerk user id in the browser.

`sanity/lib/live.ts` defines `next-sanity` live fetching. The pages that ship use `serverClient.fetch` from `sanity/lib/server-client.ts`.

Instructor and category documents are part of the schema, and `sanity/data.ts` can fetch them. The routes implemented today are the catalog, course, lesson, search, design system, auth, and Studio.

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- A Sanity project and dataset, with a read token for server-side queries
- A Clerk application
- A PostHog project (the Next.js dev server throws in development when the public PostHog variables are missing)
- For search: a deployed Sanity Studio (the Context MCP serves datasets with a deployed Studio) and an OpenAI API key
- For YouTube extraction: Python 3 with `yt-dlp` installed. `youtube-transcript-api` is used when `yt-dlp` returns no English captions

There is no committed env file. `.env*` is gitignored.

### Install

```bash
npm install
```

Standalone Studio:

```bash
cd studio
npm install
```

### Environment variables

Set these for the Next.js app. Values stay out of the repo. The standalone Studio reads the `SANITY_STUDIO_*` names and falls back to the `NEXT_PUBLIC_SANITY_*` names.

**Sanity**

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project id. `SANITY_STUDIO_PROJECT_ID` is accepted as a fallback. |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset name. `SANITY_STUDIO_DATASET` is accepted as a fallback. |
| `SANITY_API_READ_TOKEN` | Server-only read token. Required for catalog, course, and lesson fetches. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Optional. Defaults to `2026-08-24`. `SANITY_STUDIO_API_VERSION` is the Studio alias. |

**Clerk**

`@clerk/nextjs` reads these. They are not referenced by name in application code.

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key, available in the browser. |
| `CLERK_SECRET_KEY` | Secret key. Server only. |

**PostHog**

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Public project token. Required in development. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host. Required in development. |
| `POSTHOG_API_KEY` | Server-only key for search capture. Capture is skipped when it is unset. |

**Search**

| Variable | Role |
| --- | --- |
| `SANITY_CONTEXT_MCP_URL` | Sanity Context MCP endpoint. Required when a search runs. |
| `SANITY_CONTEXT_TOKEN` | Optional bearer token for the MCP. Falls back to `SANITY_API_READ_TOKEN`. |
| `OPENAI_API_KEY` | Read by `@ai-sdk/openai` when search runs. |
| `OPENAI_SEARCH_MODEL` | Optional model id. Defaults to `gpt-4.1-mini`. |

### Run

Next.js app at [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

Production build and server:

```bash
npm run build
npm start
```

Standalone Studio at [http://localhost:3333](http://localhost:3333):

```bash
cd studio
npm run dev
```

The same Studio is also available inside the Next.js app at [http://localhost:3000/studio](http://localhost:3000/studio) after the web app is running.

### Checks

From the repository root:

```bash
npm run lint
npm run typecheck
```

From `studio/`:

```bash
npm run typecheck
npm run video:test
npm run video:check
```

`video:test` runs `studio/scripts/video-ingestion/normalize.test.ts`. `video:check` validates `studio/scripts/video-ingestion/fixture.json` and writes nothing. There is no root test script.

## Video ingestion

Operator notes for the offline pipeline also live in [`studio/README.md`](studio/README.md).

Check the fixture:

```bash
cd studio
npm run video:check
```

Turn a manifest into NDJSON:

```bash
npm run video:ingest -- --input /absolute/path/manifest.json --output /absolute/path/videos.ndjson
```

Each manifest record needs an HTTPS YouTube, Vimeo, or Bunny `url`, a `transcript` array of `{startSeconds, text}`, and optional `chapters` of `{startSeconds, label}`. Timestamps are integer seconds. The command stays offline. After review, import from `studio/` with the Sanity CLI, for example `npx sanity datasets import /absolute/path/videos.ndjson`. Confirm with a query such as `*[_type == "video"]{_id, id, url, chapters, chunks}`.

`studio/scripts/seed/videos.json` is metadata for seeded lesson videos. It has no captions or chapters, so it is not an ingestion manifest.

Extract English captions and YouTube chapters for lessons in `studio/scripts/seed/seed.ndjson` from the `studio/` directory:

```bash
python3 scripts/video-ingestion/extract-youtube.py
```

That writes snapshots, a manifest, and a status report under the gitignored `scripts/video-ingestion/raw/`, `generated/`, and `reports/` directories. It records missing captions and metadata errors, and it does not invent transcript text or import into Sanity. Review the report, then:

```bash
npm run video:ingest -- --input scripts/video-ingestion/generated/manifest.json --output scripts/video-ingestion/generated/videos.ndjson
```

Lesson playback embeds YouTube. The ingestion normalizer also accepts Vimeo and Bunny URLs so those documents can be stored and searched; the lesson page reads a YouTube `v` id for the iframe.

## Project status

Active development (`0.1.0` in `package.json`). The catalog, course page, lesson page, search, Clerk auth, PostHog events, Sanity model, seed catalog, and video ingestion pipeline are in the tree.

A few controls are interface-only in this version. The course progress panel and the lesson sidebar use fixed copy. Bookmark buttons keep state in the component and send an analytics event. Course and lesson headers link to `/my-learning`, and the home page uses a `#learning` anchor; no My Learning route is defined. The notifications button has no handler.

Nothing in the repo marks this as coursework or a competition entry, and the repo does not record a public deployment URL or usage metrics. Student counts on courses and lessons are content fields for display.

## What this demonstrates

- A Sanity content model that keeps marketing content, curriculum order, Portable Text notes, and transcript data in separate types, with the parent course recovered by reverse reference instead of duplicated onto every lesson.
- A hard server/client split: private Sanity reads, the search model, and the Context MCP stay on the server; the browser renders stored cards and an embed.
- Search that is an agent with a schema, a tool loop, and a second validation pass. The model proposes hits. The server reloads the lesson and rejects a payload that does not match the result schema.
- Video understanding treated as data, not a request-time transcription job: chapters and bounded chunks, an offline extractor, deterministic ids, and a check mode that can run without credentials.
- Product analytics as explicit learning events, including watch-depth thresholds and server-side search capture tied to the Clerk user when one is present, rather than a single page-view hook.
- Two Studio entry points, embedded and standalone, compiling the same schema so authoring and the Next.js app can ship separately.
