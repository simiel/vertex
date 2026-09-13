'use client'

import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import type {FormEvent} from 'react'
import type {SearchResult} from '@/lib/search/search-types'

function formatDuration(seconds: number) { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${String(s).padStart(2, '0')}` }
function ResultCard({result}: {result: SearchResult}) {
  const href = `/lessons/${result.lessonSlug}${result.kind === 'video' ? `?start=${result.matchedSeconds}` : ''}`
  return <Link className="search-result-card" href={href}>
    <div className={`search-result-thumb ${result.kind === 'video' ? 'is-video' : ''}`}>{result.kind === 'video' && result.thumbnailUrl ? <img src={result.thumbnailUrl} alt="" /> : <span>{result.courseIcon || result.course.slice(0, 1)}</span>}{result.kind === 'video' && <b>▶ {formatDuration(result.matchedSeconds)}</b>}</div>
    <div className="search-result-copy"><small>{result.course} · {result.module}</small><h2>{result.lessonNumber} {result.lessonTitle}</h2><p>{result.description}</p>{result.kind === 'lesson' && result.keyPoints.length > 0 && <div className="search-points">{result.keyPoints.slice(0, 3).map(point => <span key={point}>✓ {point}</span>)}</div>}{result.kind === 'video' && <em>Watch from {result.matchedLabel || formatDuration(result.matchedSeconds)} ↗</em>}</div>
  </Link>
}

export function SearchResults({initialQuery}: {initialQuery: string}) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [sort, setSort] = useState('relevant')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  useEffect(() => { if (initialQuery.trim().length >= 2) void runSearch(initialQuery) }, [initialQuery])
  async function runSearch(value: string) { setStatus('loading'); try { const response = await fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: value})}); if (!response.ok) throw new Error(); const data = await response.json() as {results: SearchResult[]}; setResults(data.results); setStatus('ready') } catch { setStatus('error') } }
  const ordered = useMemo(() => sort === 'relevant' ? results : [...results].sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle)), [results, sort])
  const submit = (event: FormEvent) => { event.preventDefault(); const value = query.trim(); if (value.length >= 2) { window.history.replaceState(null, '', `/search?q=${encodeURIComponent(value)}`); void runSearch(value) } }
  return <div className="search-shell"><header className="search-header"><Link className="search-brand" href="/"><span>▼</span>Vertex</Link><Link className="search-back" href="/">← All courses</Link></header><main className="search-main"><div className="search-heading"><span className="hero-label">INTELLIGENT LEARNING</span><h1>Find what you want to learn.</h1><p>Search across every course and jump straight to the right lesson.</p></div><form className="search-form" onSubmit={submit}><span>⌕</span><input aria-label="Search your learning" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ask anything about your learning..." /><button type="submit">Search</button></form>{status === 'loading' && <p className="search-status">Searching your courses…</p>}{status === 'error' && <p className="search-status search-error">Search is temporarily unavailable. Try again.</p>}{status === 'ready' && <>{<div className="search-toolbar"><p>Found <strong>{results.length}</strong> results across <strong>{new Set(results.map(result => result.course)).size}</strong> courses</p><label>Sort <select value={sort} onChange={event => setSort(event.target.value)}><option value="relevant">Most relevant</option><option value="title">Lesson title</option></select></label></div>}{ordered.length ? <div className="search-results">{ordered.map(result => <ResultCard key={result.id} result={result} />)}</div> : <div className="search-empty"><h2>No lessons found</h2><p>Try a broader topic or explore the full course catalog.</p><Link href="/">View all courses →</Link></div>}</>}</main></div>
}
