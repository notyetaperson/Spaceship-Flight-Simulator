// Game Configuration
const Config = {
    // Display
    showFPS: true,
    showDebug: false,
    showTrail: true,

    // Gameplay
    enableSound: true,
    enableMusic: false,

    // Controls
    controls: {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        pause: ' '
    },

    // Graphics
    particleQuality: 'high', // 'low', 'medium', 'high'
    starCount: STAR_COUNT,
    enableEffects: true,

    // Physics
    enableFriction: true,
    enableGravity: false,

    // Save configuration
    save() {
        localStorage.setItem('spaceshipConfig', JSON.stringify(this));
    },

    // Load configuration
    load() {
        const saved = localStorage.getItem('spaceshipConfig');
        if (saved) {
            Object.assign(this, JSON.parse(saved));
        }
    }
};

