export type SearchResult =
  | {kind: 'video'; id: string; course: string; courseIcon?: string; module: string; lessonNumber: string; lessonTitle: string; lessonSlug: string; thumbnailUrl?: string; durationSeconds: number; description: string; matchedSeconds: number; matchedLabel?: string}
  | {kind: 'lesson'; id: string; course: string; courseIcon?: string; module: string; lessonNumber: string; lessonTitle: string; lessonSlug: string; keyPoints: string[]; description: string}
