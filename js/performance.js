// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.fps = 60;
        this.frameTime = 0;
        this.frameTimes = [];
        this.sampleSize = 60;
    }

    update(frameTime) {
        this.frameTime = frameTime;
        this.frameCount++;
        this.frameTimes.push(frameTime);

        if (this.frameTimes.length > this.sampleSize) {
            this.frameTimes.shift();
        }

        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    getFPS() {
        return this.fps;
    }

    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    getStats() {
        return {
            fps: this.fps,
            frameTime: this.frameTime.toFixed(2) + 'ms',
            avgFrameTime: this.getAverageFrameTime().toFixed(2) + 'ms'
        };
    }

    render(ctx) {
        const stats = this.getStats();
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Courier New';
        // Position below the galaxy map (which is ~220px wide including margin)
        const mapRight = CANVAS_WIDTH - 10;
        const mapBottom = 210; // galaxy map is 200px + margin + title
        ctx.fillText(`FPS: ${stats.fps}`, mapRight - 120, mapBottom + 20);
        ctx.fillText(`Frame: ${stats.frameTime}`, mapRight - 120, mapBottom + 35);
    }
}

