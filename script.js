const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

let w, h;
const duration = 2.5; 
const chars = ['2', '0', '2', '6']; 
let audioCtx = null;

window.addEventListener('resize', init);
function init() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
init();

// --- SOUND LOGIC ---
function playBoomSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'triangle'; // Deep sound
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// Click to enable audio
window.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    hint.style.display = 'none';
});

// --- PARTICLES & ANIMATION ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 };
        this.alpha = 1;
        this.friction = 0.95;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.015;
    }
}

let particles = [];
let flashes = [];

function explosion(x, y, charIndex) {
    const colors = ['#00FFCC', '#FF3366', '#FFCC00', '#00CCFF'];
    const color = colors[charIndex % colors.length];
    
    playBoomSound(); // Sound trigger!

    for(let i=0; i<80; i++) {
        particles.push(new Particle(x, y, color));
    }

    flashes.push({ x: x, y: y, text: chars[charIndex], color: color, alpha: 1, scale: 0.5 });
}

function fireworkLogic(t, i) {
    let currentTime = (t / 1000) - i * 0.7;
    let cycle = currentTime % duration;
    if (cycle < 0) return;

    let dx = (i + 1) * w / (chars.length + 1);
    let targetY = h * 0.35;
    let currentY = h - ((cycle / 0.8) * (h - targetY));

    if (cycle < 0.8) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(dx, currentY, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (cycle >= 0.8 && cycle < 0.83) {
        explosion(dx, targetY, i);
    }
}

function animate(now) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);

    chars.forEach((_, i) => fireworkLogic(now, i));

    particles.forEach((p, index) => {
        if (p.alpha <= 0) particles.splice(index, 1);
        else { p.update(); p.draw(); }
    });

    flashes.forEach((f, index) => {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = f.color;
        ctx.font = `bold ${100 * f.scale}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
        f.alpha -= 0.015; f.scale += 0.02;
        if (f.alpha <= 0) flashes.splice(index, 1);
    });

    requestAnimationFrame(animate);
}

animate();