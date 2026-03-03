# Utilitários e Bibliotecas — PJ Assistant

## HTTP Client (`src/lib/http-client.ts`)

Instância Axios centralizada — **único ponto de importação do axios** em todo o app.

### Configuração
- **Base URL**: Carregada de `env.API_BASE_URL`
- **Timeout**: `env.REQUEST_TIMEOUT_MS` (padrão 30s)
- **Headers padrão**: `Content-Type: application/json`, `Accept: application/json`

### Interceptors

**Request:**
- Adiciona `X-Request-ID` (UUID v4) em cada requisição para rastreabilidade

**Response (erro):**
- Converte todos os erros Axios em `AppError` tipado
- Mapeia status HTTP → código de erro semântico

---

## Sistema de Erros (`src/lib/errors.ts`)

### ErrorCode (enum)
```
NETWORK          → Sem resposta do servidor
TIMEOUT          → Timeout na requisição
RATE_LIMITED     → HTTP 429
UNAUTHORIZED     → HTTP 401
FORBIDDEN        → HTTP 403
NOT_FOUND        → HTTP 404
SERVER           → HTTP 5xx genérico
SERVICE_UNAVAILABLE → HTTP 503
AGENT_ERROR      → Erro do agente IA
AGENT_TIMEOUT    → Timeout do agente IA
RAG_NO_RESULTS   → RAG sem resultados
VALIDATION       → HTTP 409 ou validação local
UNKNOWN          → Erro não classificado
```

### AppError (classe)
Estende `Error` com:
- `code: ErrorCode` — Código do erro
- `originalError?: unknown` — Erro original
- `isRetryable: boolean` — Pode tentar novamente? (NETWORK, TIMEOUT, RATE_LIMITED, SERVICE_UNAVAILABLE, AGENT_TIMEOUT)
- `requiresAuth: boolean` — Requer re-autenticação? (UNAUTHORIZED)
- `toJSON()` — Serialização para log

---

## Utilitários de Formatação (`src/lib/utils.ts`)

### formatCurrency(value: number): string
Formata valor em **Real brasileiro** (BRL).
```
formatCurrency(1500.50) → "R$ 1.500,50"
```

### formatDate(date: string | Date): string
Formata data no padrão brasileiro curto.
```
formatDate("2025-01-15") → "15/01/2025"
```

### formatTime(date: string | Date): string
Formata hora HH:mm.
```
formatTime("2025-01-15T14:30:00Z") → "14:30"
```

### truncate(text: string, maxLength: number): string
Trunca texto com reticências.
```
truncate("Texto muito longo", 10) → "Texto muit…"
```

### sanitizeInput(input: string): string
Sanitiza input do usuário contra XSS/prompt injection.
- Escapa `<`, `>`, `"`, `'`
- Remove espaços nas extremidades

### generateId(): string
Gera UUID v4 para identificação de mensagens e requisições.

---

## Utilitários de Código de Barras (`src/lib/barcode.ts`)

### isValidDigitableLine(input: string): boolean
Valida se a string é uma linha digitável válida:
- **47 dígitos** → Boleto bancário
- **48 dígitos** → Concessionária/tributo

### formatDigitableLine(input: string): string
Formata a sequência numérica em formato legível:
- **47 dígitos**: `XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXX`
- **48 dígitos**: `XXXXXXXXXXX-X XXXXXXXXXXX-X XXXXXXXXXXX-X XXXXXXXXXXX-X`

### maskDocument(doc: string): string
Mascara CPF/CNPJ para exibição segura:
```
maskDocument("12345678901")     → "***.***789-**"
maskDocument("12345678000190")  → "12.***.***/****-90"
```

### formatPixKey(key: string, type: string): string
Formata/mascara chave Pix conforme tipo:
- **cpf/cnpj**: Usa `maskDocument`
- **email**: `jo***@gmail.com`
- **phone**: `+55 9****99`
- **random**: `a1b2c3d4...`

---

## React Query Client (`src/lib/query-client.ts`)

Configuração global do QueryClient:

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `staleTime` | 30s | Tempo que dados são considerados "frescos" |
| `gcTime` | 5min | Tempo de garbage collection do cache |
| `retry` | 2 | Número de tentativas em queries |
| `retryDelay` | Exponencial (máx 10s) | Delay entre tentativas |
| `refetchOnWindowFocus` | false | Não refetch ao voltar para a janela |
| `refetchOnReconnect` | true | Refetch ao reconectar |
| `mutations.retry` | 1 | Tentativas em mutations |

---

## Configuração de Ambiente (`src/config/env.ts`)

Carrega configuração do `expo-constants`:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `API_BASE_URL` | `https://pj-assistant-bfa-go-production.up.railway.app` | URL base da API |
| `APP_ENV` | `development` | Ambiente (development/staging/production) |
| `REQUEST_TIMEOUT_MS` | 30.000 | Timeout HTTP em milissegundos |
