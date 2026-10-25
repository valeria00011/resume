const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const counter = document.getElementById("count");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

let width;
let height;
let words = [];
let particles = [];
let collected = 0;
let finished = false;
let lastTime = 0;

const keys = {};
let pointer = null;

const story = "однажды кто-то проснулся внутри чужого воспоминания здесь пахло дождём и старыми письмами стены шептали имена которых никто не помнил он искал дверь но находил только слова каждое из них было чьей-то маленькой тайной и чем больше он узнавал тем меньше оставалось его самого может быть память это просто комната которую кто-то медленно съедает кот придет увидит дверь завтра после полудня но иногда трудно не заметить этот момент потому что улица фонарь аптека мяч летит самолет гавкает красная кнопка захватит этот мир и поглотит черную дыру быстрее чем придет ночь но самое странное произойдет десять лет назад когда обезьяна пригласит домой английского философа и обязательно получит по заслугам".trim().split(/\s+/);

const ball = { x: 0, y: 0, vx: 1.5, vy: 0, r: 25, angle: 0 };

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ball.x = Math.min(ball.x || width * 0.5, width - ball.r);
    ball.y = Math.min(ball.y || height * 0.55, height - ball.r);

    if (words.length === 0) createWords();
}

function createWords() {
    words = story.map((text, i) => {
        const margin = 24;
        return {
            text,
            x: margin + Math.random() * Math.max(1, width - margin * 2),
            y: 100 + Math.random() * Math.max(80, height - 180),
            size: 12 + Math.random() * 12,
            angle: (Math.random() - 0.5) * 0.4,
            phase: Math.random() * Math.PI * 2,
            seed: i,
            alive: true
        };
    });
}

function reset() {
    collected = 0;
    finished = false;
    particles = [];
    words = [];

    ball.x = width * 0.5;
    ball.y = height * 0.58;
    ball.vx = 1.5;
    ball.vy = 0;
    ball.r = 25;
    ball.angle = 0;

    counter.textContent = "0";
    statusText.textContent = "ОБЪЕКТ ПРОБУЖДАЕТСЯ...";
    createWords();
}

window.addEventListener("resize", resize);

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
    }
    keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

restartButton.addEventListener("click", reset);

canvas.addEventListener("pointerdown", (e) => {
    pointer = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointermove", (e) => {
    if (e.buttons > 0 || e.pointerType === "touch") {
        pointer = { x: e.clientX, y: e.clientY };
    }
});
canvas.addEventListener("pointerup", () => { pointer = null; });
canvas.addEventListener("pointercancel", () => { pointer = null; });
canvas.addEventListener("pointerleave", () => { pointer = null; });

function update(dt) {
    if (finished) return;
    const step = Math.min(dt / 16.67, 2);

    if (keys["arrowleft"] || keys["a"]) ball.vx -= 0.22 * step;
    if (keys["arrowright"] || keys["d"]) ball.vx += 0.22 * step;
    if (keys["arrowup"] || keys["w"]) ball.vy -= 0.22 * step;
    if (keys["arrowdown"] || keys["s"]) ball.vy += 0.22 * step;

    if (pointer) {
        const dx = pointer.x - ball.x;
        const dy = pointer.y - ball.y;
        const distance = Math.hypot(dx, dy) || 1;
        ball.vx += (dx / distance) * 0.12 * step;
        ball.vy += (dy / distance) * 0.12 * step;
    }

    ball.vx *= Math.pow(0.992, step);
    ball.vy *= Math.pow(0.992, step);

    const speed = Math.hypot(ball.vx, ball.vy);
    const maxSpeed = 7;
    if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
    }

    ball.x += ball.vx * step;
    ball.y += ball.vy * step;
    ball.angle += speed * 0.025 * step;

    if (ball.x < ball.r) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx) * 0.75;
    }
    if (ball.x > width - ball.r) {
        ball.x = width - ball.r;
        ball.vx = -Math.abs(ball.vx) * 0.75;
    }
    if (ball.y < ball.r + 65) {
        ball.y = ball.r + 65;
        ball.vy = Math.abs(ball.vy) * 0.75;
    }
    if (ball.y > height - ball.r - 45) {
        ball.y = height - ball.r - 45;
        ball.vy = -Math.abs(ball.vy) * 0.75;
    }

    for (const word of words) {
        if (!word.alive) continue;

        ctx.font = `${word.size}px monospace`;
        const dx = ball.x - word.x;
        const dy = ball.y - word.y;
        const distance = Math.hypot(dx, dy);
        const wordWidth = ctx.measureText(word.text).width || word.size * 3;
        const reach = ball.r + Math.max(wordWidth * 0.35, word.size);

        if (distance < reach) {
            word.alive = false;
            collected++;
            counter.textContent = String(collected);

            for (let i = 0; i < 7; i++) {
                particles.push({
                    x: word.x,
                    y: word.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1,
                    size: 2 + Math.random() * 3
                });
            }
            ball.r = Math.min(25 + collected * 0.12, 40);
        }
    }

    if (collected >= story.length) {
        finished = true;
        statusText.textContent = "ИСТОРИЯ ПОГЛОЩЕНА";
    } else if (collected > story.length * 0.7) {
        statusText.textContent = "ПАМЯТЬ ПОЧТИ ПУСТА";
    } else if (collected > story.length * 0.3) {
        statusText.textContent = "ОБЪЕКТ РАСТЁТ";
    }

    for (const p of particles) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.life -= 0.025 * step;
    }
    particles = particles.filter((p) => p.life > 0);
}

function drawWords(time) {
    for (const word of words) {
        if (!word.alive) continue;
        const wobble = Math.sin(time * 0.001 + word.phase) * 3;

        ctx.save();
        ctx.translate(word.x, word.y + wobble);
        ctx.rotate(word.angle);
        ctx.font = `${word.size}px monospace`;
        ctx.fillStyle = word.seed % 5 === 0 ? "#c5ff45" : "#b5b6a9";
        ctx.globalAlpha = 0.65 + Math.sin(time * 0.002 + word.phase) * 0.2;
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
    }
}

function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, ball.r * 2.2);
    glow.addColorStop(0, "rgba(197,255,69,0.32)");
    glow.addColorStop(1, "rgba(197,255,69,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, ball.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    const sphere = ctx.createRadialGradient(
        -ball.r * 0.35, -ball.r * 0.4, 2,
        0, 0, ball.r
    );
    sphere.addColorStop(0, "#efffc0");
    sphere.addColorStop(0.35, "#c5ff45");
    sphere.addColorStop(1, "#526e18");
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(ball.angle);
    ctx.strokeStyle = "rgba(16,17,15,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ball.r * 0.45, ball.r, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = "#c5ff45";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function draw(time) {
    ctx.clearRect(0, 0, width, height);
    drawWords(time);
    drawParticles();
    drawBall();

    if (finished) {
        ctx.fillStyle = "#c5ff45";
        ctx.textAlign = "center";
        ctx.font = "bold 15px monospace";
        ctx.fillText("КОНЕЦ ИСТОРИИ", width / 2, height * 0.82);
        ctx.textAlign = "left";
    }
}

function animate(time) {
    const dt = lastTime ? time - lastTime : 16.67;
    lastTime = time;
    update(dt);
    draw(time);
    requestAnimationFrame(animate);
}

resize();
ball.x = width * 0.5;
ball.y = height * 0.58;
requestAnimationFrame(animate);
