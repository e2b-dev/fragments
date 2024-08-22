export const templates = {
  "code-interpreter-multilang": {
    name: "Python data analyst",
    lib: ["python", "jupyter", "numpy", "pandas", "matplotlib", "seaborn", "plotly"],
    file: "script.py",
    instructions: `Runs code as a Jupyter notebook cell. Single-file only. Strong data analysis angle. Can use complex visualisation to explain results.`,
    port: null
  },
  "nextjs-developer": {
    name: "Next.js developer",
    lib: ["nextjs@14.2.5", "tailwindcss", "autoprefixer", "postcss", "recharts"],
    file: "page.tsx",
    instructions: `A Next.js 13+ app, that reloads automatically. Use the app router. Mark client components by adding 'use client' expression at the top of the file.`,
    port: 3000
  },
  "streamlit-developer": {
    name: "Streamlit developer",
    lib: [
      "streamlit",
      "pandas",
      "numpy",
      "matplotlib",
      "request",
      "seaborn",
      "plotly",
    ],
    file: "app.py",
    instructions: `A streamlit app, that reloads automatically.`,
    port: 8501
  }
}

export type Templates = typeof templates
export type TemplateId = keyof typeof templates
export type TemplateConfig = typeof templates[TemplateId]

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates).map(([id, t]) => `${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`).join('\n')}`
}
