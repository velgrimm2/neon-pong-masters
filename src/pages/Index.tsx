import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";

// ===== GAME CONSTANTS =====
const TABLE_WIDTH = 5;
const TABLE_DEPTH = 9;
const TABLE_HALF_W = TABLE_WIDTH / 2;
const TABLE_HALF_D = TABLE_DEPTH / 2;
const NET_Z = 0;
const BALL_RADIUS = 0.12;
const PADDLE_RADIUS = 0.45;
const BASE_SPEED = 0.06;
const MAX_SPEED = 0.14;
const WINNING_SCORE = 11;
const SPIN_DECAY = 0.96;
const SPIN_CURVE = 0.003;

// ===== AUDIO =====
let actx: AudioContext | null = null;
function initAudio() {
  if (!actx) actx = new (window.AudioContext || (window as any).webkitAudioContext)();
}
function playTone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.05) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
}
function sndHit(power: number) { playTone(400 + power * 200, 0.06, "sine", Math.min(0.08, 0.02 + power * 0.01)); }
function sndBounce() { playTone(900, 0.025, "sine", 0.05); }
function sndScore() { playTone(700, 0.12, "sine", 0.06); setTimeout(() => playTone(900, 0.12, "sine", 0.04), 80); }

// ===== GAME STATE (mutable ref for performance) =====
interface GameState {
  phase: "menu" | "playing" | "paused" | "ended";
  playerScore: number;
  aiScore: number;
  difficulty: number;
  ball: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    speed: number;
    spin: number;
    active: boolean;
    lastHitBy: number; // 1=player, -1=AI
    bounceHeight: number;
    bouncePhase: number;
  };
  player: {
    pos: THREE.Vector3;
    prevPos: THREE.Vector3;
    vel: THREE.Vector3;
  };
  ai: {
    pos: THREE.Vector3;
    prevPos: THREE.Vector3;
    vel: THREE.Vector3;
    targetPos: THREE.Vector3;
  };
  serving: boolean;
  serveSide: number;
  serveTimer: number;
  inputPos: THREE.Vector3;
  winner: string;
  particles: Array<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    color: string;
  }>;
}

function createGameState(): GameState {
  return {
    phase: "menu",
    playerScore: 0,
    aiScore: 0,
    difficulty: 1,
    ball: {
      pos: new THREE.Vector3(0, 0.3, 3),
      vel: new THREE.Vector3(0, 0, 0),
      speed: BASE_SPEED,
      spin: 0,
      active: false,
      lastHitBy: 0,
      bounceHeight: 0,
      bouncePhase: 0,
    },
    player: {
      pos: new THREE.Vector3(0, 0.3, TABLE_HALF_D - 0.5),
      prevPos: new THREE.Vector3(0, 0.3, TABLE_HALF_D - 0.5),
      vel: new THREE.Vector3(),
    },
    ai: {
      pos: new THREE.Vector3(0, 0.3, -TABLE_HALF_D + 0.5),
      prevPos: new THREE.Vector3(0, 0.3, -TABLE_HALF_D + 0.5),
      vel: new THREE.Vector3(),
      targetPos: new THREE.Vector3(0, 0.3, -TABLE_HALF_D + 0.5),
    },
    serving: true,
    serveSide: 1,
    serveTimer: 0,
    inputPos: new THREE.Vector3(0, 0.3, TABLE_HALF_D - 0.5),
    winner: "",
    particles: [],
  };
}

const AI_PARAMS = [
  { speed: 0.03, accuracy: 0.55, hitBoost: 0.3, missChance: 0.12 },
  { speed: 0.05, accuracy: 0.8, hitBoost: 0.6, missChance: 0.04 },
  { speed: 0.08, accuracy: 0.95, hitBoost: 0.9, missChance: 0.01 },
];

// ===== TABLE MODEL =====
function TableModel() {
  const { scene } = useGLTF("/models/table_tennis.glb");
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}

// ===== BALL =====
function Ball({ gs }: { gs: React.MutableRefObject<GameState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const b = gs.current.ball;
    const bounceY = b.bounceHeight > 0.5
      ? Math.abs(Math.sin(b.bouncePhase)) * b.bounceHeight * 0.05
      : 0;
    meshRef.current.position.set(b.pos.x, b.pos.y + bounceY + 0.15, b.pos.z);
    // Shadow on table
    if (shadowRef.current) {
      shadowRef.current.position.set(b.pos.x, 0.01, b.pos.z);
      const spread = 1 + bounceY * 2;
      shadowRef.current.scale.set(spread, 1, spread);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BALL_RADIUS * 1.2, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ===== PADDLE =====
function Paddle({ gs, isAI }: { gs: React.MutableRefObject<GameState>; isAI: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const faceColor = isAI ? "#20a0a0" : "#d84080";
  const handleColor = "#6d4530";

  useFrame(() => {
    if (!groupRef.current) return;
    const p = isAI ? gs.current.ai.pos : gs.current.player.pos;
    groupRef.current.position.set(p.x, p.y + 0.15, p.z);
  });

  return (
    <group ref={groupRef}>
      {/* Paddle face */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[PADDLE_RADIUS, PADDLE_RADIUS, 0.06, 32]} />
        <meshStandardMaterial color={faceColor} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0, isAI ? -0.4 : 0.4]} rotation={[Math.PI / 4 * (isAI ? -1 : 1), 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
        <meshStandardMaterial color={handleColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ===== PARTICLES (instanced) =====
function Particles({ gs }: { gs: React.MutableRefObject<GameState> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const MAX = 100;

  useFrame(() => {
    if (!ref.current) return;
    const pts = gs.current.particles;
    for (let i = 0; i < MAX; i++) {
      if (i < pts.length) {
        dummy.current.position.copy(pts[i].pos);
        dummy.current.scale.setScalar(pts[i].life * 0.08);
        dummy.current.updateMatrix();
        ref.current.setMatrixAt(i, dummy.current.matrix);
      } else {
        dummy.current.position.set(0, -10, 0);
        dummy.current.scale.setScalar(0);
        dummy.current.updateMatrix();
        ref.current.setMatrixAt(i, dummy.current.matrix);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color="#ffaa44" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ===== NET (fallback if not in GLB) =====
function Net() {
  return (
    <mesh position={[0, 0.12, NET_Z]}>
      <boxGeometry args={[TABLE_WIDTH + 0.4, 0.2, 0.04]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={0.4} />
    </mesh>
  );
}

// ===== FALLBACK TABLE (in case GLB is just a paddle/ball) =====
function FallbackTable() {
  return (
    <group>
      {/* Table surface */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH, 0.1, TABLE_DEPTH]} />
        <meshStandardMaterial color="#1a6b3c" roughness={0.6} />
      </mesh>
      {/* Table border */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[TABLE_WIDTH + 0.15, 0.12, TABLE_DEPTH + 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Center line */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, TABLE_DEPTH]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      {/* Side lines */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * TABLE_HALF_W, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, TABLE_DEPTH]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* End lines */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[0, 0.001, side * TABLE_HALF_D]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TABLE_WIDTH, 0.03]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (TABLE_HALF_W - 0.2), -0.45, z * (TABLE_HALF_D - 0.3)]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}
      <Net />
    </group>
  );
}

// ===== POINTER TRACKING =====
function PointerTracker({ gs }: { gs: React.MutableRefObject<GameState> }) {
  const { camera, gl } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3));
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;
    const handleMove = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
        gs.current.inputPos.copy(intersection.current);
        // Clamp Z to player half
        gs.current.inputPos.z = Math.max(0.5, gs.current.inputPos.z);
        gs.current.inputPos.y = 0.3;
      }
    };

    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onDown = () => initAudio();

    el.addEventListener("mousemove", onMouse);
    el.addEventListener("touchmove", onTouch, { passive: false });
    el.addEventListener("touchstart", onTouch, { passive: false });
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: false });

    return () => {
      el.removeEventListener("mousemove", onMouse);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
    };
  }, [camera, gl, gs]);

  return null;
}

// ===== GAME LOGIC =====
function GameLogic({
  gs,
  onScoreChange,
}: {
  gs: React.MutableRefObject<GameState>;
  onScoreChange: () => void;
}) {
  const resetBall = useCallback((server: number) => {
    const g = gs.current;
    g.ball.active = false;
    g.serving = true;
    g.serveSide = server;
    g.serveTimer = 0;
    g.ball.speed = BASE_SPEED;
    g.ball.vel.set(0, 0, 0);
    g.ball.spin = 0;
    g.ball.bounceHeight = 0;
    g.ball.bouncePhase = 0;
    g.ball.lastHitBy = 0;
    if (server === 1) {
      g.ball.pos.set(g.player.pos.x, 0.3, g.player.pos.z - 0.5);
    } else {
      g.ball.pos.set(g.ai.pos.x, 0.3, g.ai.pos.z + 0.5);
    }
  }, [gs]);

  const scorePoint = useCallback((scorer: number) => {
    const g = gs.current;
    if (scorer === 1) g.playerScore++; else g.aiScore++;
    sndScore();
    if ((g.playerScore >= WINNING_SCORE || g.aiScore >= WINNING_SCORE) && Math.abs(g.playerScore - g.aiScore) >= 2) {
      g.phase = "ended";
      g.winner = g.playerScore > g.aiScore ? "🎉 YOU WIN!" : "🤖 AI WINS!";
      onScoreChange();
      return;
    }
    const total = g.playerScore + g.aiScore;
    const side = total % 4 < 2 ? 1 : -1;
    resetBall(side);
    onScoreChange();
  }, [gs, onScoreChange, resetBall]);

  const checkPaddleHit = useCallback((paddle: { pos: THREE.Vector3; vel: THREE.Vector3 }, isPlayer: boolean) => {
    const g = gs.current;
    const b = g.ball;
    // Direction check
    if (isPlayer && b.vel.z < 0) return false;
    if (!isPlayer && b.vel.z > 0) return false;

    const dx = b.pos.x - paddle.pos.x;
    const dz = b.pos.z - paddle.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > PADDLE_RADIUS + BALL_RADIUS) return false;

    const padSpeed = Math.sqrt(paddle.vel.x * paddle.vel.x + paddle.vel.z * paddle.vel.z);
    const speedBoost = Math.min(0.04, padSpeed * 0.3);
    b.speed = Math.min(MAX_SPEED, Math.max(b.speed, BASE_SPEED + speedBoost));

    const sideForce = Math.abs(paddle.vel.x);
    let newVX: number, spinVal: number;
    if (sideForce < 0.02) {
      newVX = (dx / PADDLE_RADIUS) * b.speed * 0.05;
      spinVal = 0;
    } else {
      const sideMultiplier = sideForce > 0.06 ? 0.35 : sideForce > 0.04 ? 0.18 : 0.08;
      newVX = paddle.vel.x * sideMultiplier + (dx / PADDLE_RADIUS) * b.speed * 0.06;
      spinVal = paddle.vel.x * 3;
    }

    const maxVX = b.speed * 0.5;
    newVX = Math.max(-maxVX, Math.min(maxVX, newVX));
    let newVZ = (isPlayer ? -1 : 1) * b.speed;

    const mag = Math.sqrt(newVX * newVX + newVZ * newVZ);
    if (mag > 0) { newVX = (newVX / mag) * b.speed; newVZ = (newVZ / mag) * b.speed; }

    b.vel.set(newVX, 0, newVZ);
    b.spin = spinVal;
    b.bounceHeight = 3 + padSpeed * 30;
    b.bouncePhase = 0;
    b.lastHitBy = isPlayer ? 1 : -1;

    // Push out
    if (dist > 0) {
      b.pos.x = paddle.pos.x + (dx / dist) * (PADDLE_RADIUS + BALL_RADIUS + 0.02);
      b.pos.z = paddle.pos.z + (dz / dist) * (PADDLE_RADIUS + BALL_RADIUS + 0.02);
    }

    sndHit(b.speed * 10);
    return true;
  }, [gs]);

  useFrame((_, delta) => {
    const g = gs.current;
    if (g.phase !== "playing") return;
    const dt = Math.min(delta * 60, 3);

    // ===== PLAYER MOVEMENT =====
    g.player.prevPos.copy(g.player.pos);
    g.player.pos.x += (g.inputPos.x - g.player.pos.x) * 0.28 * dt;
    g.player.pos.z += (g.inputPos.z - g.player.pos.z) * 0.28 * dt;
    g.player.pos.x = Math.max(-TABLE_HALF_W - 0.5, Math.min(TABLE_HALF_W + 0.5, g.player.pos.x));
    g.player.pos.z = Math.max(0.5, Math.min(TABLE_HALF_D + 1, g.player.pos.z));
    g.player.vel.subVectors(g.player.pos, g.player.prevPos);

    // ===== AI =====
    const p = AI_PARAMS[g.difficulty];
    let tx = 0, tz = -TABLE_HALF_D + 0.5;
    if (g.ball.active && g.ball.vel.z < 0) {
      const timeToReach = Math.max(0, (g.ai.pos.z - g.ball.pos.z) / Math.max(0.01, Math.abs(g.ball.vel.z)));
      tx = g.ball.pos.x + g.ball.vel.x * timeToReach;
      tx += (Math.random() - 0.5) * (1 - p.accuracy) * 2;
      tx *= 0.85;
      tz = -TABLE_HALF_D + 0.3 + Math.min(0.8, Math.abs(g.ball.vel.z) * 3);
      if (Math.random() < p.missChance * 0.05) tx += (Math.random() - 0.5) * 3;
    }

    g.ai.targetPos.x += (tx - g.ai.targetPos.x) * 0.08;
    g.ai.targetPos.z += (tz - g.ai.targetPos.z) * 0.08;

    g.ai.prevPos.copy(g.ai.pos);
    const adx = g.ai.targetPos.x - g.ai.pos.x;
    const adz = g.ai.targetPos.z - g.ai.pos.z;
    const spd = p.speed * dt;
    g.ai.pos.x += Math.sign(adx) * Math.min(Math.abs(adx), spd);
    g.ai.pos.z += Math.sign(adz) * Math.min(Math.abs(adz), spd * 0.6);
    g.ai.pos.x = Math.max(-TABLE_HALF_W, Math.min(TABLE_HALF_W, g.ai.pos.x));
    g.ai.pos.z = Math.max(-TABLE_HALF_D - 0.5, Math.min(-0.5, g.ai.pos.z));
    g.ai.vel.subVectors(g.ai.pos, g.ai.prevPos);

    // ===== SERVE =====
    if (g.serving) {
      g.serveTimer += dt * 0.016;
      if (g.serveSide === 1) {
        g.ball.pos.set(g.player.pos.x, 0.3, g.player.pos.z - 0.5);
        const pSpeed = g.player.vel.length();
        if (g.serveTimer > 0.6 && pSpeed > 0.02) {
          g.serving = false;
          g.ball.active = true;
          g.ball.speed = Math.min(MAX_SPEED, BASE_SPEED + Math.min(0.04, pSpeed * 0.5));
          g.ball.vel.set(g.player.vel.x * 0.5, 0, -g.ball.speed);
          const m = g.ball.vel.length();
          if (m > 0) g.ball.vel.multiplyScalar(g.ball.speed / m);
          g.ball.spin = g.player.vel.x * 3;
          g.ball.lastHitBy = 1;
          sndHit(g.ball.speed * 10);
        }
      } else {
        g.ball.pos.set(g.ai.pos.x, 0.3, g.ai.pos.z + 0.5);
        if (g.serveTimer > 1.0) {
          g.serving = false;
          g.ball.active = true;
          g.ball.speed = Math.min(MAX_SPEED, BASE_SPEED + p.hitBoost * 0.03);
          g.ball.vel.set((Math.random() - 0.5) * 0.02, 0, g.ball.speed);
          const m = g.ball.vel.length();
          if (m > 0) g.ball.vel.multiplyScalar(g.ball.speed / m);
          g.ball.spin = (Math.random() - 0.5) * 2;
          g.ball.lastHitBy = -1;
          sndHit(g.ball.speed * 10);
        }
      }
      return;
    }

    // ===== BALL PHYSICS =====
    const b = g.ball;
    // Spin
    if (Math.abs(b.spin) > 0.01) {
      b.vel.x += b.spin * SPIN_CURVE * dt;
      b.spin *= Math.pow(SPIN_DECAY, dt);
      const maxCurveVX = b.speed * 0.5;
      b.vel.x = Math.max(-maxCurveVX, Math.min(maxCurveVX, b.vel.x));
      const m = Math.sqrt(b.vel.x * b.vel.x + b.vel.z * b.vel.z);
      if (m > 0) { b.vel.x = (b.vel.x / m) * b.speed; b.vel.z = (b.vel.z / m) * b.speed; }
    }

    b.pos.x += b.vel.x * dt;
    b.pos.z += b.vel.z * dt;

    if (b.bounceHeight > 0.5) {
      b.bouncePhase += dt * 0.18;
      b.bounceHeight *= 0.985;
    }

    // ===== SIDE BOUNDARIES: 95% bounce, 5% fall off =====
    if (b.pos.x - BALL_RADIUS < -TABLE_HALF_W) {
      if (Math.random() < 0.05) {
        if (b.lastHitBy === 1) scorePoint(-1); else scorePoint(1);
        return;
      } else {
        b.pos.x = -TABLE_HALF_W + BALL_RADIUS;
        b.vel.x = Math.abs(b.vel.x) * 0.7;
        b.spin *= -0.5;
        sndBounce();
      }
    }
    if (b.pos.x + BALL_RADIUS > TABLE_HALF_W) {
      if (Math.random() < 0.05) {
        if (b.lastHitBy === 1) scorePoint(-1); else scorePoint(1);
        return;
      } else {
        b.pos.x = TABLE_HALF_W - BALL_RADIUS;
        b.vel.x = -Math.abs(b.vel.x) * 0.7;
        b.spin *= -0.5;
        sndBounce();
      }
    }

    // Net collision
    if (Math.abs(b.pos.z - NET_Z) < 0.1 + BALL_RADIUS) {
      const prevZ = b.pos.z - b.vel.z * dt;
      if ((prevZ < NET_Z && b.pos.z >= NET_Z) || (prevZ > NET_Z && b.pos.z <= NET_Z)) {
        if (b.speed < BASE_SPEED * 0.6) {
          if (b.lastHitBy === 1) scorePoint(-1); else scorePoint(1);
          return;
        } else {
          b.vel.z *= 0.92;
          sndBounce();
        }
      }
    }

    // Paddle collisions
    if (b.vel.z > 0 && b.pos.z > NET_Z) checkPaddleHit(g.player, true);
    if (b.vel.z < 0 && b.pos.z < NET_Z) checkPaddleHit(g.ai, false);

    // Score — ball past ends
    if (b.pos.z < -TABLE_HALF_D - 1) { scorePoint(1); return; }
    if (b.pos.z > TABLE_HALF_D + 1) { scorePoint(-1); return; }

    // Particles update
    for (let i = g.particles.length - 1; i >= 0; i--) {
      const pt = g.particles[i];
      pt.pos.add(pt.vel);
      pt.life -= 0.03 * dt;
      if (pt.life <= 0) g.particles.splice(i, 1);
    }
  });

  return null;
}

// ===== HUD =====
function HUD({
  gs,
  trigger,
  onStart,
  onDifficulty,
}: {
  gs: React.MutableRefObject<GameState>;
  trigger: number;
  onStart: () => void;
  onDifficulty: (d: number) => void;
}) {
  const g = gs.current;

  return (
    <>
      {g.phase === "playing" && (
        <Html fullscreen style={{ pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: 12, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 24,
            fontFamily: "'Fredoka One', cursive", fontSize: "clamp(28px,6vw,48px)",
            color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}>
            <span style={{ color: "#20a0a0" }}>{g.aiScore}</span>
            <span style={{ opacity: 0.5 }}>-</span>
            <span style={{ color: "#d84080" }}>{g.playerScore}</span>
          </div>
          {g.serving && g.serveSide === 1 && (
            <div style={{
              position: "absolute", bottom: 40, left: 0, right: 0,
              textAlign: "center", fontFamily: "'Nunito', sans-serif",
              fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 700,
            }}>
              MOVE TO SERVE
            </div>
          )}
        </Html>
      )}
    </>
  );
}

// ===== MAIN COMPONENT =====
const Index = () => {
  const gsRef = useRef<GameState>(createGameState());
  const [uiTrigger, setUiTrigger] = useState(0);
  const [difficulty, setDifficulty] = useState(1);

  const handleScoreChange = useCallback(() => setUiTrigger(t => t + 1), []);

  const startGame = useCallback(() => {
    initAudio();
    const g = gsRef.current;
    g.playerScore = 0;
    g.aiScore = 0;
    g.difficulty = difficulty;
    g.player.pos.set(0, 0.3, TABLE_HALF_D - 0.5);
    g.player.prevPos.copy(g.player.pos);
    g.ai.pos.set(0, 0.3, -TABLE_HALF_D + 0.5);
    g.ai.prevPos.copy(g.ai.pos);
    g.particles = [];
    g.serving = true;
    g.serveSide = 1;
    g.serveTimer = 0;
    g.ball.pos.set(0, 0.3, TABLE_HALF_D - 1);
    g.ball.vel.set(0, 0, 0);
    g.ball.speed = BASE_SPEED;
    g.ball.spin = 0;
    g.ball.active = false;
    g.ball.bounceHeight = 0;
    g.ball.bouncePhase = 0;
    g.phase = "playing";
    g.winner = "";
    setUiTrigger(t => t + 1);
  }, [difficulty]);

  const g = gsRef.current;

  return (
    <div className="w-screen h-screen bg-background overflow-hidden relative" style={{ touchAction: "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet" />

      <Canvas
        camera={{ position: [0, 7, 8], fov: 45, near: 0.1, far: 100 }}
        shadows
        style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-3, 5, 0]} intensity={0.4} color="#4488ff" />
        <pointLight position={[3, 5, 0]} intensity={0.4} color="#ff4488" />

        <Suspense fallback={null}>
          <TableModel />
        </Suspense>

        <FallbackTable />
        <Net />
        <Ball gs={gsRef} />
        <Paddle gs={gsRef} isAI={false} />
        <Paddle gs={gsRef} isAI={true} />
        <Particles gs={gsRef} />
        <PointerTracker gs={gsRef} />
        <GameLogic gs={gsRef} onScoreChange={handleScoreChange} />
        <HUD gs={gsRef} trigger={uiTrigger} onStart={startGame} onDifficulty={setDifficulty} />

        <Environment preset="city" />
      </Canvas>

      {/* Menu Overlay */}
      {g.phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="text-center">
            <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "clamp(36px,8vw,56px)", color: "#fff", textShadow: "0 4px 12px rgba(0,0,0,0.4)", marginBottom: 4 }}>
              🏓 TABLE TENNIS
            </h1>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
              3D REALISTIC
            </p>
            <div className="flex gap-2 justify-center mb-4">
              {["Easy", "Medium", "Hard"].map((label, i) => (
                <button
                  key={i}
                  onClick={() => setDifficulty(i)}
                  style={{
                    padding: "8px 20px", fontSize: 13, borderRadius: 50, border: "2px solid",
                    borderColor: difficulty === i ? "#e86040" : "rgba(255,255,255,0.2)",
                    background: difficulty === i ? "#e86040" : "rgba(255,255,255,0.05)",
                    color: difficulty === i ? "#fff" : "rgba(255,255,255,0.6)",
                    fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              style={{
                padding: "14px 50px", fontSize: 17, borderRadius: 50, border: "none",
                background: "#e86040", color: "#fff", fontWeight: 800, cursor: "pointer",
                fontFamily: "'Nunito', sans-serif", letterSpacing: 2, textTransform: "uppercase",
                boxShadow: "0 4px 20px rgba(232,96,64,0.4)", transition: "all 0.2s",
              }}
            >
              PLAY
            </button>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 16, lineHeight: 1.7 }}>
              Move to control paddle · Faster swing = faster ball
            </p>
          </div>
        </div>
      )}

      {/* End Screen */}
      {g.phase === "ended" && (
        <div className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="text-center">
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "clamp(28px,7vw,48px)", color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.4)", marginBottom: 12 }}>
              {g.winner}
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 24 }}>
              {g.playerScore} - {g.aiScore}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                style={{
                  padding: "12px 36px", fontSize: 15, borderRadius: 50, border: "none",
                  background: "#e86040", color: "#fff", fontWeight: 800, cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 15px rgba(232,96,64,0.3)",
                }}
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => { gsRef.current.phase = "menu"; setUiTrigger(t => t + 1); }}
                style={{
                  padding: "12px 36px", fontSize: 15, borderRadius: 50, border: "none",
                  background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
