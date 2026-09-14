export type VideoProvider = 'youtube' | 'vimeo' | 'bunny'

export type TranscriptEntry = {
  startSeconds: number
  text: string
}

export type Chapter = {
  startSeconds: number
  label: string
}

export type VideoInputRecord = {
  url: string
  durationSeconds?: number
  transcript: TranscriptEntry[]
  chapters?: Chapter[]
}

export type VideoManifest = {
  videos: VideoInputRecord[]
}

export type NormalizedVideo = VideoInputRecord & {
  provider: VideoProvider
  id: string
  canonicalUrl: string
  chapters: Chapter[]
  chunks: TranscriptEntry[]
}

export type SanityVideoDocument = {
  _id: string
  _type: 'video'
  id: string
  url: string
  chapters: Array<Chapter & {_key: string}>
  chunks: Array<TranscriptEntry & {_key: string}>
}
