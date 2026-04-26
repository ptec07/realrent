import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../..')

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), 'utf8')
}

describe('deployment readiness docs and config', () => {
  it('copies the Vite app shell to 404.html for Vercel direct-route fallback', () => {
    const packageJson = JSON.parse(readRepoFile('frontend/package.json'))

    expect(packageJson.scripts.build).toContain('vite build')
    expect(packageJson.scripts.build).toContain('cp dist/index.html dist/404.html')
  })

  it('documents local setup and Render/Vercel deployment steps in README', () => {
    const readme = readRepoFile('README.md')

    expect(readme).toContain('docker compose up -d')
    expect(readme).toContain('cp .env.example .env')
    expect(readme).toContain('alembic upgrade head')
    expect(readme).toContain('VITE_API_BASE_URL')
    expect(readme).toContain('Render')
    expect(readme).toContain('Vercel')
  })

  it('keeps deploy env examples explicit and placeholder-only', () => {
    const rootEnv = readRepoFile('.env.example')
    const backendEnv = readRepoFile('backend/.env.example')

    expect(rootEnv).toContain('DATABASE_URL=postgresql+psycopg://realrent:realrent@localhost:5432/realrent')
    expect(rootEnv).toContain('PUBLIC_DATA_SERVICE_KEY=REPLACE_ME')
    expect(rootEnv).toContain('VITE_API_BASE_URL=http://localhost:8000')
    expect(backendEnv).toContain('DATABASE_URL=postgresql+psycopg://realrent:realrent@localhost:5432/realrent')
    expect(backendEnv).toContain('PUBLIC_DATA_SERVICE_KEY=REPLACE_ME')
  })

  it('has Render blueprint and gitignore rules for generated deploy artifacts', () => {
    const renderYaml = readRepoFile('render.yaml')
    const gitignore = readRepoFile('.gitignore')

    expect(renderYaml).toContain('type: web')
    expect(renderYaml).toContain('rootDir: backend')
    expect(renderYaml).toContain('uvicorn app.main:app --host 0.0.0.0 --port $PORT')
    expect(renderYaml).toContain('healthCheckPath: /health')
    expect(gitignore).toContain('.vercel/')
    expect(gitignore).toContain('tsconfig.tsbuildinfo')
  })
})
