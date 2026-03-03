// ─── HTTP Client ─────────────────────────────────────────────────────
// Single Axios instance — the ONLY place that imports axios.

import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { env } from '@/config'
import { AppError, ErrorCode } from './errors'
import { getDeviceId } from './device-id'

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
      return config
    },
    (error: AxiosError) => Promise.reject(normalizeError(error)),
  )

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(normalizeError(error)),
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

  switch (status) {
    case 401:
      return new AppError(ErrorCode.UNAUTHORIZED, 'Sessão expirada.', error)
    case 403:
      return new AppError(ErrorCode.FORBIDDEN, 'Sem permissão.', error)
    case 404:
      return new AppError(ErrorCode.NOT_FOUND, (data?.message as string) ?? 'Recurso não encontrado.', error)
    case 409:
      return new AppError(ErrorCode.VALIDATION, (data?.message as string) ?? 'Este recurso já existe.', error)
    case 429:
      return new AppError(ErrorCode.RATE_LIMITED, 'Muitas requisições.', error)
    case 503:
      return new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Serviço indisponível.', error)
    default:
      return new AppError(
        ErrorCode.SERVER,
        (data?.message as string) ?? 'Erro inesperado.',
        error,
      )
  }
}

export const httpClient = createHttpClient()
