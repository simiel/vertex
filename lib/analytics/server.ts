import {cookies} from 'next/headers'

type ServerEvent = {name: string; properties: Record<string, string | number | boolean>}

function getDistinctId(cookieHeader: string | null, userId: string | null) {
  if (userId) return userId
  if (!cookieHeader) return null
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('ph_') && part.endsWith('_posthog='))
  if (!cookie) return null
  try {
    const value = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1))
    const parsed = JSON.parse(value) as {distinct_id?: unknown}
    return typeof parsed.distinct_id === 'string' ? parsed.distinct_id : null
  } catch {
    return null
  }
}

export async function captureServerEvent(event: ServerEvent, userId: string | null) {
  const apiKey = process.env.POSTHOG_API_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!apiKey || !host) return
  const cookieStore = await cookies()
  const distinctId = getDistinctId(cookieStore.toString(), userId)
  if (!distinctId) return

  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({api_key: apiKey, event: event.name, distinct_id: distinctId, properties: event.properties}),
      cache: 'no-store',
    })
  } catch (error) {
    console.warn('PostHog server capture failed', error instanceof Error ? error.message : error)
  }
}
