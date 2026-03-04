// ─── Auth Service ────────────────────────────────────────────────────
// Banking authentication endpoints.

import { httpClient } from '@/lib'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: result } = await httpClient.post<LoginResponse>(
      '/v1/auth/login',
      data,
    )
    return result
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const { data: result } = await httpClient.post<RegisterResponse>(
      '/v1/auth/register',
      data,
    )
    return result
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const { data: result } = await httpClient.post<LoginResponse>(
      '/v1/auth/refresh',
      { refreshToken },
    )
    return result
  },

  async logout(accessToken: string): Promise<void> {
    await httpClient.post('/v1/auth/logout', null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },
} as const
