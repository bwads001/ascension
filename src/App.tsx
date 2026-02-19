import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'

import Camera from './components/Camera'
import Lighting from './components/Lighting'
import UI from './components/UI'
import { Player } from './entities'
import { Floor, Town } from './world'

import './App.css'

function App() {
  return (
    <div className="game-container">
      <Canvas shadows camera={{ position: [0, 25, 25], fov: 60 }}>
        <color attach="background" args={['#2a3a2a']} />
        <fog attach="fog" args={['#2a3a2a', 30, 80]} />

        <Lighting />
        <Camera />

        <Physics debug={false}>
          <Floor />
          <Town />
          <Player playerClass="mage" />
        </Physics>
      </Canvas>

      <UI />
    </div>
  )
}

export default App
