import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox, CodeInterpreter } from '@e2b/code-interpreter'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    apiKey,
  }: { fragment: FragmentSchema; userID: string; apiKey?: string } =
    await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)
  console.log('apiKey', apiKey)

  let sbx: Sandbox | CodeInterpreter | undefined = undefined

  // Create a interpreter or a sandbox
  if (fragment.template === 'code-interpreter-multilang') {
    sbx = await CodeInterpreter.create({
      metadata: { template: fragment.template, userID: userID },
      timeoutMs: sandboxTimeout,
      apiKey,
    })
    console.log('Created code interpreter', sbx.sandboxID)
  } else {
    sbx = await Sandbox.create(fragment.template, {
      metadata: { template: fragment.template, userID: userID },
      timeoutMs: sandboxTimeout,
      apiKey,
    })
    console.log('Created sandbox', sbx.sandboxID)
  }

  // Install packages
  if (fragment.has_additional_dependencies) {
    if (sbx instanceof CodeInterpreter) {
      await sbx.notebook.execCell(fragment.install_dependencies_command)
      console.log(
        `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in code interpreter ${sbx.sandboxID}`,
      )
    } else if (sbx instanceof Sandbox) {
      await sbx.commands.run(fragment.install_dependencies_command)
      console.log(
        `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxID}`,
      )
    }
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    fragment.code.forEach(async (file) => {
      await sbx.files.write(file.file_path, file.file_content)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxID}`)
    })
  } else {
    await sbx.files.write(fragment.file_path, fragment.code)
    console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxID}`)
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-multilang') {
    const result = await (sbx as CodeInterpreter).notebook.execCell(
      fragment.code || '',
    )
    await (sbx as CodeInterpreter).close()
    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxID,
        template: fragment.template,
        stdout: result.logs.stdout,
        stderr: result.logs.stderr,
        runtimeError: result.error,
        cellResults: result.results,
      } as ExecutionResultInterpreter),
    )
  } else {
    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxID,
        template: fragment.template,
        url: `https://${sbx?.getHost(fragment.port || 80)}`,
      } as ExecutionResultWeb),
    )
  }
}
