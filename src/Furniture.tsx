import { useEffect, useMemo, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { FurnitureItem } from './types';
import { getWallPlacement, isWallMounted } from './wallPlacement';

function Leg({ x, z, height = 0.35, color = '#72553b' }: { x: number; z: number; height?: number; color?: string }) {
  return <mesh position={[x, height / 2, z]} castShadow><cylinderGeometry args={[0.035, 0.028, height, 10]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>;
}

function SoftBox({ position, size, color, radius = 0.06 }: { position: [number, number, number]; size: [number, number, number]; color: string; radius?: number }) {
  return <RoundedBox args={size} position={position} radius={radius} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.87} /></RoundedBox>;
}

function Sofa({ item, chair = false }: { item: FurnitureItem; chair?: boolean }) {
  const w = item.width;
  const d = item.depth;
  const legColor = '#66513d';
  const dark = useMemo(() => new THREE.Color(item.color).multiplyScalar(0.86).getStyle(), [item.color]);
  const light = useMemo(() => new THREE.Color(item.color).multiplyScalar(1.06).getStyle(), [item.color]);
  return <group>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Leg key={`${x}${z}`} x={x * (w / 2 - 0.13)} z={z * (d / 2 - 0.13)} height={0.22} color={legColor} />))}
    <SoftBox position={[0, 0.3, 0]} size={[w, 0.24, d]} color={dark} radius={0.08} />
    <SoftBox position={[0, 0.64, -d * 0.37]} size={[w - 0.12, 0.55, 0.21]} color={item.color} radius={0.075} />
    {[-1, 1].map((side) => <SoftBox key={side} position={[side * (w / 2 - 0.1), 0.48, 0]} size={[0.2, 0.42, d]} color={item.color} radius={0.065} />)}
    {Array.from({ length: chair ? 1 : 3 }, (_, index) => {
      const seatWidth = (w - 0.42) / (chair ? 1 : 3);
      return <group key={index} position={[(index - (chair ? 0 : 1)) * seatWidth, 0, 0]}>
        <SoftBox position={[0, 0.48, 0.05]} size={[seatWidth - 0.025, 0.17, d - 0.31]} color={light} radius={0.065} />
        <SoftBox position={[0, 0.69, -d * 0.26]} size={[seatWidth - 0.05, 0.36, 0.16]} color={light} radius={0.06} />
      </group>;
    })}
    {chair && <SoftBox position={[-0.16, 0.71, -0.19]} size={[0.34, 0.34, 0.13]} color="#d7c4a2" radius={0.055} />}
  </group>;
}

function Table({ item }: { item: FurnitureItem }) {
  const wood = item.color;
  return <group>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Leg key={`${x}${z}`} x={x * 0.37} z={z * 0.37} height={0.37} color={wood} />))}
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow><cylinderGeometry args={[0.62, 0.62, 0.085, 64]} /><meshStandardMaterial color={wood} roughness={0.5} /></mesh>
    <mesh position={[0, 0.445, 0]} receiveShadow><cylinderGeometry args={[0.56, 0.56, 0.008, 64]} /><meshStandardMaterial color={wood} roughness={0.68} /></mesh>
    <group position={[-0.14, 0.47, 0.08]} rotation={[0, 0.3, 0]}>
      <mesh castShadow><boxGeometry args={[0.27, 0.035, 0.19]} /><meshStandardMaterial color="#e4ddcb" /></mesh>
      <mesh position={[0, 0.019, 0]}><boxGeometry args={[0.25, 0.003, 0.17]} /><meshStandardMaterial color="#f4eee0" /></mesh>
    </group>
    <mesh position={[0.2, 0.5, -0.12]} castShadow><cylinderGeometry args={[0.055, 0.045, 0.1, 24]} /><meshStandardMaterial color="#ede7d9" roughness={0.25} /></mesh>
  </group>;
}

function DiningChair({ item }: { item: FurnitureItem }) {
  return <group>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Leg key={`${x}${z}`} x={x * 0.19} z={z * 0.2} height={0.47} color={item.color} />))}
    <SoftBox position={[0, 0.47, 0]} size={[0.5, 0.075, 0.52]} color={item.color} radius={0.025} />
    <mesh position={[0, 0.73, -0.22]} castShadow><boxGeometry args={[0.46, 0.3, 0.06]} /><meshStandardMaterial color={item.color} roughness={0.6} /></mesh>
  </group>;
}

function Lamp({ item }: { item: FurnitureItem }) {
  return <group>
    <mesh position={[0, 0.035, 0]} castShadow receiveShadow><cylinderGeometry args={[0.24, 0.28, 0.07, 32]} /><meshStandardMaterial color="#686152" metalness={0.5} roughness={0.35} /></mesh>
    <mesh position={[0, 0.83, 0]} castShadow><cylinderGeometry args={[0.015, 0.02, 1.6, 12]} /><meshStandardMaterial color="#81765e" metalness={0.65} roughness={0.3} /></mesh>
    <mesh position={[0, 1.62, 0]} castShadow><cylinderGeometry args={[0.21, 0.32, 0.37, 40, 1, true]} /><meshStandardMaterial color={item.color} side={THREE.DoubleSide} roughness={0.9} /></mesh>
    <mesh position={[0, 1.44, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.29, 32]} /><meshBasicMaterial color="#ffe7b0" /></mesh>
    <pointLight position={[0, 1.36, 0]} color="#ffd59a" intensity={2} distance={3} />
  </group>;
}

function createLeafTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#cbd3b2'; context.fillRect(0, 0, 256, 512);
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#899570'); gradient.addColorStop(0.42, '#e0e5c7'); gradient.addColorStop(0.5, '#f0edcf'); gradient.addColorStop(0.58, '#e0e5c7'); gradient.addColorStop(1, '#899570');
  context.fillStyle = gradient; context.fillRect(0, 0, 256, 512);
  context.strokeStyle = '#edf0d2'; context.lineWidth = 3;
  context.beginPath(); context.moveTo(128, 0); context.quadraticCurveTo(124, 250, 128, 512); context.stroke();
  context.lineWidth = 1;
  for (let row = 0; row < 12; row++) {
    const y = 42 + row * 36;
    for (const side of [-1, 1]) {
      context.strokeStyle = '#71815b55';
      context.beginPath(); context.moveTo(128, y + 23); context.quadraticCurveTo(128 + side * 56, y + 12, 128 + side * 118, y - 19); context.stroke();
    }
  }
  for (let index = 0; index < 1300; index++) {
    const x = (index * 137.5) % 256; const y = (index * 71.3) % 512;
    context.fillStyle = index % 2 ? '#ffffff0b' : '#394d2810'; context.fillRect(x, y, 1, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createLeafGeometry() {
  const positions: number[] = []; const uvs: number[] = []; const indices: number[] = [];
  const rows = 14; const columns = 4;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const width = 0.145 * Math.pow(Math.sin(Math.PI * t), 0.78) * (1 - t * 0.22);
    for (let column = 0; column <= columns; column++) {
      const u = column / columns * 2 - 1;
      const edgeCurl = 0.038 * u * u * Math.sin(Math.PI * t);
      const centerRidge = -0.012 * Math.exp(-u * u * 18) * Math.sin(Math.PI * t);
      const curve = 0.14 * t * t - 0.045 * Math.sin(Math.PI * t);
      positions.push(u * width * (1 + 0.035 * Math.sin(t * 9)), t, curve + edgeCurl + centerRidge);
      uvs.push(column / columns, t);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column; const b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Plant({ item }: { item: FurnitureItem }) {
  const leafMesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(createLeafGeometry, []);
  const texture = useMemo(createLeafTexture, []);
  const { branches, leaves } = useMemo(() => {
    let seed = 42;
    const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    const branches: THREE.TubeGeometry[] = []; const leaves: { position: THREE.Vector3; direction: THREE.Vector3; roll: number; length: number; shade: number }[] = [];
    for (let branch = 0; branch < 13; branch++) {
      const angle = branch * 2.39996 + random() * 0.35;
      const base = new THREE.Vector3(Math.cos(angle) * 0.018, 0.64 + branch * 0.061, Math.sin(angle) * 0.018);
      const radius = 0.23 + random() * 0.15;
      const tip = new THREE.Vector3(Math.cos(angle) * radius, base.y + 0.28 + random() * 0.19, Math.sin(angle) * radius);
      const curve = new THREE.CatmullRomCurve3([base, base.clone().lerp(tip, 0.48).add(new THREE.Vector3(0, 0.06, 0)), tip]);
      branches.push(new THREE.TubeGeometry(curve, 8, 0.009 - branch * 0.0003, 5, false));
      for (let node = 1; node <= 7; node++) {
        const t = node / 8;
        const position = curve.getPoint(t);
        for (const side of [-1, 1]) {
          const leafAngle = angle + side * (0.65 + random() * 0.65);
          const direction = new THREE.Vector3(Math.cos(leafAngle), 0.12 + random() * 0.7, Math.sin(leafAngle)).normalize();
          leaves.push({ position: position.clone(), direction, roll: (random() - 0.5) * 1.6, length: 0.145 + random() * 0.08, shade: 0.76 + random() * 0.27 });
        }
      }
    }
    return { branches, leaves };
  }, []);
  useEffect(() => {
    if (!leafMesh.current) return;
    const matrix = new THREE.Matrix4(); const quaternion = new THREE.Quaternion(); const roll = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0); const scale = new THREE.Vector3(); const color = new THREE.Color();
    leaves.forEach((leaf, index) => {
      quaternion.setFromUnitVectors(up, leaf.direction);
      roll.setFromAxisAngle(up, leaf.roll); quaternion.multiply(roll);
      scale.setScalar(leaf.length); matrix.compose(leaf.position, quaternion, scale);
      leafMesh.current!.setMatrixAt(index, matrix);
      color.set(item.color).multiplyScalar(leaf.shade); leafMesh.current!.setColorAt(index, color);
    });
    leafMesh.current.instanceMatrix.needsUpdate = true;
    if (leafMesh.current.instanceColor) leafMesh.current.instanceColor.needsUpdate = true;
    leafMesh.current.computeBoundingSphere();
  }, [item.color, leaves]);
  useEffect(() => () => { geometry.dispose(); texture.dispose(); branches.forEach((branch) => branch.dispose()); }, [geometry, texture, branches]);
  return <group>
    <mesh position={[0, 0.205, 0]} castShadow><cylinderGeometry args={[0.225, 0.165, 0.41, 48, 0, 1, true]} /><meshStandardMaterial color="#b5aa93" roughness={0.72} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.405, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.216, 0.012, 0.65, 48]} /><meshStandardMaterial color="#c4b9a2" roughness={0.65} /></mesh>
    <mesh position={[0, 0.397, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.204, 0.204, 0.018, 32]} /><meshStandardMaterial color="#514736" roughness={1} /></mesh>
    <mesh position={[0, 0.97, 0]} rotation={[0.015, 0, -0.025]} castShadow><cylinderGeometry args={[0.011, 0.027, 1.16, 10]} /><meshStandardMaterial color="#716247" roughness={0.95} /></mesh>
    {branches.map((branch, index) => <mesh key={index} geometry={branch} castShadow><meshStandardMaterial color="#786b4c" roughness={0.95} /></mesh>)}
    <instancedMesh ref={leafMesh} args={[geometry, undefined, leaves.length]} castShadow receiveShadow>
      <meshStandardMaterial map={texture} color="#ffffff" roughness={0.64} metalness={0} side={THREE.DoubleSide} />
    </instancedMesh>
  </group>;
}

function Rug({ item }: { item: FurnitureItem }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = item.color; context.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 3) {
      context.strokeStyle = y % 9 === 0 ? '#8f806333' : '#fff8e622';
      context.beginPath(); context.moveTo(0, y); context.lineTo(256, y); context.stroke();
    }
    context.strokeStyle = '#8c7e6466'; context.lineWidth = 2; context.strokeRect(13, 13, 230, 230);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [item.color]);
  return <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[item.width, item.depth]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>;
}

function Shelf({ item }: { item: FurnitureItem }) {
  const books = ['#a16b4e', '#d0b98d', '#747963', '#dcd4c2', '#5e6964', '#b39167', '#946c56'];
  return <group>
    <mesh position={[-0.7, 0.47, 0]} castShadow><boxGeometry args={[0.075, 0.85, 0.4]} /><meshStandardMaterial color={item.color} /></mesh>
    <mesh position={[0.7, 0.47, 0]} castShadow><boxGeometry args={[0.075, 0.85, 0.4]} /><meshStandardMaterial color={item.color} /></mesh>
    {[0.1, 0.47, 0.86].map((y) => <mesh key={y} position={[0, y, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.065, 0.4]} /><meshStandardMaterial color={item.color} roughness={0.5} /></mesh>)}
    {books.map((color, i) => <mesh key={color} position={[-0.53 + i * 0.09, 0.63, 0]} rotation={[0, 0, i === 6 ? -0.17 : 0]} castShadow><boxGeometry args={[0.065, 0.24 + (i % 3) * 0.025, 0.24]} /><meshStandardMaterial color={color} /></mesh>)}
    <mesh position={[0.39, 0.55, 0]} castShadow><cylinderGeometry args={[0.095, 0.07, 0.15, 20]} /><meshStandardMaterial color="#d6c8ae" /></mesh>
  </group>;
}

function Bed({ item }: { item: FurnitureItem }) {
  return <group>
    <SoftBox position={[0, 0.22, 0]} size={[2, 0.25, 1.1]} color="#8c6d4d" radius={0.025} />
    <SoftBox position={[0, 0.41, 0]} size={[1.95, 0.2, 1.06]} color={item.color} radius={0.07} />
    <SoftBox position={[-0.52, 0.55, 0]} size={[0.7, 0.14, 0.88]} color="#ded6c5" radius={0.075} />
    <SoftBox position={[0.35, 0.53, 0]} size={[1.1, 0.06, 1.04]} color="#b9b4a3" radius={0.03} />
    <SoftBox position={[-0.96, 0.48, 0]} size={[0.09, 0.7, 1.1]} color={item.color} radius={0.035} />
  </group>;
}

function Door({ item }: { item: FurnitureItem }) {
  const w = item.width;
  const h = item.height;
  const trim = 0.07;
  const frameDepth = 0.18;
  return <group position={[0, 0, 0.012]} name="door-frame-and-leaf">
    {[-1, 1].map((side) => <mesh key={side} position={[side * (w / 2 + trim / 2), h / 2, 0]} castShadow><boxGeometry args={[trim, h + trim, frameDepth]} /><meshStandardMaterial color="#e8e0d1" roughness={0.72} /></mesh>)}
    <mesh position={[0, h + trim / 2, 0]} castShadow><boxGeometry args={[w + trim * 2, trim, frameDepth]} /><meshStandardMaterial color="#e8e0d1" roughness={0.72} /></mesh>
    <mesh position={[0, h / 2 + 0.015, -0.02]} castShadow receiveShadow><boxGeometry args={[w - 0.025, h - 0.03, 0.055]} /><meshStandardMaterial color={item.color} roughness={0.58} /></mesh>
    {[0.24, 0.73].map((fraction) => <mesh key={fraction} position={[0, h * fraction, 0.014]} castShadow><boxGeometry args={[w - 0.16, h * 0.32, 0.012]} /><meshStandardMaterial color={item.color} roughness={0.65} /></mesh>)}
    <mesh position={[w * 0.32, h * 0.47, 0.065]} castShadow><sphereGeometry args={[0.042, 20, 16]} /><meshStandardMaterial color="#b99a58" metalness={0.75} roughness={0.26} /></mesh>
    <mesh position={[w * 0.32, h * 0.47, 0.036]}><boxGeometry args={[0.065, 0.15, 0.018]} /><meshStandardMaterial color="#aa8a4d" metalness={0.7} roughness={0.3} /></mesh>
    {[0.17, 0.83].map((fraction) => <mesh key={fraction} position={[-w / 2 + 0.035, h * fraction, 0.035]}><cylinderGeometry args={[0.018, 0.018, 0.09, 12]} /><meshStandardMaterial color="#8f7546" metalness={0.65} /></mesh>)}
  </group>;
}

function WindowFrame({ item }: { item: FurnitureItem }) {
  const w = item.width; const h = item.height; const y = (2.8 - h) / 2 + h / 2;
  return <group position={[0, y, 0]}>
    <mesh position={[0, 0, -0.07]}><planeGeometry args={[w - 0.08, h - 0.08]} /><meshPhysicalMaterial color="#b8d0d2" transparent opacity={0.42} roughness={0.08} metalness={0.05} side={THREE.DoubleSide} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[side * (w / 2 - 0.035), 0, 0]} castShadow><boxGeometry args={[0.07, h, 0.17]} /><meshStandardMaterial color={item.color} roughness={0.65} /></mesh>
      <mesh position={[0, side * (h / 2 - 0.035), 0]} castShadow><boxGeometry args={[w, 0.07, 0.17]} /><meshStandardMaterial color={item.color} roughness={0.65} /></mesh>
    </group>)}
    <mesh position={[0, 0, 0.025]} castShadow><boxGeometry args={[0.045, h - 0.1, 0.075]} /><meshStandardMaterial color={item.color} /></mesh>
    <mesh position={[0, 0, 0.025]} castShadow><boxGeometry args={[w - 0.1, 0.045, 0.075]} /><meshStandardMaterial color={item.color} /></mesh>
    <mesh position={[0, -h / 2 - 0.025, 0.08]} castShadow><boxGeometry args={[w + 0.14, 0.07, 0.32]} /><meshStandardMaterial color={item.color} roughness={0.7} /></mesh>
  </group>;
}

function createTelevisionTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 288;
  const context = canvas.getContext('2d')!;
  const sky = context.createLinearGradient(0, 0, 0, 288);
  sky.addColorStop(0, '#657f89'); sky.addColorStop(0.6, '#d7b892'); sky.addColorStop(1, '#e8caa0');
  context.fillStyle = sky; context.fillRect(0, 0, 512, 288);
  context.fillStyle = '#f2dab0'; context.beginPath(); context.arc(365, 88, 30, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#758276'; context.beginPath(); context.moveTo(0, 220); context.lineTo(120, 105); context.lineTo(210, 205); context.lineTo(295, 125); context.lineTo(430, 225); context.lineTo(512, 180); context.lineTo(512, 288); context.lineTo(0, 288); context.fill();
  context.fillStyle = '#4f625b'; context.beginPath(); context.moveTo(0, 240); context.lineTo(135, 178); context.lineTo(255, 247); context.lineTo(390, 183); context.lineTo(512, 248); context.lineTo(512, 288); context.lineTo(0, 288); context.fill();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Television({ item }: { item: FurnitureItem }) {
  const texture = useMemo(createTelevisionTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group>
    <SoftBox position={[0, 0.28, 0]} size={[1.6, 0.43, 0.42]} color={item.color} radius={0.025} />
    {[-0.55, 0, 0.55].map((x) => <mesh key={x} position={[x, 0.29, 0.218]}><boxGeometry args={[0.49, 0.32, 0.015]} /><meshStandardMaterial color={item.color} roughness={0.58} /></mesh>)}
    {[-0.55, 0, 0.55].map((x) => <mesh key={x} position={[x, 0.35, 0.235]}><boxGeometry args={[0.14, 0.016, 0.025]} /><meshStandardMaterial color="#504c43" metalness={0.4} /></mesh>)}
    <mesh position={[0, 0.62, -0.04]} castShadow><boxGeometry args={[0.13, 0.3, 0.08]} /><meshStandardMaterial color="#353633" metalness={0.5} /></mesh>
    <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[0.62, 0.035, 0.25]} /><meshStandardMaterial color="#3d3e39" metalness={0.45} /></mesh>
    <RoundedBox args={[1.46, 0.84, 0.055]} position={[0, 0.92, 0]} radius={0.025} smoothness={3} castShadow><meshStandardMaterial color="#242724" roughness={0.35} /></RoundedBox>
    <mesh position={[0, 0.92, 0.031]}><planeGeometry args={[1.405, 0.785, 0]} /><meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.24} roughness={0.3} /></mesh>
    <mesh position={[0, 0.493, 0.031]}><sphereGeometry args={[0.006, 8, 8]} /><meshBasicMaterial color="#a9c39a" /></mesh>
  </group>;
}

function AirConditioner({ item }: { item: FurnitureItem }) {
  return <group position={[0, 2.18, 0.12]}>
    <RoundedBox args={[1.05, 0.34, 0.25]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color={item.color} roughness={0.48} /></RoundedBox>
    <mesh position={[0, -0.085, 0.128]}><boxGeometry args={[0.91, 0.075, 0.018]} /><meshStandardMaterial color="#a9aaa1" roughness={0.65} /></mesh>
    {Array.from({ length: 7 }, (_, index) => <mesh key={index} position={[0, -0.057 - index * 0.008, 0.142]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.86, 0.003, 0.018]} /><meshStandardMaterial color="#d6d5cb" /></mesh>)}
    <mesh position={[0.4, 0.07, 0.13]}><circleGeometry args={[0.012, 16]} /><meshBasicMaterial color="#7ea38a" /></mesh>
    <mesh position={[-0.36, 0.065, 0.13]}><planeGeometry args={[0.12, 0.025]} /><meshBasicMaterial color="#c2c6b9" /></mesh>
  </group>;
}

function Refrigerator({ item }: { item: FurnitureItem }) {
  return <group>
    <RoundedBox args={[0.82, 1.85, 0.75]} position={[0, 0.925, 0]} radius={0.045} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={item.color} metalness={0.42} roughness={0.4} /></RoundedBox>
    <mesh position={[0, 1.16, 0.38]} castShadow><boxGeometry args={[0.77, 1.28, 0.055]} /><meshStandardMaterial color={item.color} metalness={0.45} roughness={0.36} /></mesh>
    <mesh position={[0, 0.265, 0.38]} castShadow><boxGeometry args={[0.77, 0.47, 0.055]} /><meshStandardMaterial color={item.color} metalness={0.45} roughness={0.36} /></mesh>
    <mesh position={[0.26, 1.18, 0.435]} castShadow><boxGeometry args={[0.026, 0.63, 0.04]} /><meshStandardMaterial color="#666b66" metalness={0.75} roughness={0.25} /></mesh>
    <mesh position={[0.26, 0.29, 0.435]} castShadow><boxGeometry args={[0.026, 0.25, 0.04]} /><meshStandardMaterial color="#666b66" metalness={0.75} roughness={0.25} /></mesh>
    <mesh position={[-0.24, 1.47, 0.414]}><planeGeometry args={[0.15, 0.21, 0]} /><meshStandardMaterial color="#3e4b49" roughness={0.25} /></mesh>
    <mesh position={[-0.24, 1.49, 0.416]}><planeGeometry args={[0.11, 0.025, 0]} /><meshBasicMaterial color="#8eb4ae" /></mesh>
    {[-0.26, 0.26].map((x) => <mesh key={x} position={[x, 0.025, 0.22]}><cylinderGeometry args={[0.035, 0.035, 0.05, 12]} /><meshStandardMaterial color="#41443e" /></mesh>)}
  </group>;
}

function WashingMachine({ item }: { item: FurnitureItem }) {
  return <group>
    <RoundedBox args={[0.65, 0.9, 0.66]} position={[0, 0.45, 0]} radius={0.035} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={item.color} metalness={0.15} roughness={0.43} /></RoundedBox>
    <mesh position={[0, 0.75, 0.335]}><boxGeometry args={[0.58, 0.16, 0.018]} /><meshStandardMaterial color="#d7d8d0" roughness={0.45} /></mesh>
    <mesh position={[-0.18, 0.75, 0.351]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.047, 0.047, 0.025, 32]} /><meshStandardMaterial color="#aeb3ac" metalness={0.65} roughness={0.25} /></mesh>
    <mesh position={[0.17, 0.76, 0.35]}><planeGeometry args={[0.17, 0.065]} /><meshStandardMaterial color="#344440" emissive="#55736c" emissiveIntensity={0.15} /></mesh>
    <mesh position={[0, 0.405, 0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.225, 0.225, 0.065, 48]} /><meshStandardMaterial color="#b7bcb8" metalness={0.72} roughness={0.24} /></mesh>
    <mesh position={[0, 0.405, 0.387]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.183, 0.16, 0.025, 48]} /><meshStandardMaterial color="#293330" metalness={0.25} roughness={0.2} /></mesh>
    <mesh position={[0, 0.405, 0.405]}><circleGeometry args={[0.147, 48]} /><meshPhysicalMaterial color="#758d8b" transparent opacity={0.58} roughness={0.12} metalness={0.35} /></mesh>
    <mesh position={[0, 0.085, 0.336]}><boxGeometry args={[0.53, 0.07, 0.012]} /><meshStandardMaterial color="#d0d1c9" /></mesh>
  </group>;
}

export function Furniture({ item, roomWidth, roomDepth, selected, onSelect, onMove, onDragState }: { item: FurnitureItem; roomWidth: number; roomDepth: number; selected: boolean; onSelect: () => void; onMove: (x: number, z: number) => void; onDragState: (dragging: boolean) => void }) {
  const [dragging, setDragging] = useState(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const offset = useRef(new THREE.Vector3());
  const group = useRef<THREE.Group>(null);
  const wallMounted = isWallMounted(item);
  const dragPosition = useRef<[number, number, number]>(item.position);
  const scale = useRef(1);
  useFrame((_, delta) => {
    if (!group.current) return;
    scale.current = wallMounted ? 1 : THREE.MathUtils.damp(scale.current, dragging ? 1.025 : 1, 12, delta);
    group.current.scale.setScalar(scale.current * item.scale);
  });
  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    onSelect();
    if (item.kind === 'rug') return;
    dragPosition.current = item.position;
    (event.target as Element).setPointerCapture(event.pointerId);
    event.ray.intersectPlane(plane, point);
    offset.current.set(item.position[0] - point.x, 0, item.position[2] - point.z);
    setDragging(true); onDragState(true);
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();
    if (event.ray.intersectPlane(plane, point)) {
      dragPosition.current = [point.x + offset.current.x, 0, point.z + offset.current.z];
      if (wallMounted) {
        const x = dragPosition.current[0];
        const z = dragPosition.current[2];
        const leftWall = x < 0 && Math.abs(x) / roomWidth > Math.abs(z) / roomDepth;
        dragPosition.current = getWallPlacement({ ...item, position: [x, 0, z], rotation: leftWall ? Math.PI / 2 : 0 }, roomWidth, roomDepth).position;
      }
      onMove(point.x + offset.current.x, point.z + offset.current.z);
    }
  };
  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();
    setDragging(false); onDragState(false);
    if ((event.target as Element).hasPointerCapture(event.pointerId)) (event.target as Element).releasePointerCapture(event.pointerId);
  };
  return <group ref={group} position={dragging ? dragPosition.current : item.position} rotation={[0, item.rotation, 0]} onPointerDown={startDrag} onPointerMove={move} onPointerUp={endDrag} onPointerCancel={endDrag}>
    {item.kind === 'sofa' && <Sofa item={item} />}
    {item.kind === 'armchair' && <Sofa item={item} chair />}
    {item.kind === 'table' && <Table item={item} />}
    {item.kind === 'chair' && <DiningChair item={item} />}
    {item.kind === 'lamp' && <Lamp item={item} />}
    {item.kind === 'plant' && <Plant item={item} />}
    {item.kind === 'rug' && <Rug item={item} />}
    {item.kind === 'shelf' && <Shelf item={item} />}
    {item.kind === 'bed' && <Bed item={item} />}
    {item.kind === 'door' && <Door item={item} />}
    {item.kind === 'window' && <WindowFrame item={item} />}
    {item.kind === 'tv' && <Television item={item} />}
    {item.kind === 'aircond' && <AirConditioner item={item} />}
    {item.kind === 'fridge' && <Refrigerator item={item} />}
    {item.kind === 'washer' && <WashingMachine item={item} />}
    {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[Math.max(item.width, item.depth) * 0.61, Math.max(item.width, item.depth) * 0.61 + 0.025, 64]} /><meshBasicMaterial color="#b8613f" transparent opacity={0.85} depthTest={false} /></mesh>}
  </group>;
}
