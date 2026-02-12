import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const isUserOrOrgPage = repositoryName.endsWith('.github.io')

// Keep local dev on "/" and set base path only for repository pages in GitHub Actions.
export default defineConfig({
  plugins: [react()],
  base: isGithubActions && !isUserOrOrgPage ? `/${repositoryName}/` : '/',
})
