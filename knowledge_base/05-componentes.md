# Componentes Reutilizáveis — PJ Assistant

## Organização

```
src/components/
├── ui/           # Componentes de interface genéricos
├── chat/         # Componentes do assistente IA
└── metrics/      # Componentes de observabilidade
```

---

## Componentes UI (`src/components/ui/`)

### Card
Container estilizado com fundo branco, bordas arredondadas e sombra.
Usado em diversas telas para agrupar conteúdo.

### ActionButton
Botão de ação com variantes visuais (primário=laranja, secundário=branco).
Suporte a ícone, loading state e desabilitado.

### AmountInput
Campo de entrada de valor monetário formatado em BRL (R$).
Máscara automática, teclado numérico, exibição em formato brasileiro.

### InputField
Campo de texto estilizado com:
- Label flutuante
- Estado de foco (borda laranja)
- Estado de erro com mensagem
- Ícone opcional
- Suporte a multiline

### StatusBadge
Badge colorido para exibir status (ativo, bloqueado, cancelado, etc.).
Cores semânticas: verde=ativo, vermelho=cancelado, amarelo=pendente.

### SuccessSheet
Bottom sheet de confirmação de sucesso com:
- Ícone de check animado
- Título e mensagem
- Botão de ação (geralmente "Voltar" ou "Ver comprovante")

---

## Componentes Chat (`src/components/chat/`)

### ChatBubble
Bolha de mensagem do chat com estilo diferenciado:
- **Usuário**: Fundo laranja (`#EC7000`), texto branco, alinhado à direita
- **Assistente**: Fundo branco, texto escuro, alinhado à esquerda
- Exibe metadata (RAG sources, latência) quando disponível

### ChatInput
Campo de entrada de texto para o chat com:
- Botão de envio integrado
- Teclado adaptativo (KeyboardAvoidingView)
- Placeholder contextual

### TypingIndicator
Indicador de "digitando..." com animação de 3 pontos pulsantes.
Exibido enquanto o assistente processa a resposta.

### EmptyChat
Tela vazia do chat com:
- Ícone ilustrativo
- Mensagem de boas-vindas
- Chips de sugestões rápidas (ex: "Qual meu saldo?", "Me explique sobre Pix")

---

## Componentes Metrics (`src/components/metrics/`)

### HealthCard
Card individual de saúde de um serviço backend.
Exibe: nome do serviço, status (healthy/degraded/unhealthy), latência, uptime.
Cor de fundo baseada no status.

### MetricTile
Tile compacto para exibir uma métrica numérica.
Exibe: label, valor formatado, unidade.
Usado em grid 2x4 no dashboard de métricas.

### SectionHeader
Cabeçalho de seção com título em destaque.
Usado para separar blocos no dashboard de métricas.

---

## Componentes Inline (dentro das telas)

Alguns componentes existem apenas dentro de telas específicas:

### CorporateCardVisual (credit-card.tsx)
Card visual premium com:
- `LinearGradient` como fundo (3 cores por bandeira)
- Chip com linhas horizontais e ícone contactless
- Número mascarado (`•••• •••• •••• 1234`)
- Nome do portador com label "PORTADOR"
- Tag "CORPORATE" no canto superior direito
- Logo da bandeira no canto inferior direito
- Logo "itaú PJ" no canto inferior esquerdo
- Barra de acento colorida na parte inferior

### CardDetailPanel (credit-card.tsx)
Painel de detalhes abaixo do carousel com:
- Cabeçalho com dot colorido + nome do cartão
- Seção de identificação (portador, bandeira, tipo, vencimento, fechamento)
- Bloco financeiro com grid de limites + barra de uso %
- Botões de ação (Ver Fatura, Cartão Virtual, Bloquear, Cancelar)

### AuthInput (auth.tsx)
Campo de texto para o fluxo de autenticação com:
- Animação de foco
- Toggle de visibilidade de senha
- Validação inline com mensagem de erro
- Formatação automática (CPF, CNPJ, telefone, data)
