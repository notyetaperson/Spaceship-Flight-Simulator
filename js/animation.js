// Animation and Timing Utilities
class Animation {
    constructor(duration, callback, easing = 'linear') {
        this.duration = duration;
        this.callback = callback;
        this.easing = easing;
        this.startTime = null;
        this.isRunning = false;
    }

    start() {
        this.startTime = performance.now();
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    update() {
        if (!this.isRunning) return;

        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const eased = this.applyEasing(progress);

        this.callback(eased);

        if (progress >= 1) {
            this.isRunning = false;
        }
    }

    applyEasing(t) {
        switch (this.easing) {
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return t * (2 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default:
                return t;
        }
    }
}

class Timer {
    constructor(duration, callback, repeat = false) {
        this.duration = duration;
        this.callback = callback;
        this.repeat = repeat;
        this.startTime = null;
        this.isRunning = false;
    }

    start() {
        this.startTime = performance.now();
        this.isRunning = true;
    }

    update() {
        if (!this.isRunning) return;

        const elapsed = performance.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.callback();
            if (this.repeat) {
                this.startTime = performance.now();
            } else {
                this.isRunning = false;
            }
        }
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        this.startTime = performance.now();
    }
}

