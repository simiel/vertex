import {NextResponse} from 'next/server'
import {auth} from '@clerk/nextjs/server'
import {z} from 'zod'
import {searchVertex} from '@/lib/search/search'
import {captureServerEvent} from '@/lib/analytics/server'
import type {SearchResult} from '@/lib/search/search-types'

const requestSchema = z.object({query: z.string().trim().min(2).max(160)})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({error: 'Enter a search query with at least 2 characters.'}, {status: 400})
  try {
    const results = await searchVertex(parsed.data.query) as SearchResult[]
    const {userId} = await auth()
    await captureServerEvent({name: 'search_performed', properties: {query_length: parsed.data.query.length, result_count: results.length, course_count: new Set(results.map((result) => result.course)).size, search_status: 'success'}}, userId)
    return NextResponse.json({results})
  } catch (error) {
    const {userId} = await auth()
    await captureServerEvent({name: 'search_performed', properties: {query_length: parsed.data.query.length, result_count: 0, course_count: 0, search_status: 'error'}}, userId)
    console.error('Vertex search failed', error instanceof Error ? error.message : error)
    return NextResponse.json({error: 'Search is temporarily unavailable. Please try again.'}, {status: 502})
  }
}
