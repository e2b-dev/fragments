# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with turbo mode
npm run dev

# Build the application
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

This is a Next.js 14 application that provides an AI-powered code generation platform similar to Claude Artifacts, v0, or GPT Engineer. The app uses the E2B SDK to execute generated code in secure sandboxes.

### Core Technologies
- **Next.js 14** with App Router and Server Actions
- **TypeScript** with strict mode enabled
- **Tailwind CSS** with shadcn/ui components
- **Vercel AI SDK** for LLM integration
- **E2B Code Interpreter** for secure code execution
- **Supabase** for authentication (optional)
- **Upstash KV** for rate limiting and short URLs (optional)

### Key Directories

- `/app` - Next.js App Router pages and API routes
  - `/api/chat` - Main chat API endpoint for LLM interactions
  - `/api/sandbox` - E2B sandbox management
  - `/actions` - Server actions for publishing and validation
- `/components` - React components
  - `/ui` - shadcn/ui component library
- `/lib` - Shared utilities and configuration
  - `models.json` - Available LLM models configuration
  - `templates.json` - Supported coding environments (Python, Next.js, Vue.js, Streamlit, Gradio)
  - `models.ts` - LLM provider configurations and client setup
  - `templates.ts` - Template management logic
- `/sandbox-templates` - E2B template definitions for different coding environments
- `/public/thirdparty` - Third-party logos and assets

### LLM Provider Support

The application supports multiple LLM providers configured in `lib/models.ts`:
- OpenAI (GPT-4o, o1, etc.)
- Anthropic (Claude 3.5 Sonnet, Haiku)
- Google (Gemini models via Vertex AI and Generative AI)
- Mistral (various models including Codestral)
- Groq, Fireworks, Together AI
- xAI (Grok models)
- Ollama (for local models)

### Template System

Templates define different coding environments in `lib/templates.json`:
- **code-interpreter-v1**: Python data analysis with Jupyter
- **nextjs-developer**: Next.js applications
- **vue-developer**: Vue.js applications  
- **streamlit-developer**: Streamlit apps
- **gradio-developer**: Gradio interfaces

Each template specifies libraries, entry files, instructions, and ports.

### Environment Configuration

Key environment variables (see `.env.template`):
- `E2B_API_KEY` - Required for code execution
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc. - LLM provider keys
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Authentication (optional)
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` - Upstash KV (optional)
- `NEXT_PUBLIC_POSTHOG_KEY` - Analytics (optional)

### Code Execution Flow

1. User sends messages via `/api/chat`
2. LLM generates structured response using Zod schema (`lib/schema.ts`)
3. Code execution happens via E2B sandbox API (`/api/sandbox`)
4. Real-time streaming updates sent back to client

### Rate Limiting

Rate limiting is implemented for users without API keys using Upstash KV storage. Default: 10 requests per day, configurable via environment variables.

## Adding New Features

### Adding LLM Models
1. Add model configuration to `lib/models.json`
2. Update provider configurations in `lib/models.ts` if needed
3. Add provider logo to `public/thirdparty/logos/` if new provider

### Adding Templates
1. Create new template folder in `sandbox-templates/`
2. Use E2B CLI to initialize and build template
3. Add template configuration to `lib/templates.json`
4. Add template logo to `public/thirdparty/templates/` (optional)

### Path Aliases
- `@/*` maps to project root for clean imports