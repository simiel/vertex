import type {NormalizedVideo, SanityVideoDocument} from './types.ts'

function safeIdPart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export function toSanityDocument(video: NormalizedVideo): SanityVideoDocument {
  const prefix = `video.${video.provider}.${safeIdPart(video.id)}`
  return {
    _id: prefix,
    _type: 'video',
    id: video.id,
    url: video.canonicalUrl,
    chapters: video.chapters.map((chapter, index) => ({...chapter, _key: `chapter-${index}-${chapter.startSeconds}`})),
    chunks: video.chunks.map((chunk, index) => ({...chunk, _key: `chunk-${index}-${chunk.startSeconds}`})),
  }
}

export function toNdjson(videos: NormalizedVideo[]): string {
  return videos.map(toSanityDocument).map((document) => JSON.stringify(document)).join('\n') + (videos.length ? '\n' : '')
}
