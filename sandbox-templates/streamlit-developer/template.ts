import { Template, waitForPort } from '@e2b-dev/template'

export const template = Template({
  fileContextPath: __dirname,
})
  .fromPythonImage('3.9-slim')
  .aptInstall('curl') // required for waitForPort(), we should probably include this in base image
  .pipInstall('streamlit pandas numpy matplotlib requests seaborn plotly')
  .setWorkdir('/home/user')
  .copy('app.py', 'app.py')
  .setStartCmd('streamlit run app.py', waitForPort(8501))
