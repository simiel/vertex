'use client'

import { useState } from 'react'

type Lesson = { _id: string; title: string; duration?: number; freePreview?: boolean }
type Module = { _key: string; title: string; summary?: string; lessons: Lesson[] }

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function CourseContent({ modules }: { modules: Module[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const visibleModules = showAll ? modules : modules.slice(0, 6)

  return <>
    <div className="course-content-list">
      {visibleModules.map((module, index) => {
        const seconds = module.lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0)
        const isOpen = expanded === module._key
        return <div className="module-row" key={module._key}>
          <button className="module-summary" onClick={() => setExpanded(isOpen ? null : module._key)} aria-expanded={isOpen}>
            <span className="module-number">{index + 1}</span>
            <span className="module-copy"><strong>{module.title}</strong><small>{module.summary}</small></span>
            <span className="module-duration">{formatDuration(seconds)}</span>
            <span className={`chevron ${isOpen ? 'is-open' : ''}`} aria-hidden="true">⌄</span>
          </button>
          {isOpen && <div className="module-lessons">{module.lessons.map((lesson, lessonIndex) => <div className="module-lesson" key={lesson._id}><span>{index + 1}.{lessonIndex + 1}</span><span>{lesson.title}</span>{lesson.freePreview && <em>Preview</em>}</div>)}</div>}
        </div>
      })}
    </div>
    {modules.length > 6 && <button className="show-modules" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer modules' : `Show all ${modules.length} modules`} <span className={`chevron ${showAll ? 'is-open' : ''}`}>⌄</span></button>}
  </>
}

export function BookmarkButton() {
  const [bookmarked, setBookmarked] = useState(false)
  return <button className={`bookmark-button ${bookmarked ? 'is-bookmarked' : ''}`} onClick={() => setBookmarked(!bookmarked)}><span aria-hidden="true">♡</span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
}
