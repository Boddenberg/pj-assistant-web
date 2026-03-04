import {
  getTempSessionId,
  resetTempSessionId,
  getDeviceId,
  resetDeviceIdCache,
  resetDeviceId,
} from '@/lib/device-id'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('Temp Session ID', () => {
  it('getTempSessionId returns a valid UUID v4', () => {
    const id = getTempSessionId()
    expect(id).toMatch(UUID_RE)
  })

  it('getTempSessionId returns the same value on subsequent calls', () => {
    const a = getTempSessionId()
    const b = getTempSessionId()
    expect(a).toBe(b)
  })

  it('resetTempSessionId generates a new UUID different from the current one', () => {
    const before = getTempSessionId()
    const newId = resetTempSessionId()

    expect(newId).toMatch(UUID_RE)
    expect(newId).not.toBe(before)
  })

  it('after reset, getTempSessionId returns the new ID', () => {
    const newId = resetTempSessionId()
    expect(getTempSessionId()).toBe(newId)
  })

  it('multiple resets produce unique IDs each time', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 20; i++) {
      ids.add(resetTempSessionId())
    }
    // All 20 should be unique (astronomically unlikely to collide)
    expect(ids.size).toBe(20)
  })
})

describe('Legacy exports (backward compat)', () => {
  it('getDeviceId returns the current temp session ID', async () => {
    const expected = getTempSessionId()
    const result = await getDeviceId()
    expect(result).toBe(expected)
  })

  it('resetDeviceIdCache resets the ID', () => {
    const before = getTempSessionId()
    resetDeviceIdCache()
    const after = getTempSessionId()
    expect(after).not.toBe(before)
  })

  it('resetDeviceId resets and returns the new ID', async () => {
    const before = getTempSessionId()
    const newId = await resetDeviceId()
    expect(newId).toMatch(UUID_RE)
    expect(newId).not.toBe(before)
    expect(getTempSessionId()).toBe(newId)
  })
})
