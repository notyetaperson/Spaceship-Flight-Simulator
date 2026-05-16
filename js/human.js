// Human Player - For planet exploration
class Human {
    constructor(x, y, z) {
        this.position = new Vector3D(x, y, z);
        this.velocity = new Vector3D(0, 0, 0);
        this.rotation = 0; // Y rotation (yaw)
        
        // Physics properties
        this.walkSpeed = 8; // Walking speed (m/s)
        this.runSpeed = 15; // Running speed (m/s)
        this.acceleration = 40; // Acceleration (m/s²)
        this.deceleration = 50; // Deceleration (m/s²)
        this.maxSpeed = this.walkSpeed;
        this.currentSpeed = 0; // Current movement speed
        
        this.groundLevel = y;
        this.height = 1.8; // Human height
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = 18; // Gravity on planet (m/s²)
        this.jumpForce = 7; // Jump initial velocity (m/s)
        this.megaJumpForce = 20; // Mega jump initial velocity (m/s)
        this.isOnGround = false;
        
        // Physics state
        this.wasOnGround = false;
        this.groundNormal = new Vector3D(0, 1, 0); // Surface normal
    }

    update(deltaTime, controls, terrain) {
        // Cap deltaTime to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        const dt = cappedDeltaTime;

        // Determine if we want to move
        let moveDirection = new Vector3D(0, 0, 0);
        let wantsToMove = false;

        if (controls.forward) {
            moveDirection.x += Math.sin(this.rotation);
            moveDirection.z -= Math.cos(this.rotation);
            wantsToMove = true;
        }
        if (controls.backward) {
            moveDirection.x -= Math.sin(this.rotation);
            moveDirection.z += Math.cos(this.rotation);
            wantsToMove = true;
        }
        if (controls.left) {
            moveDirection.x -= Math.cos(this.rotation);
            moveDirection.z -= Math.sin(this.rotation);
            wantsToMove = true;
        }
        if (controls.right) {
            moveDirection.x += Math.cos(this.rotation);
            moveDirection.z += Math.sin(this.rotation);
            wantsToMove = true;
        }

        // Normalize movement direction
        if (wantsToMove) {
            moveDirection = moveDirection.normalize();
        }

        // Determine target speed based on input
        const targetSpeed = wantsToMove ? this.maxSpeed : 0;
        
        // Smoothly accelerate/decelerate to target speed
        const speedDiff = targetSpeed - this.currentSpeed;
        const accelRate = wantsToMove ? this.acceleration : this.deceleration;
        const speedChange = Math.sign(speedDiff) * Math.min(
            Math.abs(speedDiff),
            accelRate * dt
        );
        this.currentSpeed += speedChange;

        // Calculate movement velocity
        const moveVelocity = moveDirection.multiply(this.currentSpeed);

        // Get current terrain info
        const currentTerrainHeight = terrain ? terrain.getHeightAt(this.position.x, this.position.z) : this.groundLevel;
        const currentHeightDiff = this.position.y - currentTerrainHeight;
        this.isOnGround = currentHeightDiff < 0.2 && currentHeightDiff > -0.2 && !this.isJumping;

        // Calculate proposed new position
        const newX = this.position.x + moveVelocity.x * dt;
        const newZ = this.position.z + moveVelocity.z * dt;
        
        // Get terrain height and normal at new position
        const newTerrainHeight = terrain ? terrain.getHeightAt(newX, newZ) : this.groundLevel;
        const heightDiff = newTerrainHeight - currentTerrainHeight;
        const moveDistance = Math.sqrt((newX - this.position.x) ** 2 + (newZ - this.position.z) ** 2);
        
        // Calculate slope angle
        const slopeAngle = moveDistance > 0.001 ? Math.atan2(heightDiff, moveDistance) : 0;
        const maxSlopeAngle = Math.PI / 3; // 60 degrees max slope
        
        // Check if slope is walkable
        let canMove = true;
        if (this.isOnGround && heightDiff > 0 && slopeAngle > maxSlopeAngle) {
            // Too steep to walk up
            canMove = false;
            // Slide down slightly
            this.currentSpeed *= 0.7;
        }

        // Apply horizontal movement
        if (canMove) {
            this.position.x = newX;
            this.position.z = newZ;
        } else {
            // Reduce speed when hitting a wall
            this.currentSpeed *= 0.5;
        }
        
        // Get final terrain height after movement
        const finalTerrainHeight = terrain ? terrain.getHeightAt(this.position.x, this.position.z) : this.groundLevel;
        const finalHeightDiff = this.position.y - finalTerrainHeight;

        // Handle jumping (regular jump)
        if (controls.jump && this.isOnGround && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpForce;
            this.isOnGround = false;
        }
        
        // Handle mega jump (space key)
        if (controls.megaJump && this.isOnGround && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.megaJumpForce;
            this.isOnGround = false;
        }

        // Apply vertical physics (gravity and jumping)
        if (this.isJumping || !this.isOnGround) {
            // Apply gravity
            this.jumpVelocity -= this.gravity * dt;
            this.position.y += this.jumpVelocity * dt;
            
            // Check for landing
            if (this.position.y <= finalTerrainHeight) {
                // Landed
                this.position.y = finalTerrainHeight;
                this.jumpVelocity = 0;
                this.isJumping = false;
                this.isOnGround = true;
                
                // Landing impact (small velocity reduction)
                this.currentSpeed *= 0.8;
            }
        } else {
            // On ground - smoothly adjust to terrain height
            const targetY = finalTerrainHeight;
            const heightAdjust = (targetY - this.position.y) * 15 * dt; // Smooth interpolation
            this.position.y += heightAdjust;
            
            // Snap if very close (prevents jitter)
            if (Math.abs(this.position.y - finalTerrainHeight) < 0.05) {
                this.position.y = finalTerrainHeight;
            }
            
            // Apply slight downward force to stick to ground
            if (this.isOnGround) {
                const stickForce = 5.0; // Force to stick to ground
                const heightError = finalTerrainHeight - this.position.y;
                this.position.y += heightError * stickForce * dt;
            }
        }

        // Update ground normal (for future use with slope walking)
        if (terrain && this.isOnGround) {
            // Simple ground normal (straight up for now, could calculate from terrain slope)
            this.groundNormal = new Vector3D(0, 1, 0);
        }

        // Rotation (smooth and frame-rate independent)
        const rotationSpeed = 3.0; // radians per second
        if (controls.rotateLeft) {
            this.rotation -= rotationSpeed * dt;
        }
        if (controls.rotateRight) {
            this.rotation += rotationSpeed * dt;
        }

        // Update wasOnGround for next frame
        this.wasOnGround = this.isOnGround;
    }

    getForwardVector() {
        return new Vector3D(
            Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        ).normalize();
    }

    getRightVector() {
        return new Vector3D(
            Math.cos(this.rotation),
            0,
            Math.sin(this.rotation)
        ).normalize();
    }
}

