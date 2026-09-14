import type {Chapter, NormalizedVideo, TranscriptEntry, VideoInputRecord, VideoManifest, VideoProvider} from './types.ts'

const MAX_CHUNK_SECONDS = 30
const MAX_CHUNK_CHARACTERS = 480
const MIN_TEXT_LENGTH = 1

export class VideoIngestionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VideoIngestionError'
  }
}

function fail(record: number | string, field: string, message: string): never {
  throw new VideoIngestionError(`Record ${record}, ${field}: ${message}`)
}

function cleanText(value: unknown, record: number | string, field: string): string {
  if (typeof value !== 'string') fail(record, field, 'must be a string')
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) fail(record, field, 'must not be empty')
  return text
}

function parsePositiveInteger(value: unknown, record: number | string, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    fail(record, field, 'must be a non-negative integer number of seconds')
  }
  return value
}

function withoutTracking(url: URL): string {
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

function matchId(pathname: string, pattern: RegExp): string | undefined {
  const match = pathname.match(pattern)
  return match?.[1]
}

export function parseVideoUrl(rawUrl: unknown, record: number | string): {provider: VideoProvider; id: string; canonicalUrl: string} {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) fail(record, 'url', 'must be a non-empty URL')

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    fail(record, 'url', 'must be a valid absolute URL')
  }
  if (url.protocol !== 'https:') fail(record, 'url', 'must use https')

  const host = url.hostname.toLowerCase()
  if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    const id = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || matchId(url.pathname, /^\/(?:embed|shorts|live)\/([^/]+)/)
    if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) fail(record, 'url', 'does not contain a valid YouTube video ID')
    return {provider: 'youtube', id, canonicalUrl: `https://www.youtube.com/watch?v=${id}`}
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    const id = matchId(url.pathname, host === 'player.vimeo.com' ? /\/video\/(\d+)/ : /^\/(\d+)/)
    if (!id) fail(record, 'url', 'does not contain a valid Vimeo video ID')
    return {provider: 'vimeo', id, canonicalUrl: `https://vimeo.com/${id}`}
  }

  if (host.endsWith('.bunny.net') || host.endsWith('.bunnycdn.com') || host.endsWith('.b-cdn.net')) {
    const pathParts = url.pathname.split('/').filter(Boolean)
    const id = host === 'video.bunnycdn.com' ? pathParts[2] : pathParts[0]
    if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) fail(record, 'url', 'does not contain a valid Bunny video ID')
    return {provider: 'bunny', id, canonicalUrl: withoutTracking(url)}
  }

  fail(record, 'url', 'provider is unsupported; expected YouTube, Vimeo, or Bunny')
}

function normalizeChapters(value: unknown, record: number | string): Chapter[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail(record, 'chapters', 'must be an array')

  const chapters = value.map((chapter, index) => {
    if (!chapter || typeof chapter !== 'object') fail(record, `chapters[${index}]`, 'must be an object')
    const item = chapter as Record<string, unknown>
    return {
      startSeconds: parsePositiveInteger(item.startSeconds, record, `chapters[${index}].startSeconds`),
      label: cleanText(item.label, record, `chapters[${index}].label`),
    }
  }).sort((a, b) => a.startSeconds - b.startSeconds)

  for (let index = 1; index < chapters.length; index += 1) {
    if (chapters[index].startSeconds === chapters[index - 1].startSeconds) {
      fail(record, 'chapters', `contains duplicate start time ${chapters[index].startSeconds}`)
    }
  }
  return chapters
}

function normalizeTranscript(value: unknown, record: number | string): TranscriptEntry[] {
  if (!Array.isArray(value)) fail(record, 'transcript', 'must be an array')
  const entries = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object') fail(record, `transcript[${index}]`, 'must be an object')
    const item = entry as Record<string, unknown>
    return {
      startSeconds: parsePositiveInteger(item.startSeconds, record, `transcript[${index}].startSeconds`),
      text: cleanText(item.text, record, `transcript[${index}].text`),
    }
  }).filter((entry) => entry.text.length >= MIN_TEXT_LENGTH).sort((a, b) => a.startSeconds - b.startSeconds || a.text.localeCompare(b.text))

  if (!entries.length) fail(record, 'transcript', 'must contain at least one usable entry')
  return entries
}

export function chunkTranscript(entries: TranscriptEntry[], chapters: Chapter[] = []): TranscriptEntry[] {
  const chunks: TranscriptEntry[] = []
  let current: TranscriptEntry | undefined

  const flush = () => {
    if (current) chunks.push(current)
    current = undefined
  }

  for (const entry of entries) {
    if (!current) {
      current = {...entry}
      continue
    }
    const elapsed = entry.startSeconds - current.startSeconds
    const nextText = `${current.text} ${entry.text}`
    const crossesChapterBoundary = chapters.some((chapter) => chapter.startSeconds > current!.startSeconds && chapter.startSeconds <= entry.startSeconds)
    if (crossesChapterBoundary || elapsed > MAX_CHUNK_SECONDS || nextText.length > MAX_CHUNK_CHARACTERS) {
      flush()
      current = {...entry}
    } else {
      current.text = nextText
    }
  }
  flush()
  return chunks
}

function validateDuration(value: unknown, transcript: TranscriptEntry[], chapters: Chapter[], record: number | string): number | undefined {
  if (value === undefined) return undefined
  const duration = parsePositiveInteger(value, record, 'durationSeconds')
  const latestTimestamp = Math.max(...transcript.map((entry) => entry.startSeconds), ...chapters.map((chapter) => chapter.startSeconds))
  if (latestTimestamp > duration) fail(record, 'durationSeconds', `must be at least the latest timestamp (${latestTimestamp})`)
  return duration
}

export function normalizeRecord(input: unknown, record: number | string): NormalizedVideo {
  if (!input || typeof input !== 'object') fail(record, 'record', 'must be an object')
  const item = input as Record<string, unknown>
  const parsed = parseVideoUrl(item.url, record)
  const chapters = normalizeChapters(item.chapters, record)
  const transcript = normalizeTranscript(item.transcript, record)
  const durationSeconds = validateDuration(item.durationSeconds, transcript, chapters, record)
  const chunks = chunkTranscript(transcript, chapters)
  if (!chapters.length && !chunks.length) fail(record, 'record', 'must have usable chapters or transcript chunks')
  return {url: parsed.canonicalUrl, durationSeconds, transcript, chapters, chunks, provider: parsed.provider, id: parsed.id, canonicalUrl: parsed.canonicalUrl}
}

export function normalizeManifest(input: unknown): NormalizedVideo[] {
  if (!input || typeof input !== 'object') throw new VideoIngestionError('Manifest: expected an object with a videos array')
  const rawVideos = (input as Record<string, unknown>).videos
  if (!Array.isArray(rawVideos)) throw new VideoIngestionError('Manifest, videos: must be an array')
  const normalized = rawVideos.map((record, index) => normalizeRecord(record, index))
  const identities = new Set<string>()
  for (const video of normalized) {
    const identity = `${video.provider}:${video.id}`
    if (identities.has(identity)) throw new VideoIngestionError(`Manifest: duplicate video identity ${identity}`)
    identities.add(identity)
  }
  return normalized.sort((a, b) => `${a.provider}:${a.id}`.localeCompare(`${b.provider}:${b.id}`))
}

export type {Chapter, TranscriptEntry, VideoManifest, VideoInputRecord}
