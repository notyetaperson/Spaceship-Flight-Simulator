// Collision Detection System
class CollisionDetector {
    constructor() {
        this.bounds = {
            width: CANVAS_WIDTH * 3,
            height: CANVAS_HEIGHT * 3
        };
    }

    // Point in circle collision
    pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    // Circle-circle collision
    circleCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;
        return distSquared <= (radiusSum * radiusSum);
    }

    // Point in rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    // AABB collision (Axis-Aligned Bounding Box)
    aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    // Check if entity is within world bounds
    isInBounds(entity, padding = 0) {
        return entity.x >= -padding &&
               entity.x <= this.bounds.width + padding &&
               entity.y >= -padding &&
               entity.y <= this.bounds.height + padding;
    }

    // Get distance between two entities
    getDistance(entity1, entity2) {
        return distance(entity1.x, entity1.y, entity2.x, entity2.y);
    }
}

