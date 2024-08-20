import { z } from 'zod'
import { outputSchema as schema } from '@/lib/schema'
import { Sandbox, CodeInterpreter } from "@e2b/code-interpreter";

const sandboxTimeout = 1 * 60 * 1000 // 1 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const { config, userID, apiKey }: { config: z.infer<typeof schema>, userID: string, apiKey: string } = await req.json()
  console.log('config', config)
  console.log('userID', userID)
  console.log('apiKey', apiKey)

  let sbx: Sandbox | CodeInterpreter | undefined = undefined

  // Create a interpreter or a sandbox
  if (config.template === 'code-interpreter-multilang') {
    sbx = await CodeInterpreter.create({ metadata: { template: config.template, userID: userID }, timeoutMs: sandboxTimeout })
    console.log('Created code interpreter', sbx.sandboxID)
  } else {
    sbx = await Sandbox.create(config.template, { metadata: { template: config.template, userID: userID }, timeoutMs: sandboxTimeout })
    console.log('Created sandbox', sbx.sandboxID)
  }

  // Install packages
  if (config.has_additional_dependencies) {
    if (sbx instanceof CodeInterpreter) {
      await sbx.notebook.execCell(config.install_dependencies_command)
      console.log(`Installed dependencies: ${config.additional_dependencies.join(', ')} in code interpreter ${sbx.sandboxID}`)
    } else if (sbx instanceof Sandbox) {
      await sbx.commands.run(config.install_dependencies_command)
      console.log(`Installed dependencies: ${config.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxID}`)
    }
  }

  // Copy code to fs
  if (config.code && Array.isArray(config.code)) {
    config.code.forEach(async (file) => {
      await sbx.files.write(file.file_path, file.file_content)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxID}`)
    })
  }

  // Execute code or return a URL to the running sandbox
  if (config.template === 'code-interpreter-multilang') {
    const result = await (sbx as CodeInterpreter).notebook.execCell(config.code[0].file_content || '')
    await (sbx as CodeInterpreter).close()
    return new Response(JSON.stringify({
      template: config.template,
      result
    }))
  } else {
    return new Response(JSON.stringify({
      template: config.template,
      url: `https://${sbx?.getHost(config.port || 80)}`
    }))
  }
}
