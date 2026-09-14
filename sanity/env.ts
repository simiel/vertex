export const apiVersion =
  process.env.SANITY_STUDIO_API_VERSION ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  '2026-08-24'

export const dataset = assertValue(
  process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing Sanity dataset. Set SANITY_STUDIO_DATASET for Studio/deploy or NEXT_PUBLIC_SANITY_DATASET for the web app.'
)

export const projectId = assertValue(
  process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing Sanity project ID. Set SANITY_STUDIO_PROJECT_ID for Studio/deploy or NEXT_PUBLIC_SANITY_PROJECT_ID for the web app.'
)

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
