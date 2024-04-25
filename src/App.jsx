import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing'
import { useGLTF, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

function TerrainModel() {
  const { scene } = useGLTF('/assets/terrain.glb');
  return <primitive object={scene} scale={0.5} />;
}

// function ControlledSphere({ moveSpeed = 5 }) {
//   const sphereRef = useRef();
//   const { camera } = useThree();
//   const velocity = useRef(new THREE.Vector3(0, 0, 0));

//   useEffect(() => {
//     sphereRef.current.position.set(0, 0.5, 0);
//     camera.position.set(0, 2, 5);
//   }, [camera]);

//   useFrame((state, delta) => {
//     if (sphereRef.current) {
//       sphereRef.current.position.add(velocity.current.clone().multiplyScalar(delta * moveSpeed));
//       camera.position.lerp(new THREE.Vector3(sphereRef.current.position.x, sphereRef.current.position.y + 2, sphereRef.current.position.z + 5), 0.05);
//       camera.lookAt(sphereRef.current.position);
//     }
//   });

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       switch (event.key.toLowerCase()) {
//         case 'w': velocity.current.z = -1; break;
//         case 's': velocity.current.z = 1; break;
//         case 'a': velocity.current.x = -1; break;
//         case 'd': velocity.current.x = 1; break;
//         case 'q': velocity.current.y = -1; break;
//         case 'e': velocity.current.y = 1; break;
//       }
//     };
//     const handleKeyUp = (event) => {
//       switch (event.key.toLowerCase()) {
//         case 'w':
//         case 's': velocity.current.z = 0; break;
//         case 'a':
//         case 'd': velocity.current.x = 0; break;
//         case 'q':
//         case 'e': velocity.current.y = 0; break;
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     document.addEventListener('keyup', handleKeyUp);

//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.removeEventListener('keyup', handleKeyUp);
//     };
//   }, []); // Empty dependency array ensures this only runs once

//   return (
//     <mesh ref={sphereRef}>
//       <sphereGeometry args={[0.5, 32, 32]} />
//       <meshStandardMaterial
//         color="white"
//         emissive="white"
//         emissiveIntensity={10} // Increase this value to make it more emissive
//       />
//       <pointLight position={[0, 0, 0]} intensity={1.5} distance={10} color="white" />
//     </mesh>
//   );
// }


function FPSControls() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const direction = useRef(new THREE.Vector3());
  const moveSpeed = 1;
  const keyMap = useRef({});
  const sphereRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const lerpFactor = 0.1; // Adjust this to change the smoothness of the follow effect

  useEffect(() => {
      function handleKeyDown(event) {
          keyMap.current[event.code] = true;
      }

      function handleKeyUp(event) {
          keyMap.current[event.code] = false;
      }

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  useFrame((state, delta) => {
      handleMovement(delta);
      if (sphereRef.current) {
          updateSpherePosition();
          smoothUpdateSpherePosition(delta);
      }
  });

  function handleMovement(delta) {
      camera.getWorldDirection(direction.current);
      direction.current.y = 0; // Ensuring the movement is only on the horizontal plane
      direction.current.normalize();

      const speed = delta * moveSpeed;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      right.crossVectors(direction.current, up);

      if (keyMap.current['KeyW']) velocity.current.addScaledVector(direction.current, speed);
      if (keyMap.current['KeyS']) velocity.current.addScaledVector(direction.current, -speed);
      if (keyMap.current['KeyA']) velocity.current.addScaledVector(right, -speed);
      if (keyMap.current['KeyD']) velocity.current.addScaledVector(right, speed);
      if (keyMap.current['KeyQ']) velocity.current.y -= speed;
      if (keyMap.current['KeyE']) velocity.current.y += speed;

      camera.position.addScaledVector(velocity.current, 1);
      velocity.current.multiplyScalar(0.85);
  }

  function updateSpherePosition() {
      const forwardOffset = 2; // How far in front of the camera the sphere should be
      const verticalOffset = 0; // Vertical offset, negative moves it down, positive moves it up
      camera.getWorldDirection(direction.current);
      targetPosition.current.copy(camera.position).add(
          direction.current.multiplyScalar(forwardOffset).add(new THREE.Vector3(0, verticalOffset, 0))
      );
  }

  function smoothUpdateSpherePosition(delta) {
      sphereRef.current.position.lerp(targetPosition.current, lerpFactor);
  }

  return (
      <>
          <PointerLockControls />
          <mesh ref={sphereRef}>
              <sphereGeometry args={[0.2, 32, 32]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
              <pointLight position={[0, 0, 0]} intensity={1.5} distance={5} color="white" />
          </mesh>
      </>
  );
}


function App() {
  return (
    <div>
      <Canvas
        style={{ width: `100%`, height: `100vh`, backgroundColor: 'black' }}>
        {/* <ambientLight intensity={0.5} /> */}
        {/* <directionalLight position={[5, 5, 5]} intensity={1} /> */}
        <TerrainModel />
        {/* <ControlledSphere /> */}
        <FPSControls />
        <EffectComposer>
          <Bloom
            intensity={0.1} // The bloom intensity.
            blurPass={undefined} // A blur pass.
            kernelSize={KernelSize.VERY_LARGE} // blur kernel size
            luminanceThreshold={0.5} // luminance threshold. Raise this value to mask out darker elements in the scene.
            luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
            mipmapBlur={false} // Enables or disables mipmap blur.
            resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
            resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;
