import type { FragmentSchema } from '@/lib/schema'
import type { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    teamID,
    accessToken,
    sbxId: existingSbxId,
  }: {
    fragment: FragmentSchema
    userID: string | undefined
    teamID: string | undefined
    accessToken: string | undefined
    sbxId: string | undefined
  } = await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)
  console.log('existingSbxId', existingSbxId)

  // Reuse existing sandbox if provided, otherwise create a new one
  let sbx: Sandbox
  if (existingSbxId) {
    try {
      sbx = await Sandbox.connect(existingSbxId)
      console.log(`Reconnected to sandbox ${sbx.sandboxId}`)
    } catch (_e) {
      console.log(`Failed to reconnect to ${existingSbxId}, creating new sandbox`)
      sbx = await Sandbox.create(fragment.template, {
        metadata: {
          template: fragment.template,
          userID: userID ?? '',
          teamID: teamID ?? '',
        },
        timeoutMs: sandboxTimeout,
        ...(teamID && accessToken
          ? {
              headers: {
                'X-Supabase-Team': teamID,
                'X-Supabase-Token': accessToken,
              },
            }
          : {}),
      })
    }
  } else {
    sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
        userID: userID ?? '',
        teamID: teamID ?? '',
      },
      timeoutMs: sandboxTimeout,
      ...(teamID && accessToken
        ? {
            headers: {
              'X-Supabase-Team': teamID,
              'X-Supabase-Token': accessToken,
            },
          }
        : {}),
    })
  }

  // Install packages
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command)
    console.log(
      `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
    )
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    for (const file of fragment.code) {
      await sbx.files.write(file.file_path, file.file_content)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
    }
  } else {
    await sbx.files.write(fragment.file_path, fragment.code)
    console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-v1') {
    const { logs, error, results } = await sbx.runCode(fragment.code || '')

    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        stdout: logs.stdout,
        stderr: logs.stderr,
        runtimeError: error,
        cellResults: results,
      } as ExecutionResultInterpreter),
    )
  }

  // Derive the preview path from the file_path so the iframe shows the right page
  const baseUrl = `https://${sbx?.getHost(fragment.port || 80)}`
  const pagePath = toPageRoute(fragment.file_path)

  return new Response(
    JSON.stringify({
      sbxId: sbx?.sandboxId,
      template: fragment.template,
      url: pagePath ? `${baseUrl}${pagePath}` : baseUrl,
    } as ExecutionResultWeb),
  )
}

/**
 * Convert a file path like "pages/about.tsx" to a route like "/about".
 * Returns null for non-page files (components, lib, etc).
 */
function toPageRoute(filePath: string): string | null {
  if (!filePath.startsWith('pages/')) return null

  const route = filePath
    .replace(/^pages\//, '/') // pages/about.tsx → /about.tsx
    .replace(/\.(tsx|ts|jsx|js)$/, '') // /about.tsx → /about
    .replace(/\/index$/, '/') // /index → /

  // _app, _document, _error etc are not navigable routes
  if (route.startsWith('/_')) return null

  // Normalize: remove trailing slash except for root
  if (route !== '/' && route.endsWith('/')) {
    return route.slice(0, -1)
  }

  return route
}
