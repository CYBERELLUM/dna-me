import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface CellularAgingData {
  senescenceLevel: number; // 0-1
  mitochondrialHealth: number; // 0-1
  telomereLength: number; // 0-1
  autophagyActivity: number; // 0-1
  inflammationLevel: number; // 0-1
  projectionYears: number;
}

interface CellularAging3DProps {
  data?: CellularAgingData;
  autoRotate?: boolean;
  showProjection?: boolean;
}

// Cell membrane
const CellMembrane = ({ senescenceLevel }: { senescenceLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
      // Membrane becomes more irregular with senescence
      const distortion = senescenceLevel * 0.1;
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime) * distortion;
      meshRef.current.scale.z = 1 + Math.cos(state.clock.elapsedTime) * distortion;
    }
  });

  // Color shifts from healthy blue-green to aged yellow-red
  const color = new THREE.Color().lerpColors(
    new THREE.Color("#22c55e"),
    new THREE.Color("#f59e0b"),
    senescenceLevel
  );

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
};

// Nucleus
const Nucleus = ({ senescenceLevel }: { senescenceLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.z += 0.001;
    }
  });

  const color = new THREE.Color().lerpColors(
    new THREE.Color("#6366f1"),
    new THREE.Color("#dc2626"),
    senescenceLevel * 0.5
  );

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {/* Nuclear envelope */}
      <mesh>
        <sphereGeometry args={[1.3, 24, 24]} />
        <meshStandardMaterial 
          color="#818cf8"
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
};

// Mitochondria
const Mitochondria = ({ health, count }: { health: number; count: number }) => {
  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const radius = 1.8 + Math.random() * 0.5;
      pos.push([
        Math.cos(theta) * radius,
        (Math.random() - 0.5) * 2,
        Math.sin(theta) * radius
      ]);
    }
    return pos;
  }, [count]);

  const color = new THREE.Color().lerpColors(
    new THREE.Color("#ef4444"), // Unhealthy
    new THREE.Color("#22c55e"), // Healthy
    health
  );

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.random(), Math.random(), 0]}>
          <capsuleGeometry args={[0.1, 0.3, 8, 8]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={health * 0.3}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

// Telomere visualization on chromosome ends
const Telomeres = ({ length }: { length: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  const telomereLength = 0.1 + length * 0.4;
  const color = new THREE.Color().lerpColors(
    new THREE.Color("#ef4444"), // Short/aged
    new THREE.Color("#22c55e"), // Long/young
    length
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Chromosome body */}
      <mesh>
        <capsuleGeometry args={[0.15, 0.8, 8, 8]} />
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.5} />
      </mesh>
      
      {/* Telomere caps */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[telomereLength, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <sphereGeometry args={[telomereLength, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

// Autophagy bodies (lysosomes)
const Autophagy = ({ activity }: { activity: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = Math.floor(activity * 8) + 2;
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y += Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
      });
    }
  });

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ]);
    }
    return pos;
  }, [count]);

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial 
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={activity * 0.5}
            transparent
            opacity={0.7 + activity * 0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// Inflammation particles
const Inflammation = ({ level }: { level: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = Math.floor(level * 15);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.children.forEach((child, i) => {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3;
        child.scale.setScalar(scale);
      });
    }
  });

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2.5 + Math.random() * 0.5;
      pos.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ]);
    }
    return pos;
  }, [count]);

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial 
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={level}
          />
        </mesh>
      ))}
    </group>
  );
};

interface CellularSceneProps {
  data: CellularAgingData;
  autoRotate: boolean;
}

const CellularScene = ({ data, autoRotate }: CellularSceneProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const mitochondriaCount = Math.floor((1 - data.senescenceLevel) * 8) + 4;

  return (
    <group ref={groupRef}>
      <CellMembrane senescenceLevel={data.senescenceLevel} />
      <Nucleus senescenceLevel={data.senescenceLevel} />
      <Mitochondria health={data.mitochondrialHealth} count={mitochondriaCount} />
      <Autophagy activity={data.autophagyActivity} />
      <Inflammation level={data.inflammationLevel} />
      
      {/* Telomere display */}
      <group position={[-2, 2, 0]} scale={0.8}>
        <Telomeres length={data.telomereLength} />
      </group>

      {/* Labels */}
      <Text position={[0, 4, 0]} fontSize={0.25} color="#f59e0b">
        Cellular Aging Visualization
      </Text>
      <Text position={[-2, 2.8, 0]} fontSize={0.15} color="#22c55e">
        Telomeres: {Math.round(data.telomereLength * 100)}%
      </Text>
    </group>
  );
};

const DEFAULT_DATA: CellularAgingData = {
  senescenceLevel: 0.3,
  mitochondrialHealth: 0.7,
  telomereLength: 0.6,
  autophagyActivity: 0.5,
  inflammationLevel: 0.2,
  projectionYears: 10
};

const CellularAging3D = ({
  data = DEFAULT_DATA,
  autoRotate = true,
  showProjection = false
}: CellularAging3DProps) => {
  return (
    <div className="w-full h-[400px] bg-secondary/30 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#22c55e" />
        
        <CellularScene data={data} autoRotate={autoRotate} />
        
        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );
};

export default CellularAging3D;