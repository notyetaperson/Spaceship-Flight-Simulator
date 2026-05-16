// Massive Waves System (like boatsim)
class WaveSystem {
    constructor() {
        this.waves = [];
        this.maxWaves = 10;
    }

    // Create massive waves at a position (triggered by explosions)
    createWaves(position, intensity = 1.0) {
        if (this.waves.length >= this.maxWaves) {
            // Remove oldest wave
            this.waves.shift();
        }

        const waveCount = Math.floor(3 + intensity * 2); // 3-5 waves
        const baseHeight = 50 * intensity;
        const baseSpeed = 30 * intensity;
        const baseRadius = 100 * intensity;

        for (let i = 0; i < waveCount; i++) {
            this.waves.push({
                center: position.clone(),
                radius: 0,
                maxRadius: baseRadius * (1.5 + i * 0.5),
                height: baseHeight * (1.0 - i * 0.2),
                speed: baseSpeed * (1.0 + i * 0.1),
                frequency: 0.15 + i * 0.05,
                lifetime: 3000 + i * 500, // 3-5 seconds
                startTime: Date.now(),
                intensity: intensity * (1.0 - i * 0.15)
            });
        }
    }

    // Update waves
    update(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const wave = this.waves[i];
            const elapsed = currentTime - wave.startTime;
            
            if (elapsed < 0 || elapsed > wave.lifetime) {
                this.waves.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / wave.lifetime;
            wave.radius = wave.speed * (elapsed / 1000); // Expand over time
            
            // Waves fade out as they age
            wave.currentIntensity = wave.intensity * (1.0 - progress * 0.7);
        }
    }

    // Render waves as expanding rings on terrain
    render(ctx, renderer, camera, spaceship) {
        if (this.waves.length === 0) return;

        const viewMatrix = camera.getViewMatrix(spaceship);
        
        for (let wave of this.waves) {
            // Project wave center to screen
            const centerProj = renderer.projection.projectVector3D(wave.center, viewMatrix);
            
            if (!centerProj || !centerProj.visible) continue;

            const depth = 1 - centerProj.z;
            const progress = (Date.now() - wave.startTime) / wave.lifetime;
            
            // Draw expanding wave rings
            ctx.save();
            ctx.globalAlpha = wave.currentIntensity * depth * (1.0 - progress);
            
            // Draw multiple ring layers for each wave
            const ringCount = 3;
            for (let ring = 0; ring < ringCount; ring++) {
                const ringOffset = ring * 15;
                const ringRadius = (wave.radius + ringOffset) * depth * 0.5; // Scale to screen
                
                if (ringRadius > 0 && ringRadius < Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 2) {
                    // Outer glow
                    const glowGradient = ctx.createRadialGradient(
                        centerProj.x, centerProj.y, ringRadius * 0.8,
                        centerProj.x, centerProj.y, ringRadius * 1.2
                    );
                    glowGradient.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
                    glowGradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
                    glowGradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(centerProj.x, centerProj.y, ringRadius * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Main ring
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 * (1 - ring / ringCount)})`;
                    ctx.lineWidth = 3 - ring;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(centerProj.x, centerProj.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            
            // Draw wave height indicator (vertical line)
            const heightIndicator = wave.height * depth * (1.0 - progress * 0.5);
            if (heightIndicator > 2) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${wave.currentIntensity * depth * 0.5})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerProj.x, centerProj.y - heightIndicator);
                ctx.lineTo(centerProj.x, centerProj.y + heightIndicator);
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // Check if a position is affected by waves (for physics/effects)
    getWaveHeightAt(position) {
        let totalHeight = 0;
        const currentTime = Date.now();
        
        for (let wave of this.waves) {
            const elapsed = currentTime - wave.startTime;
            if (elapsed < 0 || elapsed > wave.lifetime) continue;
            
            const distance = wave.center.distance(position);
            const distanceFromFront = Math.abs(distance - wave.radius);
            
            if (distanceFromFront < wave.maxRadius * 0.4 && wave.radius < wave.maxRadius) {
                const falloff = 1.0 - (distanceFromFront / (wave.maxRadius * 0.4));
                const wavePhase = (distance - wave.radius) * wave.frequency;
                const waveHeight = Math.sin(wavePhase) * wave.height * falloff;
                totalHeight += waveHeight;
            }
        }
        
        return totalHeight;
    }
}

