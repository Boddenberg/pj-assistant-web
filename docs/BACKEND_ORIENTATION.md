# 📋 Documento de Orientação — Backend (Go)

> **Projeto:** PJ Assistant — BFA (Banking Financial Agent)  
> **Backend:** Go (Railway)  
> **Base URL Produção:** `https://pj-assistant-bfa-go-production.up.railway.app`  
> **Data:** Junho 2025

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Autenticação](#2-autenticação)
3. [Perfil do Cliente](#3-perfil-do-cliente)
4. [Transações e Extrato](#4-transações-e-extrato)
5. [Pix](#5-pix)
6. [Cartão de Crédito PJ](#6-cartão-de-crédito-pj)
7. [Análise Financeira](#7-análise-financeira)
8. [Chat / Assistente IA](#8-chat--assistente-ia)
9. [Métricas e Health](#9-métricas-e-health)
10. [Dev Tools (Desenvolvimento)](#10-dev-tools-desenvolvimento)
11. [Tabelas do Banco de Dados](#11-tabelas-do-banco-de-dados)
12. [Headers Padrão](#12-headers-padrão)
13. [Tratamento de Erros](#13-tratamento-de-erros)

---

## 1. Visão Geral da Arquitetura

```
┌──────────────────────┐     HTTPS/JSON     ┌──────────────────────┐
│   Mobile App (Expo)  │ ◄──────────────────►│   Backend Go (REST)  │
│   React Native       │                     │   Railway            │
└──────────────────────┘                     └──────────┬───────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  PostgreSQL / Redis │
                                              └────────────────────┘
```

- Todas as rotas usam o prefixo `/v1/`
- Autenticação via Bearer Token JWT no header `Authorization`
- Todas as requisições incluem `X-Request-ID` (UUID v4) para rastreamento
- Content-Type: `application/json`
- Timeout do client: 30 segundos

---

## 2. Autenticação

### 2.1 Login

```
POST /v1/auth/login
```

**Request Body:**
```json
{
  "cpf": "12345678900",
  "password": "SenhaSegura123"
}
```

> ⚠️ **IMPORTANTE:** O login agora é feito apenas com CPF + Senha (sem CNPJ). O CPF é o do representante legal.

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 3600,
  "customerId": "uuid-do-cliente",
  "customerName": "Filipe Santos",
  "companyName": "Empresa XYZ LTDA"
}
```

> O frontend usa `customerName` para exibir "Bem-vindo, {primeiroNome}" na tela inicial.

---

### 2.2 Cadastro (Register)

```
POST /v1/auth/register
```

**Request Body:**
```json
{
  "cnpj": "12345678000190",
  "razaoSocial": "Empresa XYZ LTDA",
  "nomeFantasia": "XYZ Tech",
  "email": "contato@xyz.com.br",
  "representanteName": "Filipe Santos",
  "representanteCpf": "12345678900",
  "representantePhone": "11999887766",
  "representanteBirthDate": "1990-01-15",
  "password": "SenhaSegura123"
}
```

**Response (201):**
```json
{
  "customerId": "uuid-do-cliente",
  "agencia": "0001",
  "conta": "123456-7",
  "message": "Conta criada com sucesso"
}
```

---

### 2.3 Refresh Token

```
POST /v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

**Response (200):** Mesmo formato do login.

---

### 2.4 Logout

```
POST /v1/auth/logout
```

**Headers:** `Authorization: Bearer <accessToken>`  
**Body:** `null`  
**Response:** `204 No Content`

---

## 3. Perfil do Cliente

### 3.1 Obter Perfil

```
GET /v1/customers/:customerId
```

**Response (200):**
```json
{
  "id": "uuid-do-cliente",
  "name": "Filipe Santos",
  "document": "12345678000190",
  "companyName": "Empresa XYZ LTDA",
  "segment": "small",
  "accountStatus": "active",
  "relationshipSince": "2024-01-15T00:00:00Z",
  "creditScore": 750
}
```

**Enums:**
- `segment`: `"micro"` | `"small"` | `"medium"` | `"corporate"`
- `accountStatus`: `"active"` | `"restricted"` | `"blocked"`

---

## 4. Transações e Extrato

### 4.1 Listar Transações

```
GET /v1/customers/:customerId/transactions?limit=20
```

**Query Params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | int | 20 | Quantidade máxima de transações |

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid-transacao",
      "date": "2025-06-10T14:30:00Z",
      "description": "Pix enviado - Maria Silva",
      "amount": -500.00,
      "type": "pix_sent",
      "category": "transferencia",
      "counterparty": "Maria Silva"
    },
    {
      "id": "uuid-transacao-2",
      "date": "2025-06-09T10:00:00Z",
      "description": "Pix recebido - João LTDA",
      "amount": 1500.00,
      "type": "pix_received",
      "category": "recebimento",
      "counterparty": "João LTDA"
    }
  ]
}
```

> ⚠️ **ALTERAÇÃO NECESSÁRIA:** O campo `type` agora precisa suportar os seguintes valores:

**`TransactionType` (expandido):**
| Valor | Descrição | Sinal do amount |
|-------|-----------|-----------------|
| `pix_sent` | Pix enviado | negativo |
| `pix_received` | Pix recebido | positivo |
| `debit_purchase` | Compra no débito | negativo |
| `credit_purchase` | Compra no crédito | negativo |
| `transfer_in` | Transferência recebida (TED/DOC) | positivo |
| `transfer_out` | Transferência enviada (TED/DOC) | negativo |
| `bill_payment` | Pagamento de boleto | negativo |
| `credit` | Crédito genérico | positivo |
| `debit` | Débito genérico | negativo |

O frontend usa essa tipagem para:
- **Ícones:** cada tipo tem um ícone diferente (seta cima/baixo, cartão, código de barras, etc.)
- **Cores:** entradas em verde, saídas em vermelho
- **Filtros do Extrato:** o usuário pode filtrar por "Pix", "Débito", "Crédito"

---

### 4.2 Resumo de Transações

```
GET /v1/customers/:customerId/transactions/summary
```

**Response (200):**
```json
{
  "totalCredits": 15000.00,
  "totalDebits": 8500.00,
  "balance": 6500.00,
  "count": 45,
  "period": {
    "from": "2025-05-01",
    "to": "2025-05-31"
  }
}
```

---

## 5. Pix

### 5.1 Buscar Chave Pix (Lookup)

```
GET /v1/pix/keys/lookup?key=email@email.com&type=email
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `key` | string | Valor da chave |
| `type` | string | Tipo da chave: `cpf`, `cnpj`, `email`, `phone`, `random` |

**Response (200):**
```json
{
  "recipient": {
    "name": "Maria Silva",
    "document": "123.456.789-00",
    "bank": "Itaú Unibanco",
    "branch": "0001",
    "account": "123456-7",
    "pixKey": {
      "type": "email",
      "value": "maria@email.com"
    }
  },
  "keyType": "email"
}
```

---

### 5.2 Transferência Pix

```
POST /v1/pix/transfer
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "recipientKey": "maria@email.com",
  "recipientKeyType": "email",
  "amount": 500.00,
  "description": "Pagamento freelancer"
}
```

**Response (200):**
```json
{
  "transactionId": "uuid-transacao",
  "status": "completed",
  "amount": 500.00,
  "recipient": {
    "name": "Maria Silva",
    "document": "123.456.789-00",
    "bank": "Itaú Unibanco",
    "branch": "0001",
    "account": "123456-7"
  },
  "timestamp": "2025-06-10T14:30:00Z",
  "e2eId": "E00000000202506101430abcdef123456"
}
```

**Enums:**
- `status`: `"pending"` | `"completed"` | `"failed"` | `"cancelled"`

---

### 5.3 Pix Agendado

```
POST /v1/pix/schedule
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "recipientKey": "11999887766",
  "recipientKeyType": "phone",
  "amount": 1000.00,
  "scheduledDate": "2025-07-15",
  "description": "Aluguel",
  "recurrence": {
    "type": "monthly",
    "endDate": "2025-12-15"
  }
}
```

> ⚠️ O frontend agora valida a data no formato DD/MM/AAAA com máscara antes de enviar. O backend deve receber no formato ISO `YYYY-MM-DD`.

**Response (200):**
```json
{
  "scheduleId": "uuid-agendamento",
  "status": "scheduled",
  "amount": 1000.00,
  "scheduledDate": "2025-07-15",
  "recipient": { "..." : "..." },
  "recurrence": {
    "type": "monthly",
    "endDate": "2025-12-15"
  }
}
```

---

### 5.4 Cancelar Agendamento

```
DELETE /v1/pix/schedule/:scheduleId
```

**Response:** `204 No Content`

---

### 5.5 Listar Agendamentos

```
GET /v1/pix/scheduled/:customerId
```

**Response (200):**
```json
{
  "schedules": [
    {
      "scheduleId": "uuid-agendamento",
      "status": "scheduled",
      "amount": 1000.00,
      "scheduledDate": "2025-07-15",
      "recipient": { "..." : "..." },
      "recurrence": { "type": "monthly", "endDate": "2025-12-15" }
    }
  ]
}
```

---

### 5.6 Pix no Crédito

```
POST /v1/pix/credit
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "creditCardId": "uuid-do-cartao",
  "recipientKey": "12345678000190",
  "recipientKeyType": "cnpj",
  "amount": 2000.00,
  "installments": 3,
  "description": "Investimento equipamento"
}
```

**Response (200):**
```json
{
  "transactionId": "uuid-transacao",
  "status": "completed",
  "amount": 2000.00,
  "installments": 3,
  "installmentValue": 695.33,
  "totalWithFees": 2086.00,
  "recipient": { "..." : "..." },
  "timestamp": "2025-06-10T14:30:00Z"
}
```

---

### 5.7 Cadastro de Chave Pix ⭐ NOVO

```
POST /v1/pix/keys/register
```

> ⚠️ **ENDPOINT NOVO** — precisa ser criado no backend.

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "keyType": "cnpj",
  "keyValue": "12345678000190"
}
```

**Tipos de chave disponíveis para cadastro:**
| keyType | keyValue (formato) | Observação |
|---------|-------------------|------------|
| `cnpj` | `12345678000190` | CNPJ da empresa |
| `email` | `contato@empresa.com` | E-mail válido |
| `phone` | `+5511999887766` | Com DDI |
| `random` | `""` (vazio) | Backend gera a chave aleatória EVP |

> ⚠️ **NÃO** existe opção de cadastrar chave CPF no fluxo de cadastro de chaves. CPF só é usado para buscar destinatário (enviar Pix).

**Response (201):**
```json
{
  "keyId": "uuid-da-chave",
  "keyType": "cnpj",
  "keyValue": "12345678000190",
  "status": "active",
  "createdAt": "2025-06-10T14:30:00Z"
}
```

**Response para chave aleatória:**
```json
{
  "keyId": "uuid-da-chave",
  "keyType": "random",
  "keyValue": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "active",
  "createdAt": "2025-06-10T14:30:00Z"
}
```

---

## 6. Cartão de Crédito PJ

### 6.1 Listar Cartões do Cliente

```
GET /v1/customers/:customerId/credit-cards
```

**Response (200):**
```json
{
  "cards": [
    {
      "id": "uuid-do-cartao",
      "lastFourDigits": "4321",
      "brand": "visa",
      "status": "active",
      "limit": 15000.00,
      "availableLimit": 12000.00,
      "usedLimit": 3000.00,
      "dueDay": 10,
      "closingDay": 3,
      "annualFee": 49.90,
      "isVirtual": false,
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

**Enums:**
- `brand`: `"visa"` | `"mastercard"` | `"elo"`
- `status`: `"active"` | `"blocked"` | `"cancelled"` | `"pending_activation"`

---

### 6.2 Solicitar/Contratar Cartão ⭐ ALTERAÇÃO

```
POST /v1/customers/:customerId/credit-cards/request
```

> ⚠️ **ALTERAÇÃO:** O frontend agora envia `requestedLimit` e o cartão precisa ter `dueDay` e `closingDay`.

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "preferredBrand": "visa",
  "requestedLimit": 10000.00,
  "virtualCard": false
}
```

> O frontend permite selecionar:
> - **Limite:** R$ 2.000 | R$ 5.000 | R$ 10.000 | R$ 15.000 | R$ 20.000 | R$ 50.000
> - **Dia do vencimento:** 1 | 5 | 10 | 15 | 20 | 25
> - **Marca:** depende da oferta selecionada no carrossel (visa, mastercard, elo)

> ⚠️ O campo `dueDay` precisa ser incluído no request ou calculado pelo backend a partir de uma preferência:

**Request Body (sugestão de inclusão):**
```json
{
  "customerId": "uuid-do-cliente",
  "preferredBrand": "visa",
  "requestedLimit": 10000.00,
  "dueDay": 10,
  "virtualCard": false
}
```

**Response (200):**
```json
{
  "requestId": "uuid-solicitacao",
  "status": "approved",
  "card": {
    "id": "uuid-do-cartao",
    "lastFourDigits": "4321",
    "brand": "visa",
    "status": "active",
    "limit": 10000.00,
    "availableLimit": 10000.00,
    "usedLimit": 0.00,
    "dueDay": 10,
    "closingDay": 3,
    "annualFee": 49.90,
    "isVirtual": false,
    "createdAt": "2025-06-10T00:00:00Z"
  },
  "message": "Cartão aprovado com sucesso!",
  "approvedLimit": 10000.00,
  "estimatedDeliveryDays": 7
}
```

**Regra de negócio:**
- `closingDay` = `dueDay - 7` (se `dueDay > 7`, senão `dueDay + 23`)
- O limite aprovado pode ser menor que o solicitado (decisão do backend)

---

### 6.3 Consultar Fatura ⭐ USADO PELO FRONTEND

```
GET /v1/customers/:customerId/credit-cards/:cardId/invoice
```

**Response (200):**
```json
{
  "id": "uuid-fatura",
  "cardId": "uuid-do-cartao",
  "referenceMonth": "2025-06",
  "totalAmount": 3250.00,
  "minimumPayment": 325.00,
  "dueDate": "2025-07-10",
  "status": "open",
  "transactions": [
    {
      "id": "uuid-transacao",
      "date": "2025-06-05T15:30:00Z",
      "description": "Compra - Amazon AWS",
      "amount": 1200.00,
      "installment": "1/3",
      "category": "tecnologia"
    },
    {
      "id": "uuid-transacao-2",
      "date": "2025-06-08T10:00:00Z",
      "description": "Compra - Material Escritório",
      "amount": 350.00,
      "category": "escritorio"
    }
  ]
}
```

**Enums:**
- `status`: `"open"` | `"closed"` | `"paid"` | `"overdue"`

> O campo `installment` é opcional (só aparece quando a compra é parcelada).

---

### 6.4 Bloquear Cartão

```
POST /v1/customers/:customerId/credit-cards/:cardId/block
```

**Response:** `204 No Content` (atualiza `status` para `"blocked"`)

---

### 6.5 Desbloquear Cartão

```
POST /v1/customers/:customerId/credit-cards/:cardId/unblock
```

**Response:** `204 No Content` (atualiza `status` para `"active"`)

---

### 6.6 Pagar Fatura ⭐ NOVO

> ⚠️ **O frontend espera este endpoint mas ele NÃO está formalmente no service layer.** O `credit-card.tsx` faz a chamada localmente. Precisa ser criado:

```
POST /v1/customers/:customerId/credit-cards/:cardId/invoice/pay
```

**Request Body:**
```json
{
  "amount": 3250.00,
  "paymentType": "total"
}
```

| paymentType | Descrição |
|-------------|-----------|
| `total` | Paga o valor total da fatura |
| `minimum` | Paga o valor mínimo |
| `custom` | Paga um valor customizado (usa o campo `amount`) |

**Response (200):**
```json
{
  "paymentId": "uuid-pagamento",
  "status": "completed",
  "amount": 3250.00,
  "paidAt": "2025-06-10T14:30:00Z",
  "newInvoiceStatus": "paid"
}
```

---

## 7. Análise Financeira

### 7.1 Resumo Financeiro

```
GET /v1/customers/:customerId/financial-summary?period=3months
```

**Query Params:**
| Param | Tipo | Default | Valores |
|-------|------|---------|---------|
| `period` | string | `"3months"` | `"1month"`, `"3months"`, `"6months"`, `"1year"` |

**Response (200):**
```json
{
  "customerId": "uuid-do-cliente",
  "period": {
    "from": "2025-03-01",
    "to": "2025-05-31",
    "label": "Últimos 3 meses"
  },
  "balance": {
    "current": 25000.00,
    "available": 24500.00,
    "blocked": 500.00,
    "invested": 10000.00
  },
  "cashFlow": {
    "totalIncome": 45000.00,
    "totalExpenses": 32000.00,
    "netCashFlow": 13000.00,
    "comparedToPreviousPeriod": 5.2
  },
  "spending": {
    "totalSpent": 32000.00,
    "averageDaily": 355.55,
    "highestExpense": {
      "description": "Aluguel escritório",
      "amount": 5000.00,
      "date": "2025-05-05",
      "category": "aluguel"
    },
    "comparedToPreviousPeriod": -3.1
  },
  "topCategories": [
    {
      "category": "fornecedores",
      "amount": 12000.00,
      "percentage": 37.5,
      "transactionCount": 15,
      "trend": "up"
    }
  ],
  "monthlyTrend": [
    {
      "month": "2025-03",
      "income": 15000.00,
      "expenses": 11000.00,
      "balance": 4000.00
    }
  ]
}
```

---

## 8. Chat / Assistente IA

### 8.1 Enviar Mensagem ao Assistente

```
POST /v1/chat
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "message": "Qual foi meu maior gasto esse mês?",
  "conversationId": "uuid-conversa-existente"
}
```

> `conversationId` é opcional na primeira mensagem. O backend retorna um e o frontend reenvia nas próximas.

**Response (200):**
```json
{
  "conversationId": "uuid-conversa",
  "message": {
    "id": "uuid-mensagem",
    "role": "assistant",
    "content": "Seu maior gasto neste mês foi R$ 5.000,00 com Aluguel escritório, realizado no dia 05/06.",
    "timestamp": "2025-06-10T14:30:00Z",
    "metadata": {
      "toolsUsed": ["get_transactions", "analyze_spending"],
      "ragSources": [
        {
          "documentId": "doc-123",
          "title": "Política de gastos PJ",
          "relevanceScore": 0.95,
          "snippet": "Gastos recorrentes incluem..."
        }
      ],
      "tokenUsage": {
        "promptTokens": 1200,
        "completionTokens": 150,
        "totalTokens": 1350,
        "estimatedCostUsd": 0.0045
      },
      "latencyMs": 2340,
      "reasoning": "Busquei as transações do mês corrente e identifiquei..."
    }
  },
  "profile": { "...": "dados do cliente (opcional)" },
  "transactions": [ "...transações relacionadas (opcional)" ]
}
```

---

## 9. Métricas e Health

### 9.1 Health Check

```
GET /healthz
```

**Response (200):**
```json
{
  "status": "healthy",
  "services": [
    {
      "name": "database",
      "status": "healthy",
      "latencyMs": 5,
      "uptimePercent": 99.99,
      "lastChecked": "2025-06-10T14:30:00Z"
    },
    {
      "name": "redis",
      "status": "healthy",
      "latencyMs": 2,
      "uptimePercent": 99.95,
      "lastChecked": "2025-06-10T14:30:00Z"
    },
    {
      "name": "openai",
      "status": "healthy",
      "latencyMs": 150,
      "uptimePercent": 99.80,
      "lastChecked": "2025-06-10T14:30:00Z"
    }
  ]
}
```

> O frontend faz polling a cada 30 segundos.

---

### 9.2 Métricas do Agente IA

```
GET /v1/metrics/agent
```

**Response (200):**
```json
{
  "totalRequests": 1250,
  "avgLatencyMs": 1800,
  "p95LatencyMs": 3200,
  "p99LatencyMs": 5000,
  "errorRate": 0.02,
  "fallbackRate": 0.05,
  "avgTokensPerRequest": 1400,
  "estimatedCostUsd": 12.50,
  "ragPrecision": 0.92,
  "cacheHitRate": 0.35,
  "period": "last_24h"
}
```

---

## 10. Dev Tools (Desenvolvimento)

> ⚠️ **Endpoints NOVOS** — precisam ser criados. São usados apenas para testes durante desenvolvimento.

### 10.1 Adicionar Saldo

```
POST /v1/dev/add-balance
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "amount": 10000.00
}
```

**Response (200):**
```json
{
  "success": true,
  "newBalance": 35000.00,
  "message": "R$ 10.000,00 adicionados ao saldo"
}
```

---

### 10.2 Definir Limite de Crédito

```
POST /v1/dev/set-credit-limit
```

> ⚠️ **Bug conhecido:** o endpoint atualmente retorna 404 quando o campo `limit` é enviado.
> O frontend agora envia `creditLimit` (camelCase). Se o backend usar Go struct tags
> com `json:"limit"`, renomear para `json:"creditLimit"` ou aceitar ambos.

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "creditLimit": 20000.00
}
```

**Response (200):**
```json
{
  "success": true,
  "newLimit": 20000.00,
  "message": "Limite de crédito atualizado para R$ 20.000,00"
}
```

---

### 10.3 Gerar Transações Aleatórias

```
POST /v1/dev/generate-transactions
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "count": 10
}
```

> O backend deve gerar transações variadas com `type` aleatório entre os valores de `TransactionType`, valores entre R$ 10 e R$ 5.000, datas dos últimos 30 dias, e descrições realistas.

**Response (200):**
```json
{
  "success": true,
  "generated": 10,
  "message": "10 transações geradas com sucesso"
}
```

---

### 10.4 Adicionar Compras no Cartão de Crédito ⭐ NOVO

> Endpoint de dev tools para simular compras no cartão. Suporta dois modos:
> - `today`: cria 1 compra com a data de hoje
> - `random`: cria `count` compras com datas aleatórias dentro do mês da fatura atual

```
POST /v1/dev/add-card-purchase
```

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "cardId": "uuid-do-cartao",
  "amount": 150.00,
  "mode": "today",
  "count": 1
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `customerId` | string | Sim | ID do cliente |
| `cardId` | string | Sim | ID do cartão de crédito |
| `amount` | number | Sim | Valor de cada compra (R$) |
| `mode` | string | Sim | `"today"` ou `"random"` |
| `count` | number | Não | Quantidade de compras (default: 1, usado com `mode: "random"`) |

**Comportamento esperado:**
1. Buscar o cartão pelo `cardId` e verificar se está `active`
2. Para cada compra gerada:
   - Gerar `description` aleatória (ex: "Compra Loja X", "Restaurante Y", "Amazon Prime")
   - Gerar `category` aleatória (ex: "Alimentação", "Serviços", "Materiais")
   - Se `mode: "today"` → data = agora
   - Se `mode: "random"` → data aleatória dentro do mês corrente (entre dia 1 e hoje)
3. Inserir na tabela `credit_card_transactions` vinculada ao `cardId`
4. Atualizar `used_limit` do cartão somando o valor total das compras
5. Atualizar `available_limit = limit - used_limit`

**Response (200):**
```json
{
  "success": true,
  "generated": 3,
  "totalAmount": 450.00,
  "message": "3 compras adicionadas ao cartão •••• 4532"
}
```

---

## 11. Tabelas do Banco de Dados

### Tabelas necessárias (sugestão de schema):

```sql
-- Clientes/Empresas PJ
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(11) UNIQUE NOT NULL,          -- CPF do representante (login)
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    representante_name VARCHAR(255) NOT NULL,
    representante_phone VARCHAR(20),
    representante_birth_date DATE,
    password_hash VARCHAR(255) NOT NULL,
    segment VARCHAR(20) DEFAULT 'micro',      -- micro|small|medium|corporate
    account_status VARCHAR(20) DEFAULT 'active', -- active|restricted|blocked
    agencia VARCHAR(10) DEFAULT '0001',
    conta VARCHAR(20),
    credit_score INT,
    balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    relationship_since TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transações (Extrato unificado)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,            -- Positivo = entrada, Negativo = saída
    type VARCHAR(30) NOT NULL,                -- pix_sent|pix_received|debit_purchase|credit_purchase|transfer_in|transfer_out|bill_payment|credit|debit
    category VARCHAR(100),
    counterparty VARCHAR(255),
    e2e_id VARCHAR(100),                      -- ID end-to-end do Pix (quando aplicável)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(customer_id, date DESC);
CREATE INDEX idx_transactions_type ON transactions(customer_id, type);

-- Chaves Pix
CREATE TABLE pix_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    key_type VARCHAR(10) NOT NULL,            -- cnpj|email|phone|random
    key_value VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active',      -- active|inactive
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pix_keys_customer ON pix_keys(customer_id);
CREATE INDEX idx_pix_keys_value ON pix_keys(key_value);

-- Agendamentos Pix
CREATE TABLE pix_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    recipient_key VARCHAR(255) NOT NULL,
    recipient_key_type VARCHAR(10) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    scheduled_date DATE NOT NULL,
    description VARCHAR(500),
    recurrence_type VARCHAR(20),              -- weekly|monthly|null
    recurrence_end_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled',   -- scheduled|completed|cancelled
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cartões de Crédito
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    last_four_digits VARCHAR(4) NOT NULL,
    brand VARCHAR(20) NOT NULL,               -- visa|mastercard|elo
    status VARCHAR(30) DEFAULT 'active',      -- active|blocked|cancelled|pending_activation
    credit_limit DECIMAL(15,2) NOT NULL,
    available_limit DECIMAL(15,2) NOT NULL,
    used_limit DECIMAL(15,2) DEFAULT 0.00,
    due_day INT NOT NULL,                     -- 1-28
    closing_day INT NOT NULL,                 -- calculado: due_day - 7
    annual_fee DECIMAL(10,2) DEFAULT 0.00,
    is_virtual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_cards_customer ON credit_cards(customer_id);

-- Faturas do Cartão de Crédito
CREATE TABLE credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES credit_cards(id),
    reference_month VARCHAR(7) NOT NULL,      -- 2025-06
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    minimum_payment DECIMAL(15,2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'open',        -- open|closed|paid|overdue
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_card ON credit_card_invoices(card_id);

-- Transações do Cartão (lançamentos na fatura)
CREATE TABLE credit_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES credit_card_invoices(id),
    card_id UUID REFERENCES credit_cards(id),
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    installment VARCHAR(10),                  -- "1/3" ou null
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cc_transactions_invoice ON credit_card_transactions(invoice_id);

-- Conversas do Chat IA
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Mensagens do Chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(10) NOT NULL,                -- user|assistant|system
    content TEXT NOT NULL,
    metadata JSONB,                           -- toolsUsed, ragSources, tokenUsage, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_customer ON refresh_tokens(customer_id);
```

---

## 12. Headers Padrão

Toda requisição do frontend inclui:

| Header | Valor | Descrição |
|--------|-------|-----------|
| `Content-Type` | `application/json` | Sempre JSON |
| `Authorization` | `Bearer <token>` | JWT access token (após login) |
| `X-Request-ID` | `uuid-v4` | UUID único por requisição (rastreamento) |

---

## 13. Tratamento de Erros

O frontend normaliza erros HTTP em tipos conhecidos:

| HTTP Status | Error Code | Descrição |
|-------------|------------|-----------|
| 400 | `VALIDATION_ERROR` | Dados inválidos |
| 401 | `UNAUTHORIZED` | Token expirado ou inválido |
| 403 | `FORBIDDEN` | Sem permissão |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 429 | `RATE_LIMITED` | Muitas requisições |
| 503 | `SERVICE_UNAVAILABLE` | Serviço indisponível |
| Outros | `UNKNOWN_ERROR` | Erro genérico |
| Sem resposta | `NETWORK_ERROR` | Sem conexão |

**Formato esperado do erro (resposta do backend):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CPF inválido",
    "details": { "field": "cpf" }
  }
}
```

---

## Resumo de Ações Necessárias no Backend

### 🆕 Endpoints NOVOS para criar:

| # | Método | Endpoint | Prioridade |
|---|--------|----------|------------|
| 1 | `POST` | `/v1/pix/keys/register` | 🔴 Alta |
| 2 | `POST` | `/v1/customers/:id/credit-cards/:cardId/invoice/pay` | 🔴 Alta |
| 3 | `POST` | `/v1/dev/add-balance` | 🟡 Média |
| 4 | `POST` | `/v1/dev/set-credit-limit` | 🟡 Média |
| 5 | `POST` | `/v1/dev/generate-transactions` | 🟡 Média |
| 6 | `POST` | `/v1/dev/add-card-purchase` | 🟡 Média |

### 🔄 Alterações em endpoints EXISTENTES:

| # | Endpoint | Alteração |
|---|----------|-----------|
| 1 | `POST /v1/auth/login` | Login agora usa apenas `cpf` + `password` (sem CNPJ) |
| 2 | `GET /v1/.../transactions` | Campo `type` expandido com 9 valores possíveis |
| 3 | `POST /v1/.../credit-cards/request` | Incluir campo `dueDay` no request body |
| 4 | Response do login | Deve retornar `customerName` e `companyName` |
| 5 | `POST /v1/dev/generate-transactions` | Aceitar campo `period`: `"current-month"` ou `"last-12-months"` |
| 6 | `POST /v1/dev/add-balance` | A transação criada deve ter `type` como `transfer_in` (não `credit`) e `amount` positivo |

### 🆕 Endpoints NOVOS para criar:

| # | Método | Endpoint | Descrição | Prioridade |
|---|--------|----------|-----------|------------|
| 1 | `GET` | `/v1/customers/:id/credit-limit` | Retorna `{ creditLimit: number }` — o limite de crédito do cliente (definido via set-credit-limit) | 🔴 Alta |
| 2 | `DELETE` | `/v1/pix/keys` | Exclui uma chave Pix cadastrada. Body: `{ customerId, keyType, keyValue }` | 🟡 Média |

---

#### GET /v1/customers/:id/credit-limit

Retorna o limite de crédito disponível do cliente (diferente do saldo em conta).

**Response (200):**
```json
{
  "creditLimit": 50000.00
}
```

**Response (404 — se nunca definido):**
```json
{
  "creditLimit": 0
}
```

---

#### DELETE /v1/pix/keys

Remove uma chave Pix cadastrada.

**Request Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "keyType": "cnpj",
  "keyValue": "12345678000199"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chave Pix removida com sucesso."
}
```

---

### 🐛 Bugs no backend para corrigir:

| # | Endpoint | Bug | Correção necessária |
|---|----------|-----|---------------------|
| 1 | `POST /v1/dev/add-balance` | Transação criada aparece com valor negativo no extrato | O `amount` da transação criada deve ser POSITIVO e o `type` deve ser `transfer_in` |
| 2 | `POST /v1/pix/keys/register` (random) | Quando `keyType=random`, a resposta deve retornar a chave gerada no campo `key` | Garantir que `response.key` contenha a UUID gerada pelo servidor |
| 3 | `GET /v1/customers/:id/financial/summary` | Campo `spending.averageDaily` sempre retorna 0 mesmo com transações | Calcular: soma das despesas do período / número de dias do período |
| 4 | `POST /v1/cards/request` | **Retorna 500 (Internal Server Error)** sem body de resposta | Verificar logs do servidor. O request body contém: `{ customerId, preferredBrand, requestedLimit }`. Possível causa: query no banco falha, ou o credit_limit do customer é 0 e o código não trata esse caso |
| 5 | `GET /v1/pix/lookup` | Pix lookup retorna 404 "recurso não encontrado" | Verificar se endpoint aceita `keyType` como parâmetro de busca. O frontend envia `?key=VALOR&keyType=cpf` |
| 6 | Pix transfer | Permite transferência para o próprio CPF — deveria bloquear no backend | Adicionar validação: se a chave Pix pertence ao mesmo `customerId`, retornar erro 400 "Não é possível transferir para você mesmo" |
| 7 | `POST /v1/dev/set-credit-limit` | **Retorna 404 quando o campo `limit` é enviado.** Retorna 400 quando `creditLimit` é enviado | Possível bug no parsing do JSON: o Go struct provavelmente tem `json:"limit"` mas a rota não encontra o customer. Verificar se o handler faz lookup do customer corretamente. O frontend agora envia `{ customerId, creditLimit }` |
| 8 | `GET /v1/customers/:id/transactions/summary` | **O campo `balance` não reflete o saldo real** (retorna 0 mesmo depois de add-balance) | O summary calcula balance somando transações, mas o `add-balance` atualiza o saldo do customer diretamente. Solução: o `balance` do summary deve ler o saldo real do customer, não apenas calcular de transações |

### 🗄️ Tabelas NOVAS para criar:

| # | Tabela | Prioridade |
|---|--------|------------|
| 1 | `pix_keys` | 🔴 Alta |
| 2 | `credit_card_invoices` | 🔴 Alta |
| 3 | `credit_card_transactions` | 🔴 Alta |

### 🔄 Colunas para alterar/adicionar:

| Tabela | Coluna | Alteração |
|--------|--------|-----------|
| `transactions` | `type` | Expandir ENUM/CHECK para incluir todos os 9 tipos |
| `credit_cards` | `due_day`, `closing_day` | Adicionar se não existirem |
| `customers` | `cpf` | Adicionar se não existir (para login por CPF) |
