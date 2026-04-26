import { create } from 'zustand'

interface InputState {
  shiftHeld: boolean
  mouseDown: boolean
  hoveredMonsterId: string | null

  setShiftHeld: (held: boolean) => void
  setMouseDown: (down: boolean) => void
  setHoveredMonsterId: (id: string | null) => void
  reset: () => void
}

export const useInputStore = create<InputState>((set) => ({
  shiftHeld: false,
  mouseDown: false,
  hoveredMonsterId: null,

  setShiftHeld: (held) => set({ shiftHeld: held }),
  setMouseDown: (down) => set({ mouseDown: down }),
  setHoveredMonsterId: (id) => set({ hoveredMonsterId: id }),
  reset: () => set({ shiftHeld: false, mouseDown: false, hoveredMonsterId: null }),
}))
