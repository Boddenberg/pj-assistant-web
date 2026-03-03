# Tipos e Interfaces TypeScript — PJ Assistant

## Convenções

- Todas as interfaces usam `readonly` para imutabilidade
- Union types para enums (ex: `'active' | 'blocked' | 'cancelled'`)
- Campos opcionais marcados com `?`
- Exportação centralizada via `src/types/index.ts`

---

## Autenticação (`src/types/auth.ts`)

### AuthStep
```typescript
type AuthStep = 'welcome' | 'login' | 'register-1' | 'register-2' | 'register-3'
```

### LoginRequest / LoginResponse
- **Request**: `cpf` (CPF do representante), `password` (senha eletrônica 6 dígitos)
- **Response**: `accessToken`, `refreshToken`, `expiresIn` (segundos), `customerId`, `customerName`, `companyName`

### RegisterRequest / RegisterResponse
- **Request**: `cnpj`, `razaoSocial`, `nomeFantasia`, `email`, `representanteName`, `representanteCpf`, `representantePhone`, `representanteBirthDate`, `password`
- **Response**: `customerId`, `agencia`, `conta`, `message`

---

## Cliente (`src/types/customer.ts`)

### CustomerProfile
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | UUID do cliente |
| `name` | string | Nome do representante |
| `document` | string | CNPJ da empresa |
| `companyName` | string | Nome da empresa |
| `segment` | CustomerSegment | Segmento do cliente |
| `accountStatus` | AccountStatus | Status da conta |
| `relationshipSince` | string | Data de início do relacionamento |
| `creditScore` | number? | Score de crédito (opcional) |

### Enums
- **CustomerSegment**: `'micro'` | `'small'` | `'medium'` | `'corporate'`
- **AccountStatus**: `'active'` | `'restricted'` | `'blocked'`

---

## Transações (`src/types/transaction.ts`)

### Transaction
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | UUID |
| `date` | string | Data ISO |
| `description` | string | Descrição |
| `amount` | number | Valor (positivo=entrada, negativo=saída) |
| `type` | TransactionType | Tipo da transação |
| `category` | string | Categoria |
| `counterparty` | string? | Contraparte |

### TransactionType
```typescript
'credit' | 'debit' | 'pix_sent' | 'pix_received' | 'debit_purchase' | 'credit_purchase' | 'transfer_in' | 'transfer_out' | 'bill_payment'
```

### TransactionSummary
`totalCredits`, `totalDebits`, `balance`, `count`, `period` (from, to)

---

## Pix (`src/types/pix.ts`)

### Tipos de Chave
```typescript
type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
```

### PixKey
`type` (PixKeyType) + `value` (string)

### PixRecipient
`name`, `document`, `bank`, `branch`, `account`, `pixKey?`

### PixTransferRequest
`customerId`, `recipientKey`, `recipientKeyType`, `amount`, `description?`

### PixTransferResponse
`transactionId`, `status`, `amount`, `recipient`, `timestamp`, `e2eId`

### PixTransferStatus
```typescript
'pending' | 'completed' | 'failed' | 'cancelled'
```

### PixScheduleRequest
Herda campos do transfer + `scheduledDate`, `recurrence?` (type: `'weekly'` | `'monthly'`, endDate?)

### PixCreditCardRequest
`customerId`, `creditCardId`, `recipientKey`, `recipientKeyType`, `amount`, `installments`, `description?`

---

## Cartão de Crédito (`src/types/credit-card.ts`)

### CreditCard
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | UUID |
| `lastFourDigits` | string | Últimos 4 dígitos |
| `brand` | CreditCardBrand | Bandeira |
| `status` | CreditCardStatus | Status |
| `cardType` | string | Tipo do cartão (ex: "Platinum") |
| `holderName` | string | Nome do portador |
| `limit` | number | Limite total |
| `availableLimit` | number | Limite disponível |
| `usedLimit` | number | Limite usado |
| `dueDay` | number | Dia de vencimento |
| `closingDay` | number | Dia de fechamento |
| `annualFee` | number | Anuidade |
| `isVirtual` | boolean | É cartão virtual? |
| `createdAt` | string | Data de criação |

### Enums
- **CreditCardBrand**: `'visa'` | `'mastercard'` | `'elo'` | `'amex'`
- **CreditCardStatus**: `'active'` | `'blocked'` | `'cancelled'` | `'pending_activation'`
- **CreditCardRequestStatus**: `'approved'` | `'denied'` | `'under_review'`
- **InvoiceStatus**: `'open'` | `'closed'` | `'paid'` | `'overdue'`

### CreditCardInvoice
`id`, `cardId`, `referenceMonth`, `totalAmount`, `minimumPayment`, `dueDate`, `status`, `transactions[]`

### CreditCardTransaction
`id`, `date`, `description`, `amount`, `installment?`, `category`

---

## Financeiro (`src/types/financial.ts`)

### FinancialSummary
| Campo | Tipo |
|-------|------|
| `customerId` | string |
| `period` | FinancialPeriod (from, to, label) |
| `balance` | AccountBalance |
| `cashFlow` | CashFlow |
| `spending` | SpendingAnalysis |
| `topCategories` | CategoryBreakdown[] |
| `monthlyTrend` | MonthlyData[] |

### AccountBalance
`current`, `available`, `blocked`, `invested`

### CashFlow
`totalIncome`, `totalExpenses`, `netCashFlow`, `comparedToPreviousPeriod`

### SpendingAnalysis
`totalSpent`, `averageDaily`, `highestExpense` (ExpenseDetail), `comparedToPreviousPeriod`

### CategoryBreakdown
`category`, `amount`, `percentage`, `transactionCount`, `trend` (`'up'`|`'down'`|`'stable'`)

### DebitPurchaseRequest / Response
- **Request**: `customerId`, `merchantName`, `amount`, `category?`, `description?`
- **Response**: `transactionId`, `status` (`'completed'`|`'failed'`|`'insufficient_funds'`), `amount`, `newBalance`, `timestamp`

---

## Pagamento de Boleto (`src/types/bill-payment.ts`)

### BarcodeData
`barcode`, `digitableLine`, `type` (BarcodeType), `amount`, `dueDate?`, `beneficiary?`, `bank?`, `discount?`, `interest?`, `fine?`, `totalAmount`

### BarcodeType
```typescript
'boleto' | 'concessionaria' | 'tributo'
```

### BillPaymentRequest
`customerId`, `barcode`, `inputMethod` (`'camera'`|`'typed'`|`'pasted'`), `paymentDate?`

---

## Chat / Assistente IA (`src/types/chat.ts`)

### ChatMessage
`id`, `role` (`'user'`|`'assistant'`|`'system'`), `content`, `timestamp`, `metadata?`

### MessageMetadata
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `toolsUsed` | string[] | Ferramentas usadas pelo agente |
| `ragSources` | RagSource[] | Fontes de RAG consultadas |
| `tokenUsage` | TokenUsage | Consumo de tokens |
| `latencyMs` | number | Latência da resposta |
| `reasoning` | string | Raciocínio do agente |

### RagSource
`documentId`, `title`, `relevanceScore`, `snippet`

### TokenUsage
`promptTokens`, `completionTokens`, `totalTokens`, `estimatedCostUsd`

---

## Métricas (`src/types/metrics.ts`)

### AgentMetrics
`totalRequests`, `avgLatencyMs`, `p95LatencyMs`, `p99LatencyMs`, `errorRate`, `fallbackRate`, `avgTokensPerRequest`, `estimatedCostUsd`, `ragPrecision`, `cacheHitRate`, `period`

### HealthStatus
`status` (`'healthy'`|`'degraded'`|`'unhealthy'`), `services[]`

### ServiceHealth
`name`, `status`, `latencyMs`, `uptimePercent`, `lastChecked`
