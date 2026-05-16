// Game Constants
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// Spaceship Constants
const SPACESHIP_SIZE = 20;
const SPACESHIP_THRUST_POWER = 0.3; // Reduced for slower, more realistic acceleration
const SPACESHIP_ROTATION_SPEED = 0.05;
const SPACESHIP_PITCH_SPEED = 0.05;
const SPACESHIP_ROLL_SPEED = 0.05;
const SPACESHIP_MAX_SPEED = Infinity; // No speed limit
const SPACESHIP_FRICTION = 0.98; // Increased friction for more realistic deceleration

// Star Field Constants
const STAR_COUNT = 3000; // Increased for more light
const STAR_MIN_SPEED = 0.5;
const STAR_MAX_SPEED = 3;
const BRIGHT_STAR_RATIO = 0.15; // 15% of stars are bright stars

// Particle Constants
const PARTICLE_COUNT = 50;
const PARTICLE_LIFETIME = 30;
const PARTICLE_SPREAD = 0.3;

// Colors
const COLORS = {
    SPACESHIP: '#4a9eff',              // Realistic blue/silver
    SPACESHIP_DARK: '#2a5a8f',         // Darker blue for shaded areas
    SPACESHIP_LIGHT: '#7ab8ff',        // Lighter blue for highlights
    SPACESHIP_METAL: '#8a9ba8',        // Metallic gray
    COCKPIT: '#88ccff',                // Bright cyan for cockpit glass
    EXHAUST: '#ff6600',
    STAR: '#ffffff',
    UI: '#00ff00',
    BACKGROUND: '#000000',
    TERRAIN_GRID_MAJOR: '#00ffff',     // Bright cyan for major grid lines
    TERRAIN_GRID_MINOR: '#0099cc'      // Medium cyan for minor grid lines
};

// Game States
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

