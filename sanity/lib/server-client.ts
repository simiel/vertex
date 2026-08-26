import 'server-only'

import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '../env'

const token = process.env.SANITY_API_READ_TOKEN

if (!token) {
  throw new Error('Missing SANITY_API_READ_TOKEN for server-side Sanity reads')
}

export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: true,
  perspective: 'published',
})
