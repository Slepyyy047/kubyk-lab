import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { colors, type Color, type Face } from './cube';
import { faceletGeometry, faceletIndexAtPose } from './cubeGeometry';

export interface CubeAnimation {
  move: string;
  reverse?: boolean;
  duration: number;
  onComplete: () => void;
}

export interface CubeViewProps {
  stickers: (Color | null)[];
  animation?: CubeAnimation;
  compact?: boolean;
}

const faceFor = (move: string): Face | undefined => move.match(/^[URFDLB]/)?.[0] as Face | undefined;

function fallbackFace(stickers: (Color | null)[], face: number, title: string) {
  return <div className="cube-fallback-face" aria-label={`${title} грань`}>
    <strong>{title}</strong><div className="cube-fallback-grid">{stickers.slice(face * 9, face * 9 + 9).map((color, i) => <i key={i} style={{ background: color ? colors[color].hex : '#e5e7eb' }} />)}</div>
  </div>;
}

/** A real, draggable Three.js cube. Sticker indices follow cubejs URFDLB ordering. */
export default function CubeView({ stickers, animation, compact = false }: CubeViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneApi = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; controls: OrbitControls; cube: THREE.Group; layers: Map<Face, THREE.Group>; cubelets: THREE.Group[] } | null>(null);
  const animationRef = useRef(animation);
  const [fallback, setFallback] = useState(false);
  const [cameraVersion, setCameraVersion] = useState(0);
  animationRef.current = animation;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);
    } catch {
      setFallback(true);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(3.8, 3.1, 4.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.4;
    controls.maxDistance = 9;
    controls.target.set(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d96a5, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const cube = new THREE.Group();
    scene.add(cube);
    const layers = new Map<Face, THREE.Group>();
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as Face[]) {
      const layer = new THREE.Group();
      layers.set(face, layer);
      cube.add(layer);
    }
    const cubelets: THREE.Group[] = [];
    const coreGeometry = new THREE.BoxGeometry(0.64, 0.64, 0.64);
    const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.56, metalness: 0.02 });
    const stickerGeometry = new THREE.PlaneGeometry(0.59, 0.59);
    const stickerMaterials: THREE.MeshStandardMaterial[] = [];
    const coordinates = [-0.68, 0, 0.68];
    for (let yi = 0; yi < 3; yi += 1) for (let zi = 0; zi < 3; zi += 1) for (let xi = 0; xi < 3; xi += 1) {
      const position = new THREE.Vector3(coordinates[xi], coordinates[yi], coordinates[zi]);
      const cubie = new THREE.Group();
      cubie.position.copy(position);
      cubie.add(new THREE.Mesh(coreGeometry, coreMaterial));
      for (let index = 0; index < 54; index += 1) {
        const pose = faceletGeometry(index);
        if (position.x !== pose.position[0] * 0.68 || position.y !== pose.position[1] * 0.68 || position.z !== pose.position[2] * 0.68) continue;
        const color = stickers[index] ? colors[stickers[index]!].hex : '#4b5563';
        const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.01, side: THREE.DoubleSide });
        stickerMaterials.push(material);
        const sticker = new THREE.Mesh(stickerGeometry, material);
        sticker.position.set(...pose.normal.map(v => v * 0.333) as [number, number, number]);
        sticker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...pose.normal));
        sticker.userData.faceletIndex = index;
        cubie.add(sticker);
      }
      // Keep the 27th core cubie and every other cubie on the stationary cube.
      // A move temporarily reparents only the selected outer layer into its pivot.
      cube.add(cubie);
      cubelets.push(cubie);
    }
    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let raf = 0;
    const draw = () => { raf = requestAnimationFrame(draw); controls.update(); renderer.render(scene, camera); };
    draw();
    sceneApi.current = { scene, camera, renderer, controls, cube, layers, cubelets };
    setFallback(false);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      coreGeometry.dispose(); stickerGeometry.dispose();
      coreMaterial.dispose(); stickerMaterials.forEach(material => material.dispose());
      scene.clear();
      renderer.domElement.remove();
      sceneApi.current = null;
    };
    // Scene construction is intentionally one-time; current stickers are rebound below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild sticker colors from current state, keeping the active scene and controls intact.
  useEffect(() => {
    const api = sceneApi.current;
    if (!api) return;
    // Object materials are replaced in-place, so no renderer or geometry rebuild is needed.
    api.cube.updateMatrixWorld(true);
    api.cubelets.forEach(cubie => {
      cubie.children.forEach(child => {
        if (!(child instanceof THREE.Mesh) || child.userData.faceletIndex === undefined) return;
        const cubiePosition = cubie.getWorldPosition(new THREE.Vector3());
        const normal = child.getWorldDirection(new THREE.Vector3());
        const poseIndex = faceletIndexAtPose(
          [cubiePosition.x, cubiePosition.y, cubiePosition.z].map(value => Math.round(value / 0.68)) as [number, number, number],
          [normal.x, normal.y, normal.z].map(value => Math.round(value)) as [number, number, number],
        );
        const color = poseIndex === undefined ? undefined : stickers[poseIndex];
        (child.material as THREE.MeshStandardMaterial).color.set(color ? colors[color].hex : '#4b5563');
      });
    });
  }, [stickers]);

  useEffect(() => {
    const api = sceneApi.current;
    const face = animation && faceFor(animation.move);
    if (!animation) return;
    if (!api || !face) { animation.onComplete(); return; }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      const layer = api.layers.get(face)!;
      // Restore layer objects to the stationary cube before the parent applies its new facelets.
      layer.rotation.set(0, 0, 0);
      layer.updateMatrixWorld(true);
      [...layer.children].forEach(child => api.cube.attach(child));
      api.cube.updateMatrixWorld(true);
      animationRef.current?.onComplete();
    };
    if (reduced) { finish(); return; }
    const layer = api.layers.get(face)!;
    // Layers are pivoted at the cube origin. Move selected cubies into the pivot while preserving pose.
    const selected = api.cubelets.filter(cubie => {
      const position = cubie.position;
      return face === 'U' ? position.y > 0.2 : face === 'D' ? position.y < -0.2 : face === 'R' ? position.x > 0.2 : face === 'L' ? position.x < -0.2 : face === 'F' ? position.z > 0.2 : position.z < -0.2;
    });
    selected.forEach(cubie => layer.attach(cubie));
    const normal = new THREE.Vector3(...faceletGeometry(['U', 'R', 'F', 'D', 'L', 'B'].indexOf(face) * 9 + 4).normal);
    const direction = (animation.reverse !== moveIsInverse(animation.move) ? 1 : -1);
    const degrees = animation.move.endsWith('2') ? Math.PI : Math.PI / 2;
    const axis = normal;
    const start = performance.now();
    const duration = Math.max(0, animation.duration);
    let frame = 0;
    const animate = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = t * t * (3 - 2 * t);
      layer.setRotationFromAxisAngle(axis, direction * degrees * eased);
      if (t >= 1) finish(); else frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      if (!completed) {
        layer.rotation.set(0, 0, 0);
        [...layer.children].forEach(child => api.cube.attach(child));
        api.cube.updateMatrixWorld(true);
      }
    };
  }, [animation?.move, animation?.reverse, animation?.duration]);

  const setView = (view: 'front' | 'top' | 'back') => {
    const api = sceneApi.current;
    if (!api) { setCameraVersion(v => v + 1); return; }
    const distance = 5.8;
    const positions = { front: [0, 1.25, distance], top: [0, distance, 0.01], back: [0, 1.25, -distance] } as const;
    api.camera.position.set(positions[view][0], positions[view][1], positions[view][2]);
    api.camera.up.set(0, view === 'top' ? 0 : 1, view === 'top' ? -1 : 0);
    api.controls.target.set(0, 0, 0);
    api.controls.update();
  };

  return <div className={`cube-view${compact ? ' cube-view--compact' : ''}`}>
    {!fallback && <div className="cube-view__canvas" ref={hostRef} aria-label="Об’ємний кубик Рубіка. Перетягуйте мишкою або пальцем, щоб оглянути кубик." role="img" />}
    {fallback && <div className="cube-view__fallback" aria-label="Розгортка кубика">
      {fallbackFace(stickers, 0, 'Верх U')}{fallbackFace(stickers, 1, 'Праворуч R')}{fallbackFace(stickers, 2, 'Перед F')}
      {fallbackFace(stickers, 3, 'Низ D')}{fallbackFace(stickers, 4, 'Ліворуч L')}{fallbackFace(stickers, 5, 'Зад B')}
      <p>3D-огляд недоступний у цьому браузері. Кольорова розгортка показує поточний стан.</p>
    </div>}
    {!fallback && <div className="cube-view__controls" aria-label="Керування оглядом кубика">
      <span>Перетягуйте для обертання</span>
      <button type="button" onClick={() => setView('front')}>Спереду</button>
      <button type="button" onClick={() => setView('top')}>Згори</button>
      <button type="button" onClick={() => setView('back')}>Ззаду</button>
    </div>}
    <span className="sr-only" aria-live="polite">{animation ? `Рух ${animation.move}` : 'Кубик готовий'}</span>
    {cameraVersion > 0 && <span className="sr-only">Огляд камери змінено</span>}
  </div>;
}

function moveIsInverse(move: string): boolean {
  return move.endsWith("'");
}
