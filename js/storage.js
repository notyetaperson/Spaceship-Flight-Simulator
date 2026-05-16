// Local Storage Management
class StorageManager {
    constructor() {
        this.prefix = 'spaceship_';
    }

    save(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    }

    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Failed to load:', e);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Failed to remove:', e);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Failed to clear:', e);
            return false;
        }
    }

    saveHighScore(score) {
        const currentHigh = this.load('highScore', 0);
        if (score > currentHigh) {
            this.save('highScore', score);
            return true;
        }
        return false;
    }

    getHighScore() {
        return this.load('highScore', 0);
    }
}

