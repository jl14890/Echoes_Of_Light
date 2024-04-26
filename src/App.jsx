import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlurPass, Resizer, KernelSize, Resolution, BlendFunction } from 'postprocessing'
import { useGLTF, PointerLockControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Leva, useControls } from 'leva';

import './App.css';

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

// function isOverlapping(box1, box2) {
//   const distance = box1.position.distanceTo(box2.position);
//   const maxDimension1 = Math.max(box1.dimensions.x, box1.dimensions.y, box1.dimensions.z);
//   const maxDimension2 = Math.max(box2.dimensions.x, box2.dimensions.y, box2.dimensions.z);
//   return distance < (maxDimension1 / 2 + maxDimension2 / 2);
// }

// function RandomBoxes() {
//   const texture = useTexture('/assets/gigerDis.png');
//   const boxes = [];

//   for (let i = 0; i < 50; i++) {
//     let position, dimensions, rotation;
//     let overlap, attempts = 0;

//     do {
//       position = new THREE.Vector3(
//         (Math.random() - 0.5) * 20, // x position in range -10 to 10
//         (Math.random() - 0.5) * 20, // y position in range -10 to 10
//         (Math.random() - 0.5) * 20  // z position in range -10 to 10
//       );
//       dimensions = new THREE.Vector3(
//         Math.random() * 3 + 0.5, // width between 0.5 and 3.5 units
//         Math.random() * 3 + 0.5, // height between 0.5 and 3.5 units
//         Math.random() * 3 + 0.5  // depth between 0.5 and 3.5 units
//       );
//       rotation = new THREE.Euler(
//         Math.random() * Math.PI, // rotation about x-axis
//         Math.random() * Math.PI, // rotation about y-axis
//         Math.random() * Math.PI  // rotation about z-axis
//       );

//       overlap = boxes.some(box => isOverlapping({
//         position: position,
//         dimensions: dimensions
//       }, box));

//       attempts++;
//       if (attempts > 200) { // prevent infinite loops
//         console.log("Failed to place all boxes without overlap after 200 attempts");
//         break;
//       }
//     } while (overlap);

//     if (!overlap) {
//       boxes.push({ position, rotation, dimensions });
//     }
//   }

//   return (
//     <>
//       {boxes.map((box, index) => (
//         <mesh
//           key={index}
//           position={[box.position.x, box.position.y, box.position.z]}
//           rotation={[box.rotation.x, box.rotation.y, box.rotation.z]}
//         >
//           <boxGeometry args={[box.dimensions.x, box.dimensions.y, box.dimensions.z, 100, 100, 100]} /> {/* Subdivision for displacement */}
//           <meshStandardMaterial
//             map={texture}
//             displacementMap={texture}
//             displacementScale={0.1}
//             // color="white"
//             // emissive="white"
//             emissiveIntensity={0.5}
//           />
//         </mesh>
//       ))}
//     </>
//   );
// }

function TerrainModel() {
  const { scene } = useGLTF('/assets/terrain.glb');
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
      child.material.map = texture; // Set diffuse map
      child.material.displacementMap = texture; // Set displacement map
      child.material.displacementScale = 0.1; // Adjust displacement scale
      child.material.needsUpdate = true; // Ensure the material updates
    }
  });

  return <primitive object={scene} scale={10} />;
}

// Hook to capture audio volume
function useAudioVolume() {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef();
  const analyserRef = useRef();
  const dataArrayRef = useRef();

  const setupAudioProcessing = async () => {
    const audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const updateVolume = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] / 128 - 1) * 3; // Amplify the signal by a factor of 3
        sum += value * value; // Square to get power
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const scaledVolume = rms * 100; // Scale volume for easier handling
      setVolume(scaledVolume);
      requestAnimationFrame(updateVolume);
    };
    updateVolume();
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return [volume, setupAudioProcessing];
}

function FPSControls() {
  const { camera, scene } = useThree();
  const [audioStarted, setAudioStarted] = useState(false);
  const [volume, setupAudioProcessing] = useAudioVolume(setAudioStarted);

  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const direction = useRef(new THREE.Vector3());
  const moveSpeed = 1;
  const keyMap = useRef({});
  const sphereRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const lerpFactor = 0.1;
  const raycaster = new THREE.Raycaster();
  const raycasterLeft = new THREE.Raycaster();
  const raycasterRight = new THREE.Raycaster();

  const boundarySphereRadius = 8; // Define the radius of the boundary sphere
  const boundarySphereCenter = new THREE.Vector3(0, 0, 0); // Typically the origin

  useEffect(() => {
    function handleKeyDown(event) {
      keyMap.current[event.code] = true;
      if (!audioStarted) {
        setupAudioProcessing(); // Start audio processing on first key down
      }
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
  }, [audioStarted]);

  useFrame((state, delta) => {
    if (!camera) return;

    const intendedPosition = camera.position.clone().add(velocity.current);
    if (intendedPosition.distanceTo(boundarySphereCenter) > boundarySphereRadius) {
      // If outside the boundary, adjust the position to stay within it
      intendedPosition.sub(boundarySphereCenter).normalize().multiplyScalar(boundarySphereRadius).add(boundarySphereCenter);
      velocity.current.set(0, 0, 0); // Optionally stop movement
    }

    // Update camera position
    camera.position.copy(intendedPosition);

    velocity.current.multiplyScalar(0.9); // Apply friction to simulate a more natural stop


    if (sphereRef.current) {
      updateSpherePosition();
      smoothUpdateSpherePosition(delta);
      handleMovement(delta);
      adjustLightIntensity(volume); // Adjust light and emissiveness based on volume
    }
  });

  function updateSpherePosition() {
    const forwardOffset = 1.5; // How far in front of the camera the sphere should be
    const verticalOffset = 0; // Vertical offset, negative moves it down, positive moves it up
    camera.getWorldDirection(direction.current);
    targetPosition.current.copy(camera.position).add(
      direction.current.multiplyScalar(forwardOffset).add(new THREE.Vector3(0, verticalOffset, 0))
    );
  }

  function smoothUpdateSpherePosition(delta) {
    sphereRef.current.position.lerp(targetPosition.current, lerpFactor);
  }

  function handleMovement(delta) {
    // Main forward direction
    camera.getWorldDirection(direction.current);
    direction.current.normalize();
    raycaster.set(sphereRef.current.position, direction.current);

    // Left direction
    const left = new THREE.Vector3();
    left.crossVectors(new THREE.Vector3(0, 1, 0), direction.current).normalize();
    raycasterLeft.set(sphereRef.current.position, left);

    // Right direction
    const right = new THREE.Vector3();
    right.crossVectors(direction.current, new THREE.Vector3(0, 1, 0)).normalize();
    raycasterRight.set(sphereRef.current.position, right);

    const collisionForward = raycaster.intersectObjects(scene.children, true);
    const collisionLeft = raycasterLeft.intersectObjects(scene.children, true);
    const collisionRight = raycasterRight.intersectObjects(scene.children, true);

    if ((collisionForward.length > 0 && collisionForward[0].distance < 1) ||
      (collisionLeft.length > 0 && collisionLeft[0].distance < 1) ||
      (collisionRight.length > 0 && collisionRight[0].distance < 1)) {
      // Prevent movement if there is an obstacle within 1 unit in any direction
      velocity.current.set(0, 0, 0);
    } else {
      moveIfPossible(delta);
    }
  }

  function adjustLightIntensity(volume) {
    const minIntensity = 2; // Keep a base level for visibility
    const maxIntensity = 100; // Allow for a broader range of intensity
    const minEmissive = 1; // Base emissive level
    const maxEmissive = 10; // Allow more range for emissive intensity

    const light = sphereRef.current.children.find(child => child.isPointLight);
    const material = sphereRef.current.material;

    if (light && material) {
      // Adjust based on scaled volume, ensuring it respects the new minimums and maximums
      light.intensity = Math.max(minIntensity, Math.min(maxIntensity, volume));
      material.emissiveIntensity = Math.max(minEmissive, Math.min(maxEmissive, volume / 10));
    }
  }

  function moveIfPossible(delta) {
    const speed = delta * moveSpeed;
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction.current, up);

    if (keyMap.current['KeyW']) velocity.current.addScaledVector(direction.current, speed);
    if (keyMap.current['KeyS']) velocity.current.addScaledVector(direction.current, -speed);
    if (keyMap.current['KeyA']) velocity.current.addScaledVector(right, -speed);
    if (keyMap.current['KeyD']) velocity.current.addScaledVector(right, speed);
    if (keyMap.current['KeyQ']) velocity.current.y -= speed;
    if (keyMap.current['KeyE']) velocity.current.y += speed;

    sphereRef.current.position.add(velocity.current);
    camera.position.add(velocity.current);
    velocity.current.multiplyScalar(0.85);
  }

  return (
    <>
      <PointerLockControls />
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        <pointLight position={[0, 0, 0]} intensity={20} distance={50} color="white" />
      </mesh>
    </>
  );
}

function RandomSpheres() {
  const texture = useTexture('/assets/gigerDis.png');
  const { scene } = useThree();
  const spheres = useMemo(() => {
    const tempSpheres = [];
    for (let i = 0; i < 50; i++) {
      let position, radius, rotation, displacementScale, rotateSpeed, rotateAxis;
      let overlap, attempts = 0;

      do {
        position = new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        radius = Math.random() * 1.5 + 0.5;
        rotation = new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        displacementScale = Math.random() * 0.01 + 0.1;
        rotateSpeed = Math.random() * 0.001 + 0.001; // Random rotation speed between 0.01 and 0.05 radians/frame
        rotateAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(); // Random rotation axis

        overlap = tempSpheres.some(sphere => isOverlapping({
          position: position,
          radius: radius
        }, sphere));

        attempts++;
        if (attempts > 200) {
          console.log("Failed to place all spheres without overlap after 200 attempts");
          break;
        }
      } while (overlap);

      if (!overlap) {
        tempSpheres.push({ position, radius, rotation, displacementScale, rotateSpeed, rotateAxis });
      }
    }
    return tempSpheres;
  }, []);

  useFrame(() => {
    spheres.forEach((sphere, idx) => {
      const mesh = scene.getObjectByName(`sphere-${idx}`);
      if (mesh) {
        // Update displacement scale
        if (!mesh.userData.targetScale || Math.abs(mesh.material.displacementScale - mesh.userData.targetScale) < 0.05) {
          mesh.userData.targetScale = Math.random() * 0.3 + 0.1;
        }
        const lerpFactor = 0.05;
        mesh.material.displacementScale += (mesh.userData.targetScale - mesh.material.displacementScale) * lerpFactor;

        // Apply rotation
        mesh.rotateOnAxis(sphere.rotateAxis, sphere.rotateSpeed);

        mesh.material.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {spheres.map((sphere, index) => (
        <mesh
          key={index}
          name={`sphere-${index}`}
          position={[sphere.position.x, sphere.position.y, sphere.position.z]}
          rotation={[sphere.rotation.x, sphere.rotation.y, sphere.rotation.z]}
          userData={{ targetScale: sphere.displacementScale }}
        >
          <sphereGeometry args={[sphere.radius, 128, 128]} />
          <meshStandardMaterial
            map={texture}
            displacementMap={texture}
            displacementScale={sphere.displacementScale}
          />
        </mesh>
      ))}
    </>
  );
}

function isOverlapping(sphere1, sphere2) {
  const distance = sphere1.position.distanceTo(sphere2.position);
  return distance < (sphere1.radius + sphere2.radius);
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

  const handleClick = () => {
    setTextVisible(false); // Set text visibility to false on click
  };
  return (
    <div onClick={handleClick}>
      <BackgroundMusic src="/assets/musicRadio.mp3" />
      <Canvas
        style={{ width: `100%`, height: `100vh`, backgroundColor: 'black' }}
        camera={{ position: [0, 0, 0] }}>
        {/* <ambientLight intensity={0.5} /> */}
        {/* {directionalLightOn && <directionalLight position={[5, 5, 5]} intensity={1} />} */}
        <TerrainModel />
        {/* <ControlledSphere /> */}
        <FPSControls />
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
        <div className='title'>Echoes Of Light</div>
      </div>}
    </div>
  );
}

export default App;
