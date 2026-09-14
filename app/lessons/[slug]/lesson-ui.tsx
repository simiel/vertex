'use client'

import { useState } from 'react'
import {captureAnalytics} from '@/lib/analytics/events'

export function LessonTabs({ children, notes, lessonSlug, courseSlug }: { children: React.ReactNode; notes: React.ReactNode; lessonSlug: string; courseSlug: string }) {
  const [tab, setTab] = useState<'content' | 'notes'>('content')
  return <>
    <div className="lesson-tabs" role="tablist"><button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')} role="tab" aria-selected={tab === 'content'}>Lesson Content</button><button className={tab === 'notes' ? 'active' : ''} onClick={() => { setTab('notes'); captureAnalytics({name: 'lesson_notes_opened', properties: {lesson_slug: lessonSlug, course_slug: courseSlug}}) }} role="tab" aria-selected={tab === 'notes'}>Notes</button></div>
    <div className="lesson-tab-panel">{tab === 'content' ? children : notes}</div>
  </>
}

export function LessonBookmark() {
  const [saved, setSaved] = useState(false)
  return <button className={`lesson-bookmark ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove bookmark' : 'Bookmark lesson'} onClick={() => setSaved(!saved)}>♡</button>
}
