import { readReleaseAppEnv } from './release_app_env.mjs'

try {
  readReleaseAppEnv()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
