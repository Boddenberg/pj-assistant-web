import { useChatStore } from '@/stores/chat.store'
import { assistantService } from '@/services'
import type { ChatApiResponse } from '@/types'

// Mock the service layer
jest.mock('@/services', () => ({
  assistantService: {
    chat: jest.fn(),
  },
}))

const mockedChat = assistantService.chat as jest.MockedFunction<typeof assistantService.chat>

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset Zustand store
    useChatStore.setState({
      messages: [],
      conversationId: null,
      isLoading: false,
      error: null,
    })
    jest.clearAllMocks()
  })

  it('starts with empty state', () => {
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.conversationId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('adds user message and sets isLoading on sendMessage', async () => {
    const mockResponse: ChatApiResponse = {
      answer: 'Hello!',
      conversationId: 'conv-123',
    }
    mockedChat.mockResolvedValueOnce(mockResponse)

    const promise = useChatStore.getState().sendMessage('Hi')

    // After calling (but before resolving), should have user message + loading
    expect(useChatStore.getState().isLoading).toBe(true)
    expect(useChatStore.getState().messages).toHaveLength(1)
    expect(useChatStore.getState().messages[0].role).toBe('user')
    expect(useChatStore.getState().messages[0].content).toBe('Hi')

    await promise

    // After resolving, should have both messages + loading false
    expect(useChatStore.getState().isLoading).toBe(false)
    expect(useChatStore.getState().messages).toHaveLength(2)
    expect(useChatStore.getState().messages[1].role).toBe('assistant')
    expect(useChatStore.getState().messages[1].content).toBe('Hello!')
    expect(useChatStore.getState().conversationId).toBe('conv-123')
  })

  it('handles API errors gracefully', async () => {
    mockedChat.mockRejectedValueOnce(new Error('Network error'))

    await useChatStore.getState().sendMessage('Hello')

    const state = useChatStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).not.toBeNull()
    expect(state.messages).toHaveLength(1) // user message only
  })

  it('ignores empty input after sanitization', async () => {
    await useChatStore.getState().sendMessage('   ')

    expect(useChatStore.getState().messages).toHaveLength(0)
    expect(mockedChat).not.toHaveBeenCalled()
  })

  it('clearChat resets all state', () => {
    useChatStore.setState({
      messages: [{ id: '1', role: 'user', content: 'hi', timestamp: '' }],
      conversationId: 'conv-1',
      isLoading: true,
    })

    useChatStore.getState().clearChat()

    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.conversationId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('dismissError clears only the error', () => {
    useChatStore.setState({
      messages: [{ id: '1', role: 'user', content: 'hi', timestamp: '' }],
      error: { name: 'AppError', code: 'UNKNOWN', message: 'oops' } as any,
    })

    useChatStore.getState().dismissError()

    expect(useChatStore.getState().error).toBeNull()
    expect(useChatStore.getState().messages).toHaveLength(1) // preserved
  })
})
