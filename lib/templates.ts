export function getTemplateId(id: string) {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev ? `${id}-dev` : id
}

const templates = {
  [getTemplateId('code-interpreter-v1')]: {
    name: 'Python data analyst',
    lib: [
      'python',
      'jupyter',
      'numpy',
      'pandas',
      'matplotlib',
      'seaborn',
      'plotly',
    ],
    file: 'script.py',
    instructions:
      'Runs code as a Jupyter notebook cell. Strong data analysis angle. Can use complex visualisation to explain results.',
    port: null,
  },
  [getTemplateId('nextjs-developer')]: {
    name: 'Next.js developer',
    lib: [
      'nextjs@14.2.5',
      'typescript',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'postcss',
      'tailwindcss',
      'shadcn',
    ],
    file: 'pages/index.tsx',
    instructions:
      'A Next.js 13+ app that reloads automatically. Using the pages router.',
    port: 3000,
  },
  [getTemplateId('vue-developer')]: {
    name: 'Vue.js developer',
    lib: ['vue@latest', 'nuxt@3.13.0', 'tailwindcss'],
    file: 'app/app.vue',
    instructions:
      'A Vue.js 3+ app that reloads automatically. Only when asked specifically for a Vue app.',
    port: 3000,
  },
  [getTemplateId('streamlit-developer')]: {
    name: 'Streamlit developer',
    lib: [
      'streamlit',
      'pandas',
      'numpy',
      'matplotlib',
      'request',
      'seaborn',
      'plotly',
    ],
    file: 'app.py',
    instructions: 'A streamlit app that reloads automatically.',
    port: 8501,
  },
  [getTemplateId('gradio-developer')]: {
    name: 'Gradio developer',
    lib: [
      'gradio',
      'pandas',
      'numpy',
      'matplotlib',
      'request',
      'seaborn',
      'plotly',
    ],
    file: 'app.py',
    instructions:
      'A gradio app. Gradio Blocks/Interface should be called demo.',
    port: 7860,
  },
}

export type Templates = typeof templates
export type TemplateId = keyof typeof templates
export type TemplateConfig = (typeof templates)[TemplateId]
export default templates

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`,
    )
    .join('\n')}`
}
