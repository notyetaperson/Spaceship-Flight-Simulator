// UI Management
class UIManager {
    constructor() {
        this.speedElement = document.getElementById('speed');
        this.positionElement = document.getElementById('position');
        this.rotationElement = document.getElementById('rotation');
    }

    update(spaceship) {
        const speed = spaceship.getSpeed().toFixed(1);
        const x = spaceship.position.x.toFixed(0);
        const y = spaceship.position.y.toFixed(0);
        const z = spaceship.position.z.toFixed(0);
        const yaw = radToDeg(spaceship.yaw).toFixed(1);
        const pitch = radToDeg(spaceship.pitch).toFixed(1);

        if (this.speedElement) {
            this.speedElement.textContent = speed;
        }
        if (this.positionElement) {
            this.positionElement.textContent = `${x}, ${y}, ${z}`;
        }
        if (this.rotationElement) {
            this.rotationElement.textContent = `Y:${yaw}° P:${pitch}°`;
        }
    }

    showMessage(message) {
        // Could be extended for game messages
        console.log(message);
    }

    render(ctx, gameState) {
        // Additional on-canvas UI rendering could go here
        if (gameState.isPaused()) {
            ctx.fillStyle = COLORS.UI;
            ctx.font = '48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }
}

