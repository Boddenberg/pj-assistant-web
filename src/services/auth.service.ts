// ─── Auth Service ────────────────────────────────────────────────────
// Banking authentication endpoints.

import { httpClient } from '@/lib'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types'

// ── Backend returns snake_case; map to camelCase for the frontend ────

interface LoginResponseRaw {
  access_token: string
  refresh_token: string
  expires_in: number
  customer_id: string
  customer_name: string
  company_name: string
}

interface RegisterResponseRaw {
  customer_id: string
  agencia: string
  conta: string
  message: string
}

function mapLogin(r: LoginResponseRaw): LoginResponse {
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresIn: r.expires_in,
    customerId: r.customer_id,
    customerName: r.customer_name,
    companyName: r.company_name,
  }
}

function mapRegister(r: RegisterResponseRaw): RegisterResponse {
  return {
    customerId: r.customer_id,
    agencia: r.agencia,
    conta: r.conta,
    message: r.message,
  }
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: raw } = await httpClient.post<LoginResponseRaw>(
      '/v1/auth/login',
      data,
    )
    return mapLogin(raw)
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const { data: raw } = await httpClient.post<RegisterResponseRaw>(
      '/v1/auth/register',
      data,
    )
    return mapRegister(raw)
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const { data: raw } = await httpClient.post<LoginResponseRaw>(
      '/v1/auth/refresh',
      { refresh_token: refreshToken },
    )
    return mapLogin(raw)
  },

  async logout(accessToken: string): Promise<void> {
    await httpClient.post('/v1/auth/logout', null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },
} as const
