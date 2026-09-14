import {readFile, writeFile} from 'node:fs/promises'
import {normalizeManifest, VideoIngestionError} from './normalize.ts'
import {toNdjson} from './documents.ts'

type Options = {input?: string; output?: string; check: boolean}

function optionsFromArgs(args: string[]): Options {
  const options: Options = {check: false}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--check' || arg === '--dry-run') options.check = true
    else if (arg === '--input') options.input = args[++index]
    else if (arg === '--output') options.output = args[++index]
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run video:ingest -- --input <manifest.json> [--output <videos.ndjson>] [--check]')
      process.exit(0)
    } else throw new VideoIngestionError(`Unknown option ${arg}`)
  }
  if (!options.input) throw new VideoIngestionError('CLI, --input: is required')
  if (!options.check && !options.output) throw new VideoIngestionError('CLI, --output: is required unless --check is used')
  return options
}

export async function run(args: string[]): Promise<void> {
  const options = optionsFromArgs(args)
  const raw = await readFile(options.input!, 'utf8')
  let manifest: unknown
  try {
    manifest = JSON.parse(raw)
  } catch {
    throw new VideoIngestionError(`Input ${options.input}: contains invalid JSON`)
  }
  const videos = normalizeManifest(manifest)
  const chapterCount = videos.reduce((count, video) => count + video.chapters.length, 0)
  const chunkCount = videos.reduce((count, video) => count + video.chunks.length, 0)
  console.log(`Validated ${videos.length} videos, ${chapterCount} chapters, and ${chunkCount} transcript chunks.`)
  if (!options.check) {
    await writeFile(options.output!, toNdjson(videos), 'utf8')
    console.log(`Wrote deterministic Sanity NDJSON to ${options.output}.`)
  } else {
    console.log('Check-only mode: no output was written.')
  }
}

if (process.argv[1]?.endsWith('/video-ingestion/cli.ts')) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Video ingestion failed')
    process.exitCode = 1
  })
}
