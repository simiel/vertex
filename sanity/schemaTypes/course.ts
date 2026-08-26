import {DocumentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 4, validation: (Rule) => Rule.required().max(500)}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'level', title: 'Level', type: 'string', options: {list: [{title: 'Beginner', value: 'beginner'}, {title: 'Intermediate', value: 'intermediate'}, {title: 'Advanced', value: 'advanced'}], layout: 'radio'}, validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'price', title: 'Price', type: 'number', validation: (Rule) => Rule.required().min(0)}),
    defineField({name: 'popular', title: 'Popular', type: 'boolean', initialValue: false}),
    defineField({name: 'studentCount', title: 'Student count', type: 'number', validation: (Rule) => Rule.required().integer().min(0)}),
    defineField({
      name: 'learningOutcomes', title: 'What you’ll learn', type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'icon', title: 'Icon identifier', type: 'string', validation: (Rule) => Rule.required().max(40)}),
        defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(120)}),
        defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.required().max(300)}),
      ]})],
      validation: (Rule) => Rule.min(1).max(8),
    }),
    defineField({name: 'instructor', title: 'Instructor', type: 'reference', to: [{type: 'instructor'}], validation: (Rule) => Rule.required()}),
    defineField({name: 'category', title: 'Category', type: 'reference', to: [{type: 'category'}], validation: (Rule) => Rule.required()}),
    defineField({name: 'modules', title: 'Modules', type: 'array', of: [defineArrayMember({type: 'module'})], validation: (Rule) => Rule.min(1)}),
  ],
  preview: {select: {title: 'title', media: 'coverImage', subtitle: 'level'}},
})
