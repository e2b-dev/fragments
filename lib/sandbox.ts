'use server'

import { Sandbox, CodeInterpreter } from '@e2b/code-interpreter'
import { SandboxTemplate } from '@/lib/types'

// Time after which the sandbox gets automatically killed
const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

// Code Interpreter sandbox
export async function createOrConnectCodeInterpreter(userID: string) {
  console.log('create or connect code interpreter sandbox', userID)

  const allSandboxes = await CodeInterpreter.list()
  console.log('all code interpreter sandboxes', allSandboxes)

  const sandboxInfo = allSandboxes.find(sbx => sbx.metadata?.userID === userID)
  console.log('code interpreter sandbox info', sandboxInfo)

  if (!sandboxInfo) {
    // Vercel's AI SDK has a bug that it doesn't throw an error in the tool `execute` call so we want to be explicit
    try {
      const sbx = await CodeInterpreter.create({
        metadata: {
          userID,
        },
        timeoutMs: sandboxTimeout,
      })

      return sbx
    } catch (e) {
      console.error('Error creating sandbox', e)
      throw e
    }
  }

  const sandbox = await CodeInterpreter.connect(sandboxInfo.sandboxID)
  await sandbox.setTimeout(sandboxTimeout)

  return sandbox
}

// Nextjs sandbox
export async function createOrConnectNextjs(userID: string) {
  console.log('create or connect nextjs sandbox', userID)

  const allSandboxes = await Sandbox.list()
  console.log('all nextjs sandboxes', allSandboxes)

  const sandboxInfo = allSandboxes.find(sbx => sbx.metadata?.userID === userID)
  console.log('nextjs sandbox info', sandboxInfo)

  if (!sandboxInfo) {
    // Vercel's AI SDK has a bug that it doesn't throw an error in the tool `execute` call so we want to be explicit
    try {
      const sbx = await Sandbox.create(SandboxTemplate.NextJS, {
        metadata: {
          userID,
        },
        timeoutMs: sandboxTimeout,
      })
      return sbx
    } catch (e) {
      console.error('Error creating sandbox', e)
      throw e
    }
  }

  const sandbox = await Sandbox.connect(sandboxInfo.sandboxID)
  await sandbox.setTimeout(sandboxTimeout)

  return sandbox
}

export async function runPython(userID: string, code: string) {
  const sbx = await createOrConnectCodeInterpreter(userID)
  console.log('Running code', code)

  const result = await sbx.notebook.execCell(code)
  console.log('Command result', result)

  // TODO: This .close will be removed with the update to websocketless CodeInterpreter
  await sbx.close()

  return result
}

export async function writeToPage(userID: string, code: string) {
  const sbx = await createOrConnectNextjs(userID)
  console.log('Writing to /home/user/app/page.tsx', code)

  try {
    await sbx.files.write('/home/user/app/page.tsx', code)
  } catch (e) {
    console.error('Error writing to /home/user/app/page.tsx', e)
    throw e
  }

  // URL where the nextjs app is running
  const url = `https://${sbx.getHost(3000)}`
  return { url }
}
