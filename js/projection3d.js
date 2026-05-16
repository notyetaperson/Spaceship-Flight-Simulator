// 3D Projection System
class Projection3D {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.fov = Math.PI / 4; // 45 degrees
        this.near = 0.1;
        this.far = 1000;
        this.aspect = width / height;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.aspect = width / height;
    }

    projectVector3D(worldPos, viewMatrix) {
        // Transform world position by view matrix
        const viewPos = viewMatrix.transformVector(worldPos);
        
        // Calculate distance from camera
        const distance = Math.sqrt(viewPos.x * viewPos.x + viewPos.y * viewPos.y + viewPos.z * viewPos.z);
        
        // Behind camera check
        if (viewPos.z > 0) {
            return { visible: false, x: 0, y: 0, z: 0 };
        }

        // Perspective projection
        const f = 1.0 / Math.tan(this.fov / 2);
        const z = Math.abs(viewPos.z);
        
        if (z < this.near || z > this.far || z < 0.001) {
            return { visible: false, x: 0, y: 0, z: 0 };
        }

        // Project to screen space
        const x = (viewPos.x / z) * f * this.aspect * (this.height / 2);
        const y = (viewPos.y / z) * f * (this.height / 2);

        // Convert to screen coordinates (0,0 top-left)
        const screenX = this.width / 2 + x;
        const screenY = this.height / 2 - y;

        // Check for non-finite values
        if (!isFinite(screenX) || !isFinite(screenY) || !isFinite(z)) {
            return { visible: false, x: 0, y: 0, z: 0 };
        }

        // Normalized depth for sorting (0 = far, 1 = near)
        const normalizedZ = 1 - (z - this.near) / (this.far - this.near);
        
        // Ensure normalizedZ is valid
        if (!isFinite(normalizedZ) || normalizedZ < 0 || normalizedZ > 1) {
            return { visible: false, x: 0, y: 0, z: 0 };
        }

        return {
            visible: true,
            x: screenX,
            y: screenY,
            z: normalizedZ,
            depth: z
        };
    }

    getDepth(x, y, z, viewMatrix) {
        const viewPos = viewMatrix.transformVector(new Vector3D(x, y, z));
        return Math.abs(viewPos.z);
    }
}

