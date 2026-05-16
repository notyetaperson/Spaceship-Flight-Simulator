// Planet Skybox - Sky rendering for planet exploration
class PlanetSkybox {
    constructor(planet) {
        this.planet = planet;
        this.stars = [];
        this.time = 0;
        this.generateStars();
    }

    generateStars() {
        // Generate stars for skybox
        for (let i = 0; i < 500; i++) {
            this.stars.push({
                // Position on skybox sphere (in local space, will be rendered relative to camera)
                theta: random(0, Math.PI * 2), // Azimuth
                phi: random(-Math.PI / 2, Math.PI / 2), // Elevation
                size: random(1, 3),
                brightness: random(0.5, 1.0),
                twinkle: random(0, Math.PI * 2)
            });
        }
    }

    update(deltaTime) {
        this.time += deltaTime;
    }

    render(ctx, renderer, camera, human) {
        if (!human) return;

        const viewMatrix = camera.getViewMatrix(human);
        ctx.save();

        // Draw sky gradient (from planet color to dark)
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        const planetColor = this.planet.color;
        gradient.addColorStop(0, planetColor + '80'); // Top - planet colored with alpha
        gradient.addColorStop(0.5, '#000033'); // Middle - dark blue
        gradient.addColorStop(1, '#000000'); // Bottom - black
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Render stars
        for (let star of this.stars) {
            // Convert spherical coordinates to 3D position
            const distance = 1000; // Far distance for skybox
            const x = Math.cos(star.phi) * Math.cos(star.theta) * distance;
            const y = Math.sin(star.phi) * distance;
            const z = Math.cos(star.phi) * Math.sin(star.theta) * distance;
            
            // Position relative to human
            const starPos = human.position.add(new Vector3D(x, y, z));
            const proj = renderer.projection.projectVector3D(starPos, viewMatrix);
            
            if (!proj || !proj.visible) continue;
            
            // Twinkling effect
            const twinkle = Math.sin(this.time * 2 + star.twinkle) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle * 0.8;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw horizon line (where sky meets ground)
        const horizonY = CANVAS_HEIGHT * 0.7;
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(CANVAS_WIDTH, horizonY);
        ctx.stroke();

        ctx.restore();
    }
}

