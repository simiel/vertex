import {type SchemaTypeDefinition} from 'sanity'
import {category} from './category'
import {course} from './course'
import {instructor} from './instructor'
import {lesson} from './lesson'
import {moduleSchema} from './objects/module'
import {video} from './video'
import {agentContext} from './agentContext'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [course, moduleSchema, lesson, instructor, category, video, agentContext],
}
