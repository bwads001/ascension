import { RigidBody } from '@react-three/rapier'

export default function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[60, 1, 80]} />
        <meshStandardMaterial color="#3d5c3d" roughness={0.95} />
      </mesh>
      {[...Array(15)].map((_, i) =>
        [...Array(20)].map((_row, j) => (
          <mesh key={`${i}-${j}`} receiveShadow position={[(i - 7) * 4, -0.49, (j - 10) * 4]}>
            <boxGeometry args={[3.8, 0.02, 3.8]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#4a6b4a' : '#3d5c3d'} />
          </mesh>
        ))
      )}
      <mesh receiveShadow position={[-25, -0.49, 0]}>
        <boxGeometry args={[1, 0.02, 80]} />
        <meshStandardMaterial color="#5d4e37" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[25, -0.49, 0]}>
        <boxGeometry args={[1, 0.02, 80]} />
        <meshStandardMaterial color="#5d4e37" roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}
