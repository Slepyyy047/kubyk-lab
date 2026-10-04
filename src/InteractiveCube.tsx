import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { colors, type Color, type Face } from './cube';
import { faceNormal, getStickerIndexAtPose, stickerPose, type PuzzleMove, type PuzzleState } from './puzzle';

export interface InteractiveCubeProps {
  puzzle: PuzzleState;
  turn?: { id: number; move: PuzzleMove; onComplete: () => void };
  onMove: (move: PuzzleMove) => void;
  interactive?: boolean;
  exploded?: boolean;
  hero?: boolean;
  onReady?: (available: boolean) => void;
}

type CubieRecord = { group: THREE.Group; coords: [number, number, number] };
type CubeScene = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  object: THREE.Group;
  heroObject: THREE.Group;
  layerPivots: Map<Face, THREE.Group>;
  cubies: CubieRecord[];
  stickers: THREE.Mesh[];
  stickerMaterials: THREE.MeshStandardMaterial[];
  coreMaterials: THREE.MeshStandardMaterial[];
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  keyLight: THREE.PointLight;
};

type PointerGesture = { id: number; x: number; y: number; sticker: THREE.Mesh; pose: [number, number, number]; normal: [number, number, number]; shift: boolean };

const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_NAMES: Record<Face, string> = { U: 'верхня', R: 'права', F: 'передня', D: 'нижня', L: 'ліва', B: 'задня' };
const AXIS_FACE: Record<string, readonly [Face, Face]> = { x: ['R', 'L'], y: ['U', 'D'], z: ['F', 'B'] };
const STEP_MS = 285;

function colorHex(color: Color | undefined): string {
  return color ? colors[color].hex : '#343840';
}

function faceOrder(face: Face): number { return FACES.indexOf(face); }

function buildFaceNet(puzzle: PuzzleState, onMove: (move: PuzzleMove) => void) {
  return <div className="interactive-cube__fallback" aria-label="Розгортка кубика">
    {FACES.map(face => <section className="interactive-cube__fallback-face" key={face}>
      <h3>{FACE_NAMES[face]} грань · {face}</h3>
      <div className="interactive-cube__fallback-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
        {Array.from({ length: puzzle.size ** 2 }, (_, cell) => {
          const row = Math.floor(cell / puzzle.size);
          const col = cell % puzzle.size;
          const span = puzzle.size - 1;
          const pose = { position: [0, 0, 0] as [number, number, number], normal: faceNormal(face) };
          // Ask the engine for canonical position through a sticker on this face.
          const facelet = FACES.indexOf(face) * puzzle.size ** 2 + cell;
          Object.assign(pose, stickerPose(puzzle.size, facelet));
          const index = getStickerIndexAtPose(puzzle.size, pose.position, pose.normal) ?? faceOrder(face) * puzzle.size ** 2 + row * puzzle.size + col;
          void span;
          return <i key={cell} style={{ background: colorHex(puzzle.stickers[index]) }} />;
        })}
      </div>
      <button type="button" onClick={() => onMove({ face, depth: 0, turns: 1 })}>Повернути грань {face}</button>
    </section>)}
    <p>3D-огляд недоступний. Керуйте кубиком кнопками граней або клавіатурою.</p>
  </div>;
}

/** Interactive rounded-plastic NxN cube with real slice turns and raycast gestures. */
export default function InteractiveCube({ puzzle, turn, onMove, interactive = true, exploded = false, hero = false, onReady }: InteractiveCubeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const gestureRef = useRef<PointerGesture | null>(null);
  const puzzleRef = useRef(puzzle);
  const onMoveRef = useRef(onMove);
  const completeRef = useRef(turn?.onComplete);
  const interactiveRef = useRef(interactive && !exploded);
  const explodedRef = useRef(exploded);
  const explodedProgressRef = useRef(exploded ? 1 : 0);
  const requestedInteractiveRef = useRef(interactive);
  const turnRef = useRef(turn);
  const [available, setAvailable] = useState(true);
  const [hoverFace, setHoverFace] = useState<Face | null>(null);
  puzzleRef.current = puzzle;
  onMoveRef.current = onMove;
  completeRef.current = turn?.onComplete;
  interactiveRef.current = interactive && !exploded && !turn && explodedProgressRef.current < 0.03;
  requestedInteractiveRef.current = interactive;
  explodedRef.current = exploded;
  turnRef.current = turn;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let api: CubeScene;
    let partialRenderer: THREE.WebGLRenderer | null = null;
    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      partialRenderer = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.13;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.tabIndex = 0;
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.dataset.testid = 'interactive-cube-canvas';
      renderer.domElement.dataset.modelSize = String(puzzleRef.current.size);
      renderer.domElement.setAttribute('aria-label', 'Інтерактивний кубик Рубіка. Перетягніть наліпку для повороту шару, вільну область — для огляду. Клацніть наліпку для повороту її грані.');
      renderer.domElement.setAttribute('role', 'application');
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      camera.position.set(4.4, 3.3, 5.2);
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reducedMotion;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.minDistance = 3.6;
      controls.maxDistance = 9;
      controls.target.set(0, 0, 0);
      const cameraKeys = (event: KeyboardEvent) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        if (event.key === 'ArrowLeft') spherical.theta -= 0.15;
        if (event.key === 'ArrowRight') spherical.theta += 0.15;
        if (event.key === 'ArrowUp') spherical.phi -= 0.15;
        if (event.key === 'ArrowDown') spherical.phi += 0.15;
        spherical.makeSafe();
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();
      };
      renderer.domElement.addEventListener('keydown', cameraKeys);

      scene.add(new THREE.HemisphereLight(0xe9edff, 0x31343a, 1.75));
      const ambient = new THREE.AmbientLight(0xffffff, 0.48);
      scene.add(ambient);
      const keyLight = new THREE.PointLight(0xffe8cf, 95, 18, 2);
      keyLight.position.set(3.2, 4.2, 4.5);
      scene.add(keyLight);
      const rim = new THREE.DirectionalLight(0x8ba6ff, 2.2);
      rim.position.set(-4, 2, -3);
      scene.add(rim);

      // A soft transparent pool gives the object a little weight without decorating the scene.
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
        gradient.addColorStop(0, 'rgba(0,0,0,.38)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.3), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.42;
      scene.add(shadow);

      const heroObject = new THREE.Group();
      const object = new THREE.Group();
      heroObject.add(object);
      scene.add(heroObject);
      const layerPivots = new Map<Face, THREE.Group>();
      for (const face of FACES) {
        const pivot = new THREE.Group();
        layerPivots.set(face, pivot);
        object.add(pivot);
      }
      const coreMaterials: THREE.MeshStandardMaterial[] = [];
      const stickerMaterials: THREE.MeshStandardMaterial[] = [];
      const stickers: THREE.Mesh[] = [];
      const cubies: CubieRecord[] = [];
      const size = puzzleRef.current.size;
      const spacing = 2.5 / size;
      const limit = size - 1;
      const boxEdge = spacing * 0.92;
      const stickerEdge = spacing * 0.79;
      const stickerThickness = spacing * 0.055;
      const coreGeo = new RoundedBoxGeometry(boxEdge, boxEdge, boxEdge, 5, spacing * 0.1);
      const stickerGeo = new RoundedBoxGeometry(stickerEdge, stickerEdge, stickerThickness, 4, stickerThickness * 0.46);
      const positions: number[] = [];
      for (let value = -limit; value <= limit; value += 2) positions.push(value);
      for (const y of positions) for (const z of positions) for (const x of positions) {
        const coords: [number, number, number] = [x, y, z];
        const cubie = new THREE.Group();
        cubie.position.set(x * spacing / 2, y * spacing / 2, z * spacing / 2);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.42, metalness: 0.04 });
        coreMaterials.push(coreMat);
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.userData.isCore = true;
        cubie.add(core);
        for (const face of FACES) {
          const normal = faceNormal(face);
          const position = coords;
          const faceIndex = getStickerIndexAtPose(size, position, normal);
          if (faceIndex === undefined) continue;
          const color = puzzleRef.current.stickers[faceIndex];
          const mat = new THREE.MeshStandardMaterial({ color: colorHex(color), roughness: 0.29, metalness: 0.015, emissive: colorHex(color), emissiveIntensity: 0.025 });
          stickerMaterials.push(mat);
          const panel = new THREE.Mesh(stickerGeo, mat);
          panel.position.set(normal[0] * (boxEdge / 2 + stickerThickness / 2 + 0.004), normal[1] * (boxEdge / 2 + stickerThickness / 2 + 0.004), normal[2] * (boxEdge / 2 + stickerThickness / 2 + 0.004));
          panel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal));
          panel.userData = { faceletIndex: faceIndex, face, position: [...position], normal: [...normal] };
          cubie.add(panel);
          stickers.push(panel);
        }
        object.add(cubie);
        cubies.push({ group: cubie, coords });
      }
      // Store shared mesh geometries once for explicit disposal.
      object.userData.geometries = [coreGeo, stickerGeo];
      api = { scene, camera, renderer, controls, object, heroObject, layerPivots, cubies, stickers, stickerMaterials, coreMaterials, raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(), keyLight };
      sceneRef.current = api;

      const resize = () => {
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      let frame = 0;
      let disposeScene: (() => void) | undefined;
      let previousTime = 0;
      let explodedMix = explodedRef.current ? 1 : 0;
      const render = (time: number) => {
        frame = requestAnimationFrame(render);
        const delta = Math.min(0.05, (time - previousTime) / 1000 || 0);
        previousTime = time;
        const target = explodedRef.current ? 1 : 0;
        explodedMix = reducedMotion ? target : THREE.MathUtils.damp(explodedMix, target, 5.5, delta);
        explodedProgressRef.current = explodedMix;
        interactiveRef.current = requestedInteractiveRef.current && !explodedRef.current && !turnRef.current && explodedMix < 0.03;
        for (const { group, coords } of api.cubies) {
          const v = new THREE.Vector3(...coords);
          const offset = v.lengthSq() ? v.clone().normalize().multiplyScalar(0.26 * explodedMix) : new THREE.Vector3();
          group.position.set(coords[0] * spacing / 2 + offset.x, coords[1] * spacing / 2 + offset.y, coords[2] * spacing / 2 + offset.z);
        }
        if (hero && !reducedMotion && !turnRef.current && !gestureRef.current) {
          api.heroObject.position.y = Math.sin(time * 0.00072) * 0.035;
          api.heroObject.rotation.y = Math.sin(time * 0.00028) * 0.045;
        } else {
          api.heroObject.position.y = 0;
          api.heroObject.rotation.y = 0;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(render);
      onReady?.(true);
      setAvailable(true);

      const contextLost = (event: Event) => {
        event.preventDefault();
        cancelAnimationFrame(frame);
        controls.enabled = false;
        gestureRef.current = null;
        disposeScene?.();
        sceneRef.current = null;
        setAvailable(false);
        onReady?.(false);
        completeRef.current?.();
      };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);

      const cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener('webglcontextlost', contextLost);
        renderer.domElement.removeEventListener('keydown', cameraKeys);
        controls.dispose();
        renderer.dispose();
        for (const geometry of object.userData.geometries as THREE.BufferGeometry[]) geometry.dispose();
        coreMaterials.forEach(material => material.dispose());
        stickerMaterials.forEach(material => material.dispose());
        (shadow.geometry as THREE.BufferGeometry).dispose();
        (shadow.material as THREE.Material).dispose();
        shadowTexture.dispose();
        renderer.domElement.remove();
        scene.clear();
        sceneRef.current = null;
      };
      disposeScene = cleanup;
      return cleanup;
    } catch {
      partialRenderer?.dispose();
      partialRenderer?.domElement.remove();
      setAvailable(false);
      onReady?.(false);
      return;
    }
  // Recreate WebGL resources only when model size changes; state colors update below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.size, hero]);

  useEffect(() => {
    const api = sceneRef.current;
    if (!api) return;
    api.object.updateMatrixWorld(true);
    for (const sticker of api.stickers) {
      const index = sticker.userData.faceletIndex as number;
      const material = sticker.material as THREE.MeshStandardMaterial;
      material.color.set(colorHex(puzzle.stickers[index]));
      material.emissive.set(colorHex(puzzle.stickers[index]));
    }
  }, [puzzle]);

  useEffect(() => {
    const api = sceneRef.current;
    if (!turn) return;
    if (!api) {
      // WebGL failure must not stall a caller's move queue.
      completeRef.current?.();
      return;
    }
    const { face, depth, turns } = turn.move;
    const pivot = api.layerPivots.get(face);
    if (!pivot) { completeRef.current?.(); return; }
    if (explodedRef.current) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pivot.rotation.set(0, 0, 0);
      pivot.updateMatrixWorld(true);
      [...pivot.children].forEach(child => api.object.attach(child));
      api.object.updateMatrixWorld(true);
      completeRef.current?.();
    };
    const selected = api.cubies.filter(({ coords }) => {
      const normal = faceNormal(face);
      const axis = normal.findIndex(value => value !== 0);
      const level = (puzzle.size - 1) - 2 * depth;
      return coords[axis] === normal[axis] * level;
    });
    selected.forEach(({ group }) => pivot.attach(group));
    const normal = faceNormal(face);
    const axis = new THREE.Vector3(...normal);
    const start = performance.now();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion) { finish(); return; }
    let frame = 0;
    const angle = -turns * Math.PI / 2;
    const animate = (time: number) => {
      const t = Math.min(1, (time - start) / STEP_MS);
      const eased = t * t * (3 - 2 * t);
      pivot.setRotationFromAxisAngle(axis, angle * eased);
      if (t >= 1) finish(); else frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      if (!done) {
        pivot.rotation.set(0, 0, 0);
        [...pivot.children].forEach(child => api.object.attach(child));
        api.object.updateMatrixWorld(true);
      }
    };
  }, [turn?.id, turn?.move.face, turn?.move.depth, turn?.move.turns, puzzle.size]);

  useEffect(() => {
    const host = hostRef.current;
    const api = sceneRef.current;
    if (!host || !api) return;
    const canvas = api.renderer.domElement;
    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      api.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      api.raycaster.setFromCamera(api.pointer, api.camera);
      return api.raycaster.intersectObjects(api.stickers, false)[0];
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button === 2 || !interactiveRef.current || explodedRef.current) return;
      const hit = point(event);
      const mesh = hit?.object as THREE.Mesh | undefined;
      if (!hit || !mesh) return;
      const data = mesh.userData;
      gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, sticker: mesh, pose: [...data.position] as [number, number, number], normal: [...data.normal] as [number, number, number], shift: event.shiftKey };
      api.controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const pointerMove = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (gesture && gesture.id === event.pointerId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const hit = point(event);
      const face = hit?.object.userData.face as Face | undefined;
      setHoverFace(face ?? null);
      canvas.dataset.hoverFace = face ?? '';
      for (const sticker of api.stickers) {
        const selected = !!hit && onSameLayer(sticker.userData.position as [number, number, number], hit.object.userData.position as [number, number, number], hit.object.userData.normal as [number, number, number], puzzleRef.current.size);
        const mat = sticker.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = selected && face !== undefined ? 0.2 : 0.025;
      }
      if (hero) {
        const rect = canvas.getBoundingClientRect();
        api.keyLight.position.set(3 + (event.clientX - rect.left) / rect.width * 1.2, 3.6 + (rect.top + rect.height / 2 - event.clientY) / rect.height, 4.4);
      }
    };
    const pointerUp = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      gestureRef.current = null;
      api.controls.enabled = true;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (Math.hypot(dx, dy) < 9) {
        onMoveRef.current({ face: gesture.sticker.userData.face as Face, depth: 0, turns: gesture.shift ? -1 : 1 });
      } else {
        const move = gestureMove(api, gesture, dx, dy, puzzleRef.current.size);
        if (move) onMoveRef.current(move);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const pointerCancel = (event: PointerEvent) => {
      if (gestureRef.current?.id !== event.pointerId) return;
      gestureRef.current = null;
      api.controls.enabled = true;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const contextMenu = (event: Event) => event.preventDefault();
    canvas.addEventListener('pointerdown', pointerDown, true);
    canvas.addEventListener('pointermove', pointerMove, true);
    canvas.addEventListener('pointerup', pointerUp, true);
    canvas.addEventListener('pointercancel', pointerCancel, true);
    canvas.addEventListener('contextmenu', contextMenu);
    return () => {
      canvas.removeEventListener('pointerdown', pointerDown, true);
      canvas.removeEventListener('pointermove', pointerMove, true);
      canvas.removeEventListener('pointerup', pointerUp, true);
      canvas.removeEventListener('pointercancel', pointerCancel, true);
      canvas.removeEventListener('contextmenu', contextMenu);
      gestureRef.current = null;
    };
  }, [available, hero]);

  const resetView = () => {
    const api = sceneRef.current;
    if (!api) return;
    api.camera.position.set(4.4, 3.3, 5.2);
    api.camera.up.set(0, 1, 0);
    api.controls.target.set(0, 0, 0);
    api.controls.update();
  };

  return <div className={`interactive-cube${hero ? ' interactive-cube--hero' : ''}${exploded ? ' interactive-cube--exploded' : ''}`} data-hover-face={hoverFace ?? undefined}>
    {available ? <div className="interactive-cube__canvas" ref={hostRef} /> : buildFaceNet(puzzle, onMove)}
    {available && <div className="interactive-cube__toolbar">
      <span aria-live="polite">{hoverFace ? `Грань ${hoverFace} · ${FACE_NAMES[hoverFace]}` : 'Перетягніть наліпку або клацніть її'}</span>
      <button type="button" onClick={resetView}>Повернути огляд</button>
    </div>}
    <span className="sr-only" aria-live="polite">{turn ? `Обертання грані ${turn.move.face}` : ''}</span>
  </div>;
}

function onSameLayer(a: [number, number, number], b: [number, number, number], normal: [number, number, number], size: PuzzleState['size']): boolean {
  const axis = normal.findIndex(value => value !== 0);
  const depthCoord = (size - 1) - 2 * Math.round((size - 1 - Math.abs(b[axis])) / 2);
  return Math.abs(a[axis]) === Math.abs(depthCoord);
}

function gestureMove(api: CubeScene, gesture: PointerGesture, dx: number, dy: number, size: PuzzleState['size']): PuzzleMove | undefined {
  api.camera.updateMatrixWorld(true);
  api.object.updateMatrixWorld(true);
  const cameraRight = new THREE.Vector3().setFromMatrixColumn(api.camera.matrixWorld, 0);
  const cameraUp = new THREE.Vector3().setFromMatrixColumn(api.camera.matrixWorld, 1);
  const tangentLocal = cameraRight.multiplyScalar(dx).addScaledVector(cameraUp, -dy).normalize();
  tangentLocal.applyQuaternion(api.object.getWorldQuaternion(new THREE.Quaternion()).invert());
  const faceNormalVec = new THREE.Vector3(...gesture.normal);
  tangentLocal.addScaledVector(faceNormalVec, -tangentLocal.dot(faceNormalVec)).normalize();
  const axis = new THREE.Vector3(...gesture.normal).cross(tangentLocal);
  const axisIndex = Math.abs(axis.x) > Math.abs(axis.y) ? (Math.abs(axis.x) > Math.abs(axis.z) ? 0 : 2) : (Math.abs(axis.y) > Math.abs(axis.z) ? 1 : 2);
  if (Math.abs(axis.getComponent(axisIndex)) < 0.2) return undefined;
  const coord = gesture.pose[axisIndex];
  const side = coord >= 0 ? 0 : 1;
  const axisName = axisIndex === 0 ? 'x' : axisIndex === 1 ? 'y' : 'z';
  const face = AXIS_FACE[axisName][side];
  const depth = Math.max(0, Math.min(size - 1, Math.round((size - 1 - Math.abs(coord)) / 2)));
  const selectedNormal = faceNormal(face);
  const selectedAxis = new THREE.Vector3(...selectedNormal);
  const r = new THREE.Vector3(...gesture.pose).addScaledVector(new THREE.Vector3(...selectedNormal), -coord * Math.sign(selectedNormal[axisIndex]));
  const drag = tangentLocal;
  const signedRotation = Math.sign(drag.dot(selectedAxis.clone().cross(r))) || 1;
  const turns = -signedRotation;
  return { face, depth, turns: (gesture.shift ? -turns : turns) as 1 | -1 };
}
