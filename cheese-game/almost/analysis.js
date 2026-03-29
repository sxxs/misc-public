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

// ── New Analysis Functions ────────────────────────────────────────────────────

// Fraction of pixels with luma >= threshold
function analyzePixelRatio(imageData, { threshold }) {
  const pixels = getPixels(imageData);
  return pixels.filter(p => p.luma >= threshold).length / pixels.length;
}

// Fraction of warm-hued pixels (reds, oranges, yellows: 0-80° and 300-360°)
function analyzeWarmRatio(imageData) {
  const pixels = getPixels(imageData);
  return pixels.filter(p => (p.h <= 80 || p.h >= 300) && p.s > 0.25 && p.v > 0.2).length / pixels.length;
}

// Checkerboard score: divide into 4×4 cells, score alternating bright/dark pattern
function analyzeCheckerboard(imageData) {
  const W = imageData.width, H = imageData.height, N = 4;
  const pixels = getPixels(imageData);
  const cells = Array.from({ length: N * N }, () => ({ sum: 0, count: 0 }));
  pixels.forEach((p, i) => {
    const cx = Math.min(Math.floor((i % W) / (W / N)), N - 1);
    const cy = Math.min(Math.floor(Math.floor(i / W) / (H / N)), N - 1);
    cells[cy * N + cx].sum += p.luma;
    cells[cy * N + cx].count++;
  });
  const means = cells.map(c => c.sum / (c.count || 1));
  // Error against expected checkerboard (bright on (0,0) cell)
  let err = 0;
  means.forEach((m, i) => {
    const expected = ((Math.floor(i / N) + (i % N)) % 2 === 0) ? 1 : 0;
    err += Math.abs(m - expected);
  });
  return Math.max(0, 1 - (err / (N * N)) * 2);
}

// Diagonal brightness: one triangular half brighter than the other
function analyzeDiagonal(imageData, { brightCorner }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  let bSum = 0, bN = 0, dSum = 0, dN = 0;
  pixels.forEach((p, i) => {
    const nx = (i % W) / W, ny = Math.floor(i / W) / H;
    // topLeft = triangle where nx+ny < 1; topRight = where nx > ny
    const inBright = brightCorner === 'topLeft' ? (nx + ny < 1) : (nx + ny > 1);
    if (inBright) { bSum += p.luma; bN++; } else { dSum += p.luma; dN++; }
  });
  return (bN > 0 ? bSum / bN : 0) - (dN > 0 ? dSum / dN : 0);
}

// Regional saturation: how much more saturated region1 is vs region2
function analyzeRegionalSaturation(imageData, { region1, region2 }) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  function sat(name) {
    let sum = 0, n = 0;
    pixels.forEach((p, i) => {
      const x = i % W, y = Math.floor(i / W);
      const r = W / 4, cx = W / 2, cy = H / 2;
      const inR = name === 'top' ? y < H/2 : name === 'bottom' ? y >= H/2
              : name === 'left' ? x < W/2 : name === 'right' ? x >= W/2
              : name === 'center' ? Math.hypot(x-cx, y-cy) <= r
              : Math.hypot(x-cx, y-cy) > r; // edges
      if (inR) { sum += p.s; n++; }
    });
    return n > 0 ? sum / n : 0;
  }
  return sat(region1) - sat(region2);
}

// All four quadrants roughly equal brightness
function analyzeFourEqual(imageData) {
  const W = imageData.width, H = imageData.height;
  const pixels = getPixels(imageData);
  const quads = [0, 0, 0, 0], counts = [0, 0, 0, 0];
  pixels.forEach((p, i) => {
    const q = (Math.floor(i / W) >= H / 2 ? 2 : 0) + ((i % W) >= W / 2 ? 1 : 0);
    quads[q] += p.luma; counts[q]++;
  });
  const means = quads.map((s, i) => s / (counts[i] || 1));
  const avg = means.reduce((a, b) => a + b, 0) / 4;
  const std = Math.sqrt(means.reduce((s, m) => s + (m - avg) ** 2, 0) / 4);
  return Math.max(0, 1 - std * 8); // 1 = all equal
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
    case 'pixel_ratio':   return analyzePixelRatio(imageData, params);
    case 'warm_ratio':    return analyzeWarmRatio(imageData);
    case 'checkerboard':  return analyzeCheckerboard(imageData);
    case 'diagonal':      return analyzeDiagonal(imageData, params);
    case 'regional_sat':  return analyzeRegionalSaturation(imageData, params);
    case 'four_equal':    return analyzeFourEqual(imageData);
    default: return 0;
  }
}

// Anti-boring-image penalty for structural challenges.
// A uniform black/white image is trivially symmetric, calm, etc.
// minContrast is set per-challenge; if image contrast is below it, score is penalized.
function applyBoringPenalty(imageData, score, challenge) {
  const minC = challenge.minContrast;
  if (!minC) return score;
  const c = analyzeContrast(imageData);
  if (c >= minC) return score;
  const factor = (c / minC) ** 2; // quadratic — soft near threshold, hard near zero
  return Math.round(score * factor);
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
  // three_zones, checkerboard, four_equal already return a 0..1 goodness value
  if (analysis === 'three_zones' || analysis === 'checkerboard' || analysis === 'four_equal') {
    const goodness = runAnalysis(imageData, analysis, params);
    let score = Math.round(Math.sqrt(Math.max(0, goodness)) * 100);
    score = applyBoringPenalty(imageData, score, challenge);
    return score;
  }
  // Directional: diagonal, regional_sat
  if (analysis === 'diagonal' || analysis === 'regional_sat') {
    const delta = runAnalysis(imageData, analysis, params);
    const raw = Math.max(0, Math.min(1, delta / params.targetDelta));
    let score = Math.round(Math.sqrt(raw) * 100);
    score = applyBoringPenalty(imageData, score, challenge);
    return score;
  }

  const metric = runAnalysis(imageData, analysis, params);
  let score = calcScore(metric, params.target, params.tolerance);
  score = applyBoringPenalty(imageData, score, challenge);
  return score;
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
  if (analysis === 'pixel_ratio') {
    const v = Math.round(analyzePixelRatio(imageData, params) * 100);
    const t = Math.round(params.target * 100);
    return `Helle Pixel: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'warm_ratio') {
    const v = Math.round(analyzeWarmRatio(imageData) * 100);
    const t = Math.round(params.target * 100);
    return `Warme Töne: ${v}% · Ziel: ${t}%`;
  }
  if (analysis === 'checkerboard') {
    const v = Math.round(analyzeCheckerboard(imageData) * 100);
    return `Schachbrett-Score: ${v}% · Ziel: hoch`;
  }
  if (analysis === 'diagonal') {
    const delta = analyzeDiagonal(imageData, params);
    const v = Math.round(delta * 100);
    const t = Math.round(params.targetDelta * 100);
    return `Diagonale Differenz: ${v > 0 ? '+' : ''}${v} · Ziel: +${t}`;
  }
  if (analysis === 'regional_sat') {
    const delta = analyzeRegionalSaturation(imageData, params);
    const v = Math.round(delta * 100);
    const t = Math.round(params.targetDelta * 100);
    return `Sättigungsunterschied: ${v > 0 ? '+' : ''}${v} · Ziel: +${t}`;
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
    case 'checkerboard_viz': {
      const N = 4;
      for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? '#f0f0f0' : '#111111';
        ctx.fillRect((W/N)*cx, (H/N)*cy, W/N+1, H/N+1);
      }
      break;
    }
    case 'diagonal_viz': {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      const bright = vizParams.brightCorner === 'topLeft';
      grad.addColorStop(0,   bright ? '#f0f0f0' : '#111111');
      grad.addColorStop(1,   bright ? '#111111' : '#f0f0f0');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'warm_fill': {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   '#ff4400');
      grad.addColorStop(0.5, '#ff9900');
      grad.addColorStop(1,   '#ffdd00');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'cool_fill': {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   '#00aaff');
      grad.addColorStop(0.5, '#0066cc');
      grad.addColorStop(1,   '#22ddaa');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'half_sat_h': {
      // top half saturated, bottom half gray
      const grad1 = ctx.createLinearGradient(0, 0, W, 0);
      grad1.addColorStop(0, '#ff4444'); grad1.addColorStop(0.5, '#44ff44'); grad1.addColorStop(1, '#4444ff');
      ctx.fillStyle = grad1; ctx.fillRect(0, 0, W, H/2);
      ctx.fillStyle = '#888888'; ctx.fillRect(0, H/2, W, H/2);
      break;
    }
    case 'two_thirds_dark': {
      ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, W, H/3);
      break;
    }
    case 'dark_center': {
      ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, W, H);
      const cGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.4);
      cGrad.addColorStop(0, '#111111'); cGrad.addColorStop(0.5, '#111111'); cGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cGrad; ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'four_equal_viz': {
      // Four quadrants, each a slightly different shade of mid-gray
      const shades = ['#919191', '#8e8e8e', '#939393', '#909090'];
      [[0,0],[1,0],[0,1],[1,1]].forEach(([qx,qy], i) => {
        ctx.fillStyle = shades[i];
        ctx.fillRect(qx*W/2, qy*H/2, W/2+1, H/2+1);
      });
      // Grid lines
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
      break;
    }
    case 'medium_viz': {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#111'); grad.addColorStop(0.5, '#808080'); grad.addColorStop(1, '#f0f0f0');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Center band highlight
      ctx.fillStyle = '#808080'; ctx.fillRect(W*0.3, 0, W*0.4, H);
      break;
    }
    case 'foggy_colorful': {
      ctx.fillStyle = '#bbbbbb'; ctx.fillRect(0, 0, W, H);
      ['hsl(0,60%,70%)','hsl(120,60%,70%)','hsl(240,60%,70%)','hsl(60,60%,70%)'].forEach((c, i) => {
        const x = (i % 2) * W/2 + W/4, y = Math.floor(i/2) * H/2 + H/4;
        const g = ctx.createRadialGradient(x, y, 0, x, y, W*0.35);
        g.addColorStop(0, c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
      break;
    }
    default: {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, W, H);
    }
  }
}
