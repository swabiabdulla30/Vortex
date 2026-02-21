/**
 * tech_bg.js — Animated Technology Circuit Loop Background
 * Metallic Red & Black theme for Vortex Innovators
 * Usage: Include <script src="tech_bg.js"></script> in any page.
 */
(function () {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'tech-bg-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
        pointer-events: none;
        opacity: 0.55;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');

    // ── Color Palette ──────────────────────────────────────────────────
    const COLORS = {
        bg: '#050505',
        grid: 'rgba(139, 0, 0, 0.12)',
        node: 'rgba(255, 26, 26, 0.8)',
        nodeDim: 'rgba(139, 0, 0, 0.4)',
        line: 'rgba(255, 40, 40, 0.5)',
        lineDim: 'rgba(139, 0, 0, 0.2)',
        pulse: 'rgba(255, 80, 80, 0.9)',
        glow: 'rgba(255, 26, 26, 0.15)',
    };

    // ── Config ─────────────────────────────────────────────────────────
    const GRID_SIZE = 60;
    const NODE_RADIUS = 2.5;
    const PULSE_RADIUS = 5;
    const TRAIL_LENGTH = 18;

    let W, H, cols, rows, nodes = [], pulses = [];

    // ── Resize ─────────────────────────────────────────────────────────
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cols = Math.ceil(W / GRID_SIZE) + 1;
        rows = Math.ceil(H / GRID_SIZE) + 1;
        buildNodes();
    }

    // ── Build Circuit Nodes ────────────────────────────────────────────
    function buildNodes() {
        nodes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Add slight jitter to make it organic
                const jx = (Math.random() - 0.5) * GRID_SIZE * 0.25;
                const jy = (Math.random() - 0.5) * GRID_SIZE * 0.25;
                nodes.push({
                    x: c * GRID_SIZE + jx,
                    y: r * GRID_SIZE + jy,
                    active: Math.random() < 0.35,
                    brightness: Math.random(),
                    blinkSpeed: 0.005 + Math.random() * 0.01,
                    blinkDir: Math.random() > 0.5 ? 1 : -1,
                });
            }
        }
    }

    // ── Spawn Pulse ────────────────────────────────────────────────────
    function spawnPulse() {
        const activeNodes = nodes.filter(n => n.active);
        if (activeNodes.length < 2) return;

        const start = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        // Pick a neighbor node
        const candidates = activeNodes.filter(n => {
            const dx = n.x - start.x;
            const dy = n.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist > 0 && dist < GRID_SIZE * 2.5;
        });
        if (candidates.length === 0) return;
        const end = candidates[Math.floor(Math.random() * candidates.length)];

        pulses.push({
            sx: start.x, sy: start.y,
            ex: end.x, ey: end.y,
            progress: 0,
            speed: 0.008 + Math.random() * 0.012,
            trail: [],
        });
    }

    // ── Draw ──────────────────────────────────────────────────────────
    function draw() {
        ctx.clearRect(0, 0, W, H);

        // ── Background grid lines (subtle) ──
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.4;
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * GRID_SIZE, 0);
            ctx.lineTo(c * GRID_SIZE, H);
            ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * GRID_SIZE);
            ctx.lineTo(W, r * GRID_SIZE);
            ctx.stroke();
        }

        // ── Connection lines between active nodes ──
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            if (!a.active) continue;
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                if (!b.active) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < GRID_SIZE * 1.6) {
                    const alpha = (1 - dist / (GRID_SIZE * 1.6)) * 0.6;
                    ctx.strokeStyle = `rgba(200, 30, 30, ${alpha})`;
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    // Right-angle circuit routing
                    ctx.lineTo(a.x, b.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // ── Nodes ──
        nodes.forEach(n => {
            if (!n.active) return;
            n.brightness += n.blinkSpeed * n.blinkDir;
            if (n.brightness > 1 || n.brightness < 0.2) n.blinkDir *= -1;

            const alpha = 0.3 + n.brightness * 0.7;
            // Glow
            const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, NODE_RADIUS * 5);
            grd.addColorStop(0, `rgba(255, 26, 26, ${alpha * 0.4})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS * 5, 0, Math.PI * 2);
            ctx.fill();

            // Core dot
            ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── Pulses ──
        pulses = pulses.filter(p => {
            p.progress += p.speed;
            if (p.progress >= 1) return false;

            // Current tip position (right-angle path: horizontal then vertical)
            const midX = p.ex;
            const midY = p.sy;
            let tx, ty;
            const seg1Len = Math.abs(p.ex - p.sx);
            const seg2Len = Math.abs(p.ey - p.sy);
            const total = seg1Len + seg2Len;
            const travelled = p.progress * total;

            if (travelled <= seg1Len) {
                const t = seg1Len > 0 ? travelled / seg1Len : 0;
                tx = p.sx + (midX - p.sx) * t;
                ty = p.sy;
            } else {
                const t = seg2Len > 0 ? (travelled - seg1Len) / seg2Len : 0;
                tx = midX;
                ty = p.sy + (p.ey - p.sy) * t;
            }

            p.trail.push({ x: tx, y: ty });
            if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

            // Draw trail
            for (let i = 0; i < p.trail.length; i++) {
                const alpha = (i / p.trail.length) * 0.9;
                ctx.fillStyle = `rgba(255, 60, 60, ${alpha})`;
                const radius = PULSE_RADIUS * (i / p.trail.length);
                ctx.beginPath();
                ctx.arc(p.trail[i].x, p.trail[i].y, Math.max(0.5, radius), 0, Math.PI * 2);
                ctx.fill();
            }

            // Leading tip glow
            const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, PULSE_RADIUS * 2.5);
            grd.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
            grd.addColorStop(0.5, 'rgba(255, 30, 30, 0.4)');
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(tx, ty, PULSE_RADIUS * 2.5, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });
    }

    // ── Animation Loop ─────────────────────────────────────────────────
    let frame = 0;
    function loop() {
        frame++;
        draw();
        // Spawn a new pulse every ~80 frames on average
        if (frame % 30 === 0 && Math.random() < 0.6) spawnPulse();
        requestAnimationFrame(loop);
    }

    // ── Init ──────────────────────────────────────────────────────────
    window.addEventListener('resize', resize);
    resize();
    loop();

})();
