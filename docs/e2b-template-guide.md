# Building an E2B Sandbox Template from an Existing Project

## Prerequisites

- Node.js 18+
- An E2B account and API key (`E2B_API_KEY`)
- E2B CLI: `npm install -g @e2b/cli`
- Authenticate: `e2b auth login`

## Steps

### 1. Initialize the template in your project

```bash
cd your-nextjs-project
e2b template init --name your-template-name --language typescript
```

This creates a `your-template-name/` subdirectory with:
- `template.ts` — defines the sandbox environment
- `build.dev.ts` — builds a dev template (`your-template-name-dev`)
- `build.prod.ts` — builds a prod template (`your-template-name`)

It also adds `e2b:build:dev` and `e2b:build:prod` scripts to your `package.json`.

### 2. Install the E2B SDK

```bash
npm install e2b
```

### 3. Define your template

Edit `template.ts`. The default scaffolds a bare base image. Replace it with your project setup.

**Key methods:**

| Method | Purpose |
|---|---|
| `.fromNodeImage('22')` | Base image with Node.js |
| `.setWorkdir('/home/user/app')` | Set working directory |
| `.copy('./src', '/home/user/app/src')` | Copy local files into the sandbox |
| `.npmInstall()` | Run `npm install` (reads package.json from workdir) |
| `.runCmd('command')` | Run any shell command |
| `.setStartCmd('npm run dev')` | Command that runs when the sandbox starts |

**Example** — a Next.js project:

```typescript
import { Template } from 'e2b'

export const template = Template()
  .fromNodeImage('22')
  .setWorkdir('/home/user/app')
  .copy('./package.json', '/home/user/app/package.json')
  .copy('./package-lock.json', '/home/user/app/package-lock.json')
  .npmInstall()
  .copy('./app', '/home/user/app/app')
  .copy('./components', '/home/user/app/components')
  .copy('./lib', '/home/user/app/lib')
  .copy('./public', '/home/user/app/public')
  .copy('./next.config.mjs', '/home/user/app/next.config.mjs')
  .copy('./tailwind.config.ts', '/home/user/app/tailwind.config.ts')
  .copy('./tsconfig.json', '/home/user/app/tsconfig.json')
  .setStartCmd('npx next dev --port 3000 --hostname 0.0.0.0')
```

### 4. Build the template

```bash
E2B_API_KEY=your_key npm run e2b:build:dev
```

The build uploads your files, runs each step, starts the sandbox, and registers it. Takes 1–3 minutes depending on project size.

On success you'll see a template ID like `3qsadzsw56er6qgxmum4`.

### 5. Use the template

```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sbx = await Sandbox.create('your-template-name-dev', {
  timeoutMs: 10 * 60 * 1000,
})

// Write files into the running sandbox
await sbx.files.write('app/page.tsx', newCode)

// Get the preview URL
const url = `https://${sbx.getHost(3000)}`

// Reconnect to an existing sandbox later
const sbx2 = await Sandbox.connect(sbx.sandboxId)
```

## Gotchas

- **File paths in `copy()` are relative to where `template.ts` lives**, not the project root. If `template.ts` is in a subdirectory, either move the build script to the root or adjust paths accordingly.
- **Path escaping is not allowed** — `copy('../file', ...)` will fail. The source path must stay within the context directory.
- **Private repos can't be cloned** inside the build — `.gitClone()` has no auth context. Copy local files with `.copy()` instead.
- **Bind to `0.0.0.0`**, not `127.0.0.1` — E2B proxies traffic to the sandbox, so the dev server must be externally accessible.
- **Dev vs prod templates** — `build.dev.ts` registers as `name-dev`, `build.prod.ts` as `name`. Use the appropriate one in your app.
- **Sandbox timeout** — sandboxes auto-terminate after the timeout. Use `Sandbox.connect(id)` to reconnect to a still-running one, and handle the failure case (create a new one if it expired).
