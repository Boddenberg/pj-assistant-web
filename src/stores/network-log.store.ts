// ─── Network Log Store ────────────────────────────────────────────────
// Dev-only store for request/response inspection.
// Toggle on/off from DevTools.

import { create } from 'zustand'

export type LogEntryType = 'request' | 'response' | 'error'

export interface NetworkLogEntry {
  id: string
  type: LogEntryType
  timestamp: string
  method: string
  url: string
  status?: number
  durationMs?: number
  body?: unknown
  /** Links request ↔ response */
  requestId: string
}

interface NetworkLogState {
  enabled: boolean
  entries: NetworkLogEntry[]
  toggle: () => void
  addEntry: (entry: NetworkLogEntry) => void
  clear: () => void
}

const MAX_ENTRIES = 200

let _counter = 0
export function nextLogId(): string {
  return `nlog-${++_counter}-${Date.now()}`
}

export const useNetworkLogStore = create<NetworkLogState>((set) => ({
  enabled: false,
  entries: [],

  toggle: () => set((s) => ({ enabled: !s.enabled })),

  addEntry: (entry) =>
    set((s) => ({
      entries: [...s.entries, entry].slice(-MAX_ENTRIES),
    })),

  clear: () => set({ entries: [] }),
}))
