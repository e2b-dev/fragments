import { LLMModelConfig } from './models'
import { fragmentSchema } from './schema'
import templates, { Templates } from './templates'
import { z } from 'zod'

const textPart = z
  .object({ type: z.literal('text'), text: z.string() })
  .strict()

// Images are sent inline. The AI SDK downloads image URLs on the server, so
// only data URLs are accepted.
const imagePart = z
  .object({
    type: z.literal('image'),
    image: z.string().regex(/^data:image\/[\w.+-]+;base64,/),
  })
  .strict()

const messageSchema = z.discriminatedUnion('role', [
  z
    .object({
      role: z.literal('user'),
      content: z.array(z.discriminatedUnion('type', [textPart, imagePart])),
    })
    .strict(),
  z
    .object({ role: z.literal('assistant'), content: z.array(textPart) })
    .strict(),
])

const templateIds = Object.keys(templates) as [string, ...string[]]

// The client picks templates by ID. The prompt is built from the server's
// template definitions, not from the values in the request.
const templateSchema = z
  .record(z.enum(templateIds), z.unknown())
  .refine((selected) => Object.keys(selected).length > 0)
  .transform(
    (selected) =>
      Object.fromEntries(
        Object.keys(selected).map((id) => [id, templates[id]]),
      ) as Templates,
  )

const modelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    provider: z.string(),
    providerId: z.string(),
    multiModal: z.boolean().optional(),
  })
  .strict()

export const modelConfigSchema = z
  .object({
    model: z.string().optional(),
    apiKey: z.string().trim().min(1).optional(),
    temperature: z.number().min(0).max(5).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().int().min(0).max(500).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    maxTokens: z.number().int().positive().max(10000).optional(),
  })
  .strict()

export const chatRequestSchema = z
  .object({
    messages: z.array(messageSchema).min(1),
    userID: z.string().nullish(),
    teamID: z.string().nullish(),
    template: templateSchema,
    model: modelSchema,
    config: modelConfigSchema,
  })
  .strict()

export const morphChatRequestSchema = chatRequestSchema.extend({
  currentFragment: fragmentSchema
    .partial()
    .required({ file_path: true, code: true })
    .strict(),
})

export async function parseRequest<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.output<T> } | { error: Response }> {
  const parsed = schema.safeParse(await req.json().catch(() => undefined))
  if (!parsed.success) {
    // Name the field only. Messages can echo values from the request.
    const path = parsed.error.issues[0]?.path.join('.')
    const message = path ? `Invalid request: ${path}` : 'Invalid request'
    return { error: new Response(message, { status: 400 }) }
  }
  return { data: parsed.data }
}

// Keeps only the settings the chat API accepts. Older versions also stored a
// base URL in the browser.
export function toRequestConfig(config: LLMModelConfig): LLMModelConfig {
  return Object.fromEntries(
    Object.entries(config).filter(([key]) => key in modelConfigSchema.shape),
  )
}
