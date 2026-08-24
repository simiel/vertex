import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const courses = [
  { mark: "N", markClass: "next", title: "Next.js for Production", description: "Build scalable, high-performance web applications with Next.js.", level: "Intermediate", duration: "18h 24m", modules: "12 modules" },
  { mark: "", markClass: "docker", title: "Docker Essentials", description: "Containerize applications and streamline your development workflow.", level: "Beginner", duration: "10h 12m", modules: "8 modules" },
  { mark: "TS", markClass: "typescript", title: "TypeScript Deep Dive", description: "Go beyond the basics and write safer, more expressive code.", level: "Intermediate", duration: "14h 36m", modules: "10 modules" },
];

function Icon({ name }: { name: "search" | "bell" | "arrow" | "level" | "clock" | "file" | "star" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7.5" /><path d="m17 17 5 5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    arrow: <><path d="M3 12h17M14 6l6 6-6 6" /></>,
    level: <><path d="M4 20v-4M9 20v-8M14 20v-12M19 20V5" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M6 3.5h8l4 4V20.5H6zM14 3.5v4h4" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9z" />,
  };
  return <svg className={`home-icon icon-${name}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function CourseCard({ course }: { course: typeof courses[number] }) {
  return <a className="home-course-card" href="#courses">
    <div className={`course-mark ${course.markClass}`} aria-label={`${course.title} logo`}>{course.markClass === "docker" ? <span className="docker-whale">♟</span> : course.mark}</div>
    <h3>{course.title}</h3>
    <p>{course.description}</p>
    <div className="course-meta">
      <span><Icon name="level" />{course.level}</span>
      <span><Icon name="clock" />{course.duration}</span>
      <span><Icon name="file" />{course.modules}</span>
    </div>
  </a>;
}

export default function Home() {
  return <main className="home-page">
    <div className="home-canvas">
      <header className="home-header">
        <Link className="home-brand" href="/" aria-label="Vertex home"><span className="home-logo">▼</span><span>Vertex</span></Link>
        <nav className="home-nav" aria-label="Primary navigation"><a href="#courses">Courses</a><a href="#learning">My Learning</a></nav>
        <div className="home-actions"><button aria-label="Notifications"><Icon name="bell" /></button><Show when="signed-out"><div className="home-auth"><SignInButton mode="modal"><button>Sign in</button></SignInButton><SignUpButton mode="modal"><button className="home-signup">Sign up</button></SignUpButton></div></Show><Show when="signed-in"><UserButton /></Show></div>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-label">INTELLIGENT LEARNING</div>
        <h1 id="home-title">Search your learning<br />in plain English.</h1>
        <p>Vertex understands what you want to learn and<br className="desktop-only" /> finds the exact lessons across all your courses.</p>
        <a className="hero-cta" href="#courses">Explore Courses <Icon name="arrow" /></a>
        <label className="home-search"><Icon name="search" /><input aria-label="Search your learning" placeholder="Ask anything about your learning..." /><kbd>⌘ K</kbd></label>
      </section>

      <section id="courses" className="home-courses" aria-labelledby="courses-title">
        <div className="section-heading"><h2 id="courses-title">All Courses</h2><a href="#courses">View all courses <Icon name="arrow" /></a></div>
        <div className="course-grid">{courses.map(course => <CourseCard key={course.title} course={course} />)}</div>
        <div id="learning" className="home-note"><span className="note-rule" /><Icon name="star" /><span>New courses and lessons added every week.</span><span className="note-rule" /></div>
        <div className="home-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </section>
    </div>
  </main>;
}
