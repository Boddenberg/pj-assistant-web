# Serviços (Services Layer) — PJ Assistant

## Visão Geral

A camada de serviços (`src/services/`) é uma coleção de objetos `const` que encapsulam chamadas HTTP ao backend. **Nenhum serviço contém lógica de negócio** — são pure API passthroughs.

Todos os serviços usam o `httpClient` centralizado (Axios) e são tipados com interfaces TypeScript.

---

## authService (`auth.service.ts`)

Autenticação do representante legal da empresa PJ.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `login(data)` | `POST /v1/auth/login` | Login com CPF + senha |
| `register(data)` | `POST /v1/auth/register` | Cadastro de conta PJ |
| `refreshToken(token)` | `POST /v1/auth/refresh` | Renovar token |
| `logout(accessToken)` | `POST /v1/auth/logout` | Encerrar sessão (com Bearer header) |

---

## customerService (`customer.service.ts`)

Perfil do cliente PJ.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getProfile(customerId)` | `GET /v1/customers/{id}/profile` | Retorna perfil completo |

---

## transactionService (`transaction.service.ts`)

Histórico de transações da conta.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `list(customerId, limit?)` | `GET /v1/customers/{id}/transactions` | Lista transações (unwraps `{ transactions: [...] }`) |
| `summary(customerId)` | `GET /v1/customers/{id}/transactions/summary` | Resumo financeiro |

**Nota:** O backend retorna `{ transactions: [...] }` como wrapper. O service faz o unwrap automaticamente.

---

## pixService (`pix.service.ts`)

Operações Pix completas.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `lookupKey(key, keyType)` | `GET /v1/pix/keys/lookup` | Consulta destinatário por chave |
| `transfer(request)` | `POST /v1/pix/transfer` | Pix imediato |
| `schedule(request)` | `POST /v1/pix/schedule` | Agendar Pix |
| `cancelSchedule(scheduleId)` | `DELETE /v1/pix/schedule/{id}` | Cancelar agendamento |
| `listScheduled(customerId)` | `GET /v1/customers/{id}/pix/scheduled` | Listar Pix agendados |
| `transferWithCreditCard(request)` | `POST /v1/pix/credit` | Pix via cartão de crédito |

---

## creditCardService (`credit-card.service.ts`)

Gestão de cartões de crédito PJ.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `list(customerId)` | `GET /v1/customers/{id}/cards` | Lista cartões (unwraps `{ cards: [...] }`) |
| `request(request)` | `POST /v1/cards/request` | Solicitar novo cartão |
| `getInvoice(cardId, month)` | `GET /v1/cards/{id}/invoices/{month}` | Fatura do mês |
| `cancel(cardId)` | `POST /v1/cards/{id}/cancel` | Cancelar cartão |
| `block(cardId)` | `POST /v1/cards/{id}/block` | Bloquear cartão |
| `unblock(cardId)` | `POST /v1/cards/{id}/unblock` | Desbloquear cartão |

**Nota:** O `request()` converte camelCase para snake_case do backend (`preferredBrand` → `preferred_brand`).

---

## financialService (`financial.service.ts`)

Análise financeira e compra no débito.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `getSummary(customerId, period?)` | `GET /v1/customers/{id}/financial/summary` | Resumo financeiro completo |
| `debitPurchase(request)` | `POST /v1/debit/purchase` | Compra no débito |

---

## billPaymentService (`bill-payment.service.ts`)

Pagamento de boletos e contas.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `validateBarcode(barcode)` | `POST /v1/bills/validate` | Validar/decodificar código de barras |
| `pay(request)` | `POST /v1/bills/pay` | Pagar boleto |
| `history(customerId)` | `GET /v1/customers/{id}/bills/history` | Histórico de pagamentos |

---

## assistantService (`assistant.service.ts`)

Comunicação com o assistente IA.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `chat(customerId, message, conversationId?)` | `POST /v1/assistant/{customerId}` | Enviar mensagem ao assistente |

---

## metricsService (`metrics.service.ts`)

Observabilidade e monitoramento.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `health()` | `GET /healthz` | Health check dos serviços |
| `agentMetrics()` | `GET /v1/metrics/agent` | Métricas do agente IA |
