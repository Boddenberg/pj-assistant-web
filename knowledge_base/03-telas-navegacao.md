# Telas e Navegação — PJ Assistant

## Estrutura de Navegação

O app utiliza **expo-router** com file-based routing. A navegação principal é:

```
RootLayout (_layout.tsx)
├── AuthScreen (auth.tsx)                   ← Sem autenticação
└── Stack Navigator                          ← Autenticado
    ├── (tabs)/                              ← Bottom Tab Navigator
    │   ├── index.tsx        → Home (Início)
    │   ├── chat.tsx         → Assistente PJ (Chat)
    │   ├── metrics.tsx      → Observabilidade (Métricas)
    │   └── devtools.tsx     → DevTools
    ├── pix.tsx              → Pix Imediato
    ├── pix-scheduled.tsx    → Pix Agendado
    ├── pix-credit.tsx       → Pix no Crédito
    ├── pix-receipt.tsx      → Comprovante Pix
    ├── credit-card.tsx      → Cartão PJ
    ├── extrato.tsx          → Extrato Bancário
    ├── financial-summary.tsx → Análise Financeira
    ├── bill-payment.tsx     → Pagamento de Boleto
    ├── debit-purchase.tsx   → Compra no Débito
    └── barcode-scanner.tsx  → Scanner de Código de Barras
```

## Header Padrão

Todas as telas Stack possuem:
- Fundo laranja (`#EC7000`)
- Texto branco com ícone "logoDot" (ponto branco 10px)
- Botão "Voltar" automático
- Shadow desabilitado

## Bottom Tab Bar

4 abas principais:

| Aba | Ícone | Rota |
|-----|-------|------|
| Início | `home` / `home-outline` | `(tabs)/index` |
| Chat | `chatbubbles` / `chatbubbles-outline` | `(tabs)/chat` |
| Métricas | `pulse` / `pulse-outline` | `(tabs)/metrics` |
| DevTools | `construct` / `construct-outline` | `(tabs)/devtools` |

Tab ativa: ícone branco sobre fundo laranja (pill shape).

---

## Detalhamento das Telas

### 1. Autenticação (`auth.tsx`) — ~1191 linhas

**Fluxo multi-step:**

```
Welcome → Login (CPF + senha)
        → Cadastro Step 1 (CNPJ, Razão Social, Nome Fantasia)
        → Cadastro Step 2 (CPF do representante, Nome, Email, Telefone, Data Nascimento)
        → Cadastro Step 3 (Senha, Confirmação, Aceite de termos)
```

**Características:**
- Formatadores brasileiros (CNPJ, CPF, telefone, data)
- Componente `AuthInput` customizado com estados de foco, erro e toggle de senha
- Transições animadas entre etapas
- Persistência do último CPF usado (AsyncStorage)
- Salvamento de dados da empresa para sugestões de chave Pix

### 2. Home (`(tabs)/index.tsx`) — ~419 linhas

**Dashboard bancário principal:**
- **Cartão de saldo**: Gradiente com saldo atual, receitas e despesas do período
- **Ações rápidas**: Grid 2 colunas com 5 ações (Pix, Cartão PJ, Análise Financeira, Extrato, Pix no Crédito)
- **Botão AI**: Botão flutuante com animação pulsante que direciona ao Chat
- **Pull-to-refresh**: Invalida queries de financial e transactions
- **Logout**: Alerta de confirmação com opção destrutiva

**Dados consumidos:** `useFinancialSummary`, `useTransactionSummary`

### 3. Assistente IA (`(tabs)/chat.tsx`) — ~112 linhas

**Chat com IA:**
- FlatList invertida para mensagens
- `ChatBubble` para renderizar cada mensagem
- `TypingIndicator` durante resposta do assistente
- `EmptyChat` com sugestões rápidas quando não há mensagens
- `ChatInput` com teclado adaptativo
- Auto-scroll para última mensagem

**Store:** `useChatStore` (messages, sendMessage, isLoading, conversationId)

### 4. Observabilidade (`(tabs)/metrics.tsx`) — ~132 linhas

**Dashboard de monitoramento:**
- Banner de status geral (healthy/degraded/unhealthy)
- Seção "Saúde dos Serviços" com `HealthCard` por serviço
- Seção "Desempenho do Agente" com 8 `MetricTile`:
  - Latência Média, P95 Latência, Tokens/Req, Custo Estimado
  - Precisão RAG, Taxa de Erro, Total Requests, Cache Hit
- Pull-to-refresh

### 5. DevTools (`(tabs)/devtools.tsx`) — ~531 linhas

**Ferramentas de desenvolvimento:**
- Adicionar saldo na conta (via API)
- Gerar transações de teste
- Simular compras no cartão de crédito
- Invalidar cache do React Query
- Modal de resultados
- Feedback háptico

### 6. Pix Imediato (`pix.tsx`) — ~796 linhas

**Fluxo multi-step:**
```
Menu → Selecionar tipo de chave → Inserir chave → Valor → Confirmar → Sucesso
                                                          ↓
                                              Gerenciar chaves Pix
```

**Tipos de chave suportados:** CPF/CNPJ, E-mail, Telefone, Chave aleatória
- Lookup de destinatário antes da transferência
- Integração com clipboard (colar chave)
- Gerenciamento de chaves Pix próprias
- Navegação com botão voltar entre steps

### 7. Pix Agendado (`pix-scheduled.tsx`) — ~316 linhas

**Fluxo:** Input → Confirmar → Sucesso
- Seleção de data futura para agendamento
- Suporte a recorrência (semanal/mensal)
- Lookup de destinatário

### 8. Pix no Crédito (`pix-credit.tsx`) — ~342 linhas

**Fluxo:** Input → Confirmar → Sucesso
- Seleção de cartão de crédito ativo
- Parcelamento de 1 a 12x
- Lookup de destinatário por chave Pix

### 9. Comprovante Pix (`pix-receipt.tsx`) — ~333 linhas

**Comprovante de transferência:**
- Carrega receipt por `transferId` ou `receiptId` (URL params)
- Exibe detalhes completos (remetente, destinatário, valor, E2E ID, status, data)
- Compartilhamento como imagem via `react-native-view-shot` + `expo-sharing`

### 10. Cartão PJ (`credit-card.tsx`) — ~1235 linhas

**Tela mais complexa do app. Duas abas:**

**Aba "Meus Cartões":**
- Carousel horizontal com snap em cards visuais premium
- 4 temas de bandeira (Amex=escuro, Elo=prata, Mastercard=laranja, Visa=navy)
- Cada card: gradiente, chip com linhas, número mascarado, portador, logo da bandeira, tag "CORPORATE"
- Painel de detalhes: identificação do cartão, bloco financeiro (limites + barra de uso %), botões de ação
- Visualização de fatura com lista de transações
- Pagamento de fatura com seleção de valor
- Bloqueio/desbloqueio e cancelamento de cartão

**Aba "Disponíveis" (Ofertas):**
- Mini cards visuais com as bandeiras disponíveis
- Fluxo de contratação com seleção de bandeira e slider de limite
- Modal de confirmação

### 11. Extrato (`extrato.tsx`) — ~339 linhas

**Histórico de transações:**
- Lista de transações com ícone por tipo e cor por sinal do amount
- Pull-to-refresh com invalidação de cache
- Modal de detalhe ao tocar em uma transação
- Ícones específicos por tipo: Pix (swap-horizontal), Débito (card), Crédito (cart), Transferência (arrow), Boleto (barcode)

### 12. Análise Financeira (`financial-summary.tsx`) — ~684 linhas

**Dashboard financeiro:**
- Breakdown por categorias de gastos (Fornecedores, Salários, Impostos, Serviços, Marketing, etc.)
- Calendário mensal com indicadores de crédito/débito por dia
- Filtro por data com seleção no calendário
- Múltiplas fontes de dados: financial summary + transactions + credit cards

### 13. Pagamento de Boleto (`bill-payment.tsx`) — ~203 linhas

**Fluxo:** Input → Review → Sucesso
- 3 formas de entrada: digitação, colagem (clipboard), câmera (barcode-scanner)
- Validação de 47/48 dígitos
- Formatação da linha digitável
- Review com detalhes do boleto antes do pagamento

### 14. Compra no Débito (`debit-purchase.tsx`) — ~118 linhas

- Formulário: nome do estabelecimento + valor + descrição
- Validação de campos obrigatórios
- Exibe `SuccessSheet` ao completar

### 15. Scanner de Código de Barras (`barcode-scanner.tsx`) — ~92 linhas

- Placeholder visual (viewfinder com marcadores de canto)
- Dicas de uso (iluminação, código visível)
- Botão para digitar código manualmente
- Preparado para futura integração com `expo-camera`
