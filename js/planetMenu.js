// Planet Menu - Menu that appears when clicking planets on galaxy map
class PlanetMenu {
    constructor() {
        this.visible = false;
        this.planet = null;
        this.x = 0;
        this.y = 0;
        this.width = 250;
        this.height = 120;
    }

    show(planet, clickX, clickY) {
        this.planet = planet;
        this.visible = true;
        
        // Position menu near click, but keep it on screen
        this.x = Math.min(clickX + 20, CANVAS_WIDTH - this.width - 20);
        this.y = Math.min(clickY + 20, CANVAS_HEIGHT - this.height - 20);
        
        // Adjust if too close to edges
        if (this.x < 20) this.x = 20;
        if (this.y < 20) this.y = 20;
    }

    hide() {
        this.visible = false;
        this.planet = null;
    }

    handleClick(mouseX, mouseY) {
        if (!this.visible) return null;

        // Check if click is outside menu
        if (mouseX < this.x || mouseX > this.x + this.width ||
            mouseY < this.y || mouseY > this.y + this.height) {
            return 'outside';
        }

        // Check which button was clicked
        const buttonHeight = 40;
        const buttonY1 = this.y + 20;
        const buttonY2 = this.y + 60;

        if (mouseY >= buttonY1 && mouseY < buttonY1 + buttonHeight) {
            return 'teleport';
        } else if (mouseY >= buttonY2 && mouseY < buttonY2 + buttonHeight) {
            return 'inhabit';
        }

        return null;
    }

    render(ctx) {
        if (!this.visible || !this.planet) return;

        ctx.save();

        // Menu background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        
        // Rounded rectangle effect
        const radius = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.planet.type === 'sun' ? 'SUN' : 'PLANET', this.x + this.width / 2, this.y + 5);

        // Buttons
        const buttonHeight = 40;
        const buttonY1 = this.y + 20;
        const buttonY2 = this.y + 60;

        // Teleport button
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.fillRect(this.x + 10, buttonY1, this.width - 20, buttonHeight);
        ctx.strokeRect(this.x + 10, buttonY1, this.width - 20, buttonHeight);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = '14px monospace';
        ctx.fillText('Teleport', this.x + this.width / 2, buttonY1 + 12);

        // Inhabit button
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fillRect(this.x + 10, buttonY2, this.width - 20, buttonHeight);
        ctx.strokeRect(this.x + 10, buttonY2, this.width - 20, buttonHeight);
        
        ctx.fillStyle = '#00ffff';
        ctx.fillText('Inhabit', this.x + this.width / 2, buttonY2 + 12);

        ctx.restore();
    }
}
