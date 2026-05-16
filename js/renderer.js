// Renderer System (3D)
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.projection = new Projection3D(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
        this.projection.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    clear() {
        // Dark background with subtle ambient light from stars
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle ambient light gradient from stars (very subtle)
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        gradient.addColorStop(0, 'rgba(20, 20, 30, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderSpaceship(spaceship, camera) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        const vertices3D = spaceship.getVertices3D();
        
        // Project all vertices to 2D
        const projected = vertices3D.map(v => this.projection.projectVector3D(v, viewMatrix));
        
        // Filter visible vertices
        const visible = projected.filter(v => v.visible);
        if (visible.length === 0) return;

        const p = projected;
        
        // Define airplane faces with detailed geometry
        const faces = [
            // Nose Section
            { indices: [0, 1, 2], color: COLORS.SPACESHIP, name: 'nose-tip' },
            { indices: [1, 3, 5], color: COLORS.SPACESHIP, name: 'nose-left' },
            { indices: [2, 4, 5], color: COLORS.SPACESHIP, name: 'nose-right' },
            { indices: [1, 2, 5], color: COLORS.SPACESHIP_LIGHT, name: 'nose-top' },
            { indices: [1, 3, 4], color: COLORS.SPACESHIP, name: 'nose-bottom' },
            { indices: [2, 4, 3], color: COLORS.SPACESHIP, name: 'nose-base' },
            
            // Cockpit to Forward Fuselage
            { indices: [3, 6, 8], color: COLORS.SPACESHIP, name: 'forward-left' },
            { indices: [4, 7, 8], color: COLORS.SPACESHIP, name: 'forward-right' },
            { indices: [5, 8, 11], color: COLORS.SPACESHIP_LIGHT, name: 'fuselage-top-front' },
            { indices: [6, 8, 9], color: COLORS.SPACESHIP, name: 'fuselage-left-front' },
            { indices: [7, 8, 10], color: COLORS.SPACESHIP, name: 'fuselage-right-front' },
            { indices: [6, 7, 9], color: COLORS.SPACESHIP_DARK, name: 'fuselage-bottom-front' },
            { indices: [7, 9, 10], color: COLORS.SPACESHIP_DARK, name: 'fuselage-bottom-mid' },
            
            // Main Wings
            { indices: [9, 12, 16], color: COLORS.SPACESHIP_METAL, name: 'left-wing-underside-front' },
            { indices: [10, 13, 17], color: COLORS.SPACESHIP_METAL, name: 'right-wing-underside-front' },
            { indices: [12, 14, 16], color: COLORS.SPACESHIP_METAL, name: 'left-wing-underside-back' },
            { indices: [13, 15, 17], color: COLORS.SPACESHIP_METAL, name: 'right-wing-underside-back' },
            { indices: [12, 16, 18], color: COLORS.SPACESHIP_LIGHT, name: 'left-wing-top' },
            { indices: [13, 17, 19], color: COLORS.SPACESHIP_LIGHT, name: 'right-wing-top' },
            { indices: [14, 18, 16], color: COLORS.SPACESHIP_LIGHT, name: 'left-wing-top-back' },
            { indices: [15, 19, 17], color: COLORS.SPACESHIP_LIGHT, name: 'right-wing-top-back' },
            
            // Wing to Fuselage Connection
            { indices: [9, 11, 12], color: COLORS.SPACESHIP, name: 'left-wing-root-top' },
            { indices: [10, 11, 13], color: COLORS.SPACESHIP, name: 'right-wing-root-top' },
            { indices: [11, 14, 20], color: COLORS.SPACESHIP, name: 'left-wing-root-rear' },
            { indices: [11, 15, 21], color: COLORS.SPACESHIP, name: 'right-wing-root-rear' },
            
            // Mid to Rear Fuselage
            { indices: [14, 20, 22], color: COLORS.SPACESHIP, name: 'rear-fuselage-left-top' },
            { indices: [15, 21, 22], color: COLORS.SPACESHIP, name: 'rear-fuselage-right-top' },
            { indices: [11, 20, 22], color: COLORS.SPACESHIP, name: 'rear-fuselage-top' },
            { indices: [11, 21, 22], color: COLORS.SPACESHIP, name: 'rear-fuselage-top-right' },
            { indices: [20, 22, 21], color: COLORS.SPACESHIP, name: 'rear-fuselage-top-back' },
            
            // Rear Fuselage Sides
            { indices: [20, 21, 24], color: COLORS.SPACESHIP_DARK, name: 'rear-fuselage-bottom-left' },
            { indices: [21, 22, 25], color: COLORS.SPACESHIP, name: 'rear-fuselage-right' },
            { indices: [20, 22, 24], color: COLORS.SPACESHIP, name: 'rear-fuselage-left' },
            
            // Vertical Tail (Rudder)
            { indices: [22, 23, 24], color: COLORS.SPACESHIP_LIGHT, name: 'tail-vertical-left' },
            { indices: [22, 23, 25], color: COLORS.SPACESHIP_LIGHT, name: 'tail-vertical-right' },
            { indices: [23, 24, 25], color: COLORS.SPACESHIP_LIGHT, name: 'tail-vertical-top' },
            
            // Horizontal Tail (Elevators)
            { indices: [22, 24, 26], color: COLORS.SPACESHIP, name: 'tail-horizontal-left' },
            { indices: [22, 25, 27], color: COLORS.SPACESHIP, name: 'tail-horizontal-right' },
            
            // Engine Nacelles
            { indices: [20, 28, 30], color: COLORS.SPACESHIP_METAL, name: 'engine-left-body' },
            { indices: [21, 29, 31], color: COLORS.SPACESHIP_METAL, name: 'engine-right-body' },
            { indices: [24, 28, 30], color: '#333333', name: 'engine-left-connection' },
            { indices: [25, 29, 31], color: '#333333', name: 'engine-right-connection' },
            
            // Bottom Fuselage
            { indices: [6, 9, 12], color: COLORS.SPACESHIP_DARK, name: 'bottom-left-front' },
            { indices: [7, 10, 13], color: COLORS.SPACESHIP_DARK, name: 'bottom-right-front' },
            { indices: [9, 12, 14], color: COLORS.SPACESHIP_DARK, name: 'bottom-left-mid' },
            { indices: [10, 13, 15], color: COLORS.SPACESHIP_DARK, name: 'bottom-right-mid' },
            { indices: [14, 20, 30], color: COLORS.SPACESHIP_DARK, name: 'bottom-left-rear' },
            { indices: [15, 21, 31], color: COLORS.SPACESHIP_DARK, name: 'bottom-right-rear' },
        ];

        // Calculate average depth for each face and sort back to front
        faces.forEach(face => {
            const [i0, i1, i2] = face.indices;
            if (p[i0].visible && p[i1].visible && p[i2].visible) {
                face.avgDepth = (p[i0].z + p[i1].z + p[i2].z) / 3;
                face.avgZ = (vertices3D[i0].z + vertices3D[i1].z + vertices3D[i2].z) / 3;
            } else {
                face.avgDepth = -1; // Mark as invalid
            }
        });

        // Sort faces by depth (farthest first)
        const validFaces = faces.filter(f => f.avgDepth >= 0);
        validFaces.sort((a, b) => b.avgDepth - a.avgDepth);

        // Calculate light direction (from camera towards spaceship)
        const lightDir = new Vector3D(0, 0.3, -0.7).normalize();
        
        // Render faces back to front with proper shading
        for (let face of validFaces) {
            const [i0, i1, i2] = face.indices;
            
            if (!p[i0].visible || !p[i1].visible || !p[i2].visible) continue;
            
            // Calculate face normal for lighting
            const v0 = vertices3D[i0];
            const v1 = vertices3D[i1];
            const v2 = vertices3D[i2];
            
            const edge1 = v1.subtract(v0);
            const edge2 = v2.subtract(v0);
            const normal = edge1.cross(edge2).normalize();
            
            // Dot product for lighting (higher = brighter)
            const lightIntensity = Math.max(0.3, normal.dot(lightDir));
            
            // Depth-based shading
            const avgDepth = (p[i0].z + p[i1].z + p[i2].z) / 3;
            const depthShade = Math.max(0.7, Math.min(1.0, avgDepth));
            
            // Combine lighting
            const brightness = lightIntensity * depthShade;
            
            // Calculate color with lighting
            const baseColor = face.color;
            const litColor = this.applyLighting(baseColor, brightness);
            
            // Render filled face
            this.ctx.fillStyle = litColor;
            this.ctx.beginPath();
            this.ctx.moveTo(p[i0].x, p[i0].y);
            this.ctx.lineTo(p[i1].x, p[i1].y);
            this.ctx.lineTo(p[i2].x, p[i2].y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Subtle edge lines for definition (not wireframe)
            this.ctx.strokeStyle = this.darkenColor(litColor, 0.8);
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Draw detailed cockpit window (at nose point)
        if (p[0].visible) {
            const depth = Math.max(0.8, 1 - p[0].z);
            const cockpitBrightness = depth * 1.3;
            
            this.ctx.save();
            // Outer glow for cockpit
            this.ctx.globalAlpha = depth * 0.4;
            this.ctx.fillStyle = COLORS.COCKPIT;
            this.ctx.beginPath();
            this.ctx.arc(p[0].x, p[0].y, spaceship.size / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main cockpit glass
            this.ctx.globalAlpha = depth * 0.9;
            const cockpitGradient = this.ctx.createRadialGradient(
                p[0].x, p[0].y, 0,
                p[0].x, p[0].y, spaceship.size / 4
            );
            cockpitGradient.addColorStop(0, '#88ffff');
            cockpitGradient.addColorStop(0.5, COLORS.COCKPIT);
            cockpitGradient.addColorStop(1, '#006666');
            this.ctx.fillStyle = cockpitGradient;
            this.ctx.beginPath();
            this.ctx.arc(p[0].x, p[0].y, spaceship.size / 4.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Cockpit highlight/reflection
            this.ctx.globalAlpha = depth * 0.7;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.ellipse(
                p[0].x - spaceship.size / 10,
                p[0].y - spaceship.size / 10,
                spaceship.size / 8,
                spaceship.size / 12,
                -0.3, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Draw engine glow at rear
        const exhaustPositions = spaceship.getExhaustPositions();
        for (let i = 0; i < exhaustPositions.length; i++) {
            const exhaustPos = exhaustPositions[i];
            const exhaustProj = this.projection.projectVector3D(exhaustPos, viewMatrix);
            
            if (exhaustProj && exhaustProj.visible) {
                const depth = Math.max(0.6, 1 - exhaustProj.z);
                this.ctx.save();
                this.ctx.globalAlpha = depth * 0.6;
                
                const engineGlow = this.ctx.createRadialGradient(
                    exhaustProj.x, exhaustProj.y, 0,
                    exhaustProj.x, exhaustProj.y, spaceship.size / 2
                );
                engineGlow.addColorStop(0, COLORS.EXHAUST);
                engineGlow.addColorStop(0.5, '#ff3300');
                engineGlow.addColorStop(1, 'transparent');
                this.ctx.fillStyle = engineGlow;
                this.ctx.beginPath();
                this.ctx.arc(exhaustProj.x, exhaustProj.y, spaceship.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }
        
        // Add some detail lines/highlights for realism
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        
        // Draw wing leading edges
        if (p[16].visible && p[12].visible) {
            this.ctx.beginPath();
            this.ctx.moveTo(p[12].x, p[12].y);
            this.ctx.lineTo(p[16].x, p[16].y);
            this.ctx.stroke();
        }
        if (p[17].visible && p[13].visible) {
            this.ctx.beginPath();
            this.ctx.moveTo(p[13].x, p[13].y);
            this.ctx.lineTo(p[17].x, p[17].y);
            this.ctx.stroke();
        }
        
        // Draw tail fin
        if (p[23].visible && p[22].visible) {
            this.ctx.beginPath();
            this.ctx.moveTo(p[22].x, p[22].y);
            this.ctx.lineTo(p[23].x, p[23].y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    // Apply lighting to a color
    applyLighting(colorHex, brightness) {
        // Parse hex color
        let r, g, b;
        if (colorHex.startsWith('#')) {
            const hex = colorHex.replace('#', '');
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (colorHex.startsWith('rgb')) {
            // Handle rgb() or rgba() format
            const matches = colorHex.match(/\d+/g);
            if (matches && matches.length >= 3) {
                r = parseInt(matches[0]);
                g = parseInt(matches[1]);
                b = parseInt(matches[2]);
            } else {
                r = g = b = 0;
            }
        } else {
            // Default fallback
            r = g = b = 0;
        }
        
        // Apply brightness
        const newR = Math.min(255, Math.max(0, Math.round(r * brightness)));
        const newG = Math.min(255, Math.max(0, Math.round(g * brightness)));
        const newB = Math.min(255, Math.max(0, Math.round(b * brightness)));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    // Darken a color for edges
    darkenColor(colorHex, factor) {
        // Parse hex color
        let r, g, b;
        if (colorHex.startsWith('#')) {
            const hex = colorHex.replace('#', '');
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (colorHex.startsWith('rgb')) {
            // Handle rgb() or rgba() format
            const matches = colorHex.match(/\d+/g);
            if (matches && matches.length >= 3) {
                r = parseInt(matches[0]);
                g = parseInt(matches[1]);
                b = parseInt(matches[2]);
            } else {
                r = g = b = 0;
            }
        } else {
            // Default fallback
            r = g = b = 0;
        }
        
        const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    renderTrail(spaceship, camera, trail) {
        if (trail.length < 2) return;

        const viewMatrix = camera.getViewMatrix(spaceship);
        const speed = spaceship.getSpeed();
        const speedRatio = Math.min(speed / 50, 1.0); // Normalize to 0-1 for speeds up to 50
        
        // Trail becomes brighter and thicker at higher speeds
        const baseAlpha = 0.3 + (speedRatio * 0.4); // 0.3 to 0.7 alpha
        const baseWidth = 1 + (speedRatio * 2); // 1 to 3 pixel width
        
        // Color shifts to cyan/blue at high speeds
        let trailColor = COLORS.SPACESHIP;
        if (speedRatio > 0.6) {
            const blueMix = (speedRatio - 0.6) / 0.4; // 0 to 1
            trailColor = `rgb(${Math.round(0 * (1 - blueMix))}, ${Math.round(255 * (1 - blueMix * 0.5))}, ${Math.round(255 * blueMix)})`;
        }

        this.ctx.strokeStyle = trailColor;
        this.ctx.lineWidth = baseWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        let first = true;
        for (let i = 0; i < trail.length; i++) {
            let trailPos;
            if (trail[i].position && trail[i].position instanceof Vector3D) {
                trailPos = trail[i].position;
            } else if (trail[i].position) {
                // Fallback if position is not a Vector3D
                trailPos = new Vector3D(trail[i].position.x || 0, trail[i].position.y || 0, trail[i].position.z || 0);
            } else {
                // Legacy 2D format
                trailPos = new Vector3D(trail[i].x || 0, trail[i].y || 0, trail[i].z || 0);
            }
            
            const projected = this.projection.projectVector3D(trailPos, viewMatrix);
            
            if (projected && projected.visible) {
                // Vary alpha along trail (fade out)
                const trailProgress = i / trail.length;
                const alpha = baseAlpha * (1 - trailProgress * 0.5);
                
                if (first) {
                    this.ctx.globalAlpha = alpha;
                    this.ctx.moveTo(projected.x, projected.y);
                    first = false;
                } else {
                    this.ctx.globalAlpha = alpha;
                    this.ctx.lineTo(projected.x, projected.y);
                }
            }
        }
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
}

