import * as THREE from "./vendor/three/three.module.js";
import { OrbitControls } from "./vendor/three/OrbitControls.js";

const FIXED_MONO = {
  a: 1,
  M: 1,
  C: 1,
};

const DEMO_KA = Math.PI / 2;
const SITE_COUNT = 28;
const SITE_SPACING = 0.82;
const BASE_DISPLACEMENT = 0.58;
const TIME_SCALE = 1.45;

const COLORS = {
  monoAtom: 0x3aaef5,
  diAtom1: 0x3aaef5,
  diAtom2: 0xff9d4d,
  monoSpring: 0x1f658f,
  spring1: 0x1f658f,
  spring2: 0x58bfc5,
};

const viewState = {
  branch: "acoustic",
};

const el = {
  model: document.getElementById("model"),
  sidePanelTitle: document.getElementById("sidePanelTitle"),
  monoPanel: document.getElementById("monoPanel"),
  sideFormulaBox: document.getElementById("sideFormulaBox"),
  diM1: document.getElementById("diM1"),
  diM1Range: document.getElementById("diM1Range"),
  diM1Text: document.getElementById("diM1Text"),
  diM2: document.getElementById("diM2"),
  diM2Range: document.getElementById("diM2Range"),
  diM2Text: document.getElementById("diM2Text"),
  diC1: document.getElementById("diC1"),
  diC1Range: document.getElementById("diC1Range"),
  diC1Text: document.getElementById("diC1Text"),
  diC2: document.getElementById("diC2"),
  diC2Range: document.getElementById("diC2Range"),
  diC2Text: document.getElementById("diC2Text"),
  diControls: document.getElementById("diControls"),
  formulaBox: document.getElementById("formulaBox"),
  modeText: document.getElementById("modeText"),
  formulaModeText: document.getElementById("formulaModeText"),
  demoWaveText: document.getElementById("demoWaveText"),
  branchText: document.getElementById("branchText"),
  omegaDemoText: document.getElementById("omegaDemoText"),
  amplitudeRatioText: document.getElementById("amplitudeRatioText"),
  phaseOffsetText: document.getElementById("phaseOffsetText"),
  sceneSubtitle: document.getElementById("sceneSubtitle"),
  legendText: document.getElementById("legendText"),
  branchGroup: document.getElementById("branchGroup"),
  acousticBtn: document.getElementById("acousticBtn"),
  opticalBtn: document.getElementById("opticalBtn"),
  resetBtn: document.getElementById("resetBtn"),
  resetViewBtn: document.getElementById("resetViewBtn"),
  sceneViewport: document.getElementById("sceneViewport"),
};

let scene;
let camera;
let renderer;
let controls;
let clock;

let chainGroup;
let atomMesh;
let springLines;

let baseAtoms = [];
let baseSprings = [];
let currentMotion = null;

const dummy = new THREE.Object3D();

function syncPair(numberEl, rangeEl, textEl) {
  const v = parseFloat(numberEl.value || rangeEl.value || 1).toFixed(1);
  numberEl.value = v;
  rangeEl.value = v;
  textEl.textContent = v;
}

function bindPair(numberEl, rangeEl, textEl, onChange) {
  rangeEl.addEventListener("input", () => {
    numberEl.value = rangeEl.value;
    textEl.textContent = rangeEl.value;
    onChange();
  });

  numberEl.addEventListener("input", () => {
    let v = parseFloat(numberEl.value);
    const min = parseFloat(numberEl.min);
    const max = parseFloat(numberEl.max);

    if (Number.isNaN(v)) {
      v = min;
    }

    if (v < min) {
      v = min;
    }

    if (v > max) {
      v = max;
    }

    v = Math.round(v * 10) / 10;
    numberEl.value = v.toFixed(1);
    rangeEl.value = v.toFixed(1);
    textEl.textContent = v.toFixed(1);
    onChange();
  });
}

function monoOmega(ka, M, C) {
  return 2 * Math.sqrt(C / M) * Math.abs(Math.sin(ka / 2));
}

function diOmegasEqualC(ka, M1, M2, C) {
  const s = (1 / M1) + (1 / M2);
  const d = Math.max(0, s * s - (4 * Math.sin(ka / 2) ** 2) / (M1 * M2));

  const acoustic2 = C * s - C * Math.sqrt(d);
  const optical2 = C * s + C * Math.sqrt(d);

  return {
    acoustic: Math.sqrt(Math.max(0, acoustic2)),
    optical: Math.sqrt(Math.max(0, optical2)),
  };
}

function diOmegasGeneral(ka, M1, M2, C1, C2) {
  const a = (C1 + C2) * (M1 + M2);
  const d = Math.max(
    0,
    a * a - 16 * M1 * M2 * C1 * C2 * Math.sin(ka / 2) ** 2
  );

  const acoustic2 = (a - Math.sqrt(d)) / (2 * M1 * M2);
  const optical2 = (a + Math.sqrt(d)) / (2 * M1 * M2);

  return {
    acoustic: Math.sqrt(Math.max(0, acoustic2)),
    optical: Math.sqrt(Math.max(0, optical2)),
  };
}

function isEqualC(C1, C2) {
  return Math.abs(C1 - C2) < 1e-9;
}

function getParams() {
  return {
    model: el.model.value,
    a: FIXED_MONO.a,
    monoM: FIXED_MONO.M,
    monoC: FIXED_MONO.C,
    diM1: Math.max(0.5, parseFloat(el.diM1.value) || 1),
    diM2: Math.max(0.5, parseFloat(el.diM2.value) || 2),
    diC1: Math.max(0.5, parseFloat(el.diC1.value) || 1),
    diC2: Math.max(0.5, parseFloat(el.diC2.value) || 1),
  };
}

function renderMath(target) {
  if (window.renderMathInElement && target) {
    renderMathInElement(target, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
    });
  }
}

function complexDivideRealByComplex(realNumerator, re, im) {
  const denom = re * re + im * im;

  if (denom < 1e-9) {
    return { re: realNumerator, im: 0 };
  }

  return {
    re: (realNumerator * re) / denom,
    im: (-realNumerator * im) / denom,
  };
}

function getRatioMagnitudePhase(ratio) {
  return {
    magnitude: Math.hypot(ratio.re, ratio.im),
    phase: Math.atan2(ratio.im, ratio.re),
  };
}

function formatPhase(angle) {
  if (Math.abs(angle) < 1e-3) {
    return "0";
  }

  const inPi = angle / Math.PI;
  return `${inPi.toFixed(2)}π`;
}

function getDemoMotion(params) {
  if (params.model === "mono") {
    return {
      model: "mono",
      branch: "mono",
      branchLabel: "单支",
      omega: monoOmega(DEMO_KA, params.monoM, params.monoC),
      ratioMagnitude: 1,
      phaseOffset: 0,
      phaseText: "0",
      monoAmplitude: BASE_DISPLACEMENT,
    };
  }

  const equalSpring = isEqualC(params.diC1, params.diC2);
  const omegaSet = equalSpring
    ? diOmegasEqualC(DEMO_KA, params.diM1, params.diM2, params.diC1)
    : diOmegasGeneral(DEMO_KA, params.diM1, params.diM2, params.diC1, params.diC2);
  const omega = viewState.branch === "acoustic" ? omegaSet.acoustic : omegaSet.optical;

  let ratio;

  if (equalSpring) {
    const numerator = 2 * params.diC1 - params.diM1 * omega * omega;
    const denomRe = params.diC1 * (1 + Math.cos(DEMO_KA));
    const denomIm = -params.diC1 * Math.sin(DEMO_KA);
    ratio = complexDivideRealByComplex(numerator, denomRe, denomIm);
  } else {
    const numerator = params.diC1 + params.diC2 - params.diM1 * omega * omega;
    const denomRe = params.diC1 + params.diC2 * Math.cos(DEMO_KA);
    const denomIm = -params.diC2 * Math.sin(DEMO_KA);
    ratio = complexDivideRealByComplex(numerator, denomRe, denomIm);
  }

  const ratioInfo = getRatioMagnitudePhase(ratio);
  const norm = Math.max(1, ratioInfo.magnitude);

  return {
    model: "di",
    branch: viewState.branch,
    branchLabel: viewState.branch === "acoustic" ? "声学支" : "光学支",
    omega,
    ratioMagnitude: ratioInfo.magnitude,
    phaseOffset: ratioInfo.phase,
    phaseText: formatPhase(ratioInfo.phase),
    uAmplitude: BASE_DISPLACEMENT / norm,
    vAmplitude: BASE_DISPLACEMENT * ratioInfo.magnitude / norm,
  };
}

function updateFormula() {
  const params = getParams();
  const motion = currentMotion || getDemoMotion(params);

  const monoFormula = `
    <div>演示采用固定波矢 \(ka=\\pi/2\) 的一维单原子链横向振动：</div>
    <div class="formula-line">$$u_n(t)=A\\cos(nka-\\omega t)$$</div>
    <div class="formula-line">$$\\omega^2=\\frac{4C}{M}\\sin^2\\frac{ka}{2}$$</div>
    <div class="formula-line">$$\\omega=2\\sqrt{\\frac{C}{M}}\\left|\\sin\\frac{ka}{2}\\right|$$</div>
    <div class="formula-line">$$M=1,\\quad C=1,\\quad a=1$$</div>
  `;

  const monoSideFormula = `
    <div>单原子链沿 x 方向排列，演示中使用标准化参数：</div>
    <div class="formula-line">$$M=1,\\quad C=1,\\quad a=1$$</div>
    <div class="formula-line">$$ka=\\frac{\\pi}{2}$$</div>
    <div class="formula-line">$$u_n(t)=A\\cos\\left(\\frac{\\pi n}{2}-\\omega t\\right)$$</div>
  `;

  const branchLine = `<div>当前演示分支：<strong>${motion.branchLabel}</strong>，固定波矢为 <strong>ka = π/2</strong>。</div>`;
  const ratioLine = `<div>当前参数下的振幅比为 <strong>|v/u| = ${motion.ratioMagnitude.toFixed(3)}</strong>，相位差约为 <strong>${motion.phaseText}</strong>。</div>`;

  el.monoPanel.classList.toggle("hidden", params.model !== "mono");
  el.diControls.classList.toggle("hidden", params.model !== "di");
  el.sidePanelTitle.textContent = params.model === "mono" ? "公式说明" : "参数设置";
  el.modeText.textContent = params.model === "mono" ? "一维单原子链" : "一维双原子链";

  if (params.model === "mono") {
    el.formulaModeText.textContent = "标准化参数（M = 1，C = 1，a = 1）";
    el.sideFormulaBox.innerHTML = monoSideFormula;
    el.formulaBox.innerHTML = monoFormula;
  } else {
    el.sideFormulaBox.innerHTML = "";

    if (isEqualC(params.diC1, params.diC2)) {
      el.formulaModeText.textContent = "等弹簧常数形式（C1 = C2）";
      el.formulaBox.innerHTML = `
        <div>双原子链使用两类质量交替排列，并在右侧显示一维振动动画。</div>
        ${branchLine}
        <div class="formula-line">$$u_s=u\\cos(ska-\\omega t)$$</div>
        <div class="formula-line">$$v_s=v\\cos(ska-\\omega t+\\phi)$$</div>
        <div class="formula-line">$$\\omega^2=C\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right)\\pm C\\sqrt{\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right)^2-\\frac{4\\sin^2(ka/2)}{M_1M_2}}$$</div>
        ${ratioLine}
      `;
    } else {
      el.formulaModeText.textContent = "交替弹簧常数形式（C1 ≠ C2）";
      el.formulaBox.innerHTML = `
        <div>双原子链允许质量与弹簧常数都交替变化，右侧显示对应的一维振动动画。</div>
        ${branchLine}
        <div class="formula-line">$$u_s=u\\cos(ska-\\omega t)$$</div>
        <div class="formula-line">$$v_s=v\\cos(ska-\\omega t+\\phi)$$</div>
        <div class="formula-line">$$\\omega^2=\\frac{(C_1+C_2)(M_1+M_2)\\pm\\sqrt{\\left[(C_1+C_2)(M_1+M_2)\\right]^2-16M_1M_2C_1C_2\\sin^2(ka/2)}}{2M_1M_2}$$</div>
        ${ratioLine}
      `;
    }
  }

  renderMath(el.formulaBox);
  renderMath(el.sideFormulaBox);
}

function updateStatus() {
  const params = getParams();
  const motion = currentMotion || getDemoMotion(params);

  el.demoWaveText.textContent = "ka = π/2";
  el.branchText.textContent = params.model === "mono" ? "单支" : motion.branchLabel;
  el.omegaDemoText.textContent = motion.omega.toFixed(3);
  el.amplitudeRatioText.textContent = motion.ratioMagnitude.toFixed(3);
  el.phaseOffsetText.textContent = motion.phaseText;
}

function updateSceneUi() {
  const params = getParams();
  const motion = currentMotion || getDemoMotion(params);

  el.branchGroup.classList.toggle("hidden", params.model !== "di");
  el.acousticBtn.classList.toggle("active", viewState.branch === "acoustic");
  el.opticalBtn.classList.toggle("active", viewState.branch === "optical");

  if (params.model === "mono") {
    el.sceneSubtitle.textContent = "固定演示波矢为 ka = π/2。拖拽改变观察方向，滚轮或双指可缩放。";
    el.legendText.textContent = "蓝色球表示原子，深蓝连线表示弹簧。拖拽旋转，滚轮或双指缩放。";
  } else {
    el.sceneSubtitle.textContent = `当前显示双原子链${motion.branchLabel}，固定演示波矢为 ka = π/2。`;
    el.legendText.textContent = "蓝色球表示 M1，橙色球表示 M2；深蓝和青色连线分别对应 C1、C2。";
  }
}

function clearChain() {
  if (atomMesh) {
    chainGroup.remove(atomMesh);
    atomMesh.geometry.dispose();
    atomMesh.material.dispose();
    atomMesh = null;
  }

  if (springLines) {
    chainGroup.remove(springLines);
    springLines.geometry.dispose();
    springLines.material.dispose();
    springLines = null;
  }
}

function buildMonoChain() {
  const center = (SITE_COUNT - 1) / 2;

  baseAtoms = [];
  baseSprings = [];

  for (let i = 0; i < SITE_COUNT; i += 1) {
    baseAtoms.push({
      baseX: (i - center) * SITE_SPACING,
      phaseIndex: i - center,
      type: "mono",
      baseScale: 1,
      color: COLORS.monoAtom,
    });

    if (i < SITE_COUNT - 1) {
      baseSprings.push({
        start: i,
        end: i + 1,
        color: COLORS.monoSpring,
      });
    }
  }
}

function buildDiChain(params) {
  const center = (SITE_COUNT - 1) / 2;
  const massMax = Math.max(params.diM1, params.diM2);

  baseAtoms = [];
  baseSprings = [];

  for (let i = 0; i < SITE_COUNT; i += 1) {
    const isFirstType = i % 2 === 0;
    const mass = isFirstType ? params.diM1 : params.diM2;

    baseAtoms.push({
      baseX: (i - center) * SITE_SPACING,
      phaseIndex: Math.floor(i / 2) - (SITE_COUNT / 4 - 0.5),
      type: isFirstType ? "M1" : "M2",
      baseScale: 0.88 + 0.28 * Math.sqrt(mass / massMax),
      color: isFirstType ? COLORS.diAtom1 : COLORS.diAtom2,
    });

    if (i < SITE_COUNT - 1) {
      baseSprings.push({
        start: i,
        end: i + 1,
        color: isFirstType ? COLORS.spring1 : COLORS.spring2,
      });
    }
  }
}

function createAtoms() {
  const geometry = new THREE.SphereGeometry(0.25, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.08,
  });

  atomMesh = new THREE.InstancedMesh(geometry, material, baseAtoms.length);
  atomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  baseAtoms.forEach((atom, index) => {
    atomMesh.setColorAt(index, new THREE.Color(atom.color));
  });

  if (atomMesh.instanceColor) {
    atomMesh.instanceColor.needsUpdate = true;
  }

  chainGroup.add(atomMesh);
}

function createSprings() {
  const positions = new Float32Array(baseSprings.length * 6);
  const colors = new Float32Array(baseSprings.length * 6);

  baseSprings.forEach((spring, index) => {
    const color = new THREE.Color(spring.color);
    const ptr = index * 6;

    colors[ptr] = color.r;
    colors[ptr + 1] = color.g;
    colors[ptr + 2] = color.b;
    colors[ptr + 3] = color.r;
    colors[ptr + 4] = color.g;
    colors[ptr + 5] = color.b;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });

  springLines = new THREE.LineSegments(geometry, material);
  chainGroup.add(springLines);
}

function setDefaultCamera() {
  const chainLength =
    baseAtoms.length > 1
      ? baseAtoms[baseAtoms.length - 1].baseX - baseAtoms[0].baseX
      : 14;
  const distance = Math.max(14, chainLength * 0.78);

  camera.position.set(chainLength * 0.36, chainLength * 0.24, distance);
  controls.target.set(0, 0, 0);
  controls.minDistance = Math.max(6, chainLength * 0.25);
  controls.maxDistance = Math.max(20, chainLength * 1.8);
  camera.lookAt(0, 0, 0);
  controls.update();
  controls.saveState();
}

function rebuildChain() {
  const params = getParams();

  clearChain();

  if (params.model === "mono") {
    buildMonoChain();
  } else {
    buildDiChain(params);
  }

  createAtoms();
  createSprings();
  setDefaultCamera();
  updateChainGeometry(0);
}

function getYDisplacement(atom, timeValue) {
  if (!currentMotion) {
    return 0;
  }

  const basePhase = DEMO_KA * atom.phaseIndex - currentMotion.omega * timeValue * TIME_SCALE;

  if (currentMotion.model === "mono") {
    return currentMotion.monoAmplitude * Math.cos(basePhase);
  }

  if (atom.type === "M1") {
    return currentMotion.uAmplitude * Math.cos(basePhase);
  }

  return currentMotion.vAmplitude * Math.cos(basePhase + currentMotion.phaseOffset);
}

function updateChainGeometry(timeValue) {
  if (!atomMesh || !springLines) {
    return;
  }

  const currentPositions = [];

  baseAtoms.forEach((atom, index) => {
    const y = getYDisplacement(atom, timeValue);
    const pulse = 1 + 0.045 * Math.cos(timeValue * 2.1 + index * 0.18);

    dummy.position.set(atom.baseX, y, 0);
    dummy.scale.setScalar(atom.baseScale * pulse);
    dummy.updateMatrix();

    atomMesh.setMatrixAt(index, dummy.matrix);
    currentPositions.push({ x: atom.baseX, y, z: 0 });
  });

  atomMesh.instanceMatrix.needsUpdate = true;

  const positionArray = springLines.geometry.attributes.position.array;
  let ptr = 0;

  baseSprings.forEach((spring) => {
    const a = currentPositions[spring.start];
    const b = currentPositions[spring.end];

    positionArray[ptr] = a.x;
    positionArray[ptr + 1] = a.y;
    positionArray[ptr + 2] = a.z;
    positionArray[ptr + 3] = b.x;
    positionArray[ptr + 4] = b.y;
    positionArray[ptr + 5] = b.z;
    ptr += 6;
  });

  springLines.geometry.attributes.position.needsUpdate = true;
}

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe7f5ff, 24, 58);

  const width = el.sceneViewport.clientWidth;
  const height = el.sceneViewport.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.touchAction = "none";
  el.sceneViewport.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

  chainGroup = new THREE.Group();
  scene.add(chainGroup);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb8d8ea, 0.85);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
  dirLight.position.set(6, 10, 8);
  scene.add(dirLight);

  const grid = new THREE.GridHelper(34, 34, 0xa8c9df, 0xd7eaf7);
  grid.position.y = -2.6;
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  scene.add(grid);

  const axes = new THREE.AxesHelper(2.6);
  axes.position.set(-11.4, -2.55, -2.1);
  scene.add(axes);

  clock = new THREE.Clock();
}

function onResize() {
  if (!renderer || !camera) {
    return;
  }

  const width = el.sceneViewport.clientWidth;
  const height = el.sceneViewport.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function render() {
  syncPair(el.diM1, el.diM1Range, el.diM1Text);
  syncPair(el.diM2, el.diM2Range, el.diM2Text);
  syncPair(el.diC1, el.diC1Range, el.diC1Text);
  syncPair(el.diC2, el.diC2Range, el.diC2Text);

  currentMotion = getDemoMotion(getParams());
  updateFormula();
  updateStatus();
  updateSceneUi();
  rebuildChain();
}

function resetDefaults() {
  el.model.value = "mono";
  el.diM1.value = "1.0";
  el.diM1Range.value = "1.0";
  el.diM2.value = "2.0";
  el.diM2Range.value = "2.0";
  el.diC1.value = "1.0";
  el.diC1Range.value = "1.0";
  el.diC2.value = "1.0";
  el.diC2Range.value = "1.0";
  viewState.branch = "acoustic";
  render();
}

function bindEvents() {
  bindPair(el.diM1, el.diM1Range, el.diM1Text, render);
  bindPair(el.diM2, el.diM2Range, el.diM2Text, render);
  bindPair(el.diC1, el.diC1Range, el.diC1Text, render);
  bindPair(el.diC2, el.diC2Range, el.diC2Text, render);

  el.model.addEventListener("input", render);
  el.resetBtn.addEventListener("click", resetDefaults);
  el.resetViewBtn.addEventListener("click", () => {
    controls.reset();
  });

  el.acousticBtn.addEventListener("click", () => {
    viewState.branch = "acoustic";
    render();
  });

  el.opticalBtn.addEventListener("click", () => {
    viewState.branch = "optical";
    render();
  });

  window.addEventListener("resize", onResize);
  window.addEventListener("load", () => {
    updateFormula();
  });
}

function animate() {
  requestAnimationFrame(animate);

  const timeValue = clock.getElapsedTime();
  updateChainGeometry(timeValue);
  controls.update();
  renderer.render(scene, camera);
}

function boot() {
  initScene();
  bindEvents();
  render();
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
