// Missile System - Homing Missiles
class MissileSystem {
    constructor() {
        this.missiles = [];
        this.maxMissiles = 10; // Maximum active missiles
    }

    // Fire a homing missile from spaceship
    fireMissile(spaceship) {
        if (this.missiles.length >= this.maxMissiles) {
            return; // Too many missiles already
        }

        // Create missile at spaceship position, slightly behind
        const missilePosition = spaceship.position.add(
            spaceship.forward.multiply(-spaceship.size * 1.5)
        );

        this.missiles.push({
            position: missilePosition.clone(),
            velocity: spaceship.forward.multiply(spaceship.getSpeed() * 0.8), // Start with some velocity
            target: null, // Will be set to nearest planet
            life: 10, // Lifetime in seconds
            maxLife: 10,
            size: 8,
            speed: 15, // Missile speed
            trail: [] // Trail for visual effect
        });
    }

    // Find nearest planet to target
    findNearestPlanet(missile, celestialBodies) {
        let nearest = null;
        let minDist = Infinity;

        for (let body of celestialBodies.bodies) {
            if (body.type === 'planet') {
                const dist = missile.position.distance(body.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = body;
                }
            }
        }

        return nearest;
    }

    // Update missiles
    update(deltaTime, spaceship, celestialBodies) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            // Find target if we don't have one
            if (!missile.target) {
                missile.target = this.findNearestPlanet(missile, celestialBodies);
            }

            // Homing behavior
            if (missile.target) {
                const toTarget = missile.target.position.subtract(missile.position);
                const distance = toTarget.magnitude();
                
                // Check if target still exists (might have been destroyed)
                const targetStillExists = celestialBodies.bodies.includes(missile.target);
                
                    if (!targetStillExists || distance < missile.target.size + missile.size) {
                        // Hit! Create explosion and remove missile
                        const impactPos = missile.position.clone();
                        if (targetStillExists) {
                            this.createExplosion(missile.position, missile.target, celestialBodies);
                        } else {
                            // Target was destroyed, create explosion anyway
                            this.createExplosion(missile.position, null, celestialBodies);
                        }
                        
                        // Trigger camera tracking
                        if (window.game && window.game.camera) {
                            window.game.camera.trackImpact(impactPos);
                        }
                        
                        this.missiles.splice(i, 1);
                        continue;
                    }

                // Steer towards target
                const direction = toTarget.normalize();
                const desiredVelocity = direction.multiply(missile.speed);
                const steering = desiredVelocity.subtract(missile.velocity);
                const steeringForce = steering.multiply(0.1); // Homing strength
                
                missile.velocity = missile.velocity.add(steeringForce);
                
                // Limit velocity
                const currentSpeed = missile.velocity.magnitude();
                if (currentSpeed > missile.speed) {
                    missile.velocity = missile.velocity.normalize().multiply(missile.speed);
                }
            }

            // Update position
            missile.position = missile.position.add(
                missile.velocity.multiply(deltaTime * 60)
            );

            // Update trail
            missile.trail.push(missile.position.clone());
            if (missile.trail.length > 15) {
                missile.trail.shift();
            }

            // Update lifetime
            missile.life -= deltaTime;
            if (missile.life <= 0) {
                this.missiles.splice(i, 1);
            }
        }
    }

    // Create spectacular explosion effect
    createExplosion(position, target, celestialBodies) {
        // Remove the planet from the celestial bodies if it exists
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

        const explosionSize = target ? target.size : 50; // Default size if no target

        window.game.explosions.push({
            position: position.clone(),
            age: 0,
            maxAge: 2, // 2 seconds explosion
            radius: explosionSize * 2,
            maxRadius: explosionSize * 5,
            particles: this.generateExplosionParticles(position, target)
        });

        // Create waves from explosion
        if (window.game && window.game.waveSystem) {
            const intensity = target ? target.size / 100 : 0.5;
            window.game.waveSystem.createWaves(position, intensity);
        }
    }

    // Generate particles for explosion
    generateExplosionParticles(position, target) {
        const particles = [];
        const particleCount = 150; // More particles for spectacular effect

        const baseColor = target ? target.color : '#ff6600';

        for (let i = 0; i < particleCount; i++) {
            const angle = random(0, Math.PI * 2);
            const elevation = random(-Math.PI / 2, Math.PI / 2);
            const speed = random(8, 40);
            
            const vx = Math.cos(elevation) * Math.cos(angle) * speed;
            const vy = Math.sin(elevation) * speed;
            const vz = Math.cos(elevation) * Math.sin(angle) * speed;

            // Mix planet color with explosion colors
            const colorMix = Math.random();
            let color;
            if (colorMix < 0.3) {
                color = baseColor; // Planet color
            } else if (colorMix < 0.6) {
                color = '#ffaa00'; // Orange
            } else {
                color = '#ff6600'; // Red-orange
            }

            particles.push({
                position: position.clone(),
                velocity: new Vector3D(vx, vy, vz),
                life: 1.5,
                maxLife: 1.5,
                size: random(4, 12),
                color: color,
                glowSize: random(8, 20)
            });
        }

        return particles;
    }

    // Render missiles
    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);

        for (let missile of this.missiles) {
            // Project missile position
            const projected = renderer.projection.projectVector3D(missile.position, viewMatrix);
            
            if (!projected || !projected.visible) continue;

            // Render trail
            if (missile.trail.length > 1) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 5;
                ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
                
                ctx.beginPath();
                for (let i = 0; i < missile.trail.length; i++) {
                    const trailProj = renderer.projection.projectVector3D(
                        missile.trail[i], viewMatrix
                    );
                    if (trailProj && trailProj.visible) {
                        const alpha = i / missile.trail.length;
                        ctx.strokeStyle = `rgba(255, ${200 - alpha * 100}, 0, ${0.6 * alpha})`;
                        if (i === 0) {
                            ctx.moveTo(trailProj.x, trailProj.y);
                        } else {
                            ctx.lineTo(trailProj.x, trailProj.y);
                        }
                    }
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // Render missile body
            ctx.save();
            const depth = 1 - projected.z;
            ctx.globalAlpha = Math.max(0.8, depth);

            // Glow
            ctx.fillStyle = 'rgba(255, 150, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, missile.size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Missile body
            ctx.fillStyle = '#ffaa00';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, missile.size, 0, Math.PI * 2);
            ctx.fill();

            // Missile tip
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, missile.size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}

