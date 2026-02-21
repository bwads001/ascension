import { create } from 'zustand'

interface UIState {
  hoveredEntityId: string | null
  selectedEntityId: string | null
  showStartScreen: boolean
  showDeathScreen: boolean
  loading: boolean
  error: string | null

  setHoveredEntity: (id: string | null) => void
  setSelectedEntity: (id: string | null) => void
  setShowStartScreen: (show: boolean) => void
  setShowDeathScreen: (show: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  hoveredEntityId: null,
  selectedEntityId: null,
  showStartScreen: true,
  showDeathScreen: false,
  loading: false,
  error: null,

  setHoveredEntity: (id) => set({ hoveredEntityId: id }),
  setSelectedEntity: (id) => set({ selectedEntityId: id }),
  setShowStartScreen: (show) => set({ showStartScreen: show }),
  setShowDeathScreen: (show) => set({ showDeathScreen: show }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
