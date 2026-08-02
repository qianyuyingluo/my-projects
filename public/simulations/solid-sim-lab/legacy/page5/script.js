const alphaSlider = document.getElementById("alphaSlider");
const betaSlider = document.getElementById("betaSlider");
const alphaValue = document.getElementById("alphaValue");
const betaValue = document.getElementById("betaValue");
const parameterBadge = document.getElementById("parameterBadge");
const formulaEl = document.getElementById("formula");
const canvas = document.getElementById("plotCanvas");
const ctx = canvas.getContext("2d");

const T_MIN = 0;
const T_MAX = 15;
const Y_MIN = 0;
const Y_MAX = 6;
const SAMPLE_COUNT = 1200;

function kel(T, alpha, beta) {
  if (T <= 0) return 0;
  return 1 / (beta / T + alpha * T * T);
}

function formatValue(value) {
  return Number(value).toFixed(1);
}

function updateFormula() {
  const latex = String.raw`K_{el}=\frac{1}{\frac{\beta}{T}+\alpha T^{2}}`;
  if (window.katex) {
    katex.render(latex, formulaEl, {
      throwOnError: false,
      displayMode: true
    });
  } else {
    formulaEl.textContent = "K_el = 1 / (beta/T + alpha*T^2)";
  }
}

function buildCurve(alpha, beta) {
  const points = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const T = T_MIN + (T_MAX - T_MIN) * i / (SAMPLE_COUNT - 1);
    let y = kel(T, alpha, beta);
    if (!Number.isFinite(y) || y < Y_MIN) y = Y_MIN;
    if (y > Y_MAX) y = Y_MAX;
    points.push({ T, y });
  }
  return points;
}

function drawBackground(layout) {
  const { left, top, width, height } = layout;
  const gradient = ctx.createLinearGradient(0, top, 0, top + height);
  gradient.addColorStop(0, "#fcfeff");
  gradient.addColorStop(1, "#edf8ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(left, top, width, height);
}

function drawGrid(layout) {
  const { left, right, top, bottom, width, height } = layout;

  ctx.save();
  ctx.strokeStyle = "rgba(17, 142, 214, 0.16)";
  ctx.lineWidth = 1.2;

  for (let xTick = 0; xTick <= 15; xTick += 3) {
    const x = left + (xTick / T_MAX) * width;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  for (let yTick = 0; yTick <= 6; yTick += 1) {
    const y = bottom - (yTick / Y_MAX) * height;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAxes(layout) {
  const { left, bottom, top, width, height } = layout;

  ctx.save();
  ctx.strokeStyle = "#118ed6";
  ctx.lineWidth = 2.6;
  ctx.strokeRect(left, top, width, height);

  ctx.fillStyle = "#11364f";
  ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let xTick = 0; xTick <= 15; xTick += 3) {
    const x = left + (xTick / T_MAX) * width;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, bottom - 12);
    ctx.stroke();
    ctx.fillText(String(xTick), x, bottom + 12);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let yTick = 0; yTick <= 6; yTick += 1) {
    const y = bottom - (yTick / Y_MAX) * height;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + 12, y);
    ctx.stroke();
    ctx.fillText(String(yTick), left - 14, y);
  }

  ctx.font = '26px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("温度 T / K", left + width / 2, canvas.height - 44);

  ctx.save();
  ctx.translate(36, top + height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K_el", 0, 0);
  ctx.restore();

  ctx.restore();
}

function drawCurve(points, layout) {
  const { left, bottom, width, height } = layout;

  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = left + (point.T / T_MAX) * width;
    const y = bottom - ((point.y - Y_MIN) / (Y_MAX - Y_MIN)) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "#118ed6";
  ctx.lineWidth = 4.2;
  ctx.shadowColor = "rgba(17, 142, 214, 0.24)";
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}

function drawFigure(alpha, beta) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const layout = {
    left: 108,
    right: canvas.width - 36,
    top: 24,
    bottom: canvas.height - 88
  };
  layout.width = layout.right - layout.left;
  layout.height = layout.bottom - layout.top;

  drawBackground(layout);
  drawGrid(layout);
  drawAxes(layout);
  drawCurve(buildCurve(alpha, beta), layout);
}

function refresh() {
  const alpha = Number(alphaSlider.value);
  const beta = Number(betaSlider.value);

  alphaValue.textContent = formatValue(alpha);
  betaValue.textContent = formatValue(beta);
  parameterBadge.textContent = `α = ${formatValue(alpha)}, β = ${formatValue(beta)}`;

  updateFormula();
  drawFigure(alpha, beta);
}

[alphaSlider, betaSlider].forEach((slider) => {
  slider.addEventListener("input", refresh);
});

window.addEventListener("load", () => {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true }
      ],
      throwOnError: false
    });
  }
  refresh();
});
