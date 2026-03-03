# Design System e Tema — PJ Assistant

## Identidade Visual

O app segue a identidade do **Itaú Unibanco** adaptada para o segmento **PJ (Pessoa Jurídica)**, com estilo premium, limpo e institucional.

### Princípios de Design

1. **Laranja é para ação/destaque** — nunca para elementos estruturais
2. **Neutros carregam a estrutura** — branco, cinza claro, cinza escuro
3. **Espaçamento generoso** ("respiro") entre todas as seções
4. **Sombras mínimas** — cards usam contraste de fundo, não elevação
5. **Dois estilos de card**: primário (fundo laranja) e secundário (fundo branco/claro)

---

## Paleta de Cores

### Cores da Marca
| Token | Hex | Uso |
|-------|-----|-----|
| `itauOrange` | `#EC7000` | Cor primária — botões, header, destaques |
| `itauOrangeLight` | `#FF8C2E` | Gradientes, hover |
| `itauOrangeDark` | `#CC5F00` | Gradientes, pressed |
| `itauOrangeSoft` | `#FFF4EB` | Fundo de cards com tema laranja |
| `itauBlue` | `#003882` | Cor institucional — links, info |
| `itauBlueDark` | `#002D6B` | Variante escura |
| `itauBlueLight` | `#1A5BA6` | Variante clara |
| `itauNavy` | `#0D1B2A` | Cards premium, fundos escuros |

### Fundos
| Token | Hex | Uso |
|-------|-----|-----|
| `bgPrimary` | `#F5F5F8` | Fundo geral (cinza frio premium) |
| `bgSecondary` | `#FFFFFF` | Fundo de cards |
| `bgHeader` | `#EC7000` | Header de navegação |
| `bgTabBar` | `#FFFFFF` | Tab bar inferior |
| `bgInput` | `#F0F1F3` | Campos de entrada |
| `bgUserBubble` | `#EC7000` | Bolha do usuário no chat |
| `bgAgentBubble` | `#FFFFFF` | Bolha do assistente no chat |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `textPrimary` | `#1A1A1A` | Texto principal |
| `textSecondary` | `#5C5C5C` | Texto secundário |
| `textInverse` | `#FFFFFF` | Texto sobre fundo escuro |
| `textMuted` | `#8C8C8C` | Texto desabilitado/placeholder |
| `textOnOrange` | `#FFFFFF` | Texto sobre fundo laranja |
| `textLink` | `#003882` | Links (azul Itaú) |
| `textTertiary` | `#A0A0A0` | Texto terciário |

### Bordas
| Token | Hex | Uso |
|-------|-----|-----|
| `border` | `#E5E5EA` | Borda padrão |
| `borderLight` | `#F0F0F2` | Borda sutil |
| `borderFocus` | `#EC7000` | Borda com foco (input) |

### Semânticas
| Token | Hex | Uso |
|-------|-----|-----|
| `success` / `successLight` | `#00875A` / `#E6F5EF` | Sucesso (verde) |
| `warning` / `warningLight` | `#E8A800` / `#FFF8E0` | Alerta (amarelo) |
| `error` / `errorLight` | `#D42A2A` / `#FDEAEA` | Erro (vermelho) |
| `info` / `infoLight` | `#003882` / `#E6EDF5` | Informação (azul) |

---

## Espaçamentos

| Token | Valor (px) | Uso |
|-------|-----------|-----|
| `2xs` | 2 | Micro ajustes |
| `xs` | 4 | Espaço mínimo |
| `sm` | 8 | Espaço pequeno |
| `md` | 12 | Espaço médio |
| `lg` | 16 | Espaço padrão |
| `xl` | 24 | Espaço generoso |
| `2xl` | 32 | Breathing room |
| `3xl` | 40 | Seções |
| `4xl` | 48 | Grandes blocos |
| `5xl` | 56 | — |
| `6xl` | 72 | — |

---

## Border Radius

| Token | Valor (px) | Uso |
|-------|-----------|-----|
| `xs` | 4 | Badges |
| `sm` | 8 | Inputs |
| `md` | 12 | Cards |
| `lg` | 16 | Cards grandes |
| `xl` | 20 | Sheets |
| `2xl` | 24 | — |
| `3xl` | 28 | Top corners de sheet |
| `full` | 9999 | Círculos |

---

## Tipografia

### Tamanhos de Fonte

| Token | Valor (px) | Uso |
|-------|-----------|-----|
| `2xs` | 10 | Labels de tab |
| `xs` | 11 | Captions |
| `sm` | 13 | Texto pequeno |
| `md` | 15 | Texto corpo |
| `lg` | 17 | Subtítulos |
| `xl` | 20 | Títulos |
| `2xl` | 24 | Títulos grandes |
| `3xl` | 30 | Hero text |
| `4xl` | 36 | Display |

### Pesos de Fonte

| Token | Valor |
|-------|-------|
| `regular` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |
| `black` | 800 |

---

## Sombras

| Token | Intensidade | Uso |
|-------|------------|-----|
| `none` | 0 | Sem sombra |
| `sm` | opacity 0.04, radius 2 | Tab bar, cards sutis |
| `md` | opacity 0.06, radius 6 | Cards padrão |
| `lg` | opacity 0.08, radius 12 | Cards elevados |

---

## Temas de Cartão de Crédito

Cada bandeira tem um tema visual distinto:

### Amex (American Express)
- **Gradiente**: `#2D2D2D` → `#3A3A3A` → `#1A1A1A` (dark/premium)
- **Acento**: `#EC7000` (laranja Itaú)
- **Texto**: branco
- **Label**: "AMERICAN EXPRESS"

### Elo
- **Gradiente**: `#8C8C8C` → `#A0A0A0` → `#6E6E6E` (silver)
- **Acento**: `#EC7000`
- **Texto**: branco
- **Label**: "ELO"

### Mastercard
- **Gradiente**: `#EC7000` → `#FF8C2E` → `#CC5F00` (orange brand)
- **Acento**: `#003882` (azul Itaú)
- **Texto**: branco
- **Label**: "MASTERCARD"

### Visa
- **Gradiente**: `#0D1B2A` → `#162D4A` → `#091320` (navy/premium)
- **Acento**: `#EC7000`
- **Texto**: branco
- **Label**: "VISA"
