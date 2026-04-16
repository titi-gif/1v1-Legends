// ============================================
//  renderer.js - Dessin Canvas
// ============================================

const Renderer = {

    init(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            Zones.init(canvas);
        });
    },

    draw(state) {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this._drawBackground();
        this._drawZones(state.zones);
        this._drawGoals();
        this._drawField();
        this._drawPowerups(state.powerups);
        this._drawBallTrail(state.ball);
        this._drawBall(state.ball);
        this._drawPlayer(state.p1);
        this._drawPlayer(state.p2);
        this._drawEffects(state);

        // --- DÉCOMPTE ---
        if (state.countdown !== null && state.countdown > 0) {
            const cx = canvas.width  / 2;
            const cy = canvas.height / 2;

            // Fond semi-transparent
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cercle pulsant
            const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 80);
            const radius = 90 * pulse;
            const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
            gradient.addColorStop(0, 'rgba(255,220,0,0.95)');
            gradient.addColorStop(1, 'rgba(255,100,0,0.0)');
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Chiffre
            ctx.font = `bold ${120 * pulse}px 'Segoe UI', sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = '#fff';
            ctx.shadowColor  = '#ff6600';
            ctx.shadowBlur   = 40;
            ctx.fillText(state.countdown, cx, cy);

            // Texte "Prêt ?"
            ctx.font         = 'bold 28px sans-serif';
            ctx.fillStyle    = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur   = 10;
            ctx.fillText('Prêts ?', cx, cy + 90);

            ctx.restore();
        }

    },


    // --- Fond ---
    _drawBackground() {
        const { ctx, canvas } = this;
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0d0d1f');
        grad.addColorStop(1, '#0a0a15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },

    // --- Terrain ---
    _drawField() {
        const { ctx, canvas } = this;
        const ground = canvas.height - 60;

        // Sol
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(0, ground, canvas.width, 60);
        ctx.strokeStyle = '#2a2a5a';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, ground, canvas.width, 60);

        // Ligne centrale
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 70);
        ctx.lineTo(canvas.width / 2, ground);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cercle central
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 90, 0, Math.PI * 2);
        ctx.stroke();

        // Point central
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
    },

    // --- Cages ---
    _drawGoals() {
        const { ctx, canvas } = this;
        const goalW  = 18;
        const goalH  = 160;
        const goalTop = canvas.height / 2 - goalH / 2;

        // Cage gauche (P1 défend)
        ctx.fillStyle   = 'rgba(99,102,241,0.15)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth   = 3;
        ctx.fillRect(0, goalTop, goalW, goalH);
        ctx.strokeRect(0, goalTop, goalW, goalH);

        // Cage droite (P2 défend)
        ctx.fillStyle   = 'rgba(239,68,68,0.15)';
        ctx.strokeStyle = '#ef4444';
        ctx.fillRect(canvas.width - goalW, goalTop, goalW, goalH);
        ctx.strokeRect(canvas.width - goalW, goalTop, goalW, goalH);
    },

    // --- Zones spéciales ---
    _drawZones(zones) {
        if (!GameSettings.zonesEnabled || !zones) return;
        const { ctx } = this;

        zones.forEach(z => {
            const pulse = 0.7 + 0.3 * Math.sin(z.pulseTimer);

            // Fond
            ctx.fillStyle = z.color;
            ctx.fillRect(z.rx, z.ry, z.w, z.h);

            // Bordure pulsante
            ctx.strokeStyle = z.border;
            ctx.lineWidth   = 2 * pulse;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(z.rx, z.ry, z.w, z.h);
            ctx.setLineDash([]);

            // Icône + label
            ctx.font      = '20px serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = z.border;
            ctx.fillText(z.icon, z.rx + z.w / 2, z.ry + z.h / 2 - 4);
            ctx.font      = 'bold 9px Segoe UI';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(z.label, z.rx + z.w / 2, z.ry + z.h / 2 + 12);
        });
    },

    // --- Power-ups ---
    _drawPowerups(powerups) {
        if (!powerups) return;
        const { ctx } = this;

        powerups.forEach(pu => {
            if (pu.collected) return;
            const y = pu.y + (pu.floatY || 0);

            // Halo
            const grad = ctx.createRadialGradient(pu.x, y, 0, pu.x, y, pu.radius * 2);
            grad.addColorStop(0, pu.color + '55');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pu.x, y, pu.radius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Cercle
            ctx.fillStyle   = pu.color + '33';
            ctx.strokeStyle = pu.color;
            ctx.lineWidth   = 2.5;
            ctx.beginPath();
            ctx.arc(pu.x, y, pu.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Icône
            ctx.font      = '18px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(pu.icon, pu.x, y);
            ctx.textBaseline = 'alphabetic';
        });
    },

    // --- Trail balle ---
    _drawBallTrail(ball) {
        if (!ball || !ball.trail) return;
        const { ctx } = this;
        ball.trail.forEach((pos, i) => {
            const alpha = (1 - i / ball.trail.length) * 0.25;
            const r     = ball.radius * (1 - i / ball.trail.length) * 0.8;
            ctx.fillStyle = ball.glowing
                ? `rgba(255,200,0,${alpha})`
                : `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    // --- Balle ---
    _drawBall(ball) {
        if (!ball) return;
        const { ctx } = this;

        // Glow si spécial
        if (ball.glowing || ball.laser || ball.mega) {
            const color = ball.mega ? '#ef4444' : ball.laser ? '#06b6d4' : '#fbbf24';
            const grad  = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2.5);
            grad.addColorStop(0, color + 'aa');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y + ball.radius + 2, ball.radius * 0.8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Balle
        ctx.font         = `${ball.radius * 2}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚽', ball.x, ball.y);
        ctx.textBaseline = 'alphabetic';
    },

    // --- Joueur ---
    _drawPlayer(player) {
        if (!player) return;
        const { ctx } = this;

        // Clone
        if (player.cloneActive && player.clone) {
            ctx.globalAlpha = player.clone.alpha;
            this._drawPlayerBody(player.clone.x, player.clone.y, player, true);
            ctx.globalAlpha = 1;
        }

        // Bouclier
        if (player.shield) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth   = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Glow ultime
        if (player.glowing) {
            const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 2.5);
            grad.addColorStop(0, player.color + '88');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Freeze overlay
        if (player.frozen) {
            ctx.fillStyle = 'rgba(6,182,212,0.25)';
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        this._drawPlayerBody(player.x, player.y, player, false);

        // Barre de vie stamina au-dessus
        this._drawStaminaBar(player);

        // Nom
        ctx.font      = 'bold 11px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillStyle = player.color;
        ctx.fillText(player.name, player.x, player.y - player.radius - 22);
    },

    _drawPlayerBody(x, y, player, isClone) {
        const { ctx } = this;

        // Cercle corps
        ctx.fillStyle   = isClone ? 'rgba(255,255,255,0.1)' : player.color + '33';
        ctx.strokeStyle = isClone ? 'rgba(255,255,255,0.3)' : player.color;
        ctx.lineWidth   = isClone ? 2 : 3;
        ctx.beginPath();
        ctx.arc(x, y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Emoji personnage
        ctx.font         = `${player.radius * 1.4}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.emoji, x, y);
        ctx.textBaseline = 'alphabetic';

        // Indicateur direction
        const arrowX = x + (player.facingRight ? player.radius + 6 : -player.radius - 6);
        ctx.fillStyle = player.color;
        ctx.font      = '10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.facingRight ? '▶' : '◀', arrowX, y);
        ctx.textBaseline = 'alphabetic';
    },

    _drawStaminaBar(player) {
        const { ctx }   = this;
        const barW      = 50;
        const barH      = 5;
        const bx        = player.x - barW / 2;
        const by        = player.y - player.radius - 14;
        const pct       = player.stamina / player.maxStamina;
        const color     = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, barH, 3);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, barW * pct, barH, 3);
        ctx.fill();
    },

    // --- Effets globaux ---
    _drawEffects(state) {
        const { ctx, canvas } = this;

        // Slow-mo overlay
        if (state.slowMo) {
            ctx.fillStyle = 'rgba(99,102,241,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Flash but
        if (state.goalFlash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${state.goalFlash * 0.3})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },


};
