'use server'

import { CodeInterpreter } from '@e2b/code-interpreter'

export const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

// Creates a new or connects to an existing code interpreter sandbox
export async function createOrConnect(userID: string) {
  // TODO: Implement
}

// Runs AI-generated Python code in the code interpreter sandbox
export async function runPython(userID: string, code: string) {
  // TODO: Implement
}
