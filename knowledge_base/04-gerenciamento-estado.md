# Gerenciamento de Estado — PJ Assistant

## Visão Geral

O app utiliza duas camadas de estado:

| Camada | Ferramenta | Responsabilidade |
|--------|-----------|-----------------|
| **Estado do servidor** | TanStack React Query v5 | Cache de dados da API, refetch, retry, invalidação |
| **Estado do cliente** | Zustand v5 | Dados efêmeros (auth, formulários, fluxos multi-step) |

---

## React Query — Estado do Servidor

### Configuração Global (`src/lib/query-client.ts`)

```
Queries:
  staleTime:   30 segundos (dados "frescos" por 30s)
  gcTime:      5 minutos (dados em cache por 5min)
  retry:       2 tentativas em caso de erro
  retryDelay:  Exponencial (1s, 2s, 4s... máx 10s)
  refetchOnWindowFocus:  desabilitado
  refetchOnReconnect:    habilitado

Mutations:
  retry: 1 tentativa
```

### Query Keys (chaves de cache)

Cada domínio possui factory de chaves para invalidação granular:

| Domínio | Chave Base | Variações |
|---------|-----------|-----------|
| Customer | `['customers']` | `['customers', 'profile', customerId]` |
| Transactions | `['transactions']` | `['transactions', 'list', customerId]`, `['transactions', 'summary', customerId]` |
| Credit Cards | `['credit-cards']` | `['credit-cards', 'list', customerId]`, `['credit-cards', 'invoice', cardId, month]` |
| Financial | `['financial']` | `['financial', 'summary', customerId, period]` |
| Pix | `['pix']` | `['pix', 'scheduled', customerId]` |
| Bill Payments | `['bill-payments']` | `['bill-payments', 'history', customerId]` |
| Metrics | `['health']`, `['metrics', 'agent']` | — |

### Hooks Disponíveis (`src/hooks/`)

**Customer:**
- `useCustomerProfile(customerId)` — Perfil do cliente (staleTime: 60s)

**Transactions:**
- `useTransactions(customerId, limit?)` — Lista de transações
- `useTransactionSummary(customerId)` — Resumo (créditos, débitos, saldo)

**Credit Cards:**
- `useCreditCards(customerId)` — Lista de cartões
- `useCreditCardInvoice(cardId, month)` — Fatura de um cartão
- `useRequestCreditCard()` — Mutation: solicitar novo cartão (invalida lista)
- `useCancelCreditCard()` — Mutation: cancelar cartão (invalida lista)

**Financial:**
- `useFinancialSummary(customerId, period?)` — Resumo financeiro (staleTime: 60s)

**Pix:**
- `useScheduledPix(customerId)` — Pix agendados

**Bill Payments:**
- `useBillPaymentHistory(customerId)` — Histórico de pagamentos

**Metrics:**
- `useHealthStatus()` — Health check (refetch a cada 30s)
- `useAgentMetrics()` — Métricas do agente (staleTime: 15s)

### Padrão de Invalidação

Após operações que alteram dados (Pix, pagamento, compra), o app invalida as queries relevantes:

```typescript
queryClient.invalidateQueries({ queryKey: transactionKeys.all })
queryClient.invalidateQueries({ queryKey: financialKeys.all })
```

---

## Zustand — Estado do Cliente

### AuthStore (`src/stores/auth.store.ts`)

Gerencia autenticação com persistência via AsyncStorage.

**Estado:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `isAuthenticated` | boolean | Está logado? |
| `accessToken` | string | JWT token |
| `refreshToken` | string | Refresh token |
| `customerName` | string | Nome do representante |
| `companyName` | string | Nome da empresa |
| `currentStep` | AuthStep | Etapa atual do fluxo de auth |
| `isHydrated` | boolean | Dados carregados do AsyncStorage? |
| `savedCpf` | string | Último CPF usado |
| `companyData` | CompanyData | CNPJ/email/phone da empresa |

**Ações:**
- `setAuthenticated(data)` — Persiste no AsyncStorage
- `setStep(step)` — Navega entre etapas de auth
- `logout()` — Limpa estado e AsyncStorage
- `hydrate()` — Carrega sessão salva ao iniciar o app
- `saveCpf(cpf)` — Salva último CPF
- `saveCompanyData(data)` — Salva dados da empresa

**Chaves AsyncStorage:**
- `@itau_pj_auth` — Sessão (tokens, customerId, nomes)
- `@itau_pj_credentials` — Último CPF
- `@itau_pj_company_data` — Dados da empresa

### ChatStore (`src/stores/chat.store.ts`)

Gerencia conversa com o assistente IA.

**Estado:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `messages` | ChatMessage[] | Histórico de mensagens |
| `conversationId` | string | ID da conversa atual |
| `isLoading` | boolean | Aguardando resposta da IA |
| `error` | AppError | Último erro |

**Ações:**
- `sendMessage(customerId, content)` — Sanitiza input → envia → recebe resposta
- `clearChat()` — Limpa conversa
- `dismissError()` — Descarta erro

### CustomerStore (`src/stores/customer.store.ts`)

Armazena o `customerId` do cliente logado.

**Estado:** `customerId: string | null`  
**Ações:** `setCustomerId(id)`, `clear()`

### PixStore (`src/stores/pix.store.ts`)

Gerencia fluxos de transferência Pix.

**Estado:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `recipient` | PixRecipient | Destinatário encontrado |
| `isLookingUp` | boolean | Buscando chave Pix |
| `lastTransfer` | PixTransferResponse | Última transferência |
| `isTransferring` | boolean | Transferindo |
| `lastSchedule` | PixScheduleResponse | Último agendamento |
| `isScheduling` | boolean | Agendando |
| `lastCreditCardPix` | PixCreditCardResponse | Último Pix no crédito |
| `error` | AppError | Erro |

**Ações:** `lookupKey()`, `transfer()`, `schedule()`, `transferWithCreditCard()`, `reset()`, `dismissError()`

### BillPaymentStore (`src/stores/bill-payment.store.ts`)

Gerencia fluxo de pagamento de boletos.

**Estado:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `barcodeData` | BarcodeData | Dados do código validado |
| `isValidating` | boolean | Validando código |
| `lastPayment` | BillPaymentResponse | Último pagamento |
| `isPaying` | boolean | Pagando |
| `error` | AppError | Erro |

**Ações:** `validateBarcode()`, `pay()`, `reset()`, `dismissError()`

---

## Fluxo de Dados Típico

```
Tela → Hook (React Query) → Service → httpClient → Backend API
                ↓
         Cache automático
                ↓
         Re-render da tela com dados

Interação do usuário → Store (Zustand) → Service → Backend
                           ↓
                  Invalidação de queries
                           ↓
                  React Query refetch
                           ↓
                  Re-render com dados atualizados
```
