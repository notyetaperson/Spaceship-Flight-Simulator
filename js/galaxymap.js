// Galaxy Map / Minimap System
class GalaxyMap {
    constructor() {
        this.size = 200; // Size of the minimap in pixels
        this.margin = 10; // Margin from corner
        this.scale = 0.1; // Scale factor for world to map coordinates
        this.showAxis = true;
        this.range = 2000; // World range to display
        this.mapX = CANVAS_WIDTH - this.size - this.margin;
        this.mapY = this.margin;
        this.mapCenterX = this.mapX + this.size / 2;
        this.mapCenterY = this.mapY + this.size / 2;
        this.clickRadius = 8; // Click detection radius for planets
        this.jumping = false; // Lightspeed jump state
        this.jumpProgress = 0;
        this.jumpDuration = 0.5; // Duration of jump effect in seconds
    }

    // Convert 3D world position to 2D map position
    worldToMap(worldPos, mapCenterX, mapCenterY) {
        // Use X and Z coordinates for top-down view (Y is height)
        const mapX = mapCenterX + worldPos.x * this.scale;
        const mapY = mapCenterY - worldPos.z * this.scale; // Negative Z because Y increases downward on screen
        
        return { x: mapX, y: mapY };
    }

    // Handle click on map
    handleClick(mouseX, mouseY, spaceship) {
        // Check if click is within map bounds
        if (mouseX < this.mapX || mouseX > this.mapX + this.size ||
            mouseY < this.mapY || mouseY > this.mapY + this.size) {
            return null;
        }

        // Check if clicking on a celestial body
        if (window.game && window.game.celestialBodies) {
            for (let body of window.game.celestialBodies.bodies) {
                const bodyPos = this.worldToMap(body.position, this.mapCenterX, this.mapCenterY);
                const dist = Math.sqrt(
                    Math.pow(mouseX - bodyPos.x, 2) + 
                    Math.pow(mouseY - bodyPos.y, 2)
                );
                
                // Check if click is within click radius (larger for visibility)
                const clickRadius = body.type === 'sun' ? 10 : this.clickRadius;
                if (dist < clickRadius && dist < this.size / 2 - 5) {
                    return body; // Return the clicked body
                }
            }
        }
        
        return null; // No body clicked
    }

    // Start lightspeed jump to a celestial body
    startJump(targetBody, spaceship) {
        if (this.jumping) return; // Already jumping
        
        this.jumping = true;
        this.jumpProgress = 0;
        this.targetBody = targetBody;
        this.startPosition = spaceship.position.clone();
        this.startVelocity = spaceship.velocity.clone();
    }

    // Update jump animation
    update(deltaTime, spaceship) {
        if (this.jumping) {
            this.jumpProgress += deltaTime / this.jumpDuration;
            
            if (this.jumpProgress >= 1.0) {
                // Complete jump - teleport spaceship
                if (this.targetBody) {
                    // Teleport to planet position (slightly offset to avoid being inside)
                    const safeDistance = this.targetBody.size + spaceship.size * 3;
                    
                    // Position spaceship at a safe distance from the planet
                    // Use forward direction or default offset if position is same
                    const planetPos = this.targetBody.position;
                    let direction;
                    
                    if (planetPos.x === 0 && planetPos.z === 0) {
                        // Planet at origin, use default direction
                        direction = new Vector3D(1, 0, 0).normalize();
                    } else {
                        // Calculate direction from planet to spaceship's previous position
                        direction = this.startPosition.subtract(planetPos);
                        const dist = direction.magnitude();
                        if (dist > 0.001) {
                            direction = direction.normalize();
                        } else {
                            direction = new Vector3D(1, 0, 0).normalize();
                        }
                    }
                    
                    // Position spaceship at safe distance from planet
                    spaceship.position = planetPos.clone()
                        .add(direction.multiply(safeDistance));
                    
                    // Keep Y coordinate reasonable (maintain some height)
                    spaceship.position.y = Math.max(spaceship.position.y, this.targetBody.position.y + safeDistance * 0.3);
                    
                    // Stop velocity
                    spaceship.velocity = new Vector3D(0, 0, 0);
                }
                
                this.jumping = false;
                this.jumpProgress = 0;
                this.targetBody = null;
            }
        }
    }

    render(ctx, spaceship) {
        const mapX = this.mapX;
        const mapY = this.mapY;
        const mapCenterX = this.mapCenterX;
        const mapCenterY = this.mapCenterY;

        // Draw map background with border
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = COLORS.UI;
        ctx.lineWidth = 2;
        
        // Background
        ctx.fillRect(mapX, mapY, this.size, this.size);
        ctx.strokeRect(mapX, mapY, this.size, this.size);
        
        // Draw title
        ctx.fillStyle = COLORS.UI;
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GALAXY MAP', mapCenterX, mapY + 15);

        // Draw coordinate grid lines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Center crosshair
        ctx.beginPath();
        ctx.moveTo(mapCenterX - this.size / 4, mapCenterY);
        ctx.lineTo(mapCenterX + this.size / 4, mapCenterY);
        ctx.moveTo(mapCenterX, mapCenterY - this.size / 4);
        ctx.lineTo(mapCenterX, mapCenterY + this.size / 4);
        ctx.stroke();

        // Draw axis labels
        if (this.showAxis) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('X', mapCenterX + this.size / 4 + 5, mapCenterY + 3);
            ctx.fillText('Z', mapCenterX + 3, mapCenterY - this.size / 4 - 5);
        }

        // Draw range circles (reference distances)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            const radius = (this.size / 4) * i;
            ctx.beginPath();
            ctx.arc(mapCenterX, mapCenterY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw terrain reference (center area)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const terrainSize = 2000 * this.scale;
        ctx.strokeRect(
            mapCenterX - terrainSize / 2,
            mapCenterY - terrainSize / 2,
            terrainSize,
            terrainSize
        );

        // Draw celestial bodies on map (if available)
        if (window.game && window.game.celestialBodies) {
            for (let body of window.game.celestialBodies.bodies) {
                const bodyPos = this.worldToMap(body.position, mapCenterX, mapCenterY);
                const dist = Math.sqrt(
                    Math.pow(bodyPos.x - mapCenterX, 2) + 
                    Math.pow(bodyPos.y - mapCenterY, 2)
                );
                
                if (dist < this.size / 2 - 5) {
                    // Highlight if this is the jump target
                    const isJumpTarget = this.jumping && this.targetBody === body;
                    
                    ctx.fillStyle = body.type === 'sun' ? body.color : body.color;
                    ctx.strokeStyle = isJumpTarget ? '#00ff00' : COLORS.UI;
                    ctx.lineWidth = isJumpTarget ? 2 : 1;
                    const mapSize = body.type === 'sun' ? 6 : 3;
                    
                    // Pulsing effect for jump target
                    if (isJumpTarget) {
                        const pulse = 1 + Math.sin(this.jumpProgress * Math.PI * 10) * 0.3;
                        ctx.beginPath();
                        ctx.arc(bodyPos.x, bodyPos.y, mapSize * pulse, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.beginPath();
                    ctx.arc(bodyPos.x, bodyPos.y, mapSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Draw crosshair for clickable planets
                    if (body.type === 'planet') {
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        const crossSize = 4;
                        ctx.beginPath();
                        ctx.moveTo(bodyPos.x - crossSize, bodyPos.y);
                        ctx.lineTo(bodyPos.x + crossSize, bodyPos.y);
                        ctx.moveTo(bodyPos.x, bodyPos.y - crossSize);
                        ctx.lineTo(bodyPos.x, bodyPos.y + crossSize);
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw spaceship position
        const shipPos = this.worldToMap(spaceship.position, mapCenterX, mapCenterY);
        
        // Check if ship is within map bounds (clamp if outside)
        const clampedX = Math.max(mapX + 3, Math.min(mapX + this.size - 3, shipPos.x));
        const clampedY = Math.max(mapY + 3, Math.min(mapY + this.size - 3, shipPos.y));
        const isOutOfBounds = shipPos.x !== clampedX || shipPos.y !== clampedY;

        if (isOutOfBounds) {
            // Draw arrow pointing to ship position
            ctx.strokeStyle = COLORS.SPACESHIP;
            ctx.fillStyle = COLORS.SPACESHIP;
            ctx.lineWidth = 2;
            
            const angle = Math.atan2(shipPos.y - mapCenterY, shipPos.x - mapCenterX);
            const arrowX = clampedX;
            const arrowY = clampedY;
            
            ctx.beginPath();
            ctx.moveTo(mapCenterX, mapCenterY);
            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();
            
            // Draw arrowhead
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-8, -5);
            ctx.lineTo(-8, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Draw spaceship icon
        ctx.save();
        ctx.translate(clampedX, clampedY);
        
        // Rotate to show ship's yaw direction
        ctx.rotate(spaceship.yaw);
        
        ctx.fillStyle = COLORS.SPACESHIP;
        ctx.strokeStyle = COLORS.SPACESHIP;
        ctx.lineWidth = 1.5;
        
        // Draw small triangle representing ship
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        // Draw position text
        ctx.fillStyle = COLORS.UI;
        ctx.font = '10px Courier New';
        ctx.textAlign = 'left';
        const posText = `X:${Math.round(spaceship.position.x)} Z:${Math.round(spaceship.position.z)}`;
        ctx.fillText(posText, mapX + 5, mapY + this.size - 5);

        ctx.restore();
    }

    // Check if a world position is visible on the map
    isVisibleOnMap(worldPos) {
        const dist = Math.sqrt(worldPos.x * worldPos.x + worldPos.z * worldPos.z);
        return dist <= this.range;
    }
}

