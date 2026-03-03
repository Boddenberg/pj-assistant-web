# Fluxos Bancários — PJ Assistant

## Fluxo de Autenticação

### Login
```
1. Tela Welcome → Toque "Acessar Conta"
2. Input CPF (formatado ###.###.###-##) + Senha (6 dígitos)
3. authService.login({ cpf, password })
4. Response: accessToken, refreshToken, customerId, names
5. authStore.setAuthenticated(data) → salva no AsyncStorage
6. customerStore.setCustomerId(id)
7. Navega para Home (tabs)
```

### Cadastro
```
Step 1: CNPJ + Razão Social + Nome Fantasia + Email
Step 2: CPF representante + Nome + Telefone + Data nascimento
Step 3: Senha + Confirmação + Aceite de termos
→ authService.register(data)
→ Response: customerId, agência, conta
→ Auto-login com os dados cadastrados
```

### Restauração de Sessão (Hydrate)
```
App init → authStore.hydrate()
→ AsyncStorage.getItem('@itau_pj_auth')
→ Se tem tokens válidos: setAuthenticated + setCustomerId
→ Se não: mostra tela de auth
```

---

## Fluxo de Pix Imediato

```
1. Menu Pix → Selecionar "Transferir"
2. Escolher tipo de chave (CPF/CNPJ, Email, Telefone, Aleatória)
3. Digitar chave Pix (ou colar do clipboard)
4. pixStore.lookupKey(key, keyType)
5. Exibir dados do destinatário (nome, banco, agência, conta)
6. Inserir valor (AmountInput) + descrição opcional
7. Tela de confirmação com todos os dados
8. pixStore.transfer(customerId, key, keyType, amount, description)
9. Sucesso: exibe comprovante com E2E ID
   → Opção "Ver Comprovante" navega para /pix-receipt
```

## Fluxo de Pix Agendado

```
1. Escolher tipo de chave + inserir chave
2. Lookup de destinatário
3. Inserir valor + data futura + recorrência (opcional)
4. Confirmação
5. pixStore.schedule(...)
6. Sucesso com dados do agendamento
```

## Fluxo de Pix no Crédito

```
1. Inserir chave Pix + tipo + valor
2. Lookup de destinatário
3. Selecionar cartão de crédito (lista de cartões ativos)
4. Escolher número de parcelas (1x a 12x)
5. Confirmação (exibe valor total e parcelas)
6. pixStore.transferWithCreditCard(...)
7. Sucesso
```

---

## Fluxo de Cartão de Crédito

### Visualização
```
1. Navegar para /credit-card
2. Aba "Meus Cartões": Carousel horizontal de cards visuais
3. Cada card exibe: bandeira, últimos 4 dígitos, portador, tag CORPORATE
4. Abaixo do carousel: painel de detalhes do cartão selecionado
   - Identificação (portador, bandeira, tipo, vencimento, fechamento)
   - Financeiro (limite total, usado, disponível, barra de %)
   - Ações (Ver Fatura, Cartão Virtual, Bloquear, Cancelar)
```

### Solicitar Novo Cartão
```
1. Aba "Disponíveis" → Selecionar bandeira desejada
2. Modal de contratação com slider de limite
3. useRequestCreditCard().mutateAsync({ customerId, preferredBrand, requestedLimit })
4. Response: approved/denied/under_review
5. Se aprovado: cartão aparece na aba "Meus Cartões"
```

### Ver Fatura
```
1. Tocar "Ver Fatura" no painel de detalhes
2. useCreditCardInvoice(cardId, month) → carrega transações
3. Lista de transações da fatura com datas, valores, categorias
4. Opção "Pagar Fatura" com escolha de valor (total ou parcial)
```

### Cancelar Cartão
```
1. Tocar "Cancelar" no painel de ações
2. Alert de confirmação (ação destrutiva)
3. useCancelCreditCard().mutateAsync({ cardId, customerId })
4. Invalida cache → cartão removido da lista
```

---

## Fluxo de Pagamento de Boleto

```
1. Navegar para /bill-payment
2. Inserir código de barras:
   a) Digitar manualmente (47-48 dígitos)
   b) Colar do clipboard
   c) Escanear com câmera (→ /barcode-scanner)
3. billPaymentStore.validateBarcode(barcode)
4. Se válido: review com detalhes (beneficiário, valor, vencimento)
5. billPaymentStore.pay(customerId, barcode, inputMethod)
6. Sucesso com comprovante (authentication code)
```

---

## Fluxo de Extrato

```
1. Navegar para /extrato
2. useTransactions(customerId) → lista de transações
3. Cada transação: ícone por tipo, valor colorido (verde=entrada, vermelho=saída)
4. Tocar em transação → modal de detalhe
5. Pull-to-refresh → invalidar cache
```

---

## Fluxo de Análise Financeira

```
1. Navegar para /financial-summary
2. useFinancialSummary(customerId) → dados agregados
3. Dashboard: saldo, receitas, despesas, fluxo de caixa
4. Breakdown por categorias (Fornecedores, Salários, Impostos, etc.)
5. Calendário mensal com indicadores de crédito/débito por dia
6. Selecionar data no calendário → filtrar transações daquele dia
```

---

## Fluxo de Compra no Débito

```
1. Navegar para /debit-purchase
2. Preencher: nome do estabelecimento + valor + descrição (opcional)
3. financialService.debitPurchase({ customerId, merchantName, amount })
4. Response: completed/failed/insufficient_funds
5. Sucesso: SuccessSheet com novo saldo
```

---

## Fluxo do Assistente IA

```
1. Aba "Chat" → EmptyChat com sugestões
2. Digitar pergunta ou tocar sugestão
3. chatStore.sendMessage(customerId, message)
   → Sanitiza input
   → Cria mensagem local do usuário
   → Seta isLoading = true
   → assistantService.chat(customerId, message, conversationId)
4. TypingIndicator exibido durante loading
5. Response com mensagem + metadata (RAG sources, tokens, latência)
6. Mensagem do assistente adicionada ao chat
7. Auto-scroll para última mensagem
```

---

## Fluxo de Logout

```
1. Home → Ícone de logout no header
2. Alert: "Deseja realmente sair da sua conta?"
3. Se "Sair":
   → customerStore.clear()
   → authStore.logout()
   → AsyncStorage remove '@itau_pj_auth'
   → App volta para tela de AuthScreen
```
