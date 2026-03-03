/**
 * tech_bg_v3.js — Hyperspace Warp Tunnel
 * Stars fly out of the center toward the viewer — "going inside the screen"
 * Deep red / black theme for Vortex Innovators
 */
(function () {
    'use strict';

    const old = document.getElementById('tech-bg-canvas')
        || document.getElementById('tech-bg-canvas-alt')
        || document.getElementById('tech-bg-canvas-v3');
    if (old) old.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'tech-bg-canvas-v3';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
        pointer-events: none;
        opacity: 1;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');

    let W, H, cx, cy;
    const STAR_COUNT = 500;
    const MAX_DEPTH = 1000;
    const SPEED = 4;

    const stars = [];

    function Star() {
        this.reset(true);
    }

    Star.prototype.reset = function (initial) {
        this.x = (Math.random() - 0.5) * W * 2;
        this.y = (Math.random() - 0.5) * H * 2;
        this.z = initial ? Math.random() * MAX_DEPTH : MAX_DEPTH;
        this.prev = null;
    };

    Star.prototype.update = function () {
        this.z -= SPEED;
        if (this.z <= 0) this.reset(false);
    };

    Star.prototype.project = function () {
        const f = MAX_DEPTH / this.z;
        const sx = this.x * f + cx;
        const sy = this.y * f + cy;
        const r = Math.max(0.3, 2.5 * (1 - this.z / MAX_DEPTH));
        return { sx, sy, r };
    };

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cx = W / 2;
        cy = H / 2;
    }

    function init() {
        resize();
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }
    }

    function draw() {
        // Very dark translucent fill for motion-blur trail
        ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
        ctx.fillRect(0, 0, W, H);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            const cur = s.project();

            // brightness based on depth (closer = brighter)
            const t = 1 - s.z / MAX_DEPTH;          // 0 = far, 1 = close
            const alpha = Math.min(1, t * 1.5);
            const r = cur.r;

            // Streak line from previous frame to current
            if (s.prev) {
                ctx.beginPath();
                ctx.moveTo(s.prev.sx, s.prev.sy);
                ctx.lineTo(cur.sx, cur.sy);

                // Color: far = deep red, close = bright orange-red
                const R = Math.floor(100 + t * 155);
                const G = Math.floor(t * 30);
                const B = 0;
                ctx.strokeStyle = `rgba(${R},${G},${B},${alpha})`;
                ctx.lineWidth = r;
                ctx.shadowColor = `rgba(255,${Math.floor(t * 60)},0,0.6)`;
                ctx.shadowBlur = t > 0.7 ? 8 : 0;
                ctx.stroke();
            }

            // Core dot
            ctx.beginPath();
            ctx.arc(cur.sx, cur.sy, r * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${Math.floor(t * 80)}, 0, ${alpha})`;
            ctx.fill();

            // Store previous projected position
            s.prev = cur;

            s.update();

            // Reset prev after reset so we don't draw a streak across the screen
            if (s.z >= MAX_DEPTH - SPEED) s.prev = null;
        }

        ctx.shadowBlur = 0;

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
        resize();
        // Recenter stars on resize
        stars.forEach(s => s.prev = null);
    });

    init();
    draw();
})();
