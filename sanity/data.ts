import {cache} from 'react'
import {serverClient} from './lib/server-client'
import {
  CATEGORIES_QUERY,
  COURSE_BY_SLUG_QUERY,
  COURSES_BY_CATEGORY_QUERY,
  COURSES_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  LESSON_BY_SLUG_QUERY,
} from './queries'

export const getCourses = cache(() => serverClient.fetch(COURSES_QUERY, {}, {next: {tags: ['course', 'lesson', 'instructor', 'category']}}))
export const getCourseBySlug = cache((slug: string) => serverClient.fetch(COURSE_BY_SLUG_QUERY, {slug}, {next: {tags: [`course:${slug}`, 'lesson', 'instructor', 'category']}}))
export const getLessonBySlug = cache((slug: string) => serverClient.fetch(LESSON_BY_SLUG_QUERY, {slug}, {next: {tags: [`lesson:${slug}`, 'course']}}))
export const getInstructorBySlug = cache((slug: string) => serverClient.fetch(INSTRUCTOR_BY_SLUG_QUERY, {slug}, {next: {tags: [`instructor:${slug}`, 'course']}}))
export const getCategories = cache(() => serverClient.fetch(CATEGORIES_QUERY, {}, {next: {tags: ['category', 'course']}}))
export const getCoursesByCategory = cache((categoryId: string) => serverClient.fetch(COURSES_BY_CATEGORY_QUERY, {categoryId}, {next: {tags: ['course', 'category']}}))
