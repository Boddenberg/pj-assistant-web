# Dependências e Configuração — PJ Assistant

## Dependências de Produção

### Core
| Pacote | Versão | Função |
|--------|--------|--------|
| `expo` | ~54.0.0 | Framework mobile |
| `react` | ^19.1.0 | UI library |
| `react-native` | ^0.81.5 | Runtime nativo |
| `react-dom` | ^19.1.0 | Web rendering |
| `react-native-web` | ^0.21.2 | Web compatibility |
| `expo-router` | ~6.0.23 | File-based routing |
| `typescript` | ^5.6.0 | Tipagem estática |

### Navegação e UI
| Pacote | Versão | Função |
|--------|--------|--------|
| `@react-navigation/bottom-tabs` | ^7.3.0 | Tab navigator |
| `react-native-screens` | ~4.16.0 | Navegação nativa otimizada |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |
| `@expo/vector-icons` | ^15.1.1 | Ionicons e outros ícones |
| `expo-linear-gradient` | ~15.0.8 | Gradientes (cards de crédito) |
| `expo-status-bar` | ~3.0.9 | Status bar styling |

### Estado e Dados
| Pacote | Versão | Função |
|--------|--------|--------|
| `@tanstack/react-query` | ^5.60.0 | Estado do servidor + cache |
| `zustand` | ^5.0.0 | Estado do cliente |
| `axios` | ^1.7.0 | HTTP client |
| `@react-native-async-storage/async-storage` | ^2.2.0 | Persistência local |

### Funcionalidades Extras
| Pacote | Versão | Função |
|--------|--------|--------|
| `expo-clipboard` | ~8.0.8 | Copiar/colar (chaves Pix) |
| `expo-haptics` | ~15.0.8 | Feedback háptico |
| `expo-sharing` | ~14.0.8 | Compartilhar comprovantes |
| `expo-file-system` | ~19.0.21 | Sistema de arquivos |
| `expo-linking` | ~8.0.11 | Deep linking |
| `expo-constants` | ~18.0.13 | Configuração do app |
| `react-native-view-shot` | 4.0.3 | Screenshot (comprovante Pix) |
| `@react-native-community/slider` | ^5.0.1 | Slider de limite (cartão) |

---

## Dependências de Desenvolvimento

| Pacote | Versão | Função |
|--------|--------|--------|
| `@babel/core` | ^7.25.0 | Compilação |
| `babel-plugin-module-resolver` | ^5.0.2 | Aliases (`@/`) |
| `jest` | ^29.7.0 | Test runner |
| `jest-expo` | ~54.0.0 | Jest preset para Expo |
| `@testing-library/react-native` | ^12.4.0 | Testing library |
| `@testing-library/jest-native` | ^5.4.0 | Matchers nativos |
| `@types/jest` | ^29.5.0 | Tipos Jest |
| `@types/react` | ~19.1.10 | Tipos React |

---

## Configuração do Expo (`app.json`)

```json
{
  "name": "PJ Assistant",
  "slug": "pj-assistant-app",
  "scheme": "pjassistant",
  "orientation": "portrait",
  "userInterfaceStyle": "light",
  "newArchEnabled": true,
  "ios.bundleIdentifier": "com.itau.pjassistant",
  "android.package": "com.itau.pjassistant",
  "plugins": ["expo-router"],
  "experiments": { "typedRoutes": true }
}
```

**Notas:**
- New Architecture habilitada (`newArchEnabled: true`)
- Rotas tipadas (`typedRoutes: true`)
- Splash screen com fundo laranja (`#F37021`)

---

## TypeScript (`tsconfig.json`)

- Strict mode habilitado
- Path aliases: `@/*` → `src/*`
- Target: ES2022
- Module resolution: bundler

---

## Babel (`babel.config.js`)

- Module resolver plugin com alias `@` → `./src`
- Compatível com Expo SDK 54

---

## Scripts

```bash
npm start         # expo start
npm run android   # expo start --android
npm run ios       # expo start --ios
npm test          # jest
npm run test:watch # jest --watch
npm run lint      # eslint . --ext .ts,.tsx
```
