const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

const gammaInput = document.getElementById("gamma");
const aInput = document.getElementById("aCoef");
const tInput = document.getElementById("tMax");

const gammaText = document.getElementById("gammaText");
const aText = document.getElementById("aText");
const tText = document.getElementById("tText");

const modeCT = document.getElementById("modeCT");
const modeLinear = document.getElementById("modeLinear");

let mode = "CT";

document.querySelectorAll(".eq").forEach((el) => {
  katex.render(el.dataset.eq, el, {
    throwOnError: false,
    displayMode: true
  });
});

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function getParams() {
  return {
    gamma: parseFloat(gammaInput.value),
    a: parseFloat(aInput.value),
    tMax: parseFloat(tInput.value)
  };
}

function updateText() {
  const p = getParams();

  gammaText.textContent = p.gamma.toFixed(1);
  aText.textContent = p.a.toFixed(4);
  tText.textContent = `${p.tMax} K`;
}

function drawAxes(plot, xLabel, yLabel) {
  ctx.strokeStyle = "#19364f";
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(plot.x0, plot.y0);
  ctx.lineTo(plot.x0, plot.y1);
  ctx.lineTo(plot.x1, plot.y1);
  ctx.stroke();

  ctx.fillStyle = "#19364f";
  ctx.font = "14px Microsoft YaHei";

  ctx.strokeStyle = "rgba(25, 54, 79, 0.12)";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 5; i++) {
    const x = plot.x0 + (plot.x1 - plot.x0) * i / 5;
    const y = plot.y1 - (plot.y1 - plot.y0) * i / 5;

    ctx.beginPath();
    ctx.moveTo(x, plot.y0);
    ctx.lineTo(x, plot.y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(plot.x0, y);
    ctx.lineTo(plot.x1, y);
    ctx.stroke();
  }
}

function drawCurve(points, plot, xMax, yMax, color, width = 2.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;

  ctx.beginPath();

  points.forEach((p, i) => {
    const x = plot.x0 + (p.x / xMax) * (plot.x1 - plot.x0);
    const y = plot.y1 - (p.y / yMax) * (plot.y1 - plot.y0);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function drawLegend(items) {
  const x = 55;
  let y = 42;

  ctx.font = "14px Microsoft YaHei";

  items.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 28, y);
    ctx.stroke();

    ctx.fillStyle = "#1d3448";
    ctx.fillText(item.name, x + 38, y + 5);

    y += 24;
  });
}

function drawTicks(plot, xMax, yMax, xName, yName) {
  ctx.fillStyle = "#526b7f";
  ctx.font = "12px Microsoft YaHei";

  for (let i = 0; i <= 5; i++) {
    const xValue = (xMax * i) / 5;
    const yValue = (yMax * i) / 5;

    const x = plot.x0 + (plot.x1 - plot.x0) * i / 5;
    const y = plot.y1 - (plot.y1 - plot.y0) * i / 5;

    ctx.fillText(formatNumber(xValue), x - 10, plot.y1 + 16);
    ctx.fillText(formatNumber(yValue), plot.x0 - 45, y + 4);
  }

  ctx.fillStyle = "#19364f";
  ctx.font = "13px Microsoft YaHei";
  ctx.fillText(xName, plot.x1 - 45, plot.y1 + 32);
  ctx.fillText(yName, plot.x0 - 8, plot.y0 - 14);
}

function formatNumber(num) {
  if (num === 0) return "0";
  if (Math.abs(num) >= 1000) return num.toExponential(1);
  if (Math.abs(num) >= 10) return num.toFixed(0);
  if (Math.abs(num) >= 1) return num.toFixed(1);
  return num.toFixed(2);
}

function drawCT(plot, gamma, a, tMax) {
  const cel = [];
  const clat = [];
  const total = [];

  for (let t = 0; t <= tMax; t += 1) {
    const c1 = gamma * t;
    const c2 = a * Math.pow(t, 3);
    const c = c1 + c2;

    cel.push({ x: t, y: c1 });
    clat.push({ x: t, y: c2 });
    total.push({ x: t, y: c });
  }

  const yMax = Math.max(...total.map((p) => p.y)) * 1.08;

  drawAxes(plot, "T / K", "C");
  drawTicks(plot, tMax, yMax, "T / K", "C");

  drawCurve(cel, plot, tMax, yMax, "#1677c8");
  drawCurve(clat, plot, tMax, yMax, "#f59e0b");
  drawCurve(total, plot, tMax, yMax, "#ef4444", 3);

  drawLegend([
    { name: "电子热容 Cel = γT", color: "#1677c8" },
    { name: "晶格热容 Clat = aT³", color: "#f59e0b" },
    { name: "总热容 C = γT + aT³", color: "#ef4444" }
  ]);
}

function drawLinear(plot, gamma, a, tMax) {
  const line = [];
  const xMax = tMax * tMax;

  for (let t = 1; t <= tMax; t += 1) {
    line.push({
      x: t * t,
      y: gamma + a * t * t
    });
  }

  const yMax = Math.max(...line.map((p) => p.y)) * 1.08;

  drawAxes(plot, "T²", "C/T");
  drawTicks(plot, xMax, yMax, "T²", "C/T");

  drawCurve(line, plot, xMax, yMax, "#7c3aed", 3);

  drawLegend([
    { name: "C/T = γ + aT²", color: "#7c3aed" }
  ]);
}

function draw() {
  updateText();

  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const plot = {
    x0: 55,
    y0: 55,
    x1: rect.width - 35,
    y1: rect.height - 45
  };

  const { gamma, a, tMax } = getParams();

  ctx.fillStyle = "#0c4a7a";
  ctx.font = "20px Microsoft YaHei";
  ctx.fillText("低温金属热容曲线", 55, 28);

  if (mode === "CT") {
    drawCT(plot, gamma, a, tMax);
  } else {
    drawLinear(plot, gamma, a, tMax);
  }
}

function setMode(newMode) {
  mode = newMode;

  modeCT.classList.toggle("active", mode === "CT");
  modeLinear.classList.toggle("active", mode === "linear");

  draw();
}

gammaInput.addEventListener("input", draw);
aInput.addEventListener("input", draw);
tInput.addEventListener("input", draw);

modeCT.addEventListener("click", () => setMode("CT"));
modeLinear.addEventListener("click", () => setMode("linear"));

window.addEventListener("resize", resizeCanvas);

resizeCanvas();