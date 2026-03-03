/**
 * tech_bg_mobile.js — Premium Mobile Background
 * Flowing aurora gradient mesh + clean sparse network graph.
 * Only activates on screens ≤ 768px.
 * Style: Premium SaaS / Innovation — no childish patterns.
 */
(function () {
    'use strict';

    if (window.innerWidth > 768) return;

    ['tech-bg-canvas-alt', 'tech-bg-canvas', 'tech-bg-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'tech-bg-mobile';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
        pointer-events: none;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H;

    // ── Aurora Points (large slow-drifting gradient sources) ───────────────
    const AURORA = [
        { ox: 0.15, oy: 0.20, rx: 0.12, ry: 0.08, phX: 0.00, phY: 0.50, sX: 0.18, sY: 0.14, r: [120, 0, 0], a: 0.38 },
        { ox: 0.80, oy: 0.70, rx: 0.14, ry: 0.09, phX: 1.20, phY: 0.80, sX: 0.14, sY: 0.20, r: [90, 0, 10], a: 0.30 },
        { ox: 0.50, oy: 0.40, rx: 0.18, ry: 0.12, phX: 2.40, phY: 2.00, sX: 0.10, sY: 0.12, r: [160, 0, 0], a: 0.22 },
        { ox: 0.10, oy: 0.80, rx: 0.10, ry: 0.07, phX: 3.60, phY: 1.20, sX: 0.20, sY: 0.16, r: [100, 0, 0], a: 0.24 },
        { ox: 0.85, oy: 0.15, rx: 0.12, ry: 0.08, phX: 4.80, phY: 3.00, sX: 0.16, sY: 0.18, r: [80, 0, 20], a: 0.20 },
    ];

    // ── Sparse network nodes (structured, not random-looking) ──────────────
    const NODE_COUNT = 22;
    const MAX_DIST = 160;
    let nodes = [];

    function buildNodes() {
        nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            r: 1.5 + Math.random() * 1.5,
            alpha: 0.3 + Math.random() * 0.4,
        }));
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildNodes();
    }
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    let t = 0;

    function draw(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        t += dt;

        // ── 1. Deep dark base ───────────────────────────────────────────────
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, W, H);

        // ── 2. Aurora gradient blobs ────────────────────────────────────────
        AURORA.forEach(a => {
            const x = (a.ox + Math.sin(t * a.sX + a.phX) * a.rx) * W;
            const y = (a.oy + Math.cos(t * a.sY + a.phY) * a.ry) * H;
            const rx = 0.30 * W;
            const ry = 0.28 * H;

            // Draw as an ellipse-shaped radial gradient
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1, ry / rx);              // squash to ellipse

            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
            grd.addColorStop(0, `rgba(${a.r[0]},${a.r[1]},${a.r[2]},${a.a})`);
            grd.addColorStop(0.45, `rgba(${a.r[0]},${a.r[1]},${a.r[2]},${a.a * 0.3})`);
            grd.addColorStop(1, `rgba(${a.r[0]},${a.r[1]},${a.r[2]},0)`);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, rx, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // ── 3. Sparse node network ──────────────────────────────────────────
        // Update
        nodes.forEach(n => {
            n.x += n.vx * dt;
            n.y += n.vy * dt;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
        });

        // Draw connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * 0.18;
                    ctx.strokeStyle = `rgba(180, 20, 20, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        nodes.forEach(n => {
            // Outer glow
            const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
            grd.addColorStop(0, `rgba(220, 40, 40, ${n.alpha * 0.5})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
            ctx.fill();

            // Core dot
            ctx.fillStyle = `rgba(255, 80, 80, ${n.alpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── 4. Subtle horizontal scan band (very slow, barely visible) ──────
        const scanBand = (t * 0.04) % 1;  // 0→1 over ~25s
        const sy = scanBand * (H + 120) - 60;
        const sg = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
        sg.addColorStop(0, 'transparent');
        sg.addColorStop(0.5, 'rgba(140, 0, 0, 0.04)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(0, sy - 60, W, 120);

        // ── 5. Vignette ────────────────────────────────────────────────────
        const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.15, W * 0.5, H * 0.45, H * 0.88);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        // ── 6. Film grain (adds texture, removes "digital flat" look) ───────
        if (Math.floor(t * 30) % 2 === 0) {         // update every other frame
            const imgData = ctx.getImageData(0, 0, W, H);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4 * Math.floor(8 + Math.random() * 12)) {
                const noise = (Math.random() - 0.5) * 14;
                d[i] = Math.min(255, Math.max(0, d[i] + noise));
                d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.3));
                d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.3));
            }
            ctx.putImageData(imgData, 0, 0);
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
