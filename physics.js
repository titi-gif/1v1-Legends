// ============================================
//  physics.js - Physique balle et collisions
// ============================================

const Physics = {

    GRAVITY: 0.3,
    FRICTION: 0.985,
    BALL_BOUNCE: 0.75,
    PLAYER_BOUNCE: 0.6,

    // --- Met à jour la balle ---
    updateBall(ball, canvas) {
        // Gravité
        GRAVITY: 0

        // Friction air
        ball.vx *= this.FRICTION;
        ball.vy *= this.FRICTION;

        // Effet spin
        if (ball.spin !== 0) {
            ball.vx += ball.spin * 0.08;
            ball.spin *= 0.95;
        }

        // Déplacement
        ball.x += ball.vx;
        ball.y += ball.vy;

        const ground = canvas.height - 60;
        const goalTop    = canvas.height / 2 - 80;
        const goalBottom = canvas.height / 2 + 80;

        // Rebond sol
        if (ball.y + ball.radius >= ground) {
            ball.y = ground - ball.radius;
            ball.vy *= -this.BALL_BOUNCE;
            ball.vx *= 0.92;
            if (Math.abs(ball.vy) < 1) ball.vy = 0;
        }

        // Rebond plafond
        if (ball.y - ball.radius <= 70) {
            ball.y = 70 + ball.radius;
            ball.vy *= -this.BALL_BOUNCE;
        }

        // Mur gauche
        if (ball.x - ball.radius <= 0) {
            if (ball.y > goalTop && ball.y < goalBottom) {
                return 'goal_p2';
            }
            ball.x = ball.radius;
            ball.vx *= -this.BALL_BOUNCE;
        }

        // Mur droit
        if (ball.x + ball.radius >= canvas.width) {
            if (ball.y > goalTop && ball.y < goalBottom) {
                return 'goal_p1';
            }
            ball.x = canvas.width - ball.radius;
            ball.vx *= -this.BALL_BOUNCE;
        }

        return null;
    },

    // --- Collision balle / joueur ---
    ballPlayerCollision(ball, player) {
        const dx   = ball.x - player.x;
        const dy   = ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + player.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            // Séparation
            const overlap = minDist - dist;
            ball.x += nx * overlap * 0.8;
            ball.y += ny * overlap * 0.8;

            // Impulsion
            const relVx  = ball.vx - player.vx;
            const relVy  = ball.vy - player.vy;
            const dot    = relVx * nx + relVy * ny;

            if (dot < 0) {
                const impulse = dot * (1 + this.PLAYER_BOUNCE);
                ball.vx -= impulse * nx;
                ball.vy -= impulse * ny;

                // Vélocité du joueur transmise
                ball.vx += player.vx * 0.5;
                ball.vy += player.vy * 0.5;

                // Clamp vitesse max balle
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed > ball.maxSpeed) {
                    ball.vx = (ball.vx / speed) * ball.maxSpeed;
                    ball.vy = (ball.vy / speed) * ball.maxSpeed;
                }

                return true; // collision détectée
            }
        }
        return false;
    },

    // --- Collision joueur / joueur ---
    playerPlayerCollision(p1, p2) {
        const dx   = p2.x - p1.x;
        const dy   = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = (minDist - dist) / 2;
            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;

            // Échange de vélocité (simplifié)
            const p1vn = p1.vx * nx + p1.vy * ny;
            const p2vn = p2.vx * nx + p2.vy * ny;

            p1.vx += (p2vn - p1vn) * nx * 0.5;
            p1.vy += (p2vn - p1vn) * ny * 0.5;
            p2.vx += (p1vn - p2vn) * nx * 0.5;
            p2.vy += (p1vn - p2vn) * ny * 0.5;
        }
    },

    // --- Applique une zone sur la balle ---
    applyZoneToBall(ball, zone) {
        switch (zone.type) {
            case 'boost':
                ball.vx *= 1.015;
                ball.vy *= 1.015;
                break;
            case 'slow':
                ball.vx *= 0.97;
                ball.vy *= 0.97;
                break;
        }
    },

    // --- Tir normal ---
    shoot(ball, player, power) {
        const dir  = player.facingRight ? 1 : -1;
        ball.vx    = dir * power * 0.9;
        ball.vy    = -power * 0.5;
        ball.spin  = 0;
    },

    // --- Tir puissant ---
    powerShoot(ball, player, power) {
        const dir  = player.facingRight ? 1 : -1;
        ball.vx    = dir * power * 1.5;
        ball.vy    = -power * 0.7 + (Math.random() - 0.5) * 4;
        ball.spin  = (Math.random() - 0.5) * 6;
        ball.maxSpeed = 30;
        setTimeout(() => { ball.maxSpeed = 20; }, 2000);
    },

    // --- Tir spin ---
    spinShoot(ball, player, power) {
        const dir  = player.facingRight ? 1 : -1;
        ball.vx    = dir * power;
        ball.vy    = -power * 0.4;
        ball.spin  = dir * 5;
    },

    // --- Tir laser (précision max) ---
    laserShoot(ball, player, power) {
        const dir  = player.facingRight ? 1 : -1;
        ball.vx    = dir * power * 2;
        ball.vy    = -1;
        ball.spin  = 0;
        ball.maxSpeed = 40;
        setTimeout(() => { ball.maxSpeed = 20; }, 1500);
    },

    // --- Aimant : attire la balle ---
    magnetPull(ball, player, strength) {
        const dx   = player.x - ball.x;
        const dy   = player.y - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
            ball.vx += (dx / dist) * strength;
            ball.vy += (dy / dist) * strength;
        }
    },

    // --- Crée un objet balle ---
    createBall(canvas) {
        return {
            x:        canvas.width / 2,
            y:        canvas.height / 2 - 50,
            vx:       (Math.random() - 0.5) * 4,
            vy:       -3,
            radius:   18,
            spin:     0,
            maxSpeed: 20,
            trail:    [],
            glowing:  false,
            frozenTimer: 0
        };
    },

    // --- Reset balle au centre ---
    resetBall(ball, canvas) {
        ball.x        = canvas.width / 2;
        ball.y        = canvas.height / 2 - 50;
        ball.vx       = (Math.random() - 0.5) * 3;
        ball.vy       = -2;
        ball.spin     = 0;
        ball.maxSpeed = 20;
        ball.glowing  = false;
        ball.trail    = [];
    },

    // --- Trail de la balle ---
    updateTrail(ball) {
        ball.trail.unshift({ x: ball.x, y: ball.y });
        if (ball.trail.length > 12) ball.trail.pop();
    }
};
