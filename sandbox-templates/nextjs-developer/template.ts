import { Template, waitForPort } from '@e2b-dev/template'

export const template = Template()
  .fromNodeImage('21-slim')
  .aptInstall('curl') // required for waitForPort(), we should probably include this in base image
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir',
  )
  .runCmd('npx shadcn@2.1.7 init -d')
  .runCmd('npx shadcn@2.1.7 add --all')
  // I am thinking for this we can add separate filesystem methods (.move and .remove)
  .runCmd(
    'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app',
  )
  .setWorkdir('/home/user')
  .setStartCmd('npx next --turbo', waitForPort(3000))
