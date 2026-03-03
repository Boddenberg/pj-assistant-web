// ─── Chat Tab Screen ─────────────────────────────────────────────────
// Moved chat into tabs group.

import React, { useCallback, useRef } from 'react'
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { FlatList as FlatListType } from 'react-native'

import { useChatStore } from '@/stores'
import { ChatBubble, ChatInput, TypingIndicator, EmptyChat } from '@/components/chat'
import { colors, spacing } from '@/theme'
import type { ChatMessage } from '@/types'

export default function ChatScreen() {
  const flatListRef = useRef<FlatListType<ChatMessage>>(null)

  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const sendMessage = useChatStore((s) => s.sendMessage)

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(text)

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    },
    [sendMessage],
  )

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      handleSend(suggestion)
    },
    [handleSend],
  )

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            messages.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={<EmptyChat onSuggestionPress={handleSuggestion} />}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          }}
        />

        {isLoading && (
          <View style={styles.typingWrapper}>
            <TypingIndicator />
          </View>
        )}

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listEmpty: {
    flex: 1,
  },
  typingWrapper: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
})
