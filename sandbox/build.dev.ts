import "dotenv/config"
import { Template } from "@e2b-dev/template";
import { template } from "./template";

async function build() {
  await Template.build(template, {
    alias: "nextjs-developer-new-build-mlejva",
    cpuCount: 2,
    memoryMB: 4096,
    onBuildLogs: (logEntry) => console.log(logEntry.toString()),
  })
}

build().catch(console.error)
