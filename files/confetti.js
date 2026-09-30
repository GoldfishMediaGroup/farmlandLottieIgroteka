// src/core/Config.ts
var DEFAULT_CONFIG = {
    position: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
    count: 75,
    size: 1,
    velocity: 200,
    fade: false
};
var Config = class {
    static init(config) {
        return { ...DEFAULT_CONFIG, ...config };
    }
};

// src/core/Random.ts
var Random = class {
    static range(min, max) {
        return Math.random() * (max - min) + min;
    }
};

// src/core/Vector2D.ts
var Vector2D = class _Vector2D {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new _Vector2D(this.x, this.y);
    }
    magnitude() {
        return Math.hypot(this.x, this.y);
    }
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) {
            this.x = 0;
            this.y = 0;
            return this;
        }
        const inv = 1 / mag;
        this.x *= inv;
        this.y *= inv;
        return this;
    }
    scale(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
};

// src/core/Particle.ts
var Particle = class {
    config;
    position;
    size;
    velocity;
    rotation;
    rotation_speed;
    hue;
    opacity;
    fadeRate;
    constructor(position, config) {
        this.config = config;
        this.position = position.copy();
        this.size = this.initSize();
        this.velocity = this.initVelocity();
        this.rotation = Random.range(0, 360);
        this.rotation_speed = Random.range(-250, 250);
        this.hue = Random.range(0, 360);
        this.opacity = 100;
        this.fadeRate = 100 / Random.range(0.5, 2.5);
    }
    initSize() {
        const x = Random.range(4, 12) * this.config.size;
        const y = Random.range(4, 6) * this.config.size;
        return new Vector2D(x, y);
    }
    initVelocity() {
        const x = Random.range(-0.5, 0.5);
        const y = Random.range(-0.75, 0.25);
        const direction = new Vector2D(x, y).normalize();
        direction.x *= Math.random() * this.config.velocity * 4;
        direction.y *= Math.random() * this.config.velocity * 4;
        return direction;
    }
    update(delta) {
        this.velocity.x += Random.range(-350, 350) * delta;
        this.velocity.y += 750 * (this.size.y / (10 * this.config.size)) * delta;
        const damping = Math.pow(0.98, delta * 60);
        this.velocity.scale(damping);
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.rotation += this.rotation_speed * delta;
        if (this.config.fade) {
            this.opacity -= this.fadeRate * delta;
            if (this.opacity < 0) this.opacity = 0;
        }
    }
    draw(renderer) {
        renderer.drawRect(
            this.position,
            this.size,
            this.rotation,
            this.hue,
            this.opacity
        );
    }
    cull(renderer) {
        const padding = Math.max(this.size.x, this.size.y) * 2;
        const offScreen = this.position.y > renderer.height + padding;
        return offScreen || this.opacity <= 0;
    }
};

// src/core/Renderer.ts
var Renderer = class {
    canvas;
    context;
    dpr;
    rafId;
    boundResize;
    constructor() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Unable to create 2d context");
        }
        this.canvas = canvas;
        this.context = context;
        this.dpr = Math.max(1, window.devicePixelRatio || 1);
        this.rafId = 0;
        this.boundResize = this.resize.bind(this);
        this.resize();
        window.addEventListener("resize", this.boundResize);
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.margin = "0";
        canvas.style.padding = "0";
        canvas.style.zIndex = "999999999";
        canvas.style.pointerEvents = "none";
        document.body.appendChild(canvas);
        this.context.imageSmoothingEnabled = true;
    }
    resize() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
            const { innerWidth, innerHeight } = window;
            this.canvas.width = Math.round(innerWidth * this.dpr);
            this.canvas.height = Math.round(innerHeight * this.dpr);
            this.canvas.style.width = `${innerWidth}px`;
            this.canvas.style.height = `${innerHeight}px`;
            this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.rafId = 0;
        });
    }
    get width() {
        return this.canvas.width / this.dpr;
    }
    get height() {
        return this.canvas.height / this.dpr;
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawRect(p, s, r, c, o) {
        const rad = r * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const width = s.x * this.dpr;
        const height = s.y * this.dpr;
        const tx = p.x * this.dpr;
        const ty = p.y * this.dpr;
        this.context.setTransform(cos, sin, -sin, cos, tx, ty);
        this.context.beginPath();
        this.context.rect(-width / 2, -height / 2, width, height);
        // this.context.fillStyle = `oklch(0.85 0.25 ${c}deg / ${o}%)`;
        // this.context.fillStyle = `rgba(${Random.range(200,255)}, ${Random.range(160,215)}, 0, ${o/100})`;
        this.context.fillStyle = `rgba(${Random.range(200, 255)},${Random.range(160, 215)},${Random.range(0, 50)},${o / 100})`;
        this.context.fill();
        this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    cleanup() {
        window.removeEventListener("resize", this.boundResize);
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.canvas.remove();
    }
};

// src/core/Engine.ts
var Engine = class _Engine {
    particles = [];
    renderer;
    lastTime = 0;
    rafId = 0;
    boundUpdate;
    static sharedEngine = null;
    constructor() {
        this.renderer = new Renderer();
        this.boundUpdate = this.update.bind(this);
        this.rafId = window.requestAnimationFrame(this.boundUpdate);
    }
    update(time) {
        const delta = Math.min((time - this.lastTime) / 1e3, 0.064);
        this.lastTime = time;
        if (this.particles.length === 0) {
            this.cleanup();
            return;
        }
        this.renderer.clear();
        let write = 0;
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(delta);
            if (!this.particles[i].cull(this.renderer)) {
                this.particles[i].draw(this.renderer);
                this.particles[write++] = this.particles[i];
            }
        }
        this.particles.length = write;
        this.rafId = window.requestAnimationFrame(this.boundUpdate);
    }
    cleanup() {
        if (this.rafId) window.cancelAnimationFrame(this.rafId);
        this.renderer.cleanup();
        _Engine.sharedEngine = null;
    }
    trigger(config) {
        const position = new Vector2D(config.position.x, config.position.y);
        for (let i = 0; i < config.count; i++) {
            this.particles.push(new Particle(position, config));
        }
    }
    static acquire() {
        if (!_Engine.sharedEngine) {
            _Engine.sharedEngine = new _Engine();
        }
        return _Engine.sharedEngine;
    }
};

// src/index.ts
function confetti(c) {
    const config = Config.init(c);
    const engine = Engine.acquire();
    engine.trigger(config);
}
window.confetti = confetti;