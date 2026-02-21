import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'

import { gameLoop } from './engine'
import StartScene from './scenes/StartScene'
import { useCharacterStore, useUIStore } from './store'

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
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[20, 1, 20]} />
          <meshStandardMaterial color="#3a3a4a" />
        </mesh>
      </Canvas>
      <div style={styles.hud}>
        <h3>Ascension v2</h3>
        <p>Game engine running: {gameLoop.isRunning() ? 'Yes' : 'No'}</p>
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
    top: 16,
    left: 16,
    color: '#fff',
    fontFamily: 'sans-serif',
    background: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 8,
  },
}
