import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";

// --- FPS Counter & UI ---
let frameCount = 0;
let lastTime = performance.now();
const fpsSpan = document.getElementById("fpsValue");

// --- Scene Setup: Deep cosmic background ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02000c);
scene.fog = new THREE.FogExp2(0x02000c, 0.00018); // subtle depth fog

// --- Camera: cinematic perspective ---
const camera = new THREE.PerspectiveCamera(
  52,
  window.innerWidth / window.innerHeight,
  0.1,
  2800,
);
camera.position.set(0, 9, 26);
camera.lookAt(0, 0, 0);

// --- Renderer: high-performance with tone mapping ---
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.35;
document.body.appendChild(renderer.domElement);

// --- Controls: smooth orbiting with auto-rotate optional ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.rotateSpeed = 0.9;
controls.enablePan = false; // keep focus on galaxy
controls.target.set(0, 0.5, 0);

// --- Post Processing: Bloom + Film Grain (Cinematic) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.4,
  0.35,
  0.82,
);
bloomPass.threshold = 0.08;
bloomPass.strength = 0.95;
bloomPass.radius = 0.75;
const filmPass = new FilmPass(0.2, 0.45, 2048, false);
filmPass.renderToScreen = true;

const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);
effectComposer.addPass(filmPass);

let bloomActive = true;
window.addEventListener("keydown", (e) => {
  if (e.key === "b" || e.key === "B") {
    bloomActive = !bloomActive;
    if (bloomActive) {
      effectComposer.passes[1] = bloomPass;
    } else {
      // replace bloom with a basic pass (no bloom)
      effectComposer.passes[1] = new RenderPass(scene, camera);
    }
  }
});

// --- Hide loading screen gracefully ---
setTimeout(() => {
  const loader = document.getElementById("loadingScreen");
  if (loader) loader.style.display = "none";
}, 2800);

// ================= 1. CORE STARFIELD (38,400 stars with temperature color) =================
const totalStars = 38400;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(totalStars * 3);
const starCol = new Float32Array(totalStars * 3);

for (let i = 0; i < totalStars; i++) {
  // Elliptical disc distribution for realistic galaxy look
  const radius = 42 + Math.pow(Math.random(), 1.6) * 210;
  const angle = Math.random() * Math.PI * 2;
  const flattening = 0.55;
  const yRange = 1.8 * (1 - Math.abs(radius - 50) / 180);
  const yOffset = (Math.random() - 0.5) * yRange * 1.2;

  const xPos = Math.cos(angle) * radius;
  const zPos = Math.sin(angle) * radius;
  const yPos = yOffset * flattening + Math.sin(radius * 0.35) * 0.3;

  starPos[i * 3] = xPos;
  starPos[i * 3 + 1] = yPos;
  starPos[i * 3 + 2] = zPos;

  // Color based on stellar temperature
  const randTemp = Math.random();
  if (randTemp < 0.55) {
    // G/K type (yellow-white)
    starCol[i * 3] = 1.0;
    starCol[i * 3 + 1] = 0.85 + Math.random() * 0.15;
    starCol[i * 3 + 2] = 0.65 + Math.random() * 0.3;
  } else if (randTemp < 0.8) {
    // Hot blue stars
    starCol[i * 3] = 0.4 + Math.random() * 0.4;
    starCol[i * 3 + 1] = 0.5 + Math.random() * 0.4;
    starCol[i * 3 + 2] = 1.0;
  } else {
    // Red/M-type dwarfs
    starCol[i * 3] = 1.0;
    starCol[i * 3 + 1] = 0.35 + Math.random() * 0.4;
    starCol[i * 3 + 2] = 0.25 + Math.random() * 0.4;
  }
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
const starMaterial = new THREE.PointsMaterial({
  size: 0.16,
  vertexColors: true,
  transparent: true,
  opacity: 0.92,
  blending: THREE.AdditiveBlending,
});
const starField = new THREE.Points(starGeo, starMaterial);
scene.add(starField);

// ================= 2. GALACTIC CORE (Volumetric + Glow layers) =================
const coreSphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.4, 128, 128),
  new THREE.MeshStandardMaterial({
    color: 0xffaa66,
    emissive: 0xff4422,
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.2,
  }),
);
scene.add(coreSphere);

// Multiple glowing halos
const haloConfigs = [
  { radius: 3.0, color: 0xff8844, opacity: 0.4, speed: 1.1 },
  { radius: 4.1, color: 0xff6644, opacity: 0.25, speed: 0.7 },
  { radius: 5.4, color: 0xff4422, opacity: 0.15, speed: 0.4 },
];
const haloMeshes = [];
haloConfigs.forEach((cfg) => {
  const haloGeo = new THREE.SphereGeometry(cfg.radius, 64, 64);
  const haloMat = new THREE.MeshBasicMaterial({
    color: cfg.color,
    transparent: true,
    opacity: cfg.opacity,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);
  haloMeshes.push({ mesh: halo, speed: cfg.speed });
});

// Accretion Disc (dense particle ring)
const discParticleCount = 9500;
const discGeo = new THREE.BufferGeometry();
const discPositions = new Float32Array(discParticleCount * 3);
const discColors = new Float32Array(discParticleCount * 3);
for (let i = 0; i < discParticleCount; i++) {
  const rad = 3.2 + Math.random() * 5.2;
  const ang = Math.random() * Math.PI * 2;
  const yOff = (Math.random() - 0.5) * 0.9 * (1 - (rad - 3.2) / 5.5);
  discPositions[i * 3] = Math.cos(ang) * rad;
  discPositions[i * 3 + 1] = yOff;
  discPositions[i * 3 + 2] = Math.sin(ang) * rad;
  discColors[i * 3] = 1.0;
  discColors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
  discColors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
}
discGeo.setAttribute("position", new THREE.BufferAttribute(discPositions, 3));
discGeo.setAttribute("color", new THREE.BufferAttribute(discColors, 3));
const discPointsMat = new THREE.PointsMaterial({
  size: 0.07,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
});
const accretionDisc = new THREE.Points(discGeo, discPointsMat);
scene.add(accretionDisc);

// ================= 3. SPIRAL ARMS (Enhanced with density waves) =================
const armParticleCount = 14000;
const armGeo = new THREE.BufferGeometry();
const armPositionsArray = new Float32Array(armParticleCount * 3);
const armColorsArray = new Float32Array(armParticleCount * 3);
const armCount = 4;
for (let i = 0; i < armParticleCount; i++) {
  const armIdx = Math.floor(Math.random() * armCount);
  const armAngleOffset = (armIdx / armCount) * Math.PI * 2;
  const r = 5.5 + Math.pow(Math.random(), 1.3) * 17.5;
  const spiralAngle = 2.95 * Math.log(r + 1.2) + armAngleOffset;
  const angleNoise = (Math.random() - 0.5) * 0.65 * (r / 9);
  const finalAngle = spiralAngle + angleNoise;
  const x = Math.cos(finalAngle) * r;
  const z = Math.sin(finalAngle) * r;
  const y = Math.sin(r * 1.2) * 0.32 * (Math.random() - 0.5);
  armPositionsArray[i * 3] = x;
  armPositionsArray[i * 3 + 1] = y;
  armPositionsArray[i * 3 + 2] = z;
  const mixFactor = (r - 5) / 18;
  armColorsArray[i * 3] = 0.75 + mixFactor * 0.3;
  armColorsArray[i * 3 + 1] = 0.55 + mixFactor * 0.4;
  armColorsArray[i * 3 + 2] = 0.4 + mixFactor * 0.55;
}
armGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(armPositionsArray, 3),
);
armGeo.setAttribute("color", new THREE.BufferAttribute(armColorsArray, 3));
const armPointsMat = new THREE.PointsMaterial({
  size: 0.085,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
});
const spiralArms = new THREE.Points(armGeo, armPointsMat);
scene.add(spiralArms);

// ================= 4. NEBULA CLOUDS (Procedural + drifting) =================
const createNebulaCanvas = (r1, g1, b1, r2, g2, b2) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rad = Math.random() * 48 + 15;
    const alpha = Math.random() * 0.18;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${alpha})`);
    grad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
};

const nebulaeData = [
  {
    c1: [255, 110, 90],
    c2: [120, 55, 90],
    pos: [-13, 3.5, -17],
    scale: 6.2,
    rotSpeed: 0.0004,
  },
  {
    c1: [90, 130, 255],
    c2: [55, 70, 160],
    pos: [11, -2.5, -19],
    scale: 6.8,
    rotSpeed: 0.0005,
  },
  {
    c1: [170, 90, 220],
    c2: [85, 55, 130],
    pos: [-6, 5.2, -22],
    scale: 5.5,
    rotSpeed: 0.0003,
  },
  {
    c1: [90, 210, 160],
    c2: [45, 110, 90],
    pos: [9, -1.8, -24],
    scale: 6.0,
    rotSpeed: 0.0006,
  },
  {
    c1: [255, 170, 100],
    c2: [160, 90, 60],
    pos: [-11, -3.2, -14],
    scale: 5.3,
    rotSpeed: 0.00045,
  },
  {
    c1: [210, 110, 210],
    c2: [110, 60, 110],
    pos: [7, 4.5, -27],
    scale: 7.0,
    rotSpeed: 0.00035,
  },
  {
    c1: [100, 200, 255],
    c2: [60, 110, 170],
    pos: [-15, 1.5, -12],
    scale: 5.8,
    rotSpeed: 0.0005,
  },
  {
    c1: [255, 100, 140],
    c2: [160, 60, 85],
    pos: [13, -1.2, -16],
    scale: 5.4,
    rotSpeed: 0.0004,
  },
  {
    c1: [200, 140, 90],
    c2: [130, 70, 50],
    pos: [-4, -4.8, -29],
    scale: 6.5,
    rotSpeed: 0.0003,
  },
];

const nebulaPlanes = [];
nebulaeData.forEach((neb) => {
  const tex = createNebulaCanvas(
    neb.c1[0],
    neb.c1[1],
    neb.c1[2],
    neb.c2[0],
    neb.c2[1],
    neb.c2[2],
  );
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(neb.scale, neb.scale),
    mat,
  );
  plane.position.set(neb.pos[0], neb.pos[1], neb.pos[2]);
  scene.add(plane);
  nebulaPlanes.push({ mesh: plane, rotSpeed: neb.rotSpeed });
});

// ================= 5. SHOOTING STARS SYSTEM (Dynamic meteors) =================
class Meteor {
  constructor() {
    this.active = false;
    this.progress = 0;
    this.speedVal = 0.006 + Math.random() * 0.012;
    this.startVec = new THREE.Vector3();
    this.endVec = new THREE.Vector3();
    this.pointsObj = null;
    this.reset();
  }
  reset() {
    this.active = true;
    this.progress = 0;
    const azimuth = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * 0.8;
    const rad = 48;
    this.startVec.set(
      Math.cos(azimuth) * Math.cos(elevation) * rad,
      Math.sin(elevation) * rad * 0.7,
      Math.sin(azimuth) * Math.cos(elevation) * rad,
    );
    this.endVec.set(
      -this.startVec.x * 0.75,
      -this.startVec.y * 0.5,
      -this.startVec.z * 0.75,
    );
    if (this.pointsObj) scene.remove(this.pointsObj);
    const trailLen = 18;
    const trailPos = new Float32Array(trailLen * 3);
    const trailClr = new Float32Array(trailLen * 3);
    for (let i = 0; i < trailLen; i++) {
      trailClr[i * 3] = 1.0;
      trailClr[i * 3 + 1] = 0.7;
      trailClr[i * 3 + 2] = 0.3;
    }
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailClr, 3));
    const meteorMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    this.pointsObj = new THREE.Points(trailGeo, meteorMat);
    scene.add(this.pointsObj);
  }
  update() {
    if (!this.active) {
      if (Math.random() < 0.0018) this.reset();
      return;
    }
    this.progress += this.speedVal;
    if (this.progress >= 1) {
      this.active = false;
      return;
    }
    const currentPos = this.startVec.clone().lerp(this.endVec, this.progress);
    const positionsAttr = this.pointsObj.geometry.attributes.position.array;
    const trailLength = positionsAttr.length / 3;
    for (let i = trailLength - 1; i > 0; i--) {
      positionsAttr[i * 3] = positionsAttr[(i - 1) * 3];
      positionsAttr[i * 3 + 1] = positionsAttr[(i - 1) * 3 + 1];
      positionsAttr[i * 3 + 2] = positionsAttr[(i - 1) * 3 + 2];
    }
    positionsAttr[0] = currentPos.x;
    positionsAttr[1] = currentPos.y;
    positionsAttr[2] = currentPos.z;
    this.pointsObj.geometry.attributes.position.needsUpdate = true;
  }
}

const meteors = Array(11)
  .fill()
  .map(() => new Meteor());

// ================= 6. ADVANCED LIGHTING & DUST =================
const ambientLight = new THREE.AmbientLight(0x111130);
scene.add(ambientLight);
const coreLight = new THREE.PointLight(0xff6633, 1.7, 70);
coreLight.position.set(0, 0.5, 0);
scene.add(coreLight);
const secondaryLight = new THREE.PointLight(0x4488ff, 0.55);
secondaryLight.position.set(6, 4, 5);
scene.add(secondaryLight);
const rimLight = new THREE.PointLight(0xffaa77, 0.45);
rimLight.position.set(-5, 3, -9);
scene.add(rimLight);

// Glow rays (volumetric light spikes)
const rayParticles = 450;
const rayPointsGeo = new THREE.BufferGeometry();
const rayPosArray = new Float32Array(rayParticles * 3);
for (let i = 0; i < rayParticles; i++) {
  const ang = Math.random() * Math.PI * 2;
  const rad = 5.5 + Math.random() * 4;
  rayPosArray[i * 3] = Math.cos(ang) * rad;
  rayPosArray[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
  rayPosArray[i * 3 + 2] = Math.sin(ang) * rad;
}
rayPointsGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(rayPosArray, 3),
);
const rayGlowMat = new THREE.PointsMaterial({
  color: 0xff8844,
  size: 0.055,
  blending: THREE.AdditiveBlending,
});
const lightRaysObj = new THREE.Points(rayPointsGeo, rayGlowMat);
scene.add(lightRaysObj);

// Floating cosmic dust
const dustTotal = 7200;
const dustGeoObj = new THREE.BufferGeometry();
const dustPositionsArray = new Float32Array(dustTotal * 3);
for (let i = 0; i < dustTotal; i++) {
  dustPositionsArray[i * 3] = (Math.random() - 0.5) * 95;
  dustPositionsArray[i * 3 + 1] = (Math.random() - 0.5) * 40;
  dustPositionsArray[i * 3 + 2] = (Math.random() - 0.5) * 95;
}
dustGeoObj.setAttribute(
  "position",
  new THREE.BufferAttribute(dustPositionsArray, 3),
);
const dustMat = new THREE.PointsMaterial({
  color: 0x88aaff,
  size: 0.032,
  transparent: true,
  opacity: 0.28,
  blending: THREE.AdditiveBlending,
});
const cosmicDust = new THREE.Points(dustGeoObj, dustMat);
scene.add(cosmicDust);

// ================= ANIMATION & ORBIT LOOP =================
let globalTime = 0;

function animateScene() {
  requestAnimationFrame(animateScene);
  globalTime += 0.013;

  // FPS Calculation
  const nowPerf = performance.now();
  frameCount++;
  if (nowPerf - lastTime >= 1000) {
    fpsSpan.textContent = frameCount;
    frameCount = 0;
    lastTime = nowPerf;
  }

  // Core pulsation & lighting dynamics
  coreSphere.material.emissiveIntensity =
    1.2 + Math.sin(globalTime * 2.4) * 0.7;
  coreLight.intensity = 1.3 + Math.sin(globalTime * 2.7) * 0.7;

  // Halo rotation
  haloMeshes.forEach((h) => {
    h.mesh.rotation.y += 0.0018 * h.speed;
    h.mesh.rotation.x += 0.0012 * h.speed;
  });

  // Galactic rotation
  spiralArms.rotation.y += 0.0012;
  accretionDisc.rotation.y += 0.0024;
  starField.rotation.y += 0.00025;
  starField.rotation.x = Math.sin(globalTime * 0.08) * 0.03;
  cosmicDust.rotation.y += 0.00015;

  // Nebulae gentle drift & rotation
  nebulaPlanes.forEach((neb) => {
    neb.mesh.rotation.z += neb.rotSpeed;
    neb.mesh.rotation.y += 0.00025;
  });

  // Light rays animation
  lightRaysObj.rotation.y += 0.0035;
  lightRaysObj.rotation.x = Math.sin(globalTime * 0.65) * 0.12;

  // Shooting stars update
  meteors.forEach((met) => met.update());

  // Auto-rotate controls
  controls.update();

  // Render via EffectComposer
  effectComposer.render();
}

animateScene();

// --- Resize handler ---
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  effectComposer.setSize(width, height);
}

// Small star counter update (display)
document.getElementById("starCountDisplay").innerText =
  totalStars.toLocaleString();
console.log(
  "✨ Milky Way Core Engine Active | Bloom Toggle [B] | Meteor System Online",
);
