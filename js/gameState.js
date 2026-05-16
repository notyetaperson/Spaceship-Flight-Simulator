// Game State Management
class GameState {
    constructor() {
        this.state = GAME_STATES.PLAYING;
        this.score = 0;
        this.time = 0;
        this.lastTime = Date.now();
    }

    update() {
        if (this.state === GAME_STATES.PLAYING) {
            const now = Date.now();
            this.time += (now - this.lastTime) / 1000;
            this.lastTime = now;
        }
    }

    setState(newState) {
        this.state = newState;
    }

    isPlaying() {
        return this.state === GAME_STATES.PLAYING;
    }

    isPaused() {
        return this.state === GAME_STATES.PAUSED;
    }

    reset() {
        this.score = 0;
        this.time = 0;
        this.lastTime = Date.now();
        this.state = GAME_STATES.PLAYING;
    }
}

