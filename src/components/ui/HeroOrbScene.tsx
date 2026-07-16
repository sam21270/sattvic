"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FOOD_EMOJIS = [
  "🥑", "🍅", "🥦", "🥕", "🍊", "🍋", "🫑", "🌽",
  "🍆", "🥬", "🍇", "🍓", "🥭", "🍍", "🥒", "🧄",
  "🍄", "🌰", "🍌", "🫘",
];

function makeEmojiTexture(emoji: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${size * 0.72}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface Particle {
  emoji: string;
  anchorFx: number;
  anchorFy: number;
  homeZ: number;
  wobbleAmpX: number;
  wobbleAmpY: number;
  wobbleSpeedX: number;
  wobbleSpeedY: number;
  wobblePhase: number;
  scale: number;
  spinSpeed: number;
}

const PARTICLE_COUNT = 16;
const REPEL_RADIUS = 1.4;
const REPEL_STRENGTH = 1.1;

function FoodSwarm({ reducedMotion }: { reducedMotion: boolean }) {
  const { viewport } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 4 < 2 ? 1 : -1;
      return {
        emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
        anchorFx: signX * (0.72 + Math.random() * 0.34),
        anchorFy: signY * (0.6 + Math.random() * 0.4),
        homeZ: -1.5 - Math.random() * 3,
        wobbleAmpX: 0.12 + Math.random() * 0.1,
        wobbleAmpY: 0.12 + Math.random() * 0.1,
        wobbleSpeedX: 0.3 + Math.random() * 0.25,
        wobbleSpeedY: 0.25 + Math.random() * 0.25,
        wobblePhase: Math.random() * Math.PI * 2,
        scale: 0.45 + Math.random() * 0.35,
        spinSpeed: (Math.random() - 0.5) * 0.5,
      };
    })
  );

  const [textures] = useState(() => particles.map((p) => makeEmojiTexture(p.emoji)));

  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const displayed = useRef(
    particles.map((p) => ({
      x: p.anchorFx * viewport.width * 0.5,
      y: p.anchorFy * viewport.height * 0.5,
    }))
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const cursorWorldX = reducedMotion ? 0 : pointer.current.x * viewport.width * 0.5;
    const cursorWorldY = reducedMotion ? 0 : pointer.current.y * viewport.height * 0.5;

    particles.forEach((p, i) => {
      const sprite = spriteRefs.current[i];
      if (!sprite) return;

      const anchorX = p.anchorFx * viewport.width * 0.5;
      const anchorY = p.anchorFy * viewport.height * 0.5;

      const wobbleX = reducedMotion ? 0 : Math.sin(t * p.wobbleSpeedX + p.wobblePhase) * p.wobbleAmpX;
      const wobbleY = reducedMotion ? 0 : Math.cos(t * p.wobbleSpeedY + p.wobblePhase) * p.wobbleAmpY;

      const homeX = anchorX + wobbleX;
      const homeY = anchorY + wobbleY;

      let targetX = homeX;
      let targetY = homeY;

      if (!reducedMotion) {
        const dx = homeX - cursorWorldX;
        const dy = homeY - cursorWorldY;
        const dist = Math.hypot(dx, dy) || 0.0001;
        if (dist < REPEL_RADIUS) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          targetX = homeX + (dx / dist) * force;
          targetY = homeY + (dy / dist) * force;
        }
      }

      const cur = displayed.current[i];
      cur.x = THREE.MathUtils.lerp(cur.x, targetX, 0.06);
      cur.y = THREE.MathUtils.lerp(cur.y, targetY, 0.06);

      sprite.position.set(cur.x, cur.y, p.homeZ);
      if (!reducedMotion) {
        sprite.material.rotation += p.spinSpeed * 0.01;
      }
    });
  });

  return (
    <group>
      {particles.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => {
            spriteRefs.current[i] = el;
          }}
          scale={[p.scale, p.scale, 1]}
        >
          <spriteMaterial map={textures[i]} transparent opacity={0.5} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// ── Nutrient Core: breathing wireframe sphere + orbiting particle rings ──────

function NutrientCore({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  // Base geometry with stored original positions for organic displacement
  const [[geometry, basePositions]] = useState(() => {
    const geo = new THREE.IcosahedronGeometry(1.65, 5);
    return [geo, Float32Array.from(geo.attributes.position.array)] as const;
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // Mouse parallax — the whole core leans toward the cursor
    const targetRotX = reducedMotion ? 0 : pointer.current.y * 0.25;
    const targetRotY = reducedMotion ? t * 0.05 : pointer.current.x * 0.35 + t * 0.06;
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.04);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.04);

    // Organic vertex breathing on the wireframe shell
    if (meshRef.current && basePositions && !reducedMotion) {
      const pos = (meshRef.current.geometry as THREE.BufferGeometry).attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ox = basePositions[i * 3];
        const oy = basePositions[i * 3 + 1];
        const oz = basePositions[i * 3 + 2];
        const noise =
          Math.sin(ox * 2.1 + t * 0.7) * 0.045 +
          Math.sin(oy * 2.7 + t * 0.55) * 0.045 +
          Math.sin(oz * 2.4 + t * 0.62) * 0.045;
        const s = 1 + noise;
        pos.setXYZ(i, ox * s, oy * s, oz * s);
      }
      pos.needsUpdate = true;
    }

    // Inner solid core gently pulses
    if (innerRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 1.2) * 0.04;
      innerRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, -2.5]}>
      {/* breathing wireframe shell */}
      {geometry && (
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.14} />
        </mesh>
      )}
      {/* inner glowing core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.55, 3]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.1} />
      </mesh>
      {/* orbiting rings */}
      <OrbitRing radius={2.2} speed={0.22} tilt={0.5} count={90} size={0.02} reducedMotion={reducedMotion} />
      <OrbitRing radius={2.7} speed={-0.15} tilt={-0.35} count={120} size={0.014} reducedMotion={reducedMotion} />
    </group>
  );
}

function OrbitRing({
  radius, speed, tilt, count, size, reducedMotion,
}: { radius: number; speed: number; tilt: number; count: number; size: number; reducedMotion: boolean }) {
  const ringRef = useRef<THREE.Points>(null);

  const [ringGeometry] = useState(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  });

  useFrame((state) => {
    if (!ringRef.current || reducedMotion) return;
    ringRef.current.rotation.y = state.clock.getElapsedTime() * speed;
  });

  return (
    <points ref={ringRef} rotation={[tilt, 0, tilt * 0.4]} geometry={ringGeometry}>
      <pointsMaterial color="#6ee7b7" size={size} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function HeroOrbScene() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 42 }}
      >
        <NutrientCore reducedMotion={reducedMotion} />
        <FoodSwarm reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
