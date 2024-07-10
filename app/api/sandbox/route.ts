import {
  createOrConnect,
  sandboxTimeout,
} from '@/lib/sandbox'

// Returns an info about sandbox
export async function POST(req: Request) {
  const { userID, code, file, command }: { userID: string, code: string, file: string, command: string } = await req.json()
  const sbx = await createOrConnect(userID)


  const url = `https://${sbx.getHostname()}`

  await sbx.keepAlive(sandboxTimeout)
  await sbx.close()

  return new Response(JSON.stringify({
    status: 'ok',
    url,
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}