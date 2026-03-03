// ─── Financial Analysis Types ────────────────────────────────────────

export interface FinancialSummary {
  readonly customerId: string
  readonly period: FinancialPeriod
  readonly balance: AccountBalance
  readonly cashFlow: CashFlow
  readonly spending: SpendingAnalysis
  readonly topCategories: CategoryBreakdown[]
  readonly monthlyTrend: MonthlyData[]
}

export interface FinancialPeriod {
  readonly from: string
  readonly to: string
  readonly label: string
}

export interface AccountBalance {
  readonly current: number
  readonly available: number
  readonly blocked: number
  readonly invested: number
}

export interface CashFlow {
  readonly totalIncome: number
  readonly totalExpenses: number
  readonly netCashFlow: number
  readonly comparedToPreviousPeriod: number
}

export interface SpendingAnalysis {
  readonly totalSpent: number
  readonly averageDaily: number
  readonly highestExpense: ExpenseDetail
  readonly comparedToPreviousPeriod: number
}

export interface ExpenseDetail {
  readonly description: string
  readonly amount: number
  readonly date: string
  readonly category: string
}

export interface CategoryBreakdown {
  readonly category: string
  readonly amount: number
  readonly percentage: number
  readonly transactionCount: number
  readonly trend: 'up' | 'down' | 'stable'
}

export interface MonthlyData {
  readonly month: string
  readonly income: number
  readonly expenses: number
  readonly balance: number
}

export interface DebitPurchaseRequest {
  readonly customerId: string
  readonly merchantName: string
  readonly amount: number
  readonly category?: string
  readonly description?: string
}

export interface DebitPurchaseResponse {
  readonly transactionId: string
  readonly status: 'completed' | 'failed' | 'insufficient_funds'
  readonly amount: number
  readonly newBalance: number
  readonly timestamp: string
}
