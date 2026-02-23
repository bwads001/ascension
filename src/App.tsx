import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useEffect, useState } from 'react'

import { gameLoop } from './engine'
import { StartScene, TownScene, FloorScene } from './scenes'
import { useCharacterStore, useUIStore, useWorldStore } from './store'
import { PlayerHUD, DeathScreen, CharacterScreen, SkillBar } from './ui'

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
      <DeathScreen />
      {showCharacterScreen && <CharacterScreen onClose={() => setShowCharacterScreen(false)} />}
      <div style={styles.hud}>
        <p>ESC: {floor > 0 ? 'Return to Town' : 'Menu'} | C: Character | 1-0: Skills</p>
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
