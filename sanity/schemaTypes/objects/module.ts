import {defineArrayMember, defineField, defineType} from 'sanity'

export const moduleSchema = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3, validation: (Rule) => Rule.max(400)}),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      validation: (Rule) => Rule.min(1),
    }),
  ],
})
