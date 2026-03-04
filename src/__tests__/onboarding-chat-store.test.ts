import { useOnboardingChatStore } from '@/stores/onboarding-chat.store'
import { assistantService } from '@/services'
import type { ChatApiResponse } from '@/types'

jest.mock('@/services', () => ({
  assistantService: {
    chat: jest.fn(),
  },
}))

const mockedChat = assistantService.chat as jest.MockedFunction<
  typeof assistantService.chat
>

describe('useOnboardingChatStore', () => {
  beforeEach(() => {
    useOnboardingChatStore.setState({
      messages: [],
      history: [],
      conversationId: null,
      isLoading: false,
      error: null,
      step: null,
      nextStep: null,
      accountData: null,
      isPasswordField: false,
    })
    jest.clearAllMocks()
  })

  it('starts with empty state', () => {
    const state = useOnboardingChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.history).toEqual([])
    expect(state.conversationId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.step).toBeNull()
    expect(state.nextStep).toBeNull()
    expect(state.accountData).toBeNull()
    expect(state.isPasswordField).toBe(false)
  })

  it('sends message and appends enriched history entry', async () => {
    const mockResponse: ChatApiResponse = {
      answer: 'Olá! Posso ajudar com a abertura.',
      conversationId: 'onb-1',
      step: 'cnpj',
      next_step: 'razaoSocial',
    }
    mockedChat.mockResolvedValueOnce(mockResponse)

    await useOnboardingChatStore.getState().sendMessage('Quero abrir conta')

    const state = useOnboardingChatStore.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[0].content).toBe('Quero abrir conta')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toBe(
      'Olá! Posso ajudar com a abertura.',
    )
    expect(state.conversationId).toBe('onb-1')
    expect(state.step).toBe('cnpj')
    expect(state.nextStep).toBe('razaoSocial')

    expect(state.history).toHaveLength(1)
    expect(state.history[0]).toEqual({
      query: 'Quero abrir conta',
      answer: 'Olá! Posso ajudar com a abertura.',
      step: 'cnpj',
      validated: null,
    })
  })

  it('sends enriched history on subsequent requests', async () => {
    useOnboardingChatStore.setState({
      history: [{ query: 'Oi', answer: 'Olá!', step: null, validated: null }],
      conversationId: 'onb-1',
    })

    mockedChat.mockResolvedValueOnce({
      answer: 'Claro, preciso do CNPJ.',
      conversationId: 'onb-1',
      step: 'cnpj',
    })

    await useOnboardingChatStore.getState().sendMessage('Quero abrir conta')

    expect(mockedChat).toHaveBeenCalledWith(
      'Quero abrir conta',
      'onb-1',
      [{ query: 'Oi', answer: 'Olá!', step: null, validated: null }],
      false,
    )

    const state = useOnboardingChatStore.getState()
    expect(state.history).toHaveLength(2)
    expect(state.step).toBe('cnpj')
  })

  it('keeps only last 5 history entries', async () => {
    useOnboardingChatStore.setState({
      history: Array.from({ length: 5 }, (_, i) => ({
        query: `q${i}`,
        answer: `a${i}`,
        step: null,
        validated: null,
      })),
    })

    mockedChat.mockResolvedValueOnce({ answer: 'a5' })

    await useOnboardingChatStore.getState().sendMessage('q5')

    const state = useOnboardingChatStore.getState()
    expect(state.history).toHaveLength(5)
    expect(state.history[0].query).toBe('q1')
    expect(state.history[4].query).toBe('q5')
  })

  it('sets isPasswordField when step is password', async () => {
    mockedChat.mockResolvedValueOnce({
      answer: 'Crie uma senha de 6 dígitos.',
      step: 'password',
    })

    await useOnboardingChatStore.getState().sendMessage('ok')

    const state = useOnboardingChatStore.getState()
    expect(state.step).toBe('password')
    expect(state.isPasswordField).toBe(true)
  })

  it('sets isPasswordField when step is passwordConfirmation', async () => {
    mockedChat.mockResolvedValueOnce({
      answer: 'Confirme sua senha.',
      step: 'passwordConfirmation',
    })

    await useOnboardingChatStore.getState().sendMessage('123456')

    expect(useOnboardingChatStore.getState().isPasswordField).toBe(true)
  })

  it('stores nextStep from response', async () => {
    mockedChat.mockResolvedValueOnce({
      answer: 'Agora preciso da razão social.',
      step: 'cnpj',
      next_step: 'razaoSocial',
    })

    await useOnboardingChatStore.getState().sendMessage('12.345.678/0001-99')

    const state = useOnboardingChatStore.getState()
    expect(state.step).toBe('cnpj')
    expect(state.nextStep).toBe('razaoSocial')
  })

  it('sets step to completed when next_step is completed with account_data', async () => {
    mockedChat.mockResolvedValueOnce({
      answer: '🎉 Conta criada!',
      step: 'passwordConfirmation',
      next_step: 'completed',
      account_data: {
        customerId: 'uuid-1',
        agencia: '0001',
        conta: '123456-7',
      },
    })

    await useOnboardingChatStore.getState().sendMessage('123456')

    const state = useOnboardingChatStore.getState()
    expect(state.step).toBe('completed')
    expect(state.nextStep).toBe('completed')
    expect(state.accountData).toEqual({
      customerId: 'uuid-1',
      agencia: '0001',
      conta: '123456-7',
    })
    expect(state.isPasswordField).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('sets step to completed even without account_data', async () => {
    mockedChat.mockResolvedValueOnce({
      answer: 'Algo deu errado na criação.',
      step: 'passwordConfirmation',
      next_step: 'completed',
    })

    await useOnboardingChatStore.getState().sendMessage('123456')

    const state = useOnboardingChatStore.getState()
    expect(state.step).toBe('completed')
    expect(state.accountData).toBeNull()
  })

  it('does not add history on API error', async () => {
    mockedChat.mockRejectedValueOnce(new Error('timeout'))

    await useOnboardingChatStore.getState().sendMessage('Oi')

    const state = useOnboardingChatStore.getState()
    expect(state.history).toHaveLength(0)
    expect(state.error).not.toBeNull()
    expect(state.messages).toHaveLength(2) // user message + error bubble
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toContain('perdi a conexão')
  })

  it('clearChat resets all state', () => {
    useOnboardingChatStore.setState({
      messages: [{ id: '1', role: 'user', content: 'hi', timestamp: '' }],
      history: [{ query: 'hi', answer: 'hello', step: 'cnpj', validated: true }],
      conversationId: 'onb-1',
      isLoading: true,
      step: 'cnpj',
      nextStep: 'razaoSocial',
      accountData: { customerId: 'c1', agencia: '0001', conta: '123' },
      isPasswordField: true,
    })

    useOnboardingChatStore.getState().clearChat()

    const state = useOnboardingChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.history).toEqual([])
    expect(state.conversationId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.step).toBeNull()
    expect(state.nextStep).toBeNull()
    expect(state.accountData).toBeNull()
    expect(state.isPasswordField).toBe(false)
  })

  it('does not send history when it is empty', async () => {
    mockedChat.mockResolvedValueOnce({ answer: 'Hi!' })

    await useOnboardingChatStore.getState().sendMessage('Hello')

    expect(mockedChat).toHaveBeenCalledWith('Hello', undefined, undefined, false)
  })

  it('ignores empty input', async () => {
    await useOnboardingChatStore.getState().sendMessage('   ')

    expect(useOnboardingChatStore.getState().messages).toHaveLength(0)
    expect(mockedChat).not.toHaveBeenCalled()
  })
})
