/**
 * tech_bg_mobile.js — Mobile Professional Background
 * Slow-drifting ambient orbs + subtle geometric dot grid.
 * Only activates on screens ≤ 768px.
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

    // ── Ambient Orbs ───────────────────────────────────────────────────────
    const ORB_COUNT = 4;
    let orbs = [];

    function makeOrb(i) {
        return {
            x: W * (0.15 + Math.random() * 0.7),
            y: H * (0.1 + Math.random() * 0.8),
            r: 100 + Math.random() * 140,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            // Each orb subtly different hue of deep red
            color: [
                [139, 0, 0],
                [100, 0, 0],
                [170, 10, 10],
                [80, 0, 20],
            ][i % 4],
            alpha: 0.10 + Math.random() * 0.10,
            pulseSpeed: 0.3 + Math.random() * 0.4,
            pulseOffset: Math.random() * Math.PI * 2,
        };
    }

    // ── Dot Grid ───────────────────────────────────────────────────────────
    const DOT_SPACING = 28;
    const DOT_RADIUS = 1;

    function initOrbs() {
        orbs = Array.from({ length: ORB_COUNT }, (_, i) => makeOrb(i));
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initOrbs();
    }
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();

    function draw(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        // ── Base background ─────────────────────────────────────────────────
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, W, H);

        // ── Dot grid ────────────────────────────────────────────────────────
        const cols = Math.ceil(W / DOT_SPACING) + 1;
        const rows = Math.ceil(H / DOT_SPACING) + 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * DOT_SPACING;
                const y = r * DOT_SPACING;
                // Closer dots to orb centers glow slightly
                let glow = 0.06;
                orbs.forEach(o => {
                    const dx = x - o.x, dy = y - o.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < o.r * 0.7) glow = Math.min(glow + 0.12 * (1 - dist / (o.r * 0.7)), 0.35);
                });
                ctx.beginPath();
                ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 0, 0, ${glow})`;
                ctx.fill();
            }
        }

        // ── Ambient orbs ────────────────────────────────────────────────────
        orbs.forEach(o => {
            // Move
            o.x += o.vx * dt;
            o.y += o.vy * dt;

            // Soft boundary bounce
            if (o.x < -o.r) { o.x = -o.r; o.vx *= -1; }
            if (o.x > W + o.r) { o.x = W + o.r; o.vx *= -1; }
            if (o.y < -o.r) { o.y = -o.r; o.vy *= -1; }
            if (o.y > H + o.r) { o.y = H + o.r; o.vy *= -1; }

            // Pulse
            const pulse = 1 + 0.08 * Math.sin(now * 0.001 * o.pulseSpeed + o.pulseOffset);
            const r = o.r * pulse;
            const [R, G, B] = o.color;
            const a = o.alpha * (0.85 + 0.15 * Math.sin(now * 0.001 * o.pulseSpeed * 1.3 + o.pulseOffset));

            const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
            grd.addColorStop(0, `rgba(${R}, ${G}, ${B}, ${a})`);
            grd.addColorStop(0.5, `rgba(${R}, ${G}, ${B}, ${a * 0.4})`);
            grd.addColorStop(1, `rgba(${R}, ${G}, ${B}, 0)`);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── Thin diagonal accent lines (very subtle) ────────────────────────
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        const shift = (now * 0.006) % (DOT_SPACING * 2);
        for (let x = -H + shift; x < W + H; x += DOT_SPACING * 2) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + H, H);
            ctx.stroke();
        }
        ctx.restore();

        // ── Top edge glow (brand touch) ─────────────────────────────────────
        const topGlow = ctx.createLinearGradient(0, 0, 0, 120);
        topGlow.addColorStop(0, 'rgba(139, 0, 0, 0.12)');
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, W, 120);

        // ── Edge vignette ────────────────────────────────────────────────────
        const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
