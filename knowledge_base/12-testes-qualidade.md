# Testes e Qualidade — PJ Assistant

## Framework de Testes

| Ferramenta | Versão | Uso |
|-----------|--------|-----|
| Jest | 29.7 | Test runner |
| jest-expo | ~54.0 | Preset para Expo/React Native |
| @testing-library/react-native | 12.4 | Renderização de componentes |
| @testing-library/jest-native | 5.4 | Matchers nativos |

## Configuração (`jest.config.js`)

- Preset: `jest-expo`
- Module aliases via `babel-plugin-module-resolver` (ex: `@/lib` → `src/lib`)

## Suítes de Teste

### 1. Barcode (`__tests__/barcode.test.ts`)
Testes para utilitários de código de barras:
- Validação de linha digitável (47 e 48 dígitos)
- Formatação de boleto bancário
- Formatação de concessionária
- Mascaramento de CPF e CNPJ
- Formatação de chaves Pix por tipo

### 2. Chat Store (`__tests__/chat-store.test.ts`)
Testes do Zustand store do chat:
- Envio de mensagem com sucesso
- Tratamento de erro na resposta
- Limpeza de conversa
- Descarte de erro
- Sanitização de input

### 3. Errors (`__tests__/errors.test.ts`)
Testes da hierarquia de erros:
- Classificação de erros retentáveis
- Identificação de erros que requerem re-auth
- Serialização JSON
- Todos os códigos de erro

### 4. HTTP Client (`__tests__/http-client.test.ts`)
Testes do cliente Axios:
- Existência do client
- Configuração de base URL
- Tratamento de timeout
- Normalização de erros de rede
- Normalização de erros HTTP (401, 403, 404, etc.)

### 5. Utils (`__tests__/utils.test.ts`)
Testes dos utilitários de formatação:
- `formatCurrency` — Formatação BRL
- `formatDate` — Data brasileira
- `sanitizeInput` — Sanitização de HTML/XSS
- `truncate` — Truncamento de texto
- `generateId` — Formato UUID

---

## Comandos

```bash
# Rodar todos os testes
npx jest

# Rodar com cache limpo
npx jest --no-cache

# Rodar em modo watch
npx jest --watch

# Forçar exit após conclusão
npx jest --forceExit
```

## Verificação de Tipos

```bash
# TypeScript check (sem emitir arquivos)
npx tsc --noEmit
```

## Estado Atual

- **5 suítes** de teste
- **41 testes** passando
- **0 erros** TypeScript
- Bundle compila com sucesso (~1047 módulos)
