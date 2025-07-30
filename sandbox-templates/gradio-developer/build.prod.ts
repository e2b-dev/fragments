import 'dotenv/config'
import { name as templateAlias } from './package.json'
import { template } from './template'
import { Template } from '@e2b-dev/template'

Template.build(template, {
  alias: templateAlias,
  cpuCount: 2,
  memoryMB: 2048,
  onBuildLogs: (logEntry) => console.log(logEntry.toString()),
})
