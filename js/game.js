// Main Game Loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        this.renderer = new Renderer(this.canvas);
        this.physics = new Physics();
        this.controls = new Controls();
        this.camera = new Camera();
        this.gameState = new GameState();
        this.uiManager = new UIManager();
        this.audioManager = new AudioManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.debug = new Debug();
        this.storageManager = new StorageManager();
        
        // Load configuration
        Config.load();
        
        // Initialize game entities (3D)
        const centerX = 0;
        const centerY = 100; // Start above terrain
        const centerZ = 0;
        this.spaceship = new Spaceship(centerX, centerY, centerZ);
        this.starField = new StarField();
        this.particleSystem = new ParticleSystem();
        this.terrain = new Terrain();
        this.galaxyMap = new GalaxyMap();
        this.celestialBodies = new CelestialBodies();
        this.asteroidField = new AsteroidField(150);
        this.speedEffects = new SpeedEffects();
        this.missileSystem = new MissileSystem();
        this.laserSystem = new LaserSystem();
        this.waveSystem = new WaveSystem();
        this.planetMenu = new PlanetMenu();
        this.explosions = [];
        
        // Mouse position tracking for planet camera
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // Setup mouse move listener for cursor tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        // Planet exploration mode
        this.inPlanetMode = false;
        this.currentPlanet = null;
        this.human = null;
        this.planetTerrain = null;
        this.planetSkybox = null;
        this.planetCamera = null;
        this.floatingIslands = null;
        this.mountains = null;
        this.missilePressed = false; // Track missile key state
        this.laserPressed = false; // Track laser key state
        this.explodePressed = false; // Track explode key state
        
        // Trail for spaceship (3D)
        this.trail = [];
        this.trailLength = 20;
        this.trailTimer = 0;
        
        // Lightspeed jump effect
        this.lightspeedEffect = {
            active: false,
            progress: 0,
            duration: 0.5,
            starLines: []
        };
        
        // Initialize systems
        this.audioManager.init();
        
        // Setup debug toggle (press 'D' key)
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'd') {
                this.debug.toggle();
            }
        });
        
        // Expose game instance globally for galaxy map access
        window.game = this;
        
        // Start game loop
        this.lastTime = performance.now();
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const frameTime = currentTime - this.lastTime;
        // Cap deltaTime more aggressively and ensure it's never zero or negative
        const deltaTime = Math.max(0.0001, Math.min(frameTime / 1000, 0.1));
        this.lastTime = currentTime;

        // Update performance monitoring
        this.performanceMonitor.update(frameTime);

        if (this.gameState.isPlaying()) {
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update controls
        this.controls.updateSpaceship(this.spaceship);

        // Fire missile if key pressed
        if (this.controls.isMissilePressed() && !this.missilePressed) {
            this.missileSystem.fireMissile(this.spaceship);
            this.missilePressed = true;
        } else if (!this.controls.isMissilePressed()) {
            this.missilePressed = false;
        }

        // Fire laser if key pressed
        if (this.controls.isLaserPressed() && !this.laserPressed) {
            this.laserSystem.fireLaser(this.spaceship);
            this.laserPressed = true;
        } else if (!this.controls.isLaserPressed()) {
            this.laserPressed = false;
        }

        // Self-destruct explosion if X pressed (only in space mode)
        if (!this.inPlanetMode) {
            if (this.controls.isExplodePressed() && !this.explodePressed) {
                this.createSelfDestructExplosion();
                this.explodePressed = true;
            } else if (!this.controls.isExplodePressed()) {
                this.explodePressed = false;
            }
        }

        // Exit planet mode with Escape
        if (this.inPlanetMode && this.controls.isKeyPressed('Escape')) {
            this.exitPlanetMode();
        }

        // Update spaceship (only if not in planet mode)
        if (!this.inPlanetMode) {
            this.spaceship.update(deltaTime, this.physics);
        } else if (this.human) {
            // Update human player
            const humanControls = this.controls.getHumanControls();
            this.human.update(deltaTime, humanControls, this.planetTerrain);
            this.planetSkybox.update(deltaTime);
            
            // Update planet camera with cursor position
            if (this.planetCamera) {
                // Pass current mouse position to camera for cursor following
                this.planetCamera.update(deltaTime, this.mouseX, this.mouseY);
            }
        }

        // Wrap spaceship position in world (only in space mode)
        if (!this.inPlanetMode) {
            this.camera.wrapWorldPosition(this.spaceship);
            
            // Update camera to follow spaceship
            this.camera.target = this.spaceship;
            this.camera.follow(this.spaceship);
            this.camera.update(deltaTime);
        }

        // Create exhaust particles when thrusting (more particles at higher speeds)
        if (this.spaceship.thrustingForward) {
            const speed = this.spaceship.getSpeed();
            const particleCount = Math.min(3 + Math.floor(speed / 10), 10); // More particles at higher speeds
            this.particleSystem.createExhaust(this.spaceship, particleCount);
        }

        // Update particle system
        this.particleSystem.update();

        // Update star field
        this.starField.update(this.spaceship);

        // Update celestial bodies (with spaceship position for infinite generation)
        this.celestialBodies.update(deltaTime, this.spaceship.position);

        // Update asteroids
        this.asteroidField.update(deltaTime);

        // Update galaxy map (for lightspeed jumps)
        this.galaxyMap.update(deltaTime, this.spaceship);

        // Update lightspeed jump effect
        if (this.lightspeedEffect.active) {
            this.lightspeedEffect.progress += deltaTime / this.lightspeedEffect.duration;
            if (this.lightspeedEffect.progress >= 1.0) {
                this.lightspeedEffect.active = false;
                this.lightspeedEffect.progress = 0;
            }
        }

        // Update speed-based effects
        this.speedEffects.update(this.spaceship, deltaTime);

        // Update missile system
        this.missileSystem.update(deltaTime, this.spaceship, this.celestialBodies);

        // Update laser system
        this.laserSystem.update(deltaTime, this.spaceship, this.celestialBodies);

        // Update wave system
        this.waveSystem.update(deltaTime);

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.age += deltaTime;
            
            // Update explosion particles
            for (let particle of explosion.particles) {
                particle.position = particle.position.add(
                    particle.velocity.multiply(deltaTime * 60)
                );
                particle.life -= deltaTime * (explosion.isSunExplosion ? 1.5 : 2);
                particle.velocity = particle.velocity.multiply(0.98); // Slow down
            }
            
            // Remove old explosions
            if (explosion.age >= explosion.maxAge) {
                this.explosions.splice(i, 1);
            }
        }

        // Update trail (3D)
        this.trailTimer += deltaTime;
        if (this.trailTimer > 0.1) {
            this.trailTimer = 0;
            this.trail.push({ position: this.spaceship.position.clone() });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
        }

        // Update game state
        this.gameState.update();

        // Update UI
        if (!this.inPlanetMode) {
            this.uiManager.update(this.spaceship);
        }
    }

    render() {
        // Clear canvas
        this.renderer.clear();

        // Render star field (3D) - behind everything
        this.starField.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render terrain grid (3D) - before spaceship for depth
        this.terrain.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render celestial bodies (suns and planets)
        this.celestialBodies.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render asteroids
        this.asteroidField.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render trail (3D)
        this.renderer.renderTrail(this.spaceship, this.camera, this.trail);

        // Render particles (3D)
        this.particleSystem.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render missiles
        this.missileSystem.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

        // Render lasers and update camera tracking
        this.laserSystem.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);
        
        // Track active lasers with camera
        if (this.laserSystem.lasers.length > 0) {
            // Track the first active laser
            const activeLaser = this.laserSystem.lasers[0];
            if (!activeLaser.hit) {
                this.camera.trackLaser(activeLaser.position);
            } else {
                this.camera.stopTrackingLaser();
            }
        } else {
            this.camera.stopTrackingLaser();
        }

        // Render explosions
        this.renderExplosions();

        // Render based on mode
        if (this.inPlanetMode && this.human && this.currentPlanet) {
            // Planet exploration mode - render planet content
            this.renderPlanetMode();
        } else {
            // Space mode - render normal space content
            // Render waves
            this.waveSystem.render(this.renderer.ctx, this.renderer, this.camera, this.spaceship);

            // Render spaceship (3D) - on top
            this.renderer.renderSpaceship(this.spaceship, this.camera);

            // Render speed-based effects (overlay on top)
            this.speedEffects.render(this.renderer.ctx, this.spaceship);

            // Render lightspeed jump effect
            this.renderLightspeedJump();

            // Render galaxy map (minimap)
            this.galaxyMap.render(this.renderer.ctx, this.spaceship);
        }

        // Render UI overlays (always visible)
        this.uiManager.render(this.renderer.ctx, this.gameState);
        
        // Render planet menu (only in space mode)
        if (!this.inPlanetMode) {
            this.planetMenu.render(this.renderer.ctx);
        }

        // Render performance stats if enabled
        if (Config.showFPS) {
            this.performanceMonitor.render(this.renderer.ctx);
        }

        // Render debug info
        if (this.debug.enabled) {
            this.debug.set('FPS', this.performanceMonitor.getFPS());
            this.debug.set('Position', `${this.spaceship.position.x.toFixed(1)}, ${this.spaceship.position.y.toFixed(1)}, ${this.spaceship.position.z.toFixed(1)}`);
            this.debug.set('Velocity', `${this.spaceship.velocity.x.toFixed(2)}, ${this.spaceship.velocity.y.toFixed(2)}, ${this.spaceship.velocity.z.toFixed(2)}`);
            this.debug.set('Speed', this.spaceship.getSpeed().toFixed(2));
            this.debug.set('Yaw', radToDeg(this.spaceship.yaw).toFixed(1) + '°');
            this.debug.set('Pitch', radToDeg(this.spaceship.pitch).toFixed(1) + '°');
            this.debug.set('Roll', radToDeg(this.spaceship.roll).toFixed(1) + '°');
            this.debug.set('Particles', this.particleSystem.particles.length);
            this.debug.render(this.renderer.ctx);
        }
    }

    pause() {
        this.gameState.setState(GAME_STATES.PAUSED);
    }

    resume() {
        this.gameState.setState(GAME_STATES.PLAYING);
        this.gameState.lastTime = Date.now();
    }

    reset() {
        const centerX = 0;
        const centerY = 100; // Start above terrain
        const centerZ = 0;
        this.spaceship = new Spaceship(centerX, centerY, centerZ);
        this.trail = [];
        this.particleSystem.clear();
        this.gameState.reset();
    }

    startLightspeedJump() {
        this.lightspeedEffect.active = true;
        this.lightspeedEffect.progress = 0;
        
        // Generate star lines for jump effect
        this.lightspeedEffect.starLines = [];
        for (let i = 0; i < 50; i++) {
            this.lightspeedEffect.starLines.push({
                x: random(0, CANVAS_WIDTH),
                y: random(0, CANVAS_HEIGHT),
                angle: random(0, Math.PI * 2),
                length: random(50, 200),
                speed: random(20, 50)
            });
        }
    }

    renderLightspeedJump() {
        if (!this.lightspeedEffect.active) return;

        const ctx = this.renderer.ctx;
        const progress = this.lightspeedEffect.progress;
        
        ctx.save();
        
        // White flash effect
        const flashAlpha = progress < 0.3 ? progress / 0.3 : (1 - progress) / 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Star streak lines
        ctx.strokeStyle = `rgba(0, 255, 255, ${flashAlpha * 0.6})`;
        ctx.lineWidth = 2;
        for (let line of this.lightspeedEffect.starLines) {
            const angle = line.angle;
            const x1 = line.x;
            const y1 = line.y;
            const x2 = x1 + Math.cos(angle) * line.length * progress;
            const y2 = y1 + Math.sin(angle) * line.length * progress;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderExplosions() {
        const ctx = this.renderer.ctx;
        const viewMatrix = this.camera.getViewMatrix(this.spaceship);

        for (let explosion of this.explosions) {
            const progress = explosion.age / explosion.maxAge;
            const currentRadius = explosion.radius + (explosion.maxRadius - explosion.radius) * progress;

            // Project explosion center
            const projected = this.renderer.projection.projectVector3D(
                explosion.position, viewMatrix
            );

            if (!projected || !projected.visible) continue;

            const depth = 1 - projected.z;
            const isSunExplosion = explosion.isSunExplosion || false;

            // Main explosion glow with multiple layers
            ctx.save();
            
            // Sun explosions are even more spectacular
            if (isSunExplosion) {
                // Multiple expanding shockwave rings for sun explosion
                if (explosion.shockwaves) {
                    for (let i = 0; i < explosion.shockwaves.length; i++) {
                        const shockwave = explosion.shockwaves[i];
                        // Update shockwave radius based on explosion progress
                        if (!shockwave.initialRadius) {
                            shockwave.initialRadius = shockwave.radius;
                        }
                        shockwave.radius = shockwave.initialRadius + (shockwave.speed * progress * 200);
                        shockwave.alpha = (1 - progress) * (1 - i * 0.15);
                        
                        if (shockwave.alpha > 0 && progress < 0.8) {
                            ctx.globalAlpha = shockwave.alpha * depth;
                            ctx.strokeStyle = shockwave.color;
                            ctx.lineWidth = 12 - i * 1.5;
                            ctx.shadowBlur = 40;
                            ctx.shadowColor = shockwave.color;
                            ctx.beginPath();
                            ctx.arc(projected.x, projected.y, shockwave.radius, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }

                // Massive outer expanding ring
                if (progress < 0.8) {
                    ctx.globalAlpha = (1 - progress / 0.8) * depth * 0.8;
                    const ringRadius = currentRadius * 2;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 15;
                    ctx.shadowBlur = 50;
                    ctx.shadowColor = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(projected.x, projected.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                // Planet explosion - outer expanding ring
                if (progress < 0.7) {
                    ctx.globalAlpha = (1 - progress / 0.7) * depth * 0.6;
                    const ringRadius = currentRadius * 1.5;
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 8;
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(projected.x, projected.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Main explosion core (larger for sun explosions)
            ctx.globalAlpha = (1 - progress) * depth;
            ctx.shadowBlur = isSunExplosion ? 60 : 40;
            ctx.shadowColor = isSunExplosion ? '#ffff00' : '#ff6600';

            const gradient = ctx.createRadialGradient(
                projected.x, projected.y, 0,
                projected.x, projected.y, currentRadius
            );
            
            if (isSunExplosion) {
                // Sun explosion gradient - brighter and whiter
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.1, '#ffffaa');
                gradient.addColorStop(0.2, '#ffff00');
                gradient.addColorStop(0.4, '#ffaa00');
                gradient.addColorStop(0.6, '#ff6600');
                gradient.addColorStop(0.8, '#ff3300');
                gradient.addColorStop(1, 'transparent');
            } else {
                // Planet explosion gradient
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.15, '#ffff00');
                gradient.addColorStop(0.3, '#ffaa00');
                gradient.addColorStop(0.6, '#ff6600');
                gradient.addColorStop(0.8, '#ff3300');
                gradient.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core (brighter for sun)
            ctx.globalAlpha = (1 - progress) * depth * (isSunExplosion ? 1.0 : 0.8);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = isSunExplosion ? 30 : 0;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, currentRadius * (isSunExplosion ? 0.4 : 0.3), 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.restore();

            // Render explosion particles
            for (let particle of explosion.particles) {
                const particleProj = this.renderer.projection.projectVector3D(
                    particle.position, viewMatrix
                );
                
                if (particleProj && particleProj.visible) {
                    const alpha = particle.life * depth;
                    ctx.globalAlpha = alpha;
                    
                    // Particle glow
                    ctx.fillStyle = particle.color;
                    ctx.shadowBlur = particle.glowSize;
                    ctx.shadowColor = particle.color;
                    ctx.beginPath();
                    ctx.arc(particleProj.x, particleProj.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    createSelfDestructExplosion() {
        // Create massive explosion at spaceship position
        const explosionPos = this.spaceship.position.clone();
        
        // Create a massive explosion effect (like sun explosion but even bigger)
        this.explosions.push({
            position: explosionPos,
            age: 0,
            maxAge: 5, // 5 seconds - long explosion
            radius: this.spaceship.size * 5,
            maxRadius: this.spaceship.size * 15, // Huge explosion
            particles: this.generateSelfDestructParticles(explosionPos),
            isSunExplosion: true, // Use sun explosion rendering
            shockwaves: []
        });

        // Generate multiple shockwaves
        for (let i = 0; i < 8; i++) {
            this.explosions[this.explosions.length - 1].shockwaves.push({
                radius: this.spaceship.size * (3 + i * 0.8),
                speed: 60 + i * 25,
                alpha: 1.0,
                color: i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#ffff00' : '#ff6600')
            });
        }

        // Reset spaceship physics (stop it)
        this.spaceship.velocity = new Vector3D(0, 0, 0);
        this.spaceship.speed = 0;
        this.spaceship.throttle = 0;
        this.spaceship.angularVelocity = new Vector3D(0, 0, 0);

        // Clear trail and particles
        this.trail = [];
        this.particleSystem.clear();

        // Create massive waves from self-destruct
        this.waveSystem.createWaves(explosionPos, 3.0); // Massive intensity
    }

    generateSelfDestructParticles(position) {
        const particles = [];
        const particleCount = 500; // Massive particle count

        for (let i = 0; i < particleCount; i++) {
            const angle = random(0, Math.PI * 2);
            const elevation = random(-Math.PI / 2, Math.PI / 2);
            const speed = random(20, 80); // Fast particles
            
            const vx = Math.cos(elevation) * Math.cos(angle) * speed;
            const vy = Math.sin(elevation) * speed;
            const vz = Math.cos(elevation) * Math.sin(angle) * speed;

            // Mix of colors for spectacular effect
            const colorMix = Math.random();
            let color;
            if (colorMix < 0.2) {
                color = '#ffffff'; // White hot
            } else if (colorMix < 0.4) {
                color = '#ffff00'; // Bright yellow
            } else if (colorMix < 0.6) {
                color = '#ffaa00'; // Orange
            } else if (colorMix < 0.8) {
                color = '#ff6600'; // Red-orange
            } else {
                color = '#ff0000'; // Red
            }

            particles.push({
                position: position.clone(),
                velocity: new Vector3D(vx, vy, vz),
                life: 2.5,
                maxLife: 2.5,
                size: random(6, 20), // Large particles
                color: color,
                glowSize: random(20, 50) // Large glow
            });
        }

        return particles;
    }

    // Enter planet exploration mode
    inhabitPlanet(planet) {
        this.currentPlanet = planet;
        this.inPlanetMode = true;
        
        // Create terrain for planet first (needed for spawn height)
        this.planetTerrain = new PlanetTerrain(planet);
        
        // Create skybox
        this.planetSkybox = new PlanetSkybox(planet);
        
        // Create floating islands
        this.floatingIslands = new FloatingIslands(planet);
        
        // Create mountains
        this.mountains = new Mountains(planet, this.planetTerrain);
        
        // Create human player on planet surface
        const surfaceHeight = planet.position.y - planet.size - 10;
        const spawnX = planet.position.x;
        const spawnZ = planet.position.z;
        const spawnHeight = this.planetTerrain.getHeightAt(spawnX, spawnZ) + 2;
        
        this.human = new Human(
            spawnX,
            spawnHeight,
            spawnZ
        );
        this.human.groundLevel = surfaceHeight;
        
        // Create planet exploration camera (first-person)
        this.planetCamera = new PlanetCamera(this.human);
    }

    // Exit planet exploration mode
    exitPlanetMode() {
        this.inPlanetMode = false;
        this.human = null;
        this.planetTerrain = null;
        this.planetSkybox = null;
        this.planetCamera = null;
        this.floatingIslands = null;
        this.mountains = null;
        this.currentPlanet = null;
    }

    // Render planet exploration mode
    renderPlanetMode() {
        const ctx = this.renderer.ctx;
        
        // Render skybox first
        this.planetSkybox.render(ctx, this.renderer, this.planetCamera, this.human);
        
        // Render terrain
        this.planetTerrain.render(ctx, this.renderer, this.planetCamera, this.human);
        
        // Render floating islands
        if (this.floatingIslands) {
            this.floatingIslands.render(ctx, this.renderer, this.planetCamera, this.human);
        }
        
        // Render mountains
        if (this.mountains) {
            this.mountains.render(ctx, this.renderer, this.planetCamera, this.human);
        }
        
        // Render planet as background sphere (optional visual reference)
        this.renderPlanetBackground();
        
        // Render lightspeed jump effect (overlay on top if active)
        this.renderLightspeedJump();
        
        // Render simple crosshair for first-person view
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();
        ctx.restore();
    }

    renderPlanetBackground() {
        // Render the planet as a large sphere in the background sky
        if (!this.planetCamera || !this.currentPlanet) return;
        
        const viewMatrix = this.planetCamera.getViewMatrix(this.human);
        const planetProj = this.renderer.projection.projectVector3D(
            this.currentPlanet.position,
            viewMatrix
        );
        
        if (planetProj && planetProj.visible) {
            const ctx = this.renderer.ctx;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.currentPlanet.color;
            ctx.beginPath();
            ctx.arc(planetProj.x, planetProj.y, this.currentPlanet.size * 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    startPlanetMegaJump() {
        // Create mega jump effect from planet surface
        this.lightspeedEffect.active = true;
        this.lightspeedEffect.progress = 0;
        this.lightspeedEffect.duration = 1.0; // 1 second jump
        
        // Generate star lines for jump effect
        this.lightspeedEffect.starLines = [];
        for (let i = 0; i < 50; i++) {
            this.lightspeedEffect.starLines.push({
                x: CANVAS_WIDTH / 2,
                y: CANVAS_HEIGHT / 2,
                angle: random(0, Math.PI * 2),
                length: random(200, 400)
            });
        }
        
        // Exit planet mode after jump completes
        setTimeout(() => {
            this.exitPlanetMode();
            // Position spaceship near planet (above surface)
            if (this.currentPlanet) {
                const planetPos = this.currentPlanet.position;
                const safeDistance = this.currentPlanet.size + this.spaceship.size * 5;
                this.spaceship.position = planetPos.clone().add(new Vector3D(0, safeDistance, 0));
                this.spaceship.velocity = new Vector3D(0, 0, 0);
                this.spaceship.speed = 0;
                this.spaceship.throttle = 0;
            }
            this.lightspeedEffect.active = false;
        }, this.lightspeedEffect.duration * 1000);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        const game = new Game();
        
        // Pause/resume with spacebar (only in space mode, not planet mode)
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
                // In planet mode, space triggers player mega jump (handled in human controls)
                if (game.inPlanetMode) {
                    // Mega jump is handled via human controls
                    return;
                }
                // In space mode, space pauses/resumes
                if (game.gameState.isPlaying()) {
                    game.pause();
                } else if (game.gameState.isPaused()) {
                    game.resume();
                }
            }
        });

        // Handle clicks on galaxy map for planet menu and lightspeed jumps
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check if clicking on planet menu
            if (game.planetMenu && game.planetMenu.visible) {
                const menuAction = game.planetMenu.handleClick(mouseX, mouseY);
                if (menuAction === 'teleport') {
                    const planet = game.planetMenu.planet;
                    game.startLightspeedJump();
                    game.galaxyMap.startJump(planet, game.spaceship);
                    game.planetMenu.hide();
                } else if (menuAction === 'inhabit') {
                    const planet = game.planetMenu.planet;
                    game.inhabitPlanet(planet);
                    game.planetMenu.hide();
                } else if (menuAction === 'outside') {
                    // Click outside menu, close it
                    game.planetMenu.hide();
                }
                return;
            }
            
            // Check if click is on a planet in the galaxy map
            const clickedBody = game.galaxyMap.handleClick(mouseX, mouseY, game.spaceship);
            
            if (clickedBody && clickedBody.type === 'planet') {
                // Show planet menu for planets
                game.planetMenu.show(clickedBody, mouseX, mouseY);
            } else if (clickedBody && clickedBody.type === 'sun') {
                // For suns, just teleport (no menu)
                game.startLightspeedJump();
                game.galaxyMap.startJump(clickedBody, game.spaceship);
            }
        });
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error initializing game. Please check the browser console for details.');
    }
});

