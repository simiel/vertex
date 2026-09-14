import {defineArrayMember, defineField, defineType} from 'sanity'

export const video = defineType({name: 'video', title: 'Video transcript (internal)', type: 'document', fields: [
  defineField({name: 'id', title: 'Video ID', type: 'string', validation: Rule => Rule.required()}),
  defineField({name: 'url', title: 'Video URL', type: 'url', validation: Rule => Rule.required()}),
  defineField({name: 'chapters', title: 'Chapters', type: 'array', of: [defineArrayMember({type: 'object', fields: [defineField({name: 'startSeconds', type: 'number', validation: Rule => Rule.required().integer().min(0)}), defineField({name: 'label', type: 'string', validation: Rule => Rule.required()})]})]}),
  defineField({name: 'chunks', title: 'Transcript chunks', type: 'array', of: [defineArrayMember({type: 'object', fields: [defineField({name: 'startSeconds', type: 'number', validation: Rule => Rule.required().integer().min(0)}), defineField({name: 'text', type: 'text', validation: Rule => Rule.required()})]})]}),
]})
