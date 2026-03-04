// ─── Temp Session ID ─────────────────────────────────────────────────
// Generates a temporary UUID for anonymous/onboarding sessions.
// This ID is used as customer_id in the BFA URL so the backend can
// track the onboarding conversation per session.
//
// Lifecycle:
//   - Generated eagerly on module load (app start)
//   - Used ONLY during onboarding chat (account opening)
//   - Reset when user clicks the reset button → new UUID → fresh session
//   - Abandoned when user logs in (real customerId takes over)
//   - Regenerated when user logs out
//
// ⚠️  Purely in-memory — NOT persisted to AsyncStorage.
//     Every app cold-start gets a fresh ID automatically.

/** UUID v4 generator (no external dependency) */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** In-memory only — generated eagerly, never persisted */
let currentTempId: string = generateUUID()

/**
 * Returns the current temporary session ID (synchronous).
 * Always available — generated on module load.
 */
export function getTempSessionId(): string {
  return currentTempId
}

/**
 * Generates a brand-new temporary session ID and returns it.
 * Call on: reset button, logout, entering onboarding screen.
 */
export function resetTempSessionId(): string {
  currentTempId = generateUUID()
  return currentTempId
}

// ── Legacy exports (keep signatures so other files compile) ──────────

/** @deprecated Use getTempSessionId() — kept for http-client header */
export async function getDeviceId(): Promise<string> {
  return currentTempId
}

/** @deprecated Use resetTempSessionId() */
export function resetDeviceIdCache(): void {
  resetTempSessionId()
}

/** @deprecated Use resetTempSessionId() */
export async function resetDeviceId(): Promise<string> {
  return resetTempSessionId()
}
