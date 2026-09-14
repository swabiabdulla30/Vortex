/**
 * sphere_globe.js
 * High-performance 3D Wireframe Particle Globe matching the Vortex futuristic theme.
 */
(function () {
    'use strict';

    function initGlobe() {
        const container = document.getElementById('globe-container');
        if (!container) return;

        const canvas = document.getElementById('globe-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width, height;
        let dpr = window.devicePixelRatio || 1;

        // Globe parameters
        const pointsCount = 380;
        const radiusRatio = 0.44; // Globe radius relative to container min dimension
        let radius = 220;
        const points = [];

        // Rotation angles & speeds
        let angleX = 0.25;
        let angleY = 0;
        let rotSpeedY = 0.0035;
        let targetSpeedY = 0.0035;
        let mouseX = 0;
        let mouseY = 0;
        let isHovered = false;

        // Generate points uniformly on sphere surface using Fibonacci sphere algorithm
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

        for (let i = 0; i < pointsCount; i++) {
            const y = 1 - (i / (pointsCount - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y
            const theta = phi * i; // golden angle increment

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            points.push({
                ox: x,
                oy: y,
                oz: z,
                x: 0,
                y: 0,
                z: 0,
                px: 0,
                py: 0,
                scale: 0,
                alpha: 0
            });
        }

        function resize() {
            const rect = container.getBoundingClientRect();
            width = rect.width || 500;
            height = rect.height || 500;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            ctx.scale(dpr, dpr);
            radius = Math.min(width, height) * radiusRatio;
        }

        window.addEventListener('resize', resize);
        resize();

        // Mouse interaction
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                isHovered = true;
                const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
                targetSpeedY = 0.005 + normX * 0.008;
                angleX += (normY * 0.4 - angleX) * 0.05;
            } else {
                isHovered = false;
                targetSpeedY = 0.0035;
            }
        });

        // Main render loop
        function render() {
            ctx.clearRect(0, 0, width, height);

            rotSpeedY += (targetSpeedY - rotSpeedY) * 0.05;
            angleY += rotSpeedY;

            const cx = width / 2;
            const cy = height / 2;

            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            // Project points
            for (let i = 0; i < pointsCount; i++) {
                const p = points[i];

                // Rotate around Y axis
                let x1 = p.ox * cosY - p.oz * sinY;
                let z1 = p.oz * cosY + p.ox * sinY;

                // Rotate around X axis
                let y1 = p.oy * cosX - z1 * sinX;
                let z2 = z1 * cosX + p.oy * sinX;

                // Perspective projection
                const fov = 400;
                const distance = 480;
                const perspective = fov / (fov + z2 * radius * 0.7);

                p.x = x1 * radius;
                p.y = y1 * radius;
                p.z = z2 * radius;

                p.px = cx + p.x * perspective;
                p.py = cy + p.y * perspective;
                p.scale = perspective;

                // Depth opacity: front points are bright crimson, back points are subtle
                const normZ = (z2 + 1) / 2; // 0 to 1
                p.alpha = Math.max(0.1, Math.min(1, 0.15 + normZ * 0.85));
            }

            // Draw connecting constellation lines
            const maxDistance = radius * 0.32;
            ctx.lineWidth = 0.8;

            for (let i = 0; i < pointsCount; i += 2) {
                const p1 = points[i];
                if (p1.z < -radius * 0.7) continue; // Skip far back to keep clean

                // Connect to nearest neighbors
                let connections = 0;
                for (let j = i + 1; j < pointsCount; j += 2) {
                    if (connections > 3) break;
                    const p2 = points[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dz = p1.z - p2.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < maxDistance) {
                        const lineAlpha = (1 - dist / maxDistance) * 0.35 * Math.min(p1.alpha, p2.alpha);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 30, 45, ${lineAlpha})`;
                        ctx.moveTo(p1.px, p1.py);
                        ctx.lineTo(p2.px, p2.py);
                        ctx.stroke();
                        connections++;
                    }
                }
            }

            // Draw glowing node points
            for (let i = 0; i < pointsCount; i++) {
                const p = points[i];
                const ptRadius = Math.max(0.8, (1.2 + (p.alpha > 0.6 ? 1.0 : 0)) * p.scale);

                ctx.beginPath();
                ctx.arc(p.px, p.py, ptRadius, 0, Math.PI * 2);

                if (p.alpha > 0.75) {
                    // Accent front nodes with neon crimson glow
                    ctx.fillStyle = `rgba(255, 70, 85, ${p.alpha})`;
                    ctx.shadowColor = 'rgba(255, 20, 40, 0.9)';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = `rgba(220, 25, 40, ${p.alpha * 0.7})`;
                    ctx.fill();
                }
            }

            // Draw central subtle radial glow inside the sphere
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.95);
            glow.addColorStop(0, 'rgba(255, 20, 40, 0.08)');
            glow.addColorStop(0.6, 'rgba(180, 0, 20, 0.04)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            requestAnimationFrame(render);
        }

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobe);
    } else {
        initGlobe();
    }
})();
