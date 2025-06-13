"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"

const ParticleField = () => {
  const particleCount = 100
  const particlesRef = useRef<THREE.Points>(null!)
  const { viewport } = useThree()

  // Create particles with random positions, sizes and speeds
  const { positions, sizes, speeds, opacities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const speeds = new Float32Array(particleCount)
    const opacities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Full width distribution (with extra margin to ensure full coverage)
      positions[i * 3] = (Math.random() * 2 - 1) * viewport.width * 1.1

      // Distribute across entire viewport height initially
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * viewport.height * 1.1

      // Vary depth slightly
      positions[i * 3 + 2] = Math.random() * 2 - 1

      // Smaller sizes (0.01 to 0.03 - will be in world units)
      sizes[i] = Math.random() * 0.03 + 0.01

      // Random downward speed
      speeds[i] = (Math.random() * 0.005 + 0.005) * -1 // Negative for downward

      // Correlation between size and opacity (smaller = less bright)
      // Map size 0.01-0.03 to opacity 0.2-0.8
      const sizeNormalized = (sizes[i] - 0.01) / 0.02 // 0 to 1
      opacities[i] = sizeNormalized * 0.6 + 0.2 // 0.2 to 0.8
    }

    return { positions, sizes, speeds, opacities }
  }, [viewport])

  // Update viewport on resize
  useEffect(() => {
    const updateParticlePositions = () => {
      if (!particlesRef.current) return

      const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        // Update x positions based on new viewport width
        positionArray[i * 3] = (Math.random() * 2 - 1) * viewport.width * 1.1
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }

    window.addEventListener("resize", updateParticlePositions)
    return () => window.removeEventListener("resize", updateParticlePositions)
  }, [particleCount, viewport])

  // Animation loop
  useFrame(() => {
    if (!particlesRef.current) return

    const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array

    // Update each particle position
    for (let i = 0; i < particleCount; i++) {
      // Move particle downward
      positionArray[i * 3 + 1] += speeds[i]

      // Reset particle when it goes below screen
      if (positionArray[i * 3 + 1] < -viewport.height * 0.5) {
        positionArray[i * 3] = (Math.random() * 2 - 1) * viewport.width * 1.1
        positionArray[i * 3 + 1] = viewport.height + Math.random() * 2
        positionArray[i * 3 + 2] = Math.random() * 2 - 1
      }
    }

    // Update the geometry
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;
          
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          
          void main() {
            float distance = length(gl_PointCoord - vec2(0.5, 0.5));
            if (distance > 0.5) discard;
            gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
          }
        `}
      />
    </points>
  )
}

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ alpha: true }}>
        <ParticleField />
      </Canvas>
    </div>
  )
}
