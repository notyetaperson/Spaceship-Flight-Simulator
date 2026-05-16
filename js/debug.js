// Debug Utilities
class Debug {
    constructor() {
        this.enabled = false;
        this.info = {};
    }

    toggle() {
        this.enabled = !this.enabled;
    }

    set(key, value) {
        this.info[key] = value;
    }

    log(message) {
        if (this.enabled) {
            console.log('[Debug]', message);
        }
    }

    render(ctx) {
        if (!this.enabled) return;

        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'left';

        let y = 60;
        for (const [key, value] of Object.entries(this.info)) {
            ctx.fillText(`${key}: ${value}`, 10, y);
            y += 15;
        }
    }

    drawVector(ctx, camera, x, y, vx, vy, scale = 1, color = '#ff0000') {
        if (!this.enabled) return;

        const start = camera.worldToScreen(x, y);
        const end = camera.worldToScreen(x + vx * scale, y + vy * scale);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(vy, vx);
        const arrowLength = 5;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    drawCircle(ctx, camera, x, y, radius, color = '#ff0000') {
        if (!this.enabled) return;

        const screenPos = camera.worldToScreen(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

