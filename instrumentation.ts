import { validateEnvAtBoot } from '@/lib/env-check'

export async function register() {
  // Production deploys only: fail fast when critical secrets are missing or
  // still placeholders BEFORE any request is served. Preview/branch deploys
  // stay warn-free so they never brick.
  validateEnvAtBoot()
}