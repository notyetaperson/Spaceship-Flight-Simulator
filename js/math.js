// Extended Math Utilities
class MathUtils {
    // Linear interpolation
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // Smooth step interpolation
    static smoothStep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }

    // Map value from one range to another
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    // Normalize value to 0-1 range
    static normalize(value, min, max) {
        return (value - min) / (max - min);
    }

    // Clamp angle to 0-2π range
    static normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }

    // Get angle between two points
    static angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // Shortest angle difference between two angles
    static angleDifference(a1, a2) {
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return diff;
    }

    // Check if value is approximately equal
    static approximately(a, b, epsilon = 0.001) {
        return Math.abs(a - b) < epsilon;
    }
}

