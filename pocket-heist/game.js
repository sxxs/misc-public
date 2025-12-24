// ==================== POCKET HEIST - GAME.JS ====================
// Version mit Mobile-Optimierungen

const VERSION = '2.3.0';

// Version-Logging für Debugging
console.log(`Pocket Heist v${VERSION}`);

// ==================== CONSTANTS ====================
const GRID_WIDTH = 12;
const GRID_HEIGHT = 18;
const BASE_TILE_SIZE = 40;
const MAX_BUDGET = 20;

const TOOL_COSTS = {
    wall: 0,
    guard: 3,
    camera: 2,
    trap: 1,
    vault: 0,
    start: 0,
    erase: 0
};

// ==================== STATE ====================
let gameMode = null; // 'architect', 'infiltrator', 'replay'
let currentTool = 'wall';
let budget = MAX_BUDGET;
let audioStarted = false;
let codeModalType = null;

// Viewport/Camera state for panning
let viewport = {
    x: 0,  // offset in pixels
    y: 0,
    scale: 1,
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0
};
let TILE_SIZE = BASE_TILE_SIZE; // Dynamic based on screen size

// Level data
let level = {
    walls: new Set(),
    guards: [],
    cameras: [],
    traps: new Set(),
    vault: null,
    start: null,
    musicSeed: Math.floor(Math.random() * 10000)
};

// Infiltrator state
let player = {
    x: 0, y: 0,
    path: [], // A* path to follow
    pathIndex: 0,
    moving: false,
    sneaking: false,
    throwing: false
};
let sneakTimer = 0;
const SNEAK_DURATION = 5.0; // 5 seconds
let detectionLevel = 0;
let gameOver = false;
let won = false;
let inputLog = [];
let gameTime = 0;
let trapTimer = 0; // Time spent on a trap tile

// Ability limits
let throwsRemaining = 1;
let sneaksRemaining = 1;

// Distraction system
let distractionTarget = null; // {x, y}
let distractionTimer = 0;
const DISTRACTION_DURATION = 2.0; // seconds

// Guard state
let guardStates = [];

// Pathfinding for placing guard routes
let guardPathMode = null; // { guardIndex, waypoints: [] }

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== PAN HINT ====================
function showPanHint() {
    // Only show once per session
    if (sessionStorage.getItem('pocket-heist-pan-hint-shown')) return;

    const hint = document.getElementById('panHint');
    if (hint && shouldAllowPan()) {
        hint.classList.remove('hidden');
        sessionStorage.setItem('pocket-heist-pan-hint-shown', 'true');

        // Auto-hide after animation completes
        setTimeout(() => {
            hint.classList.add('hidden');
        }, 3000);
    }
}

// ==================== AUDIO SYSTEM (Tone.js) ====================
let reverb, delay, filter;
let currentMusicStyle = 'ambient';
let allLoops = [];

// Instruments
let padSynth, bassSynth, pluckSynth, tickSynth, pulseSynth, arpSynth;

// SFX Synths
let clickSynth, alarmSynth, footstepSynth, cameraCreakSynth;

async function initAudio() {
    if (audioStarted) return;
    await Tone.start();
    audioStarted = true;

    // Effects chain
    reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
    delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);
    delay.wet.value = 0.2;
    filter = new Tone.Filter(800, "lowpass").connect(delay);

    // Pad synth for ambient drones
    padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }
    }).connect(filter);
    padSynth.volume.value = -18;

    // Deep bass
    bassSynth = new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        filter: { type: "lowpass", frequency: 150, Q: 1 },
        envelope: { attack: 0.5, decay: 0.3, sustain: 0.6, release: 2 }
    }).toDestination();
    bassSynth.volume.value = -15;

    // Pluck for tension
    pluckSynth = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 2000,
        resonance: 0.98
    }).connect(reverb);
    pluckSynth.volume.value = -10;

    // Ticking clock for tension
    tickSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 16,
        resonance: 1000,
        octaves: 1.5
    }).toDestination();
    tickSynth.volume.value = -25;

    // Pulse synth for heartbeat
    pulseSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }
    }).toDestination();
    pulseSynth.volume.value = -20;

    // Arpeggio synth for spy theme
    arpSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
    }).connect(reverb);
    arpSynth.volume.value = -12;

    // === SFX SYNTHS ===

    // Click confirmation
    clickSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    }).toDestination();
    clickSynth.volume.value = -15;

    // Alarm sound
    alarmSynth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 }
    }).toDestination();
    alarmSynth.volume.value = -10;

    // Footsteps
    footstepSynth = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.02 }
    }).toDestination();
    footstepSynth.volume.value = -20;

    // Camera creak
    cameraCreakSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0, release: 0.1 }
    }).toDestination();
    cameraCreakSynth.volume.value = -25;

    Tone.Transport.start();
}

// === SFX FUNCTIONS ===
function playClickSFX() {
    if (!audioStarted || currentMusicStyle === 'off') return;
    clickSynth?.triggerAttackRelease("C5", "32n");
}

function playAlarmSFX() {
    if (!audioStarted) return;
    // Alternating alarm tones
    const now = Tone.now();
    alarmSynth?.triggerAttackRelease("A4", "8n", now);
    alarmSynth?.triggerAttackRelease("E4", "8n", now + 0.15);
    alarmSynth?.triggerAttackRelease("A4", "8n", now + 0.3);
    alarmSynth?.triggerAttackRelease("E4", "8n", now + 0.45);
}

// Detection warning - pulsing alarm while in cone
let lastDetectionWarningTime = 0;
function playDetectionWarning() {
    if (!audioStarted) return;
    const now = Date.now();
    // Play every 200ms while being detected
    if (now - lastDetectionWarningTime > 200) {
        alarmSynth?.triggerAttackRelease("A5", "32n");
        lastDetectionWarningTime = now;
    }
}

// Victory fanfare - triumphant ascending arpeggio
function playVictoryFanfare() {
    if (!audioStarted) return;
    const now = Tone.now();
    // Triumphant C major fanfare
    const notes = ["C4", "E4", "G4", "C5", "E5", "G5", "C6"];
    notes.forEach((note, i) => {
        arpSynth?.triggerAttackRelease(note, "8n", now + i * 0.12);
    });
    // Final chord
    setTimeout(() => {
        padSynth?.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
    }, 900);
}

// Defeat music - sad descending tones that mock
function playDefeatMusic() {
    if (!audioStarted) return;
    const now = Tone.now();
    // Sad "wah wah wah wahhh" trombone-style
    const notes = ["G4", "F#4", "F4", "E4"];
    const durations = ["8n", "8n", "8n", "2n"];
    notes.forEach((note, i) => {
        const time = now + i * 0.4;
        bassSynth?.triggerAttackRelease(note, durations[i], time);
    });
    // Extra mocking low note
    setTimeout(() => {
        bassSynth?.triggerAttackRelease("C3", "1n");
    }, 1800);
}

let lastFootstepTime = 0;
function playFootstepSFX(isGuard = false) {
    if (!audioStarted || currentMusicStyle === 'off') return;
    const now = Date.now();
    const interval = isGuard ? 400 : 300;
    if (now - lastFootstepTime > interval) {
        footstepSynth?.triggerAttackRelease("8n");
        lastFootstepTime = now;
    }
}

let lastGuardFootstepTime = 0;
function playGuardFootstepSFX() {
    if (!audioStarted || currentMusicStyle === 'off') return;
    const now = Date.now();
    if (now - lastGuardFootstepTime > 500) {
        footstepSynth?.triggerAttackRelease("16n");
        lastGuardFootstepTime = now;
    }
}

let lastCameraCreakTime = 0;
function playCameraCreakSFX() {
    if (!audioStarted || currentMusicStyle === 'off') return;
    const now = Date.now();
    if (now - lastCameraCreakTime > 2000) {
        cameraCreakSynth?.triggerAttackRelease("G3", "4n");
        lastCameraCreakTime = now;
    }
}

function changeMusicStyle(style) {
    currentMusicStyle = style;
    updateMusicToggleUI();
    if (gameMode === 'architect') {
        setAudioMode('architect');
    } else if (gameMode === 'infiltrator' || gameMode === 'replay') {
        setAudioMode('infiltrator');
    }
}

// Cycle through music styles: ambient → tense → off → ambient
function cycleMusicStyle() {
    const styles = ['ambient', 'tense', 'off'];
    const currentIndex = styles.indexOf(currentMusicStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    changeMusicStyle(styles[nextIndex]);
}

function updateMusicToggleUI() {
    const toggle = document.getElementById('musicToggle');
    const icon = document.getElementById('musicIcon');
    const label = document.getElementById('musicLabel');
    if (!toggle) return;

    const labels = { ambient: 'Ambient', tense: 'Spannend', off: 'Aus' };
    const icons = { ambient: '🎵', tense: '🎶', off: '🔇' };

    label.textContent = labels[currentMusicStyle] || 'Ambient';
    icon.textContent = icons[currentMusicStyle] || '🎵';
    toggle.classList.toggle('active', currentMusicStyle !== 'off');
}

function setAudioMode(mode) {
    if (!audioStarted) return;

    // Stop all existing loops
    allLoops.forEach(loop => loop.stop());
    allLoops = [];
    padSynth?.releaseAll();
    bassSynth?.triggerRelease();
    arpSynth?.releaseAll();

    if (currentMusicStyle === 'off') return;

    if (mode === 'architect') {
        Tone.Transport.bpm.value = 90;

        if (currentMusicStyle === 'ambient') {
            // Calm, minimal ambient - just evolving pad chords
            const chords = [
                ["C3", "G3", "E4"],
                ["A2", "E3", "C4"],
                ["F3", "C4", "A4"],
                ["G3", "D4", "B4"]
            ];
            let chordIndex = 0;

            const padLoop = new Tone.Loop(time => {
                padSynth.triggerAttackRelease(chords[chordIndex], "2m", time);
                chordIndex = (chordIndex + 1) % chords.length;
            }, "2m");
            padLoop.start(0);
            allLoops.push(padLoop);

        } else if (currentMusicStyle === 'tense') {
            // Rhythmic arpeggio
            const arpNotes = ["C4", "E4", "G4", "B4", "G4", "E4"];
            let arpIdx = 0;
            const arpLoop = new Tone.Loop(time => {
                arpSynth.triggerAttackRelease(arpNotes[arpIdx], "16n", time);
                arpIdx = (arpIdx + 1) % arpNotes.length;
            }, "8n");
            arpLoop.start(0);
            allLoops.push(arpLoop);

            const bassLoop = new Tone.Loop(time => {
                bassSynth.triggerAttackRelease("C2", "2n", time);
            }, "1m");
            bassLoop.start(0);
            allLoops.push(bassLoop);
        }

    } else if (mode === 'infiltrator') {
        Tone.Transport.bpm.value = 120;

        if (currentMusicStyle === 'ambient') {
            // Dark, mysterious drone
            const droneLoop = new Tone.Loop(time => {
                padSynth.triggerAttackRelease(["D2", "A2", "F3"], "4m", time);
            }, "4m");
            droneLoop.start(0);
            allLoops.push(droneLoop);

            // Occasional high tension notes
            const tensionNotes = ["F5", "Eb5", "Ab5", "D5"];
            const tensionLoop = new Tone.Loop(time => {
                if (Math.random() < 0.25) {
                    const note = tensionNotes[Math.floor(Math.random() * tensionNotes.length)];
                    pluckSynth.triggerAttack(note, time);
                }
            }, "2n");
            tensionLoop.start(0);
            allLoops.push(tensionLoop);

        } else if (currentMusicStyle === 'tense') {
            // SPY THEME - Fast arpeggio + driving bass + tension

            // James Bond style arpeggio pattern (Dm)
            const spyArp = ["D4", "F4", "A4", "D5", "A4", "F4", "D4", "E4"];
            let spyIdx = 0;
            const spyArpLoop = new Tone.Loop(time => {
                arpSynth.triggerAttackRelease(spyArp[spyIdx], "16n", time);
                spyIdx = (spyIdx + 1) % spyArp.length;
            }, "16n");
            spyArpLoop.start(0);
            allLoops.push(spyArpLoop);

            // Driving bass line
            const bassLine = ["D2", "D2", "F2", "G2", "A2", "G2", "F2", "E2"];
            let bassIdx = 0;
            const drivingBass = new Tone.Loop(time => {
                bassSynth.triggerAttackRelease(bassLine[bassIdx], "8n", time);
                bassIdx = (bassIdx + 1) % bassLine.length;
            }, "4n");
            drivingBass.start(0);
            allLoops.push(drivingBass);

            // Kick drum pulse
            const kickLoop = new Tone.Loop(time => {
                pulseSynth.triggerAttackRelease("D1", "16n", time);
            }, "4n");
            kickLoop.start(0);
            allLoops.push(kickLoop);

            // High staccato tension stabs
            const stabNotes = ["Bb5", "A5", "F5"];
            let stabIdx = 0;
            const stabLoop = new Tone.Loop(time => {
                if (Math.random() < 0.3) {
                    arpSynth.triggerAttackRelease(stabNotes[stabIdx], "32n", time);
                    stabIdx = (stabIdx + 1) % stabNotes.length;
                }
            }, "2n");
            stabLoop.start(0);
            allLoops.push(stabLoop);
        }
    }
}

function stopAudio() {
    if (!audioStarted) return;
    allLoops.forEach(loop => loop.stop());
    allLoops = [];
    padSynth?.releaseAll();
    bassSynth?.triggerRelease();
    arpSynth?.releaseAll();
}

// ==================== PATHFINDING (A*) ====================
function findPath(startX, startY, endX, endY) {
    const key = (x, y) => `${x},${y}`;
    const isWalkable = (x, y) => {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
        return !level.walls.has(key(x, y));
    };

    if (!isWalkable(startX, startY) || !isWalkable(endX, endY)) return null;

    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.x === endX && current.y === endY) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        closedSet.add(key(current.x, current.y));

        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const n of neighbors) {
            if (!isWalkable(n.x, n.y) || closedSet.has(key(n.x, n.y))) continue;

            const g = current.g + 1;
            const h = Math.abs(n.x - endX) + Math.abs(n.y - endY);
            const f = g + h;

            const existing = openSet.find(o => o.x === n.x && o.y === n.y);
            if (existing) {
                if (g < existing.g) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            } else {
                openSet.push({ x: n.x, y: n.y, g, h, f, parent: current });
            }
        }
    }

    return null;
}

function canSolveLevel() {
    if (!level.start || !level.vault) return false;
    return findPath(level.start.x, level.start.y, level.vault.x, level.vault.y) !== null;
}

// ==================== CANVAS SETUP ====================
function resizeCanvas() {
    // Canvas fills entire screen
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Set canvas to screen size (for crisp rendering, use device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = screenW * dpr;
    canvas.height = screenH * dpr;
    canvas.style.width = screenW + 'px';
    canvas.style.height = screenH + 'px';

    // Scale context for high DPI
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate tile size to fit grid nicely
    // IMPROVED: Reduced minimum to 28px for small screens
    const minDisplayTileSize = 28;

    // Calculate what tile size would fit the grid on screen
    const fitTileSizeX = screenW / GRID_WIDTH;
    const fitTileSizeY = screenH / GRID_HEIGHT;
    const fitTileSize = Math.min(fitTileSizeX, fitTileSizeY);

    // If grid fits comfortably, center it. Otherwise allow panning.
    if (fitTileSize >= minDisplayTileSize) {
        // Grid fits on screen - use fitting tile size, center the grid
        TILE_SIZE = fitTileSize;
        viewport.x = 0;
        viewport.y = 0;
    } else {
        // Grid too big for screen - use minimum tile size, allow pan
        TILE_SIZE = minDisplayTileSize;
        clampViewport();
    }
}

function clampViewport() {
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Max scroll = grid size - screen size (can't scroll past edges)
    const maxX = Math.max(0, gridPixelWidth - screenW);
    const maxY = Math.max(0, gridPixelHeight - screenH);

    // IMPROVED: Smoother clamping with small margin
    viewport.x = Math.max(0, Math.min(maxX, viewport.x));
    viewport.y = Math.max(0, Math.min(maxY, viewport.y));
}

function shouldAllowPan() {
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    return gridPixelWidth > window.innerWidth || gridPixelHeight > window.innerHeight;
}

// ==================== RENDERING ====================
function render() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Clear entire visible area
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, screenW, screenH);

    // Save context and apply viewport transform
    ctx.save();
    ctx.translate(-viewport.x, -viewport.y);

    // Grid lines
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
    }

    // Vision cones (draw before other elements)
    if (gameMode === 'infiltrator' || gameMode === 'replay') {
        drawVisionCones();
    }

    // Traps
    level.traps.forEach(key => {
        const [x, y] = key.split(',').map(Number);

        // Check if player is on this trap (in infiltrator mode)
        const playerOnTrap = (gameMode === 'infiltrator' || gameMode === 'replay') &&
            Math.round(player.x) === x && Math.round(player.y) === y;

        if (playerOnTrap) {
            // Pulsing red when triggered
            const pulse = 0.5 + Math.sin(gameTime * 10) * 0.3;
            ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
        } else {
            ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
        }
        ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = playerOnTrap ? '#ff4444' : '#ffc832';
        ctx.font = `${Math.floor(TILE_SIZE * 0.5)}px serif`;
        ctx.fillText('🔔', x * TILE_SIZE + TILE_SIZE * 0.25, y * TILE_SIZE + TILE_SIZE * 0.7);
    });

    // Walls
    ctx.fillStyle = '#3a3a4a';
    level.walls.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        // Brick pattern
        ctx.strokeStyle = '#2a2a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    });

    // Start point
    if (level.start) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.fillRect(level.start.x * TILE_SIZE, level.start.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#00d4ff';
        ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px serif`;
        ctx.fillText('🚪', level.start.x * TILE_SIZE + TILE_SIZE * 0.2, level.start.y * TILE_SIZE + TILE_SIZE * 0.75);
    }

    // Vault
    if (level.vault) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.fillRect(level.vault.x * TILE_SIZE, level.vault.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#d4af37';
        ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px serif`;
        ctx.fillText('💰', level.vault.x * TILE_SIZE + TILE_SIZE * 0.2, level.vault.y * TILE_SIZE + TILE_SIZE * 0.75);
    }

    // Cameras
    (level.cameras || []).forEach((cam, i) => {
        if (!cam) return;
        ctx.save();
        ctx.translate(cam.x * TILE_SIZE + TILE_SIZE / 2, cam.y * TILE_SIZE + TILE_SIZE / 2);
        ctx.rotate(cam.angle || 0);
        ctx.fillStyle = '#666';
        ctx.font = `${Math.floor(TILE_SIZE * 0.5)}px serif`;
        ctx.fillText('📷', -TILE_SIZE * 0.3, TILE_SIZE * 0.2);
        ctx.restore();
    });

    // Guards
    (level.guards || []).forEach((guard, i) => {
        if (!guard) return;
        const state = guardStates[i] || { x: guard.x, y: guard.y, angle: 0 };
        ctx.fillStyle = '#c33';
        ctx.beginPath();
        ctx.arc(
            state.x * TILE_SIZE + TILE_SIZE / 2,
            state.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 3,
            0, Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(TILE_SIZE * 0.4)}px serif`;
        ctx.fillText('👮', state.x * TILE_SIZE + TILE_SIZE * 0.3, state.y * TILE_SIZE + TILE_SIZE * 0.7);

        // Draw patrol path in architect mode
        if (gameMode === 'architect' && guard.waypoints && guard.waypoints.length > 0) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(guard.x * TILE_SIZE + TILE_SIZE / 2, guard.y * TILE_SIZE + TILE_SIZE / 2);
            guard.waypoints.forEach(wp => {
                if (wp) ctx.lineTo(wp.x * TILE_SIZE + TILE_SIZE / 2, wp.y * TILE_SIZE + TILE_SIZE / 2);
            });
            ctx.lineTo(guard.x * TILE_SIZE + TILE_SIZE / 2, guard.y * TILE_SIZE + TILE_SIZE / 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    // Player (infiltrator mode)
    if (gameMode === 'infiltrator' || gameMode === 'replay') {
        const px = player.x * TILE_SIZE + TILE_SIZE / 2;
        const py = player.y * TILE_SIZE + TILE_SIZE / 2;

        // Draw throw range when in throw mode
        if (player.throwing && throwsRemaining > 0) {
            const playerTileX = Math.round(player.x);
            const playerTileY = Math.round(player.y);

            for (let tx = 0; tx < GRID_WIDTH; tx++) {
                for (let ty = 0; ty < GRID_HEIGHT; ty++) {
                    const dist = getManhattanDistance(playerTileX, playerTileY, tx, ty);
                    if (dist <= 4 && dist > 0) {
                        ctx.fillStyle = 'rgba(255, 200, 50, 0.2)';
                        ctx.fillRect(tx * TILE_SIZE + 2, ty * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }
        }

        ctx.fillStyle = player.sneaking ? '#2a8' : '#2af';
        ctx.beginPath();
        ctx.arc(px, py, player.sneaking ? TILE_SIZE / 4 : TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = `${player.sneaking ? Math.floor(TILE_SIZE * 0.3) : Math.floor(TILE_SIZE * 0.4)}px serif`;
        ctx.fillText('🕵️', px - TILE_SIZE * 0.2, py + TILE_SIZE * 0.1);
    }

    // Draw distraction target
    if (distractionTarget && distractionTimer > 0) {
        const dtx = distractionTarget.x * TILE_SIZE + TILE_SIZE / 2;
        const dty = distractionTarget.y * TILE_SIZE + TILE_SIZE / 2;

        // Pulsing circle
        const pulse = 0.5 + Math.sin(gameTime * 8) * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 50, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dtx, dty, TILE_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Stone icon
        ctx.fillStyle = '#888';
        ctx.font = `${Math.floor(TILE_SIZE * 0.4)}px serif`;
        ctx.fillText('🪨', dtx - TILE_SIZE * 0.2, dty + TILE_SIZE * 0.15);

        // Timer indicator
        ctx.fillStyle = '#ffc832';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(distractionTimer.toFixed(1) + 's', dtx - 10, dty - TILE_SIZE * 0.5);
    }

    // Guard path placement mode indicator
    if (guardPathMode) {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText(`Wegpunkt ${guardPathMode.waypoints.length + 1}/2 setzen (oder Wache erneut tippen)`, 10, 20);
    }

    // Camera direction mode indicator
    if (cameraDirectionMode !== null) {
        const cam = level.cameras[cameraDirectionMode.cameraIndex];
        if (cam) {
            ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
            ctx.font = '14px JetBrains Mono';
            ctx.fillText('Klicke auf ein benachbartes Feld für die Kamera-Richtung', 10, 20);

            // Highlight adjacent cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cam.x + dx;
                    const ny = cam.y + dy;
                    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                        ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
                        ctx.fillRect(nx * TILE_SIZE + 2, ny * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }
        }
    }

    // Restore context before drawing UI elements (they should be screen-fixed)
    ctx.restore();

    // Sneak timer display (screen-fixed)
    if ((gameMode === 'infiltrator' || gameMode === 'replay') && player.sneaking && sneakTimer > 0) {
        ctx.fillStyle = 'rgba(40, 170, 136, 0.9)';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText(`🦶 ${sneakTimer.toFixed(1)}s`, screenW - 80, 30);
    }

    // Detection indicator (screen-fixed)
    if (gameMode === 'infiltrator' && detectionLevel > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${detectionLevel})`;
        ctx.fillRect(0, 0, screenW, 5);
    }
}

// Raycast: Finde die Distanz bis zur nächsten Wand in einer Richtung
function raycastToWall(startX, startY, angle, maxDist) {
    const step = 0.2; // Schrittgröße in Tiles
    let dist = 0;

    while (dist < maxDist) {
        dist += step;
        const checkX = startX + Math.cos(angle) * dist;
        const checkY = startY + Math.sin(angle) * dist;
        const tileX = Math.floor(checkX);
        const tileY = Math.floor(checkY);

        if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) {
            return dist;
        }

        if (level.walls.has(`${tileX},${tileY}`)) {
            return dist - step; // Einen Schritt zurück (vor der Wand)
        }
    }
    return maxDist;
}

function drawVisionCones() {
    const numRays = 40; // Anzahl der Strahlen pro Cone

    // Guard vision cones
    guardStates.forEach((state, i) => {
        if (!state || !level.guards[i]) return;
        const cx = state.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = state.y * TILE_SIZE + TILE_SIZE / 2;
        const baseAngle = state.angle || 0;
        const coneAngle = Math.PI / 3;
        const maxRange = 4; // in Tiles

        const detected = isPlayerInCone(state.x, state.y, baseAngle, maxRange, coneAngle);

        // Berechne Cone-Punkte mit Raycasting
        const points = [];
        for (let j = 0; j <= numRays; j++) {
            const rayAngle = baseAngle - coneAngle / 2 + (coneAngle * j / numRays);
            const dist = raycastToWall(state.x, state.y, rayAngle, maxRange);
            points.push({
                x: Math.cos(rayAngle) * dist * TILE_SIZE,
                y: Math.sin(rayAngle) * dist * TILE_SIZE
            });
        }

        // Zeichne Cone als Polygon
        ctx.save();
        ctx.translate(cx, cy);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRange * TILE_SIZE);
        if (detected) {
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 100, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });

    // Camera vision cones
    level.cameras.forEach(cam => {
        if (!cam) return;
        const cx = cam.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = cam.y * TILE_SIZE + TILE_SIZE / 2;
        const baseAngle = cam.angle || 0;
        const coneAngle = Math.PI / 4;
        const maxRange = 5; // in Tiles

        const detected = isPlayerInCone(cam.x, cam.y, baseAngle, maxRange, coneAngle);

        // Berechne Cone-Punkte mit Raycasting
        const points = [];
        for (let j = 0; j <= numRays; j++) {
            const rayAngle = baseAngle - coneAngle / 2 + (coneAngle * j / numRays);
            const dist = raycastToWall(cam.x, cam.y, rayAngle, maxRange);
            points.push({
                x: Math.cos(rayAngle) * dist * TILE_SIZE,
                y: Math.sin(rayAngle) * dist * TILE_SIZE
            });
        }

        // Zeichne Cone als Polygon
        ctx.save();
        ctx.translate(cx, cy);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRange * TILE_SIZE);
        if (detected) {
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(100, 255, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(100, 255, 100, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// Check if line of sight is blocked by walls (Bresenham-style)
function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let cx = Math.round(x1);
    let cy = Math.round(y1);
    const targetX = Math.round(x2);
    const targetY = Math.round(y2);

    while (cx !== targetX || cy !== targetY) {
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            cx += sx;
        }
        if (e2 < dx) {
            err += dx;
            cy += sy;
        }

        // Check if this cell is a wall (but not the target cell)
        if ((cx !== targetX || cy !== targetY) && level.walls.has(`${cx},${cy}`)) {
            return false;
        }
    }
    return true;
}

function isPlayerInCone(entityX, entityY, angle, range, coneAngle) {
    if (entityX === undefined || entityY === undefined) return false;
    if (player.x === undefined || player.y === undefined) return false;

    const dx = player.x - entityX;
    const dy = player.y - entityY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > range) return false;
    if (player.sneaking && dist > range / 2) return false;

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = angleToPlayer - (angle || 0);
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) >= coneAngle / 2) return false;

    // Check line of sight (wall blocking)
    if (!hasLineOfSight(entityX, entityY, player.x, player.y)) {
        return false;
    }

    return true;
}

// ==================== GAME LOGIC ====================
function updateGame(dt) {
    if ((gameMode !== 'infiltrator' && gameMode !== 'replay') || gameOver || won) return;

    // Handle replay playback
    if (gameMode === 'replay' && replayPlaying) {
        dt *= replaySpeed;
    }

    gameTime += dt;

    // Process replay inputs
    if (gameMode === 'replay' && replayPlaying) {
        const currentTimeMs = gameTime * 1000;
        while (replayIndex < replayInputs.length) {
            const input = replayInputs[replayIndex];
            if (input[0] <= currentTimeMs) {
                executeReplayInput(input);
                replayIndex++;
            } else {
                break;
            }
        }
    }

    // Update distraction timer
    if (distractionTimer > 0) {
        distractionTimer -= dt;
        if (distractionTimer <= 0) {
            distractionTarget = null;
        }
    }

    // Update guards
    guardStates.forEach((state, i) => {
        if (!state) return;
        const guard = level.guards[i];
        if (!guard) return;

        // Check if distracted
        if (distractionTarget && distractionTimer > 0) {
            // Check if distraction is in guard's range (5 tiles)
            const distToDist = getManhattanDistance(state.x, state.y, distractionTarget.x, distractionTarget.y);
            if (distToDist <= 5) {
                // Look at distraction, don't move
                const dx = distractionTarget.x - state.x;
                const dy = distractionTarget.y - state.y;
                state.angle = Math.atan2(dy, dx);
                return; // Skip normal patrol
            }
        }

        // Normal patrol logic
        if (guard.waypoints && guard.waypoints.length > 0) {
            // Build full waypoint list: start -> waypoints (loops back to start)
            const waypoints = [
                { x: guard.x, y: guard.y },
                ...guard.waypoints
            ];

            // Ensure valid index
            if (state.waypointIndex === undefined || state.waypointIndex < 0) {
                state.waypointIndex = 0;
            }

            // Get next waypoint target (loop through waypoints)
            const nextWaypointIdx = (state.waypointIndex + 1) % waypoints.length;
            const waypointTarget = waypoints[nextWaypointIdx];

            if (!waypointTarget) {
                state.angle += dt * 0.5;
                return;
            }

            // Check if we need to compute A* path to waypoint
            const currentTileX = Math.round(state.x);
            const currentTileY = Math.round(state.y);

            if (!state.currentPath || state.currentPath.length === 0 ||
                state.pathTargetX !== waypointTarget.x || state.pathTargetY !== waypointTarget.y) {
                // Compute new A* path to waypoint
                const path = findPath(currentTileX, currentTileY, waypointTarget.x, waypointTarget.y);
                if (path && path.length > 1) {
                    state.currentPath = path;
                    state.pathIndex = 1; // Start from index 1 (0 is current position)
                    state.pathTargetX = waypointTarget.x;
                    state.pathTargetY = waypointTarget.y;
                } else {
                    // No valid path, skip to next waypoint
                    state.waypointIndex = nextWaypointIdx;
                    state.currentPath = null;
                    return;
                }
            }

            // Follow A* path
            if (state.currentPath && state.pathIndex < state.currentPath.length) {
                const pathNode = state.currentPath[state.pathIndex];
                const dx = pathNode.x - state.x;
                const dy = pathNode.y - state.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 0.1) {
                    // Reached path node, move to next
                    state.x = pathNode.x;
                    state.y = pathNode.y;
                    state.pathIndex++;
                    playGuardFootstepSFX();

                    // Check if reached final waypoint
                    if (state.pathIndex >= state.currentPath.length) {
                        state.waypointIndex = nextWaypointIdx;
                        state.currentPath = null;
                    }
                } else {
                    const speed = 1.5 * dt;
                    state.x += (dx / dist) * speed;
                    state.y += (dy / dist) * speed;
                    state.angle = Math.atan2(dy, dx);
                    if (Math.random() < 0.02) playGuardFootstepSFX();
                }
            }
        } else {
            // Just rotate if no waypoints
            state.angle += dt * 0.5;
        }
    });

    // Update cameras (oscillate or look at distraction)
    let camerasMoved = false;
    level.cameras.forEach(cam => {
        if (!cam) return;
        if (cam.baseAngle === undefined) cam.baseAngle = 0;

        const oldAngle = cam.angle;

        // Check if distracted
        if (distractionTarget && distractionTimer > 0) {
            const distToDist = getManhattanDistance(cam.x, cam.y, distractionTarget.x, distractionTarget.y);
            if (distToDist <= 6) {
                // Look at distraction
                const dx = distractionTarget.x - cam.x;
                const dy = distractionTarget.y - cam.y;
                cam.angle = Math.atan2(dy, dx);
                if (Math.abs(cam.angle - oldAngle) > 0.1) camerasMoved = true;
                return;
            }
        }

        // Normal oscillation
        cam.angle = cam.baseAngle + Math.sin(gameTime * 0.5) * (Math.PI / 4);
        if (Math.abs(cam.angle - oldAngle) > 0.05) camerasMoved = true;
    });

    if (camerasMoved) playCameraCreakSFX();

    // Check detection
    let detected = false;

    guardStates.forEach((state, i) => {
        if (state && level.guards[i] && isPlayerInCone(state.x, state.y, state.angle, 4, Math.PI / 3)) {
            detected = true;
        }
    });

    level.cameras.forEach(cam => {
        if (cam && isPlayerInCone(cam.x, cam.y, cam.angle, 5, Math.PI / 4)) {
            detected = true;
        }
    });

    // Check if player is on a trap
    const playerTileX = Math.round(player.x);
    const playerTileY = Math.round(player.y);
    const trapKey = `${playerTileX},${playerTileY}`;

    if (level.traps && level.traps.has(trapKey)) {
        trapTimer += dt;
        if (trapTimer >= 0.5) {
            // Trap triggered! Instant detection
            detected = true;
            detectionLevel = 1; // Instant full detection
        }
    } else {
        trapTimer = 0;
    }

    if (detected) {
        detectionLevel += dt * 2; // Fill in 0.5 seconds
        // Play warning alarm while being detected
        playDetectionWarning();
        if (detectionLevel >= 1) {
            if (gameMode === 'replay') {
                // In replay, just stop playing
                gameOver = true;
                showStatus('ENTDECKT!', true);
                replayPlaying = false;
            } else {
                triggerGameOver();
            }
        }
    } else {
        detectionLevel = Math.max(0, detectionLevel - dt);
    }

    // Check win
    if (level.vault && Math.abs(player.x - level.vault.x) < 0.5 && Math.abs(player.y - level.vault.y) < 0.5) {
        if (gameMode === 'replay') {
            won = true;
            showStatus('MISSION ERFOLGREICH!');
            replayPlaying = false;
        } else {
            triggerWin();
        }
    }

    // Update sneak timer
    if (player.sneaking && sneakTimer > 0) {
        sneakTimer -= dt;
        if (sneakTimer <= 0) {
            player.sneaking = false;
            sneakTimer = 0;
            document.getElementById('sneakBtn').classList.remove('active');
            document.getElementById('sneakBtn').classList.add('used');
        }
    }

    // Move player along A* path
    if (player.moving && player.path && player.path.length > 0) {
        const target = player.path[player.pathIndex];
        if (!target) {
            player.moving = false;
            player.path = [];
            player.pathIndex = 0;
        } else {
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.1) {
                player.x = target.x;
                player.y = target.y;
                player.pathIndex++;

                // Play footstep sound
                if (!player.sneaking) {
                    playFootstepSFX(false);
                }

                // Reached end of path
                if (player.pathIndex >= player.path.length) {
                    player.moving = false;
                    player.path = [];
                    player.pathIndex = 0;
                }
            } else {
                const speed = (player.sneaking ? 2 : 4) * dt;
                player.x += (dx / dist) * speed;
                player.y += (dy / dist) * speed;
            }
        }
    }
}

function triggerGameOver() {
    gameOver = true;
    stopAudio();
    playAlarmSFX();
    playDefeatMusic();
    showStatusWithButtons('ENTDECKT!', true);
}

function triggerWin() {
    won = true;
    stopAudio();
    playVictoryFanfare();
    showStatusWithButtons('MISSION ERFOLGREICH!', false);
}

function showStatusWithButtons(text, isAlert) {
    const el = document.getElementById('statusOverlay');
    const replayCode = generateReplayCode();

    el.innerHTML = `
        <div>${text}</div>
        ${replayCode ? `
            <div style="margin-top: 15px; font-size: 0.7rem; color: #888;">
                <div style="margin-bottom: 5px;">Replay-Code:</div>
                <input type="text" value="${replayCode}" readonly
                    style="width: 90%; max-width: 300px; padding: 8px; font-family: monospace; font-size: 0.65rem; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px; text-align: center;"
                    onclick="this.select(); navigator.clipboard?.writeText(this.value);">
                <div style="font-size: 0.5rem; margin-top: 3px; color: #666;">Tippen zum Kopieren</div>
            </div>
        ` : ''}
        <div style="margin-top: 15px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            ${isTestMode ? `
                <button onclick="backToBuild()" style="padding: 10px 20px; font-family: 'Bebas Neue'; font-size: 1.2rem; background: #444; color: #fff; border: none; cursor: pointer;">◀ Zurück zum Bauen</button>
            ` : `
                <button onclick="retryLevel()" style="padding: 10px 20px; font-family: 'Bebas Neue'; font-size: 1.2rem; background: var(--gold); color: #000; border: none; cursor: pointer;">🔄 Nochmal</button>
                <button onclick="backToMenu()" style="padding: 10px 20px; font-family: 'Bebas Neue'; font-size: 1.2rem; background: #444; color: #fff; border: none; cursor: pointer;">✕ Menü</button>
            `}
        </div>
    `;
    el.className = isAlert ? 'alert' : '';
    el.style.display = 'block';
}

function retryLevel() {
    hideStatus();
    // Reset player to start
    player = {
        x: level.start.x,
        y: level.start.y,
        path: [],
        pathIndex: 0,
        moving: false,
        sneaking: false,
        throwing: false
    };
    sneakTimer = 0;

    // Reset guard states
    guardStates = (level.guards || []).map(g => ({
        x: g.x,
        y: g.y,
        angle: 0,
        waypointIndex: 0
    }));

    // Reset game state
    detectionLevel = 0;
    gameOver = false;
    won = false;
    inputLog = [];
    gameTime = 0;
    trapTimer = 0;

    // Reset abilities
    throwsRemaining = 1;
    sneaksRemaining = 1;
    document.getElementById('sneakBtn').classList.remove('active', 'disabled', 'used');
    document.getElementById('throwBtn').classList.remove('active', 'disabled', 'used');
    updateAbilityButtons();

    // Reset distraction state
    distractionTarget = null;
    distractionTimer = 0;

    setAudioMode('infiltrator');
}

// Track if we came from architect test mode
let isTestMode = false;

function returnToArchitectAfterTest() {
    if (isTestMode) {
        // Return to architect mode with same level
        isTestMode = false;
        gameMode = 'architect';
        document.body.className = 'architect';
        document.getElementById('toolbar').style.display = 'flex';
        document.getElementById('budgetDisplay').style.display = 'block';
        document.getElementById('abilityBar').style.display = 'none';

        // Show architect buttons
        document.getElementById('clearBtn').style.display = '';
        document.getElementById('viewCodeBtn').style.display = '';
        document.getElementById('testBtn').style.display = '';
        document.getElementById('backToBuildBtn').style.display = 'none';

        setAudioMode('architect');
    } else {
        // Came from "Mission starten" - show replay share
        showReplayShare();
    }
}

function showReplayShare() {
    const replayCode = generateReplayCode();
    document.getElementById('levelCode').textContent = replayCode;
    document.getElementById('shareModal').style.display = 'flex';
}

function backToBuild() {
    // Return to architect mode from test mode
    isTestMode = false;
    gameMode = 'architect';
    document.body.className = 'architect';
    document.getElementById('toolbar').style.display = 'flex';
    document.getElementById('budgetDisplay').style.display = 'block';
    document.getElementById('abilityBar').style.display = 'none';
    document.getElementById('statusOverlay').style.display = 'none';

    // Show architect buttons
    document.getElementById('clearBtn').style.display = '';
    document.getElementById('viewCodeBtn').style.display = '';
    document.getElementById('testBtn').style.display = '';
    document.getElementById('backToBuildBtn').style.display = 'none';

    setAudioMode('architect');
}

function showLevelCode() {
    if (!level.start || !level.vault) {
        alert('Du musst Start 🚪 und Tresor 💰 platzieren!');
        return;
    }

    if (!canSolveLevel()) {
        alert('Das Level ist nicht lösbar! Es muss einen Weg vom Start zum Tresor geben.');
        return;
    }

    const code = generateLevelCode();
    document.getElementById('levelCode').textContent = code;
    document.getElementById('shareModal').style.display = 'flex';
}

function showStatus(text, isAlert = false) {
    const el = document.getElementById('statusOverlay');
    el.textContent = text;
    el.className = isAlert ? 'alert' : '';
    el.style.display = 'block';
}

function hideStatus() {
    document.getElementById('statusOverlay').style.display = 'none';
}

// ==================== INPUT HANDLING ====================
function getGridPos(e) {
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Screen position + viewport offset = world position
    const worldX = (clientX - rect.left) + viewport.x;
    const worldY = (clientY - rect.top) + viewport.y;

    const x = Math.floor(worldX / TILE_SIZE);
    const y = Math.floor(worldY / TILE_SIZE);

    return { x: Math.max(0, Math.min(GRID_WIDTH - 1, x)), y: Math.max(0, Math.min(GRID_HEIGHT - 1, y)) };
}

function getScreenPos(e) {
    // Get raw screen position without grid snapping (for panning)
    let clientX, clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return { x: clientX, y: clientY };
}

// Drag painting state
let isPainting = false;
let lastPaintedKey = null;

// Camera direction placement state
let cameraDirectionMode = null; // { cameraIndex: number }

// Panning state - IMPROVED for 1-finger panning
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let totalTouchMovement = 0;

// Thresholds for tap vs pan detection
const TAP_MAX_DURATION = 500; // ms - erhöht für bessere Touch-Erkennung
const TAP_MAX_MOVEMENT = 20; // pixels
const PAN_START_THRESHOLD = 15; // pixels before pan mode activates

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle click or shift+click to pan
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        e.preventDefault();
        return;
    }

    const pos = getGridPos(e);
    if (gameMode === 'architect' && (currentTool === 'wall' || currentTool === 'erase')) {
        isPainting = true;
        lastPaintedKey = null;
        handleArchitectPaint(pos);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        viewport.x -= (e.clientX - panStartX);
        viewport.y -= (e.clientY - panStartY);
        clampViewport();

        panStartX = e.clientX;
        panStartY = e.clientY;
        return;
    }

    if (isPainting && gameMode === 'architect') {
        const pos = getGridPos(e);
        handleArchitectPaint(pos);
    }
});

canvas.addEventListener('mouseup', () => {
    isPainting = false;
    isPanning = false;
    lastPaintedKey = null;
});

canvas.addEventListener('mouseleave', () => {
    isPainting = false;
    isPanning = false;
    lastPaintedKey = null;
});

canvas.addEventListener('click', handleCanvasClick);

// Touch events - IMPROVED: 1-finger panning with tap detection
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartTime = Date.now();
    const screenPos = getScreenPos(e);
    touchStartPos = { x: screenPos.x, y: screenPos.y };
    panStartX = screenPos.x;
    panStartY = screenPos.y;
    totalTouchMovement = 0;
    isPanning = false;

    if (e.touches.length === 2) {
        // Two-finger: always pan
        isPanning = true;
        isPainting = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        panStartX = (touch1.clientX + touch2.clientX) / 2;
        panStartY = (touch1.clientY + touch2.clientY) / 2;
        return;
    }

    // Single finger - don't start painting immediately, wait to see if it's a pan
    const pos = getGridPos(e);
    if (gameMode === 'architect' && (currentTool === 'wall' || currentTool === 'erase')) {
        // Don't paint yet - wait for touchmove or touchend to determine action
        lastPaintedKey = null;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
        // Two-finger pan
        isPanning = true;
        isPainting = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;

        viewport.x -= (midX - panStartX);
        viewport.y -= (midY - panStartY);
        clampViewport();

        panStartX = midX;
        panStartY = midY;
        return;
    }

    // Single finger
    const screenPos = getScreenPos(e);
    const dx = screenPos.x - panStartX;
    const dy = screenPos.y - panStartY;
    const movementFromStart = Math.abs(screenPos.x - touchStartPos.x) + Math.abs(screenPos.y - touchStartPos.y);
    totalTouchMovement += Math.abs(dx) + Math.abs(dy);

    // Architect mode: Paint with drag (wall/erase tools)
    if (gameMode === 'architect' && (currentTool === 'wall' || currentTool === 'erase') && !isPanning) {
        isPainting = true;
        const pos = getGridPos(e);
        handleArchitectPaint(pos);
    }
    // Pan mode: Only if grid is larger than screen AND significant movement
    else if (shouldAllowPan() && movementFromStart > PAN_START_THRESHOLD) {
        isPanning = true;
        isPainting = false;

        viewport.x -= dx;
        viewport.y -= dy;
        clampViewport();
    }

    panStartX = screenPos.x;
    panStartY = screenPos.y;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();

    // If there are still touches remaining, don't process yet
    if (e.touches.length > 0) return;

    const wasPanning = isPanning;
    const wasPainting = isPainting;
    const touchDuration = Date.now() - touchStartTime;
    const wasQuickTap = touchDuration < TAP_MAX_DURATION && totalTouchMovement < TAP_MAX_MOVEMENT;
    const wasTapWithoutMove = totalTouchMovement < TAP_MAX_MOVEMENT;

    isPainting = false;
    isPanning = false;
    lastPaintedKey = null;

    // Skip if we were panning
    if (wasPanning) return;

    // Architect mode: wall/erase - handle tap (even if not quick)
    if (gameMode === 'architect' && (currentTool === 'wall' || currentTool === 'erase')) {
        if (wasTapWithoutMove && !wasPainting) {
            const pos = getGridPos(e);
            handleArchitectPaint(pos);
        }
        return;
    }

    // Architect mode: other tools - handle as click
    if (gameMode === 'architect' && wasTapWithoutMove) {
        handleCanvasClick(e);
        return;
    }

    // Infiltrator/Replay mode: any tap without movement is a click
    if ((gameMode === 'infiltrator' || gameMode === 'replay') && wasTapWithoutMove) {
        handleCanvasClick(e);
    }
});

// Touch cancel - reset state
canvas.addEventListener('touchcancel', (e) => {
    isPainting = false;
    isPanning = false;
    lastPaintedKey = null;
    totalTouchMovement = 0;
});

function handleArchitectPaint(pos) {
    const key = `${pos.x},${pos.y}`;
    if (key === lastPaintedKey) return;
    lastPaintedKey = key;

    playClickSFX();

    if (currentTool === 'wall') {
        if (!level.walls.has(key)) {
            level.walls.add(key);
        }
    } else if (currentTool === 'erase') {
        if (level.walls.has(key)) {
            level.walls.delete(key);
        }
        if (level.traps.has(key)) {
            level.traps.delete(key);
            budget += 1;
            updateBudgetDisplay();
        }
        // Lösche Wachen an dieser Position
        const guardIdx = level.guards.findIndex(g => g.x === pos.x && g.y === pos.y);
        if (guardIdx >= 0) {
            level.guards.splice(guardIdx, 1);
            budget += TOOL_COSTS.guard;
            updateBudgetDisplay();
        }
        // Lösche Kameras an dieser Position
        const camIdx = level.cameras.findIndex(c => c.x === pos.x && c.y === pos.y);
        if (camIdx >= 0) {
            level.cameras.splice(camIdx, 1);
            budget += TOOL_COSTS.camera;
            updateBudgetDisplay();
        }
        // Lösche Start/Vault an dieser Position
        if (level.start && level.start.x === pos.x && level.start.y === pos.y) {
            level.start = null;
        }
        if (level.vault && level.vault.x === pos.x && level.vault.y === pos.y) {
            level.vault = null;
        }
    }
}

function handleCanvasClick(e) {
    const pos = getGridPos(e);
    playClickSFX();

    if (gameMode === 'architect') {
        handleArchitectClick(pos);
    } else if (gameMode === 'infiltrator') {
        handleInfiltratorClick(pos);
    }
}

function handleArchitectClick(pos) {
    const key = `${pos.x},${pos.y}`;

    // Camera direction placement mode
    if (cameraDirectionMode !== null) {
        const cam = level.cameras[cameraDirectionMode.cameraIndex];
        if (cam) {
            // Calculate direction from camera to clicked position
            const dx = pos.x - cam.x;
            const dy = pos.y - cam.y;
            // Only accept adjacent cells
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
                cam.baseAngle = Math.atan2(dy, dx);
                cam.angle = cam.baseAngle;
                cameraDirectionMode = null;
                return;
            }
        }
        cameraDirectionMode = null;
        return;
    }

    // Guard path placement mode
    if (guardPathMode) {
        // Check if clicking on the same guard to finish
        const guard = level.guards[guardPathMode.guardIndex];
        if (pos.x === guard.x && pos.y === guard.y) {
            guardPathMode = null;
            return;
        }

        guardPathMode.waypoints.push({ x: pos.x, y: pos.y });
        guard.waypoints = [...guardPathMode.waypoints];

        if (guardPathMode.waypoints.length >= 2) {
            guardPathMode = null;
        }
        return;
    }

    const cost = TOOL_COSTS[currentTool];

    // Wall and erase are handled by paint functions
    if (currentTool === 'wall' || currentTool === 'erase') {
        return;
    }

    if (currentTool === 'guard') {
        if (budget >= cost) {
            // Check if clicking existing guard to set path
            const existingIdx = level.guards.findIndex(g => g.x === pos.x && g.y === pos.y);
            if (existingIdx >= 0) {
                guardPathMode = { guardIndex: existingIdx, waypoints: [] };
                level.guards[existingIdx].waypoints = [];
            } else {
                level.guards.push({ x: pos.x, y: pos.y, waypoints: [] });
                budget -= cost;
                // Immediately enter path mode
                guardPathMode = { guardIndex: level.guards.length - 1, waypoints: [] };
            }
        }
    } else if (currentTool === 'camera') {
        if (budget >= cost) {
            const newCam = { x: pos.x, y: pos.y, angle: 0, baseAngle: 0 };
            level.cameras.push(newCam);
            budget -= cost;
            // Enter direction mode
            cameraDirectionMode = { cameraIndex: level.cameras.length - 1 };
        }
    } else if (currentTool === 'trap') {
        if (budget >= cost && !level.traps.has(key)) {
            level.traps.add(key);
            budget -= cost;
        }
    } else if (currentTool === 'vault') {
        level.vault = { x: pos.x, y: pos.y };
    } else if (currentTool === 'start') {
        level.start = { x: pos.x, y: pos.y };
    }

    updateBudgetDisplay();
}

function handleInfiltratorClick(pos) {
    if (gameOver || won) return;

    // Check if throwing
    if (player.throwing) {
        const playerTileX = Math.round(player.x);
        const playerTileY = Math.round(player.y);
        const dist = getManhattanDistance(playerTileX, playerTileY, pos.x, pos.y);

        if (dist <= 4) {
            throwStone(pos.x, pos.y);
        }
        // If too far, do nothing (player stays in throw mode)
        return;
    }

    // Move to position using A* path
    const path = findPath(Math.round(player.x), Math.round(player.y), pos.x, pos.y);
    if (path && path.length > 1) {
        player.path = path;
        player.pathIndex = 1; // Start from index 1 (index 0 is current position)
        player.moving = true;
        inputLog.push([Math.floor(gameTime * 1000), pos.x, pos.y, 'MOVE']);
    }
}

// ==================== TOOL SELECTION ====================
function selectTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

function toggleThrow() {
    if (throwsRemaining <= 0) return;
    player.throwing = !player.throwing;
    document.getElementById('throwBtn').classList.toggle('active', player.throwing);
}

function toggleSneak() {
    if (sneaksRemaining <= 0) return;
    if (player.sneaking) return; // Can't turn off manually

    // Activate sneak for 5 seconds
    player.sneaking = true;
    sneaksRemaining--;
    sneakTimer = SNEAK_DURATION;
    document.getElementById('sneakBtn').classList.add('active');
    updateAbilityButtons();
    if (gameMode === 'infiltrator') {
        inputLog.push([Math.floor(gameTime * 1000), player.x, player.y, 'SNEAK_ON']);
    }
}

function updateAbilityButtons() {
    const throwBtn = document.getElementById('throwBtn');
    const sneakBtn = document.getElementById('sneakBtn');
    const throwLabel = document.getElementById('throwLabel');
    const sneakLabel = document.getElementById('sneakLabel');

    if (throwLabel) throwLabel.textContent = `Werfen (${throwsRemaining})`;
    if (sneakLabel) sneakLabel.textContent = `Schleichen (${sneaksRemaining})`;

    if (throwsRemaining <= 0) {
        throwBtn.classList.add('used');
        throwBtn.classList.remove('active');
    }
    if (sneaksRemaining <= 0 && !player.sneaking) {
        sneakBtn.classList.add('used');
    }
}

function getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function throwStone(targetX, targetY) {
    const playerTileX = Math.round(player.x);
    const playerTileY = Math.round(player.y);
    const dist = getManhattanDistance(playerTileX, playerTileY, targetX, targetY);

    if (dist > 4) {
        // Too far, show feedback
        return false;
    }

    // Use the throw
    throwsRemaining--;
    player.throwing = false;
    document.getElementById('throwBtn').classList.remove('active');
    updateAbilityButtons();

    // Set distraction target
    distractionTarget = { x: targetX, y: targetY };
    distractionTimer = DISTRACTION_DURATION;

    // Log input
    if (gameMode === 'infiltrator') {
        inputLog.push([Math.floor(gameTime * 1000), targetX, targetY, 'THROW']);
    }

    return true;
}

// ==================== BUDGET ====================
function updateBudgetDisplay() {
    document.getElementById('budgetValue').textContent = budget;
}

// ==================== LEVEL MANAGEMENT ====================
function clearLevel() {
    level = {
        walls: new Set(),
        guards: [],
        cameras: [],
        traps: new Set(),
        vault: null,
        start: null,
        musicSeed: Math.floor(Math.random() * 10000)
    };
    budget = MAX_BUDGET;
    updateBudgetDisplay();
}

function exportLevel() {
    if (!level.start || !level.vault) {
        alert('Du musst Start 🚪 und Tresor 💰 platzieren!');
        return;
    }

    if (!canSolveLevel()) {
        alert('Das Level ist nicht lösbar! Es muss einen Weg vom Start zum Tresor geben.');
        return;
    }

    const code = generateLevelCode();
    document.getElementById('levelCode').textContent = code;
    document.getElementById('shareModal').style.display = 'flex';
}

function generateLevelCode() {
    const data = {
        w: GRID_WIDTH,
        h: GRID_HEIGHT,
        walls: Array.from(level.walls),
        guards: level.guards,
        cameras: level.cameras.map(c => ({ x: c.x, y: c.y, a: c.baseAngle })),
        traps: Array.from(level.traps),
        vault: level.vault,
        start: level.start,
        seed: level.musicSeed
    };

    const json = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return 'PH1-' + compressed;
}

function loadLevelFromCode(code) {
    if (!code.startsWith('PH1-')) {
        alert('Ungültiger Level-Code!');
        return false;
    }

    try {
        const compressed = code.substring(4);
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        const data = JSON.parse(json);

        level = {
            walls: new Set(data.walls),
            guards: data.guards,
            cameras: data.cameras.map(c => ({ x: c.x, y: c.y, angle: c.a, baseAngle: c.a })),
            traps: new Set(data.traps),
            vault: data.vault,
            start: data.start,
            musicSeed: data.seed
        };

        return true;
    } catch (e) {
        alert('Fehler beim Laden des Levels!');
        return false;
    }
}

// Architect mode: Save current level to clipboard
function saveLevelCode() {
    const code = generateLevelCode();
    navigator.clipboard?.writeText(code).then(() => {
        showTemporaryMessage('Level-Code kopiert!');
    }).catch(() => {
        // Fallback: show in prompt
        prompt('Level-Code (kopieren):', code);
    });
}

// Architect mode: Load level from clipboard or prompt
function loadLevelCode() {
    navigator.clipboard?.readText().then(code => {
        if (code && code.startsWith('PH1-')) {
            applyLoadedLevel(code);
        } else {
            promptForLevelCode();
        }
    }).catch(() => {
        promptForLevelCode();
    });
}

function promptForLevelCode() {
    const code = prompt('Level-Code einfügen:');
    if (code) {
        applyLoadedLevel(code);
    }
}

function applyLoadedLevel(code) {
    if (loadLevelFromCode(code)) {
        // Recalculate budget
        const guardCost = level.guards.length * TOOL_COSTS.guard;
        const cameraCost = level.cameras.length * TOOL_COSTS.camera;
        const trapCost = level.traps.size * TOOL_COSTS.trap;
        budget = MAX_BUDGET - guardCost - cameraCost - trapCost;
        updateBudgetDisplay();
        showTemporaryMessage('Level geladen!');
    }
}

function showTemporaryMessage(msg) {
    const el = document.getElementById('statusOverlay');
    el.innerHTML = `<div>${msg}</div>`;
    el.className = '';
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
    }, 1500);
}

function generateReplayCode() {
    const data = {
        level: {
            w: GRID_WIDTH,
            h: GRID_HEIGHT,
            walls: Array.from(level.walls),
            guards: level.guards,
            cameras: level.cameras.map(c => ({ x: c.x, y: c.y, a: c.baseAngle || 0 })),
            traps: Array.from(level.traps),
            vault: level.vault,
            start: level.start,
            seed: level.musicSeed
        },
        inputs: inputLog
    };

    const json = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return 'PHR-' + compressed;
}

// ==================== MODE SWITCHING ====================
async function startArchitect() {
    await initAudio();
    gameMode = 'architect';
    document.body.className = 'architect';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('toolbar').style.display = 'flex';
    document.getElementById('topBar').style.display = 'flex';
    document.getElementById('budgetDisplay').style.display = 'block';
    document.getElementById('abilityBar').style.display = 'none';
    document.getElementById('musicToggle').style.display = 'flex';

    // Show architect buttons
    document.getElementById('clearBtn').style.display = '';
    document.getElementById('viewCodeBtn').style.display = '';
    document.getElementById('testBtn').style.display = '';
    document.getElementById('backToBuildBtn').style.display = 'none';

    // Reset viewport
    viewport.x = 0;
    viewport.y = 0;

    // Don't clear level - preserve previous state
    // User can use "Clear" button to start fresh
    // Recalculate budget based on current level
    const guardCost = level.guards.length * TOOL_COSTS.guard;
    const cameraCost = level.cameras.length * TOOL_COSTS.camera;
    const trapCost = level.traps.size * TOOL_COSTS.trap;
    budget = MAX_BUDGET - guardCost - cameraCost - trapCost;
    updateBudgetDisplay();

    resizeCanvas();
    setAudioMode('architect');
    startGameLoop();

    // Show pan hint if needed
    showPanHint();
}

async function startInfiltrator() {
    if (!level.start || !level.vault) {
        alert('Level ungültig: Start oder Tresor fehlt!');
        return;
    }

    await initAudio();
    gameMode = 'infiltrator';
    document.body.className = 'infiltrator';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('topBar').style.display = 'flex';
    document.getElementById('budgetDisplay').style.display = 'none';
    document.getElementById('abilityBar').style.display = 'flex';
    document.getElementById('musicToggle').style.display = 'flex';

    // Hide architect-only buttons, show infiltrator buttons
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('viewCodeBtn').style.display = 'none';
    document.getElementById('testBtn').style.display = 'none';

    // Show back button only in test mode
    document.getElementById('backToBuildBtn').style.display = isTestMode ? '' : 'none';

    // Reset viewport
    viewport.x = 0;
    viewport.y = 0;

    // Initialize player
    player = {
        x: level.start.x,
        y: level.start.y,
        path: [],
        pathIndex: 0,
        moving: false,
        sneaking: false,
        throwing: false
    };
    sneakTimer = 0;

    // Initialize guard states
    guardStates = (level.guards || []).map(g => ({
        x: g.x,
        y: g.y,
        angle: 0,
        waypointIndex: 0
    }));

    // Reset game state
    detectionLevel = 0;
    gameOver = false;
    won = false;
    inputLog = [];
    gameTime = 0;
    trapTimer = 0;

    // Reset abilities
    throwsRemaining = 1;
    sneaksRemaining = 1;
    distractionTarget = null;
    distractionTimer = 0;

    // Reset ability button states
    document.getElementById('throwBtn').classList.remove('active', 'used', 'disabled');
    document.getElementById('sneakBtn').classList.remove('active', 'used', 'disabled');
    updateAbilityButtons();

    resizeCanvas();
    setAudioMode('infiltrator');
    startGameLoop();

    // Show pan hint if needed
    showPanHint();
}

async function testLevel() {
    if (!level.start || !level.vault) {
        alert('Du musst Start 🚪 und Tresor 💰 platzieren!');
        return;
    }

    if (!canSolveLevel()) {
        alert('Das Level ist nicht lösbar! Es muss einen Weg vom Start zum Tresor geben.');
        return;
    }

    isTestMode = true;
    await startInfiltrator();
}

function backToMenu() {
    gameMode = null;
    stopAudio();
    document.body.className = '';
    document.getElementById('menuScreen').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('shareModal').style.display = 'none';
    document.getElementById('musicToggle').style.display = 'none';
    document.getElementById('statusOverlay').style.display = 'none';

    // Reset button visibility
    document.getElementById('clearBtn').style.display = '';
    document.getElementById('viewCodeBtn').style.display = '';
    document.getElementById('testBtn').style.display = '';
    document.getElementById('backToBuildBtn').style.display = 'none';

    isTestMode = false;
}

// ==================== MODALS ====================
function showCodeModal(type) {
    codeModalType = type;
    document.getElementById('codeModalTitle').textContent =
        type === 'level' ? 'Level-Code eingeben' : 'Replay-Code eingeben';
    document.getElementById('codeInput').value = '';
    document.getElementById('codeInput').placeholder =
        type === 'level' ? 'PH1-... oder PHR-...' : 'PHR-...';
    document.getElementById('codeModal').style.display = 'flex';
}

function hideCodeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

function loadCode() {
    const code = document.getElementById('codeInput').value.trim();

    if (codeModalType === 'level') {
        // Accept both level codes and replay codes for "Mission starten"
        if (code.startsWith('PH1-')) {
            if (loadLevelFromCode(code)) {
                hideCodeModal();
                isTestMode = false;
                startInfiltrator();
            }
        } else if (code.startsWith('PHR-')) {
            // Load level from replay and play it
            if (loadReplayFromCode(code)) {
                hideCodeModal();
                isTestMode = false;
                // Don't start replay mode, start infiltrator mode with the level
                startInfiltrator();
            }
        } else {
            alert('Ungültiger Code! Verwende PH1-... oder PHR-...');
        }
    } else if (codeModalType === 'replay') {
        if (code.startsWith('PHR-')) {
            if (loadReplayFromCode(code)) {
                hideCodeModal();
                startReplay();
            }
        } else {
            alert('Ungültiger Replay-Code! Verwende PHR-...');
        }
    }
}

function loadReplayFromCode(code) {
    if (!code.startsWith('PHR-')) {
        alert('Ungültiger Replay-Code!');
        return false;
    }

    try {
        const compressed = code.substring(4);
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        const data = JSON.parse(json);

        // Load level from replay
        const lvl = data.level;
        level = {
            walls: new Set(lvl.walls),
            guards: lvl.guards,
            cameras: lvl.cameras.map(c => ({ x: c.x, y: c.y, angle: c.a || 0, baseAngle: c.a || 0 })),
            traps: new Set(lvl.traps),
            vault: lvl.vault,
            start: lvl.start,
            musicSeed: lvl.seed
        };

        // Store replay inputs
        replayInputs = data.inputs || [];
        return true;
    } catch (e) {
        console.error('Replay load error:', e);
        alert('Fehler beim Laden des Replays!');
        return false;
    }
}

// Replay state
let replayInputs = [];
let replayIndex = 0;
let replayPlaying = true;
let replaySpeed = 1;

async function startReplay() {
    await initAudio();
    gameMode = 'replay';
    document.body.className = 'infiltrator';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('topBar').style.display = 'flex';
    document.getElementById('budgetDisplay').style.display = 'none';
    document.getElementById('abilityBar').style.display = 'none';

    // Hide all architect buttons, show only back
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('viewCodeBtn').style.display = 'none';
    document.getElementById('testBtn').style.display = 'none';
    document.getElementById('backToBuildBtn').style.display = 'none';

    // Initialize player at start
    player = {
        x: level.start.x,
        y: level.start.y,
        path: [],
        pathIndex: 0,
        moving: false,
        sneaking: false,
        throwing: false
    };
    sneakTimer = 0;

    // Initialize guard states
    guardStates = (level.guards || []).map(g => ({
        x: g.x,
        y: g.y,
        angle: 0,
        waypointIndex: 0
    }));

    detectionLevel = 0;
    gameOver = false;
    won = false;
    gameTime = 0;
    trapTimer = 0;
    replayIndex = 0;
    replayPlaying = true;

    resizeCanvas();
    setAudioMode('infiltrator');
    startGameLoop();
}

function executeReplayInput(input) {
    const [timestamp, x, y, action] = input;

    switch (action) {
        case 'MOVE':
            const path = findPath(Math.round(player.x), Math.round(player.y), x, y);
            if (path && path.length > 1) {
                player.path = path;
                player.pathIndex = 1;
                player.moving = true;
            }
            break;
        case 'THROW':
            distractionTarget = { x, y };
            distractionTimer = DISTRACTION_DURATION;
            player.throwing = false;
            break;
        case 'SNEAK_ON':
            player.sneaking = true;
            sneakTimer = SNEAK_DURATION;
            break;
        case 'SNEAK_OFF':
            player.sneaking = false;
            sneakTimer = 0;
            break;
    }
}

function hideShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

async function shareCode() {
    const code = document.getElementById('levelCode').textContent;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Pocket Heist Level',
                text: code
            });
        } catch (e) {
            // User cancelled or error
            copyToClipboard(code);
        }
    } else {
        copyToClipboard(code);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Code kopiert!');
    }).catch(() => {
        prompt('Code kopieren:', text);
    });
}

// ==================== GAME LOOP ====================
let lastTime = 0;
let gameLoopRunning = false;

function gameLoop(timestamp) {
    try {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        updateGame(dt);
        render();
    } catch (e) {
        console.error('Game loop error:', e);
        // Don't crash completely, just skip this frame
    }

    if (gameMode) {
        requestAnimationFrame(gameLoop);
    } else {
        gameLoopRunning = false;
    }
}

function startGameLoop() {
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// ==================== RESIZE HANDLER ====================
window.addEventListener('resize', () => {
    if (gameMode) {
        resizeCanvas();
        clampViewport();
    }
});

window.addEventListener('orientationchange', () => {
    // Mehrere Timeouts für zuverlässigere Anpassung
    // (verschiedene Browser/Geräte brauchen unterschiedlich lang)
    [100, 300, 500].forEach(delay => {
        setTimeout(() => {
            if (gameMode) {
                resizeCanvas();
                clampViewport();
            }
        }, delay);
    });
});

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=' + VERSION)
            .then(reg => {
                console.log(`[App] SW registered, scope: ${reg.scope}`);
            })
            .catch(err => {
                console.warn('[App] SW registration failed:', err);
            });
    });
}

// ==================== INIT ====================
resizeCanvas();
