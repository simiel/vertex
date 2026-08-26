const viteEnv = import.meta.env as Record<string, string | undefined>

function required(name: string, studioName: string): string {
  const value = viteEnv[studioName] || viteEnv[name] || process.env[studioName] || process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export const projectId = required('NEXT_PUBLIC_SANITY_PROJECT_ID', 'SANITY_STUDIO_PROJECT_ID')
export const dataset = required('NEXT_PUBLIC_SANITY_DATASET', 'SANITY_STUDIO_DATASET')
export const apiVersion = viteEnv.SANITY_STUDIO_API_VERSION || viteEnv.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_STUDIO_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-24'
