# API e Endpoints — PJ Assistant Backend

## Configuração de Conexão

- **Base URL**: `https://pj-assistant-bfa-go-production.up.railway.app`
- **Timeout padrão**: 30.000ms (30 segundos)
- **Content-Type**: `application/json`
- **Cabeçalhos automáticos**: Cada request inclui `X-Request-ID` (UUID v4) via interceptor Axios

## Autenticação

### POST `/v1/auth/login`
Autenticação do representante legal da empresa.

**Request:**
```json
{
  "cpf": "12345678901",
  "password": "123456"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "customerId": "uuid",
  "customerName": "João Silva",
  "companyName": "Empresa LTDA"
}
```

### POST `/v1/auth/register`
Cadastro de nova conta PJ.

**Request:**
```json
{
  "cnpj": "12345678000190",
  "razaoSocial": "Empresa LTDA",
  "nomeFantasia": "Empresa",
  "email": "contato@empresa.com",
  "representanteName": "João Silva",
  "representanteCpf": "12345678901",
  "representantePhone": "11999999999",
  "representanteBirthDate": "1990-01-01",
  "password": "123456"
}
```

**Response:**
```json
{
  "customerId": "uuid",
  "agencia": "0001",
  "conta": "123456-7",
  "message": "Conta criada com sucesso"
}
```

### POST `/v1/auth/refresh`
Renova o token de acesso usando o refresh token.

### POST `/v1/auth/logout`
Invalida a sessão. Requer header `Authorization: Bearer <token>`.

---

## Cliente (Customer)

### GET `/v1/customers/{customerId}/profile`
Retorna o perfil do cliente PJ.

**Response:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "document": "12345678000190",
  "companyName": "Empresa LTDA",
  "segment": "small",
  "accountStatus": "active",
  "relationshipSince": "2023-01-15",
  "creditScore": 750
}
```

**Segmentos**: `micro`, `small`, `medium`, `corporate`  
**Status da conta**: `active`, `restricted`, `blocked`

---

## Transações

### GET `/v1/customers/{customerId}/transactions?limit=20`
Lista transações da conta. Retorna wrapper `{ transactions: [...] }`.

**Tipos de transação**: `credit`, `debit`, `pix_sent`, `pix_received`, `debit_purchase`, `credit_purchase`, `transfer_in`, `transfer_out`, `bill_payment`

### GET `/v1/customers/{customerId}/transactions/summary`
Resumo financeiro das transações (totais de crédito/débito, saldo, período).

---

## Pix

### GET `/v1/pix/keys/lookup?key={key}&keyType={type}`
Consulta destinatário por chave Pix.

**Tipos de chave**: `cpf`, `cnpj`, `email`, `phone`, `random`

**Response:**
```json
{
  "recipient": {
    "name": "Maria Oliveira",
    "document": "98765432100",
    "bank": "Itaú",
    "branch": "0001",
    "account": "654321-0",
    "pixKey": { "type": "cpf", "value": "98765432100" }
  },
  "keyType": "cpf"
}
```

### POST `/v1/pix/transfer`
Executa transferência Pix imediata.

**Request:**
```json
{
  "customerId": "uuid",
  "recipientKey": "98765432100",
  "recipientKeyType": "cpf",
  "amount": 150.00,
  "description": "Pagamento fornecedor"
}
```

**Response:** Retorna `transactionId`, `status`, `amount`, `recipient`, `timestamp`, `e2eId`.

**Status possíveis**: `pending`, `completed`, `failed`, `cancelled`

### POST `/v1/pix/schedule`
Agenda transferência Pix para data futura.

**Request adicional**: `scheduledDate`, `recurrence?` (`{ type: 'weekly'|'monthly', endDate? }`)

### DELETE `/v1/pix/schedule/{scheduleId}`
Cancela um Pix agendado.

### GET `/v1/customers/{customerId}/pix/scheduled`
Lista transferências Pix agendadas.

### POST `/v1/pix/credit`
Pix via cartão de crédito (com parcelamento).

**Request adicional**: `creditCardId`, `installments` (1 a 12)

---

## Cartão de Crédito

### GET `/v1/customers/{customerId}/cards`
Lista cartões do cliente. Retorna wrapper `{ cards: [...] }`.

**Bandeiras**: `visa`, `mastercard`, `elo`, `amex`  
**Status**: `active`, `blocked`, `cancelled`, `pending_activation`

**Campos do cartão**: `id`, `lastFourDigits`, `brand`, `status`, `cardType`, `holderName`, `limit`, `availableLimit`, `usedLimit`, `dueDay`, `closingDay`, `annualFee`, `isVirtual`, `createdAt`

### POST `/v1/cards/request`
Solicita novo cartão.

**Request:**
```json
{
  "customerId": "uuid",
  "preferred_brand": "visa",
  "requested_limit": 5000,
  "virtual_card": false
}
```

**Response:** Retorna `requestId`, `status` (`approved`|`denied`|`under_review`), `card?`, `message`, `approvedLimit?`, `estimatedDeliveryDays?`

### GET `/v1/cards/{cardId}/invoices/{month}`
Consulta fatura de um cartão por mês.

**Response:** `id`, `cardId`, `referenceMonth`, `totalAmount`, `minimumPayment`, `dueDate`, `status` (`open`|`closed`|`paid`|`overdue`), `transactions[]`

### POST `/v1/cards/{cardId}/cancel`
Cancela um cartão.

### POST `/v1/cards/{cardId}/block`
Bloqueia um cartão.

### POST `/v1/cards/{cardId}/unblock`
Desbloqueia um cartão.

---

## Análise Financeira

### GET `/v1/customers/{customerId}/financial/summary?period={period}`
Retorna resumo financeiro completo.

**Response inclui**: `balance` (current, available, blocked, invested), `cashFlow` (income, expenses, netCashFlow), `spending` (totalSpent, averageDaily, highestExpense), `topCategories[]`, `monthlyTrend[]`

### POST `/v1/debit/purchase`
Executa compra no débito.

**Request:** `customerId`, `merchantName`, `amount`, `category?`, `description?`  
**Response:** `transactionId`, `status` (`completed`|`failed`|`insufficient_funds`), `amount`, `newBalance`, `timestamp`

---

## Pagamento de Boleto

### POST `/v1/bills/validate`
Valida e decodifica código de barras (47 ou 48 dígitos).

**Response:** `valid`, `data?` (barcode, digitableLine, type, amount, dueDate, beneficiary, bank, totalAmount), `errorMessage?`

**Tipos de boleto**: `boleto`, `concessionaria`, `tributo`

### POST `/v1/bills/pay`
Executa pagamento de boleto.

**Request:** `customerId`, `barcode`, `inputMethod` (`camera`|`typed`|`pasted`), `paymentDate?`  
**Response:** `transactionId`, `status`, `amount`, `beneficiary`, `dueDate?`, `paymentDate`, `authentication`

### GET `/v1/customers/{customerId}/bills/history`
Histórico de pagamentos de boleto.

---

## Assistente IA

### POST `/v1/assistant/{customerId}`
Envia mensagem ao assistente inteligente.

**Request:**
```json
{
  "message": "Qual meu saldo atual?",
  "conversationId": "uuid-or-null"
}
```

**Response:**
```json
{
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Seu saldo atual é R$ 15.000,00...",
    "timestamp": "2025-01-01T12:00:00Z",
    "metadata": {
      "toolsUsed": ["balance_check"],
      "ragSources": [{ "documentId": "...", "title": "...", "relevanceScore": 0.95, "snippet": "..." }],
      "tokenUsage": { "promptTokens": 150, "completionTokens": 80, "totalTokens": 230, "estimatedCostUsd": 0.002 },
      "latencyMs": 1200
    }
  },
  "profile": { ... },
  "transactions": [ ... ]
}
```

---

## Observabilidade

### GET `/healthz`
Health check dos serviços.

**Response:** `status` (`healthy`|`degraded`|`unhealthy`), `services[]` (name, status, latencyMs, uptimePercent, lastChecked)

### GET `/v1/metrics/agent`
Métricas de performance do agente IA.

**Response:** `totalRequests`, `avgLatencyMs`, `p95LatencyMs`, `p99LatencyMs`, `errorRate`, `fallbackRate`, `avgTokensPerRequest`, `estimatedCostUsd`, `ragPrecision`, `cacheHitRate`, `period`

---

## Tratamento de Erros

O HTTP Client normaliza todos os erros em `AppError` com os seguintes códigos:

| Código | HTTP Status | Mensagem padrão |
|--------|------------|-----------------|
| `NETWORK` | Sem resposta | Sem conexão com o servidor |
| `TIMEOUT` | Timeout | A requisição excedeu o tempo limite |
| `UNAUTHORIZED` | 401 | Sessão expirada |
| `FORBIDDEN` | 403 | Sem permissão |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `VALIDATION` | 409 | Este recurso já existe |
| `RATE_LIMITED` | 429 | Muitas requisições |
| `SERVICE_UNAVAILABLE` | 503 | Serviço indisponível |
| `SERVER` | 5xx | Erro inesperado |

**Erros retentáveis**: `NETWORK`, `TIMEOUT`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `AGENT_TIMEOUT`
