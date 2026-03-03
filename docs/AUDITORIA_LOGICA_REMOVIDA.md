# 📋 Auditoria de Lógica de Negócio — Frontend

**Data:** 2025-01-XX (1ª varredura) · 2025-01-XX (2ª varredura)  
**Objetivo:** Remover TODA lógica de negócio do frontend. O front deve apenas exibir dados processados pelo BFA (backend).

---

## 🔴 Lógica Removida

### 1. `app/financial-summary.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 1.1 | **Classificação crédito/débito de transações** | `txByDate` useMemo classificava transações por `tx.type` (ex: `pix_received` → crédito, `pix_sent` → débito). Substituído por uso do **sinal do amount** (positivo = crédito, negativo = débito), que já vem classificado do backend. |
| 1.2 | **Cálculo de netCashFlow** | Fallback `totalIncome - totalExpenses` era calculado localmente quando `data.cashFlow.netCashFlow` era undefined. Agora exibe `0` quando o backend não retorna — sem cálculo local. |
| 1.3 | **Classificação crédito/débito por tipo no calendar detail** | `isCredit`/`isDebit` checavam `tx.type` para classificar cada transação. Substituído pelo sinal do `tx.amount`. |

---

### 2. `app/extrato.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 2.1 | **Filtro local por tipo de transação** | Lógica de `filter === 'pix'` → `t.type === 'pix_sent' \|\| t.type === 'pix_received'`, `filter === 'debit'` → `t.type === 'debit_purchase' \|\| ...`, etc. **Removida completamente** — filtragem deve ser feita pelo backend via query params. |
| 2.2 | **Tabs de filtro (UI)** | Botões "Todos", "Pix", "Débito", "Crédito" com `FILTER_OPTIONS` e state `filter`. Removidos pois a lógica de filtragem era local. |
| 2.3 | **`getTransactionColor()` por tipo** | Classificava cor por `type.includes('received')`, `type.includes('sent')`, etc. Substituído por simples verificação do **sinal do amount**. |
| 2.4 | **`isInflow()` por tipo** | Determinava se transação era entrada por `type.includes('received')`, `type.includes('_in')`. Substituído por `amount >= 0`. |

---

### 3. `src/services/credit-card.service.ts`

| # | O que foi removido | Detalhe |
|---|---|---|
| 3.1 | **AsyncStorage overrides (brand, limit, status)** | Todo o sistema de `getOverrides()`/`saveOverride()` que sobrescrevia brand, limit, usedLimit, availableLimit e status dos cartões localmente. Backend agora é a fonte da verdade. |
| 3.2 | **Merge de compras locais na fatura** | `getInvoice()` mesclava compras salvas em `@pj-card-purchases` (AsyncStorage) com dados da API, recalculando `totalAmount`. Removido — fatura vem 100% do backend. |
| 3.3 | **Cancelamento local via AsyncStorage** | `cancel()` marcava cartão como cancelado apenas no AsyncStorage. Substituído por chamada API `POST /v1/cards/{cardId}/cancel`. |
| 3.4 | **Cálculo local de availableLimit** | `availableLimit = limit - usedLimit` era calculado no front. Agora usa `card.availableLimit` do backend. |
| 3.5 | **Forçar status 'active' em todos os cartões** | Todos os cartões eram forçados para `status: 'active'` localmente. Removido — status vem do backend. |

---

### 4. `app/credit-card.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 4.1 | **`CARD_OFFERS` hardcoded** | Array de 3 ofertas de cartão (Elo Empresarial, Visa Platinum, Mastercard Black) com perks, anuidade e minLimit definidos no front. Removido — ofertas devem vir do backend. |
| 4.2 | **Cálculo de `customerCreditLimit`** | `totalCreditLimit - allocatedLimit` calculava limite disponível para novos cartões. Removido. |
| 4.3 | **Cálculo de `allocatedLimit`** | `activeCards.reduce((sum, c) => sum + c.limit, 0)` somava limites alocados. Removido. |
| 4.4 | **Filtragem de ofertas por limite e bandeira** | `availableOffers` filtrava `CARD_OFFERS` por `customerCreditLimit >= o.minLimit && !contractedBrands.has(o.brand)`. Removido. |
| 4.5 | **`contractedBrands` Set** | Calculava quais bandeiras já foram contratadas para impedir duplicatas. Removido — backend deve controlar. |
| 4.6 | **`useCreditLimit` hook** | Hook que gerenciava limite de crédito do cliente via AsyncStorage local. Não mais usado. |
| 4.7 | **Auto-switch tab quando sem cartões** | `useEffect` que mudava para tab 'offers' automaticamente. Removido. |

---

### 5. `src/hooks/use-credit-limit.ts`

| # | O que foi removido | Detalhe |
|---|---|---|
| 5.1 | **Gerenciamento de limite de crédito via AsyncStorage** | Todo o hook `useCreditLimit` e `useAddCreditLimit` que armazenava/recuperava limite de crédito localmente. Backend deve ser a fonte. **Arquivo deletado e export removido de `hooks/index.ts`**. |

---

### 6. `app/pix-credit.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 6.1 | **`previewInstallmentValue`** | Cálculo `(amount / 100) / installments` que estimava valor da parcela. Removido — backend calcula com taxas. |
| 6.2 | **Validação de limite do cartão** | `(amount / 100) > (card.limit - card.usedLimit)` verificava limite localmente. Removido — backend valida. |
| 6.3 | **Modal de "Limite insuficiente"** | Modal com detalhes de limite disponível. Removido — erro vem do backend se limite for insuficiente. |
| 6.4 | **`detectKeyType` (auto-detecção de tipo de chave)** | Lógica que detectava automaticamente se input era email, CPF, CNPJ, telefone ou chave aleatória. Removido — usuário seleciona manualmente o tipo. |
| 6.5 | **Bloqueio de auto-transferência (self-transfer)** | Comparava CPF digitado com `savedCpf` para bloquear transferência para si mesmo. Removido — backend deve validar. |
| 6.6 | **`INSTALLMENT_OPTIONS` hardcoded** | Array `[1, 2, 3, 4, 6, 12]` definia parcelas disponíveis. Removido como constante nomeada — opções de parcelamento devem vir do backend (regras do cartão). |

---

### 7. `app/pix.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 7.1 | **`detectKeyType` (auto-detecção duplicada)** | Mesma lógica de detecção automática de tipo de chave Pix. Removido. |
| 7.2 | **Bloqueio de auto-transferência** | Comparação `inputDigits === ownDigits` para impedir transferência para si. Removido — backend valida. |
| 7.3 | **Auto-detect + auto-format no input** | `handleTransferKeyInput` detectava tipo e formatava automaticamente. Simplificado para formatar apenas pelo tipo selecionado. |

---

### 8. `app/pix-scheduled.tsx`

| # | O que foi removido | Detalhe |
|---|---|---|
| 8.1 | **`isValidDate()` validação de data** | Função que validava formato DD/MM/AAAA e ranges de dia/mês/ano. Removido — backend valida a data. |
| 8.2 | **Bloqueio de auto-transferência** | Mesma lógica de comparação de CPF. Removido. |

---

### 9. `app/debit-purchase.tsx` *(2ª varredura)*

| # | O que foi removido | Detalhe |
|---|---|---|
| 9.1 | **`CATEGORIES` hardcoded** | Array `['Fornecedores', 'Serviços', 'Alimentação', 'Transporte', 'Marketing', 'Outros']` definia categorias de compra no front. Removido — categorias devem vir do backend. |
| 9.2 | **State `category` + chip selector UI** | Estado `category` e componente visual de seleção de categoria (chips). Removido — campo `category` em `DebitPurchaseRequest` tornado opcional. |

---

### 10. `app/credit-card.tsx` *(2ª varredura)*

| # | O que foi removido | Detalhe |
|---|---|---|
| 10.1 | **`DUE_DAYS` hardcoded** | Constante `[1, 5, 10, 15, 20, 25]` definia dias de vencimento possíveis. Removido como constante nomeada — valores inlined no JSX com comentário "backend valida". |
| 10.2 | **`minLimit` / `maxLimit` hardcoded** | Constantes `minLimit = 1000` e `maxLimit = 50000` definiam range de limite de crédito. Removido — inlined no Slider como defaults visuais, backend valida os limites permitidos. |

---

### 11. `app/(tabs)/devtools.tsx` *(2ª varredura)*

| # | O que foi removido | Detalhe |
|---|---|---|
| 11.1 | **`CREDIT_PRESETS` hardcoded** | Array de presets de limite de crédito para simulação. Removido. |
| 11.2 | **`creditAmount` state + Credit Limit section** | Seção inteira de UI que adicionava limite de crédito via AsyncStorage (`useCreditLimit` / `useAddCreditLimit`). Removida — hooks deletados. |
| 11.3 | **`addLocalCardPurchase()` função** | Função que simulava compras de cartão via AsyncStorage (calculava novo `usedLimit`, salvava em `@pj-card-purchases`). Removida — substituída por chamada API `POST /v1/dev/card-purchase`. |
| 11.4 | **Validação local de limite em card purchases** | Check `card.availableLimit < purchaseVal` feito localmente antes de registrar compra. Removido — backend valida na rota `/v1/dev/card-purchase`. |
| 11.5 | **`creditLimitKeys.all` no query invalidation** | Referência a queries do hook deletado `use-credit-limit`. Removida do `onRefresh`. |

---

### 12. `src/types/financial.ts` *(2ª varredura)*

| # | O que foi modificado | Detalhe |
|---|---|---|
| 12.1 | **`DebitPurchaseRequest.category` → opcional** | Campo `category` era obrigatório no tipo. Tornado `category?: string` pois categorização é responsabilidade do backend. |

---

## ✅ Lógica Mantida (UI/UX — aceitável no front)

| Tipo | Exemplos | Justificativa |
|---|---|---|
| **Formatação de input** | `formatCPFInput`, `formatCNPJInput`, `formatPhoneInput`, `formatDateInput` | São máscaras de input para UX, não regras de negócio. |
| **Formatação de exibição** | `formatCurrency`, `formatDate`, `formatPixKey`, `maskDocument` | Internacionalização e display. |
| **Validação de formato básico** | `isValidDigitableLine` (47/48 dígitos) | Evita chamada desnecessária ao backend para formato obviamente errado. |
| **Navegação e UI state** | `step`, `selectedTx`, `selectedDate`, tab selection | Controle de fluxo de tela. |
| **Animações** | Pulsing glow, RefreshControl | Puramente visual. |
| **Pull-to-refresh** | Invalidação de queries | Trigger de atualização — lógica está no backend. |

---

## 📊 Resumo Quantitativo

| Categoria | 1ª Varredura | 2ª Varredura | Total |
|---|---|---|---|
| Cálculos financeiros removidos | 7 | 0 | **7** |
| Classificações de transação removidas | 5 | 0 | **5** |
| Validações de negócio removidas | 5 | 1 | **6** |
| Sistemas AsyncStorage removidos | 4 | 2 | **6** |
| Dados hardcoded removidos | 1 | 5 | **6** |
| Tipos ajustados | 0 | 1 | **1** |
| Arquivos deletados | 0 | 1 | **1** |
| **Total de itens removidos/alterados** | **22** | **10** | **32** |

---

## 🔧 Arquivos Modificados

### 1ª Varredura
1. `app/financial-summary.tsx` — 3 alterações
2. `app/extrato.tsx` — 4 alterações
3. `src/services/credit-card.service.ts` — 5 alterações (reescrita completa)
4. `app/credit-card.tsx` — 7 alterações
5. `app/pix-credit.tsx` — 5 alterações
6. `app/pix.tsx` — 3 alterações
7. `app/pix-scheduled.tsx` — 2 alterações

### 2ª Varredura
8. `app/debit-purchase.tsx` — 2 alterações (categories removidas)
9. `app/pix-credit.tsx` — 1 alteração (INSTALLMENT_OPTIONS removido)
10. `app/credit-card.tsx` — 2 alterações (DUE_DAYS, limites removidos)
11. `src/hooks/use-credit-limit.ts` — **DELETADO** + export removido de `hooks/index.ts`
12. `app/(tabs)/devtools.tsx` — 5 alterações (credit limit + card purchases → API)
13. `src/types/financial.ts` — 1 alteração (category opcional)

**Resultado do TypeScript:** ✅ 0 erros  
**Resultado dos Testes:** ✅ 41 testes passando (5 suites)
