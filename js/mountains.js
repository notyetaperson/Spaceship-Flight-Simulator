// Mountains - Procedural mountain generation for planets
class Mountains {
    constructor(planet, planetTerrain) {
        this.planet = planet;
        this.planetTerrain = planetTerrain;
        this.mountains = [];
        this.generateMountains();
    }

    generateMountains() {
        // Use planet position as seed for consistent generation
        const seed = Math.floor(this.planet.position.x + this.planet.position.z) * 1000;
        
        const terrainSize = 500; // Match planet terrain size
        const mountainCount = 20; // Number of mountains
        
        for (let i = 0; i < mountainCount; i++) {
            // Generate random position on planet surface
            const angle = (i / mountainCount) * Math.PI * 2;
            const radius = random(30, terrainSize / 2 - 30);
            const x = this.planet.position.x + Math.cos(angle) * radius;
            const z = this.planet.position.z + Math.sin(angle) * radius;
            
            // Get base terrain height at this position
            const baseHeight = this.planetTerrain ? this.planetTerrain.getHeightAt(x, z) : (this.planet.position.y - this.planet.size - 10);
            
            // Mountain properties
            const baseRadius = random(8, 20); // Base radius of mountain
            const peakHeight = random(15, 40); // Height of mountain peak
            const peakOffset = random(-baseRadius * 0.3, baseRadius * 0.3); // Peak position variation
            
            // Create mountain with peak position slightly offset from center for more natural look
            const peakX = x + peakOffset;
            const peakZ = z + peakOffset;
            const peakY = baseHeight + peakHeight;
            
            this.mountains.push({
                position: new Vector3D(x, baseHeight, z), // Base center position
                peakPosition: new Vector3D(peakX, peakY, peakZ), // Peak position
                baseRadius: baseRadius,
                peakHeight: peakHeight,
                layers: Math.floor(random(5, 10)) // Number of layers for stepped effect
            });
        }
    }

    render(ctx, renderer, camera, human) {
        if (!human || !camera) return;
        
        const viewMatrix = camera.getViewMatrix(human);
        const renderDistance = 150; // Render mountains within this distance
        
        ctx.save();
        
        for (let mountain of this.mountains) {
            const dist = human.position.distance(mountain.position);
            if (dist > renderDistance) continue;
            
            // Calculate alpha based on distance
            const alpha = Math.max(0.4, 1 - dist / renderDistance);
            
            // Render mountain as layered cones (stepped pyramid effect)
            const layerCount = mountain.layers;
            
            for (let layer = 0; layer < layerCount; layer++) {
                const layerProgress = layer / layerCount;
                const layerHeight = mountain.peakHeight * (1 - layerProgress);
                const layerRadius = mountain.baseRadius * (1 - layerProgress * 0.8); // Gradually smaller
                
                // Calculate layer position (interpolate from base to peak)
                const layerY = mountain.position.y + layerHeight;
                const layerX = mountain.position.x + (mountain.peakPosition.x - mountain.position.x) * layerProgress;
                const layerZ = mountain.position.z + (mountain.peakPosition.z - mountain.position.z) * layerProgress;
                
                // Calculate color based on height (snow caps on top, rock below)
                // This is needed for both layer rendering and edge drawing
                let r, g, b;
                if (layerProgress < 0.3) {
                    // Snow cap (white)
                    r = 240 + layerProgress * 15;
                    g = 240 + layerProgress * 15;
                    b = 250;
                } else if (layerProgress < 0.6) {
                    // Rock/mountain (gray-brown)
                    const t = (layerProgress - 0.3) / 0.3;
                    r = 120 + t * 40;
                    g = 100 + t * 30;
                    b = 80 + t * 20;
                } else {
                    // Base (darker, more earth-like)
                    const t = (layerProgress - 0.6) / 0.4;
                    r = 80 + t * 40;
                    g = 70 + t * 30;
                    b = 60 + t * 20;
                }
                
                // Render mountain layer as a circle (top-down view)
                const layerPos = new Vector3D(layerX, layerY, layerZ);
                const layerProj = renderer.projection.projectVector3D(layerPos, viewMatrix);
                
                if (layerProj && layerProj.visible) {
                    
                    // Render filled circle for layer
                    ctx.globalAlpha = alpha * 0.9;
                    ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(layerProj.x, layerProj.y, layerRadius * 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Render outline for depth
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.strokeStyle = `rgba(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)}, ${alpha * 0.8})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                
                // Draw edges connecting layers (vertical sides)
                if (layer > 0) {
                    const prevLayer = layer - 1;
                    const prevProgress = prevLayer / layerCount;
                    const prevHeight = mountain.peakHeight * (1 - prevProgress);
                    const prevRadius = mountain.baseRadius * (1 - prevProgress * 0.8);
                    const prevY = mountain.position.y + prevHeight;
                    const prevX = mountain.position.x + (mountain.peakPosition.x - mountain.position.x) * prevProgress;
                    const prevZ = mountain.position.z + (mountain.peakPosition.z - mountain.position.z) * prevProgress;
                    
                    // Draw connecting edges
                    const edgeCount = 12; // Number of edges around mountain
                    for (let e = 0; e < edgeCount; e++) {
                        const edgeAngle = (e / edgeCount) * Math.PI * 2;
                        
                        // Current layer edge point
                        const edgeX1 = layerX + Math.cos(edgeAngle) * layerRadius;
                        const edgeZ1 = layerZ + Math.sin(edgeAngle) * layerRadius;
                        const edge1 = new Vector3D(edgeX1, layerY, edgeZ1);
                        
                        // Previous layer edge point
                        const edgeX2 = prevX + Math.cos(edgeAngle) * prevRadius;
                        const edgeZ2 = prevZ + Math.sin(edgeAngle) * prevRadius;
                        const edge2 = new Vector3D(edgeX2, prevY, edgeZ2);
                        
                        const edge1Proj = renderer.projection.projectVector3D(edge1, viewMatrix);
                        const edge2Proj = renderer.projection.projectVector3D(edge2, viewMatrix);
                        
                        if (edge1Proj && edge1Proj.visible && edge2Proj && edge2Proj.visible) {
                            ctx.globalAlpha = alpha * 0.4;
                            ctx.strokeStyle = `rgba(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)}, ${alpha * 0.6})`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(edge1Proj.x, edge1Proj.y);
                            ctx.lineTo(edge2Proj.x, edge2Proj.y);
                            ctx.stroke();
                        }
                    }
                }
            }
            
            // Render peak (smaller point on top)
            const peakProj = renderer.projection.projectVector3D(mountain.peakPosition, viewMatrix);
            if (peakProj && peakProj.visible) {
                ctx.globalAlpha = alpha * 1.0;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(peakProj.x, peakProj.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

