// Floating Islands - Procedural floating islands for planets
class FloatingIslands {
    constructor(planet) {
        this.planet = planet;
        this.islands = [];
        this.generateIslands();
    }

    generateIslands() {
        // Use planet position as seed for consistent generation
        const seed = Math.floor(this.planet.position.x + this.planet.position.z) * 1000;
        const noise = new Noise(seed);
        
        const terrainSize = 500; // Match planet terrain size
        const islandCount = 15; // Number of floating islands
        
        for (let i = 0; i < islandCount; i++) {
            // Generate random position on planet surface
            const angle = (i / islandCount) * Math.PI * 2;
            const radius = random(50, terrainSize / 2 - 50);
            const x = this.planet.position.x + Math.cos(angle) * radius;
            const z = this.planet.position.z + Math.sin(angle) * radius;
            
            // Get terrain height at this position
            const terrainHeight = this.planet.position.y - this.planet.size - 10;
            
            // Generate floating height (30-80 units above terrain)
            const floatHeight = random(30, 80);
            const y = terrainHeight + floatHeight;
            
            // Island properties
            const size = random(8, 20); // Island radius
            const height = random(3, 8); // Island thickness
            
            // Use noise to create more organic shape
            const islandNoiseScale = 0.1;
            
            this.islands.push({
                position: new Vector3D(x, y, z),
                size: size,
                height: height,
                noise: new Noise(seed + i * 1000),
                noiseScale: islandNoiseScale
            });
        }
    }

    render(ctx, renderer, camera, human) {
        if (!human || !camera) return;
        
        const viewMatrix = camera.getViewMatrix(human);
        const renderDistance = 120; // Render islands within this distance
        
        ctx.save();
        
        for (let island of this.islands) {
            const dist = human.position.distance(island.position);
            if (dist > renderDistance) continue;
            
            // Calculate alpha based on distance
            const alpha = Math.max(0.3, 1 - dist / renderDistance);
            
            // Render island as a series of slices to create a rounded top
            const sliceCount = 8; // Number of horizontal slices
            
            for (let slice = 0; slice < sliceCount; slice++) {
                const sliceProgress = slice / sliceCount;
                const sliceY = island.position.y + (sliceProgress - 0.5) * island.height;
                const sliceRadius = island.size * Math.sin(sliceProgress * Math.PI); // Circular cross-section
                
                // Render island slice (top view)
                const topPos = new Vector3D(island.position.x, sliceY, island.position.z);
                const topProj = renderer.projection.projectVector3D(topPos, viewMatrix);
                
                if (topProj && topProj.visible) {
                    // Render filled circle for island slice
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.fillStyle = `rgba(${Math.floor(100 + sliceProgress * 60)}, ${Math.floor(150 + sliceProgress * 40)}, ${Math.floor(60 + sliceProgress * 30)}, ${alpha * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(topProj.x, topProj.y, sliceRadius * 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Render outline
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.strokeStyle = `rgba(80, 120, 60, ${alpha * 0.8})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            
            // Render island bottom (flat bottom)
            const bottomPos = new Vector3D(island.position.x, island.position.y - island.height / 2, island.position.z);
            const bottomProj = renderer.projection.projectVector3D(bottomPos, viewMatrix);
            
            if (bottomProj && bottomProj.visible) {
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = `rgba(80, 120, 60, ${alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(bottomProj.x, bottomProj.y, island.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Render vertical edges to connect top and bottom
            const edgeCount = 16;
            for (let i = 0; i < edgeCount; i++) {
                const angle = (i / edgeCount) * Math.PI * 2;
                const edgeX = island.position.x + Math.cos(angle) * island.size;
                const edgeZ = island.position.z + Math.sin(angle) * island.size;
                
                const topEdge = new Vector3D(edgeX, island.position.y + island.height / 2, edgeZ);
                const bottomEdge = new Vector3D(edgeX, island.position.y - island.height / 2, edgeZ);
                
                const topEdgeProj = renderer.projection.projectVector3D(topEdge, viewMatrix);
                const bottomEdgeProj = renderer.projection.projectVector3D(bottomEdge, viewMatrix);
                
                if (topEdgeProj && topEdgeProj.visible && bottomEdgeProj && bottomEdgeProj.visible) {
                    ctx.globalAlpha = alpha * 0.4;
                    ctx.strokeStyle = `rgba(60, 100, 50, ${alpha * 0.6})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(topEdgeProj.x, topEdgeProj.y);
                    ctx.lineTo(bottomEdgeProj.x, bottomEdgeProj.y);
                    ctx.stroke();
                }
            }
            
            // Render some grass/vegetation on top (optional detail)
            const grassCount = 5;
            for (let g = 0; g < grassCount; g++) {
                const grassAngle = (g / grassCount) * Math.PI * 2;
                const grassRadius = random(island.size * 0.3, island.size * 0.8);
                const grassX = island.position.x + Math.cos(grassAngle) * grassRadius;
                const grassZ = island.position.z + Math.sin(grassAngle) * grassRadius;
                const grassY = island.position.y + island.height / 2 + 1;
                
                const grassPos = new Vector3D(grassX, grassY, grassZ);
                const grassProj = renderer.projection.projectVector3D(grassPos, viewMatrix);
                
                if (grassProj && grassProj.visible) {
                    ctx.globalAlpha = alpha * 0.9;
                    ctx.fillStyle = `rgba(50, 200, 50, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(grassProj.x, grassProj.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        ctx.restore();
    }
}

