// ============================================
//  powerups.js - Power-ups aléatoires
// ============================================

const Powerups = {

    SPAWN_INTERVAL: 600, // frames (10s)
    MAX_ACTIVE:     3,

    TYPES: [
        { id: 'double_speed',   icon: '⚡', name: 'Double Vitesse',  color: '#facc15', duration: 5000  },
        { id: 'explosive_shot', icon: '💣', name: 'Tir Explosif',    color: '#ef4444', duration: 8000  },
        { id: 'shield',         icon: '🛡️', name: 'Bouclier',        color: '#6366f1', duration: 6000  },
        { id: 'clone',          icon: '👥', name: 'Clone',           color: '#a855f7', duration: 7000  },
        { id: 'big_ball',       icon: '🔵', name: 'Méga Balle',      color: '#06b6d4', duration: 6000  },
        { id: 'stamina_full',   icon: '💚', name: 'Stamina Full',    color: '#10b981', duration: 0     },
        { id: 'ultimate_boost', icon: '🌟', name: 'Boost Ultime',    color: '#fbbf24', duration: 0     },
    ],

    active:    [],  // power-ups sur le terrain
    spawnTimer: 0,

    reset() {
        this.active    = [];
        this.spawnTimer = 0;
    },

    update(canvas, p1, p2, ball) {
        if (!GameSettings.powerupsEnabled) return;

        this.spawnTimer++;
        if (this.spawnTimer >= this.SPAWN_INTERVAL && this.active.length < this.MAX_ACTIVE) {
            this._spawn(canvas);
            this.spawnTimer = 0;
        }

        // Animation flottement
        this.active.forEach(pu => {
            pu.floatTimer = (pu.floatTimer || 0) + 0.05;
            pu.floatY     = Math.sin(pu.floatTimer) * 6;
        });

        // Collision P1
        this._checkCollect(p1, ball, canvas);
        // Collision P2
        this._checkCollect(p2, ball, canvas);

        // Nettoyage
        this.active = this.active.filter(pu => !pu.collected);
    },

    _spawn(canvas) {
        const type = this.TYPES[Math.floor(Math.random() * this.TYPES.length)];
        const margin = 80;
        this.active.push({
            ...type,
            x:          margin + Math.random() * (canvas.width - margin * 2),
            y:          120 + Math.random() * (canvas.height - 250),
            radius:     22,
            collected:  false,
            floatTimer: Math.random() * Math.PI * 2,
            floatY:     0,
            pulse:      0
        });
    },

    _checkCollect(player, ball, canvas) {
        this.active.forEach(pu => {
            if (pu.collected) return;
            const dx   = player.x - pu.x;
            const dy   = player.y - pu.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.radius + pu.radius) {
                pu.collected = true;
                this._apply(pu, player, ball);
                UI.addNotif(`${player.name} ramasse ${pu.icon} ${pu.name} !`);
            }
        });
    },

    _apply(pu, player, ball) {
        switch (pu.id) {
            case 'double_speed':
                player.speedMult = 2;
                setTimeout(() => { player.speedMult = 1; }, pu.duration);
                break;

            case 'explosive_shot':
                player.explosiveShot = true;
                setTimeout(() => { player.explosiveShot = false; }, pu.duration);
                break;

            case 'shield':
                player.shield      = true;
                player.shieldTimer = pu.duration / (1000 / 60);
                setTimeout(() => { player.shield = false; }, pu.duration);
                break;

            case 'clone':
                player.cloneActive = true;
                player.clone = {
                    x:      player.x + (player.facingRight ? -90 : 90),
                    y:      player.y,
                    radius: player.radius,
                    alpha:  0.45,
                    timer:  pu.duration / (1000 / 60)
                };
                break;

            case 'big_ball':
                ball.radius = 32;
                setTimeout(() => { ball.radius = 18; }, pu.duration);
                break;

            case 'stamina_full':
                player.stamina = player.maxStamina;
                break;

            case 'ultimate_boost':
                player.ultimate = Math.min(100, player.ultimate + 50);
                break;
        }
    },

    // Appelé lors d'un but → nettoyage
    onGoal() {
        this.active = [];
        this.spawnTimer = 0;
    }
};
