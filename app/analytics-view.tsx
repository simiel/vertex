'use client'

import {useEffect, useRef} from 'react'
import {captureAnalytics, type AnalyticsEvent} from '@/lib/analytics/events'

export function AnalyticsView({event}: {event: AnalyticsEvent}) {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    captureAnalytics(event)
  }, [event])
  return null
}
