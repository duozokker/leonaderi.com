import { defineConfig } from 'vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const isUserOrOrgPage = repositoryName.endsWith('.github.io')

export default defineConfig({
  plugins: [],
  base: isGithubActions && !isUserOrOrgPage ? `/${repositoryName}/` : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/kaboom')) return 'vendor-kaboom'
          if (id.includes('node_modules')) return 'vendor-misc'
        },
      },
    },
  },
})
