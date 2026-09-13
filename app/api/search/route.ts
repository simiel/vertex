import {NextResponse} from 'next/server'
import {z} from 'zod'
import {searchVertex} from '@/lib/search/search'

const requestSchema = z.object({query: z.string().trim().min(2).max(160)})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({error: 'Enter a search query with at least 2 characters.'}, {status: 400})
  try {
    const results = await searchVertex(parsed.data.query)
    return NextResponse.json({results})
  } catch (error) {
    console.error('Vertex search failed', error instanceof Error ? error.message : error)
    return NextResponse.json({error: 'Search is temporarily unavailable. Please try again.'}, {status: 502})
  }
}
