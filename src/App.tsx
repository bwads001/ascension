import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'

import { gameLoop } from './engine'
import { StartScene, TownScene } from './scenes'
import { useCharacterStore, useUIStore } from './store'
import { PlayerHUD, DeathScreen } from './ui'

export default function App() {
  const { loaded, load } = useCharacterStore()
  const showStartScreen = useUIStore((s) => s.showStartScreen)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    gameLoop.start()
    return () => gameLoop.stop()
  }, [])

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

  return (
    <div style={styles.container}>
      <Canvas
        camera={{ position: [10, 15, 10], fov: 50 }}
        shadows
        style={{ background: '#1a1a2e' }}
      >
        <TownScene />
      </Canvas>
      <PlayerHUD />
      <DeathScreen />
      <div style={styles.hud}>
        <p>Press ESC to return to start screen</p>
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
