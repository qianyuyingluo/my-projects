const el = {
  thetaE: document.getElementById("thetaE"),
  thetaERange: document.getElementById("thetaERange"),
  thetaEText: document.getElementById("thetaEText"),

  thetaD: document.getElementById("thetaD"),
  thetaDRange: document.getElementById("thetaDRange"),
  thetaDText: document.getElementById("thetaDText"),

  tMax: document.getElementById("tMax"),
  tMaxRange: document.getElementById("tMaxRange"),
  tMaxText: document.getElementById("tMaxText"),

  einHighText: document.getElementById("einHighText"),
  debHighText: document.getElementById("debHighText"),
  formulaBox: document.getElementById("formulaBox"),

  resetBtn: document.getElementById("resetBtn"),
  heatCanvas: document.getElementById("heatCanvas"),
};

const hctx = el.heatCanvas.getContext("2d");

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
  const v = parseFloat(numberEl.value || rangeEl.value || 1);
  const txt = Number.isInteger(v) ? String(v) : v.toFixed(1);
  numberEl.value = txt;
  rangeEl.value = txt;
  textEl.textContent = txt;
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

    const step = parseFloat(numberEl.step || "1");
    v = Math.round(v / step) * step;

    const txt = step >= 1 ? String(Math.round(v)) : v.toFixed(1);
    numberEl.value = txt;
    rangeEl.value = txt;
    textEl.textContent = txt;
    onChange();
  });
}

function einsteinReducedCv(T, thetaE) {
  const x = thetaE / T;
  const ex = Math.exp(x);
  return (x * x * ex) / ((ex - 1) * (ex - 1));
}

function debyeIntegrand(x) {
  const ex = Math.exp(x);
  const den = ex - 1;
  if (den === 0) return 0;
  return (x ** 4) * ex / (den * den);
}

function debyeReducedCv(T, thetaD) {
  const upper = thetaD / T;
  if (upper < 1e-6) return 1;

  const n = 500;
  const h = upper / n;
  let sum = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * h;
    const fx = debyeIntegrand(x);
    if (i === 0 || i === n) sum += fx;
    else if (i % 2 === 0) sum += 2 * fx;
    else sum += 4 * fx;
  }

  const integral = (h / 3) * sum;
  return 3 * Math.pow(T / thetaD, 3) * integral;
}

function getParams() {
  return {
    thetaE: Math.max(50, parseFloat(el.thetaE.value) || 200),
    thetaD: Math.max(50, parseFloat(el.thetaD.value) || 200),
    tMax: Math.max(100, parseFloat(el.tMax.value) || 600),
  };
}

function renderMath() {
  if (window.renderMathInElement) {
    renderMathInElement(el.formulaBox, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false }
      ]
    });
  }
}

function updateStatus() {
  const p = getParams();
  el.einHighText.textContent = einsteinReducedCv(p.tMax, p.thetaE).toFixed(3);
  el.debHighText.textContent = debyeReducedCv(p.tMax, p.thetaD).toFixed(3);
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

  return { X, Y, w, h, m };
}

function drawHeatCompare() {
  const p = getParams();
  const TMin = 1;
  const TMax = p.tMax;
  const xMax = TMax / p.thetaD;
  const n = 700;

  let yMax = 1.05;
  for (let i = 0; i <= n; i++) {
    const T = TMin + (TMax - TMin) * i / n;
    const ce = einsteinReducedCv(T, p.thetaE);
    const cd = debyeReducedCv(T, p.thetaD);
    yMax = Math.max(yMax, ce, cd);
  }
  yMax *= 1.05;

  const { X, Y, h, m } = drawAxes(
    hctx,
    el.heatCanvas,
    0,
    xMax,
    0,
    yMax,
    "T/ΘD",
    "Cv/3Nk"
  );

  const xticks = 5;
  hctx.font = `${Math.max(11, Math.floor(el.heatCanvas.width / 74))}px Arial`;
  hctx.textAlign = "center";
  hctx.textBaseline = "top";
  for (let i = 0; i <= xticks; i++) {
    const xVal = xMax * i / xticks;
    const x = X(xVal);
    hctx.beginPath();
    hctx.moveTo(x, h - m.bottom);
    hctx.lineTo(x, h - m.bottom + 6);
    hctx.stroke();
    hctx.fillText(xVal.toFixed(1), x, h - m.bottom + 10);
  }

  hctx.strokeStyle = "#3aaef5";
  hctx.lineWidth = 3;
  hctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const T = TMin + (TMax - TMin) * i / n;
    const xVal = T / p.thetaD;
    const yVal = einsteinReducedCv(T, p.thetaE);
    if (i === 0) hctx.moveTo(X(xVal), Y(yVal));
    else hctx.lineTo(X(xVal), Y(yVal));
  }
  hctx.stroke();

  hctx.strokeStyle = "#dc2626";
  hctx.lineWidth = 3;
  hctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const T = TMin + (TMax - TMin) * i / n;
    const xVal = T / p.thetaD;
    const yVal = debyeReducedCv(T, p.thetaD);
    if (i === 0) hctx.moveTo(X(xVal), Y(yVal));
    else hctx.lineTo(X(xVal), Y(yVal));
  }
  hctx.stroke();
}

function render() {
  syncPair(el.thetaE, el.thetaERange, el.thetaEText);
  syncPair(el.thetaD, el.thetaDRange, el.thetaDText);
  syncPair(el.tMax, el.tMaxRange, el.tMaxText);
  updateStatus();
  drawHeatCompare();
  renderMath();
}

function resetDefaults() {
  el.thetaE.value = "200";
  el.thetaERange.value = "200";
  el.thetaD.value = "200";
  el.thetaDRange.value = "200";
  el.tMax.value = "600";
  el.tMaxRange.value = "600";
  render();
}

bindPair(el.thetaE, el.thetaERange, el.thetaEText, render);
bindPair(el.thetaD, el.thetaDRange, el.thetaDText, render);
bindPair(el.tMax, el.tMaxRange, el.tMaxText, render);

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
