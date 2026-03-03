// ─── Device ID ───────────────────────────────────────────────────────
// Generates a stable UUID per installation, persisted in AsyncStorage.
// Used to uniquely identify anonymous users across sessions.

import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@pj_assistant_device_id'

/** UUID v4 generator (no external dependency) */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** In-memory cache so we don't hit AsyncStorage on every request */
let cachedDeviceId: string | null = null

/**
 * Returns a stable device identifier.
 * - First call: reads from AsyncStorage (or generates + persists a new one)
 * - Subsequent calls: returns from memory cache instantly
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (stored) {
      cachedDeviceId = stored
      return stored
    }
  } catch {
    // AsyncStorage read failed — generate a new one
  }

  const newId = generateUUID()
  cachedDeviceId = newId

  try {
    await AsyncStorage.setItem(STORAGE_KEY, newId)
  } catch {
    // Persistence failed — ID still works for this session
    console.warn('[device-id] Failed to persist device ID')
  }

  return newId
}

/** Clears the cached device ID (useful for tests) */
export function resetDeviceIdCache(): void {
  cachedDeviceId = null
}

/**
 * Fully resets the device ID: clears in-memory cache AND removes
 * the persisted value from AsyncStorage. Next call to getDeviceId()
 * will generate a brand-new UUID.
 */
export async function resetDeviceId(): Promise<void> {
  cachedDeviceId = null
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    // best-effort
  }
}
