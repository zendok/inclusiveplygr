import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { zones, Zone } from './data/zones';
import ZoneList from './components/ZoneList';
import InfoPanel from './components/InfoPanel';

const defaultCamPos = { x: 15, y: 12, z: 20 };
const defaultTarget = { x: 0, y: 0, z: 0 };

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);

  const moveCamera = useCallback((pos: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => {
    if (!cameraRef.current || !controlsRef.current) return;

    new TWEEN.Tween(cameraRef.current.position)
      .to({ x: pos.x, y: pos.y, z: pos.z }, 1200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    new TWEEN.Tween(controlsRef.current.target)
      .to({ x: target.x, y: target.y, z: target.z }, 1200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        controlsRef.current?.update();
      })
      .start();
  }, []);

  const selectZone = useCallback((id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;
    setActiveZone(id);
    setSelectedZone(zone);
    moveCamera(zone.camPos, zone.target);
  }, [moveCamera]);

  const resetView = useCallback(() => {
    setActiveZone(null);
    setSelectedZone(null);
    moveCamera(defaultCamPos, defaultTarget);
  }, [moveCamera]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB');
    scene.fog = new THREE.FogExp2('#87CEEB', 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(defaultCamPos.x, defaultCamPos.y, defaultCamPos.z);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.target.set(defaultTarget.x, defaultTarget.y, defaultTarget.z);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Build playground
    buildPlayground(scene);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      TWEEN.update(time);
      controls.update();
      renderer.render(scene, camera);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Remove loading
    setTimeout(() => setLoading(false), 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (canvasRef.current && renderer.domElement.parentNode === canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans" style={{ backgroundColor: '#87CEEB' }}>
      {/* Loading Screen */}
      {loading && (
        <div className="absolute inset-0 bg-white z-[100] flex justify-center items-center text-2xl font-bold text-blue-500 transition-opacity duration-500">
          Building Playground...
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={canvasRef} className="absolute inset-0 z-[1]" />

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Zone List Panel */}
        <ZoneList
          zones={zones}
          activeZone={activeZone}
          onSelect={selectZone}
        />

        {/* Info Panel */}
        <InfoPanel
          zone={selectedZone}
          onReset={resetView}
        />
      </div>
    </div>
  );
}

function buildPlayground(scene: THREE.Scene) {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshStandardMaterial({ color: '#2d8a56', roughness: 0.8 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Play area rubber surfacing
  const playAreaGeo = new THREE.PlaneGeometry(24, 18);
  const playAreaMat = new THREE.MeshStandardMaterial({ color: '#f0c05a', roughness: 0.9 });
  const playArea = new THREE.Mesh(playAreaGeo, playAreaMat);
  playArea.rotation.x = -Math.PI / 2;
  playArea.position.y = 0.01;
  playArea.receiveShadow = true;
  scene.add(playArea);

  // Ramped Structure
  const structGroup = new THREE.Group();
  structGroup.position.set(0, 0, -3);

  const platMat = new THREE.MeshStandardMaterial({ color: '#4a90e2' });
  const rampMat = new THREE.MeshStandardMaterial({ color: '#e67e22' });
  const pillarMat = new THREE.MeshStandardMaterial({ color: '#bdc3c7' });

  // Platform 1 (Low)
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), platMat);
  p1.position.set(0, 1, 0);
  p1.castShadow = true; p1.receiveShadow = true;
  structGroup.add(p1);
  addPillars(structGroup, pillarMat, 4, 1, 0, 0);

  // Platform 2 (High)
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), platMat);
  p2.position.set(6, 2, 0);
  p2.castShadow = true; p2.receiveShadow = true;
  structGroup.add(p2);
  addPillars(structGroup, pillarMat, 4, 2, 6, 0);

  // Ramp Ground to P1
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), rampMat);
  r1.position.set(-4.5, 0.5, 0);
  r1.rotation.z = -Math.PI / 12;
  r1.castShadow = true; r1.receiveShadow = true;
  structGroup.add(r1);

  // Ramp P1 to P2
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 3), rampMat);
  r2.position.set(3, 1.5, 0);
  r2.rotation.z = -Math.PI / 12;
  r2.castShadow = true; r2.receiveShadow = true;
  structGroup.add(r2);

  // Accessible Slide
  const slideGeo = new THREE.BoxGeometry(2, 0.1, 5);
  const slideMat = new THREE.MeshStandardMaterial({ color: '#e74c3c' });
  const slide = new THREE.Mesh(slideGeo, slideMat);
  slide.position.set(6, 1, 4);
  slide.rotation.x = Math.PI / 6;
  slide.castShadow = true;
  structGroup.add(slide);

  scene.add(structGroup);

  // Flush-Mount Carousel
  const carGroup = new THREE.Group();
  carGroup.position.set(-6, 0.05, 6);

  const carBaseGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 32);
  const carBaseMat = new THREE.MeshStandardMaterial({ color: '#34495e' });
  const carBase = new THREE.Mesh(carBaseGeo, carBaseMat);
  carBase.castShadow = true; carBase.receiveShadow = true;
  carGroup.add(carBase);

  const carCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16), pillarMat);
  carCenter.position.y = 0.75;
  carGroup.add(carCenter);

  const railGeo = new THREE.TorusGeometry(1.5, 0.1, 8, 24, Math.PI);
  const railMat = new THREE.MeshStandardMaterial({ color: '#e74c3c' });
  for (let i = 0; i < 3; i++) {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = 1;
    rail.rotation.y = (i * Math.PI * 2) / 3;
    carGroup.add(rail);
  }
  scene.add(carGroup);

  // Sensory Garden Wall
  const sensGroup = new THREE.Group();
  sensGroup.position.set(8, 0, 4);
  sensGroup.rotation.y = -Math.PI / 4;

  const wallBaseGeo = new THREE.BoxGeometry(6, 2, 0.5);
  const wallBaseMat = new THREE.MeshStandardMaterial({ color: '#8b5a2b' });
  const wallBase = new THREE.Mesh(wallBaseGeo, wallBaseMat);
  wallBase.position.y = 1;
  wallBase.castShadow = true; wallBase.receiveShadow = true;
  sensGroup.add(wallBase);

  const colors = ['#3498db', '#f1c40f', '#2ecc71', '#e74c3c'];
  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.6),
      new THREE.MeshStandardMaterial({ color: colors[i] })
    );
    panel.position.set(-2.25 + (i * 1.5), 1.2, 0);
    sensGroup.add(panel);
  }
  scene.add(sensGroup);

  // Saucer Swing
  const swingGroup = new THREE.Group();
  swingGroup.position.set(-7, 0, -5);

  const frameGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
  const frameMat = new THREE.MeshStandardMaterial({ color: '#27ae60' });

  const pA1 = new THREE.Mesh(frameGeo, frameMat);
  pA1.position.set(-2, 2, 1); pA1.rotation.x = -Math.PI / 8;
  pA1.castShadow = true; swingGroup.add(pA1);

  const pA2 = new THREE.Mesh(frameGeo, frameMat);
  pA2.position.set(-2, 2, -1); pA2.rotation.x = Math.PI / 8;
  pA2.castShadow = true; swingGroup.add(pA2);

  const pB1 = new THREE.Mesh(frameGeo, frameMat);
  pB1.position.set(2, 2, 1); pB1.rotation.x = -Math.PI / 8;
  pB1.castShadow = true; swingGroup.add(pB1);

  const pB2 = new THREE.Mesh(frameGeo, frameMat);
  pB2.position.set(2, 2, -1); pB2.rotation.x = Math.PI / 8;
  pB2.castShadow = true; swingGroup.add(pB2);

  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5), frameMat);
  topBar.position.y = 3.8;
  topBar.rotation.z = Math.PI / 2;
  topBar.castShadow = true;
  swingGroup.add(topBar);

  const saucerGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
  const saucerMat = new THREE.MeshStandardMaterial({ color: '#3498db' });
  const saucer = new THREE.Mesh(saucerGeo, saucerMat);
  saucer.position.y = 1;
  saucer.castShadow = true;
  swingGroup.add(saucer);

  const ropeMat = new THREE.MeshStandardMaterial({ color: '#7f8c8d' });
  const rope1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.8), ropeMat);
  rope1.position.set(-1, 2.4, 0); rope1.rotation.z = Math.PI / 16;
  swingGroup.add(rope1);
  const rope2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.8), ropeMat);
  rope2.position.set(1, 2.4, 0); rope2.rotation.z = -Math.PI / 16;
  swingGroup.add(rope2);

  scene.add(swingGroup);

  // Trees
  addTree(scene, -10, 0, 10);
  addTree(scene, 12, 0, -8);
  addTree(scene, 10, 0, 12);
}

function addPillars(group: THREE.Group, material: THREE.MeshStandardMaterial, size: number, height: number, px: number, pz: number) {
  const pGeo = new THREE.CylinderGeometry(0.15, 0.15, height, 16);
  const offsets = [
    [-size / 2 + 0.5, -size / 2 + 0.5],
    [size / 2 - 0.5, -size / 2 + 0.5],
    [-size / 2 + 0.5, size / 2 - 0.5],
    [size / 2 - 0.5, size / 2 - 0.5]
  ];
  offsets.forEach(off => {
    const pillar = new THREE.Mesh(pGeo, material);
    pillar.position.set(px + off[0], height / 2, pz + off[1]);
    pillar.castShadow = true;
    group.add(pillar);
  });
}

function addTree(scene: THREE.Scene, x: number, y: number, z: number) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 2),
    new THREE.MeshStandardMaterial({ color: '#5c4033' })
  );
  trunk.position.set(x, y + 1, z);
  trunk.castShadow = true;

  const leaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(2),
    new THREE.MeshStandardMaterial({ color: '#27ae60' })
  );
  leaves.position.set(x, y + 3, z);
  leaves.castShadow = true;

  scene.add(trunk);
  scene.add(leaves);
}
