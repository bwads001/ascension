import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PCFShadowMap } from 'three'

import Camera from './components/Camera'
import Lighting from './components/Lighting'
import UI from './components/UI'
import { Player, Monster } from './entities'
import { Floor, Town, Wilderness } from './world'

import './App.css'

const MONSTER_SPAWNS: { type: 'slime' | 'rat' | 'skeleton'; position: [number, number, number] }[] =
  [
    { type: 'slime', position: [15, 0, 5] },
    { type: 'slime', position: [-15, 0, 8] },
    { type: 'slime', position: [10, 0, -18] },
    { type: 'rat', position: [-12, 0, -15] },
    { type: 'rat', position: [18, 0, -8] },
    { type: 'skeleton', position: [-18, 0, 15] },
    { type: 'skeleton', position: [5, 0, 20] },
    { type: 'skeleton', position: [-8, 0, -22] },
  ]

function App() {
  return (
    <div className="game-container">
      <Canvas shadows={{ type: PCFShadowMap }} camera={{ position: [0, 25, 25], fov: 60 }}>
        <color attach="background" args={['#2a3a2a']} />
        <fog attach="fog" args={['#2a3a2a', 30, 80]} />

        <Lighting />
        <Camera />

        <Physics>
          <Floor />
          <Town />
          <Wilderness />
          <Player playerClass="mage" />
          {MONSTER_SPAWNS.map((spawn, i) => (
            <Monster
              key={`monster-${i}`}
              id={`monster-${i}`}
              type={spawn.type}
              position={spawn.position}
            />
          ))}
        </Physics>
      </Canvas>

      <UI />
    </div>
  )
}

export default App
