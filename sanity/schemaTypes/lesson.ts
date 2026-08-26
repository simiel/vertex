import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(160)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'videoUrl', title: 'Video URL', type: 'url', validation: (Rule) => Rule.required().uri({scheme: ['https']})}),
    defineField({name: 'poster', title: 'Poster / thumbnail', type: 'image', options: {hotspot: true}}),
    defineField({name: 'durationSeconds', title: 'Duration (seconds)', type: 'number', validation: (Rule) => Rule.required().integer().min(1)}),
    defineField({name: 'freePreview', title: 'Free preview', type: 'boolean', initialValue: false}),
    defineField({name: 'studentCount', title: 'Student count', type: 'number', validation: (Rule) => Rule.required().integer().min(0)}),
    defineField({name: 'notes', title: 'Notes', type: 'array', of: [defineArrayMember({type: 'block'})]}),
    defineField({name: 'keyPoints', title: 'Key points', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (Rule) => Rule.max(8)}),
    defineField({name: 'proTip', title: 'Pro tip', type: 'text', rows: 4, validation: (Rule) => Rule.max(500)}),
    defineField({
      name: 'resources', title: 'Resources', type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'type', title: 'Type', type: 'string', options: {list: ['article', 'book', 'download', 'link'], layout: 'radio'}, validation: (Rule) => Rule.required()}),
        defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(160)}),
        defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.max(300)}),
        defineField({name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']})}),
      ]})],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'videoUrl', media: 'poster'}},
})
