'use server'

import { CodeInterpreter } from '@e2b/code-interpreter'

// Time after which the sandbox gets automatically killed
const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

export async function createOrConnect(userID: string) {
  console.log('create or connect', userID)

  const allSandboxes = await CodeInterpreter.list()
  console.log('all sandboxes', allSandboxes)

  const sandboxInfo = allSandboxes.find(sbx => sbx.metadata?.userId === userID)
  console.log('sandbox info', sandboxInfo)

  if (!sandboxInfo) {
    return await CodeInterpreter.create({
      metadata: {
        userID,
      },
      timeoutMs: sandboxTimeout,
    })
  }

  const sandbox = await CodeInterpreter.connect(sandboxInfo.sandboxID)
  await sandbox.setTimeout(sandboxTimeout)

  return sandbox
}

export async function runPython(userID: string, code: string) {
  const sbx = await createOrConnect(userID)
  console.log('Running code', code)

  const result = await sbx.notebook.execCell(code)
  console.log('Command result', result)

  // TODO: This .close will be removed with the update to websocketless CodeInterpreter
  await sbx.close()

  return result
}

export async function getFileUploadURL(userID: string) {
  const sbx = await createOrConnect(userID)
  return sbx.uploadUrl
}
