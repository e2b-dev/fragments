import { ArtifactSchema } from '@/lib/schema'
import { Sandbox, CodeInterpreter, Execution, Result, ExecutionError } from "@e2b/code-interpreter";
import { TemplateId } from '@/lib/templates';

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export type ExecutionResult = {
  template: TemplateId
  stdout: string[]
  stderr: string[]
  runtimeError?: ExecutionError
  cellResults: Result[]
  url: string
}

export async function POST(req: Request) {
  const { artifact, userID, apiKey }: { artifact: ArtifactSchema, userID: string, apiKey: string } = await req.json()
  console.log('artifact', artifact)
  console.log('userID', userID)
  console.log('apiKey', apiKey)

  let sbx: Sandbox | CodeInterpreter | undefined = undefined

  // Create a interpreter or a sandbox
  if (artifact.template === 'code-interpreter-multilang') {
    sbx = await CodeInterpreter.create({ metadata: { template: artifact.template, userID: userID }, timeoutMs: sandboxTimeout })
    console.log('Created code interpreter', sbx.sandboxID)
  } else {
    sbx = await Sandbox.create(artifact.template, { metadata: { template: artifact.template, userID: userID }, timeoutMs: sandboxTimeout })
    console.log('Created sandbox', sbx.sandboxID)
  }

  // Install packages
  if (artifact.has_additional_dependencies) {
    if (sbx instanceof CodeInterpreter) {
      await sbx.notebook.execCell(artifact.install_dependencies_command)
      console.log(`Installed dependencies: ${artifact.additional_dependencies.join(', ')} in code interpreter ${sbx.sandboxID}`)
    } else if (sbx instanceof Sandbox) {
      await sbx.commands.run(artifact.install_dependencies_command)
      console.log(`Installed dependencies: ${artifact.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxID}`)
    }
  }

  // Copy code to fs
  if (artifact.code && Array.isArray(artifact.code)) {
    artifact.code.forEach(async (file) => {
      await sbx.files.write(file.file_path, file.file_content)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxID}`)
    })
  } else {
    await sbx.files.write(artifact.file_path, artifact.code)
    console.log(`Copied file to ${artifact.file_path} in ${sbx.sandboxID}`)
  }

  // Execute code or return a URL to the running sandbox
  if (artifact.template === 'code-interpreter-multilang') {
    const result = await (sbx as CodeInterpreter).notebook.execCell(artifact.code || '')
    await (sbx as CodeInterpreter).close()
    return new Response(JSON.stringify({
      template: artifact.template,
      stdout: result.logs.stdout,
      stderr: result.logs.stderr,
      runtimeError: result.error,
      cellResults: result.results,
    }))
  } else {
    return new Response(JSON.stringify({
      template: artifact.template,
      url: `https://${sbx?.getHost(artifact.port || 80)}`
    }))
  }
}
