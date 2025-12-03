import next from 'eslint-config-next'

const config = [
  ...next,
  {
    ignores: ['sandbox-templates/**/node_modules/**'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
