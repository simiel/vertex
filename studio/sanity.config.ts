import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {apiVersion, dataset, projectId} from './env'
import {schema} from '../sanity/schemaTypes'
import {structure} from '../sanity/structure'

export default defineConfig({
  name: 'vertex-studio',
  title: 'Vertex Studio',
  projectId,
  dataset,
  basePath: '/',
  schema,
  plugins: [structureTool({structure}), visionTool({defaultApiVersion: apiVersion})],
})
