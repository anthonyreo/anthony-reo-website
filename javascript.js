// Intro animation logic
window.addEventListener('load', () => {
  const intro = document.querySelector('.intro');

  // Wait for 2.5 seconds, then hide the intro
  setTimeout(() => {
    intro.classList.add('hide');
  }, 2500); // 2500 ms = 2.5 seconds
});

// javascript.js
(() => {
  // Grab container
  const container = document.getElementById('three-container');
  if (!container) return;

  // Creates a Three.js scene + camera + renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  // Parameters (tweak these)
  const PARTICLE_COUNT = 2500;
  const AREA = 3;        // spread of particles
  const PARTICLE_SIZE = 0.018;
  const ROTATION_SPEED = .3; // lower = slower
  const BREATH_SPEED = 1;
  const COLOR = 0x000000;
  const OPACITY = 1;

  // Geometry + material for particles
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    // distribute in a slightly flattened sphere / box
    const x = (Math.random() - 0.5) * AREA;
    const y = (Math.random() - 0.4) * (AREA * 0.45); // a bit flatter
    const z = (Math.random() - 0.5) * AREA * 0.8;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    basePositions[idx] = x;
    basePositions[idx + 1] = y;
    basePositions[idx + 2] = z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    map: generateDiscTexture(), // subtle round particle
    alphaTest: 0.01,
    transparent: true,
    opacity: OPACITY,
    depthWrite: false,
    color: COLOR,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // small group to rotate the points as a whole
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // Resize handler
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });

  // Animation loop
  const posAttr = geometry.getAttribute('position');

  let clockStart = performance.now();
  function animate(now) {
    const t = (now - clockStart) / 1000;

    // rotate whole group slowly
    group.rotation.y = Math.sin(t * ROTATION_SPEED) * 0.15;
    group.rotation.x = Math.cos(t * ROTATION_SPEED * 0.7) * 0.07;

    // gentle breathing — move each particle a little based on its base position
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // small offset using sin of time + particle index for variety
      const off = Math.sin(t * BREATH_SPEED + i * 0.12) * 0.015;
      posAttr.array[idx] = basePositions[idx] * (1 + off);
      posAttr.array[idx + 1] = basePositions[idx + 1] * (1 + off * 0.6);
      posAttr.array[idx + 2] = basePositions[idx + 2] * (1 + off);
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  resize();

  // --- Helper: tiny circular texture for points to look soft ---
  function generateDiscTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // radial gradient
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

})();


