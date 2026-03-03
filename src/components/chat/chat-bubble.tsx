// ─── Chat Bubble ─────────────────────────────────────────────────────
// Itaú visual — orange user bubbles, clean white agent bubbles.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ChatMessage } from '@/types'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import { formatTime } from '@/lib'

interface ChatBubbleProps {
  message: ChatMessage
}

// ─── Emoji → Ícone mapeamento ────────────────────────────────────────
// Substitui emojis "pobres" por ícones Ionicons com cores semânticas.
const EMOJI_ICON_MAP: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
  '⚠️':  { name: 'alert-circle',       color: colors.warning,  bg: colors.warningLight },
  '⚠':   { name: 'alert-circle',       color: colors.warning,  bg: colors.warningLight },
  '💡':  { name: 'bulb',               color: colors.warning,  bg: colors.warningLight },
  '✅':  { name: 'checkmark-circle',    color: colors.success,  bg: colors.successLight },
  '❌':  { name: 'close-circle',        color: colors.error,    bg: colors.errorLight },
  '🚫':  { name: 'ban',                color: colors.error,    bg: colors.errorLight },
  '❗':  { name: 'alert-circle',       color: colors.error,    bg: colors.errorLight },
  '❓':  { name: 'help-circle',        color: colors.info,     bg: colors.infoLight },
  '🔒':  { name: 'lock-closed',        color: colors.info,     bg: colors.infoLight },
  '📧':  { name: 'mail',               color: colors.info,     bg: colors.infoLight },
  '📱':  { name: 'phone-portrait',     color: colors.info,     bg: colors.infoLight },
  '🏢':  { name: 'business',           color: colors.itauBlue, bg: colors.infoLight },
  '🎉':  { name: 'sparkles',           color: colors.itauOrange, bg: colors.itauOrangeSoft },
  '👋':  { name: 'hand-left',          color: colors.itauOrange, bg: colors.itauOrangeSoft },
  '🔑':  { name: 'key',               color: colors.warning,  bg: colors.warningLight },
  '📝':  { name: 'create',            color: colors.info,     bg: colors.infoLight },
  'ℹ️':  { name: 'information-circle', color: colors.info,     bg: colors.infoLight },
}

// Regex para capturar todos os emojis mapeados
const emojiPattern = new RegExp(
  `(${Object.keys(EMOJI_ICON_MAP).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'g',
)

function EmojiIcon({ emoji }: { emoji: string }) {
  const cfg = EMOJI_ICON_MAP[emoji]
  if (!cfg) return <Text>{emoji}</Text>
  return (
    <View style={[iconStyles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.name} size={13} color={cfg.color} />
    </View>
  )
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  // Renderiza conteúdo com **negrito** e emojis como ícones
  function renderRichContent(text: string) {
    // 1. Separa por **negrito** (só inline, sem quebras de linha, max 80 chars)
    const boldParts = text.split(/(\*\*[^*\n]{1,80}\*\*)/g)

    return boldParts.map((segment, i) => {
      // Trecho em negrito — exige par correto e conteúdo não-vazio sem newline
      if (/^\*\*[^*\n]{1,80}\*\*$/.test(segment)) {
        const inner = segment.slice(2, -2).trim()
        if (inner.length > 0) {
          return (
            <Text key={`b${i}`} style={styles.bold}>
              {inner}
            </Text>
          )
        }
      }

      // Trecho normal — verifica emojis
      const emojiParts = segment.split(emojiPattern)
      if (emojiParts.length === 1) {
        return <Text key={`t${i}`}>{segment}</Text>
      }

      return emojiParts.map((part, j) => {
        if (EMOJI_ICON_MAP[part]) {
          return <EmojiIcon key={`e${i}-${j}`} emoji={part} />
        }
        return part ? <Text key={`p${i}-${j}`}>{part}</Text> : null
      })
    })
  }

  return (
    <View style={[styles.wrapper, isUser && styles.wrapperUser]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatarAgent}>
          <Ionicons name="sparkles" size={14} color={colors.textInverse} />
        </View>
      )}

      <View style={styles.bubbleCol}>
        {/* Sender label */}
        {!isUser && (
          <Text style={styles.senderLabel}>Assistente Itaú</Text>
        )}

        {/* Bubble */}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
          <Text style={[styles.content, isUser && styles.contentUser]}>
            {renderRichContent(message.content)}
          </Text>

          {/* Time footer */}
          <View style={styles.footer}>
            <Text style={[styles.time, isUser && styles.timeUser]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: '85%',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarAgent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.itauOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  bubbleCol: {
    flex: 1,
  },
  senderLabel: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing['2xs'],
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.itauOrange,
    borderTopRightRadius: radius.xs,
  },
  bubbleAgent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xs,
  },
  content: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.textPrimary,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bold: {
    fontWeight: 'bold',
    color: colors.itauOrange,
  },
  contentUser: {
    color: colors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  time: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
  },
})

const iconStyles = StyleSheet.create({
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    transform: [{ translateY: 5 }],
  },
})
