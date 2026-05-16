// Physics Engine (3D)
class Physics {
    constructor() {
        this.gravity = 0;
    }

    // Apply velocity to position (3D)
    updatePosition3D(entity, deltaTime) {
        if (entity.position && entity.velocity) {
            // 3D entity
            const movement = entity.velocity.multiply(deltaTime * 60);
            entity.position = entity.position.add(movement);
        } else {
            // 2D entity (backward compatibility)
            entity.x += entity.vx * deltaTime;
            entity.y += entity.vy * deltaTime;
        }
    }

    // Legacy 2D version
    updatePosition(entity, deltaTime) {
        if (entity.position && entity.velocity) {
            this.updatePosition3D(entity, deltaTime);
        } else {
            entity.x += entity.vx * deltaTime;
            entity.y += entity.vy * deltaTime;
        }
    }

    // Apply friction to velocity (3D)
    applyFriction3D(entity, friction) {
        if (entity.velocity) {
            entity.velocity = entity.velocity.multiply(friction);
        }
    }

    // Legacy 2D version
    applyFriction(entity, friction) {
        if (entity.velocity) {
            this.applyFriction3D(entity, friction);
        } else {
            entity.vx *= friction;
            entity.vy *= friction;
        }
    }

    // Limit velocity to max speed (3D)
    limitVelocity3D(entity, maxSpeed) {
        if (entity.velocity) {
            const speed = entity.velocity.magnitude();
            if (speed > maxSpeed) {
                entity.velocity = entity.velocity.normalize().multiply(maxSpeed);
            }
        }
    }

    // Legacy 2D version
    limitVelocity(entity, maxSpeed) {
        if (entity.velocity) {
            this.limitVelocity3D(entity, maxSpeed);
        } else {
            const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
            if (speed > maxSpeed) {
                entity.vx = (entity.vx / speed) * maxSpeed;
                entity.vy = (entity.vy / speed) * maxSpeed;
            }
        }
    }

    // Apply acceleration in direction (3D using forward vector)
    applyThrust3D(entity, directionVector, power) {
        const thrust = directionVector.multiply(power);
        entity.velocity = entity.velocity.add(thrust);
    }

    // Legacy 2D thrust
    applyThrust(entity, angle, power) {
        if (entity.velocity && entity.forward) {
            // Use 3D if available
            this.applyThrust3D(entity, entity.forward, power);
        } else {
            // 2D fallback
            entity.vx += Math.cos(angle) * power;
            entity.vy += Math.sin(angle) * power;
        }
    }

    // Wrap position around world bounds
    wrapPosition3D(entity, size) {
        if (entity.position) {
            if (entity.position.x < -size) entity.position.x = size;
            if (entity.position.x > size) entity.position.x = -size;
            if (entity.position.y < -size) entity.position.y = size;
            if (entity.position.y > size) entity.position.y = -size;
            if (entity.position.z < -size) entity.position.z = size;
            if (entity.position.z > size) entity.position.z = -size;
        }
    }

    // Legacy 2D version
    wrapPosition(entity, width, height) {
        if (entity.position) {
            const size = Math.max(width, height) * 1.5;
            this.wrapPosition3D(entity, size);
        } else {
            if (entity.x < 0) entity.x = width;
            if (entity.x > width) entity.x = 0;
            if (entity.y < 0) entity.y = height;
            if (entity.y > height) entity.y = 0;
        }
    }

    // Calculate speed magnitude
    getSpeed(vx, vy) {
        if (vx && vy !== undefined) {
            return Math.sqrt(vx * vx + vy * vy);
        }
        return 0;
    }
}

