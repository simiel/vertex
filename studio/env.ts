function required(value: string | undefined, studioName: string, fallbackName: string): string {
  if (!value) throw new Error(`Missing environment variable: ${studioName} (or fallback ${fallbackName})`)
  return value
}

export const projectId = required(
  process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'SANITY_STUDIO_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_PROJECT_ID'
)
export const dataset = required(
  process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  'SANITY_STUDIO_DATASET',
  'NEXT_PUBLIC_SANITY_DATASET'
)
export const apiVersion = process.env.SANITY_STUDIO_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-24'
