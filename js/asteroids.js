// Asteroid Field System
class AsteroidField {
    constructor(count = 100) {
        this.asteroids = [];
        this.generateAsteroids(count);
    }

    generateAsteroids(count) {
        for (let i = 0; i < count; i++) {
            // Distribute asteroids in a sphere around origin
            const angle1 = random(0, Math.PI * 2);
            const angle2 = random(0, Math.PI);
            const distance = random(200, 1800);
            
            const x = Math.sin(angle2) * Math.cos(angle1) * distance;
            const y = Math.sin(angle2) * Math.sin(angle1) * distance;
            const z = Math.cos(angle2) * distance;

            const sizes = [10, 15, 20, 25, 30, 40]; // Different asteroid sizes
            const size = sizes[Math.floor(random(0, sizes.length))];
            
            this.asteroids.push({
                position: new Vector3D(x, y, z),
                size: size,
                rotation: {
                    x: random(0, Math.PI * 2),
                    y: random(0, Math.PI * 2),
                    z: random(0, Math.PI * 2)
                },
                rotationSpeed: {
                    x: random(-0.02, 0.02),
                    y: random(-0.02, 0.02),
                    z: random(-0.02, 0.02)
                },
                color: `hsl(${random(0, 60)}, ${random(20, 40)}%, ${random(30, 50)}%)`,
                shape: Math.floor(random(0, 3)) // Different shapes
            });
        }
    }

    update(deltaTime) {
        for (let asteroid of this.asteroids) {
            asteroid.rotation.x += asteroid.rotationSpeed.x * deltaTime * 60;
            asteroid.rotation.y += asteroid.rotationSpeed.y * deltaTime * 60;
            asteroid.rotation.z += asteroid.rotationSpeed.z * deltaTime * 60;
            
            // Normalize rotations
            if (asteroid.rotation.x > Math.PI * 2) asteroid.rotation.x -= Math.PI * 2;
            if (asteroid.rotation.y > Math.PI * 2) asteroid.rotation.y -= Math.PI * 2;
            if (asteroid.rotation.z > Math.PI * 2) asteroid.rotation.z -= Math.PI * 2;
        }
    }

    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        
        // Sort by depth
        const sorted = this.asteroids.slice().sort((a, b) => {
            const depthA = renderer.projection.getDepth(
                a.position.x, a.position.y, a.position.z, viewMatrix
            );
            const depthB = renderer.projection.getDepth(
                b.position.x, b.position.y, b.position.z, viewMatrix
            );
            return depthB - depthA;
        });

        for (let asteroid of sorted) {
            const projected = renderer.projection.projectVector3D(asteroid.position, viewMatrix);
            
            if (!projected.visible) continue;

            const depth = 1 - projected.z;
            const size = asteroid.size * (1 + depth * 0.3);
            const alpha = Math.max(0.5, Math.min(1.0, depth));

            ctx.save();
            ctx.translate(projected.x, projected.y);
            ctx.rotate(asteroid.rotation.z);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = asteroid.color;
            ctx.strokeStyle = asteroid.color;
            ctx.lineWidth = 1;

            // Draw different asteroid shapes
            if (asteroid.shape === 0) {
                // Rough polygonal shape
                ctx.beginPath();
                const sides = 8;
                for (let i = 0; i < sides; i++) {
                    const angle = (Math.PI * 2 / sides) * i;
                    const radius = size * (0.7 + Math.random() * 0.3);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (asteroid.shape === 1) {
                // Irregular blob
                ctx.beginPath();
                const points = 6;
                for (let i = 0; i < points; i++) {
                    const angle = (Math.PI * 2 / points) * i;
                    const radius = size * (0.6 + Math.random() * 0.4);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                // Cratered rock
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Add craters
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let i = 0; i < 2; i++) {
                    const craterX = (Math.random() - 0.5) * size * 0.8;
                    const craterY = (Math.random() - 0.5) * size * 0.8;
                    ctx.beginPath();
                    ctx.arc(craterX, craterY, size * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }

    // Check collision with asteroid
    checkCollision(position, radius) {
        for (let asteroid of this.asteroids) {
            const dist = position.distance(asteroid.position);
            if (dist < radius + asteroid.size) {
                return asteroid;
            }
        }
        return null;
    }
}

