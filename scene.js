// Three.js modular kitchen scene — used for the hero.
// Builds a small row of base cabinets + upper cabinets + worktop, lit subtly,
// with a slow auto-orbit and pointer-look interaction.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function mountHeroScene(container, opts = {}) {
  const palette = opts.palette || {
    wood: '#8a6a47',
    cabinet: '#efe9df',
    worktop: '#1f2024',
    accent: '#3d5240',
    floor: '#e9e2d4',
    wall: '#f3eee3',
  };
  const speed = opts.speed ?? 0.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.wall);

  // Subtle fog gives the impression of depth
  scene.fog = new THREE.Fog(palette.wall, 8, 22);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(5.8, 3.2, 6.5);
  camera.lookAt(0, 1.1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9ad95, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xfff1d6, 0.35);
  fill.position.set(-4, 3, 2);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffe4b8, 1.2, 8);
  rim.position.set(-1.5, 1.6, -1.2);
  scene.add(rim);

  // Materials
  const matCabinet = new THREE.MeshStandardMaterial({
    color: palette.cabinet,
    roughness: 0.55,
    metalness: 0.02,
  });
  const matWood = new THREE.MeshStandardMaterial({
    color: palette.wood,
    roughness: 0.7,
    metalness: 0.05,
  });
  const matWorktop = new THREE.MeshStandardMaterial({
    color: palette.worktop,
    roughness: 0.25,
    metalness: 0.1,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: palette.accent,
    roughness: 0.45,
    metalness: 0.05,
  });
  const matFloor = new THREE.MeshStandardMaterial({
    color: palette.floor,
    roughness: 0.85,
    metalness: 0.0,
  });
  const matHandle = new THREE.MeshStandardMaterial({
    color: 0x2a2a2c,
    roughness: 0.3,
    metalness: 0.7,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), matFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 8),
    new THREE.MeshStandardMaterial({ color: palette.wall, roughness: 1 })
  );
  wall.position.set(0, 4, -2.4);
  wall.receiveShadow = true;
  scene.add(wall);

  // Group
  const kitchen = new THREE.Group();
  scene.add(kitchen);

  function box(w, h, d, mat) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Base cabinets — 4 modules, wood doors
  const baseWidth = 0.9;
  const baseHeight = 0.85;
  const baseDepth = 0.62;
  const baseY = 0.075 + baseHeight / 2;

  const baseModules = [
    { mat: matWood, drawerCount: 3 },
    { mat: matCabinet, drawerCount: 2 },
    { mat: matWood, drawerCount: 1 },
    { mat: matAccent, drawerCount: 2 },
  ];

  baseModules.forEach((mod, i) => {
    const x = -1.5 + i * baseWidth;
    // Plinth
    const plinth = box(baseWidth - 0.01, 0.12, baseDepth - 0.04, matWorktop);
    plinth.position.set(x, 0.06, 0);
    kitchen.add(plinth);

    // Carcass (cabinet box)
    const carcass = box(baseWidth - 0.005, baseHeight, baseDepth, matCabinet);
    carcass.position.set(x, baseY, -0.005);
    kitchen.add(carcass);

    // Door front (slightly proud)
    const door = box(baseWidth - 0.02, baseHeight - 0.02, 0.02, mod.mat);
    door.position.set(x, baseY, baseDepth / 2 + 0.012);
    kitchen.add(door);

    // Drawer reveals as thin lines (subtle)
    if (mod.drawerCount > 1) {
      for (let d = 1; d < mod.drawerCount; d++) {
        const t = d / mod.drawerCount;
        const line = box(baseWidth - 0.04, 0.003, 0.025, matWorktop);
        line.position.set(
          x,
          baseY + baseHeight / 2 - t * baseHeight,
          baseDepth / 2 + 0.015
        );
        kitchen.add(line);
      }
    }

    // Handle: long thin bar across top
    const handle = box(baseWidth * 0.55, 0.018, 0.03, matHandle);
    handle.position.set(
      x,
      baseY + baseHeight / 2 - 0.05,
      baseDepth / 2 + 0.028
    );
    kitchen.add(handle);
  });

  // Worktop slab
  const worktopWidth = baseWidth * baseModules.length + 0.04;
  const worktop = box(worktopWidth, 0.04, baseDepth + 0.04, matWorktop);
  worktop.position.set(
    -1.5 + (baseModules.length * baseWidth) / 2 - baseWidth / 2,
    0.075 + baseHeight + 0.02,
    0
  );
  kitchen.add(worktop);

  // Backsplash
  const splash = box(worktopWidth, 0.55, 0.02, matCabinet);
  splash.position.set(worktop.position.x, worktop.position.y + 0.295, -baseDepth / 2 - 0.005);
  kitchen.add(splash);

  // Upper cabinets — 3 modules
  const upperWidth = 1.05;
  const upperHeight = 0.7;
  const upperDepth = 0.36;
  const upperY = worktop.position.y + 0.55 + upperHeight / 2;

  const upperMats = [matCabinet, matWood, matCabinet];
  for (let i = 0; i < 3; i++) {
    const x = worktop.position.x - upperWidth + i * upperWidth;
    const carcass = box(upperWidth - 0.005, upperHeight, upperDepth, matCabinet);
    carcass.position.set(x, upperY, -baseDepth / 2 + upperDepth / 2 - 0.01);
    kitchen.add(carcass);
    const door = box(upperWidth - 0.02, upperHeight - 0.02, 0.02, upperMats[i]);
    door.position.set(x, upperY, carcass.position.z + upperDepth / 2 + 0.012);
    kitchen.add(door);
    // small recessed handle line at bottom
    const handle = box(upperWidth * 0.4, 0.012, 0.018, matHandle);
    handle.position.set(x, upperY - upperHeight / 2 + 0.05, carcass.position.z + upperDepth / 2 + 0.025);
    kitchen.add(handle);
  }

  // Colonne (tall column) on the right
  const colW = 0.95;
  const colH = baseHeight + 0.55 + upperHeight + 0.04;
  const col = box(colW, colH, baseDepth, matWood);
  col.position.set(worktop.position.x + (baseModules.length * baseWidth) / 2 + colW / 2 - 0.05, 0.075 + colH / 2, 0);
  kitchen.add(col);
  const colHandle = box(0.018, colH * 0.7, 0.025, matHandle);
  colHandle.position.set(col.position.x - colW / 2 + 0.05, col.position.y, baseDepth / 2 + 0.022);
  kitchen.add(colHandle);

  // A vase + a wood board on the worktop as small props
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: 0xe8d9bf, roughness: 0.8 })
  );
  vase.position.set(worktop.position.x - 0.9, worktop.position.y + 0.13, 0.05);
  vase.castShadow = true;
  kitchen.add(vase);

  const board = box(0.5, 0.025, 0.28, matWood);
  board.position.set(worktop.position.x + 0.4, worktop.position.y + 0.035, 0.1);
  kitchen.add(board);

  // Center kitchen
  kitchen.position.x = -worktop.position.x;
  kitchen.position.z = 0.2;

  // Camera orbit
  let pointerX = 0, pointerY = 0;
  let targetPointerX = 0, targetPointerY = 0;
  const onMove = (e) => {
    const rect = container.getBoundingClientRect();
    const cx = ('touches' in e ? e.touches[0]?.clientX : e.clientX) ?? 0;
    const cy = ('touches' in e ? e.touches[0]?.clientY : e.clientY) ?? 0;
    targetPointerX = ((cx - rect.left) / rect.width - 0.5);
    targetPointerY = ((cy - rect.top) / rect.height - 0.5);
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let t0 = performance.now();
  let running = true;
  function loop(t) {
    if (!running) return;
    const dt = (t - t0) / 1000;
    t0 = t;
    pointerX += (targetPointerX - pointerX) * 0.04;
    pointerY += (targetPointerY - pointerY) * 0.04;

    const time = t / 1000;
    const radius = 7.2;
    const baseAngle = time * speed * 0.15 + 0.7;
    const px = Math.sin(baseAngle + pointerX * 0.5) * radius;
    const pz = Math.cos(baseAngle + pointerX * 0.5) * radius;
    camera.position.x = px;
    camera.position.z = pz;
    camera.position.y = 3.0 + pointerY * -0.6;
    camera.lookAt(0, 1.15, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    setSpeed(s) { /* allow external control */ /* eslint-disable-line */ },
    destroy() {
      running = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
