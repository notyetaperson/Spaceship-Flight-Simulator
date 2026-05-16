// Camera System (3D)
class Camera {
    constructor() {
        this.position = new Vector3D(0, 0, 0);
        this.targetPosition = new Vector3D(0, 0, 0);
        // External camera view - positioned to the side and behind spaceship
        this.followOffset = new Vector3D(25, 15, 50); // Right side, above, and behind
        this.smoothing = 0.08; // Slightly faster follow for external view
        this.worldSize = CANVAS_WIDTH * 3;
        
        // View matrix for 3D projection
        this.viewMatrix = new Matrix3D();
        
        // Impact tracking
        this.trackingImpact = false;
        this.impactPosition = null;
        this.impactStartTime = 0;
        this.impactDuration = 2.5; // How long to track impact (seconds)
        this.normalFollowOffset = this.followOffset.clone();
        this.normalSmoothing = this.smoothing;
        
        // Laser tracking
        this.trackingLaser = false;
        this.laserPosition = null;
    }

    follow(target) {
        // Calculate desired camera position (external view - side and behind spaceship)
        // This gives a third-person external perspective
        const offset = target.forward.multiply(-this.followOffset.z)
            .add(target.up.multiply(this.followOffset.y))
            .add(target.right.multiply(this.followOffset.x));
        
        this.targetPosition = target.position.add(offset);
    }

    update(deltaTime) {
        // Handle laser tracking (higher priority - track laser as it travels)
        if (this.trackingLaser && this.laserPosition && this.target) {
            const toLaser = this.laserPosition.subtract(this.target.position);
            const distanceToLaser = toLaser.magnitude();
            
            if (distanceToLaser > 0.1) {
                const directionToLaser = toLaser.normalize();
                
                // Position camera between spaceship and laser
                const mixFactor = 0.4; // 40% towards laser
                const targetCamPos = this.target.position.add(
                    directionToLaser.multiply(distanceToLaser * mixFactor)
                );
                
                // Add side and up offset for better view
                const sideVec = this.target.right ? this.target.right : new Vector3D(1, 0, 0);
                const upVec = this.target.up ? this.target.up : new Vector3D(0, 1, 0);
                const sideOffset = sideVec.multiply(30 * 0.4);
                const upOffset = upVec.multiply(30 * 0.3);
                const finalCamPos = targetCamPos.add(sideOffset).add(upOffset);
                
                // Set target position directly (override follow)
                this.targetPosition = finalCamPos;
                this.smoothing = 0.15; // Faster tracking for laser
            }
        }
        // Handle impact tracking
        else if (this.trackingImpact && this.impactPosition && this.target) {
            const elapsed = Date.now() - this.impactStartTime;
            const progress = Math.min(elapsed / (this.impactDuration * 1000), 1.0);
            
            if (progress < 1.0) {
                // Calculate direction from spaceship to impact
                const toImpact = this.impactPosition.subtract(this.target.position);
                const distanceToImpact = toImpact.magnitude();
                
                if (distanceToImpact > 0.1) {
                    const directionToImpact = toImpact.normalize();
                    
                    // Calculate zoom (closer at start, then pull back)
                    const zoomCurve = Math.sin(progress * Math.PI); // Smooth curve
                    const baseDistance = 40; // Base distance
                    const zoomIn = 60; // How much to zoom in
                    const zoomDistance = baseDistance + (zoomCurve * zoomIn); // Start close, zoom out
                    
                    // Calculate camera offset to look at impact point
                    // Position camera between spaceship and impact, offset to side
                    const toImpactNormalized = directionToImpact;
                    
                    // Create side vector perpendicular to direction
                    const rightVec = this.target.right ? this.target.right : new Vector3D(1, 0, 0);
                    const sideVec = rightVec.subtract(toImpactNormalized.multiply(rightVec.dot(toImpactNormalized))).normalize();
                    if (sideVec.magnitude() < 0.1) {
                        // Fallback if side vector is too small
                        const upVec = this.target.up ? this.target.up : new Vector3D(0, 1, 0);
                        const sideVecAlt = upVec.subtract(toImpactNormalized.multiply(upVec.dot(toImpactNormalized))).normalize();
                        if (sideVecAlt.magnitude() > 0.1) {
                            sideVec.x = sideVecAlt.x;
                            sideVec.y = sideVecAlt.y;
                            sideVec.z = sideVecAlt.z;
                        }
                    }
                    
                    // Mix: partway to impact, with side/up offset
                    const mixFactor = 0.3 + progress * 0.4; // Move 30-70% towards impact
                    const targetCamPos = this.target.position.add(toImpactNormalized.multiply(distanceToImpact * mixFactor));
                    
                    // Add side and up offset
                    const sideOffset = sideVec.multiply(zoomDistance * 0.4);
                    const upOffset = (this.target.up ? this.target.up : new Vector3D(0, 1, 0)).multiply(zoomDistance * 0.3);
                    const finalCamPos = targetCamPos.add(sideOffset).add(upOffset);
                    
                    // Set target position directly (override follow)
                    this.targetPosition = finalCamPos;
                }
                
                // Increase smoothing for smooth tracking
                this.smoothing = 0.12;
            } else {
                // Return to normal follow mode
                this.trackingImpact = false;
                this.impactPosition = null;
                this.followOffset = this.normalFollowOffset.clone();
                this.smoothing = this.normalSmoothing;
            }
        }
        
        // Smooth camera follow
        const diff = this.targetPosition.subtract(this.position);
        this.position = this.position.add(diff.multiply(this.smoothing));
        
        // No world bounds - camera can move freely in infinite space
        // Update view matrix to look at spaceship
        // We'll update this in getViewMatrix with the target
    }

    // Get view matrix looking at target from camera position
    getViewMatrix(target) {
        this.viewMatrix.identity();
        
        // Determine what to look at (laser, impact point, or spaceship)
        let lookAtPos;
        if (this.trackingLaser && this.laserPosition) {
            // Track laser position
            const targetPos = target.position;
            const laserPos = this.laserPosition;
            const blendFactor = 0.6; // Blend towards laser
            
            lookAtPos = {
                x: targetPos.x + (laserPos.x - targetPos.x) * blendFactor,
                y: targetPos.y + (laserPos.y - targetPos.y) * blendFactor,
                z: targetPos.z + (laserPos.z - targetPos.z) * blendFactor
            };
        } else if (this.trackingImpact && this.impactPosition) {
            const elapsed = Date.now() - this.impactStartTime;
            const progress = Math.min(elapsed / (this.impactDuration * 1000), 1.0);
            
            if (progress < 1.0) {
                // Blend between spaceship and impact position
                const targetPos = target.position;
                const impactPos = this.impactPosition;
                const blendFactor = Math.min(progress * 2, 1.0); // Faster transition to impact
                
                lookAtPos = {
                    x: targetPos.x + (impactPos.x - targetPos.x) * blendFactor,
                    y: targetPos.y + (impactPos.y - targetPos.y) * blendFactor,
                    z: targetPos.z + (impactPos.z - targetPos.z) * blendFactor
                };
            } else {
                lookAtPos = target.position;
            }
        } else {
            lookAtPos = target.position;
        }
        
        // Use spaceship's up vector for camera orientation
        const upX = target.up ? target.up.x : 0;
        const upY = target.up ? target.up.y : 1;
        const upZ = target.up ? target.up.z : 0;
        this.viewMatrix.lookAt(
            this.position.x, this.position.y, this.position.z,
            lookAtPos.x, lookAtPos.y, lookAtPos.z,
            upX, upY, upZ  // Up vector from spaceship
        );
        return this.viewMatrix;
    }

    // Convert 3D world coordinates to screen (using projection)
    worldToScreen3D(worldPos, projection) {
        // This will be handled by projection system
        return projection.projectVector3D(worldPos, this.viewMatrix);
    }

    // Legacy 2D conversion for compatibility
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.position.x + CANVAS_WIDTH / 2,
            y: worldY - this.position.y + CANVAS_HEIGHT / 2
        };
    }

    // Wrap world position (disabled - no world borders)
    wrapWorldPosition(entity) {
        // World borders removed - free movement in infinite space
        // Entities can move freely without wrapping
        return;
    }

    // Start tracking an impact point
    trackImpact(impactPosition) {
        this.trackingImpact = true;
        this.impactPosition = impactPosition.clone();
        this.impactStartTime = Date.now();
        this.trackingLaser = false; // Stop laser tracking when impact occurs
    }

    // Start tracking a laser beam
    trackLaser(laserPosition) {
        this.trackingLaser = true;
        this.laserPosition = laserPosition.clone();
    }

    // Stop tracking laser
    stopTrackingLaser() {
        this.trackingLaser = false;
        this.laserPosition = null;
    }
}

