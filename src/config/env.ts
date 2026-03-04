// ─── Environment Configuration ──────────────────────────────────────
import Constants from 'expo-constants'

interface EnvConfig {
  readonly API_BASE_URL: string
  readonly APP_ENV: 'development' | 'staging' | 'production'
  readonly REQUEST_TIMEOUT_MS: number
}

function loadEnv(): EnvConfig {
  const extra = Constants.expoConfig?.extra ?? {}
  return {
    API_BASE_URL: (extra.apiBaseUrl as string) ?? 'http://localhost:8080',
    APP_ENV: (extra.appEnv as EnvConfig['APP_ENV']) ?? 'development',
    REQUEST_TIMEOUT_MS: (extra.requestTimeoutMs as number) ?? 30_000,
  }
}

export const env = loadEnv()
