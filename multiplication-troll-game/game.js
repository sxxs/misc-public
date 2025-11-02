// Game Version
const VERSION = 'v1.0.6 - 2025-01-02';

// Cache-busting: Redirect to random version parameter on reload
if (!window.location.search.match(/[?&]v=/)) {
    const randomVersion = Math.random().toString(36).substring(2, 10);
    const separator = window.location.search ? '&' : '?';
    window.location.replace(window.location.pathname + window.location.search + separator + 'v=' + randomVersion);
}

// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PLAYER_Y: 520,
    PLAYER_X: 400,
    FALL_TIME_SECONDS: 10, // Time for a block to reach the bottom
    SPEED_INCREASE_PER_LEVEL: 1.05, // 5% faster each level
    TASKS_PER_LEVEL: 5, // Level up every 5 tasks
    SPAWN_INTERVAL: 3000,
    TROLL_CHANCE: 0.3, // 30% chance for troll mechanics
    MAX_TASKS_ON_SCREEN: 5
};

// Mobile Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 ('ontouchstart' in window) ||
                 (navigator.maxTouchPoints > 0);

// Sound Effects Manager
class SFXManager {
    constructor() {
        this.sfx_correct = document.getElementById('sfx_correct');
        this.sfx_wrong = document.getElementById('sfx_wrong');
        this.sfx_game_over = document.getElementById('sfx_game_over');

        // Set SFX volume higher for better audibility
        this.sfx_correct.volume = 0.8;
        this.sfx_wrong.volume = 0.8;
        this.sfx_game_over.volume = 0.9;
    }

    playCorrect() {
        this.play(this.sfx_correct);
    }

    playWrong() {
        this.play(this.sfx_wrong);
    }

    playGameOver() {
        this.play(this.sfx_game_over);
    }

    play(audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('SFX play error:', err));
    }
}

// Music Manager - alternates between two loops, 3 plays each
class MusicManager {
    constructor() {
        this.music1 = document.getElementById('music1');
        this.music2 = document.getElementById('music2');
        this.currentTrack = 1;
        this.playCount = 0;
        this.maxPlays = 3;
        this.isPlaying = false;

        // Set music volume lower so SFX are more audible
        this.music1.volume = 0.3;
        this.music2.volume = 0.3;

        // Setup event listeners
        this.music1.addEventListener('ended', () => this.onTrackEnded());
        this.music2.addEventListener('ended', () => this.onTrackEnded());
    }

    start() {
        this.currentTrack = 1;
        this.playCount = 0;
        this.isPlaying = true;
        this.playCurrentTrack();
    }

    stop() {
        this.isPlaying = false;
        this.music1.pause();
        this.music2.pause();
        this.music1.currentTime = 0;
        this.music2.currentTime = 0;
    }

    playCurrentTrack() {
        if (!this.isPlaying) return;

        const track = this.currentTrack === 1 ? this.music1 : this.music2;
        track.currentTime = 0;
        track.play().catch(err => console.log('Audio play error:', err));
    }

    onTrackEnded() {
        if (!this.isPlaying) return;

        this.playCount++;

        if (this.playCount >= this.maxPlays) {
            // Switch to the other track
            this.currentTrack = this.currentTrack === 1 ? 2 : 1;
            this.playCount = 0;
        }

        this.playCurrentTrack();
    }

    pause() {
        if (this.currentTrack === 1) {
            this.music1.pause();
        } else {
            this.music2.pause();
        }
    }

    resume() {
        if (!this.isPlaying) return;

        const track = this.currentTrack === 1 ? this.music1 : this.music2;
        track.play().catch(err => console.log('Audio play error:', err));
    }
}

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.tasks = [];
        this.player = new Player();
        this.currentTargetTask = null;
        this.lastSpawnTime = 0;
        this.baseSpeed = 0; // Will be calculated based on canvas height
        this.taskSpeed = 0; // Current speed with level multiplier
        this.animationId = null;
        this.userTyping = false;
        this.musicManager = new MusicManager();
        this.sfxManager = new SFXManager();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileKeyboard();
        this.resizeCanvas();
        this.drawWelcomeScreen();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    calculateSpeed() {
        // Calculate base speed so a block takes CONFIG.FALL_TIME_SECONDS to reach bottom
        // Assuming ~60 FPS: speed = height / (fps * seconds)
        this.baseSpeed = CONFIG.CANVAS_HEIGHT / (60 * CONFIG.FALL_TIME_SECONDS);

        // Apply level multiplier
        const levelMultiplier = Math.pow(CONFIG.SPEED_INCREASE_PER_LEVEL, this.level - 1);
        this.taskSpeed = this.baseSpeed * levelMultiplier;
    }

    resizeCanvas() {
        // Let CSS flexbox handle the layout, just sync the canvas dimensions
        requestAnimationFrame(() => {
            // Get the actual rendered size from CSS (flexbox handles this now)
            const rect = this.canvas.getBoundingClientRect();
            const displayWidth = Math.floor(rect.width);
            const displayHeight = Math.floor(rect.height);

            // Use fixed internal resolution to prevent stretching
            // CSS will scale this up/down maintaining quality
            const FIXED_WIDTH = 600;
            const FIXED_HEIGHT = 500;

            // Update canvas internal resolution
            if (this.canvas.width !== FIXED_WIDTH || this.canvas.height !== FIXED_HEIGHT) {
                this.canvas.width = FIXED_WIDTH;
                this.canvas.height = FIXED_HEIGHT;
                CONFIG.CANVAS_WIDTH = FIXED_WIDTH;
                CONFIG.CANVAS_HEIGHT = FIXED_HEIGHT;

                // Update player position to near bottom (92% down)
                CONFIG.PLAYER_Y = Math.floor(CONFIG.CANVAS_HEIGHT * 0.92);
                CONFIG.PLAYER_X = Math.floor(CONFIG.CANVAS_WIDTH / 2);

                // Recalculate speeds based on new canvas height
                this.calculateSpeed();

                // Redraw if game is running
                if (this.isRunning && !this.isPaused) {
                    this.draw();
                } else {
                    this.drawWelcomeScreen();
                }
            }
        });
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const answerInput = document.getElementById('answerInput');

        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.togglePause());
        restartBtn.addEventListener('click', () => this.restart());

        answerInput.addEventListener('input', (e) => this.handleInput(e));

        // Only check for Enter on desktop
        if (!isMobile) {
            answerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.isRunning) {
                    this.checkAnswer();
                }
            });
        }

        // Detect when user starts typing for troll mechanics
        answerInput.addEventListener('focus', () => {
            this.userTyping = true;
        });
    }

    setupMobileKeyboard() {
        if (!isMobile) return;

        const answerInput = document.getElementById('answerInput');
        const mobileKeyboard = document.getElementById('mobileKeyboard');

        // Make input readonly on mobile to prevent native keyboard
        answerInput.setAttribute('readonly', 'readonly');

        // Show mobile keyboard
        mobileKeyboard.classList.remove('hidden');

        // Setup keyboard buttons
        const keyButtons = document.querySelectorAll('.key-btn');
        keyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;

                if (key === 'backspace') {
                    answerInput.value = answerInput.value.slice(0, -1);
                } else if (answerInput.value.length < 3) {
                    answerInput.value += key;
                }

                // Trigger input event for auto-check
                answerInput.dispatchEvent(new Event('input'));

                // Remove focus from button to prevent it staying highlighted
                btn.blur();
            });
        });
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;

        // Hide start button, show pause button
        const controls = document.querySelector('.controls');
        controls.classList.add('hidden');
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('pauseBtn').classList.remove('hidden');

        document.getElementById('answerInput').focus();

        this.musicManager.start();
        this.lastSpawnTime = Date.now();
        this.spawnTask();

        // Resize canvas after controls are hidden (CSS flexbox handles the layout)
        setTimeout(() => this.resizeCanvas(), 100);

        this.gameLoop();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'WEITER' : 'PAUSE';
        if (this.isPaused) {
            this.musicManager.pause();
        } else {
            this.musicManager.resume();
            this.gameLoop();
        }
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        const currentTime = Date.now();

        // Spawn new tasks
        const spawnInterval = Math.max(1500, CONFIG.SPAWN_INTERVAL - (this.level * 200));
        if (currentTime - this.lastSpawnTime > spawnInterval &&
            this.tasks.length < CONFIG.MAX_TASKS_ON_SCREEN) {
            this.spawnTask();
            this.lastSpawnTime = currentTime;
        }

        // Update tasks
        this.tasks.forEach(task => {
            task.update();

            // Check collision with player (at head level, slightly above player base)
            const collisionY = CONFIG.PLAYER_Y - 40;
            if (task.y >= collisionY) {
                this.loseLife();
                this.removeTask(task);
            }
        });

        // Update level - every CONFIG.TASKS_PER_LEVEL tasks
        if (this.score > 0 && this.score % CONFIG.TASKS_PER_LEVEL === 0) {
            const newLevel = Math.floor(this.score / CONFIG.TASKS_PER_LEVEL) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                // Recalculate speed with new level multiplier (5% faster)
                this.calculateSpeed();
                this.showLevelUp();
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw grid background
        this.drawGrid();

        // Draw player
        this.player.draw(this.ctx);

        // Draw tasks
        this.tasks.forEach(task => task.draw(this.ctx));

        // Draw danger zone indicator
        this.drawDangerZone();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#00D9FF22';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
    }

    drawDangerZone() {
        const dangerY = CONFIG.PLAYER_Y - 40;
        this.ctx.strokeStyle = '#FF6B3566';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, dangerY);
        this.ctx.lineTo(CONFIG.CANVAS_WIDTH, dangerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawWelcomeScreen() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 40px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BEREIT ZUM RECHNEN?', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 50);

        this.ctx.fillStyle = '#00D9FF';
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('Löse die Aufgaben bevor sie dich erreichen!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);

        this.ctx.fillStyle = '#FF8800';
        this.ctx.fillText('Aber Vorsicht: Sie werden sich manchmal ändern!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);

        // Version display
        this.ctx.fillStyle = '#00D9FF';
        this.ctx.font = 'bold 18px Courier New';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(VERSION, CONFIG.CANVAS_WIDTH - 10, CONFIG.CANVAS_HEIGHT - 10);
    }

    spawnTask() {
        const task = new Task(this.taskSpeed, this.level);
        this.tasks.push(task);

        // Set as current target if none exists
        if (!this.currentTargetTask || !this.tasks.includes(this.currentTargetTask)) {
            this.setCurrentTask(task);
        }
    }

    setCurrentTask(task) {
        // Remove highlight from old task
        if (this.currentTargetTask) {
            this.currentTargetTask.isTarget = false;
        }

        this.currentTargetTask = task;
        task.isTarget = true;
        document.getElementById('currentTask').textContent = task.getDisplayText();
    }

    handleInput(e) {
        // TROLL MECHANIC: Sometimes change the task when user starts typing
        if (this.userTyping && Math.random() < 0.2) {
            if (this.currentTargetTask && this.tasks.includes(this.currentTargetTask)) {
                this.currentTargetTask.troll();
                document.getElementById('currentTask').textContent = this.currentTargetTask.getDisplayText();

                // Clear input when task changes
                document.getElementById('answerInput').value = '';
            }
            this.userTyping = false; // Reset to avoid constant changes
        }

        // AUTO-CHECK: Check answer when input matches expected answer length
        const input = document.getElementById('answerInput');
        const answer = parseInt(input.value);

        if (!this.currentTargetTask || !this.tasks.includes(this.currentTargetTask)) {
            return;
        }

        // Check if the answer has the correct number of digits
        const expectedAnswer = this.currentTargetTask.correctAnswer;
        const expectedLength = expectedAnswer.toString().length;
        const inputLength = input.value.length;

        // Auto-check when we have enough digits
        if (inputLength >= expectedLength && inputLength <= 3) {
            if (answer === expectedAnswer) {
                this.checkAnswer();
            } else if (inputLength === 3) {
                // If 3 digits and still wrong, check anyway (max length reached)
                this.checkAnswer();
            }
        }
    }

    checkAnswer() {
        const input = document.getElementById('answerInput');
        const answer = parseInt(input.value);

        if (!this.currentTargetTask || !this.tasks.includes(this.currentTargetTask)) {
            input.value = '';
            return;
        }

        if (answer === this.currentTargetTask.correctAnswer) {
            // Correct answer!
            this.score++;
            this.updateUI();
            this.removeTask(this.currentTargetTask);
            this.showFeedback('RICHTIG!', '#00D9FF');

            // Play success animation and sound
            this.player.celebrate();
            this.sfxManager.playCorrect();
        } else {
            // Wrong answer
            this.showFeedback('FALSCH!', '#FF6B35');
            this.player.shake();
            this.sfxManager.playWrong();
        }

        input.value = '';
        this.userTyping = true;
    }

    showFeedback(text, color) {
        const taskDisplay = document.getElementById('currentTask');
        const originalColor = taskDisplay.style.color;
        const originalText = taskDisplay.textContent;

        taskDisplay.style.color = color;
        taskDisplay.textContent = text;

        setTimeout(() => {
            taskDisplay.style.color = originalColor;
            if (this.currentTargetTask) {
                taskDisplay.textContent = this.currentTargetTask.getDisplayText();
            } else {
                taskDisplay.textContent = 'Keine Aufgabe!';
            }
        }, 500);
    }

    removeTask(task) {
        const index = this.tasks.indexOf(task);
        if (index > -1) {
            this.tasks.splice(index, 1);
        }

        // Set new current task
        if (task === this.currentTargetTask) {
            if (this.tasks.length > 0) {
                // Pick the lowest task (closest to player)
                const lowestTask = this.tasks.reduce((lowest, current) =>
                    current.y > lowest.y ? current : lowest
                );
                this.setCurrentTask(lowestTask);
            } else {
                this.currentTargetTask = null;
                document.getElementById('currentTask').textContent = 'Warte auf neue Aufgabe...';
            }
        }
    }

    loseLife() {
        this.lives--;
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.player.hit();
        }
    }

    showLevelUp() {
        const taskDisplay = document.getElementById('currentTask');
        const originalText = taskDisplay.textContent;

        taskDisplay.textContent = `LEVEL ${this.level}!`;
        taskDisplay.style.color = '#FFD700';

        setTimeout(() => {
            taskDisplay.style.color = '#FFD700';
            taskDisplay.textContent = originalText;
        }, 1000);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }

    gameOver() {
        this.isRunning = false;
        this.musicManager.stop();
        this.sfxManager.playGameOver();
        cancelAnimationFrame(this.animationId);

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = true;
    }

    restart() {
        // Reset all game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tasks = [];
        this.currentTargetTask = null;
        this.isRunning = false;
        this.isPaused = false;
        this.musicManager.stop();

        // Reset speed to level 1
        this.calculateSpeed();

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('answerInput').value = '';

        // Show start button again, hide pause button
        const controls = document.querySelector('.controls');
        controls.classList.remove('hidden');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = 'PAUSE';

        this.updateUI();

        // Resize canvas now that controls are visible again (CSS flexbox handles the layout)
        setTimeout(() => this.resizeCanvas(), 100);

        this.drawWelcomeScreen();
    }
}

// Player class (stick figure)
class Player {
    constructor() {
        this.x = CONFIG.PLAYER_X;
        this.y = CONFIG.PLAYER_Y;
        this.celebrateAnimation = 0;
        this.shakeAnimation = 0;
        this.hitAnimation = 0;
    }

    draw(ctx) {
        ctx.save();

        // Apply animations
        if (this.shakeAnimation > 0) {
            ctx.translate(Math.sin(this.shakeAnimation * 10) * 5, 0);
            this.shakeAnimation--;
        }

        if (this.hitAnimation > 0) {
            ctx.globalAlpha = this.hitAnimation % 2 === 0 ? 1 : 0.3;
            this.hitAnimation--;
        }

        // Scale player based on canvas height
        const scale = Math.min(1, CONFIG.CANVAS_HEIGHT / 500);
        const headRadius = 15 * scale;
        const bodyLength = 20 * scale;
        const armLength = 20 * scale;
        const legLength = Math.min(50 * scale, CONFIG.CANVAS_HEIGHT - this.y - bodyLength);

        const headY = this.celebrateAnimation > 0 ? this.y - 30 * scale - Math.sin(this.celebrateAnimation / 5) * 10 : this.y - 30 * scale;

        // Draw stick figure
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(this.x, headY, headRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(this.x, headY + headRadius);
        ctx.lineTo(this.x, this.y + bodyLength);
        ctx.stroke();

        // Arms
        ctx.beginPath();
        ctx.moveTo(this.x - armLength, headY + 25 * scale);
        ctx.lineTo(this.x, headY + 20 * scale);
        ctx.lineTo(this.x + armLength, headY + 25 * scale);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(this.x - 15 * scale, this.y + bodyLength + legLength);
        ctx.lineTo(this.x, this.y + bodyLength);
        ctx.lineTo(this.x + 15 * scale, this.y + bodyLength + legLength);
        ctx.stroke();

        if (this.celebrateAnimation > 0) {
            this.celebrateAnimation--;
        }

        ctx.restore();
    }

    celebrate() {
        this.celebrateAnimation = 30;
    }

    shake() {
        this.shakeAnimation = 10;
    }

    hit() {
        this.hitAnimation = 20;
    }
}

// Task class (math problems)
class Task {
    constructor(speed, level) {
        this.x = Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50;
        this.y = -50;
        this.speed = speed + Math.random() * 0.5;
        this.isTarget = false;
        this.trolled = false;
        this.shakeAnimation = 0;

        // Generate multiplication task (kleines 1x1)
        const maxNum = Math.min(10, 5 + level);
        this.num1 = Math.floor(Math.random() * maxNum) + 1;
        this.num2 = Math.floor(Math.random() * maxNum) + 1;
        this.correctAnswer = this.num1 * this.num2;

        // Random color
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#00D9FF', '#FFD700', '#FF8800', '#FF1493', '#00B4D8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        // TROLL MECHANIC: Sometimes speed up randomly
        if (Math.random() < 0.01) {
            this.speed *= 1.2;
        }

        this.y += this.speed;
    }

    troll() {
        if (this.trolled) return;

        // TROLL MECHANICS: Change the task randomly
        const trollType = Math.floor(Math.random() * 3);

        switch(trollType) {
            case 0:
                // Change one number
                this.num1 = Math.floor(Math.random() * 10) + 1;
                break;
            case 1:
                // Change other number
                this.num2 = Math.floor(Math.random() * 10) + 1;
                break;
            case 2:
                // Change both numbers
                this.num1 = Math.floor(Math.random() * 10) + 1;
                this.num2 = Math.floor(Math.random() * 10) + 1;
                break;
        }

        this.correctAnswer = this.num1 * this.num2;
        this.trolled = true;
        this.color = '#FF1493'; // Pink to indicate troll

        // Trigger shake animation
        this.shakeAnimation = 15;

        setTimeout(() => {
            this.color = this.getRandomColor();
        }, 500);
    }

    draw(ctx) {
        ctx.save();

        // Apply shake animation when trolled
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (this.shakeAnimation > 0) {
            shakeOffsetX = Math.sin(this.shakeAnimation * 2) * 8;
            shakeOffsetY = Math.cos(this.shakeAnimation * 2) * 8;
            this.shakeAnimation--;
        }

        // Draw task box
        const text = this.getDisplayText();

        // Dynamic font size based on canvas height (4% of height, min 18px, max 28px)
        const fontSize = Math.min(28, Math.max(18, CONFIG.CANVAS_HEIGHT * 0.04));
        ctx.font = `bold ${fontSize}px Courier New`;

        const textWidth = ctx.measureText(text).width;
        const padding = Math.max(12, fontSize * 0.6);
        const boxWidth = textWidth + padding * 2;
        const boxHeight = Math.max(35, fontSize * 1.8);

        const drawX = this.x + shakeOffsetX;
        const drawY = this.y + shakeOffsetY;

        // Background
        ctx.fillStyle = this.isTarget ? 'rgba(255, 136, 0, 0.3)' : 'rgba(0, 217, 255, 0.15)';
        ctx.fillRect(drawX - boxWidth / 2, drawY - boxHeight / 2, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = this.isTarget ? '#FFD700' : this.color;
        ctx.lineWidth = this.isTarget ? 3 : 2;
        ctx.strokeRect(drawX - boxWidth / 2, drawY - boxHeight / 2, boxWidth, boxHeight);

        // Text
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, drawX, drawY);

        // Target indicator
        if (this.isTarget) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX - boxWidth / 2 - 15, drawY, 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    getDisplayText() {
        return `${this.num1} × ${this.num2} = ?`;
    }
}

// Initialize game when DOM is loaded
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
