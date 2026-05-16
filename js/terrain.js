// 3D Terrain/Grid System
class Terrain {
    constructor() {
        this.gridSize = 5000; // Larger grid size for infinite appearance
        this.gridSpacing = 100; // Spacing between grid lines
        this.gridLines = [];
        this.generateGrid();
    }

    generateGrid() {
        // Generate grid lines for better visibility
        // Using larger grid for infinite appearance
        const halfSize = this.gridSize / 2;
        const numLines = Math.floor(this.gridSize / this.gridSpacing) + 1;
        
        // Create horizontal lines (along X axis at Y = 0)
        for (let i = 0; i < numLines; i++) {
            const z = -halfSize + (i * this.gridSpacing);
            this.gridLines.push({
                type: 'horizontal',
                start: new Vector3D(-halfSize, 0, z),
                end: new Vector3D(halfSize, 0, z),
                index: i
            });
        }
        
        // Create vertical lines (along Z axis at Y = 0)
        for (let i = 0; i < numLines; i++) {
            const x = -halfSize + (i * this.gridSpacing);
            this.gridLines.push({
                type: 'vertical',
                start: new Vector3D(x, 0, -halfSize),
                end: new Vector3D(x, 0, halfSize),
                index: i
            });
        }
    }
    
    // Generate additional grid lines around current position (for infinite grid effect)
    updateGridAroundPosition(cameraPosition) {
        // This could be extended to dynamically add grid lines as you move
        // For now, the grid is large enough to appear infinite
    }

    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        
        // Draw grid lines with depth sorting
        const lines = this.gridLines.slice();
        
        // Sort by depth (render far lines first)
        lines.sort((a, b) => {
            const depthA = renderer.projection.getDepth(
                a.start.x + (a.end.x - a.start.x) / 2,
                a.start.y + (a.end.y - a.start.y) / 2,
                a.start.z + (a.end.z - a.start.z) / 2,
                viewMatrix
            );
            const depthB = renderer.projection.getDepth(
                b.start.x + (b.end.x - b.start.x) / 2,
                b.start.y + (b.end.y - b.start.y) / 2,
                b.start.z + (b.end.z - b.start.z) / 2,
                viewMatrix
            );
            return depthB - depthA;
        });

        // Draw grid lines
        for (let line of lines) {
            const startProj = renderer.projection.projectVector3D(line.start, viewMatrix);
            const endProj = renderer.projection.projectVector3D(line.end, viewMatrix);
            
            if (startProj.visible && endProj.visible) {
                // Determine if this is a major line (every 5th line)
                const isMajor = line.index % 5 === 0;
                
                const depth = 1 - ((startProj.z + endProj.z) / 2);
                // Make lines more visible with higher minimum alpha
                const alpha = Math.max(0.5, Math.min(1.0, depth));
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = isMajor ? COLORS.TERRAIN_GRID_MAJOR : COLORS.TERRAIN_GRID_MINOR;
                ctx.lineWidth = isMajor ? 3 : 1.5; // Thicker lines for visibility
                
                ctx.beginPath();
                ctx.moveTo(startProj.x, startProj.y);
                ctx.lineTo(endProj.x, endProj.y);
                ctx.stroke();
                ctx.restore();
            } else if (startProj.visible || endProj.visible) {
                // Line partially visible - draw if at least one endpoint is visible
                const visibleProj = startProj.visible ? startProj : endProj;
                const otherProj = startProj.visible ? endProj : startProj;
                const depth = 1 - visibleProj.z;
                const alpha = Math.max(0.3, Math.min(0.7, depth));
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = COLORS.TERRAIN_GRID_MINOR;
                ctx.lineWidth = 1;
                
                // Try to draw to visible endpoint, or clip at screen edge
                ctx.beginPath();
                ctx.moveTo(startProj.x || visibleProj.x, startProj.y || visibleProj.y);
                ctx.lineTo(endProj.x || visibleProj.x, endProj.y || visibleProj.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // Check if a point is on the terrain plane
    getHeightAt(x, z) {
        return 0; // Flat terrain for now
    }
}

