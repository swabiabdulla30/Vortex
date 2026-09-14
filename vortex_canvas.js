/**
 * vortex_canvas.js — Interactive 3D Technological Vortex Visual
 * Vortex Innovators - Department of Computer Applications
 * Renders an abstract technological vortex made of:
 * - Dark metallic faceted shards
 * - Glowing crimson & neon red energy filaments
 * - Orbiting particles & network connection lines
 * - Atmospheric volumetric core & lighting
 * - Smooth 3D mouse parallax tilt & inertia
 */

(function () {
    'use strict';

    class VortexEngine {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.width = 0;
            this.height = 0;
            this.centerX = 0;
            this.centerY = 0;

            // Tilt & 3D projection parameters
            this.tiltX = 0.55; // default isometric tilt (pitch)
            this.tiltY = -0.2; // default yaw
            this.targetTiltX = 0.55;
            this.targetTiltY = -0.2;
            this.focalLength = 650;
            this.time = 0;

            // Shards, rings, particles
            this.shards = [];
            this.particles = [];
            this.rings = [];
            this.energySpirals = [];

            this.initDimensions();
            this.createGeometry();
            this.bindEvents();
            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }

        initDimensions() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.width = rect.width || 800;
            this.height = rect.height || 800;

            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);

            this.centerX = this.width * 0.5;
            this.centerY = this.height * 0.5;
        }

        createGeometry() {
            this.shards = [];
            this.particles = [];
            this.rings = [];
            this.energySpirals = [];

            // 1. Shards: Metallic polygonal plates arranged in concentric orbiting layers
            const shardCount = 85;
            for (let i = 0; i < shardCount; i++) {
                const layer = Math.floor(Math.random() * 4); // 4 orbital bands
                const baseRadius = 90 + layer * 55 + Math.random() * 35;
                const angle = Math.random() * Math.PI * 2;
                const speed = (0.003 + (4 - layer) * 0.002) * (Math.random() > 0.5 ? 1 : 1);
                const size = 12 + Math.random() * 22;
                const heightOffset = (Math.random() - 0.5) * 45;
                const brightness = 18 + Math.floor(Math.random() * 32); // Dark metallic
                const hasRedTrim = Math.random() > 0.65;

                this.shards.push({
                    baseRadius,
                    angle,
                    speed,
                    size,
                    heightOffset,
                    brightness,
                    hasRedTrim,
                    rotationAngle: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.02
                });
            }

            // 2. Energy Rings: Nested elliptical technical orbits
            const ringRadii = [85, 130, 180, 240, 290];
            ringRadii.forEach((r, idx) => {
                this.rings.push({
                    radius: r,
                    speed: (idx % 2 === 0 ? 1 : -1) * (0.004 + idx * 0.0015),
                    rotation: Math.random() * Math.PI,
                    dashArray: [12 + idx * 6, 8 + idx * 4, 3, 14],
                    alpha: 0.35 + (idx % 2) * 0.35,
                    width: idx === 1 || idx === 3 ? 1.8 : 1.0,
                    color: idx % 2 === 0 ? 'rgba(255, 42, 75, ' : 'rgba(180, 15, 35, '
                });
            });

            // 3. Orbiting Particles & Energy Sparks
            const particleCount = 140;
            for (let i = 0; i < particleCount; i++) {
                const radius = 50 + Math.random() * 280;
                this.particles.push({
                    radius,
                    angle: Math.random() * Math.PI * 2,
                    speed: (0.008 + (300 - radius) * 0.00008) * (Math.random() > 0.15 ? 1 : -0.8),
                    yOffset: (Math.random() - 0.5) * 60,
                    size: 1.2 + Math.random() * 2.2,
                    alpha: 0.3 + Math.random() * 0.7,
                    isNeon: Math.random() > 0.5
                });
            }

            // 4. Energy Spiral Filaments
            for (let s = 0; s < 3; s++) {
                this.energySpirals.push({
                    baseAngle: (s * Math.PI * 2) / 3,
                    speed: 0.009,
                    length: 45
                });
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.initDimensions();
            });

            const onMouseMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - (rect.left + rect.width * 0.5);
                const mouseY = e.clientY - (rect.top + rect.height * 0.5);

                // Subtle parallax range
                this.targetTiltY = (mouseX / window.innerWidth) * 0.45;
                this.targetTiltX = 0.55 + (mouseY / window.innerHeight) * 0.35;
            };

            window.addEventListener('mousemove', onMouseMove, { passive: true });
        }

        project(x, y, z) {
            // Apply 3D rotation (tiltX for pitch, tiltY for yaw)
            // 1. Yaw rotation around Y axis
            const cosY = Math.cos(this.tiltY);
            const sinY = Math.sin(this.tiltY);
            const x1 = x * cosY + z * sinY;
            const y1 = y;
            const z1 = -x * sinY + z * cosY;

            // 2. Pitch rotation around X axis
            const cosX = Math.cos(this.tiltX);
            const sinX = Math.sin(this.tiltX);
            const x2 = x1;
            const y2 = y1 * cosX - z1 * sinX;
            const z2 = y1 * sinX + z1 * cosX;

            // Perspective scale
            const scale = this.focalLength / (this.focalLength + z2 + 300);
            return {
                x: this.centerX + x2 * scale,
                y: this.centerY + y2 * scale,
                scale,
                depth: z2
            };
        }

        drawVortexCore() {
            const ctx = this.ctx;
            const coreProj = this.project(0, 0, 0);

            // Deep atmospheric volumetric ambient glow
            const glowRadius = 260 * coreProj.scale;
            const ambientGrad = ctx.createRadialGradient(
                coreProj.x, coreProj.y, 10 * coreProj.scale,
                coreProj.x, coreProj.y, glowRadius
            );
            ambientGrad.addColorStop(0, 'rgba(255, 30, 50, 0.45)');
            ambientGrad.addColorStop(0.25, 'rgba(160, 10, 25, 0.22)');
            ambientGrad.addColorStop(0.6, 'rgba(80, 0, 15, 0.08)');
            ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.save();
            ctx.fillStyle = ambientGrad;
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner dark singularity core
            const innerRadius = 45 * coreProj.scale;
            const innerGrad = ctx.createRadialGradient(
                coreProj.x, coreProj.y, 2 * coreProj.scale,
                coreProj.x, coreProj.y, innerRadius
            );
            innerGrad.addColorStop(0, '#000000');
            innerGrad.addColorStop(0.65, '#050305');
            innerGrad.addColorStop(0.88, 'rgba(255, 20, 40, 0.8)');
            innerGrad.addColorStop(1, 'rgba(255, 40, 60, 0)');

            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, innerRadius, 0, Math.PI * 2);
            ctx.fill();

            // Core technical reticle ring
            ctx.strokeStyle = 'rgba(255, 60, 80, 0.6)';
            ctx.lineWidth = 1.2 * coreProj.scale;
            ctx.beginPath();
            ctx.arc(coreProj.x, coreProj.y, 22 * coreProj.scale, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        drawEnergyRings() {
            const ctx = this.ctx;
            const segments = 64;

            this.rings.forEach(ring => {
                ring.rotation += ring.speed;
                ctx.save();
                ctx.lineWidth = ring.width;
                ctx.strokeStyle = ring.color + ring.alpha + ')';
                ctx.beginPath();

                let firstPoint = null;
                for (let i = 0; i <= segments; i++) {
                    const theta = ring.rotation + (i / segments) * Math.PI * 2;
                    const x = Math.cos(theta) * ring.radius;
                    const z = Math.sin(theta) * ring.radius;
                    const y = Math.sin(theta * 3 + this.time * 2) * 5; // gentle undulation

                    const p = this.project(x, y, z);
                    if (i === 0) {
                        firstPoint = p;
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                ctx.stroke();

                // Small technical orbit markers along the ring
                for (let k = 0; k < 3; k++) {
                    const markerAngle = ring.rotation + (k * Math.PI * 2) / 3;
                    const mx = Math.cos(markerAngle) * ring.radius;
                    const mz = Math.sin(markerAngle) * ring.radius;
                    const mp = this.project(mx, 0, mz);
                    ctx.fillStyle = '#ff2a4b';
                    ctx.beginPath();
                    ctx.arc(mp.x, mp.y, 2.5 * mp.scale, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });
        }

        drawEnergySpirals() {
            const ctx = this.ctx;
            ctx.save();

            this.energySpirals.forEach(spiral => {
                spiral.baseAngle += spiral.speed;
                ctx.beginPath();

                for (let i = 0; i < spiral.length; i++) {
                    const t = i / spiral.length;
                    const r = 50 + t * 240;
                    const theta = spiral.baseAngle - t * Math.PI * 2.2;
                    const x = Math.cos(theta) * r;
                    const z = Math.sin(theta) * r;
                    const y = Math.sin(t * 10 - this.time * 4) * 8;

                    const p = this.project(x, y, z);
                    if (i === 0) {
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }

                const grad = ctx.createLinearGradient(
                    this.centerX - 100, this.centerY,
                    this.centerX + 200, this.centerY
                );
                grad.addColorStop(0, 'rgba(255, 30, 50, 0.85)');
                grad.addColorStop(0.5, 'rgba(255, 70, 90, 0.4)');
                grad.addColorStop(1, 'rgba(255, 20, 40, 0)');

                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.0;
                ctx.stroke();
            });

            ctx.restore();
        }

        drawShards() {
            const ctx = this.ctx;

            // Sort shards by depth so far ones render behind near ones
            const renderList = [];

            this.shards.forEach(s => {
                s.angle += s.speed;
                s.rotationAngle += s.rotSpeed;

                const x = Math.cos(s.angle) * s.baseRadius;
                const z = Math.sin(s.angle) * s.baseRadius;
                const y = s.heightOffset + Math.sin(s.angle * 2 + this.time) * 10;

                const proj = this.project(x, y, z);

                renderList.push({
                    shard: s,
                    proj,
                    depth: proj.depth
                });
            });

            renderList.sort((a, b) => b.depth - a.depth);

            renderList.forEach(item => {
                const s = item.shard;
                const p = item.proj;
                const scale = p.scale;
                const size = s.size * scale;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(s.rotationAngle + this.tiltY * 0.5);

                // Metallic polygon shape (faceted shard)
                ctx.beginPath();
                ctx.moveTo(-size * 0.7, -size * 0.35);
                ctx.lineTo(size * 0.3, -size * 0.6);
                ctx.lineTo(size * 0.8, size * 0.15);
                ctx.lineTo(size * 0.1, size * 0.55);
                ctx.lineTo(-size * 0.6, size * 0.4);
                ctx.closePath();

                // Dark metallic gradient fill
                const metalGrad = ctx.createLinearGradient(-size, -size, size, size);
                const b = s.brightness;
                metalGrad.addColorStop(0, `rgb(${b + 28}, ${b + 18}, ${b + 22})`);
                metalGrad.addColorStop(0.4, `rgb(${b}, ${b - 4}, ${b - 2})`);
                metalGrad.addColorStop(1, `rgb(${Math.max(6, b - 12)}, ${Math.max(6, b - 14)}, ${Math.max(8, b - 10)})`);

                ctx.fillStyle = metalGrad;
                ctx.fill();

                // Shard edges: high-contrast metallic specular edge + optional crimson glow
                ctx.lineWidth = 1;
                if (s.hasRedTrim) {
                    ctx.strokeStyle = 'rgba(255, 42, 75, 0.7)';
                    ctx.shadowColor = '#ff2a4b';
                    ctx.shadowBlur = 6 * scale;
                } else {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * scale})`;
                }
                ctx.stroke();

                ctx.restore();
            });
        }

        drawParticles() {
            const ctx = this.ctx;
            const activePoints = [];

            this.particles.forEach(pt => {
                pt.angle += pt.speed;
                const x = Math.cos(pt.angle) * pt.radius;
                const z = Math.sin(pt.angle) * pt.radius;
                const y = pt.yOffset + Math.cos(pt.angle * 3 + this.time) * 12;

                const p = this.project(x, y, z);
                activePoints.push({ x: p.x, y: p.y, scale: p.scale, pt });

                ctx.save();
                const radius = pt.size * p.scale;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.6, radius), 0, Math.PI * 2);

                if (pt.isNeon) {
                    ctx.fillStyle = `rgba(255, 60, 85, ${pt.alpha})`;
                    ctx.shadowColor = 'rgba(255, 40, 60, 0.9)';
                    ctx.shadowBlur = 8 * p.scale;
                } else {
                    ctx.fillStyle = `rgba(220, 220, 230, ${pt.alpha * 0.8})`;
                }
                ctx.fill();
                ctx.restore();
            });

            // Network connection lines between close neighbor particles
            ctx.save();
            ctx.lineWidth = 0.7;
            const maxDist = 55;
            for (let i = 0; i < activePoints.length; i += 2) {
                for (let j = i + 1; j < activePoints.length; j += 4) {
                    const p1 = activePoints[i];
                    const p2 = activePoints[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    if (d < maxDist) {
                        const alpha = (1 - d / maxDist) * 0.25;
                        ctx.strokeStyle = `rgba(255, 50, 70, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        }

        loop() {
            this.time += 0.016;

            // Damping tilt towards target (smooth inertia)
            this.tiltX += (this.targetTiltX - this.tiltX) * 0.05;
            this.tiltY += (this.targetTiltY - this.tiltY) * 0.05;

            this.ctx.clearRect(0, 0, this.width, this.height);

            // Layered 3D composition
            this.drawVortexCore();
            this.drawEnergyRings();
            this.drawEnergySpirals();
            this.drawShards();
            this.drawParticles();

            requestAnimationFrame(this.loop);
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new VortexEngine('vortex-canvas-3d');
        });
    } else {
        new VortexEngine('vortex-canvas-3d');
    }
})();
