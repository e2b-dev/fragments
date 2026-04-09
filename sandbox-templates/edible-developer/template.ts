import { Template, waitForPort } from 'e2b'

export const template = Template({ fileContextPath: __dirname })
  .fromNodeImage('24-slim')
  .runCmd('apt-get update && apt-get install -y curl unzip', { user: 'root' })
  .runCmd('curl -fsSL https://bun.sh/install | bash')
  .runCmd(
    'ln -s /home/user/.bun/bin/bun /usr/local/bin/bun && ln -s /home/user/.bun/bin/bunx /usr/local/bin/bunx',
    { user: 'root' },
  )
  .setWorkdir('/home/user/app')
  .runCmd(
    'bunx create-next-app@14.2.33 . --ts --tailwind --no-eslint --import-alias "@/*" --use-bun --no-app --no-src-dir',
  )
  .bunInstall(['@tanstack/react-query'])
  .runCmd('npx shadcn@2.1.7 init -d')
  .runCmd('npx shadcn@2.1.7 add accordion alert alert-dialog avatar badge breadcrumb button calendar card carousel checkbox collapsible command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner switch table tabs textarea toast toggle toggle-group tooltip')
  // Layer 1: Engine SDK stubs (protected)
  .copy('scaffold/engine/', '/home/user/app/engine/')
  // Layer 2: Presentation components (LLM playground)
  .copy('scaffold/components/', '/home/user/app/components/')
  // Pages, config, and lib
  .copy('scaffold/pages/', '/home/user/app/pages/')
  .copy('scaffold/lib/', '/home/user/app/lib/')
  .copy('scaffold/site.config.json', '/home/user/app/site.config.json')
  .copy('scaffold/.agent-rules.md', '/home/user/app/.agent-rules.md')
  // Move everything to /home/user and clean up
  .runCmd(
    'cp -a /home/user/app/. /home/user/ && rm -rf /home/user/app && chown -R user:user /home/user/',
    { user: 'root' },
  )
  .setWorkdir('/home/user')
  .setStartCmd('bunx next --turbo', waitForPort(3000))
