# Assistente IA e RAG — PJ Assistant

## Visão Geral

O PJ Assistant integra um **agente inteligente** baseado em IA que utiliza **RAG (Retrieval-Augmented Generation)** para responder perguntas dos clientes PJ. O agente roda no backend Go e o frontend é uma interface de chat.

---

## Arquitetura do Assistente

```
┌─────────────────────────────────────┐
│           Frontend (Chat)           │
│  ┌───────────┐  ┌────────────────┐  │
│  │ ChatStore │  │ ChatInput      │  │
│  │ (Zustand) │  │ ChatBubble     │  │
│  │           │  │ TypingIndicator│  │
│  │           │  │ EmptyChat      │  │
│  └─────┬─────┘  └────────────────┘  │
│        │                            │
│        ▼                            │
│  ┌──────────────────┐               │
│  │ assistantService  │              │
│  │ POST /v1/assistant│              │
│  └────────┬─────────┘               │
└───────────┼─────────────────────────┘
            ▼
┌──────────────────────────────────────┐
│         Backend (Go)                 │
│  ┌──────────────────────────────┐    │
│  │        AI Agent              │    │
│  │  ┌────────┐  ┌──────────┐   │    │
│  │  │  LLM   │  │ RAG      │   │    │
│  │  │        │  │ Engine   │   │    │
│  │  └────────┘  └──────────┘   │    │
│  │  ┌────────┐  ┌──────────┐   │    │
│  │  │ Tools  │  │ Knowledge│   │    │
│  │  │ (funcs)│  │ Base     │   │    │
│  │  └────────┘  └──────────┘   │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

---

## Fluxo de Comunicação

1. **Usuário digita mensagem** no `ChatInput`
2. **ChatStore.sendMessage()** é chamado:
   - Sanitiza o input (previne XSS/prompt injection)
   - Cria mensagem local do usuário com UUID e timestamp
   - Adiciona ao array `messages`
   - Seta `isLoading: true`
3. **assistantService.chat()** envia POST para `/v1/assistant/{customerId}`
4. **Backend processa**:
   - Consulta knowledge base via RAG
   - Executa tools se necessário (consulta saldo, transações, etc.)
   - Gera resposta via LLM
5. **Response retorna** com:
   - `conversationId` — ID da conversa para contexto
   - `message` — Mensagem do assistente com metadata
   - `profile` — Perfil do cliente (opcional)
   - `transactions` — Transações relevantes (opcional)
6. **ChatStore atualiza** com a resposta e `isLoading: false`

---

## Interface de Chat

### Tela de Chat (`app/(tabs)/chat.tsx`)

- **FlatList** com scroll automático para última mensagem
- **ChatBubble**: Renderiza mensagens com estilo diferenciado por role
- **TypingIndicator**: 3 pontos pulsantes durante `isLoading`
- **EmptyChat**: Estado vazio com sugestões de perguntas
- **ChatInput**: Campo de texto com botão de envio
- **KeyboardAvoidingView**: Adapta layout ao teclado

### Sugestões do EmptyChat

Chips clicáveis com perguntas frequentes para iniciar a conversa:
- Exemplos: "Qual meu saldo?", "Me explique sobre Pix", etc.

---

## Metadata da Resposta

Cada resposta do assistente inclui metadata detalhada:

### Tools Used
Lista de ferramentas/funções que o agente chamou para responder:
- Ex: `["balance_check"]`, `["transaction_history", "financial_summary"]`

### RAG Sources
Documentos da knowledge base consultados:
```json
{
  "documentId": "doc-uuid",
  "title": "Título do documento",
  "relevanceScore": 0.95,
  "snippet": "Trecho relevante do documento..."
}
```

### Token Usage
Consumo de tokens da LLM:
- `promptTokens` — Tokens no prompt
- `completionTokens` — Tokens na resposta
- `totalTokens` — Total
- `estimatedCostUsd` — Custo estimado em USD

### Latência
- `latencyMs` — Tempo total de resposta em milissegundos

---

## Observabilidade do Agente

### Dashboard de Métricas (`app/(tabs)/metrics.tsx`)

Monitora performance do agente em tempo real:

| Métrica | Descrição |
|---------|-----------|
| Latência Média | Tempo médio de resposta |
| P95 Latência | 95º percentil de latência |
| P99 Latência | 99º percentil de latência |
| Tokens / Request | Média de tokens por requisição |
| Custo Estimado | Custo acumulado em USD |
| Precisão RAG | Acurácia do retrieval |
| Taxa de Erro | Porcentagem de erros |
| Cache Hit | Taxa de acerto de cache |
| Taxa de Fallback | Porcentagem de respostas fallback |
| Total Requests | Total de requisições ao agente |

### Health Check

Endpoint `/healthz` retorna status de cada serviço:
- Status: `healthy`, `degraded`, `unhealthy`
- Latência de cada serviço
- Uptime percentual
- Último check

---

## Tratamento de Erros no Chat

| Erro | Código | Mensagem |
|------|--------|----------|
| Sem conexão | `NETWORK` | "Sem conexão com o servidor." |
| Timeout | `TIMEOUT` | "A requisição excedeu o tempo limite." |
| Timeout do agente | `AGENT_TIMEOUT` | Retentável |
| Erro do agente | `AGENT_ERROR` | — |
| RAG sem resultado | `RAG_NO_RESULTS` | — |
| Genérico | `UNKNOWN` | "Erro inesperado." |

Erros são armazenados no `ChatStore.error` e podem ser descartados via `dismissError()`.
