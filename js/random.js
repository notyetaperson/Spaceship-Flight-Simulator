// Enhanced Random Number Generator
class Random {
    constructor(seed = null) {
        this.seed = seed || Date.now();
        this.state = this.seed;
    }

    // Linear Congruential Generator
    next() {
        this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.state / Math.pow(2, 32);
    }

    // Random float between min and max
    float(min = 0, max = 1) {
        return min + (max - min) * this.next();
    }

    // Random integer between min and max (inclusive)
    int(min, max) {
        return Math.floor(this.float(min, max + 1));
    }

    // Random boolean
    bool() {
        return this.next() < 0.5;
    }

    // Random choice from array
    choice(array) {
        return array[this.int(0, array.length - 1)];
    }

    // Shuffle array
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // Random point in circle
    pointInCircle(radius) {
        const angle = this.float(0, Math.PI * 2);
        const r = radius * Math.sqrt(this.float(0, 1));
        return {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
        };
    }

    // Random point on circle perimeter
    pointOnCircle(radius) {
        const angle = this.float(0, Math.PI * 2);
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }
}

// Global random instance
const rng = new Random();

