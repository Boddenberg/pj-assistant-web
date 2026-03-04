import AsyncStorage from '@react-native-async-storage/async-storage'
import { getDeviceId, resetDeviceIdCache, resetDeviceId } from '@/lib/device-id'

// AsyncStorage is auto-mocked by jest-expo

describe('getDeviceId', () => {
  beforeEach(() => {
    resetDeviceIdCache()
    ;(AsyncStorage.getItem as jest.Mock).mockReset()
    ;(AsyncStorage.setItem as jest.Mock).mockReset()
  })

  it('generates a UUID v4 on first call and persists it', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    const id = await getDeviceId()

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pj_assistant_device_id', id)
  })

  it('returns the stored ID when AsyncStorage has one', async () => {
    const existingId = 'aabbccdd-1122-4334-9556-aabbccddeeff'
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingId)

    const id = await getDeviceId()

    expect(id).toBe(existingId)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  })

  it('returns cached ID without hitting AsyncStorage on subsequent calls', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    const first = await getDeviceId()
    const second = await getDeviceId()

    expect(first).toBe(second)
    // getItem called only once (first call), second comes from cache
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1)
  })

  it('generates a new ID if AsyncStorage.getItem fails', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'))
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    const id = await getDeviceId()

    expect(id).toMatch(/^[0-9a-f]{8}-/)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pj_assistant_device_id', id)
  })

  it('still returns an ID if AsyncStorage.setItem fails', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Write error'))

    const id = await getDeviceId()

    expect(id).toMatch(/^[0-9a-f]{8}-/)
  })

  it('resetDeviceIdCache clears the in-memory cache', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    const first = await getDeviceId()
    resetDeviceIdCache()

    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('new-stored-id')
    const second = await getDeviceId()

    expect(second).toBe('new-stored-id')
    expect(first).not.toBe(second)
  })

  it('resetDeviceId generates a new UUID atomically', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

    const first = await getDeviceId()
    const newId = await resetDeviceId()

    // Returns a valid UUID, different from the previous one
    expect(newId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(newId).not.toBe(first)

    // Persists the new ID immediately
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pj_assistant_device_id', newId)

    // Subsequent getDeviceId() returns the new ID (no AsyncStorage read)
    ;(AsyncStorage.getItem as jest.Mock).mockReset()
    const afterReset = await getDeviceId()
    expect(afterReset).toBe(newId)
    expect(AsyncStorage.getItem).not.toHaveBeenCalled()
  })
})
