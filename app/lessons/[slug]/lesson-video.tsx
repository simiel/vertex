'use client'

import {useEffect, useRef} from 'react'
import {captureAnalytics} from '@/lib/analytics/events'

type YouTubeStateEvent = {data: number; target: {getCurrentTime: () => number; getDuration: () => number}}
type YouTubePlayer = {destroy?: () => void}
type YouTubeApi = {Player: new (element: HTMLIFrameElement, options: {events: {onReady: () => void; onStateChange: (event: YouTubeStateEvent) => void}}) => YouTubePlayer}
declare global {interface Window {YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void}}

const PLAYING = 1
const DEPTHS = [25, 50, 75, 90, 100]

export function LessonVideo({videoId, lessonSlug, courseSlug, durationSeconds, startSeconds}: {videoId: string; lessonSlug: string; courseSlug: string; durationSeconds: number; startSeconds: number}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const played = useRef(false)
  const sentDepths = useRef(new Set<number>())

  useEffect(() => {
    let player: {destroy?: () => void} | undefined
    let disposed = false
    const setup = () => {
      if (disposed || !window.YT || !iframeRef.current) return
      player = new window.YT.Player(iframeRef.current, {events: {
        onReady: () => undefined,
        onStateChange: (event) => {
          if (event.data !== PLAYING) return
          const current = Math.max(0, Math.floor(event.target.getCurrentTime()))
          if (!played.current) {
            played.current = true
            captureAnalytics({name: 'video_played', properties: {lesson_slug: lessonSlug, course_slug: courseSlug, provider: 'youtube', start_seconds: current, resume_used: false}})
          }
          const videoDuration = Math.max(1, Math.floor(event.target.getDuration() || durationSeconds))
          const percent = Math.min(100, Math.floor((current / videoDuration) * 100))
          for (const depth of DEPTHS) {
            if (percent >= depth && !sentDepths.current.has(depth)) {
              sentDepths.current.add(depth)
              captureAnalytics({name: 'video_watch_depth_reached', properties: {lesson_slug: lessonSlug, course_slug: courseSlug, provider: 'youtube', depth_percent: depth, watched_seconds: current, duration_seconds: videoDuration}})
            }
          }
        },
      }}) as {destroy?: () => void}
    }
    if (window.YT) setup()
    else {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { previous?.(); setup() }
      if (!document.querySelector('script[data-vertex-youtube-api]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.dataset.vertexYoutubeApi = 'true'
        document.head.appendChild(script)
      }
    }
    return () => { disposed = true; player?.destroy?.() }
  }, [courseSlug, durationSeconds, lessonSlug])

  return <iframe ref={iframeRef} src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&rel=0${startSeconds ? `&start=${startSeconds}` : ''}`} title="Lesson video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
}
