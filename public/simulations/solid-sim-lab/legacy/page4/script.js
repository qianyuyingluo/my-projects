window.addEventListener("load", () => {
  renderEquations();
  drawChart();
});

function renderEquations() {
  katex.render(
    String.raw`\left\langle n(\varepsilon)\right\rangle=\frac{1}{\exp\!\left[(\varepsilon-\mu)/k_{B}T\right]-1}`,
    document.getElementById("eq-be"),
    { throwOnError: false, displayMode: true }
  );

  katex.render(
    String.raw`\left\langle n(\varepsilon)\right\rangle=\frac{1}{\exp\!\left[(\varepsilon-\mu)/k_{B}T\right]}`,
    document.getElementById("eq-mb"),
    { throwOnError: false, displayMode: true }
  );

  katex.render(
    String.raw`\left\langle n(\varepsilon)\right\rangle=\frac{1}{\exp\!\left[(\varepsilon-\mu)/k_{B}T\right]+1}`,
    document.getElementById("eq-fd"),
    { throwOnError: false, displayMode: true }
  );
}

function drawChart() {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  const margin = {
    left: 90,
    right: 28,
    top: 28,
    bottom: 72
  };

  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const xMin = -4;
  const xMax = 4;
  const yMin = 0;
  const yMax = 3;

  const N = 1400;

  function X(x) {
    return margin.left + (x - xMin) / (xMax - xMin) * plotW;
  }

  function Y(y) {
    return margin.top + plotH - (y - yMin) / (yMax - yMin) * plotH;
  }

  function fBE(x) {
    const den = Math.exp(x) - 1;
    if (Math.abs(den) < 1e-5) return null;
    const y = 1 / den;
    if (y < 0) return null;
    return Math.min(y, yMax + 0.8);
  }

  function fMB(x) {
    return Math.exp(-x);
  }

  function fFD(x) {
    return 1 / (Math.exp(x) + 1);
  }

  ctx.clearRect(0, 0, W, H);

  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // 网格
  ctx.strokeStyle = "#ececec";
  ctx.lineWidth = 1;

  for (let x = -4; x <= 4; x += 1) {
    const px = X(x);
    ctx.beginPath();
    ctx.moveTo(px, margin.top);
    ctx.lineTo(px, margin.top + plotH);
    ctx.stroke();
  }

  for (let y = 0; y <= 3; y += 0.5) {
    const py = Y(y);
    ctx.beginPath();
    ctx.moveTo(margin.left, py);
    ctx.lineTo(margin.left + plotW, py);
    ctx.stroke();
  }

  // 坐标轴
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(margin.left, Y(0));
  ctx.lineTo(margin.left + plotW, Y(0));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotH);
  ctx.stroke();

  // 刻度
  ctx.fillStyle = "#222";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";

  for (let x = -4; x <= 4; x += 1) {
    const px = X(x);
    ctx.beginPath();
    ctx.moveTo(px, Y(0));
    ctx.lineTo(px, Y(0) + 8);
    ctx.stroke();
    ctx.fillText(String(x), px, Y(0) + 30);
  }

  ctx.textAlign = "right";
  for (let y = 0; y <= 3; y += 0.5) {
    const py = Y(y);
    ctx.beginPath();
    ctx.moveTo(margin.left - 8, py);
    ctx.lineTo(margin.left, py);
    ctx.stroke();
    ctx.fillText(String(y), margin.left - 12, py + 7);
  }

  // 轴标签
  ctx.textAlign = "center";
  ctx.font = "24px Arial";
  ctx.fillText("(ε-μ)/kT", margin.left + plotW / 2, H - 22);

  ctx.save();
  ctx.translate(34, margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("⟨n⟩", 0, 0);
  ctx.restore();

  function drawCurve(func, color, width) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    let started = false;

    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * i / N;
      const y = func(x);

      if (y === null || !isFinite(y)) {
        started = false;
        continue;
      }

      const px = X(x);
      const py = Y(y);

      if (py < margin.top - 40 || py > margin.top + plotH + 40) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.stroke();
  }

  drawCurve(fBE, "#39b54a", 3.5);
  drawCurve(fMB, "#b8b8b8", 3.5);
  drawCurve(fFD, "#c62828", 3.5);

  // 图例
  const lx = W - 255;
  const ly = 70;
  const gap = 34;

  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#222";

  const legend = [
    ["Bose-Einstein", "#39b54a"],
    ["Maxwell-Boltzmann", "#b8b8b8"],
    ["Fermi-Dirac", "#c62828"]
  ];

  legend.forEach((item, i) => {
    const y = ly + i * gap;
    ctx.fillText(item[0], lx, y);
    ctx.strokeStyle = item[1];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + 145, y - 6);
    ctx.lineTo(lx + 205, y - 6);
    ctx.stroke();
  });
}