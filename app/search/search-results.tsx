'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useEffect, useMemo, useState} from 'react'
import type {FormEvent, ReactNode} from 'react'
import {Show, UserButton} from '@clerk/nextjs'
import type {SearchResult} from '@/lib/search/search-types'
import {captureAnalytics} from '@/lib/analytics/events'

function Icon({name, size = 20}: {name: 'search' | 'bell' | 'play' | 'arrow' | 'chevron' | 'file' | 'folder' | 'external' | 'check'; size?: number}) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7.5"/><path d="m17 17 5 5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
    play: <path d="m9 7 8 5-8 5V7Z" fill="currentColor" stroke="none"/>,
    arrow: <><path d="M3 12h17"/><path d="m14 6 6 6-6 6"/></>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    file: <><path d="M6 3.5h8l4 4V20.5H6zM14 3.5v4h4"/><path d="M9 12h6M9 15h6"/></>,
    folder: <path d="M3.5 7.5h6l2 2h9v9h-17z"/>,
    external: <><path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M18 13v5.5H5.5V6H11"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  }
  return <svg className="search-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatDuration(seconds: number) { const safeSeconds = Math.max(0, Math.floor(seconds)); return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}` }

function CourseMark({result}: {result: SearchResult}) { return <span className={`search-course-mark ${result.courseIcon ? 'has-icon' : ''}`} aria-hidden="true">{result.courseIcon || result.course.slice(0, 1)}</span> }

function VideoThumbnail({result}: {result: Extract<SearchResult, {kind: 'video'}>}) { return <div className="search-card-media search-video-media">{result.thumbnailUrl ? <Image src={result.thumbnailUrl} alt="" fill sizes="(max-width: 520px) 100vw, 275px" unoptimized/> : <span className="search-fallback-video"><b>V</b></span>}<span className="search-play"><Icon name="play" size={24}/></span><span className="search-duration">{formatDuration(result.durationSeconds)}</span></div> }

function LessonThumbnail({result}: {result: Extract<SearchResult, {kind: 'lesson'}>}) { return <div className="search-card-media search-lesson-media"><Icon name="file" size={24}/><ul>{result.keyPoints.slice(0, 3).map(point => <li key={point}>{point}</li>)}</ul><span className="search-complete"><Icon name="check" size={13}/></span></div> }

function ResultCard({result, position}: {result: SearchResult; position: number}) {
  const isVideo = result.kind === 'video'
  const href = `/lessons/${encodeURIComponent(result.lessonSlug)}${isVideo ? `?start=${Math.max(0, Math.floor(result.matchedSeconds))}` : ''}`
  return <article className="search-result-card" data-search-result="true" data-result-type={result.kind} data-result-position={position} data-lesson-slug={result.lessonSlug} data-course-slug={result.course} data-matched-seconds={isVideo ? Math.max(0, Math.floor(result.matchedSeconds)) : undefined}>{isVideo ? <VideoThumbnail result={result}/> : <LessonThumbnail result={result}/>}<div className="search-result-content"><div className="search-result-topline"><div className="search-course"><CourseMark result={result}/><span>{result.course}</span></div><span className={`search-result-type ${isVideo ? 'video' : 'lesson'}`}>{isVideo ? 'VIDEO' : 'LESSON'}</span></div><h2>{result.lessonTitle}</h2><p>{result.description}</p><div className="search-result-bottom"><div className="search-result-meta"><span><Icon name="file" size={16}/>{result.lessonNumber}</span><span className="meta-separator">·</span><span><Icon name="folder" size={16}/>{result.module}</span></div><Link href={href} className="search-result-action">{isVideo ? <><span className="action-play"><Icon name="play" size={16}/></span>Watch from {result.matchedLabel || formatDuration(result.matchedSeconds)}</> : <>View lesson <Icon name="external" size={16}/></>}<Icon name="arrow" size={17}/></Link></div></div></article>
}

export function SearchResults({initialQuery}: {initialQuery: string}) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [sort, setSort] = useState('relevant')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  useEffect(() => { if (initialQuery.trim().length >= 2) void runSearch(initialQuery) }, [initialQuery])
  useEffect(() => { const onClick = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!target.closest('a.search-result-action')) return; const card = target.closest<HTMLElement>('[data-search-result]'); if (!card) return; captureAnalytics({name: 'search_result_opened', properties: {result_type: card.dataset.resultType as 'video' | 'lesson', result_position: Number(card.dataset.resultPosition), lesson_slug: card.dataset.lessonSlug ?? '', course_slug: card.dataset.courseSlug ?? '', ...(card.dataset.resultType === 'video' ? {matched_seconds: Number(card.dataset.matchedSeconds)} : {})}}) }; document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick) }, [])
  async function runSearch(value: string) { setStatus('loading'); try { const response = await fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: value})}); if (!response.ok) throw new Error('search failed'); const data = await response.json() as {results: SearchResult[]}; setResults(data.results); setStatus('ready') } catch { setStatus('error') } }
  const ordered = useMemo(() => sort === 'relevant' ? results : [...results].sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle)), [results, sort])
  const courseCount = new Set(results.map(result => result.course)).size
  function submit(event: FormEvent) { event.preventDefault(); const value = query.trim(); if (value.length < 2) return; window.history.replaceState(null, '', `/search?q=${encodeURIComponent(value)}`); void runSearch(value) }
  return <div className="search-shell"><header className="search-header"><Link className="search-brand" href="/" aria-label="Vertex home"><span className="search-logo">▼</span><span>Vertex</span></Link><nav className="search-nav" aria-label="Primary navigation"><Link className="active" href="/">Courses</Link><Link href="/#learning">My Learning</Link></nav><div className="search-actions"><button className="search-notification" aria-label="Notifications"><Icon name="bell" size={22}/></button><Show when="signed-in"><UserButton/></Show></div></header><main className="search-main"><div className="search-heading"><span className="search-eyebrow">SEARCH RESULTS</span><h1>Results for <span>“{query || 'your learning'}”</span></h1><p>{status === 'ready' ? <>Found {results.length} results across {courseCount} courses</> : 'Search across every course and jump straight to the right lesson.'}</p></div><form className="search-form" onSubmit={submit}><Icon name="search" size={24}/><label className="sr-only" htmlFor="search-query">Search your learning</label><input id="search-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ask anything about your learning..."/><kbd>⌘ K</kbd></form>{status === 'idle' && <div className="search-empty search-empty-initial"><h2>What do you want to learn?</h2><p>Search by topic, technique, or lesson concept.</p></div>}{status === 'loading' && <div className="search-state"><span className="search-spinner"/>Searching your courses…</div>}{status === 'error' && <div className="search-empty"><h2>Search is temporarily unavailable</h2><p>Try again in a moment or browse the full course catalog.</p><Link href="/">Browse all courses <Icon name="arrow" size={17}/></Link></div>}{status === 'ready' && <><div className="search-toolbar"><strong>{results.length} results</strong><label htmlFor="search-sort" className="search-sort-label"><span className="sr-only">Sort results</span><select id="search-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="relevant">Most Relevant</option><option value="title">Lesson title</option></select><Icon name="chevron" size={17}/></label></div>{ordered.length ? <div className="search-results" aria-live="polite">{ordered.map((result, index) => <ResultCard key={result.id} result={result} position={index + 1}/>)}</div> : <div className="search-empty"><h2>Can’t find what you’re looking for?</h2><p>Try different keywords or browse our full course catalog.</p><Link href="/">Browse all courses <Icon name="arrow" size={17}/></Link></div>}<div className="search-callout"><span className="search-callout-icon"><Icon name="search" size={29}/></span><div><h2>Can’t find what you’re looking for?</h2><p>Try different keywords or browse our full course catalog.</p></div><Link href="/">Browse all courses <Icon name="arrow" size={17}/></Link></div></>}</main></div>
}
