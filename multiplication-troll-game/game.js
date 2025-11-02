// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PLAYER_Y: 520,
    PLAYER_X: 400,
    INITIAL_TASK_SPEED: 0.5,
    SPEED_INCREMENT: 0.1,
    SPAWN_INTERVAL: 3000,
    TROLL_CHANCE: 0.3, // 30% chance for troll mechanics
    MAX_TASKS_ON_SCREEN: 5
};

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
        this.taskSpeed = CONFIG.INITIAL_TASK_SPEED;
        this.animationId = null;
        this.userTyping = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.drawWelcomeScreen();
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
        answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.isRunning) {
                this.checkAnswer();
            }
        });

        // Detect when user starts typing for troll mechanics
        answerInput.addEventListener('focus', () => {
            this.userTyping = true;
        });
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('answerInput').focus();

        this.lastSpawnTime = Date.now();
        this.spawnTask();
        this.gameLoop();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'WEITER' : 'PAUSE';
        if (!this.isPaused) {
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

            // Check collision with player
            if (task.y >= CONFIG.PLAYER_Y - 30) {
                this.loseLife();
                this.removeTask(task);
            }
        });

        // Update level
        if (this.score > 0 && this.score % 10 === 0) {
            const newLevel = Math.floor(this.score / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.taskSpeed += CONFIG.SPEED_INCREMENT;
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
        const dangerY = CONFIG.PLAYER_Y - 50;
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
            }
            this.userTyping = false; // Reset to avoid constant changes
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

            // Play success animation
            this.player.celebrate();
        } else {
            // Wrong answer
            this.showFeedback('FALSCH!', '#FF6B35');
            this.player.shake();
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
        this.taskSpeed = CONFIG.INITIAL_TASK_SPEED;
        this.isRunning = false;
        this.isPaused = false;

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('answerInput').value = '';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;

        this.updateUI();
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

        const headY = this.celebrateAnimation > 0 ? this.y - 30 - Math.sin(this.celebrateAnimation / 5) * 10 : this.y - 30;

        // Draw stick figure
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(this.x, headY, 15, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(this.x, headY + 15);
        ctx.lineTo(this.x, this.y + 20);
        ctx.stroke();

        // Arms
        const armAngle = this.celebrateAnimation > 0 ? Math.PI / 4 : Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(this.x - 20, headY + 25);
        ctx.lineTo(this.x, headY + 20);
        ctx.lineTo(this.x + 20, headY + 25);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y + 50);
        ctx.lineTo(this.x, this.y + 20);
        ctx.lineTo(this.x + 15, this.y + 50);
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

        setTimeout(() => {
            this.color = this.getRandomColor();
        }, 500);
    }

    draw(ctx) {
        ctx.save();

        // Draw task box
        const text = this.getDisplayText();
        ctx.font = 'bold 24px Courier New';
        const textWidth = ctx.measureText(text).width;
        const padding = 15;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 40;

        // Background
        ctx.fillStyle = this.isTarget ? 'rgba(255, 136, 0, 0.3)' : 'rgba(0, 217, 255, 0.15)';
        ctx.fillRect(this.x - boxWidth / 2, this.y - boxHeight / 2, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = this.isTarget ? '#FFD700' : this.color;
        ctx.lineWidth = this.isTarget ? 3 : 2;
        ctx.strokeRect(this.x - boxWidth / 2, this.y - boxHeight / 2, boxWidth, boxHeight);

        // Text
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, this.x, this.y);

        // Target indicator
        if (this.isTarget) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x - boxWidth / 2 - 15, this.y, 5, 0, Math.PI * 2);
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
