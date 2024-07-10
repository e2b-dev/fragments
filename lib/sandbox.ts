'use server'

import { CodeInterpreter } from '@e2b/code-interpreter'

export const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

export async function createOrConnect(userID: string) {
  console.log('create or connect', userID)
  const allSandboxes = await CodeInterpreter.list()
  console.log('all sandboxes', allSandboxes)
  const sandboxInfo = allSandboxes.find(sbx => sbx.metadata?.userId === userID)
  console.log('sandbox info', sandboxInfo)
  if (!sandboxInfo) {
    return await CodeInterpreter.create({
      metadata: {
        userId: userID
      }
    })
  }
  return CodeInterpreter.reconnect(sandboxInfo.sandboxID)
}

export async function runPython(userID: string, code: string) {
  const sbx = await createOrConnect(userID)
  console.log('Running code', code)
  const result = await sbx.notebook.execCell(code)
  console.log('Command result', result)
  return result
}

export async function getFileUploadURL(userID: string) {
  const sbx = await createOrConnect(userID)
  return sbx.fileURL
}
