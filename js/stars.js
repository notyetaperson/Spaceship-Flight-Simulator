// Star Field Background (3D)
class StarField {
    constructor(count = STAR_COUNT) {
        this.stars = [];
        this.generateStars(count);
        this.worldSize = CANVAS_WIDTH * 10; // Increased star field size for bigger galaxy
    }

    generateStars(count) {
        for (let i = 0; i < count; i++) {
            const isBright = Math.random() < BRIGHT_STAR_RATIO;
            const baseSize = isBright ? random(3, 8) : random(1, 4);
            const baseBrightness = isBright ? random(0.8, 1.5) : random(0.5, 1.2);
            
            // Some bright stars get colored tints
            let starColor = COLORS.STAR;
            if (isBright && Math.random() > 0.7) {
                const colorTint = random(0, 360);
                starColor = `hsl(${colorTint}, 60%, ${random(80, 100)}%)`;
            }
            
            this.stars.push({
                position: new Vector3D(
                    random(-this.worldSize, this.worldSize),
                    random(-this.worldSize, this.worldSize),
                    random(-this.worldSize, this.worldSize)
                ),
                size: baseSize,
                brightness: baseBrightness,
                glowSize: baseSize * (isBright ? 3 : 1.5),
                isBright: isBright,
                twinkle: random(0, Math.PI * 2), // For twinkling effect
                color: starColor // Store color to avoid recalculating
            });
        }
    }

    update(spaceship) {
        // Stars move based on spaceship velocity (star field effect)
        const velocity = spaceship.velocity.multiply(0.1);

        for (let star of this.stars) {
            star.position = star.position.subtract(velocity);
            // Twinkling effect
            star.twinkle += 0.05;
            if (star.twinkle > Math.PI * 2) star.twinkle -= Math.PI * 2;
            // No wrapping - stars move freely in infinite space
            // Stars will continue to move as the spaceship travels
        }
    }

    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        const stars = this.stars.slice();
        
        // Sort by depth (far to near)
        stars.sort((a, b) => {
            const depthA = renderer.projection.getDepth(a.position.x, a.position.y, a.position.z, viewMatrix);
            const depthB = renderer.projection.getDepth(b.position.x, b.position.y, b.position.z, viewMatrix);
            return depthB - depthA;
        });

        for (let star of stars) {
            const projected = renderer.projection.projectVector3D(star.position, viewMatrix);
            
            if (projected && projected.visible) {
                // Check for valid projected values
                if (!isFinite(projected.x) || !isFinite(projected.y) || !isFinite(projected.z)) {
                    continue; // Skip this star if position is invalid
                }
                
                const depth = 1 - projected.z;
                if (!isFinite(depth) || depth < 0 || depth > 1) {
                    continue; // Skip if depth is invalid
                }
                
                const twinkleFactor = 1 + Math.sin(star.twinkle) * 0.2; // Twinkling effect
                const size = star.size * (1 + depth * 1.5);
                const glowSize = star.glowSize * (1 + depth * 2);
                
                // Validate calculated values
                if (!isFinite(size) || !isFinite(glowSize) || size <= 0 || glowSize <= 0) {
                    continue; // Skip if size is invalid
                }
                
                let alpha = star.brightness * depth * twinkleFactor;
                if (!isFinite(alpha) || alpha < 0) {
                    continue; // Skip if alpha is invalid
                }
                
                // Bright stars have glow effect
                if (star.isBright) {
                    // Outer glow for bright stars
                    ctx.save();
                    const glowAlpha = Math.min(alpha * 0.3, 0.4);
                    
                    // Ensure glow size is reasonable and finite
                    const safeGlowSize = Math.max(1, Math.min(glowSize, CANVAS_WIDTH));
                    const safeX = Math.max(-CANVAS_WIDTH, Math.min(projected.x, CANVAS_WIDTH * 2));
                    const safeY = Math.max(-CANVAS_HEIGHT, Math.min(projected.y, CANVAS_HEIGHT * 2));
                    
                    if (isFinite(safeGlowSize) && isFinite(safeX) && isFinite(safeY)) {
                        ctx.globalAlpha = glowAlpha;
                        const gradient = ctx.createRadialGradient(
                            safeX, safeY, 0,
                            safeX, safeY, safeGlowSize
                        );
                        gradient.addColorStop(0, COLORS.STAR);
                        gradient.addColorStop(0.5, COLORS.STAR);
                        gradient.addColorStop(1, 'transparent');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(safeX, safeY, safeGlowSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                    
                    // Make bright stars even brighter
                    alpha = Math.min(alpha * 1.5, 1.0);
                }
                
                // Draw star core (ensure safe values)
                const safeX = Math.max(-CANVAS_WIDTH, Math.min(projected.x, CANVAS_WIDTH * 2));
                const safeY = Math.max(-CANVAS_HEIGHT, Math.min(projected.y, CANVAS_HEIGHT * 2));
                const safeSize = Math.max(0.5, Math.min(size, CANVAS_WIDTH));
                
                if (isFinite(safeX) && isFinite(safeY) && isFinite(safeSize)) {
                    ctx.save();
                    ctx.globalAlpha = Math.min(alpha, 1.0);
                    ctx.fillStyle = star.color || COLORS.STAR;
                    
                    ctx.beginPath();
                    ctx.arc(safeX, safeY, safeSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add crosshair effect for very bright stars
                    if (star.isBright && safeSize > 3) {
                        ctx.strokeStyle = ctx.fillStyle;
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = alpha * 0.5;
                        const crossSize = safeSize * 1.5;
                        ctx.beginPath();
                        ctx.moveTo(safeX - crossSize, safeY);
                        ctx.lineTo(safeX + crossSize, safeY);
                        ctx.moveTo(safeX, safeY - crossSize);
                        ctx.lineTo(safeX, safeY + crossSize);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
            }
        }
    }
}

