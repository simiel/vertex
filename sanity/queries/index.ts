import {defineQuery} from 'groq'

export const COURSES_QUERY = defineQuery(`
  *[_type == "course"] | order(title asc) {
    _id, _updatedAt, title, slug, summary, coverImage, level, price, popular, studentCount,
    learningOutcomes[]{_key, icon, title, description},
    instructor->{_id, name, slug, photo},
    category->{_id, title, slug},
    "moduleCount": count(modules),
    modules[]{_key, title, summary, lessons[]->{_id, title, slug, poster, durationSeconds, freePreview}}
  }
`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0] {
    _id, _updatedAt, title, slug, summary, coverImage, level, price, popular, studentCount,
    learningOutcomes[]{_key, icon, title, description},
    instructor->{_id, name, slug, photo, expertise, bio},
    category->{_id, title, slug},
    modules[]{_key, title, summary, lessons[]->{_id, title, slug, poster, durationSeconds, freePreview, studentCount}}
  }
`)

export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0] {
    _id, _updatedAt, title, slug, videoUrl, poster, durationSeconds, freePreview, studentCount,
    notes, keyPoints, proTip, resources[]{_key, type, title, description, url},
    "courses": *[_type == "course" && references(^._id)]{
      _id, title, slug, modules[]{_key, title, lessons[]->{_id}}
    }
  }
`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`
  *[_type == "instructor" && slug.current == $slug][0] {
    _id, name, slug, photo, expertise, bio,
    "courses": *[_type == "course" && references(^._id)]{_id, title, slug, coverImage, level, studentCount}
  }
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(title asc) {
    _id, title, slug, description,
    "courseCount": count(*[_type == "course" && references(^._id)])
  }
`)

export const COURSES_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "course" && category._ref == $categoryId] | order(title asc) {
    _id, title, slug, summary, coverImage, level, price, popular, studentCount,
    instructor->{_id, name, slug, photo}, category->{_id, title, slug}
  }
`)
