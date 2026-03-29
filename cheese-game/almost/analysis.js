// ── Image Analysis Engine ─────────────────────────────────────────────────────
// All functions operate on 64×64 ImageData for speed (<5ms typical).

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLuma(r, g, b) {
  // Rec.601 luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, v = max;
  if (d !== 0) {
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, v]; // h: 0-360, s: 0-1, v: 0-1
}

function getPixels(imageData) {
  const { data, width, height } = imageData;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const luma = getLuma(r, g, b);
    const [h, s, v] = rgbToHsv(r, g, b);
    pixels.push({ r, g, b, luma, h, s, v });
  }
  return pixels;
}

// ── Capture ───────────────────────────────────────────────────────────────────

function captureAndDownscale(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, 64, 64);
  return ctx.getImageData(0, 0, 64, 64);
}

// ── Analysis Functions ────────────────────────────────────────────────────────

function analyzeBrightness(imageData) {
  const pixels = getPixels(imageData);
  return pixels.reduce((sum, p) => sum + p.luma, 0) / pixels.length;
}

function analyzeGrayscale(imageData) {
  const pixels = getPixels(imageData);
  const avgSat = pixels.reduce((sum, p) => sum + p.s, 0) / pixels.length;
  return 1 - avgSat;
}

function analyzeSaturation(imageData) {
  const pixels = getPixels(imageData);
  return pixels.reduce((sum, p) => sum + p.s, 0) / pixels.length;
}

function analyzeColorRatio(imageData, { hueMin, hueMax }) {
  const pixels = getPixels(imageData);
  let count = 0;
  for (const p of pixels) {
    const h = p.h;
    const inRange = hueMin > hueMax
      ? (h >= hueMin || h <= hueMax)   // wraps around 0/360 (red)
      : (h >= hueMin && h <= hueMax);
    if (inRange && p.s > 0.2 && p.v > 0.15) count++;
  }
  return count / pixels.length;
}

function analyzeContrast(imageData) {
  const pixels = getPixels(imageData);
  const mean = pixels.reduce((s, p) => s + p.luma, 0) / pixels.length;
  const variance = pixels.reduce((s, p) => s + (p.luma - mean) ** 2, 0) / pixels.length;
  return Math.sqrt(variance); // std dev, ~0..0.5
}

function analyzeMonoColor(imageData) {
  // Find the most dominant hue bucket (in 36 buckets of 10°)
  const pixels = getPixels(imageData).filter(p => p.s > 0.2 && p.v > 0.15);
  if (pixels.length < 10) return 0;
  const buckets = new Array(36).fill(0);
  for (const p of pixels) buckets[Math.floor(p.h / 10)]++;
  const max = Math.max(...buckets);
  return max / pixels.length;
}

function analyzeRegional(imageData, { axis, region1, region2 }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);

  function regionLuma(name) {
    let sum = 0, count = 0;
    pixels.forEach((p, i) => {
      const x = i % W, y = Math.floor(i / W);
      let inRegion = false;
      if      (name === 'top')    inRegion = y < H / 2;
      else if (name === 'bottom') inRegion = y >= H / 2;
      else if (name === 'left')   inRegion = x < W / 2;
      else if (name === 'right')  inRegion = x >= W / 2;
      if (inRegion) { sum += p.luma; count++; }
    });
    return count > 0 ? sum / count : 0;
  }

  const l1 = regionLuma(region1), l2 = regionLuma(region2);
  return l1 - l2; // positive = region1 is brighter
}

function analyzeCenterVsEdges(imageData, { centerBrighter }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  const cx = W / 2, cy = H / 2;
  const r = W / 4; // inner radius = 25% of width

  let centerSum = 0, centerCount = 0;
  let edgeSum = 0, edgeCount = 0;

  pixels.forEach((p, i) => {
    const x = i % W, y = Math.floor(i / W);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= r) { centerSum += p.luma; centerCount++; }
    else           { edgeSum   += p.luma; edgeCount++; }
  });

  const centerLuma = centerCount > 0 ? centerSum / centerCount : 0;
  const edgeLuma   = edgeCount   > 0 ? edgeSum   / edgeCount   : 0;
  const delta = centerLuma - edgeLuma;
  return centerBrighter ? delta : -delta; // positive = correct direction
}

function analyzeStripes(imageData, { axis, bands }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);

  // Compute mean luma per band
  const bandLumas = new Array(bands).fill(0);
  const bandCounts = new Array(bands).fill(0);

  pixels.forEach((p, i) => {
    const x = i % W, y = Math.floor(i / W);
    const coord = axis === 'horizontal' ? y : x;
    const total = axis === 'horizontal' ? H : W;
    const band = Math.min(Math.floor((coord / total) * bands), bands - 1);
    bandLumas[band] += p.luma;
    bandCounts[band]++;
  });

  const means = bandLumas.map((s, i) => s / (bandCounts[i] || 1));

  // Score = mean absolute difference between adjacent bands
  let diffSum = 0;
  for (let i = 0; i + 1 < means.length; i++) {
    diffSum += Math.abs(means[i] - means[i + 1]);
  }
  return diffSum / (means.length - 1); // ~0..0.5
}

function analyzeEdges(imageData) {
  // Simplified Sobel: count pixels where luminance difference to neighbors is high
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  const thresh = 0.08;
  let count = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx = -pixels[(y-1)*W+(x-1)].luma + pixels[(y-1)*W+(x+1)].luma
                 -2*pixels[y*W+(x-1)].luma   + 2*pixels[y*W+(x+1)].luma
                 -pixels[(y+1)*W+(x-1)].luma + pixels[(y+1)*W+(x+1)].luma;
      const gy = -pixels[(y-1)*W+(x-1)].luma - 2*pixels[(y-1)*W+x].luma - pixels[(y-1)*W+(x+1)].luma
                 +pixels[(y+1)*W+(x-1)].luma + 2*pixels[(y+1)*W+x].luma + pixels[(y+1)*W+(x+1)].luma;
      if (Math.sqrt(gx*gx + gy*gy) > thresh) count++;
    }
  }
  return count / ((W-2) * (H-2));
}

function analyzeSymmetry(imageData) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);

  // Compare left half vs mirrored right half
  let diffSum = 0, count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < Math.floor(W / 2); x++) {
      const left  = pixels[y * W + x].luma;
      const right = pixels[y * W + (W - 1 - x)].luma;
      diffSum += Math.abs(left - right);
      count++;
    }
  }
  const avgDiff = count > 0 ? diffSum / count : 1;
  return 1 - avgDiff * 4; // 1=perfect symmetry, 0=asymmetric
}

function analyzeThreeZones(imageData, { axis, targets }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  const total = axis === 'horizontal' ? H : W;
  const zoneSize = total / 3;

  const zoneLumas = [0, 0, 0];
  const zoneCounts = [0, 0, 0];

  pixels.forEach((p, i) => {
    const x = i % W, y = Math.floor(i / W);
    const coord = axis === 'horizontal' ? y : x;
    const zone = Math.min(Math.floor(coord / zoneSize), 2);
    zoneLumas[zone] += p.luma;
    zoneCounts[zone]++;
  });

  const means = zoneLumas.map((s, i) => s / (zoneCounts[i] || 1));
  // Score = 1 - mean absolute deviation from targets
  const errors = targets.map((t, i) => Math.abs(means[i] - t));
  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
  return Math.max(0, 1 - avgError * 3);
}

// ── Dispatch & Scoring ────────────────────────────────────────────────────────

function runAnalysis(imageData, type, params) {
  switch (type) {
    case 'brightness':    return analyzeBrightness(imageData);
    case 'grayscale':     return analyzeGrayscale(imageData);
    case 'saturation':    return analyzeSaturation(imageData);
    case 'color_ratio':   return analyzeColorRatio(imageData, params);
    case 'contrast':      return analyzeContrast(imageData);
    case 'mono_color':    return analyzeMonoColor(imageData);
    case 'regional':      return analyzeRegional(imageData, params);
    case 'center_vs_edges': return analyzeCenterVsEdges(imageData, params);
    case 'stripes':       return analyzeStripes(imageData, params);
    case 'edges':         return analyzeEdges(imageData);
    case 'symmetry':      return analyzeSymmetry(imageData);
    case 'three_zones':   return analyzeThreeZones(imageData, params);
    default: return 0;
  }
}

function calcScore(rawMetric, target, tolerance) {
  const dist = Math.abs(rawMetric - target);
  const raw = Math.max(0, 1 - (dist / (tolerance * 3)));
  return Math.round(Math.sqrt(raw) * 100);
}

function scoreChallenge(imageData, challenge) {
  const { analysis, params } = challenge;

  if (analysis === 'composite') {
    // Weighted combination of sub-scores
    let totalWeight = 0, weightedScore = 0;
    for (const sub of params.sub) {
      const metric = runAnalysis(imageData, sub.analysis, sub.params);
      const score = calcScore(metric, sub.params.target, sub.params.tolerance);
      weightedScore += score * sub.weight;
      totalWeight += sub.weight;
    }
    return Math.round(weightedScore / totalWeight);
  }

  // Directional analyses return a delta that must be positive and large
  if (analysis === 'regional') {
    const delta = runAnalysis(imageData, analysis, params);
    const raw = Math.max(0, Math.min(1, delta / params.targetDelta));
    return Math.round(Math.sqrt(raw) * 100);
  }
  if (analysis === 'center_vs_edges') {
    const delta = runAnalysis(imageData, analysis, params);
    const raw = Math.max(0, Math.min(1, delta / params.targetDelta));
    return Math.round(Math.sqrt(raw) * 100);
  }

  const metric = runAnalysis(imageData, analysis, params);
  return calcScore(metric, params.target, params.tolerance);
}

// ── Diagnosis Text ────────────────────────────────────────────────────────────

function getDiagnosis(imageData, challenge) {
  const { analysis, params } = challenge;
  if (analysis === 'brightness') {
    const v = Math.round(analyzeBrightness(imageData) * 100);
    const t = Math.round(params.target * 100);
    return `Helligkeit: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'grayscale') {
    const v = Math.round(analyzeGrayscale(imageData) * 100);
    return `Farblosigkeit: ${v}% · Ziel: hoch`;
  }
  if (analysis === 'saturation') {
    const v = Math.round(analyzeSaturation(imageData) * 100);
    const t = Math.round(params.target * 100);
    return `Sättigung: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'color_ratio') {
    const v = Math.round(analyzeColorRatio(imageData, params) * 100);
    const t = Math.round(params.target * 100);
    return `Zielfarbe: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'contrast') {
    const v = Math.round(analyzeContrast(imageData) * 100);
    const t = Math.round(params.target * 100);
    return `Kontrast: ${v} · Ziel: ${t}`;
  }
  if (analysis === 'regional') {
    const delta = analyzeRegional(imageData, params);
    const v = Math.round(delta * 100);
    const t = Math.round(params.targetDelta * 100);
    return `Helligkeitsunterschied: ${v > 0 ? '+' : ''}${v} · Ziel: +${t}`;
  }
  if (analysis === 'symmetry') {
    const v = Math.round(analyzeSymmetry(imageData) * 100);
    return `Symmetrie: ${v}% · Ziel: hoch`;
  }
  if (analysis === 'edges') {
    const v = Math.round(analyzeEdges(imageData) * 100);
    const t = Math.round((challenge.params.target || 0.35) * 100);
    return `Kantendichte: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'stripes') {
    const v = Math.round(analyzeStripes(imageData, params) * 100);
    const t = Math.round(params.target * 100);
    return `Mustervariation: ${v} · Ziel: ${t}`;
  }
  if (analysis === 'three_zones') {
    return 'Drei Helligkeitsbänder analysiert';
  }
  if (analysis === 'composite') {
    return 'Kombinations-Analyse';
  }
  return '';
}

// ── Visualization ─────────────────────────────────────────────────────────────

function drawVisualization(canvas, vizType, vizParams) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  switch (vizType) {
    case 'solid_fill': {
      if (vizParams.gradient) {
        // Rainbow gradient for saturation challenge
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0,    'hsl(0,100%,50%)');
        grad.addColorStop(0.17, 'hsl(60,100%,50%)');
        grad.addColorStop(0.33, 'hsl(120,100%,50%)');
        grad.addColorStop(0.5,  'hsl(180,100%,50%)');
        grad.addColorStop(0.67, 'hsl(240,100%,50%)');
        grad.addColorStop(0.83, 'hsl(300,100%,50%)');
        grad.addColorStop(1,    'hsl(360,100%,50%)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = vizParams.color;
      }
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'half_split_h': {
      ctx.fillStyle = vizParams.top;
      ctx.fillRect(0, 0, W, H / 2);
      ctx.fillStyle = vizParams.bottom;
      ctx.fillRect(0, H / 2, W, H / 2);
      break;
    }
    case 'half_split_v': {
      ctx.fillStyle = vizParams.left;
      ctx.fillRect(0, 0, W / 2, H);
      ctx.fillStyle = vizParams.right;
      ctx.fillRect(W / 2, 0, W / 2, H);
      break;
    }
    case 'center_spot': {
      ctx.fillStyle = vizParams.edgeColor;
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.42);
      grad.addColorStop(0,   vizParams.centerColor);
      grad.addColorStop(0.5, vizParams.centerColor);
      grad.addColorStop(1,   'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'stripes_h': {
      const n = 7;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111111';
        ctx.fillRect(0, (H / n) * i, W, H / n + 1);
      }
      break;
    }
    case 'stripes_v': {
      const n = 7;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111111';
        ctx.fillRect((W / n) * i, 0, W / n + 1, H);
      }
      break;
    }
    case 'symmetry_ref': {
      // Gradient left→center then mirror
      const grad = ctx.createLinearGradient(0, 0, W / 2, 0);
      grad.addColorStop(0, '#222222');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W / 2, H);
      const grad2 = ctx.createLinearGradient(W / 2, 0, W, 0);
      grad2.addColorStop(0, '#ffffff');
      grad2.addColorStop(1, '#222222');
      ctx.fillStyle = grad2;
      ctx.fillRect(W / 2, 0, W / 2, H);
      // Symmetry axis
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case 'edge_burst': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.5;
      for (let angle = 0; angle < 360; angle += 18) {
        const rad = angle * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(W / 2, H / 2);
        ctx.lineTo(W / 2 + Math.cos(rad) * W, H / 2 + Math.sin(rad) * H);
        ctx.stroke();
      }
      // Add grid
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#888888';
      for (let i = 1; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo((W/5)*i, 0); ctx.lineTo((W/5)*i, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (H/5)*i); ctx.lineTo(W, (H/5)*i); ctx.stroke();
      }
      break;
    }
    case 'three_bands_h': {
      const colors = vizParams.colors || ['#eeeeee', '#777777', '#111111'];
      const bandH = H / 3;
      colors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, bandH * i, W, bandH + 1);
      });
      break;
    }
    case 'combo_dark_sat': {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, W, H);
      const spots = [
        { x: 0.25, y: 0.3,  c: 'hsl(0,100%,50%)',   r: 0.2 },
        { x: 0.7,  y: 0.6,  c: 'hsl(120,100%,40%)', r: 0.18 },
        { x: 0.5,  y: 0.2,  c: 'hsl(240,100%,60%)', r: 0.15 },
        { x: 0.15, y: 0.7,  c: 'hsl(60,100%,50%)',  r: 0.12 },
        { x: 0.8,  y: 0.25, c: 'hsl(300,100%,50%)', r: 0.13 },
      ];
      spots.forEach(({ x, y, c, r }) => {
        const grad = ctx.createRadialGradient(x*W, y*H, 0, x*W, y*H, r*W);
        grad.addColorStop(0, c);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });
      break;
    }
    default: {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, W, H);
    }
  }
}
