import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('24-slim')
  .aptInstall('curl')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx create-next-app@14.2.33 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir',
  )
  .runCmd('npx shadcn@2.1.7 init -d')
  .runCmd('npx shadcn@2.1.7 add --all')
  .runCmd(
    'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app',
  )
  .setWorkdir('/home/user')
  .setStartCmd('npx next --turbo', waitForPort(3000))
