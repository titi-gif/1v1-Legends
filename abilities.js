// ============================================
//  abilities.js - Capacités spéciales & ultimes
// ============================================

const Abilities = {

    // --- Active une capacité ---
    use(ability, caster, target, ball, canvas) {
        if (caster.abilityCooldowns[ability.id] > 0) return false;
        if (caster.stamina < 20) {
            return false;
        }

        caster.stamina -= 20;
        caster.abilityCooldowns[ability.id] = ability.cooldown * 60; // frames

        switch (ability.id) {
            case 'dash':        this._dash(caster);                break;
            case 'spin':        this._spin(caster, ball);          break;
            case 'powershot':   this._powershot(caster, ball);     break;
            case 'magnet':      this._magnet(caster, ball);        break;
            case 'freeze':      this._freeze(target);              break;
            case 'charge':      this._charge(caster, target);      break;
            case 'precision':   this._precision(caster, ball);     break;
            case 'clone':       this._clone(caster, canvas);       break;
        }

        UI.addNotif(`${caster.name} → ${ability.name} ${ability.icon}`);
        return true;
    },

    // --- Active l'ultime ---
    useUltimate(player, target, ball, canvas) {
        if (player.ultimate < 100) {
            return false;
        }
        if (player.ultimateCooldown > 0) return false;

        player.ultimate        = 0;
        player.ultimateCooldown = 600; // 10s avant recharge
        const ult = player.character.ultimate;

        // Effet visuel
        player.ultActive    = true;
        player.ultTimer     = 0;
        player.glowing      = true;

        switch (ult.id) {
            case 'speed_zone':  this._ult_speedzone(player);          break;
            case 'fortress':    this._ult_fortress(player);           break;
            case 'laser':       this._ult_laser(player, ball);        break;
            case 'timeslow':    this._ult_timeslow(player, target);   break;
            case 'megastrike':  this._ult_megastrike(player, ball);   break;
            case 'teleport':    this._ult_teleport(player, target);   break;
        }

        UI.addNotif(`🌟 ULTIME ! ${player.name} → ${ult.name} ${ult.icon}`);
        return true;
    },

    // ==========================================
    //  CAPACITÉS
    // ==========================================

    _dash(player) {
        const dir    = player.facingRight ? 1 : -1;
        player.vx   += dir * 18;
        player.vy   -= 3;
        player.dashing      = true;
        player.dashTimer    = 12;
        player.invincible   = true;
        setTimeout(() => {
            player.dashing    = false;
            player.invincible = false;
        }, 200);
    },

    _spin(player, ball) {
        const dx   = ball.x - player.x;
        const dy   = ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
            Physics.spinShoot(ball, player, 14);
            player.vy -= 5;
        } else {
        }
    },

    _powershot(player, ball) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 150) {
            Physics.powerShoot(ball, player, 16);
            ball.glowing = true;
            setTimeout(() => { ball.glowing = false; }, 1500);
        } else {
        }
    },

    _magnet(player, ball) {
        player.magnetActive = true;
        player.magnetTimer  = 120; // 2 secondes
        UI.addNotif(`🧲 Aimant actif !`);
    },

    _freeze(target) {
        if (target.frozen) return;
        target.frozen      = true;
        target.frozenTimer = 180; // 3 secondes
        target.speedMult   = 0.3;
        UI.addNotif(`🧊 ${target.name} est Freeze !`);
        setTimeout(() => {
            target.frozen    = false;
            target.speedMult = 1;
        }, 3000);
    },

    _charge(player, target) {
        const dir  = player.facingRight ? 1 : -1;
        player.vx  = dir * 22;
        player.charging    = true;
        player.chargeTimer = 20;

        // Si touche l'adversaire → recul
        setTimeout(() => {
            const dx   = target.x - player.x;
            const dist = Math.abs(dx);
            if (dist < 100) {
                target.vx     = dir * 15;
                target.vy     = -8;
                target.stunned = true;
                target.stunTimer = 60;
                setTimeout(() => { target.stunned = false; }, 1000);
                UI.addNotif(`💪 ${player.name} charge ${target.name} !`);
            }
            player.charging = false;
        }, 330);
    },

    _precision(player, ball) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 180) {
            Physics.laserShoot(ball, player, 14);
            ball.laser = true;
            setTimeout(() => { ball.laser = false; }, 1000);
        } else {
        }
    },

    _clone(player, canvas) {
        player.cloneActive = true;
        player.clone = {
            x:      player.x + (player.facingRight ? -80 : 80),
            y:      player.y,
            radius: player.radius,
            alpha:  0.4,
            timer:  300 // 5s
        };
        UI.addNotif(`👤 Clone créé !`);
    },

    // ==========================================
    //  ULTIMES
    // ==========================================

    _ult_speedzone(player) {
        const originalSpeed = player.maxSpeed;
        player.speedMult    = 3;
        player.maxSpeed     *= 3;
        player.ultEffect    = 'speed_zone';

        UI.addNotif(`⚡ ZONE DE VITESSE x3 !`);
        setTimeout(() => {
            player.speedMult = 1;
            player.maxSpeed  = originalSpeed;
            player.glowing   = false;
            player.ultEffect = null;
        }, 5000);
    },

    _ult_fortress(player) {
        player.invincible    = true;
        player.powerMult     = 2;
        player.ultEffect     = 'fortress';
        UI.addNotif(`🏰 FORTERESSE ! Invincible + Power x2 !`);
        setTimeout(() => {
            player.invincible = false;
            player.powerMult  = 1;
            player.glowing    = false;
            player.ultEffect  = null;
        }, 4000);
    },

    _ult_laser(player, ball) {
        Physics.laserShoot(ball, player, 25);
        ball.laser     = true;
        ball.glowing   = true;
        ball.maxSpeed  = 50;
        UI.addNotif(`🔦 LASER SHOT ! Irrésistible !`);
        setTimeout(() => {
            ball.laser    = false;
            ball.glowing  = false;
            ball.maxSpeed = 20;
        }, 2000);
        player.glowing   = false;
        player.ultEffect = null;
    },

    _ult_timeslow(player, target) {
        target.speedMult   = 0.2;
        target.frozen      = true;
        target.frozenTimer = 300;
        player.ultEffect   = 'timeslow';
        UI.addNotif(`⏳ SLOW MOTION ! Adversaire à 20% de vitesse !`);
        setTimeout(() => {
            target.speedMult = 1;
            target.frozen    = false;
            player.glowing   = false;
            player.ultEffect = null;
        }, 5000);
    },

    _ult_megastrike(player, ball) {
        Physics.powerShoot(ball, player, 28);
        ball.mega     = true;
        ball.glowing  = true;
        ball.maxSpeed = 60;
        // Explosion visuelle
        player.ultEffect = 'megastrike';
        UI.addNotif(`🌋 MEGA FRAPPE ! Impossible à arrêter !`);
        setTimeout(() => {
            ball.mega     = false;
            ball.glowing  = false;
            ball.maxSpeed = 20;
            player.glowing   = false;
            player.ultEffect = null;
        }, 2500);
    },

    _ult_teleport(player, target) {
        // Téléporte derrière l'adversaire
        const offset     = target.facingRight ? -80 : 80;
        player.x         = target.x + offset;
        player.y         = target.y;
        player.vx        = 0;
        player.vy        = 0;
        player.ultEffect = 'teleport';
        UI.addNotif(`🌀 TÉLÉPORTATION ! Derrière l'adversaire !`);
        setTimeout(() => {
            player.glowing   = false;
            player.ultEffect = null;
        }, 500);
    },

    // --- Met à jour les cooldowns chaque frame ---
    updateCooldowns(player) {
        const cds = player.abilityCooldowns;
        for (const key in cds) {
            if (cds[key] > 0) cds[key]--;
        }
        if (player.magnetActive) {
            player.magnetTimer--;
            if (player.magnetTimer <= 0) player.magnetActive = false;
        }
        if (player.cloneActive && player.clone) {
            player.clone.timer--;
            if (player.clone.timer <= 0) {
                player.cloneActive = false;
                player.clone       = null;
            }
        }
        if (player.dashTimer > 0) player.dashTimer--;
        if (player.stunTimer > 0) player.stunTimer--;
        if (player.frozenTimer > 0) player.frozenTimer--;
        if (player.ultimateCooldown > 0) player.ultimateCooldown--;
    },

    // --- Retourne les pourcentages de cooldown pour l'UI ---
    getCooldownPercents(player) {
        const abs = player.character.abilities;
        return abs.map(a => {
            const cd    = player.abilityCooldowns[a.id] || 0;
            const max   = a.cooldown * 60;
            return cd / max;
        });
    }
};
