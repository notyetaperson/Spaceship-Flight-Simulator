// Spaceship Entity (3D)
class Spaceship {
    constructor(x, y, z = 0) {
        this.position = new Vector3D(x, y, z);
        this.velocity = new Vector3D(0, 0, 0);
        
        // Rotation angles (in radians)
        this.yaw = 0;    // Rotation around Y axis (left/right)
        this.pitch = 0;  // Rotation around X axis (up/down)
        this.roll = 0;   // Rotation around Z axis (roll)
        
        // Control flags
        this.thrustingForward = false;
        this.thrustingBackward = false;
        this.strafingLeft = false;
        this.strafingRight = false;
        this.yawingLeft = false;
        this.yawingRight = false;
        this.pitchingUp = false;
        this.pitchingDown = false;
        this.rollingLeft = false;
        this.rollingRight = false;
        
        // Boat-like physics properties
        this.throttle = 0; // -1 to 1 (like boatsim)
        this.speed = 0; // Current speed in m/s
        this.angularVelocity = new Vector3D(0, 0, 0); // Angular velocity for smooth rotation
        
        // Properties
        this.thrustPower = SPACESHIP_THRUST_POWER;
        this.rotationSpeed = SPACESHIP_ROTATION_SPEED;
        this.pitchSpeed = SPACESHIP_PITCH_SPEED;
        this.rollSpeed = SPACESHIP_ROLL_SPEED;
        this.maxSpeed = SPACESHIP_MAX_SPEED;
        this.friction = SPACESHIP_FRICTION;
        this.size = SPACESHIP_SIZE;
        
        // Physics constants (like boatsim)
        this.acceleration = 100; // m/s²
        this.dragCoefficient = 0.001; // Drag force coefficient
        this.maxTurnRate = 2.0; // rad/s maximum turn rate
        this.minSpeedForSteering = 0.5; // m/s minimum speed for effective steering
        this.steeringEfficiency = 0.8;
        this.angularAcceleration = 8.0; // rad/s²
        this.angularDrag = 10.0; // Angular damping
        
        // Forward direction vector (for 3D movement)
        this.updateForwardVector();
    }

    updateForwardVector() {
        // Calculate forward direction based on yaw and pitch
        this.forward = new Vector3D(
            Math.sin(this.yaw) * Math.cos(this.pitch),
            -Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        ).normalize();
        
        // Right direction
        this.right = new Vector3D(
            Math.sin(this.yaw + Math.PI / 2),
            0,
            -Math.cos(this.yaw + Math.PI / 2)
        ).normalize();
        
        // Up direction
        this.up = this.right.cross(this.forward).normalize();
    }

    update(deltaTime, physics) {
        // Throttle input (like boatsim) - smooth throttle buildup/release
        if (this.thrustingForward) {
            this.throttle = Math.min(1, this.throttle + deltaTime * 2);
        } else if (this.thrustingBackward) {
            this.throttle = Math.max(-0.5, this.throttle - deltaTime * 2);
        } else {
            // Gradual throttle release
            this.throttle *= Math.pow(0.95, deltaTime * 60);
        }

        // Calculate target speed based on throttle
        const maxSpeed = this.maxSpeed === Infinity ? 1000 : this.maxSpeed;
        const targetSpeed = this.throttle * maxSpeed;
        
        // Smoothly approach target speed with acceleration/deceleration
        const speedDiff = targetSpeed - this.speed;
        const accelerationForce = Math.sign(speedDiff) * Math.min(
            Math.abs(speedDiff), 
            this.acceleration * deltaTime
        );
        this.speed += accelerationForce;

        // Apply drag (proportional to speed squared, like boatsim)
        const effectiveDrag = this.dragCoefficient * (1.0 - Math.min(0.5, Math.abs(this.speed) / maxSpeed * 0.5));
        const dragForce = this.speed * this.speed * effectiveDrag * deltaTime;
        this.speed -= dragForce * Math.sign(this.speed);
        
        // Handle near-zero speed
        if (Math.abs(this.speed) < 0.01) {
            this.speed = 0;
        }
        
        // Clamp speed to max
        if (this.throttle > 0) {
            this.speed = Math.min(maxSpeed, Math.max(0, this.speed));
        } else if (this.throttle < 0) {
            this.speed = Math.max(-maxSpeed * 0.5, this.speed);
        }

        // Calculate effective speed for steering (needs forward momentum)
        const absSpeed = Math.abs(this.speed);
        const effectiveSpeed = Math.max(0, absSpeed - this.minSpeedForSteering);
        const speedFactor = Math.min(1.0, effectiveSpeed / 50); // Normalize to base speed of 50 m/s

        // Smooth angular velocity for rotations (like boatsim)
        const targetAngularVelocity = new Vector3D(0, 0, 0);
        
        // Yaw rotation (left/right)
        let targetYawRate = 0;
        if (this.yawingLeft) {
            targetYawRate = -this.maxTurnRate * speedFactor * this.steeringEfficiency;
        } else if (this.yawingRight) {
            targetYawRate = this.maxTurnRate * speedFactor * this.steeringEfficiency;
        }
        
        // Pitch rotation (up/down)
        let targetPitchRate = 0;
        if (this.pitchingUp) {
            targetPitchRate = -this.maxTurnRate * speedFactor * this.steeringEfficiency * 0.8;
        } else if (this.pitchingDown) {
            targetPitchRate = this.maxTurnRate * speedFactor * this.steeringEfficiency * 0.8;
        }
        
        // Roll rotation
        let targetRollRate = 0;
        if (this.rollingLeft) {
            targetRollRate = -this.maxTurnRate * speedFactor * this.steeringEfficiency * 0.6;
        } else if (this.rollingRight) {
            targetRollRate = this.maxTurnRate * speedFactor * this.steeringEfficiency * 0.6;
        }
        
        targetAngularVelocity.y = targetYawRate;
        targetAngularVelocity.x = targetPitchRate;
        targetAngularVelocity.z = targetRollRate;

        // Smooth angular velocity transitions (like boatsim)
        const angularDiffs = targetAngularVelocity.subtract(this.angularVelocity);
        
        if (angularDiffs.magnitude() > 0.01) {
            const angularAccel = angularDiffs.multiply(
                Math.min(1.0, this.angularAcceleration * deltaTime / angularDiffs.magnitude())
            );
            this.angularVelocity = this.angularVelocity.add(angularAccel);
        } else {
            // Decay angular velocity when not actively turning
            const dragForce = this.angularVelocity.multiply(this.angularDrag * deltaTime);
            if (dragForce.magnitude() >= this.angularVelocity.magnitude()) {
                this.angularVelocity = new Vector3D(0, 0, 0);
            } else {
                this.angularVelocity = this.angularVelocity.subtract(dragForce);
            }
        }

        // Apply angular velocity to rotations
        this.yaw += this.angularVelocity.y * deltaTime;
        this.pitch += this.angularVelocity.x * deltaTime;
        this.roll += this.angularVelocity.z * deltaTime;
        
        // Clamp pitch
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        // Update forward vector based on new rotation
        this.updateForwardVector();

        // Calculate velocity from speed and direction (like boatsim)
        if (Math.abs(this.speed) > 0.01) {
            // Velocity is in the direction the ship is facing
            this.velocity = this.forward.multiply(this.speed);
            
            // Add strafe velocity (reduced effectiveness)
            if (this.strafingLeft) {
                const strafeVelocity = this.right.multiply(-this.speed * 0.3);
                this.velocity = this.velocity.add(strafeVelocity);
            }
            if (this.strafingRight) {
                const strafeVelocity = this.right.multiply(this.speed * 0.3);
                this.velocity = this.velocity.add(strafeVelocity);
            }
        } else {
            // Gradually decay velocity when stopped
            this.velocity = this.velocity.multiply(0.9);
            if (this.velocity.magnitude() < 0.01) {
                this.velocity = new Vector3D(0, 0, 0);
            }
        }

        // Update position using velocity
        physics.updatePosition3D(this, deltaTime);
    }

    // Get 3D vertices for drawing a realistic spaceship
    getVertices3D() {
        const size = this.size;
        const s = size; // Shorthand
        
        // Airplane-like geometry with distinct fuselage, wings, and tail
        const points = [
            // Nose and Cockpit (Front)
            new Vector3D(0, s * 0.2, -s * 4.0),        // 0: Nose tip
            new Vector3D(-s * 0.2, s * 0.1, -s * 3.8), // 1: Nose left
            new Vector3D(s * 0.2, s * 0.1, -s * 3.8),  // 2: Nose right
            new Vector3D(-s * 0.3, s * 0.05, -s * 3.5), // 3: Nose base left
            new Vector3D(s * 0.3, s * 0.05, -s * 3.5),  // 4: Nose base right
            new Vector3D(0, s * 0.5, -s * 3.2),         // 5: Cockpit top
            
            // Fuselage (Main Body)
            new Vector3D(-s * 0.35, -s * 0.1, -s * 2.5), // 6: Forward fuselage left
            new Vector3D(s * 0.35, -s * 0.1, -s * 2.5),  // 7: Forward fuselage right
            new Vector3D(0, s * 0.35, -s * 2.0),         // 8: Forward fuselage top
            
            new Vector3D(-s * 0.4, -s * 0.15, -s * 1.0), // 9: Mid fuselage left
            new Vector3D(s * 0.4, -s * 0.15, -s * 1.0),  // 10: Mid fuselage right
            new Vector3D(0, s * 0.3, -s * 0.8),          // 11: Mid fuselage top
            
            // Wing Roots
            new Vector3D(-s * 0.45, -s * 0.18, s * 0.0), // 12: Left wing root front
            new Vector3D(s * 0.45, -s * 0.18, s * 0.0),  // 13: Right wing root front
            new Vector3D(-s * 0.5, -s * 0.2, s * 0.5),   // 14: Left wing root back
            new Vector3D(s * 0.5, -s * 0.2, s * 0.5),    // 15: Right wing root back
            
            // Wings (Main Wings)
            new Vector3D(-s * 2.5, -s * 0.25, -s * 0.3), // 16: Left wing tip front
            new Vector3D(s * 2.5, -s * 0.25, -s * 0.3),  // 17: Right wing tip front
            new Vector3D(-s * 2.8, -s * 0.3, s * 0.2),   // 18: Left wing tip back
            new Vector3D(s * 2.8, -s * 0.3, s * 0.2),    // 19: Right wing tip back
            
            // Rear Fuselage
            new Vector3D(-s * 0.45, -s * 0.2, s * 1.2),  // 20: Rear fuselage left
            new Vector3D(s * 0.45, -s * 0.2, s * 1.2),   // 21: Rear fuselage right
            new Vector3D(0, s * 0.25, s * 1.4),          // 22: Rear fuselage top
            
            // Tail Section
            new Vector3D(0, s * 0.8, s * 2.2),           // 23: Vertical tail top
            new Vector3D(-s * 0.1, s * 0.2, s * 2.0),    // 24: Vertical tail base left
            new Vector3D(s * 0.1, s * 0.2, s * 2.0),     // 25: Vertical tail base right
            new Vector3D(-s * 1.2, s * 0.15, s * 2.0),   // 26: Left horizontal tail
            new Vector3D(s * 1.2, s * 0.15, s * 2.0),    // 27: Right horizontal tail
            
            // Engine Nacelles
            new Vector3D(-s * 0.3, -s * 0.5, s * 1.8),   // 28: Left engine exhaust
            new Vector3D(s * 0.3, -s * 0.5, s * 1.8),    // 29: Right engine exhaust
            
            // Additional detail points
            new Vector3D(-s * 0.35, -s * 0.4, s * 1.5),  // 30: Left engine body
            new Vector3D(s * 0.35, -s * 0.4, s * 1.5),   // 31: Right engine body
        ];

        // Rotate points around origin
        return points.map(point => {
            let rotated = point.clone();
            
            // Apply rotations
            rotated = rotated.rotateY(this.yaw);
            rotated = rotated.rotateX(this.pitch);
            rotated = rotated.rotateZ(this.roll);
            
            // Translate to position
            return rotated.add(this.position);
        });
    }
    
    // Get exhaust positions for particle effects
    getExhaustPositions() {
        const vertices = this.getVertices3D();
        return [
            vertices[28], // Left engine exhaust
            vertices[29]  // Right engine exhaust
        ];
    }

    // Legacy method for compatibility
    getVertices() {
        const vertices3D = this.getVertices3D();
        return vertices3D.map(v => ({ x: v.x, y: v.y, z: v.z }));
    }

    getSpeed() {
        // Return tracked speed (like boatsim) instead of velocity magnitude
        return Math.abs(this.speed);
    }
    
    // Getters for compatibility
    get x() { return this.position.x; }
    get y() { return this.position.y; }
    get z() { return this.position.z; }
    get vx() { return this.velocity.x; }
    get vy() { return this.velocity.y; }
    get vz() { return this.velocity.z; }
    get angle() { return this.yaw; }
}

