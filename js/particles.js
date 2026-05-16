// Particle System (3D)
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExhaust(spaceship, count = 5) {
        // Create exhaust from engine positions
        const exhaustPositions = spaceship.getExhaustPositions();
        const speed = spaceship.getSpeed();
        const speedFactor = Math.min(1 + speed / 20, 3); // Increase intensity with speed
        
        // Distribute particles across all engines
        const particlesPerEngine = Math.ceil(count / exhaustPositions.length);
        
        for (let engineIdx = 0; engineIdx < exhaustPositions.length; engineIdx++) {
            const exhaustPos = exhaustPositions[engineIdx];
            
            for (let i = 0; i < particlesPerEngine; i++) {
                const spread = new Vector3D(
                    random(-PARTICLE_SPREAD * speedFactor, PARTICLE_SPREAD * speedFactor),
                    random(-PARTICLE_SPREAD * speedFactor, PARTICLE_SPREAD * speedFactor),
                    random(-PARTICLE_SPREAD * speedFactor, PARTICLE_SPREAD * speedFactor)
                );
                
                const baseSpeed = random(2, 5) * speedFactor;
                const velocity = spaceship.forward.multiply(-baseSpeed).add(spread);
                
                this.particles.push({
                    position: exhaustPos.clone(),
                    velocity: velocity,
                    life: PARTICLE_LIFETIME,
                    maxLife: PARTICLE_LIFETIME,
                    size: random(2, 4) * speedFactor
                });
            }
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position = p.position.add(p.velocity);
            p.life--;

            // Fade out and slow down
            p.velocity = p.velocity.multiply(0.98);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        
        // Sort by depth
        const sorted = this.particles.slice().sort((a, b) => {
            const depthA = renderer.projection.getDepth(a.position.x, a.position.y, a.position.z, viewMatrix);
            const depthB = renderer.projection.getDepth(b.position.x, b.position.y, b.position.z, viewMatrix);
            return depthB - depthA;
        });

        for (let p of sorted) {
            const projected = renderer.projection.projectVector3D(p.position, viewMatrix);
            
            if (projected.visible) {
                const alpha = (p.life / p.maxLife) * (1 - projected.z);
                const depth = 1 - projected.z;
                const size = p.size * (1 + depth);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = COLORS.EXHAUST;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    clear() {
        this.particles = [];
    }
}

