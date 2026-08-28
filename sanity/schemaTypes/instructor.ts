import {UserIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const instructor = defineType({
  name: 'instructor',
  title: 'Instructor',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required().max(120)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: (Rule) => Rule.required()}),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'expertise', title: 'Expertise', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (Rule) => Rule.min(1).max(12)}),
    defineField({name: 'bio', title: 'Bio', type: 'array', of: [defineArrayMember({type: 'block'})], validation: (Rule) => Rule.min(1)}),
  ],
  preview: {select: {title: 'name', media: 'photo'}},
})
