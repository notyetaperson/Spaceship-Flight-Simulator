// Noise Generation Utilities
class Noise {
    constructor(seed = null) {
        this.seed = seed !== null ? seed : Math.random() * 1000000;
    }

    // Simple hash function for seeded random
    hash(n) {
        n = ((n << 13) ^ n) * (this.seed + 1);
        n = (n << (n << (n << 2 & 0x2) & 0x2)) & 0xffffffff;
        return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }

    // 1D Perlin-like noise
    noise1D(x) {
        const i = Math.floor(x);
        const f = x - i;
        const a = this.hash(i);
        const b = this.hash(i + 1);
        return lerp(a, b, f * f * (3 - 2 * f));
    }

    // 2D noise
    noise2D(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const tl = this.hash(xi + yi * 57);
        const tr = this.hash(xi + 1 + yi * 57);
        const bl = this.hash(xi + (yi + 1) * 57);
        const br = this.hash(xi + 1 + (yi + 1) * 57);

        const t = lerp(tl, tr, xf * xf * (3 - 2 * xf));
        const b = lerp(bl, br, xf * xf * (3 - 2 * xf));
        
        return lerp(t, b, yf * yf * (3 - 2 * yf));
    }

    // Fractal noise (octaves)
    fractalNoise(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    }
}

