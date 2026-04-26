import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useEffect, useState } from 'react'

import { gameLoop } from './engine'
import { StartScene, TownScene, FloorScene } from './scenes'
import { useCharacterStore, useInputStore, useUIStore, useWorldStore } from './store'
import { PlayerHUD, DeathScreen, CharacterScreen, SkillBar, SkillUnlockNotification } from './ui'

export default function App() {
  const { loaded, load } = useCharacterStore()
  const showStartScreen = useUIStore((s) => s.showStartScreen)
  const floor = useWorldStore((s) => s.floor)
  const [showCharacterScreen, setShowCharacterScreen] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    gameLoop.start()
    return () => gameLoop.stop()
  }, [])

  // Global input listeners: Shift modifier + mouse button state
  useEffect(() => {
    const input = useInputStore.getState()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') input.setShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') input.setShiftHeld(false)
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) input.setMouseDown(true)
    }
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) input.setMouseDown(false)
    }
    const handleBlur = () => {
      input.reset()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !showStartScreen) {
        setShowCharacterScreen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showStartScreen])

  if (!loaded) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (showStartScreen) {
    return <StartScene />
  }

  const GameScene = floor > 0 ? FloorScene : TownScene

  return (
    <div style={styles.container}>
      <Canvas
        camera={{ position: [10, 15, 10], fov: 50 }}
        shadows
        style={{ background: '#1a1a2e' }}
      >
        <Physics>
          <GameScene key={floor} />
        </Physics>
      </Canvas>
      <PlayerHUD />
      <SkillBar />
      <SkillUnlockNotification />
      <DeathScreen />
      {showCharacterScreen && <CharacterScreen onClose={() => setShowCharacterScreen(false)} />}
      <div style={styles.hud}>
        <p>ESC: {floor > 0 ? 'Return to Town' : 'Menu'} | Click: move/attack | Shift+Click: stand & attack | C: Character | 2-0: Skills</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
  },
  hud: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: '#fff',
    fontFamily: 'sans-serif',
    background: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
  },
}
