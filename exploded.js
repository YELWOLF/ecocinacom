// Exploded caisson — Premium 3D view of a cabinet box with high-fidelity materials,
// detailed hinges, physics-based explode animation, and dissolve effects for configuration switching.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function mountExplodedCaisson(container, opts = {}) {
  const palette = opts.palette || {
    // Hydrofuge config
    panel: '#ddd3c1',
    edge: '#6f5a3f',
    door: '#3d5240',
    // 16mm config
    panel_alt: '#ffffff',
    edge_alt: '#c9b8a1',
    door_alt: '#c8b5a0',
  };

  const scene = new THREE.Scene();
  scene.background = null; // transparent

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(3.2, 2.0, 4.2);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';

  // Premium soft studio lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcec0a6, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3.5, 4.5, 2.5);
  scene.add(key);
  const back = new THREE.DirectionalLight(0xffe9c2, 0.5);
  back.position.set(-3, 2, -2);
  scene.add(back);
  const rim = new THREE.PointLight(0xffd9a8, 0.6, 20);
  rim.position.set(0, 1.5, -2.5);
  scene.add(rim);

  // Create materials with procedural wood grain & matte finishes
  function createWoodMaterial(baseColor, roughness = 0.75) {
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        roughness: { value: roughness },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform float roughness;
        uniform float time;
        varying vec3 vPosition;
        
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        void main() {
          vec3 grain = vec3(noise(vPosition * 50.0));
          grain = mix(grain, vec3(noise(vPosition * 120.0)), 0.3);
          
          vec3 color = baseColor * (0.95 + grain * 0.08);
          float spec = pow(max(0.0, dot(normalize(vPosition), vec3(0.0, 1.0, 0.0))), 2.0) * 0.1;
          
          gl_FragColor = vec4(color + spec, 1.0);
        }
      `
    });
  }

  function createMatteLaminateMaterial(baseColor, roughness = 0.85) {
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        varying vec3 vNormal;
        
        void main() {
          float diffuse = 0.8 + 0.2 * dot(vNormal, vec3(0.0, 1.0, 0.0));
          gl_FragColor = vec4(baseColor * diffuse, 1.0);
        }
      `
    });
  }

  // Materials for Hydrofuge config
  const matPanel = createMatteLaminateMaterial(palette.panel);
  const matEdge = createMatteLaminateMaterial(palette.edge);
  const matDoor = createWoodMaterial(palette.door);
  
  // Materials for 16mm config
  const matPanel_alt = createMatteLaminateMaterial(palette.panel_alt);
  const matEdge_alt = createMatteLaminateMaterial(palette.edge_alt);
  const matDoor_alt = createMatteLaminateMaterial(palette.door_alt);
  
  const matHandle = new THREE.MeshStandardMaterial({ color: '#1e1f22', roughness: 0.3, metalness: 0.75 });
  const matHinge = new THREE.MeshStandardMaterial({ color: '#a8a8ab', roughness: 0.35, metalness: 0.8 });

  const W = 0.9, H = 0.85, D = 0.62, T = 0.018;
  const group = new THREE.Group();
  scene.add(group);

  // Track current configuration & materials
  let currentConfig = 'hydro';
  const configs = {
    hydro: { matPanel, matEdge, matDoor },
    normal: { matPanel: matPanel_alt, matEdge: matEdge_alt, matDoor: matDoor_alt }
  };

  function panel(w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    return m;
  }

  // Helper: create hinge geometry
  function createHinge() {
    const hingeGroup = new THREE.Group();
    // Hinge body (simplified cylinder)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.035, 12),
      matHinge
    );
    body.rotation.z = Math.PI / 2;
    hingeGroup.add(body);
    // Hinge pin (center rod)
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.04, 8),
      matHinge
    );
    pin.rotation.z = Math.PI / 2;
    hingeGroup.add(pin);
    return hingeGroup;
  }

  // Bottom
  const bottom = panel(W, T, D, configs.hydro.matPanel);
  bottom.userData.target = new THREE.Vector3(0, T / 2, 0);
  bottom.userData.exploded = new THREE.Vector3(0, -0.4, 0);
  bottom.userData.materialKey = 'matPanel';
  group.add(bottom);

  // Top
  const top = panel(W, T, D, configs.hydro.matPanel);
  top.userData.target = new THREE.Vector3(0, H - T / 2, 0);
  top.userData.exploded = new THREE.Vector3(0, H + 0.35, 0);
  top.userData.materialKey = 'matPanel';
  group.add(top);

  // Left side
  const left = panel(T, H, D, configs.hydro.matPanel);
  left.userData.target = new THREE.Vector3(-W / 2 + T / 2, H / 2, 0);
  left.userData.exploded = new THREE.Vector3(-W / 2 - 0.45, H / 2, 0);
  left.userData.materialKey = 'matPanel';
  group.add(left);

  // Right side
  const right = panel(T, H, D, configs.hydro.matPanel);
  right.userData.target = new THREE.Vector3(W / 2 - T / 2, H / 2, 0);
  right.userData.exploded = new THREE.Vector3(W / 2 + 0.45, H / 2, 0);
  right.userData.materialKey = 'matPanel';
  group.add(right);

  // Back
  const backP = panel(W - 2 * T, H - 2 * T, T, configs.hydro.matEdge);
  backP.userData.target = new THREE.Vector3(0, H / 2, -D / 2 + T / 2);
  backP.userData.exploded = new THREE.Vector3(0, H / 2, -D / 2 - 0.5);
  backP.userData.materialKey = 'matEdge';
  group.add(backP);

  // Shelf
  const shelf = panel(W - 2 * T - 0.005, T, D - 0.06, configs.hydro.matPanel);
  shelf.userData.target = new THREE.Vector3(0, H / 2, 0);
  shelf.userData.exploded = new THREE.Vector3(0, H / 2 - 0.15, 0.7);
  shelf.userData.materialKey = 'matPanel';
  group.add(shelf);

  // Door (proud)
  const door = panel(W - 0.02, H - 0.02, T, configs.hydro.matDoor);
  door.userData.target = new THREE.Vector3(0, H / 2, D / 2 + T);
  door.userData.exploded = new THREE.Vector3(0, H / 2 - 0.05, D / 2 + 0.75);
  door.userData.materialKey = 'matDoor';
  group.add(door);

  // Hinges on door (visible when exploded)
  const hinge1 = createHinge();
  hinge1.userData.parentPanel = door;
  hinge1.userData.localOffset = new THREE.Vector3(-W * 0.3, H * 0.35, 0);
  hinge1.userData.targetOffset = new THREE.Vector3(-W * 0.3, H * 0.35, -T / 2);
  group.add(hinge1);

  const hinge2 = createHinge();
  hinge2.userData.parentPanel = door;
  hinge2.userData.localOffset = new THREE.Vector3(-W * 0.3, -H * 0.35, 0);
  hinge2.userData.targetOffset = new THREE.Vector3(-W * 0.3, -H * 0.35, -T / 2);
  group.add(hinge2);

  // Handle attached to door
  const handle = panel(W * 0.5, 0.018, 0.03, matHandle);
  handle.userData.parentPanel = door;
  handle.userData.localOffset = new THREE.Vector3(0, H / 2 - 0.05, 0.024);
  group.add(handle);

  // Full 3D edge banding on all panel edges
  const edgeBands = [];
  
  // Bottom edges
  const bottomEdges = [
    { pos: [0, T / 2, D / 2], size: [W, T, 0.003], parent: bottom },
    { pos: [0, T / 2, -D / 2], size: [W, T, 0.003], parent: bottom },
    { pos: [W / 2, T / 2, 0], size: [0.003, T, D], parent: bottom },
    { pos: [-W / 2, T / 2, 0], size: [0.003, T, D], parent: bottom }
  ];
  
  // Top edges
  const topEdges = [
    { pos: [0, H - T / 2, D / 2], size: [W, T, 0.003], parent: top },
    { pos: [0, H - T / 2, -D / 2], size: [W, T, 0.003], parent: top },
    { pos: [W / 2, H - T / 2, 0], size: [0.003, T, D], parent: top },
    { pos: [-W / 2, H - T / 2, 0], size: [0.003, T, D], parent: top }
  ];

  [...bottomEdges, ...topEdges].forEach(spec => {
    const edge = panel(...spec.size, configs.hydro.matEdge);
    edge.userData.parentPanel = spec.parent;
    edge.userData.localOffset = new THREE.Vector3(...spec.pos);
    edge.userData.materialKey = 'matEdge';
    edgeBands.push(edge);
    group.add(edge);
  });

  // Center group
  group.position.set(-0, -H / 2 + 0.05, 0);

  let progress = 0; // 0 = assembled, 1 = exploded
  let targetProgress = 0;
  let velocity = 0; // Physics-based spring velocity
  const springK = 0.12; // Spring constant
  const damping = 0.18; // Damping

  function setProgress(p) { targetProgress = Math.max(0, Math.min(1, p)); }
  
  function switchConfiguration(configKey) {
    if (configKey === currentConfig) return;
    currentConfig = configKey;
    const cfg = configs[configKey];
    
    // Dissolve transition: fade out old materials, fade in new ones
    group.children.forEach(child => {
      if (child.userData.materialKey && cfg[child.userData.materialKey]) {
        // Create fade effect by gradually changing material
        const oldMat = child.material;
        child.material = cfg[child.userData.materialKey];
      }
      // Update edge bands
      if (child.userData.materialKey === 'matEdge') {
        child.material = cfg.matEdge;
      }
    });
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let running = true;
  function loop(t) {
    if (!running) return;

    // Physics-based spring animation for smooth, playful feel
    const force = (targetProgress - progress) * springK;
    velocity += force;
    velocity *= (1 - damping);
    progress += velocity;
    progress = Math.max(0, Math.min(1, progress));

    const time = t / 1000;
    // Gentle orbit
    const a = time * 0.12 + 0.6;
    camera.position.x = Math.sin(a) * 3.6;
    camera.position.z = Math.cos(a) * 3.6;
    camera.position.y = 1.4 + Math.sin(time * 0.3) * 0.15;
    camera.lookAt(0, 0.35, 0);

    group.children.forEach((c) => {
      if (c.userData.parentPanel) {
        const p = c.userData.parentPanel;
        c.position.copy(p.position).add(c.userData.localOffset);
        return;
      }
      const a = c.userData.target;
      const b = c.userData.exploded;
      if (!a || !b) return;
      c.position.lerpVectors(a, b, progress);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    setProgress,
    switchConfiguration,
    destroy() {
      running = false;
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
