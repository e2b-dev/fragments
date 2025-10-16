import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromPythonImage('3.9-slim')
  .aptInstall('curl') // required for waitForPort()
  .pipInstall([
    'streamlit',
    'pandas',
    'numpy',
    'matplotlib',
    'requests',
    'seaborn',
    'plotly',
  ])
  .setWorkdir('/home/user')
  .copy('app.py', 'app.py')
  .setStartCmd('streamlit run app.py', waitForPort(8501))
