'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import posthog from 'posthog-js'
import { useEffect, useRef, useState } from 'react'
import {captureAnalytics} from '@/lib/analytics/events'

type Lesson = { _id: string; title: string; duration?: number; freePreview?: boolean }
type Module = { _key: string; title: string; summary?: string; lessons: Lesson[] }

const isPostHogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST)

export function PostHogIdentity() {
  const { isLoaded, user } = useUser()
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isPostHogConfigured) return

    if (user) {
      if (identifiedUserId.current !== user.id) {
        if (identifiedUserId.current) posthog.reset()

        posthog.identify(user.id)
        identifiedUserId.current = user.id
      }
      return
    }

    if (identifiedUserId.current) {
      posthog.reset()
      identifiedUserId.current = null
    }
  }, [isLoaded, user])

  return null
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function CourseContent({ modules, courseSlug }: { modules: Module[]; courseSlug: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const visibleModules = showAll ? modules : modules.slice(0, 6)

  return <>
    <div className="course-content-list">
      {visibleModules.map((module, index) => {
        const seconds = module.lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0)
        const isOpen = expanded === module._key
        return <div className="module-row" key={module._key}>
          <button className="module-summary" onClick={() => {
            setExpanded(isOpen ? null : module._key)
            if (!isOpen && isPostHogConfigured) {
              captureAnalytics({name: 'course_module_expanded', properties: {course_slug: courseSlug, module_position: index + 1}})
            }
          }} aria-expanded={isOpen}>
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

export function CourseLearningLink({ href, courseSlug, children }: { href: string; courseSlug: string; children: React.ReactNode }) {
  const handleClick = () => {
    if (href === '#' || !isPostHogConfigured) return
    captureAnalytics({name: 'course_learning_started', properties: {course_slug: courseSlug, entry_point: 'course_page'}})
  }

  return <Link className="continue-button" href={href} onClick={handleClick}>{children}</Link>
}

export function BookmarkButton({ courseSlug }: { courseSlug: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const handleBookmark = () => {
    const isBookmarked = !bookmarked
    setBookmarked(isBookmarked)
    if (isPostHogConfigured) {
      captureAnalytics({name: 'course_bookmarked', properties: {course_slug: courseSlug, is_bookmarked: isBookmarked}})
    }
  }

  return <button className={`bookmark-button ${bookmarked ? 'is-bookmarked' : ''}`} onClick={handleBookmark}><span aria-hidden="true">♡</span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
}
