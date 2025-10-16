import { name as templateAlias } from './package.json'
import { template } from './template'
import 'dotenv/config'
import { defaultBuildLogger, Template } from 'e2b'

Template.build(template, {
  alias: `${templateAlias}-dev`,
  cpuCount: 2,
  memoryMB: 2048,
  onBuildLogs: defaultBuildLogger(),
})
