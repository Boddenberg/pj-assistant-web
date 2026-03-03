# Decisões Arquiteturais e Princípios — PJ Assistant

## Decisões Chave

### 1. Frontend sem lógica de negócio

**Decisão:** O frontend é um thin client puro — ZERO lógica de negócio, cálculos financeiros, validações de regras ou classificações.

**Motivação:** Auditoria completa removeu 32 itens de lógica de negócio de 7+ arquivos. Exemplos removidos:
- Classificação de crédito/débito por tipo de transação (agora usa sinal do `amount`)
- Cálculos de limite disponível de cartão (agora vem do backend `availableLimit`)
- Filtros locais de transações (agora via query params no backend)
- Ofertas de cartão hardcoded (agora vem do backend)
- Overrides via AsyncStorage (brand, limit, status de cartões)
- Cálculos de netCashFlow e limites alocados

**Regra:** Se é um cálculo, classificação ou regra de negócio → pertence ao backend.

### 2. Zustand para estado efêmero, React Query para servidor

**Decisão:** Separação clara entre estado do servidor (React Query) e estado do cliente (Zustand).

**React Query gerencia:** dados da API, cache, retry, invalidação, refetch  
**Zustand gerencia:** fluxos multi-step, formulários, sessão do usuário, chat messages

**Motivação:** Evitar cache stale de dados financeiros, garantir que o backend é sempre a fonte da verdade.

### 3. Services como passthrough puro

**Decisão:** Cada service é um objeto `const` com métodos `async` que fazem uma chamada HTTP e retornam o response diretamente.

**Motivação:** Eliminar qualquer tentação de adicionar lógica nos services. O único processamento permitido é unwrap de wrappers do backend (`{ cards: [...] }` → `[...]`).

### 4. HTTP Client centralizado

**Decisão:** Um único `httpClient` (Axios) importado por todos os services.

**Motivação:** 
- Ponto único para interceptors (X-Request-ID, normalização de erros)
- Configuração centralizada (base URL, timeout)
- Facilita testes e mocks

### 5. Error hierarchy tipada

**Decisão:** Todos os erros de rede são convertidos em `AppError` com `ErrorCode` semântico.

**Motivação:** 
- UI pode tratar erros de forma granular (retentável? requer auth? mostrar modal?)
- Logs estruturados
- Consistência em todo o app

### 6. File-based routing (expo-router)

**Decisão:** Usar expo-router com rotas baseadas em arquivo.

**Motivação:**
- Navegação declarativa via estrutura de pastas
- Type-safe routing com `typedRoutes: true`
- Suporte nativo a tabs, stack, modals

### 7. Design tokens centralizados

**Decisão:** Todas as cores, espaçamentos, tipografia e sombras definidos em `src/theme/tokens.ts`.

**Motivação:**
- Single source of truth para design
- Fácil de manter consistência visual
- Alterações globais em um único arquivo

---

## Padrões de Código

### Nomenclatura
- **Arquivos**: kebab-case (`credit-card.service.ts`, `use-credit-cards.ts`)
- **Componentes**: PascalCase (`ActionButton`, `ChatBubble`)
- **Hooks**: camelCase com `use` prefix (`useCreditCards`, `useAuthStore`)
- **Stores**: camelCase com `use` prefix (`useAuthStore`, `useChatStore`)
- **Services**: camelCase (`creditCardService`, `pixService`)
- **Types**: PascalCase (`CreditCard`, `PixTransferRequest`)
- **Enums/unions**: PascalCase tipo, lowercase valores (`CreditCardBrand = 'visa' | 'mastercard'`)

### Imports
- Path alias `@/` aponta para `src/`
- Imports de types usam `import type` para tree-shaking
- Cada domínio tem barrel export (`index.ts`)

### Estilização
- `StyleSheet.create()` para todos os estilos
- Design tokens importados de `@/theme`
- Inline styles apenas para valores dinâmicos
- Sem CSS-in-JS ou styled-components

### Imutabilidade
- Interfaces com `readonly` em todos os campos
- Services como `const` com `as const`
- Stores com Zustand immutable pattern

---

## Anti-patterns evitados

1. **Sem lógica de negócio no front** — Mesmo que pareça simples (ex: `limit - usedLimit`)
2. **Sem dados hardcoded** — Ofertas, taxas, limites vêm do backend
3. **Sem AsyncStorage como banco de dados** — Apenas para sessão e preferências
4. **Sem estado derivado calculado** — Backend fornece dados prontos para exibição
5. **Sem filtros locais em listas** — Filtragem via query params no backend
6. **Sem manipulação de status** — Status de cartões/transações é read-only do backend
