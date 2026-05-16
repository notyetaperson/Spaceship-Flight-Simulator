// Laser System - Powerful Beam Weapon
class LaserSystem {
    constructor() {
        this.lasers = [];
        this.maxLasers = 3; // Maximum active lasers
        this.beamLength = 1000; // Visual beam length
        this.beamWidth = 15; // Beam width
    }

    // Fire a laser from spaceship
    fireLaser(spaceship) {
        if (this.lasers.length >= this.maxLasers) {
            return; // Too many lasers already
        }

        // Create laser beam starting from spaceship nose
        const laserStart = spaceship.position.add(
            spaceship.forward.multiply(spaceship.size * 3)
        );

        this.lasers.push({
            startPosition: laserStart.clone(),
            position: laserStart.clone(),
            direction: spaceship.forward.clone(),
            target: null, // Will be set to nearest sun
            speed: 80, // Very fast
            life: 5, // Lifetime in seconds
            maxLife: 5,
            width: this.beamWidth,
            hit: false,
            impactTime: 0,
            trail: [] // For visual trail
        });
    }

    // Find nearest sun to target
    findNearestSun(laser, celestialBodies) {
        let nearest = null;
        let minDist = Infinity;

        for (let body of celestialBodies.bodies) {
            if (body.type === 'sun') {
                const dist = laser.position.distance(body.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = body;
                }
            }
        }

        return nearest;
    }

    // Update lasers
    update(deltaTime, spaceship, celestialBodies) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            // Find target if we don't have one
            if (!laser.target && !laser.hit) {
                laser.target = this.findNearestSun(laser, celestialBodies);
            }

            // Move laser beam
            if (!laser.hit) {
                const moveDistance = laser.speed * deltaTime * 60;
                laser.position = laser.position.add(laser.direction.multiply(moveDistance));

                // Update trail
                laser.trail.push(laser.position.clone());
                if (laser.trail.length > 5) {
                    laser.trail.shift();
                }

                // Check collision with target
                if (laser.target) {
                    const toTarget = laser.target.position.subtract(laser.position);
                    const distance = toTarget.magnitude();

                    // Check if target still exists
                    const targetStillExists = celestialBodies.bodies.includes(laser.target);

                    if (!targetStillExists || distance < laser.target.size + laser.width) {
                        // Hit! Create massive explosion
                        laser.hit = true;
                        laser.impactTime = 0;
                        const impactPos = laser.position.clone();
                        if (targetStillExists) {
                            this.createSunExplosion(laser.position, laser.target, celestialBodies);
                        } else {
                            this.createSunExplosion(laser.position, null, celestialBodies);
                        }
                        
                        // Trigger camera tracking
                        if (window.game && window.game.camera) {
                            window.game.camera.trackImpact(impactPos);
                        }
                    }
                }
            } else {
                // Laser has hit, keep it visible briefly
                laser.impactTime += deltaTime;
                if (laser.impactTime > 0.2) {
                    this.lasers.splice(i, 1);
                    continue;
                }
            }

            // Update lifetime
            laser.life -= deltaTime;
            if (laser.life <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }

    // Create spectacular sun explosion (even bigger than planet explosion)
    createSunExplosion(position, target, celestialBodies) {
        // Remove the sun from the celestial bodies if it exists
        if (target) {
            const index = celestialBodies.bodies.indexOf(target);
            if (index !== -1) {
                celestialBodies.bodies.splice(index, 1);
            }
        }

        // Store explosion for rendering
        if (!window.game) return;
        
        if (!window.game.explosions) {
            window.game.explosions = [];
        }

        const explosionSize = target ? target.size : 100; // Default size if no target

        window.game.explosions.push({
            position: position.clone(),
            age: 0,
            maxAge: 4, // Longer explosion for sun
            radius: explosionSize * 3,
            maxRadius: explosionSize * 10, // Much bigger than planet explosion
            particles: this.generateSunExplosionParticles(position, target),
            isSunExplosion: true, // Flag for special rendering
            shockwaves: [] // Multiple shockwave rings
        });

        // Generate multiple shockwaves for spectacular effect
        for (let i = 0; i < 5; i++) {
            window.game.explosions[window.game.explosions.length - 1].shockwaves.push({
                radius: explosionSize * (2 + i * 0.5),
                speed: 50 + i * 20,
                alpha: 1.0,
                color: i % 2 === 0 ? '#ffff00' : '#ff6600'
            });
        }

        // Create massive waves from sun explosion
        if (window.game && window.game.waveSystem) {
            const intensity = target ? target.size / 50 : 1.0;
            window.game.waveSystem.createWaves(position, intensity * 2); // Double intensity for sun
        }
    }

    // Generate particles for sun explosion (more particles than planet)
    generateSunExplosionParticles(position, target) {
        const particles = [];
        const particleCount = 300; // More particles for spectacular effect

        const baseColor = target ? target.color : '#ffaa00';

        for (let i = 0; i < particleCount; i++) {
            const angle = random(0, Math.PI * 2);
            const elevation = random(-Math.PI / 2, Math.PI / 2);
            const speed = random(15, 60); // Faster particles
            
            const vx = Math.cos(elevation) * Math.cos(angle) * speed;
            const vy = Math.sin(elevation) * speed;
            const vz = Math.cos(elevation) * Math.sin(angle) * speed;

            // Mix sun colors with explosion colors
            const colorMix = Math.random();
            let color;
            if (colorMix < 0.25) {
                color = baseColor; // Sun color
            } else if (colorMix < 0.4) {
                color = '#ffff00'; // Bright yellow
            } else if (colorMix < 0.6) {
                color = '#ffaa00'; // Orange
            } else if (colorMix < 0.8) {
                color = '#ff6600'; // Red-orange
            } else {
                color = '#ffffff'; // White hot
            }

            particles.push({
                position: position.clone(),
                velocity: new Vector3D(vx, vy, vz),
                life: 2.0,
                maxLife: 2.0,
                size: random(5, 18), // Larger particles
                color: color,
                glowSize: random(15, 35) // Larger glow
            });
        }

        return particles;
    }

    // Render lasers
    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);

        for (let laser of this.lasers) {
            // Project laser start and end positions
            const startProj = renderer.projection.projectVector3D(
                laser.startPosition, viewMatrix
            );
            const endProj = renderer.projection.projectVector3D(
                laser.position, viewMatrix
            );
            
            if (!startProj || !startProj.visible || !endProj || !endProj.visible) continue;

            ctx.save();
            
            // Draw laser beam with glowing effect
            const depth = 1 - Math.min(startProj.z, endProj.z);
            ctx.globalAlpha = depth;

            // Outer glow
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
            ctx.lineWidth = laser.width * 2;
            ctx.shadowBlur = laser.width * 3;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.9)';
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(startProj.x, startProj.y);
            ctx.lineTo(endProj.x, endProj.y);
            ctx.stroke();

            // Inner bright core
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = laser.width * 0.6;
            ctx.shadowBlur = laser.width * 2;
            ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
            
            ctx.beginPath();
            ctx.moveTo(startProj.x, startProj.y);
            ctx.lineTo(endProj.x, endProj.y);
            ctx.stroke();

            // Add energy pulses along the beam
            if (!laser.hit) {
                const pulseTime = Date.now() * 0.01;
                const pulseCount = 3;
                for (let i = 0; i < pulseCount; i++) {
                    const t = (pulseTime + i * 0.33) % 1;
                    const pulseX = startProj.x + (endProj.x - startProj.x) * t;
                    const pulseY = startProj.y + (endProj.y - startProj.y) * t;
                    
                    const pulseSize = laser.width * (1.5 + Math.sin(pulseTime * 5) * 0.5);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowBlur = pulseSize * 2;
                    ctx.beginPath();
                    ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
}

