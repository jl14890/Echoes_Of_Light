import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlurPass, Resizer, KernelSize, Resolution, BlendFunction } from 'postprocessing'
import { useGLTF, PointerLockControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Leva, useControls } from 'leva';
import io from 'socket.io-client';


import FPSControls from './FPSMulti.jsx';
import RandomSpheres from './RandomBalls.jsx';

import './App.css';

const socket = io('https://jl14890.itp.io'); // Connect to the server

function TerrainModel() {
  const { scene } = useGLTF('/assets/terrain1.glb');
  const texture = useTexture('/assets/gigerDis.png');

  // Apply random rotation when the component mounts
  useEffect(() => {
    const randomRotationX = Math.random() * Math.PI * 2; // Random rotation between 0 and 360 degrees (in radians)
    const randomRotationY = Math.random() * Math.PI * 2; // Random rotation between 0 and 360 degrees (in radians)
    const randomRotationZ = Math.random() * Math.PI * 2; // Random rotation between 0 and 360 degrees (in radians)

    scene.rotation.set(randomRotationX, randomRotationY, randomRotationZ);
  }, [scene]);

  scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "Room") {
        child.material.map = texture;  // Apply the diffuse map
        child.material.displacementMap = texture;  // Apply the displacement map
        child.material.displacementScale = 0.1;  // Set the displacement scale
        child.material.needsUpdate = true;  // Ensure the material updates
      }
      if (child.name === "Exit") {
        // Apply a strong emissive material to the "Exit" mesh
        const exitMaterial = new THREE.MeshStandardMaterial({
          color: 'grey', // Set the color to black
          metalness: 0.8, // Full metalness to simulate a metal surface
          roughness: 0.1, // Low roughness to make the surface glossy
          emissive: 0xffffff, // Strong white emissive color
          emissiveIntensity: 0, // High emissive intensity
        });
        child.material = exitMaterial;
      } else if (child.name === "outCube") {
        // Apply a completely transparent material to the "outCube" mesh
        const transparentMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff, // Base color (not important in this case)
          transparent: true, // Enable transparency
          opacity: 0, // Fully transparent
        });
        child.material = transparentMaterial;
      }
    }

  });

  return <primitive object={scene} scale={10} />;
}

const BackgroundMusic = ({ src }) => {
  const audioRef = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasStarted.current && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            hasStarted.current = true;
            // Gradually increase volume for ease-in effect
            audioRef.current.volume = 0;
            let volume = 0;
            const interval = setInterval(() => {
              if (volume < 1) {
                volume += 0.1;
                audioRef.current.volume = volume;
              } else {
                clearInterval(interval);
              }
            }, 200);
          })
          .catch(err => console.error('Failed to play:', err));
      }
    };

    window.addEventListener('click', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return <audio ref={audioRef} src={src} loop controls={false} style={{ display: 'none' }} />;
};

function App() {
  // const { directionalLightOn } = useControls({
  //   directionalLightOn: false
  // });
  const [isTextVisible, setTextVisible] = useState(true); // State to control text visibility
  const [message, setMessage] = useState(null);

  //handle server connection
  const [players, setPlayers] = useState({});
  const localPlayerRef = useRef();

  useEffect(() => {
    socket.on('allPlayers', (allPlayers) => {
      setPlayers(allPlayers);
    });

    socket.on('newPlayer', (data) => {
      setPlayers(prev => ({ ...prev, [data.id]: data.state }));
    });

    socket.on('stateUpdated', (data) => {
      setPlayers(prev => ({ ...prev, [data.id]: data.state }));
    });

    socket.on('playerLeft', (id) => {
      setPlayers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    });

    return () => {
      socket.off('allPlayers');
      socket.off('newPlayer');
      socket.off('stateUpdated');
      socket.off('playerLeft');
    };
  }, []);
  //end server connection

  const handleClick = () => {
    setTextVisible(false); // Set text visibility to false on click
  };
  return (
    <div onClick={handleClick}>
      <BackgroundMusic src="/assets/musicRadio.mp3" />
      <Canvas
        style={{ width: `100%`, height: `100vh`, backgroundColor: 'black' }}
        camera={{ position: [0, 0, 0] }}>
        {/* <ambientLight intensity={10} /> */}
        {/* <directionalLight position={[5, 5, 5]} intensity={2} /> */}
        <TerrainModel />
        {/* <ControlledSphere /> */}



        {/* <FPSControls setMessage={setMessage} /> */}
        {Object.entries(players).map(([id, state]) => (
          <FPSControls key={id} initialPosition={state.position} setMessage={setMessage} playerRef={id === socket.id ? localPlayerRef : null} />
        ))}


        <RandomSpheres />
        <EffectComposer>
          <Bloom
            intensity={0.5} // The bloom intensity.
            blurPass={undefined} // A blur pass.
            kernelSize={KernelSize.VERY_LARGE} // blur kernel size
            luminanceThreshold={0.5} // luminance threshold. Raise this value to mask out darker elements in the scene.
            luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
            mipmapBlur={false} // Enables or disables mipmap blur.
            resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
            resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
          />
          <Noise
            premultiply // enables or disables noise premultiplication
            blendFunction={BlendFunction.ADD} // blend mode
          />
        </EffectComposer>
      </Canvas>
      {isTextVisible && <div>
        <div className="clickToStart">click to start</div>
        <div className='title'>ECHOES OF LIGHT</div>
      </div>}
      {message && <div className="text-front">{message}</div>}
    </div>
  );
}

export default App;
