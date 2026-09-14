import 'server-only'

import {createMCPClient} from '@ai-sdk/mcp'
import {openai} from '@ai-sdk/openai'
import {generateText, Output, stepCountIs} from 'ai'
import {z} from 'zod'
import {serverClient} from '@/sanity/lib/server-client'
import type {SearchResult} from './search-types'
export type {SearchResult} from './search-types'

const resultSchema = z.object({
  results: z.array(z.discriminatedUnion('kind', [
    z.object({kind: z.literal('video'), id: z.string(), course: z.string(), courseIcon: z.string().optional(), module: z.string(), lessonNumber: z.string(), lessonTitle: z.string(), lessonSlug: z.string(), thumbnailUrl: z.string().optional(), durationSeconds: z.number().int().nonnegative(), description: z.string(), matchedSeconds: z.number().int().nonnegative(), matchedLabel: z.string().optional()}),
    z.object({kind: z.literal('lesson'), id: z.string(), course: z.string(), courseIcon: z.string().optional(), module: z.string(), lessonNumber: z.string(), lessonTitle: z.string(), lessonSlug: z.string(), keyPoints: z.array(z.string()), description: z.string()}),
  ])),
})

const modelResultSchema = z.object({results: z.array(z.object({
  kind: z.enum(['video', 'lesson']), id: z.string().nullable(), course: z.string().nullable(), courseIcon: z.string().nullable(), module: z.string().nullable(), lessonNumber: z.string().nullable(), lessonTitle: z.string().nullable(), lessonSlug: z.string().nullable(), thumbnailUrl: z.string().nullable(), durationSeconds: z.number().int().nonnegative().nullable(), description: z.string().nullable(), matchedSeconds: z.number().int().nonnegative().nullable(), matchedLabel: z.string().nullable(), keyPoints: z.array(z.string()).nullable(),
}))})

const LESSON_CONTEXT_QUERY = `*[_type == "lesson" && (slug.current == $slug || _id == $id)][0]{_id, title, slug, poster, durationSeconds, keyPoints, "course": *[_type == "course" && references(^._id)][0]{title, modules[]{title, lessons[]->{_id, title, slug}}}}`

const SYSTEM_PROMPT = `You are Vertex's grounded learning search agent. Help learners find real courses and lessons using Sanity Context tools.

Return only valid JSON matching this shape: {"results":[...]}.
Use kind "video" for a lesson video moment and kind "lesson" for a lesson topic match. Never return a video document by itself. Every result must be backed by data returned by a tool, with a real lessonSlug and numeric timestamp when applicable.

Search both lesson topics (title and plain text notes) and video moments. Match chapters first; only use a transcript chunk when no chapter matches. Prefer exact title/topic matches over broad matches. Return all relevant results, ranked best first. If nothing matches, return {"results":[]}.
Never invent names, descriptions, counts, URLs, timestamps, or lesson slugs. Do not return prose, markdown, or whole transcript/chunks arrays.`

let initialContextPromise: Promise<string> | undefined

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function getInitialContext(url: string, token: string) {
  if (!initialContextPromise) {
    const contextUrl = new URL(url)
    contextUrl.pathname = `${contextUrl.pathname.replace(/\/$/, '')}/initial-context`
    initialContextPromise = fetch(contextUrl, {headers: {Authorization: `Bearer ${token}`}}).then(async (response) => {
      if (!response.ok) throw new Error(`Sanity Context initial-context failed (${response.status})`)
      return response.text()
    })
  }
  return initialContextPromise
}

export async function searchVertex(query: string): Promise<SearchResult[]> {
  const mcpUrl = requiredEnv('SANITY_CONTEXT_MCP_URL')
  const token = process.env.SANITY_CONTEXT_TOKEN || requiredEnv('SANITY_API_READ_TOKEN')
  const initialContext = await getInitialContext(mcpUrl, token)
  const mcp = await createMCPClient({transport: {type: 'http', url: mcpUrl, headers: {Authorization: `Bearer ${token}`}}})

  try {
    const allTools = await mcp.tools()
    const tools = Object.fromEntries(Object.entries(allTools).filter(([name]) => name !== 'initial_context'))
    const response = await generateText({
      model: openai(process.env.OPENAI_SEARCH_MODEL || 'gpt-4.1-mini'),
      system: `${SYSTEM_PROMPT}\n\nSchema context:\n${initialContext}`,
      prompt: `Search query: ${query}`,
      tools,
      stopWhen: stepCountIs(6),
      maxRetries: 1,
      output: Output.object({schema: modelResultSchema, name: 'vertex_search_results'}),
    })
    const normalized = await Promise.all(response.output.results.map(async (item) => {
      const base = Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as Record<string, unknown>
      const context = await serverClient.fetch(LESSON_CONTEXT_QUERY, {slug: item.lessonSlug || '', id: item.id || ''}) as {title?: string; slug?: {current?: string}; poster?: unknown; durationSeconds?: number; keyPoints?: string[]; course?: {title?: string; modules?: {title?: string; lessons?: {_id?: string; title?: string; slug?: {current?: string}}[]}[]}}
      const moduleMatch = context.course?.modules?.find((candidate) => candidate.lessons?.some((lesson) => lesson._id === item.id || lesson.slug?.current === item.lessonSlug))
      const lessonIndex = moduleMatch?.lessons?.findIndex((lesson) => lesson._id === item.id || lesson.slug?.current === item.lessonSlug) ?? -1
      const moduleIndex = context.course?.modules?.findIndex((candidate) => candidate === moduleMatch) ?? -1
      return {...base, id: base.id || context.slug?.current, course: base.course || context.course?.title, module: base.module || moduleMatch?.title, lessonNumber: base.lessonNumber || (moduleIndex >= 0 && lessonIndex >= 0 ? `Lesson ${moduleIndex + 1}.${lessonIndex + 1}` : 'Lesson'), lessonTitle: base.lessonTitle || context.title, lessonSlug: base.lessonSlug || context.slug?.current, description: base.description || (context.title ? `Learn ${context.title.toLowerCase()} in ${context.course?.title || 'this course'}.` : undefined), durationSeconds: base.durationSeconds || context.durationSeconds, keyPoints: base.keyPoints || context.keyPoints}
    }))
    return resultSchema.parse({results: normalized}).results
  } finally {
    await mcp.close()
  }
}
