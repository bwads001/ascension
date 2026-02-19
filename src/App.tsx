import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'

import Lighting from './components/Lighting'
import OrbitControls from './components/OrbitControls'
import UI from './components/UI'
import { Player, Enemy } from './entities'
import { Floor } from './world'

import './App.css'

function App() {
  return (
    <div className="game-container">
      <Canvas shadows camera={{ position: [0, 10, 15], fov: 60 }}>
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 20, 50]} />

        <Lighting />

        <Physics debug={false}>
          <Floor />
          <Player />
          <Enemy position={[3, 1, 0]} color="#e74c3c" id="enemy-1" />
          <Enemy position={[-3, 1, 2]} color="#9b59b6" id="enemy-2" />
          <Enemy position={[0, 1, -4]} color="#3498db" id="enemy-3" />
        </Physics>

        <OrbitControls />
      </Canvas>

      <UI />
    </div>
  )
}

export default App
