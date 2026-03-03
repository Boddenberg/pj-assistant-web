// ─── Auth Types ──────────────────────────────────────────────────────
// Banking authentication — PJ account login and account creation.

export type AuthStep = 'welcome' | 'login' | 'register-1' | 'register-2' | 'register-3' | 'open-ai-chat'

export interface LoginRequest {
  readonly cpf: string           // CPF do representante legal
  readonly password: string      // 6-digit electronic password
}

export interface LoginResponse {
  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresIn: number     // seconds
  readonly customerId: string
  readonly customerName: string
  readonly companyName: string
}

export interface RegisterStep1Data {
  readonly cnpj: string
  readonly razaoSocial: string
  readonly nomeFantasia: string
  readonly email: string
}

export interface RegisterStep2Data {
  readonly representanteName: string
  readonly representanteCpf: string
  readonly representantePhone: string
  readonly representanteBirthDate: string
}

export interface RegisterStep3Data {
  readonly password: string
  readonly passwordConfirm: string
  readonly acceptTerms: boolean
}

export interface RegisterRequest {
  readonly cnpj: string
  readonly razaoSocial: string
  readonly nomeFantasia: string
  readonly email: string
  readonly representanteName: string
  readonly representanteCpf: string
  readonly representantePhone: string
  readonly representanteBirthDate: string
  readonly password: string
}

export interface RegisterResponse {
  readonly customerId: string
  readonly agencia: string
  readonly conta: string
  readonly message: string
}
