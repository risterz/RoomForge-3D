import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from '@react-three/drei';
import { getWallPlacement } from './wallPlacement';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Furniture } from './Furniture';
import type { Design, FurnitureItem } from './types';

function createFloorTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color; context.fillRect(0, 0, 1024, 1024);
  let seed = 73;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  for (let row = 0; row < 16; row++) {
    const y = row * 64;
    context.fillStyle = row % 2 ? '#ffffff08' : '#57442a07';
    context.fillRect(0, y, 1024, 64);
    context.strokeStyle = '#67533855'; context.lineWidth = 1.5;
    context.beginPath(); context.moveTo(0, y); context.lineTo(1024, y); context.stroke();
    for (let line = 0; line < 22; line++) {
      const lineY = y + random() * 64;
      context.strokeStyle = `rgba(90,66,36,${0.025 + random() * 0.055})`;
      context.lineWidth = 0.5 + random();
      context.beginPath(); context.moveTo(0, lineY);
      context.bezierCurveTo(280, lineY + random() * 8, 700, lineY - random() * 8, 1024, lineY); context.stroke();
    }
    const offset = row % 2 ? 256 : 0;
    for (let x = offset; x < 1024; x += 512) {
      context.strokeStyle = '#67533840'; context.beginPath(); context.moveTo(x, y); context.lineTo(x, y + 64); context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Wall({ width, color, openings }: { width: number; color: string; openings: FurnitureItem[] }) {
  const wallMaterial = <meshStandardMaterial color={color} roughness={0.96} />;
  const sorted = [...openings].sort((a, b) => a.position[0] - b.position[0]);
  return <group>
    {openings.length === 0 ? <mesh position={[0, 1.4, 0]} receiveShadow castShadow><boxGeometry args={[width, 2.8, 0.12]} />{wallMaterial}</mesh> : <WallSegments width={width} color={color} openings={sorted} />}
    <WallTrim width={width} openings={sorted} />
  </group>;
}

function WallTrim({ width, openings }: { width: number; openings: FurnitureItem[] }) {
  const segments: { x: number; width: number }[] = [];
  let cursor = -width / 2;
  for (const opening of openings) {
    if (opening.kind !== 'door') continue;
    const left = Math.max(-width / 2, opening.position[0] - opening.width * opening.scale / 2);
    const right = Math.min(width / 2, opening.position[0] + opening.width * opening.scale / 2);
    if (left > cursor) segments.push({ x: (cursor + left) / 2, width: left - cursor });
    cursor = Math.max(cursor, right);
  }
  if (cursor < width / 2) segments.push({ x: (cursor + width / 2) / 2, width: width / 2 - cursor });
  return <group>{segments.map((segment, index) => segment.width > 0 && <mesh key={index} position={[segment.x, 0.055, 0.067]}><boxGeometry args={[segment.width, 0.11, 0.045]} /><meshStandardMaterial color="#f4f0e6" /></mesh>)}</group>;
}

function WallSegments({ width, color, openings }: { width: number; color: string; openings: FurnitureItem[] }) {
  const height = 2.8;
  const segments: { x: number; y: number; w: number; h: number }[] = [];
  let cursor = -width / 2;
  for (const opening of openings) {
    const w = opening.width * opening.scale;
    const bottom = opening.kind === 'window' ? (height - opening.height * opening.scale) / 2 : 0;
    const top = bottom + opening.height * opening.scale;
    const left = Math.max(cursor, opening.position[0] - w / 2);
    const right = Math.min(width / 2, opening.position[0] + w / 2);
    if (left > cursor) segments.push({ x: (cursor + left) / 2, y: height / 2, w: left - cursor, h: height });
    if (right > left) {
      if (bottom > 0) segments.push({ x: (left + right) / 2, y: bottom / 2, w: right - left, h: bottom });
      if (top < height) segments.push({ x: (left + right) / 2, y: (top + height) / 2, w: right - left, h: height - top });
    }
    cursor = Math.max(cursor, right);
  }
  if (cursor < width / 2) segments.push({ x: (cursor + width / 2) / 2, y: height / 2, w: width / 2 - cursor, h: height });
  return <group>{segments.map((segment, index) => segment.w > 0 && segment.h > 0 && <mesh key={index} position={[segment.x, segment.y, 0]} receiveShadow castShadow><boxGeometry args={[segment.w, segment.h, 0.12]} /><meshStandardMaterial color={color} roughness={0.96} /></mesh>)}</group>;
}

function RoomShell({ width, depth, wallColor, floorColor, items, onDeselect }: { width: number; depth: number; wallColor: string; floorColor: string; items: FurnitureItem[]; onDeselect: () => void }) {
  const floorTexture = useMemo(() => createFloorTexture(floorColor), [floorColor]);
  useEffect(() => () => floorTexture.dispose(), [floorTexture]);
  floorTexture.repeat.set(width / 3, depth / 3);
  const openings = items.filter((entry) => entry.kind === 'door' || entry.kind === 'window').map((entry) => ({ ...entry, ...getWallPlacement(entry, width, depth) }));
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={(event) => { if (event.button === 0) onDeselect(); }}>
      <planeGeometry args={[width, depth]} /><meshStandardMaterial map={floorTexture} roughness={0.73} />
    </mesh>
    <mesh position={[0, -0.08, 0]} receiveShadow><boxGeometry args={[width + 0.12, 0.16, depth + 0.12]} /><meshStandardMaterial color="#a68b6b" /></mesh>
    <group position={[0, 0, -depth / 2]}><Wall width={width + 0.16} color={wallColor} openings={openings.filter((entry) => Math.abs(entry.rotation) < 0.1)} /></group>
    <group position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall width={depth} color={wallColor} openings={openings.filter((entry) => Math.abs(entry.rotation) > 0.1).map((entry) => ({ ...entry, position: [-entry.position[2], 0, 0], rotation: 0 }))} /></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#deddd6" /></mesh>
  </group>;
}

function Dimensions({ width, depth }: { width: number; depth: number }) {
  return <group>
    <Grid position={[0, 0.012, 0]} args={[width, depth]} cellSize={0.5} cellThickness={0.6} cellColor="#6e7565" sectionSize={1} sectionThickness={0.8} sectionColor="#7b8271" fadeDistance={35} fadeStrength={1} infiniteGrid={false} />
    <mesh position={[0, 0.018, depth / 2 + 0.38]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, 0.28]} /><meshBasicMaterial color="#f5f3ec" transparent opacity={0.92} /></mesh>
    <mesh position={[width / 2 + 0.38, 0.018, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}><planeGeometry args={[depth, 0.28]} /><meshBasicMaterial color="#f5f3ec" transparent opacity={0.92} /></mesh>
  </group>;
}

function CameraControls({ dragging, resetKey, view, onAdd }: { dragging: boolean; resetKey: number; view: 'perspective' | 'top'; onAdd: (kind: FurnitureItem['kind'], x: number, z: number) => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  useEffect(() => {
    const canvas = gl.domElement;
    const drop = (event: DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer?.getData('text/roomforge-furniture') as FurnitureItem['kind'];
      if (!kind) return;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const point = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point)) onAdd(kind, point.x, point.z);
    };
    canvas.addEventListener('drop', drop);
    return () => canvas.removeEventListener('drop', drop);
  }, [gl, camera, onAdd]);
  useEffect(() => {
    const aspect = size.width / size.height;
    const factor = aspect < 0.9 ? 1.5 : aspect < 1.2 ? 1.2 : 1;
    if (view === 'top') {
      camera.position.set(0, 10 * factor, 0.01); camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(8.2 * factor, 6.5 * factor, 8.5 * factor); camera.lookAt(0, 0.3, 0);
    }
    controls.current?.update();
  }, [resetKey, view, camera, size.width, size.height]);
  return <OrbitControls ref={controls} makeDefault enabled={!dragging} target={[0, 0.35, 0]} minDistance={3.5} maxDistance={20} maxPolarAngle={view === 'top' ? 0 : Math.PI / 2.06} minPolarAngle={0} enableDamping dampingFactor={0.08} />;
}

export function Scene({ design, selectedId, onSelect, onMove, onAdd, showGrid, resetKey, view, lighting }: { design: Design; selectedId: string | null; onSelect: (id: string | null) => void; onMove: (id: string, x: number, z: number) => void; onAdd: (kind: FurnitureItem['kind'], x: number, z: number) => void; showGrid: boolean; resetKey: number; view: 'perspective' | 'top'; lighting: Design['lighting'] }) {
  const [dragging, setDragging] = useState(false);
  const settings = {
    daylight: { ambient: 0.7, sun: 2.3, color: '#fff5e8', background: '#e5e5df' },
    golden: { ambient: 0.45, sun: 3, color: '#ffd09a', background: '#e7d4bb' },
    studio: { ambient: 0.95, sun: 1.9, color: '#f3f5ff', background: '#e2e5e5' },
  }[lighting];
  return <Canvas shadows dpr={[1, 1.75]} camera={{ position: [8.2, 6.5, 8.5], fov: 42, near: 0.1, far: 100 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} style={{ background: settings.background }}>
    <color attach="background" args={[settings.background]} />
    <fog attach="fog" args={[settings.background, 24, 65]} />
    <ambientLight intensity={settings.ambient} color={settings.color} />
    <hemisphereLight args={['#f4f7ff', '#a29072', 0.6]} />
    <directionalLight position={[4, 8, 4]} intensity={settings.sun} color={settings.color} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={0.025} shadow-bias={-0.00015} />
    <RoomShell width={design.roomWidth} depth={design.roomDepth} wallColor={design.wallColor} floorColor={design.floorColor} items={design.items} onDeselect={() => onSelect(null)} />
    {showGrid && <Dimensions width={design.roomWidth} depth={design.roomDepth} />}
    {design.items.map((item) => <Furniture key={item.id} item={item} roomWidth={design.roomWidth} roomDepth={design.roomDepth} selected={selectedId === item.id} onSelect={() => onSelect(item.id)} onMove={(x, z) => onMove(item.id, x, z)} onDragState={setDragging} />)}
    <Suspense fallback={null}>
      <ContactShadows position={[0, 0.006, 0]} opacity={0.27} scale={18} blur={2.3} far={3.5} resolution={512} frames={1} color="#544631" />
      <Environment resolution={128}><Lightformer form="rect" intensity={1.4} position={[0, 7, 3]} scale={[8, 8, 1]} rotation={[Math.PI / 2, 0, 0]} target={[0, 0, 0]} /><Lightformer form="rect" intensity={1} position={[-5, 4, 2]} scale={[5, 8, 1]} rotation={[0, -Math.PI / 2, 0]} target={[0, 4, 0]} /></Environment>
    </Suspense>
    <CameraControls dragging={dragging} resetKey={resetKey} view={view} onAdd={onAdd} />
  </Canvas>;
}
