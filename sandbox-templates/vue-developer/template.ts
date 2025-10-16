import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('21-slim')
  .aptInstall(['curl', 'git']) // required for waitForPort(), we should probably include this in base image
  .setWorkdir('/home/user/vue-app')
  .runCmd(
    'npx nuxi@latest init . --packageManager=npm --gitInit=no -f --modules tailwindcss',
  )
  .copy('nuxt.config.ts', 'nuxt.config.ts')
  .setWorkdir('/home/user')
  .runCmd('mv /home/user/vue-app/* /home/user/ && rm -rf /home/user/vue-app')
  .setStartCmd('npm run dev', waitForPort(3000))
