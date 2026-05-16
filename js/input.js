// Extended Input Handler
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            click: false
        };
        this.setupEvents();
    }

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.click = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || this.keys[key] || false;
    }

    isKeyPressed(key) {
        // For single press detection (would need frame tracking)
        return this.isKeyDown(key);
    }

    getMousePosition(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: this.mouse.x - rect.left,
            y: this.mouse.y - rect.top
        };
    }

    isMouseDown() {
        return this.mouse.down;
    }

    isMouseClicked() {
        const clicked = this.mouse.click;
        this.mouse.click = false; // Reset after reading
        return clicked;
    }

    update() {
        // Reset frame-specific inputs
        // Mouse click is reset when read
    }
}

