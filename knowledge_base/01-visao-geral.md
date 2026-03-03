# Visão Geral do Sistema — PJ Assistant

## O que é o PJ Assistant

O PJ Assistant é uma aplicação mobile/web de banking digital para **Pessoa Jurídica (PJ)** do Itaú Unibanco. Ele combina funcionalidades bancárias completas com um **assistente inteligente (IA)** que utiliza RAG (Retrieval-Augmented Generation) para responder perguntas e auxiliar o cliente empresarial.

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework Mobile | Expo (React Native) | SDK 54 |
| Runtime | React | 19.1.0 |
| Linguagem | TypeScript | 5.6+ |
| Navegação | expo-router | 6.x |
| Estado servidor | TanStack React Query | 5.60+ |
| Estado cliente | Zustand | 5.x |
| HTTP | Axios | 1.7+ |
| Backend | Go (API REST) | — |
| Hosting Backend | Railway | — |

## Arquitetura Geral

```
┌─────────────────────────────────────────────┐
│                 Frontend (Expo)              │
│  ┌──────┐ ┌──────────┐ ┌────────────────┐   │
│  │Stores│ │  Hooks   │ │   Screens      │   │
│  │Zustand│ │React Query│ │ (expo-router) │   │
│  └──┬───┘ └─────┬────┘ └───────┬────────┘   │
│     │           │               │            │
│     └─────┬─────┘               │            │
│           ▼                     │            │
│     ┌──────────┐                │            │
│     │ Services │◄───────────────┘            │
│     └────┬─────┘                             │
│          ▼                                   │
│   ┌─────────────┐                            │
│   │ HTTP Client │  (Axios + interceptors)    │
│   └──────┬──────┘                            │
└──────────┼───────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────┐
│         Backend (Go — Railway)               │
│   API REST v1 + AI Agent + RAG Engine        │
│   Base: pj-assistant-bfa-go-production       │
│         .up.railway.app                      │
└──────────────────────────────────────────────┘
```

## Princípios Arquiteturais

1. **Frontend sem lógica de negócio**: O frontend é um thin client — toda lógica (cálculos financeiros, validações, scoring, regras) reside no backend. O front apenas exibe dados recebidos da API.
2. **Services como passthrough**: Cada service faz chamadas HTTP e retorna os dados sem processamento.
3. **Stores para estado efêmero**: Zustand gerencia estado local temporário (fluxos multi-step, dados de formulário). Dados persistentes ficam no backend.
4. **Hooks como wrappers**: Os React Query hooks encapsulam as chamadas aos services com cache inteligente, retry e invalidação.
5. **Tipagem forte**: Todas as interfaces da API são tipadas com TypeScript readonly.

## Funcionalidades Principais

| Funcionalidade | Descrição |
|---------------|-----------|
| **Autenticação** | Login com CPF + senha eletrônica, cadastro em 3 etapas |
| **Home** | Dashboard com saldo, receitas/despesas, ações rápidas |
| **Pix** | Transferência imediata, agendada, via cartão de crédito |
| **Cartão PJ** | Carousel visual, 4 bandeiras, faturas, solicitação |
| **Extrato** | Histórico de transações com detalhamento |
| **Análise Financeira** | Dashboard com categorias e calendário |
| **Pagamento de Boleto** | Digitação, colagem ou scan de código de barras |
| **Compra no Débito** | Simulação de compra no débito |
| **Assistente IA** | Chat com RAG, sugestões, métricas do agente |
| **Observabilidade** | Health check dos serviços, métricas de latência |
| **DevTools** | Ferramentas de teste (add saldo, gerar transações) |

## Estrutura de Pastas

```
pj-assistant-web/
├── app/                    # Telas (expo-router file-based routing)
│   ├── (tabs)/             # Navegação por abas (Home, Chat, Métricas, DevTools)
│   ├── auth.tsx            # Tela de autenticação
│   ├── pix.tsx             # Pix imediato
│   ├── pix-scheduled.tsx   # Pix agendado
│   ├── pix-credit.tsx      # Pix no crédito
│   ├── pix-receipt.tsx     # Comprovante Pix
│   ├── credit-card.tsx     # Cartão PJ
│   ├── extrato.tsx         # Extrato bancário
│   ├── financial-summary.tsx # Análise financeira
│   ├── bill-payment.tsx    # Pagamento de boleto
│   ├── debit-purchase.tsx  # Compra no débito
│   ├── barcode-scanner.tsx # Scanner de código de barras
│   └── _layout.tsx         # Layout raiz (Stack + providers)
├── src/
│   ├── components/         # Componentes reutilizáveis (UI, Chat, Metrics)
│   ├── config/             # Configuração de ambiente (API URL, timeout)
│   ├── hooks/              # React Query hooks
│   ├── lib/                # Utilitários (HTTP, erros, formatação, barcode)
│   ├── services/           # Camada de serviços (API calls)
│   ├── stores/             # Zustand stores (auth, chat, pix, etc.)
│   ├── theme/              # Design tokens (cores, espaçamentos, tipografia)
│   ├── types/              # Interfaces TypeScript
│   └── __tests__/          # Testes unitários (Jest)
└── docs/                   # Documentação
```
