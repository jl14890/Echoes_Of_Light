import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

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

function FPSControls({ setMessage }) {
    const { camera, scene } = useThree();
    const [audioStarted, setAudioStarted] = useState(false);
    const [volume, setupAudioProcessing] = useAudioVolume(setAudioStarted);
    const [hasTriggered, setHasTriggered] = useState(false);

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

        //handle server connection
        const updateState = () => {
            socket.emit('updateState', { position: localPlayerRef.current.position, volume: localPlayerRef.current.volume });
        };

        document.addEventListener('mousemove', updateState); // Simplified example
        return () => document.removeEventListener('mousemove', updateState);
        //end of server connection

    }, [audioStarted]);

    const handleCollisionEffect = (intersect) => {
        const exitMesh = scene.getObjectByName("Exit");
        if (exitMesh && !hasTriggered) {
            exitMesh.material.emissiveIntensity = 2;
            exitMesh.material.needsUpdate = true;

            setHasTriggered(true); // Prevent further triggers

            setTimeout(() => {
                const messages = ["here we go again", "nope... I guess", "yay... I love it here", "I'm back!", "ah..shit", "c'mon"];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                setMessage(randomMessage);  // Set message
                setTimeout(() => setMessage(null), 5000); // Clear message after 5 seconds

                camera.position.set(0, 0, 0); // Reset camera position

                const roomMesh = scene.getObjectByName("Room");
                if (roomMesh) {
                    roomMesh.rotation.set(
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2
                    );
                    // console.log("Room rotation reset");
                }

                exitMesh.material.emissiveIntensity = 0; // Reset emissive intensity
                exitMesh.material.needsUpdate = true;

                setHasTriggered(false); // Allow triggering again
            }, 0);
        }
    };

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

        // Collision detection moved to useFrame
        camera.getWorldDirection(direction.current);
        raycaster.set(sphereRef.current.position, direction.current);
        const intersects = raycaster.intersectObjects(scene.children, true);
        intersects.forEach(intersect => {
            if (intersect.object.name === "outCube" && intersect.distance < 1) {
                handleCollisionEffect(intersect);
            }
        });
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
        // Remaining movement logic that doesn't involve collision detection
        const right = new THREE.Vector3();
        right.crossVectors(direction.current, new THREE.Vector3(0, 1, 0)).normalize();
        raycasterRight.set(sphereRef.current.position, right);

        const collisionForward = raycaster.intersectObjects(scene.children, true);
        const collisionLeft = raycasterLeft.intersectObjects(scene.children, true);
        const collisionRight = raycasterRight.intersectObjects(scene.children, true);

        if ((collisionForward.length > 0 && collisionForward[0].distance < 1) ||
            (collisionLeft.length > 0 && collisionLeft[0].distance < 1) ||
            (collisionRight.length > 0 && collisionRight[0].distance < 1)) {
            velocity.current.set(0, 0, 0);  // Prevent movement if an obstacle is too close
        } else {
            moveIfPossible(delta);  // Only move if no immediate obstacles
        }
    }

    function adjustLightIntensity(volume) {
        const minIntensity = 0.5; // Keep a base level for visibility
        const maxIntensity = 50; // Allow for a broader range of intensity
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

export default FPSControls;
