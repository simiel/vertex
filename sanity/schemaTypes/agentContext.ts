import {defineField, defineType} from 'sanity'

export const agentContext = defineType({name: 'sanity.agentContext', title: 'Search agent context', type: 'document', fields: [
  defineField({name: 'slug', title: 'Slug', type: 'slug', validation: Rule => Rule.required()}),
  defineField({name: 'instructions', title: 'Instructions', type: 'text', rows: 12}),
  defineField({name: 'groqFilter', title: 'Content filter', type: 'string', validation: Rule => Rule.required()}),
]})
