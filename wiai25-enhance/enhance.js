// WIAI 25 Collective Enhance - Main JavaScript
// Version 1.0.0

(function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        canvasWidth: 600,
        canvasHeight: 280,
        simulationSpeed: 50,
        refineOpacity: 0.9,
        decayFactor: 0.5,
        redrawThreshold: 0.3,
        levels: [
            { height: 8, mode: 'add' },
            { height: 12, mode: 'remove' },
            { height: 16, mode: 'add' },
            { height: 22, mode: 'remove' },
            { height: 28, mode: 'add' },
            { height: 36, mode: 'remove' },
            { height: 44, mode: 'add' },
            { height: 54, mode: 'remove' },
            { height: 64, mode: 'add' }
        ]
    };

    // === COLORS ===
    const COLORS = {
        background: '#06080c',
        pixel: '#22d3ee',
        pixelGlow: 'rgba(34, 211, 238, 0.5)',
        targetAdd: 'rgba(34, 211, 238, 0.15)',
        targetRemove: 'rgba(248, 113, 113, 0.15)',
        ghost: 'rgba(34, 211, 238, 0.25)',
        magenta: '#e879f9',
        red: '#f87171'
    };

    // === STATE ===
    let state = {
        currentLevel: 0,
        totalContributions: 0,
        pixelQueue: [],
        canvasState: [], // 2D array of pixel opacities
        ghostLayers: [], // Previous level snapshots
        continuousMode: false,
        continuousInterval: null,
        targetShape: null,
        fineShape: null,
        pulsingPixels: [] // Pixels currently animating
    };

    // === DOM ELEMENTS ===
    const elements = {};

    // === INITIALIZATION ===
    function init() {
        cacheElements();
        setupCanvas();
        setupEventListeners();
        initLevel(0);
        render();
        updateUI();
    }

    function cacheElements() {
        elements.canvas = document.getElementById('enhanceCanvas');
        elements.ctx = elements.canvas.getContext('2d');
        elements.levelNumber = document.getElementById('levelNumber');
        elements.progressFill = document.getElementById('progressFill');
        elements.progressCurrent = document.getElementById('progressCurrent');
        elements.progressTotal = document.getElementById('progressTotal');
        elements.modeDot = document.getElementById('modeDot');
        elements.modeText = document.getElementById('modeText');
        elements.statContributions = document.getElementById('statContributions');
        elements.statResolution = document.getElementById('statResolution');
        elements.statOnline = document.getElementById('statOnline');
        elements.activityFeed = document.getElementById('activityFeed');
        elements.contributionPanel = document.getElementById('contributionPanel');
        elements.contributionText = document.getElementById('contributionText');
        elements.shimmerOverlay = document.getElementById('shimmerOverlay');

        // Demo controls
        elements.btnAddOne = document.getElementById('btnAddOne');
        elements.btnAdd10 = document.getElementById('btnAdd10');
        elements.btnAdd50 = document.getElementById('btnAdd50');
        elements.btnFillLevel = document.getElementById('btnFillLevel');
        elements.btnContinuous = document.getElementById('btnContinuous');
        elements.btnReset = document.getElementById('btnReset');
        elements.sliderSpeed = document.getElementById('sliderSpeed');
        elements.sliderRefineOpacity = document.getElementById('sliderRefineOpacity');
        elements.sliderDecay = document.getElementById('sliderDecay');
        elements.sliderRedraw = document.getElementById('sliderRedraw');
        elements.speedValue = document.getElementById('speedValue');
        elements.refineValue = document.getElementById('refineValue');
        elements.decayValue = document.getElementById('decayValue');
        elements.redrawValue = document.getElementById('redrawValue');
    }

    function setupCanvas() {
        elements.canvas.width = CONFIG.canvasWidth;
        elements.canvas.height = CONFIG.canvasHeight;
    }

    function setupEventListeners() {
        elements.btnAddOne.addEventListener('click', () => addVisitors(1));
        elements.btnAdd10.addEventListener('click', () => addVisitors(10));
        elements.btnAdd50.addEventListener('click', () => addVisitors(50));
        elements.btnFillLevel.addEventListener('click', fillLevel);
        elements.btnContinuous.addEventListener('click', toggleContinuous);
        elements.btnReset.addEventListener('click', resetAll);

        elements.sliderSpeed.addEventListener('input', (e) => {
            CONFIG.simulationSpeed = parseInt(e.target.value);
            elements.speedValue.textContent = CONFIG.simulationSpeed + 'ms';
            if (state.continuousMode) {
                clearInterval(state.continuousInterval);
                state.continuousInterval = setInterval(() => addVisitors(1), CONFIG.simulationSpeed);
            }
        });

        elements.sliderRefineOpacity.addEventListener('input', (e) => {
            CONFIG.refineOpacity = parseInt(e.target.value) / 100;
            elements.refineValue.textContent = e.target.value + '%';
        });

        elements.sliderDecay.addEventListener('input', (e) => {
            CONFIG.decayFactor = parseInt(e.target.value) / 100;
            elements.decayValue.textContent = e.target.value + '%';
        });

        elements.sliderRedraw.addEventListener('input', (e) => {
            CONFIG.redrawThreshold = parseInt(e.target.value) / 100;
            elements.redrawValue.textContent = e.target.value + '%';
        });
    }

    // === LEVEL SYSTEM ===
    function initLevel(levelIndex) {
        if (levelIndex >= CONFIG.levels.length) {
            // Game complete
            addActivity('COMPLETE! Final resolution reached.', true);
            return;
        }

        const level = CONFIG.levels[levelIndex];
        state.currentLevel = levelIndex;

        // Generate target shape for this level
        state.targetShape = rasterize25(level.height);

        // For remove mode, we also need the finer shape
        if (level.mode === 'remove' && levelIndex < CONFIG.levels.length - 1) {
            const nextAddLevel = CONFIG.levels.slice(levelIndex + 1).find(l => l.mode === 'add');
            if (nextAddLevel) {
                state.fineShape = rasterize25(nextAddLevel.height);
            }
        }

        // Initialize or update canvas state
        if (levelIndex === 0) {
            state.canvasState = createEmptyGrid(state.targetShape.cols, state.targetShape.rows);
        } else {
            // Apply decay if this is an add level
            if (level.mode === 'add') {
                applyDecay();
            }
            // Resize canvas state to new resolution
            state.canvasState = resizeCanvasState(state.canvasState, state.targetShape.cols, state.targetShape.rows);
        }

        // Build pixel queue
        state.pixelQueue = buildPixelQueue(level.mode);

        updateUI();
        render();
    }

    function buildPixelQueue(mode) {
        const queue = [];
        const shape = state.targetShape;

        for (let row = 0; row < shape.rows; row++) {
            for (let col = 0; col < shape.cols; col++) {
                if (mode === 'add') {
                    // Add pixels that are in target and either empty or below threshold
                    if (shape.pixels[row][col]) {
                        const currentOpacity = state.canvasState[row]?.[col] || 0;
                        if (currentOpacity < CONFIG.redrawThreshold) {
                            queue.push({ row, col, mode: 'add' });
                        }
                    }
                } else {
                    // Remove pixels that were filled but shouldn't be at finer resolution
                    if (shape.pixels[row][col] && state.canvasState[row]?.[col] > 0) {
                        // Check if this pixel should be removed (simplified logic)
                        // In reality, we'd compare with finer resolution
                        const shouldRemove = Math.random() < 0.3; // 30% of filled pixels
                        if (shouldRemove) {
                            queue.push({ row, col, mode: 'remove' });
                        }
                    }
                }
            }
        }

        // Shuffle queue for random order
        return shuffleArray(queue);
    }

    function addVisitors(count) {
        const actualCount = Math.min(count, state.pixelQueue.length);

        for (let i = 0; i < actualCount; i++) {
            const pixel = state.pixelQueue.shift();
            if (!pixel) break;

            state.totalContributions++;

            if (pixel.mode === 'add') {
                // Add pixel
                if (!state.canvasState[pixel.row]) {
                    state.canvasState[pixel.row] = [];
                }
                state.canvasState[pixel.row][pixel.col] = 1;
                addPulsingPixel(pixel.row, pixel.col);
            } else {
                // Remove pixel (reduce opacity)
                if (state.canvasState[pixel.row]) {
                    state.canvasState[pixel.row][pixel.col] *= (1 - CONFIG.refineOpacity);
                }
            }

            showContribution(pixel);
            addActivity(`Visitor #${state.totalContributions} ${pixel.mode === 'add' ? 'added' : 'removed'} pixel [${pixel.row}, ${pixel.col}]`);
        }

        updateUI();
        render();

        // Check for level completion
        if (state.pixelQueue.length === 0) {
            completeLevel();
        }
    }

    function fillLevel() {
        addVisitors(state.pixelQueue.length);
    }

    function completeLevel() {
        // Save ghost layer
        state.ghostLayers.push({
            level: state.currentLevel,
            state: JSON.parse(JSON.stringify(state.canvasState)),
            shape: state.targetShape
        });

        // Play shimmer animation
        elements.shimmerOverlay.classList.add('active');
        setTimeout(() => {
            elements.shimmerOverlay.classList.remove('active');
        }, 1200);

        addActivity(`ENHANCE! Level ${state.currentLevel + 2} – ${CONFIG.levels[state.currentLevel + 1]?.height || 'MAX'}px`, true);

        // Move to next level after brief delay
        setTimeout(() => {
            initLevel(state.currentLevel + 1);
        }, 500);
    }

    function toggleContinuous() {
        state.continuousMode = !state.continuousMode;
        elements.btnContinuous.classList.toggle('active', state.continuousMode);
        elements.btnContinuous.textContent = state.continuousMode ? '⏸ Pause' : '▶ Continuous';

        if (state.continuousMode) {
            state.continuousInterval = setInterval(() => {
                if (state.pixelQueue.length > 0) {
                    addVisitors(1);
                } else if (state.currentLevel < CONFIG.levels.length - 1) {
                    // Level complete, wait a bit then continue
                } else {
                    toggleContinuous(); // Stop at end
                }
            }, CONFIG.simulationSpeed);
        } else {
            clearInterval(state.continuousInterval);
            state.continuousInterval = null;
        }
    }

    function resetAll() {
        if (state.continuousMode) {
            toggleContinuous();
        }

        state.totalContributions = 0;
        state.ghostLayers = [];
        state.pulsingPixels = [];

        initLevel(0);

        addActivity('Reset – Starting fresh!');
    }

    // === RASTERIZATION ===
    function rasterize25(height) {
        // Create offscreen canvas for text rendering
        const offscreen = document.createElement('canvas');
        const ctx = offscreen.getContext('2d');

        // Calculate dimensions based on height
        const fontSize = height * 1.2;
        const width = Math.ceil(height * 2.5);

        offscreen.width = width;
        offscreen.height = height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.fillText('25', width / 2, -fontSize * 0.15);

        // Read pixel data
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = [];

        for (let y = 0; y < height; y++) {
            pixels[y] = [];
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                // Check if pixel is bright enough (part of the "25")
                pixels[y][x] = imageData.data[i] > 128;
            }
        }

        return {
            width,
            height,
            rows: height,
            cols: width,
            pixels
        };
    }

    // === CANVAS STATE HELPERS ===
    function createEmptyGrid(cols, rows) {
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = new Array(cols).fill(0);
        }
        return grid;
    }

    function resizeCanvasState(oldState, newCols, newRows) {
        const newState = createEmptyGrid(newCols, newRows);

        // Copy over existing pixels (scaled)
        const oldRows = oldState.length;
        const oldCols = oldState[0]?.length || 0;

        if (oldRows === 0 || oldCols === 0) return newState;

        const scaleX = newCols / oldCols;
        const scaleY = newRows / oldRows;

        for (let newR = 0; newR < newRows; newR++) {
            for (let newC = 0; newC < newCols; newC++) {
                const oldR = Math.floor(newR / scaleY);
                const oldC = Math.floor(newC / scaleX);

                if (oldState[oldR] && typeof oldState[oldR][oldC] === 'number') {
                    newState[newR][newC] = oldState[oldR][oldC];
                }
            }
        }

        return newState;
    }

    function applyDecay() {
        for (let r = 0; r < state.canvasState.length; r++) {
            for (let c = 0; c < state.canvasState[r].length; c++) {
                state.canvasState[r][c] *= (1 - CONFIG.decayFactor);
            }
        }
    }

    // === RENDERING ===
    function render() {
        const ctx = elements.ctx;
        const shape = state.targetShape;

        if (!shape) return;

        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        // Calculate pixel size and offset to center
        const pixelSize = Math.min(
            (CONFIG.canvasWidth - 40) / shape.cols,
            (CONFIG.canvasHeight - 40) / shape.rows
        );

        const offsetX = (CONFIG.canvasWidth - shape.cols * pixelSize) / 2;
        const offsetY = (CONFIG.canvasHeight - shape.rows * pixelSize) / 2;

        // Draw ghost layers (previous levels)
        state.ghostLayers.forEach((ghost, index) => {
            const opacity = 0.15 * Math.pow(0.7, state.ghostLayers.length - 1 - index);
            drawGhostLayer(ctx, ghost, pixelSize, offsetX, offsetY, opacity);
        });

        // Draw target outlines (unfilled pixels)
        const level = CONFIG.levels[state.currentLevel];
        const outlineColor = level?.mode === 'add' ? COLORS.targetAdd : COLORS.targetRemove;

        for (let row = 0; row < shape.rows; row++) {
            for (let col = 0; col < shape.cols; col++) {
                if (shape.pixels[row][col]) {
                    const x = offsetX + col * pixelSize;
                    const y = offsetY + row * pixelSize;

                    // Draw target outline
                    ctx.fillStyle = outlineColor;
                    ctx.fillRect(x + 1, y + 1, pixelSize - 2, pixelSize - 2);
                }
            }
        }

        // Draw filled pixels
        for (let row = 0; row < state.canvasState.length; row++) {
            for (let col = 0; col < (state.canvasState[row]?.length || 0); col++) {
                const opacity = state.canvasState[row][col];
                if (opacity > 0.01) {
                    const x = offsetX + col * pixelSize;
                    const y = offsetY + row * pixelSize;

                    // Check if this pixel is pulsing
                    const isPulsing = state.pulsingPixels.some(p => p.row === row && p.col === col);

                    if (isPulsing) {
                        // Draw with magenta glow
                        ctx.shadowColor = COLORS.magenta;
                        ctx.shadowBlur = 10;
                        ctx.fillStyle = COLORS.magenta;
                    } else {
                        // Draw normal pixel with glow
                        ctx.shadowColor = COLORS.pixelGlow;
                        ctx.shadowBlur = 4;
                        ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`;
                    }

                    ctx.fillRect(x + 1, y + 1, pixelSize - 2, pixelSize - 2);
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Update pulsing pixels
        state.pulsingPixels = state.pulsingPixels.filter(p => Date.now() - p.time < 800);

        // Request next frame if there are animations
        if (state.pulsingPixels.length > 0) {
            requestAnimationFrame(render);
        }
    }

    function drawGhostLayer(ctx, ghost, currentPixelSize, offsetX, offsetY, opacity) {
        const shape = ghost.shape;
        const ghostState = ghost.state;

        // Calculate ghost pixel size (may differ from current)
        const ghostPixelSize = Math.min(
            (CONFIG.canvasWidth - 40) / shape.cols,
            (CONFIG.canvasHeight - 40) / shape.rows
        );

        const ghostOffsetX = (CONFIG.canvasWidth - shape.cols * ghostPixelSize) / 2;
        const ghostOffsetY = (CONFIG.canvasHeight - shape.rows * ghostPixelSize) / 2;

        ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`;

        for (let row = 0; row < ghostState.length; row++) {
            for (let col = 0; col < (ghostState[row]?.length || 0); col++) {
                if (ghostState[row][col] > 0.1) {
                    const x = ghostOffsetX + col * ghostPixelSize;
                    const y = ghostOffsetY + row * ghostPixelSize;
                    ctx.fillRect(x + 1, y + 1, ghostPixelSize - 2, ghostPixelSize - 2);
                }
            }
        }
    }

    function addPulsingPixel(row, col) {
        state.pulsingPixels.push({ row, col, time: Date.now() });
        requestAnimationFrame(render);
    }

    // === UI UPDATES ===
    function updateUI() {
        const level = CONFIG.levels[state.currentLevel];
        const totalPixels = state.pixelQueue.length + (state.targetShape ?
            countFilledPixels() : 0);
        const filledPixels = totalPixels - state.pixelQueue.length;

        elements.levelNumber.textContent = state.currentLevel + 1;
        elements.progressCurrent.textContent = filledPixels;
        elements.progressTotal.textContent = totalPixels || 0;

        const progress = totalPixels > 0 ? (filledPixels / totalPixels) * 100 : 0;
        elements.progressFill.style.width = progress + '%';

        elements.statContributions.textContent = state.totalContributions.toLocaleString();
        elements.statResolution.textContent = (level?.height || 8) + 'px';

        // Simulate random online count
        elements.statOnline.textContent = Math.floor(Math.random() * 5) + 1;

        // Update mode indicator
        const isAddMode = level?.mode === 'add';
        elements.modeDot.classList.toggle('refine', !isAddMode);
        elements.modeText.textContent = isAddMode ? 'Adding pixels' : 'Refining edges';
    }

    function countFilledPixels() {
        let count = 0;
        for (let r = 0; r < state.canvasState.length; r++) {
            for (let c = 0; c < (state.canvasState[r]?.length || 0); c++) {
                if (state.canvasState[r][c] >= CONFIG.redrawThreshold) {
                    count++;
                }
            }
        }
        return count;
    }

    function showContribution(pixel) {
        const level = CONFIG.levels[state.currentLevel];
        const isAdd = level?.mode === 'add';

        elements.contributionText.textContent = `${isAdd ? '+' : '−'} Pixel [${pixel.row}, ${pixel.col}]`;
        elements.contributionText.classList.toggle('refine', !isAdd);
        elements.contributionPanel.classList.add('visible');

        // Hide after 3 seconds
        clearTimeout(elements.contributionPanel.hideTimeout);
        elements.contributionPanel.hideTimeout = setTimeout(() => {
            elements.contributionPanel.classList.remove('visible');
        }, 3000);
    }

    function addActivity(message, isEnhance = false) {
        const item = document.createElement('div');
        item.className = 'activity-item' + (isEnhance ? ' enhance' : '');
        item.textContent = message;

        elements.activityFeed.insertBefore(item, elements.activityFeed.firstChild);

        // Keep only last 5 items
        while (elements.activityFeed.children.length > 5) {
            elements.activityFeed.removeChild(elements.activityFeed.lastChild);
        }

        // Remove after animation
        setTimeout(() => {
            if (item.parentNode) {
                item.parentNode.removeChild(item);
            }
        }, 8000);
    }

    // === UTILITIES ===
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // === START ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
