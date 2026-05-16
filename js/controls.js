// Input Controls Handler
class Controls {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            // Also store by code for arrow keys
            if (e.code) {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            if (e.code) {
                this.keys[e.code] = false;
            }
        });

        // Prevent default for game keys
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'q', 'e', ' '].includes(key) || 
                ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || this.keys[key] || false;
    }

    // Check if missile key is pressed
    isMissilePressed() {
        return this.isKeyPressed('m') || this.isKeyPressed('M');
    }

    // Check if laser key is pressed
    isLaserPressed() {
        return this.isKeyPressed('l') || this.isKeyPressed('L');
    }

    // Check if explode key is pressed
    isExplodePressed() {
        return this.isKeyPressed('x') || this.isKeyPressed('X');
    }

    updateSpaceship(spaceship) {
        // WASD for 3D movement
        spaceship.thrustingForward = this.isKeyPressed('w');
        spaceship.thrustingBackward = this.isKeyPressed('s');
        spaceship.strafingLeft = this.isKeyPressed('a');
        spaceship.strafingRight = this.isKeyPressed('d');
        
        // Q/E for pitch (up/down)
        spaceship.pitchingUp = this.isKeyPressed('q');
        spaceship.pitchingDown = this.isKeyPressed('e');
        
        // Arrow keys for yaw and roll
        spaceship.yawingLeft = this.isKeyPressed('ArrowLeft') || this.isKeyPressed('arrowleft');
        spaceship.yawingRight = this.isKeyPressed('ArrowRight') || this.isKeyPressed('arrowright');
        spaceship.rollingLeft = this.isKeyPressed('ArrowUp') || this.isKeyPressed('arrowup');
        spaceship.rollingRight = this.isKeyPressed('ArrowDown') || this.isKeyPressed('arrowdown');
    }

    getInputState() {
        return {
            forward: this.isKeyPressed('w'),
            backward: this.isKeyPressed('s'),
            left: this.isKeyPressed('a'),
            right: this.isKeyPressed('d'),
            space: this.isKeyPressed(' ')
        };
    }

    // Get controls for human player on planets
    getHumanControls() {
        return {
            forward: this.isKeyPressed('w'),
            backward: this.isKeyPressed('s'),
            left: this.isKeyPressed('a'),
            right: this.isKeyPressed('d'),
            rotateLeft: this.isKeyPressed('q'),
            rotateRight: this.isKeyPressed('e'),
            jump: false, // No regular jump key
            megaJump: this.isKeyPressed(' ') // Space key for mega jump
        };
    }
}

