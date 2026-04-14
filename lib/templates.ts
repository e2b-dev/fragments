export function getTemplateIdSuffix(id: string) {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev ? `${id}-dev` : id
}

export function getTemplateId(id: string) {
  return id.replace(/-dev$/, '')
}

const templates = {
  'code-interpreter-v1': {
    name: 'Python data analyst',
    lib: ['python', 'jupyter', 'numpy', 'pandas', 'matplotlib', 'seaborn', 'plotly'],
    file: 'script.py',
    instructions:
      'Runs code as a Jupyter notebook cell. Strong data analysis angle. Can use complex visualisation to explain results.',
    port: null,
  },
  [getTemplateIdSuffix('edible-developer')]: {
    name: 'Edible developer',
    lib: [
      'nextjs@14.2.33',
      'react@18',
      'typescript',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'postcss',
      'tailwindcss',
      'shadcn',
      '@tanstack/react-query',
      'bun',
    ],
    file: 'pages/index.tsx',
    instructions:
      'A Next.js 14 booking site template with Bun runtime, Tailwind CSS, shadcn/ui, and TanStack Query. Uses the pages router with a 3-layer architecture: engine/ (PROTECTED adapter layer with hooks, transforms, SDK stubs — DO NOT MODIFY), components/ (presentation layer — freely modify), pages/ (page routes — freely modify). Pre-built pages: index, search, listing/[id], checkout, confirmation. Pre-built hooks: useListingSearch, useListing, useAvailability, useCreateReservation, useReviews. Import display types and hooks from @/engine only. Read .agent-rules.md for full constraints. Use bun to install additional dependencies.',
    port: 3000,
  },
}

export type Templates = typeof templates
export default templates

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`,
    )
    .join('\n')}`
}
