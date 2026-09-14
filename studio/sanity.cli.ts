import {defineCliConfig} from 'sanity/cli'
import {dataset, projectId} from './env'

export default defineCliConfig({api: {projectId, dataset}, deployment: {
    appId: 'nekthtx67gpyqc8cv35zxiz1',
  },})
