import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function isOverlapping(sphere1, sphere2) {
    const distance = sphere1.position.distanceTo(sphere2.position);
    return distance < (sphere1.radius + sphere2.radius);
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

export default RandomSpheres;