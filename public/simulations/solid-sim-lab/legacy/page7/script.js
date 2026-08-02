window.addEventListener("DOMContentLoaded", () => {
  renderLatex();

  const chart = document.getElementById("chart");
  const ctx = chart.getContext("2d");

  const qRange = document.getElementById("qRange");
  const gRange = document.getElementById("gRange");
  const bandRange = document.getElementById("bandRange");
  const kRange = document.getElementById("kRange");
  const extendCheck = document.getElementById("extendCheck");
  const eminRange = document.getElementById("eminRange");
  const emaxRange = document.getElementById("emaxRange");
  const resetBtn = document.getElementById("resetBtn");

  const qText = document.getElementById("qText");
  const gText = document.getElementById("gText");
  const bandText = document.getElementById("bandText");
  const kText = document.getElementById("kText");
  const eminText = document.getElementById("eminText");
  const emaxText = document.getElementById("emaxText");
  const infoLine = document.getElementById("infoLine");

  const defaultParams = {
    q: 1.0,
    gMax: 6,
    bands: 3,
    kPoints: 161,
    extended: true,
    eMin: -10,
    eMax: 100
  };

  const colors = [
    "#3778bf",
    "#ff8a1c",
    "#3e9a35",
    "#d94141",
    "#8b5cc2",
    "#8c564b"
  ];

  function renderLatex() {
    const items = document.querySelectorAll(".latex");

    items.forEach(item => {
      const tex = item.textContent.trim();

      if (window.katex) {
        katex.render(tex, item, {
          throwOnError: false,
          displayMode: true
        });
      }
    });
  }

  function setDefaultValues() {
    qRange.value = defaultParams.q;
    gRange.value = defaultParams.gMax;
    bandRange.value = defaultParams.bands;
    kRange.value = defaultParams.kPoints;
    extendCheck.checked = defaultParams.extended;
    eminRange.value = defaultParams.eMin;
    emaxRange.value = defaultParams.eMax;
  }

  function readParams() {
    let eMin = Number(eminRange.value);
    let eMax = Number(emaxRange.value);

    if (eMax <= eMin + 10) {
      eMax = eMin + 10;
      emaxRange.value = eMax;
    }

    return {
      q: Number(qRange.value),
      gMax: Number(gRange.value),
      bands: Number(bandRange.value),
      kPoints: Number(kRange.value),
      extended: extendCheck.checked,
      eMin,
      eMax
    };
  }

  function updateTexts(p) {
    qText.textContent = p.q.toFixed(2);
    gText.textContent = String(p.gMax);
    bandText.textContent = String(p.bands);
    kText.textContent = String(p.kPoints);
    eminText.textContent = String(p.eMin);
    emaxText.textContent = String(p.eMax);

    const matrixSize = 2 * p.gMax + 1;
    const zoneText = p.extended
      ? "当前绘制中心区和左右各 1 个布里渊区"
      : "当前只绘制中心布里渊区";

    infoLine.textContent =
      `PWE matrix size: ${matrixSize} × ${matrixSize}，` +
      `横坐标固定显示 -3π/a 到 3π/a，${zoneText}`;
  }

  function buildHamiltonian(q, gMax, r) {
    const pi = Math.PI;
    const a = 1.0;

    const k = r * pi / a;
    const G0 = 2 * pi / a;

    const Vc = pi * pi * q;

    const size = 2 * gMax + 1;
    const H = Array.from({ length: size }, () => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      const n = i - gMax;
      const G = n * G0;

      H[i][i] = (k + G) * (k + G);

      if (i > 0) {
        H[i][i - 1] = Vc;
      }

      if (i < size - 1) {
        H[i][i + 1] = Vc;
      }
    }

    return H;
  }

  function jacobiEigenvalues(mat) {
    const n = mat.length;
    const A = mat.map(row => row.slice());

    const eps = 1e-10;
    const maxIter = 100 * n * n;

    for (let iter = 0; iter < maxIter; iter++) {
      let p = 0;
      let q = 1;
      let max = Math.abs(A[0][1] || 0);

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const value = Math.abs(A[i][j]);

          if (value > max) {
            max = value;
            p = i;
            q = j;
          }
        }
      }

      if (max < eps) {
        break;
      }

      const app = A[p][p];
      const aqq = A[q][q];
      const apq = A[p][q];

      const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
      const c = Math.cos(phi);
      const s = Math.sin(phi);

      for (let i = 0; i < n; i++) {
        if (i !== p && i !== q) {
          const aip = A[i][p];
          const aiq = A[i][q];

          A[i][p] = c * aip - s * aiq;
          A[p][i] = A[i][p];

          A[i][q] = s * aip + c * aiq;
          A[q][i] = A[i][q];
        }
      }

      A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
      A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
      A[p][q] = 0;
      A[q][p] = 0;
    }

    const values = [];

    for (let i = 0; i < n; i++) {
      values.push(A[i][i]);
    }

    values.sort((a, b) => a - b);

    return values;
  }

  function solveReducedZone(p) {
    const rVals = [];
    const bandData = Array.from({ length: p.bands }, () => []);

    for (let i = 0; i < p.kPoints; i++) {
      const t = i / (p.kPoints - 1);

      const r = -1 + 2 * t;

      const H = buildHamiltonian(p.q, p.gMax, r);
      const eigs = jacobiEigenvalues(H);

      rVals.push(r);

      for (let b = 0; b < p.bands; b++) {
        bandData[b].push(eigs[b]);
      }
    }

    return {
      rVals,
      bandData
    };
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = chart.getBoundingClientRect();

    chart.width = Math.round(rect.width * dpr);
    chart.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function fixedXRange() {
    return {
      xMin: -3,
      xMax: 3
    };
  }

  function xTickLabelFromR(r) {
    if (Math.abs(r) < 1e-9) {
      return "0";
    }

    const n = Math.round(r);

    if (Math.abs(r - n) > 1e-9) {
      return "";
    }

    if (n === 1) {
      return "π/a";
    }

    if (n === -1) {
      return "-π/a";
    }

    return `${n}π/a`;
  }

  function draw(p, solved) {
    resizeCanvas();

    const w = chart.clientWidth;
    const h = chart.clientHeight;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const margin = {
      left: 84,
      right: 38,
      top: 62,
      bottom: 82
    };

    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const range = fixedXRange();

    const xMin = range.xMin;
    const xMax = range.xMax;
    const yMin = p.eMin;
    const yMax = p.eMax;

    function xMap(x) {
      return margin.left + ((x - xMin) / (xMax - xMin)) * plotW;
    }

    function yMap(y) {
      return margin.top + ((yMax - y) / (yMax - yMin)) * plotH;
    }

    drawZoneBackground(xMap, margin.top, plotH);
    drawGrid(xMin, xMax, yMin, yMax, xMap, yMap, margin, plotW, plotH);
    drawBandCurves(p, solved, xMap, yMap);
    drawAxes(xMin, xMax, yMin, yMax, xMap, yMap, margin, plotW, plotH);
    drawLegend(p, margin);
    drawTitles(p, w);
  }

  function drawZoneBackground(xMap, top, plotH) {
    for (let zone = -1; zone <= 1; zone++) {
      const x1 = 2 * zone - 1;
      const x2 = 2 * zone + 1;

      const px1 = xMap(x1);
      const px2 = xMap(x2);

      ctx.fillStyle = zone === 0 ? "#f8fbff" : "#eef4ff";
      ctx.fillRect(px1, top, px2 - px1, plotH);

      ctx.fillStyle = "#6a7890";
      ctx.font = "12px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`BZ ${zone}`, (px1 + px2) / 2, top + 6);
    }
  }

  function drawGrid(xMin, xMax, yMin, yMax, xMap, yMap, margin, plotW, plotH) {
    ctx.save();

    ctx.strokeStyle = "#dde7f4";
    ctx.lineWidth = 1;

    const yTicks = 8;

    for (let i = 0; i <= yTicks; i++) {
      const y = yMin + (yMax - yMin) * i / yTicks;
      const py = yMap(y);

      ctx.beginPath();
      ctx.moveTo(margin.left, py);
      ctx.lineTo(margin.left + plotW, py);
      ctx.stroke();
    }

    for (let r = Math.ceil(xMin); r <= Math.floor(xMax); r++) {
      const px = xMap(r);

      ctx.strokeStyle = "#e9eff8";
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(px, margin.top);
      ctx.lineTo(px, margin.top + plotH);
      ctx.stroke();
    }

    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "#d67b63";

    for (let r = Math.ceil(xMin); r <= Math.floor(xMax); r++) {
      if (Math.abs(r % 2) === 1) {
        const px = xMap(r);

        ctx.beginPath();
        ctx.moveTo(px, margin.top);
        ctx.lineTo(px, margin.top + plotH);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBandCurves(p, solved, xMap, yMap) {
    const rVals = solved.rVals;
    const bandData = solved.bandData;

    const startZone = p.extended ? -1 : 0;
    const endZone = p.extended ? 1 : 0;

    for (let b = 0; b < p.bands; b++) {
      ctx.strokeStyle = colors[b % colors.length];
      ctx.lineWidth = 2.2;

      for (let zone = startZone; zone <= endZone; zone++) {
        ctx.beginPath();

        for (let i = 0; i < rVals.length; i++) {
          const r = rVals[i] + 2 * zone;
          const E = bandData[b][i];

          const x = xMap(r);
          const y = yMap(E);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
    }
  }

  function drawAxes(xMin, xMax, yMin, yMax, xMap, yMap, margin, plotW, plotH) {
    ctx.save();

    ctx.strokeStyle = "#1f2a3d";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);

    ctx.font = "12px Microsoft YaHei";
    ctx.fillStyle = "#24324a";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let r = Math.ceil(xMin); r <= Math.floor(xMax); r++) {
      const px = xMap(r);

      ctx.beginPath();
      ctx.moveTo(px, margin.top + plotH);
      ctx.lineTo(px, margin.top + plotH + 5);
      ctx.stroke();

      const label = xTickLabelFromR(r);

      if (label !== "") {
        ctx.fillText(label, px, margin.top + plotH + 8);
      }
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const yTicks = 8;

    for (let i = 0; i <= yTicks; i++) {
      const y = yMin + (yMax - yMin) * i / yTicks;
      const py = yMap(y);

      ctx.beginPath();
      ctx.moveTo(margin.left - 5, py);
      ctx.lineTo(margin.left, py);
      ctx.stroke();

      ctx.fillText(y.toFixed(1), margin.left - 10, py);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "15px Microsoft YaHei";
    ctx.fillStyle = "#24324a";
    ctx.fillText(
      "k（单位：π/a；等价于横坐标使用 ka/π）",
      margin.left + plotW / 2,
      margin.top + plotH + 50
    );

    ctx.font = "12px Microsoft YaHei";
    ctx.fillStyle = "#5c6a80";
    ctx.fillText(
      "红色虚线对应布里渊区边界",
      margin.left + plotW / 2,
      margin.top + plotH + 70
    );

    ctx.save();
    ctx.translate(26, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);

    ctx.font = "15px Microsoft YaHei";
    ctx.fillStyle = "#24324a";
    ctx.fillText("E（无量纲能量）", 0, 0);

    ctx.restore();
    ctx.restore();
  }

  function drawLegend(p, margin) {
    ctx.save();

    ctx.font = "13px Microsoft YaHei";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let x = margin.left + 14;
    let y = margin.top + 22;

    for (let i = 0; i < p.bands; i++) {
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 24, y);
      ctx.stroke();

      ctx.fillStyle = "#24324a";
      ctx.fillText(`Band ${i + 1}`, x + 34, y);

      y += 22;
    }

    ctx.restore();
  }

  function drawTitles(p, w) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.fillStyle = "#182336";
    ctx.font = "17px Microsoft YaHei";
    ctx.fillText(
      `q = ${p.q.toFixed(2)}，Gmax = ${p.gMax}，bands = ${p.bands}`,
      w / 2,
      8
    );

    ctx.font = "12px Microsoft YaHei";
    ctx.fillStyle = "#5d6b80";

    const text = p.extended
      ? "当前显示中心区和左右各 1 个布里渊区"
      : "当前只显示中心布里渊区";

    ctx.fillText(text, w / 2, 32);

    ctx.restore();
  }

  function render() {
    const p = readParams();
    updateTexts(p);

    const solved = solveReducedZone(p);

    draw(p, solved);
  }

  [
    qRange,
    gRange,
    bandRange,
    kRange,
    eminRange,
    emaxRange
  ].forEach(input => {
    input.addEventListener("input", render);
  });

  extendCheck.addEventListener("change", render);

  resetBtn.addEventListener("click", () => {
    setDefaultValues();
    render();
  });

  window.addEventListener("resize", render);

  setDefaultValues();
  render();
});