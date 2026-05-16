// Planet Camera - First-person camera for planet exploration
class PlanetCamera {
    constructor(human) {
        this.human = human;
        this.position = new Vector3D(0, 0, 0);
        this.pitch = 0; // Look up/down
        this.yaw = 0; // Look left/right
        this.height = 1.7; // Eye height above ground
    }

    update(deltaTime, mouseX = null, mouseY = null) {
        if (!this.human) return;

        // Cap deltaTime to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.1);

        // Smoothly interpolate camera position to human's eye level
        const targetX = this.human.position.x;
        const targetY = this.human.position.y + this.height;
        const targetZ = this.human.position.z;
        
        // Use frame-rate independent lerp for smooth following
        const lerpFactor = 1 - Math.pow(0.1, cappedDeltaTime); // Smooth exponential following
        this.position.x += (targetX - this.position.x) * lerpFactor;
        this.position.y += (targetY - this.position.y) * lerpFactor;
        this.position.z += (targetZ - this.position.z) * lerpFactor;

        // Update camera rotation based on cursor position (if provided)
        if (mouseX !== null && mouseY !== null) {
            const centerX = CANVAS_WIDTH / 2;
            const centerY = CANVAS_HEIGHT / 2;
            
            // Calculate offset from center (normalized to -1 to 1 range)
            const maxOffset = Math.min(centerX, centerY);
            const offsetX = (mouseX - centerX) / maxOffset;
            const offsetY = (mouseY - centerY) / maxOffset;
            
            // Directly set yaw and pitch based on cursor position (not accumulating)
            // Max rotation angle (in radians) - how far camera can look
            const maxLookAngle = Math.PI / 3; // 60 degrees max look angle
            
            this.yaw = this.human.rotation + offsetX * maxLookAngle;
            this.pitch = -offsetY * maxLookAngle; // Invert Y for natural feel
            
            // Clamp pitch to prevent flipping
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        } else {
            // Fallback: camera rotation matches human rotation if no mouse input
            this.yaw = this.human.rotation;
        }
    }

    getViewMatrix(target) {
        const viewMatrix = new Matrix3D();
        
        // Calculate forward direction based on yaw and pitch
        const forwardX = Math.sin(this.yaw) * Math.cos(this.pitch);
        const forwardY = -Math.sin(this.pitch);
        const forwardZ = -Math.cos(this.yaw) * Math.cos(this.pitch);
        
        // Look at point in front of camera
        const lookAt = this.position.add(new Vector3D(forwardX, forwardY, forwardZ).multiply(10));
        
        // Up vector
        const upX = 0;
        const upY = 1;
        const upZ = 0;
        
        viewMatrix.lookAt(
            this.position.x, this.position.y, this.position.z,
            lookAt.x, lookAt.y, lookAt.z,
            upX, upY, upZ
        );
        
        return viewMatrix;
    }

    // Adjust look direction (for mouse look)
    adjustLook(deltaX, deltaY) {
        this.yaw += deltaX * 0.002;
        this.pitch += deltaY * 0.002;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    }
}
