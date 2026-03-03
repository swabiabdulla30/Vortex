/**
 * tech_bg_alt.js — Alternative Technical Loop Background (Network Topology)
 * Usage: Include <script src="tech_bg_alt.js"></script> in any page.
 */
(function () {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'tech-bg-canvas-alt';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
        pointer-events: none;
        opacity: 0.6;
    `;
    // Insert behind other elements, but maybe remove the old one if it exists
    const oldCanvas = document.getElementById('tech-bg-canvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }

    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');

    let w, h;
    const particles = [];
    const config = {
        particleCount: 80,
        particleColor: 'rgba(255, 60, 60, 0.8)',
        lineColor: 'rgba(255, 40, 40, ', // will append alpha
        maxDist: 150,
        speed: 0.5,
        baseRadius: 2
    };

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * config.speed;
            this.vy = (Math.random() - 0.5) * config.speed;
            this.radius = Math.random() * config.baseRadius + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = w;
            if (this.x > w) this.x = 0;
            if (this.y < 0) this.y = h;
            if (this.y > h) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = config.particleColor;
            ctx.fill();

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 50, 50, 0.8)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
        loop();
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.maxDist) {
                    const alpha = 1 - (dist / config.maxDist);
                    ctx.beginPath();
                    ctx.strokeStyle = config.lineColor + alpha + ')';
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function loop() {
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawLines();

        requestAnimationFrame(loop);
    }

    init();
})();
