// ─── HTTP Client ─────────────────────────────────────────────────────
// Single Axios instance — the ONLY place that imports axios.

import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios'
import { env } from '@/config'
import { AppError, ErrorCode } from './errors'
import { getDeviceId } from './device-id'
import { useAuthStore } from '@/stores/auth.store'
import { useNetworkLogStore, nextLogId } from '@/stores/network-log.store'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.API_BASE_URL,
    timeout: env.REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      config.headers.set('X-Request-ID', generateUUID())
      const deviceId = await getDeviceId()
      config.headers.set('X-Device-Id', deviceId)

      // Inject Authorization header if user is authenticated
      const accessToken = useAuthStore.getState().accessToken
      if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`)
      }

      return config
    },
    (error: AxiosError) => Promise.reject(normalizeError(error)),
  )

  // ─── Network Log interceptors (dev troubleshooting) ───────────────
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const store = useNetworkLogStore.getState()
    if (store.enabled) {
      const reqId = (config.headers?.get?.('X-Request-ID') as string) ?? nextLogId()
      // stash reqId + start time on config for the response interceptor
      ;(config as unknown as Record<string, unknown>).__netLogReqId = reqId
      ;(config as unknown as Record<string, unknown>).__netLogStart = Date.now()

      store.addEntry({
        id: nextLogId(),
        type: 'request',
        timestamp: new Date().toISOString(),
        method: (config.method ?? 'GET').toUpperCase(),
        url: (config.baseURL ?? '') + (config.url ?? ''),
        body: config.data ?? null,
        requestId: reqId,
      })
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const store = useNetworkLogStore.getState()
      if (store.enabled) {
        const cfg = response.config as unknown as Record<string, unknown>
        const reqId = (cfg.__netLogReqId as string) ?? ''
        const start = (cfg.__netLogStart as number) ?? Date.now()
        store.addEntry({
          id: nextLogId(),
          type: 'response',
          timestamp: new Date().toISOString(),
          method: (response.config.method ?? 'GET').toUpperCase(),
          url: (response.config.baseURL ?? '') + (response.config.url ?? ''),
          status: response.status,
          durationMs: Date.now() - start,
          body: response.data ?? null,
          requestId: reqId,
        })
      }
      return response
    },
    (error: AxiosError) => {
      const store = useNetworkLogStore.getState()
      if (store.enabled) {
        const cfg = (error.config as unknown as Record<string, unknown>) ?? {}
        const reqId = (cfg.__netLogReqId as string) ?? ''
        const start = (cfg.__netLogStart as number) ?? Date.now()
        store.addEntry({
          id: nextLogId(),
          type: 'error',
          timestamp: new Date().toISOString(),
          method: (error.config?.method ?? 'GET').toUpperCase(),
          url: (error.config?.baseURL ?? '') + (error.config?.url ?? ''),
          status: error.response?.status,
          durationMs: Date.now() - start,
          body: error.response?.data ?? { message: error.message },
          requestId: reqId,
        })
      }
      return Promise.reject(normalizeError(error))
    },
  )

  return client
}

function normalizeError(error: AxiosError): AppError {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new AppError(ErrorCode.TIMEOUT, 'A requisição excedeu o tempo limite.', error)
  }

  if (!error.response) {
    return new AppError(ErrorCode.NETWORK, 'Sem conexão com o servidor.', error)
  }

  const status = error.response.status
  const data = error.response.data as Record<string, unknown> | undefined
  // Backend may return error details in either 'message' or 'error' field
  const serverMsg = (data?.message as string) ?? (data?.error as string) ?? undefined

  switch (status) {
    case 401:
      return new AppError(ErrorCode.UNAUTHORIZED, serverMsg ?? 'Sessão expirada.', error)
    case 403:
      return new AppError(ErrorCode.FORBIDDEN, serverMsg ?? 'Sem permissão.', error)
    case 404:
      return new AppError(ErrorCode.NOT_FOUND, serverMsg ?? 'Recurso não encontrado.', error)
    case 409:
      return new AppError(ErrorCode.VALIDATION, serverMsg ?? 'Este recurso já existe.', error)
    case 429:
      return new AppError(ErrorCode.RATE_LIMITED, serverMsg ?? 'Muitas requisições.', error)
    case 503:
      return new AppError(ErrorCode.SERVICE_UNAVAILABLE, serverMsg ?? 'Serviço indisponível.', error)
    default:
      return new AppError(
        ErrorCode.SERVER,
        serverMsg ?? 'Erro inesperado.',
        error,
      )
  }
}

export const httpClient = createHttpClient()
