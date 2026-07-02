import React, { useMemo, useRef, useState, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const StarField: React.FC<{ count: number }> = ({ count }) => {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.8} />
    </points>
  );
};

const Planet: React.FC<{ 
  id: string,
  position: [number, number, number], 
  color: string, 
  size: number, 
  journals: any[], 
  onClick: (journals: any[]) => void,
  onDragEnd: (id: string, pos: { x: number, y: number, z: number }) => void 
}> = ({ id, position, color, size, journals, onClick, onDragEnd }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const { viewport, camera } = useThree();

  return (
    <Float speed={isDragging ? 0 : 2} rotationIntensity={isDragging ? 0 : 1} floatIntensity={isDragging ? 0 : 1}>
      <mesh 
        ref={meshRef}
        position={position}
        onClick={(e) => { 
          if (e.delta <= 5) {
            e.stopPropagation(); 
            onClick(journals); 
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as any).setPointerCapture(e.pointerId);
          hasDragged.current = false;
          setIsDragging(true);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          (e.target as any).releasePointerCapture(e.pointerId);
          setIsDragging(false);
          if (hasDragged.current && meshRef.current) {
            onDragEnd(id, { 
              x: meshRef.current.position.x, 
              y: meshRef.current.position.y, 
              z: meshRef.current.position.z 
            });
          }
          hasDragged.current = false;
        }}
        onPointerMove={(e) => {
          if (isDragging && meshRef.current) {
            hasDragged.current = true;
            const vector = new THREE.Vector3(
              (e.clientX / window.innerWidth) * 2 - 1,
              -(e.clientY / window.innerHeight) * 2 + 1,
              0.5
            );
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = (meshRef.current.position.z - camera.position.z) / dir.z;
            const pos = camera.position.clone().add(dir.multiplyScalar(distance));
            meshRef.current.position.x = pos.x;
            meshRef.current.position.y = pos.y;
          }
        }}
        onPointerOver={() => (document.body.style.cursor = 'grab')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          speed={2}
          distort={0.3}
          radius={1}
        />
      </mesh>
    </Float>
  );
};

interface SkyBackgroundProps {
  totalStars: number;
  planetsData: any[];
  looseJournals: any[];
  onStarClick: (journal: any) => void;
  onPlanetClick: (journals: any[]) => void;
  onJournalPositionUpdate: (id: string, pos: { x: number, y: number, z: number }) => void;
  onPlanetPositionUpdate: (id: string, pos: { x: number, y: number, z: number }) => void;
  paused?: boolean;
}

const JournalStar: React.FC<{ 
  position: [number, number, number], 
  journal: any, 
  onClick: (journal: any) => void,
  onDragEnd: (id: string, pos: { x: number, y: number, z: number }) => void,
  paused?: boolean 
}> = ({ position, journal, onClick, onDragEnd, paused }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const { camera } = useThree();

  const seed = useMemo(() => 
    journal._id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  , [journal._id]);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 0.15;
    const innerRadius = 0.06;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 1
  };

  useFrame((state) => {
    if (!meshRef.current || isDragging || paused) return;
    const t = state.clock.elapsedTime;
    
    // Combine multiple sine waves to create an organic, random-looking wander
    const dx = Math.sin(t * 0.15 + seed) * 0.3 + Math.cos(t * 0.22 + seed * 2) * 0.2;
    const dy = Math.cos(t * 0.18 + seed * 3) * 0.3 + Math.sin(t * 0.25 + seed * 4) * 0.2;
    const dz = Math.sin(t * 0.1 + seed * 5) * 0.1;
    
    meshRef.current.position.set(
      position[0] + dx, 
      position[1] + dy, 
      position[2] + dz
    );
    
    meshRef.current.rotation.x = t * 0.3 + seed;
    meshRef.current.rotation.y = t * 0.2 + seed;
  });

  return (
    <mesh 
      ref={meshRef}
      position={position}
      onClick={(e) => {
        if (e.delta <= 5) {
          e.stopPropagation();
          onClick(journal);
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as any).setPointerCapture(e.pointerId);
        hasDragged.current = false;
        setIsDragging(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        (e.target as any).releasePointerCapture(e.pointerId);
        setIsDragging(false);
        if (hasDragged.current && meshRef.current) {
          onDragEnd(journal._id, { 
            x: meshRef.current.position.x, 
            y: meshRef.current.position.y, 
            z: meshRef.current.position.z 
          });
        }
        hasDragged.current = false;
      }}
      onPointerMove={(e) => {
        if (isDragging && meshRef.current) {
          hasDragged.current = true;
          const vector = new THREE.Vector3(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1,
            0.5
          );
          vector.unproject(camera);
          const dir = vector.sub(camera.position).normalize();
          const distance = (meshRef.current.position.z - camera.position.z) / dir.z;
          const pos = camera.position.clone().add(dir.multiplyScalar(distance));
          meshRef.current.position.x = pos.x;
          meshRef.current.position.y = pos.y;
        }
      }}
      onPointerOver={() => (document.body.style.cursor = 'grab')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <extrudeGeometry args={[starShape, extrudeSettings]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} toneMapped={false} />
    </mesh>
  );
};

const SkyBackground: React.FC<SkyBackgroundProps> = ({ 
  totalStars, 
  planetsData, 
  looseJournals, 
  onStarClick, 
  onPlanetClick,
  onJournalPositionUpdate,
  onPlanetPositionUpdate,
  paused
}) => {
  const planets = useMemo(() => {
    return planetsData.map((planet) => {
      // Use saved position if available
      if (planet.position) {
        return {
          id: planet._id,
          journals: planet.journals,
          position: [planet.position.x, planet.position.y, planet.position.z] as [number, number, number],
          color: planet.color || '#4a90e2',
          size: 0.6 + (planet.journals.length * 0.05)
        };
      }

      // Deterministic position based on planet ID
      const seed = planet._id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = ((seed * 7.5) % 20) - 10;
      const y = ((seed * 11.5) % 12) - 6;
      const z = ((seed * 13.5) % 4) - 2;

      return {
        id: planet._id,
        journals: planet.journals,
        position: [x, y, z] as [number, number, number],
        color: planet.color || '#4a90e2',
        size: 0.6 + (planet.journals.length * 0.05)
      };
    });
  }, [planetsData]);

  const journalStars = useMemo(() => {
    return looseJournals.map((journal) => {
      // Use saved position if available
      if (journal.position) {
        return { 
          id: journal._id, 
          position: [journal.position.x, journal.position.y, journal.position.z] as [number, number, number], 
          journal 
        };
      }

      // Deterministic position based on journal ID
      const seed = journal._id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = ((seed * 1.5) % 12) - 6;
      const y = ((seed * 2.5) % 8) - 4;
      const z = ((seed * 3.5) % 4) - 2;
      return { id: journal._id, position: [x, y, z] as [number, number, number], journal };
    });
  }, [looseJournals]);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} frameloop={paused ? 'demand' : 'always'}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <StarField count={totalStars * 10} />

        {journalStars.map((star) => (
          <JournalStar 
            key={star.id} 
            position={star.position} 
            journal={star.journal}
            onClick={onStarClick}
            onDragEnd={onJournalPositionUpdate}
            paused={paused}
          />
        ))}

        {planets.map((planet) => (
          <Planet
            key={planet.id}
            id={planet.id}
            position={planet.position}
            color={planet.color}
            size={planet.size}
            journals={planet.journals}
            onClick={onPlanetClick}
            onDragEnd={onPlanetPositionUpdate}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default memo(SkyBackground);
