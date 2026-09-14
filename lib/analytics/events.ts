'use client'

import posthog from 'posthog-js'

const configured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST)

export type AnalyticsEvent =
  | {name: 'catalog_viewed'; properties: {course_count: number}}
  | {name: 'course_viewed'; properties: {course_slug: string; lesson_count: number; module_count: number}}
  | {name: 'lesson_viewed'; properties: {lesson_slug: string; course_slug: string; module_number: number; lesson_number: number; duration_seconds: number; has_resume_position: boolean}}
  | {name: 'resume_used'; properties: {lesson_slug: string; course_slug: string; resume_seconds: number; duration_seconds: number; resume_source: string}}
  | {name: 'lesson_completed'; properties: {lesson_slug: string; course_slug: string; duration_seconds: number; completion_source: string}}
  | {name: 'search_result_opened'; properties: {result_type: 'video' | 'lesson'; result_position: number; lesson_slug: string; course_slug: string; matched_seconds?: number}}
  | {name: 'video_played'; properties: {lesson_slug: string; course_slug: string; provider: string; start_seconds: number; resume_used: boolean}}
  | {name: 'video_watch_depth_reached'; properties: {lesson_slug: string; course_slug: string; provider: string; depth_percent: number; watched_seconds: number; duration_seconds: number}}
  | {name: 'course_learning_started'; properties: {course_slug: string; entry_point: string}}
  | {name: 'course_module_expanded'; properties: {course_slug: string; module_position: number}}
  | {name: 'course_bookmarked'; properties: {course_slug: string; is_bookmarked: boolean}}
  | {name: 'lesson_notes_opened'; properties: {lesson_slug: string; course_slug: string}}
  | {name: 'lesson_resource_opened'; properties: {lesson_slug: string; course_slug: string; resource_type: string}}
  | {name: 'lesson_navigated'; properties: {course_slug: string; direction: 'previous' | 'next'; from_lesson_slug: string; to_lesson_slug: string}}

export function captureAnalytics(event: AnalyticsEvent) {
  if (!configured) return
  posthog.capture(event.name, event.properties)
}
