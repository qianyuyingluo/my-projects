const FIXED_MONO = {
  a: 1,
  M: 1,
  C: 1,
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
  omegaMonoText: document.getElementById("omegaMonoText"),
  omegaAcousticText: document.getElementById("omegaAcousticText"),
  omegaOpticalText: document.getElementById("omegaOpticalText"),
  resetBtn: document.getElementById("resetBtn"),
  legendText: document.getElementById("legendText"),
  dispersionCanvas: document.getElementById("dispersionCanvas"),
};

const dctx = el.dispersionCanvas.getContext("2d");

function resizeCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(300, Math.floor(rect.width * dpr));
  const h = Math.max(220, Math.floor(rect.height * dpr));

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

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
    if (isNaN(v)) v = min;
    if (v < min) v = min;
    if (v > max) v = max;
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
  const D = Math.max(
    0,
    s * s - (4 * Math.sin(ka / 2) ** 2) / (M1 * M2)
  );

  const wa2 = C * s - C * Math.sqrt(D);
  const wo2 = C * s + C * Math.sqrt(D);

  return {
    acoustic: Math.sqrt(Math.max(0, wa2)),
    optical: Math.sqrt(Math.max(0, wo2)),
  };
}

function diOmegasGeneral(ka, M1, M2, C1, C2) {
  const A = (C1 + C2) * (M1 + M2);
  const D = Math.max(
    0,
    A * A - 16 * M1 * M2 * C1 * C2 * Math.sin(ka / 2) ** 2
  );

  const wa2 = (A - Math.sqrt(D)) / (2 * M1 * M2);
  const wo2 = (A + Math.sqrt(D)) / (2 * M1 * M2);

  return {
    acoustic: Math.sqrt(Math.max(0, wa2)),
    optical: Math.sqrt(Math.max(0, wo2)),
  };
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

function isEqualC(C1, C2) {
  return Math.abs(C1 - C2) < 1e-9;
}

function renderMath(target) {
  if (window.renderMathInElement && target) {
    renderMathInElement(target, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false }
      ]
    });
  }
}

function updateFormula() {
  const p = getParams();
  const monoFormula = `
    <div>一维单原子链最近邻近似下：</div>
    <div class="formula-line">$$\\omega^2=\\frac{4C}{M}\\sin^2\\frac{ka}{2}$$</div>
    <div class="formula-line">$$\\omega=2\\sqrt{\\frac{C}{M}}\\left|\\sin\\frac{ka}{2}\\right|$$</div>
    <div class="formula-line">$$-\\frac{\\pi}{a}\\le k\\le\\frac{\\pi}{a}$$</div>
  `;
  const monoSideFormula = `
    <div>单原子链固定采用标准化参数：</div>
    <div class="formula-line">$$M=1,\\quad C=1,\\quad a=1$$</div>
    <div class="formula-line">$$\\omega=2\\left|\\sin\\frac{ka}{2}\\right|$$</div>
    <div class="formula-line">$$-\\pi\\le k\\le\\pi$$</div>
  `;

  el.monoPanel.classList.toggle("hidden", p.model !== "mono");
  el.diControls.classList.toggle("hidden", p.model !== "di");
  el.sidePanelTitle.textContent = p.model === "mono" ? "公式说明" : "参数设置";
  el.modeText.textContent = p.model === "mono" ? "一维单原子链" : "一维双原子链";

  if (p.model === "mono") {
    el.formulaModeText.textContent = "标准化参数（M = 1, C = 1, a = 1）";
    el.sideFormulaBox.innerHTML = monoSideFormula;
    el.formulaBox.innerHTML = monoFormula;
    el.legendText.textContent = "蓝色曲线：单原子链色散关系";
  } else {
    el.sideFormulaBox.innerHTML = "";

    if (isEqualC(p.diC1, p.diC2)) {
      el.formulaModeText.textContent = "课件标准形式（C₁ = C₂）";
      el.formulaBox.innerHTML = `
        <div>一维双原子链：</div>
        <div class="formula-line">$$M_1\\ddot{u}_s=C(v_s+v_{s-1}-2u_s)$$</div>
        <div class="formula-line">$$M_2\\ddot{v}_s=C(u_{s+1}+u_s-2v_s)$$</div>
        <div class="formula-line">$$u_s=u e^{i(ska-\\omega t)}$$</div>
        <div class="formula-line">$$v_s=v e^{i(ska-\\omega t)}$$</div>
        <div class="formula-line">$$\\omega^2=C\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right)\\pm C\\left[\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right)^2-\\frac{4\\sin^2(ka/2)}{M_1M_2}\\right]^{1/2}$$</div>
      `;
    } else {
      el.formulaModeText.textContent = "交替力常数形式（C₁ ≠ C₂）";
      el.formulaBox.innerHTML = `
        <div>允许两种质量与两种交替力常数：</div>
        <div class="formula-line">$$M_1\\ddot{u}_s=C(v_s+v_{s-1}-2u_s)$$</div>
        <div class="formula-line">$$M_2\\ddot{v}_s=C(u_{s+1}+u_s-2v_s)$$</div>
        <div class="formula-line">$$u_s=u e^{i(ska-\\omega t)}$$</div>
        <div class="formula-line">$$v_s=v e^{i(ska-\\omega t)}$$</div>
        <div class="formula-line">$$\\omega^2=\\frac{(C_1+C_2)(M_1+M_2)\\pm\\sqrt{\\left[(C_1+C_2)(M_1+M_2)\\right]^2-16M_1M_2C_1C_2\\sin^2(ka/2)}}{2M_1M_2}$$</div>
      `;
    }

    el.legendText.textContent = "蓝色曲线：声学支；红色曲线：光学支";
  }

  renderMath(el.formulaBox);
  renderMath(el.sideFormulaBox);
}

function updateStatus() {
  const p = getParams();

  const monoMax = monoOmega(Math.PI, p.monoM, p.monoC);
  el.omegaMonoText.textContent = monoMax.toFixed(3);

  if (p.model === "di") {
    let acMax = 0;
    let opMax = 0;
    const n = 1000;

    for (let i = 0; i <= n; i++) {
      const ka = -Math.PI + 2 * Math.PI * i / n;
      const r = isEqualC(p.diC1, p.diC2)
        ? diOmegasEqualC(ka, p.diM1, p.diM2, p.diC1)
        : diOmegasGeneral(ka, p.diM1, p.diM2, p.diC1, p.diC2);

      acMax = Math.max(acMax, r.acoustic);
      opMax = Math.max(opMax, r.optical);
    }

    el.omegaAcousticText.textContent = acMax.toFixed(3);
    el.omegaOpticalText.textContent = opMax.toFixed(3);
  } else {
    el.omegaAcousticText.textContent = "—";
    el.omegaOpticalText.textContent = "—";
  }
}

function drawAxes(ctx, canvas, xMin, xMax, yMin, yMax, xLabel, yLabel) {
  resizeCanvas(canvas, ctx);

  const w = canvas.width;
  const h = canvas.height;
  const m = { left: 92, right: 56, top: 44, bottom: 72 };

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const X = x => m.left + (x - xMin) / (xMax - xMin) * (w - m.left - m.right);
  const Y = y => h - m.bottom - (y - yMin) / (yMax - yMin) * (h - m.top - m.bottom);

  ctx.strokeStyle = "#e2f3fd";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 6; i++) {
    const y = m.top + i * (h - m.top - m.bottom) / 6;
    ctx.beginPath();
    ctx.moveTo(m.left, y);
    ctx.lineTo(w - m.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 8; i++) {
    const x = m.left + i * (w - m.left - m.right) / 8;
    ctx.beginPath();
    ctx.moveTo(x, m.top);
    ctx.lineTo(x, h - m.bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = "#17324a";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(m.left, h - m.bottom);
  ctx.lineTo(w - m.right, h - m.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(m.left, m.top);
  ctx.lineTo(m.left, h - m.bottom);
  ctx.stroke();

  ctx.fillStyle = "#17324a";
  ctx.font = `${Math.max(12, Math.floor(w / 60))}px Arial`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(yLabel, 16, 10);
  ctx.textAlign = "right";
  ctx.fillText(xLabel, w - 14, h - m.bottom + 30);

  const ticks = [
    { v: xMin, t: "-π/a" },
    { v: xMin / 2, t: "-π/2a" },
    { v: 0, t: "0" },
    { v: xMax / 2, t: "π/2a" },
    { v: xMax, t: "π/a" }
  ];

  ctx.font = `${Math.max(11, Math.floor(w / 74))}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ticks.forEach(item => {
    const x = X(item.v);
    ctx.beginPath();
    ctx.moveTo(x, h - m.bottom);
    ctx.lineTo(x, h - m.bottom + 6);
    ctx.stroke();
    ctx.fillText(item.t, x, h - m.bottom + 10);
  });

  return { X, Y };
}

function drawDispersion() {
  const p = getParams();
  const kMin = -Math.PI / p.a;
  const kMax = Math.PI / p.a;
  const n = 900;

  let yMax = 1.0;

  if (p.model === "mono") {
    yMax = monoOmega(Math.PI, p.monoM, p.monoC) * 1.15;
  } else {
    let maxW = 0;
    for (let i = 0; i <= n; i++) {
      const ka = -Math.PI + 2 * Math.PI * i / n;
      const r = isEqualC(p.diC1, p.diC2)
        ? diOmegasEqualC(ka, p.diM1, p.diM2, p.diC1)
        : diOmegasGeneral(ka, p.diM1, p.diM2, p.diC1, p.diC2);

      maxW = Math.max(maxW, r.acoustic, r.optical);
    }
    yMax = maxW * 1.15;
  }

  const { X, Y } = drawAxes(
    dctx,
    el.dispersionCanvas,
    kMin,
    kMax,
    0,
    yMax,
    "k",
    "ω"
  );

  if (p.model === "mono") {
    dctx.strokeStyle = "#3aaef5";
    dctx.lineWidth = 3;
    dctx.beginPath();

    for (let i = 0; i <= n; i++) {
      const k = kMin + (kMax - kMin) * i / n;
      const ka = k * p.a;
      const w = monoOmega(ka, p.monoM, p.monoC);

      if (i === 0) {
        dctx.moveTo(X(k), Y(w));
      } else {
        dctx.lineTo(X(k), Y(w));
      }
    }

    dctx.stroke();
  } else {
    dctx.strokeStyle = "#3aaef5";
    dctx.lineWidth = 3;
    dctx.beginPath();

    for (let i = 0; i <= n; i++) {
      const k = kMin + (kMax - kMin) * i / n;
      const ka = k * p.a;
      const r = isEqualC(p.diC1, p.diC2)
        ? diOmegasEqualC(ka, p.diM1, p.diM2, p.diC1)
        : diOmegasGeneral(ka, p.diM1, p.diM2, p.diC1, p.diC2);

      if (i === 0) {
        dctx.moveTo(X(k), Y(r.acoustic));
      } else {
        dctx.lineTo(X(k), Y(r.acoustic));
      }
    }

    dctx.stroke();

    dctx.strokeStyle = "#dc2626";
    dctx.beginPath();

    for (let i = 0; i <= n; i++) {
      const k = kMin + (kMax - kMin) * i / n;
      const ka = k * p.a;
      const r = isEqualC(p.diC1, p.diC2)
        ? diOmegasEqualC(ka, p.diM1, p.diM2, p.diC1)
        : diOmegasGeneral(ka, p.diM1, p.diM2, p.diC1, p.diC2);

      if (i === 0) {
        dctx.moveTo(X(k), Y(r.optical));
      } else {
        dctx.lineTo(X(k), Y(r.optical));
      }
    }

    dctx.stroke();
  }
}

function render() {
  syncPair(el.diM1, el.diM1Range, el.diM1Text);
  syncPair(el.diM2, el.diM2Range, el.diM2Text);
  syncPair(el.diC1, el.diC1Range, el.diC1Text);
  syncPair(el.diC2, el.diC2Range, el.diC2Text);

  updateFormula();
  updateStatus();
  drawDispersion();
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
  render();
}

bindPair(el.diM1, el.diM1Range, el.diM1Text, render);
bindPair(el.diM2, el.diM2Range, el.diM2Text, render);
bindPair(el.diC1, el.diC1Range, el.diC1Text, render);
bindPair(el.diC2, el.diC2Range, el.diC2Text, render);

el.model.addEventListener("input", render);
el.resetBtn.addEventListener("click", resetDefaults);
window.addEventListener("resize", render);

function boot() {
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
