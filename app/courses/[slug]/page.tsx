import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Show, UserButton } from '@clerk/nextjs'
import { CourseContent, BookmarkButton } from './course-content'
import { getCourseBySlug } from '@/sanity/data'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImageSource } from '@sanity/image-url'

type Lesson = { _id: string; title: string; slug: { current: string }; duration?: number; freePreview?: boolean }
type Course = {
  title: string; summary: string; popular?: boolean; level: string; studentCount: number
  coverImage?: SanityImageSource & { alt?: string }
  learningOutcomes: { _key: string; icon: string; title: string; description: string }[]
  modules: { _key: string; title: string; summary?: string; lessons: Lesson[] }[]
}

function Icon({ name }: { name: 'bell' | 'level' | 'clock' | 'file' | 'users' | 'arrow' }) {
  const paths = { bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>, level: <><path d="M4 20v-4M9 20v-8M14 20v-12M19 20V5" /></>, clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>, file: <><path d="M6 3.5h8l4 4V20.5H6zM14 3.5v4h4" /></>, users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 5.5a3 3 0 0 1 0 5.5M18 15c2.1.5 3 2.1 3 5" /></>, arrow: <><path d="M3 12h17M14 6l6 6-6 6" /></> }
  return <svg className="course-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatDuration(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.round((seconds % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m` }

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseBySlug(slug) as Course | null
  if (!course) notFound()
  const lessons = course.modules.flatMap((module) => module.lessons)
  const totalSeconds = lessons.reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0)
  const cover = course.coverImage ? urlFor(course.coverImage).width(900).height(900).fit('crop').url() : null
  return <main className="course-page"><div className="course-canvas">
    <header className="course-header"><Link className="course-brand" href="/"><span className="course-logo">▼</span><span>Vertex</span></Link><nav><Link href="/">Courses</Link><Link href="/my-learning">My Learning</Link></nav><div className="course-actions"><button aria-label="Notifications"><Icon name="bell" /></button><Show when="signed-in"><UserButton /></Show></div></header>
    <div className="course-inner">
      <div className="course-breadcrumb"><Link href="/">All Courses</Link><span>›</span><span>{course.title}</span></div>
      <section className="course-hero"><div className="course-cover">{cover ? <Image src={cover} alt={course.coverImage?.alt ?? course.title} width={900} height={900} unoptimized /> : <span>N</span>}</div><div className="course-intro">{course.popular && <span className="popular-badge">POPULAR</span>}<h1>{course.title}</h1><p>{course.summary}</p><div className="course-meta"><span><Icon name="level" />{course.level[0].toUpperCase() + course.level.slice(1)}</span><span><Icon name="clock" />{formatDuration(totalSeconds)}</span><span><Icon name="file" />{course.modules.length} modules</span><span><Icon name="users" />{(course.studentCount / 1000).toFixed(1)}k students</span></div><div className="course-ctas"><Link className="continue-button" href={lessons[0] ? `/lessons/${lessons[0].slug.current}` : '#'}>Continue Learning <Icon name="arrow" /></Link><BookmarkButton /></div></div></section>
      <section className="outcomes-panel"><h2>What you’ll learn</h2><div className="outcomes-grid">{course.learningOutcomes.map((outcome) => <article key={outcome._key}><span className="outcome-icon">{outcome.icon === 'layers' ? '▱' : outcome.icon === 'gauge' ? '◔' : outcome.icon === 'rocket' ? '⌁' : '◉'}</span><div><h3>{outcome.title}</h3><p>{outcome.description}</p></div></article>)}</div></section>
      <section className="content-section"><div className="content-heading"><h2>Course Content</h2><span>{course.modules.length} modules <b>•</b> {formatDuration(totalSeconds)}</span></div><CourseContent modules={course.modules} /></section>
      <section className="progress-panel"><div><small>Your Progress</small><strong>Ready to begin</strong></div><div className="progress-track"><span /></div><Link className="continue-button" href={lessons[0] ? `/lessons/${lessons[0].slug.current}` : '#'}>Start Learning <Icon name="arrow" /></Link></section>
    </div>
  </div></main>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const course = await getCourseBySlug((await params).slug); return { title: course ? `${course.title} — Vertex` : 'Course — Vertex', description: course?.summary } }
