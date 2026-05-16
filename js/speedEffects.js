// Speed-Based Special Effects
class SpeedEffects {
    constructor() {
        this.maxSpeedForEffects = 50; // Speed threshold for maximum effects
        this.speedLines = [];
        this.maxSpeedLines = 80; // Reduced for performance
        this.warpParticles = []; // Particles for warp effect
        this.maxWarpParticles = 50; // Limit warp particles
        this.time = 0; // Animation time
        this.frameSkip = 0; // Skip frames for expensive effects
    }

    // Generate speed lines based on current speed - enhanced with radial streaks
    generateSpeedLines(spaceship, deltaTime) {
        const speed = spaceship.getSpeed();
        
        if (speed < 5) {
            // Clear speed lines if too slow
            this.speedLines = [];
            this.warpParticles = [];
            return;
        }

        const speedRatio = Math.min(speed / this.maxSpeedForEffects, 1.0);
        
        // Throttle generation based on speed ratio to reduce overhead
        const generationRate = Math.max(0.5, speedRatio); // Generate less at lower speeds
        
        // Generate radial streaks from center (warp speed effect)
        const linesToAdd = Math.floor(speedRatio * 15 * deltaTime * 60 * generationRate);
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        // Limit generation per frame
        const maxLinesPerFrame = 5;
        for (let i = 0; i < Math.min(linesToAdd, maxLinesPerFrame); i++) {
            // Create radial lines from center
            const angle = random(0, Math.PI * 2);
            const startOffset = random(-30, 30);
            
            const startX = centerX + Math.cos(angle) * startOffset;
            const startY = centerY + Math.sin(angle) * startOffset;
            
            const length = (80 + random(0, 200)) * (0.5 + speedRatio * 1.2);
            const width = (1 + random(0, 3)) * speedRatio;
            
            this.speedLines.push({
                x: startX,
                y: startY,
                angle: angle + Math.PI, // Point outward from center
                length: length,
                width: width,
                alpha: speedRatio * random(0.5, 1.0),
                life: 1.0,
                speed: speed,
                color: this.getLineColor(speedRatio)
            });
        }
        
        // Generate warp particles (less frequent)
        if (speedRatio > 0.6 && this.warpParticles.length < this.maxWarpParticles) {
            const particlesToAdd = Math.floor(speedRatio * 5 * deltaTime * 60);
            for (let i = 0; i < Math.min(particlesToAdd, 3); i++) {
                const angle = random(0, Math.PI * 2);
                const dist = random(50, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.5);
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;
                
                this.warpParticles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speedRatio * 15,
                    vy: Math.sin(angle) * speedRatio * 15,
                    size: random(2, 5) * speedRatio,
                    alpha: speedRatio * random(0.6, 1.0),
                    life: 1.0,
                    color: this.getParticleColor(speedRatio)
                });
            }
        }
    }
    
    // Get color for speed lines based on speed
    getLineColor(speedRatio) {
        if (speedRatio > 0.8) {
            return { r: 255, g: 255, b: 255 }; // White at extreme speeds
        } else if (speedRatio > 0.6) {
            return { r: 100, g: 200, b: 255 }; // Bright cyan-blue
        } else {
            return { r: 0, g: 255, b: 255 }; // Cyan
        }
    }
    
    // Get color for warp particles
    getParticleColor(speedRatio) {
        if (speedRatio > 0.8) {
            return { r: 255, g: 150, b: 50 }; // Orange-white
        } else if (speedRatio > 0.6) {
            return { r: 50, g: 200, b: 255 }; // Bright blue
        } else {
            return { r: 0, g: 255, b: 200 }; // Cyan-green
        }
    }

    update(spaceship, deltaTime) {
        this.time += deltaTime;
        
        // Generate new speed lines
        this.generateSpeedLines(spaceship, deltaTime);
        
        // Update existing speed lines - optimized
        const speed = spaceship.getSpeed();
        const speedRatio = Math.min(speed / this.maxSpeedForEffects, 1.0);
        const dt60 = deltaTime * 60;
        
        // Update lines in reverse to safely remove during iteration
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.life -= deltaTime * (3 + speed * 0.15);
            line.alpha *= 0.92;
            
            // Extend lines outward (less aggressively)
            line.length += speedRatio * 40 * dt60;
            
            // Remove dead/faded lines
            if (line.life <= 0 || line.alpha < 0.05 || line.length > 1500) {
                this.speedLines.splice(i, 1);
            }
        }
        
        // Update warp particles - optimized
        for (let i = this.warpParticles.length - 1; i >= 0; i--) {
            const particle = this.warpParticles[i];
            particle.x += particle.vx * dt60;
            particle.y += particle.vy * dt60;
            particle.life -= deltaTime * (2 + speedRatio * 2);
            particle.alpha *= 0.90;
            particle.size += speedRatio * 1.5 * dt60; // Slower size growth
            
            // Remove if out of bounds or dead
            if (particle.life <= 0 || particle.alpha < 0.05 ||
                particle.x < -200 || particle.x > CANVAS_WIDTH + 200 ||
                particle.y < -200 || particle.y > CANVAS_HEIGHT + 200) {
                this.warpParticles.splice(i, 1);
            }
        }
        
        // Limit total particles/lines - aggressive cleanup
        if (this.speedLines.length > this.maxSpeedLines) {
            // Remove oldest 25% when over limit
            const removeCount = Math.floor(this.maxSpeedLines * 0.25);
            this.speedLines = this.speedLines.slice(removeCount);
        }
        if (this.warpParticles.length > this.maxWarpParticles) {
            const removeCount = Math.floor(this.maxWarpParticles * 0.25);
            this.warpParticles = this.warpParticles.slice(removeCount);
        }
    }

    render(ctx, spaceship) {
        const speed = spaceship.getSpeed();
        if (speed < 3) return; // No effects at low speeds

        const speedRatio = Math.min(speed / this.maxSpeedForEffects, 1.0);
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        // Render warp particles first (background layer) - optimized
        if (this.warpParticles.length > 0) {
            ctx.save();
            // Batch similar operations
            for (let particle of this.warpParticles) {
                if (particle.alpha < 0.1) continue; // Skip very faint particles
                
                const c = particle.color;
                ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${particle.alpha})`;
                // Reduced shadow blur for performance
                ctx.shadowBlur = Math.min(particle.size, 10);
                ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${particle.alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Render speed lines with enhanced visuals - optimized
        if (this.speedLines.length > 0) {
            ctx.save();
            // Only create gradients for high-speed lines to save performance
            const useGradients = speedRatio > 0.6;
            
            for (let line of this.speedLines) {
                if (line.alpha < 0.1) continue; // Skip very faint lines
                
                const c = line.color || { r: 0, g: 255, b: 255 };
                const endX = line.x + Math.cos(line.angle) * line.length;
                const endY = line.y + Math.sin(line.angle) * line.length;
                
                if (useGradients && speedRatio > 0.7) {
                    // Use gradient only at high speeds
                    const gradient = ctx.createLinearGradient(line.x, line.y, endX, endY);
                    gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${line.alpha * 0.4})`);
                    gradient.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${line.alpha})`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.strokeStyle = gradient;
                } else {
                    // Simple color at lower speeds
                    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${line.alpha})`;
                }
                
                ctx.lineWidth = line.width;
                ctx.lineCap = 'round';
                // Reduced shadow blur for performance
                ctx.shadowBlur = Math.min(line.width * 2, 15);
                ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${line.alpha * 0.4})`;
                
                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Warp tunnel effect at very high speeds - optimized with frame skipping
        if (speedRatio > 0.7) {
            this.frameSkip = (this.frameSkip + 1) % 2; // Update every other frame
            if (this.frameSkip === 0) {
                const warpIntensity = (speedRatio - 0.7) / 0.3;
                ctx.save();
                
                // Draw fewer rings for better performance
                const numRings = 8; // Reduced from 15
                for (let i = 0; i < numRings; i++) {
                    const radius = 50 + (i / numRings) * Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.8;
                    const alpha = (1 - i / numRings) * warpIntensity * 0.25;
                    const pulse = Math.sin(this.time * 8 + i) * 0.08 + 1; // Reduced pulse
                    const ringRadius = radius * pulse;
                    
                    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                    ctx.lineWidth = 1.5; // Thinner lines
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }
        
        // Add screen edge glow at high speeds - enhanced
        if (speedRatio > 0.5) {
            const glowIntensity = (speedRatio - 0.5) * 2;
            ctx.save();
            
            // Top edge with pulsing effect
            const topAlpha = glowIntensity * (0.4 + Math.sin(this.time * 8) * 0.1);
            ctx.globalAlpha = topAlpha;
            const topGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.3);
            topGradient.addColorStop(0, speedRatio > 0.8 ? '#ffffff' : '#00ffff');
            topGradient.addColorStop(0.5, '#00aaff');
            topGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = topGradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);
            
            // Bottom edge
            const bottomGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.7);
            bottomGradient.addColorStop(0, speedRatio > 0.8 ? '#ffffff' : '#00ffff');
            bottomGradient.addColorStop(0.5, '#00aaff');
            bottomGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = bottomGradient;
            ctx.fillRect(0, CANVAS_HEIGHT * 0.7, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);
            
            // Side edges for warp effect
            const sideGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH * 0.2, 0);
            sideGradient.addColorStop(0, '#00aaff');
            sideGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = sideGradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH * 0.2, CANVAS_HEIGHT);
            
            const sideGradientRight = ctx.createLinearGradient(CANVAS_WIDTH, 0, CANVAS_WIDTH * 0.8, 0);
            sideGradientRight.addColorStop(0, '#00aaff');
            sideGradientRight.addColorStop(1, 'transparent');
            ctx.fillStyle = sideGradientRight;
            ctx.fillRect(CANVAS_WIDTH * 0.8, 0, CANVAS_WIDTH * 0.2, CANVAS_HEIGHT);
            
            ctx.restore();
        }

        // Add center warp bubble/glow at very high speeds
        if (speedRatio > 0.7) {
            const distortion = (speedRatio - 0.7) / 0.3;
            ctx.save();
            
            // Pulsing center glow
            const pulse = Math.sin(this.time * 15) * 0.2 + 1;
            const centerAlpha = distortion * (0.5 + Math.sin(this.time * 12) * 0.1);
            ctx.globalAlpha = centerAlpha;
            
            const centerGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, CANVAS_WIDTH * 0.4 * pulse
            );
            centerGradient.addColorStop(0, speedRatio > 0.9 ? '#ffffff' : '#aaffff');
            centerGradient.addColorStop(0.3, '#00ffff');
            centerGradient.addColorStop(0.6, '#0088ff');
            centerGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = centerGradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Chromatic aberration effect (color separation)
            if (speedRatio > 0.85) {
                const offset = 3 * distortion;
                ctx.globalAlpha = distortion * 0.2;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(offset, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(-offset, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            
            ctx.restore();
        }
        
        // Motion blur overlay at extreme speeds - simplified
        if (speedRatio > 0.9) {
            this.frameSkip = (this.frameSkip + 1) % 3; // Update every 3rd frame
            if (this.frameSkip === 0) {
                ctx.save();
                const blurIntensity = (speedRatio - 0.9) * 10;
                
                // Simplified blur with fewer lines
                const blurLines = 10; // Reduced from 20
                for (let i = 0; i < blurLines; i++) {
                    const y = (CANVAS_HEIGHT / blurLines) * i;
                    const alpha = Math.abs(Math.sin(this.time * 4 + i * 0.5)) * 0.2 * blurIntensity;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, y, CANVAS_WIDTH, 2);
                }
                
                ctx.restore();
            }
        }
    }

    // Get color shift based on speed (for use in other systems)
    getSpeedColorShift(speed) {
        const speedRatio = Math.min(speed / this.maxSpeedForEffects, 1.0);
        if (speedRatio > 0.8) {
            return { r: 0, g: 0.3, b: 0.3 }; // Blue tint at very high speeds
        }
        return { r: 0, g: 0, b: 0 }; // No shift
    }
}

