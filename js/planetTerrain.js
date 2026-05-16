// Planet Terrain - Procedural terrain generation for planets
class PlanetTerrain {
    constructor(planet) {
        this.planet = planet;
        this.terrainSize = 500; // Size of terrain area
        this.gridSize = 50; // Number of grid cells
        this.cellSize = this.terrainSize / this.gridSize;
        
        // Initialize Perlin noise with planet-specific seed
        const planetSeed = Math.floor(this.planet.position.x + this.planet.position.z) * 1000;
        this.noise = new Noise();
        this.noise.seed = planetSeed;
        
        this.heightMap = this.generateHeightMap();
        this.baseHeight = planet.position.y - planet.size - 10; // Surface level
    }

    generateHeightMap() {
        const heights = [];
        
        // Scale factor for noise coordinates (controls terrain feature size)
        const noiseScale = 0.08; // Smaller = larger features
        
        // Generate height map using Perlin noise
        for (let x = 0; x <= this.gridSize; x++) {
            heights[x] = [];
            for (let z = 0; z <= this.gridSize; z++) {
                // Convert grid coordinates to world coordinates for noise
                const worldX = x * noiseScale;
                const worldZ = z * noiseScale;
                
                // Use fractal noise (multiple octaves) for realistic terrain
                // Adjust octaves, frequency, and amplitude for different terrain types
                let height = 0;
                
                // Primary terrain shape (large features)
                height += this.noise.fractalNoise(worldX, worldZ, 4) * 12;
                
                // Secondary detail (medium features)
                height += this.noise.fractalNoise(worldX * 2.5, worldZ * 2.5, 3) * 6;
                
                // Fine detail (small features)
                height += this.noise.fractalNoise(worldX * 6, worldZ * 6, 2) * 2;
                
                // Very fine detail (surface roughness)
                height += this.noise.noise2D(worldX * 15, worldZ * 15) * 0.5;
                
                heights[x][z] = height;
            }
        }
        
        return heights;
    }

    getHeightAt(x, z) {
        // Convert world position to grid coordinates
        const localX = x - (this.planet.position.x - this.terrainSize / 2);
        const localZ = z - (this.planet.position.z - this.terrainSize / 2);
        
        const gridX = localX / this.cellSize;
        const gridZ = localZ / this.cellSize;
        
        // Clamp to valid range with smooth falloff at edges
        if (gridX < 0 || gridX >= this.gridSize || gridZ < 0 || gridZ >= this.gridSize) {
            // Return base height with slight smoothing at edges
            return this.baseHeight;
        }
        
        // Clamp indices to prevent out-of-bounds
        const x1 = Math.max(0, Math.min(this.gridSize - 1, Math.floor(gridX)));
        const z1 = Math.max(0, Math.min(this.gridSize - 1, Math.floor(gridZ)));
        const x2 = Math.max(0, Math.min(this.gridSize, x1 + 1));
        const z2 = Math.max(0, Math.min(this.gridSize, z1 + 1));
        
        const fx = Math.max(0, Math.min(1, gridX - x1));
        const fz = Math.max(0, Math.min(1, gridZ - z1));
        
        // Safe array access with bounds checking
        const h11 = this.heightMap[x1] && this.heightMap[x1][z1] !== undefined ? this.heightMap[x1][z1] : 0;
        const h21 = this.heightMap[x2] && this.heightMap[x2][z1] !== undefined ? this.heightMap[x2][z1] : 0;
        const h12 = this.heightMap[x1] && this.heightMap[x1][z2] !== undefined ? this.heightMap[x1][z2] : 0;
        const h22 = this.heightMap[x2] && this.heightMap[x2][z2] !== undefined ? this.heightMap[x2][z2] : 0;
        
        // Bilinear interpolation
        const h1 = h11 * (1 - fx) + h21 * fx;
        const h2 = h12 * (1 - fx) + h22 * fx;
        const height = h1 * (1 - fz) + h2 * fz;
        
        // Ensure we return a valid number
        if (!isFinite(height)) {
            return this.baseHeight;
        }
        
        return this.baseHeight + height;
    }

    render(ctx, renderer, camera, human) {
        if (!human || !camera) return;

        const viewMatrix = camera.getViewMatrix(human);
        const centerX = this.planet.position.x;
        const centerZ = this.planet.position.z;
        const renderDistance = 80; // Render terrain within this distance
        
        // Get human's position relative to terrain center
        const humanLocalX = human.position.x - centerX;
        const humanLocalZ = human.position.z - centerZ;
        
        ctx.save();

        // Render terrain mesh as filled triangles
        const cellsToRender = Math.floor(renderDistance / this.cellSize) + 1;
        const startX = Math.max(0, Math.floor((this.gridSize / 2) + (humanLocalX / this.cellSize) - cellsToRender));
        const endX = Math.min(this.gridSize - 1, Math.floor((this.gridSize / 2) + (humanLocalX / this.cellSize) + cellsToRender));
        const startZ = Math.max(0, Math.floor((this.gridSize / 2) + (humanLocalZ / this.cellSize) - cellsToRender));
        const endZ = Math.min(this.gridSize - 1, Math.floor((this.gridSize / 2) + (humanLocalZ / this.cellSize) + cellsToRender));

        // Render terrain faces
        for (let x = startX; x < endX; x++) {
            for (let z = startZ; z < endZ; z++) {
                const worldX1 = centerX - this.terrainSize / 2 + x * this.cellSize;
                const worldZ1 = centerZ - this.terrainSize / 2 + z * this.cellSize;
                const worldX2 = worldX1 + this.cellSize;
                const worldZ2 = worldZ1 + this.cellSize;
                
                const y1 = this.getHeightAt(worldX1, worldZ1);
                const y2 = this.getHeightAt(worldX2, worldZ1);
                const y3 = this.getHeightAt(worldX1, worldZ2);
                const y4 = this.getHeightAt(worldX2, worldZ2);
                
                const p1 = renderer.projection.projectVector3D(new Vector3D(worldX1, y1, worldZ1), viewMatrix);
                const p2 = renderer.projection.projectVector3D(new Vector3D(worldX2, y2, worldZ1), viewMatrix);
                const p3 = renderer.projection.projectVector3D(new Vector3D(worldX1, y3, worldZ2), viewMatrix);
                const p4 = renderer.projection.projectVector3D(new Vector3D(worldX2, y4, worldZ2), viewMatrix);
                
                if (p1 && p1.visible && p2 && p2.visible && p3 && p3.visible) {
                    const dist = human.position.distance(new Vector3D(worldX1, y1, worldZ1));
                    const alpha = Math.max(0.2, 1 - dist / renderDistance);
                    
                    // Calculate simple lighting based on normal
                    const normal = this.calculateNormal(worldX1, worldZ1);
                    const lightDot = Math.max(0.3, normal.y); // Light from above
                    
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillStyle = `rgba(${Math.floor(50 * lightDot)}, ${Math.floor(150 * lightDot)}, ${Math.floor(50 * lightDot)}, ${alpha * 0.8})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.fill();
                }
                
                if (p2 && p2.visible && p3 && p3.visible && p4 && p4.visible) {
                    const dist = human.position.distance(new Vector3D(worldX2, y2, worldZ1));
                    const alpha = Math.max(0.2, 1 - dist / renderDistance);
                    
                    const normal = this.calculateNormal(worldX2, worldZ2);
                    const lightDot = Math.max(0.3, normal.y);
                    
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillStyle = `rgba(${Math.floor(50 * lightDot)}, ${Math.floor(150 * lightDot)}, ${Math.floor(50 * lightDot)}, ${alpha * 0.8})`;
                    ctx.beginPath();
                    ctx.moveTo(p2.x, p2.y);
                    ctx.lineTo(p4.x, p4.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Draw wireframe edges
                if (p1 && p1.visible && p2 && p2.visible) {
                    ctx.globalAlpha = 0.3;
                    ctx.strokeStyle = '#008800';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                
                if (p1 && p1.visible && p3 && p3.visible) {
                    ctx.globalAlpha = 0.3;
                    ctx.strokeStyle = '#008800';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    calculateNormal(x, z) {
        // Calculate terrain normal for lighting
        const h1 = this.getHeightAt(x - 1, z);
        const h2 = this.getHeightAt(x + 1, z);
        const h3 = this.getHeightAt(x, z - 1);
        const h4 = this.getHeightAt(x, z + 1);
        
        const dx = (h2 - h1) / 2;
        const dz = (h4 - h3) / 2;
        
        // Normal vector pointing up
        const normal = new Vector3D(-dx, 1, -dz).normalize();
        return normal;
    }
}
