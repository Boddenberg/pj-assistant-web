export type { CustomerProfile, CustomerSegment, AccountStatus } from './customer'
export type {
  AuthStep, LoginRequest, LoginResponse,
  RegisterStep1Data, RegisterStep2Data, RegisterStep3Data,
  RegisterRequest, RegisterResponse,
} from './auth'
export type { Transaction, TransactionType, TransactionSummary } from './transaction'
export type {
  ChatMessage, MessageRole, ChatApiResponse, HistoryEntry,
  AccountData, OnboardingStep,
} from './chat'
export { getOnboardingProgress } from './chat'
export type {
  ChatMetrics, AgentPerformance, RagQuality, LlmJudge,
  CriterionBreakdown, Improvement,
  HealthStatus, ServiceHealth,
} from './metrics'

// ─── Banking Operations ──────────────────────────────────────────────
export type {
  PixKeyType, PixKey, PixRecipient,
  PixTransferRequest, PixTransferResponse, PixTransferStatus,
  PixScheduleRequest, PixScheduleResponse, PixRecurrence,
  PixKeyLookupResponse,
  PixCreditCardRequest, PixCreditCardResponse,
} from './pix'

export type {
  BarcodeData, BarcodeType, BarcodeInputMethod,
  BillPaymentRequest, BillPaymentResponse, BillPaymentStatus,
  BarcodeValidationResponse,
} from './bill-payment'

export type {
  CreditCard, CreditCardBrand, CreditCardStatus,
  CreditCardRequest, CreditCardResponse, CreditCardRequestStatus,
  CreditCardInvoice, InvoiceStatus, CreditCardTransaction,
} from './credit-card'

export type {
  FinancialSummary, FinancialPeriod, AccountBalance, CashFlow,
  SpendingAnalysis, ExpenseDetail, CategoryBreakdown, MonthlyData,
  DebitPurchaseRequest, DebitPurchaseResponse,
} from './financial'
