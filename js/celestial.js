// Celestial Bodies System (Suns, Planets) - Infinite Procedural Generation
class CelestialBodies {
    constructor() {
        this.bodies = [];
        this.generatedChunks = new Set(); // Track which space chunks have been generated
        this.chunkSize = 5000; // Size of each chunk in world units (increased from 2000)
        this.loadDistance = 8000; // Distance to load chunks around spaceship (increased from 3000)
        this.unloadDistance = 12000; // Distance to unload chunks (increased from 5000)
        this.lastUpdatePosition = new Vector3D(0, 0, 0);
        this.updateInterval = 1000; // Update chunks every 1 second
        this.lastUpdate = 0;
        
        // Generate initial chunks around origin
        this.generateInitialChunks();
    }
    
    // Generate initial chunks around the starting position
    generateInitialChunks() {
        const startPos = new Vector3D(0, 100, 0);
        this.updateChunks(startPos, true); // Force immediate generation
        this.lastUpdatePosition = startPos.clone();
    }

    // Hash function to convert chunk coordinates to a seed
    hashChunk(chunkX, chunkY, chunkZ) {
        let hash = 0;
        const str = `${chunkX},${chunkY},${chunkZ}`;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Seeded random number generator
    seededRandom(seed) {
        let state = seed;
        return function() {
            state = (state * 1103515245 + 12345) & 0x7fffffff;
            return (state >>> 0) / 0x7fffffff;
        };
    }

    // Get chunk coordinates from world position
    getChunkCoords(position) {
        return {
            x: Math.floor(position.x / this.chunkSize),
            y: Math.floor(position.y / this.chunkSize),
            z: Math.floor(position.z / this.chunkSize)
        };
    }

    // Generate bodies for a specific chunk
    generateChunk(chunkX, chunkY, chunkZ) {
        const chunkKey = `${chunkX},${chunkY},${chunkZ}`;
        if (this.generatedChunks.has(chunkKey)) {
            return; // Already generated
        }
        
        this.generatedChunks.add(chunkKey);
        const seed = this.hashChunk(chunkX, chunkY, chunkZ);
        const rng = this.seededRandom(seed);
        
        // Generate 1-3 suns per chunk (more suns for bigger galaxy)
        const numSuns = 1 + Math.floor(rng() * 3); // 1-3 suns
        for (let i = 0; i < numSuns; i++) {
            const sunSeed = seed + i * 1000;
            const sunRng = this.seededRandom(sunSeed);
            
            // Position within chunk (spread out more)
            const localX = (sunRng() - 0.5) * this.chunkSize * 0.9;
            const localY = (sunRng() - 0.5) * this.chunkSize * 0.7;
            const localZ = (sunRng() - 0.5) * this.chunkSize * 0.9;
            
            this.bodies.push({
                type: 'sun',
                chunkKey: chunkKey,
                position: new Vector3D(
                    chunkX * this.chunkSize + localX,
                    chunkY * this.chunkSize + localY,
                    chunkZ * this.chunkSize + localZ
                ),
                size: 80 + sunRng() * 40, // 80-120
                color: `hsl(${30 + sunRng() * 30}, 100%, ${70 + sunRng() * 20}%)`,
                glowSize: 150 + sunRng() * 50,
                brightness: 0.8 + sunRng() * 0.2
            });
        }

        // Generate 4-12 planets per chunk (more planets for bigger galaxy)
        const numPlanets = 4 + Math.floor(rng() * 9); // 4-12 planets
        const planetTypes = [
            { color: '#4a90e2', name: 'blue' },
            { color: '#e2764a', name: 'red' },
            { color: '#8b7355', name: 'brown' },
            { color: '#52c9a2', name: 'green' },
            { color: '#d4a574', name: 'tan' },
            { color: '#9b59b6', name: 'purple' },
        ];

        for (let i = 0; i < numPlanets; i++) {
            const planetSeed = seed + 10000 + i * 100;
            const planetRng = this.seededRandom(planetSeed);
            
            // Position within chunk (spread out more for bigger galaxy)
            const localX = (planetRng() - 0.5) * this.chunkSize * 0.95;
            const localY = (planetRng() - 0.5) * this.chunkSize * 0.8;
            const localZ = (planetRng() - 0.5) * this.chunkSize * 0.95;
            
            const planetType = planetTypes[Math.floor(planetRng() * planetTypes.length)];
            
            this.bodies.push({
                type: 'planet',
                chunkKey: chunkKey,
                position: new Vector3D(
                    chunkX * this.chunkSize + localX,
                    chunkY * this.chunkSize + localY,
                    chunkZ * this.chunkSize + localZ
                ),
                size: 30 + planetRng() * 30, // 30-60
                color: planetType.color,
                name: planetType.name,
                rotation: planetRng() * Math.PI * 2,
                rotationSpeed: 0.01 + planetRng() * 0.02
            });
        }
    }

    // Update chunks based on spaceship position
    updateChunks(spaceshipPosition, force = false) {
        if (!force) {
            const currentTime = Date.now();
            if (currentTime - this.lastUpdate < this.updateInterval) {
                return; // Throttle updates
            }
            this.lastUpdate = currentTime;

            // Only update if spaceship moved significantly
            const moveDist = spaceshipPosition.subtract(this.lastUpdatePosition).magnitude();
            if (moveDist < this.chunkSize * 0.5) {
                return;
            }
        }
        this.lastUpdatePosition = spaceshipPosition.clone();

        // Get current chunk
        const currentChunk = this.getChunkCoords(spaceshipPosition);
        
        // Generate chunks in a sphere around the spaceship
        const loadRadius = Math.ceil(this.loadDistance / this.chunkSize);
        
        for (let dx = -loadRadius; dx <= loadRadius; dx++) {
            for (let dy = -loadRadius; dy <= loadRadius; dy++) {
                for (let dz = -loadRadius; dz <= loadRadius; dz++) {
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist <= loadRadius) {
                        this.generateChunk(
                            currentChunk.x + dx,
                            currentChunk.y + dy,
                            currentChunk.z + dz
                        );
                    }
                }
            }
        }

        // Remove bodies that are too far away
        const unloadRadius = this.unloadDistance;
        this.bodies = this.bodies.filter(body => {
            const dist = spaceshipPosition.distance(body.position);
            if (dist > unloadRadius) {
                // Remove chunk from generated set if all bodies are unloaded
                const bodyChunk = this.getChunkCoords(body.position);
                const bodyChunkKey = `${bodyChunk.x},${bodyChunk.y},${bodyChunk.z}`;
                
                // Check if any other bodies from this chunk still exist
                const hasOtherBodies = this.bodies.some(b => 
                    b !== body && b.chunkKey === bodyChunkKey && 
                    spaceshipPosition.distance(b.position) <= unloadRadius
                );
                
                if (!hasOtherBodies) {
                    this.generatedChunks.delete(bodyChunkKey);
                }
                
                return false; // Remove this body
            }
            return true; // Keep this body
        });
    }

    update(deltaTime, spaceshipPosition) {
        // Update chunks based on spaceship position
        if (spaceshipPosition) {
            this.updateChunks(spaceshipPosition);
        }
        
        // Update planet rotations
        for (let body of this.bodies) {
            if (body.type === 'planet') {
                body.rotation += body.rotationSpeed * deltaTime * 60;
                if (body.rotation > Math.PI * 2) {
                    body.rotation -= Math.PI * 2;
                }
            }
        }
    }

    render(ctx, renderer, camera, spaceship) {
        const viewMatrix = camera.getViewMatrix(spaceship);
        
        // Sort by depth for proper rendering
        const sorted = this.bodies.slice().sort((a, b) => {
            const depthA = renderer.projection.getDepth(
                a.position.x, a.position.y, a.position.z, viewMatrix
            );
            const depthB = renderer.projection.getDepth(
                b.position.x, b.position.y, b.position.z, viewMatrix
            );
            return depthB - depthA;
        });

        for (let body of sorted) {
            const projected = renderer.projection.projectVector3D(body.position, viewMatrix);
            
            if (!projected.visible) continue;

            const depth = 1 - projected.z;
            const size = body.size * (1 + depth * 0.5);
            
            if (body.type === 'sun') {
                // Render sun with glow effect
                const glowAlpha = body.brightness * depth * 0.3;
                const glowSize = body.glowSize * (1 + depth * 0.3);
                
                // Outer glow
                ctx.save();
                ctx.globalAlpha = glowAlpha;
                const gradient = ctx.createRadialGradient(
                    projected.x, projected.y, 0,
                    projected.x, projected.y, glowSize
                );
                // Use the sun's color for gradient
                gradient.addColorStop(0, body.color);
                gradient.addColorStop(0.3, body.color);
                gradient.addColorStop(0.7, body.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, glowSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Sun core
                ctx.save();
                ctx.globalAlpha = body.brightness * depth;
                ctx.fillStyle = body.color;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add some texture/patterns
                ctx.globalAlpha = (body.brightness * 0.5) * depth;
                ctx.strokeStyle = body.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const startRadius = size * 0.7;
                    const endRadius = size * 0.95;
                    ctx.beginPath();
                    ctx.moveTo(
                        projected.x + Math.cos(angle) * startRadius,
                        projected.y + Math.sin(angle) * startRadius
                    );
                    ctx.lineTo(
                        projected.x + Math.cos(angle) * endRadius,
                        projected.y + Math.sin(angle) * endRadius
                    );
                    ctx.stroke();
                }
                ctx.restore();

            } else if (body.type === 'planet') {
                // Render planet
                ctx.save();
                ctx.globalAlpha = Math.max(0.6, depth);
                ctx.fillStyle = body.color;
                
                // Planet sphere
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Add terminator (day/night line) based on rotation
                ctx.save();
                ctx.globalAlpha = depth * 0.4;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(
                    projected.x + Math.cos(body.rotation) * size * 0.3,
                    projected.y,
                    size * 0.7, size,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.restore();

                // Planet highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(
                    projected.x - size * 0.3,
                    projected.y - size * 0.3,
                    size * 0.3,
                    0, Math.PI * 2
                );
                ctx.fill();

                // Planet outline
                ctx.strokeStyle = body.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = depth;
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    // Get distance from spaceship to nearest celestial body
    getNearestBody(spaceshipPos) {
        let nearest = null;
        let minDist = Infinity;

        for (let body of this.bodies) {
            const dist = spaceshipPos.distance(body.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = { body, distance: dist };
            }
        }

        return nearest;
    }
}

