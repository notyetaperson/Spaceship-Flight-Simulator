// Visual Effects System
class Effects {
    constructor() {
        this.effects = [];
    }

    createExplosion(x, y, intensity = 10) {
        for (let i = 0; i < intensity; i++) {
            const angle = (Math.PI * 2 / intensity) * i;
            const speed = random(3, 8);
            this.effects.push({
                type: 'explosion',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                maxLife: 30,
                size: random(3, 6),
                color: `hsl(${random(0, 60)}, 100%, 50%)`
            });
        }
    }

    createSpark(x, y, vx, vy) {
        this.effects.push({
            type: 'spark',
            x: x,
            y: y,
            vx: vx + random(-1, 1),
            vy: vy + random(-1, 1),
            life: 20,
            maxLife: 20,
            size: 2
        });
    }

    update() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vx *= 0.95;
            effect.vy *= 0.95;
            effect.life--;

            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    render(ctx, camera) {
        for (let effect of this.effects) {
            const screenPos = camera.worldToScreen(effect.x, effect.y);
            const alpha = effect.life / effect.maxLife;

            ctx.save();
            ctx.globalAlpha = alpha;

            if (effect.type === 'explosion') {
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'spark') {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    clear() {
        this.effects = [];
    }
}

