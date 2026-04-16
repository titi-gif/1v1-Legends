// ============================================
//  player.js - Création et logique des joueurs
// ============================================

const Player = {

    // --- Crée un joueur ---
    create(index, character, canvas) {
        const isP1  = index === 1;
        const baseX = isP1
            ? canvas.width * 0.25
            : canvas.width * 0.75;

        return {
            id:          index,
            name:        isP1 ? 'Joueur 1' : 'Joueur 2',
            character:   character,
            color:       character.color,
            emoji:       character.emoji,

            x:           baseX,
            y:           canvas.height - 120,
            vx:          0,
            vy:          0,
            radius:      26,

            facingRight: isP1,

            onGround:    true,
            jumpsLeft:   2,

            baseSpeed:   3 + character.stats.speed * 0.4,
            maxSpeed:    12,
            speedMult:   1,
            zoneMult:    1,

            stamina:      100,
            maxStamina:   100 + character.stats.stamina * 5,
            staminaRegen: 0.3 + character.stats.stamina * 0.02,

            ultimate:         0,
            ultChargeRate:    0.08,
            ultimateCooldown: 0,

            abilityCooldowns: Object.fromEntries(
                character.abilities.map(a => [a.id, 0])
            ),

            frozen:       false,
            frozenTimer:  0,
            stunned:      false,
            stunTimer:    0,
            dashing:      false,
            dashTimer:    0,
            charging:     false,
            invincible:   false,
            shield:       false,
            shieldTimer:  0,
            magnetActive: false,
            magnetTimer:  0,
            cloneActive:  false,
            clone:        null,
            activeZone:   null,
            precisionMode:false,
            explosiveShot:false,
            glowing:      false,
            ultActive:    false,
            ultEffect:    null,

            powerMult:    1 + character.stats.power * 0.08,
            jumpForce:   -11 - character.stats.speed * 0.2,
            shootPower:   10 + character.stats.power * 0.8,
        };
    },

    // --- Mise à jour physique du joueur ---
    update(player, keys, canvas) {
        if (player.stunned) {
            player.stunTimer--;
            if (player.stunTimer <= 0) player.stunned = false;
            // Pas de gravité, juste clamp
            this._clampPosition(player, canvas);
            return;
        }

        if (player.frozen) {
            player.frozenTimer--;
            if (player.frozenTimer <= 0) player.frozen = false;
        }

        const spd = player.baseSpeed
            * player.speedMult
            * player.zoneMult
            * (player.frozen ? 0.3 : 1);

        // Mouvement horizontal
        if (keys.left && !player.frozen) {
            player.vx          = -spd;
            player.facingRight = false;
        } else if (keys.right && !player.frozen) {
            player.vx          = spd;
            player.facingRight = true;
        } else {
            player.vx *= 0.8;
        }

        // Mouvement vertical (haut/bas sans gravité)
        if (keys.up && !player.frozen) {
            player.vy = -spd;
        } else if (keys.down && !player.frozen) {
            player.vy = spd;
        } else {
            player.vy *= 0.8;
        }

        // Stamina
        if ((keys.left || keys.right || keys.up || keys.down)) {
            player.stamina -= 0.15;
        } else {
            player.stamina = Math.min(
                player.maxStamina,
                player.stamina + player.staminaRegen
            );
        }
        player.stamina = Math.max(0, player.stamina);

        // Charge ultime
        if (player.ultimate < 100) {
            player.ultimate = Math.min(100, player.ultimate + player.ultChargeRate);
        }

        // Bouclier timer
        if (player.shield && player.shieldTimer > 0) {
            player.shieldTimer--;
            if (player.shieldTimer <= 0) player.shield = false;
        }

        // Appliquer le mouvement
        player.x += player.vx;
        player.y += player.vy;

        this._clampPosition(player, canvas);
    },

    _clampPosition(player, canvas) {
        const margin = player.radius;
        if (player.x < margin)                player.x = margin;
        if (player.x > canvas.width - margin) player.x = canvas.width - margin;
        if (player.y < margin + 70)           player.y = margin + 70;
        if (player.y > canvas.height - 60 - margin) player.y = canvas.height - 60 - margin;
    },

    resetPosition(player, canvas) {
        const isP1  = player.id === 1;
        player.x    = isP1 ? canvas.width * 0.25 : canvas.width * 0.75;
        player.y    = canvas.height - 120;
        player.vx   = 0;
        player.vy   = 0;
        player.frozen    = false;
        player.stunned   = false;
        player.dashing   = false;
        player.speedMult = 1;
        player.zoneMult  = 1;
    },

    buildKeyMap() {
        return {
            p1: { left: false, right: false, up: false, down: false, ability1: false, ability2: false, ultimate: false, shoot: false },
            p2: { left: false, right: false, up: false, down: false, ability1: false, ability2: false, ultimate: false, shoot: false }
        };
    },

    KEYS_P1: {
        left:     'KeyQ',
        right:    'KeyD',
        up:       'KeyZ',
        down:     'KeyS',
        shoot:    'KeyF',
        ability1: 'KeyG',
        ability2: 'KeyH',
        ultimate: 'KeyT'
    },

    KEYS_P2: {
        left:     'ArrowLeft',
        right:    'ArrowRight',
        up:       'ArrowUp',
        down:     'ArrowDown',
        shoot:    'KeyL',
        ability1: 'KeyM',
        ability2: 'Semicolon',
        ultimate: 'KeyP'
    },

    handleKeyDown(e, keys, mode) {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
            e.preventDefault();
        }

        if (mode !== 'online' || Network.isHost) {
            if (e.key === 'q' || e.key === 'Q') keys.p1.left     = true;
            if (e.code === 'KeyD')              keys.p1.right    = true;
            if (e.key === 'z' || e.key === 'Z') keys.p1.up       = true;
            if (e.code === 'KeyS')              keys.p1.down     = true;
            if (e.code === 'KeyF')              keys.p1.shoot    = true;
            if (e.code === 'KeyG')              keys.p1.ability1 = true;
            if (e.code === 'KeyH')              keys.p1.ability2 = true;
            if (e.code === 'KeyT')              keys.p1.ultimate = true;
        }

        if (mode === 'local') {
            if (e.code === 'ArrowLeft')  keys.p2.left     = true;
            if (e.code === 'ArrowRight') keys.p2.right    = true;
            if (e.code === 'ArrowUp')    keys.p2.up       = true;
            if (e.code === 'ArrowDown')  keys.p2.down     = true;
            if (e.code === 'KeyL')       keys.p2.shoot    = true;
            if (e.code === 'KeyM')       keys.p2.ability1 = true;
            if (e.code === 'Semicolon')  keys.p2.ability2 = true;
            if (e.code === 'KeyP')       keys.p2.ultimate = true;
        } else if (mode === 'online' && !Network.isHost) {
            if (e.key === 'q' || e.key === 'Q') keys.p2.left     = true;
            if (e.code === 'KeyD')              keys.p2.right    = true;
            if (e.key === 'z' || e.key === 'Z') keys.p2.up       = true;
            if (e.code === 'KeyS')              keys.p2.down     = true;
            if (e.code === 'KeyF')              keys.p2.shoot    = true;
            if (e.code === 'KeyG')              keys.p2.ability1 = true;
            if (e.code === 'KeyH')              keys.p2.ability2 = true;
            if (e.code === 'KeyT')              keys.p2.ultimate = true;
        }
    },

    handleKeyUp(e, keys, mode) {
        if (mode !== 'online' || Network.isHost) {
            if (e.key === 'q' || e.key === 'Q') keys.p1.left     = false;
            if (e.code === 'KeyD')              keys.p1.right    = false;
            if (e.key === 'z' || e.key === 'Z') keys.p1.up       = false;
            if (e.code === 'KeyS')              keys.p1.down     = false;
            if (e.code === 'KeyF')              keys.p1.shoot    = false;
            if (e.code === 'KeyG')              keys.p1.ability1 = false;
            if (e.code === 'KeyH')              keys.p1.ability2 = false;
            if (e.code === 'KeyT')              keys.p1.ultimate = false;
        }

        if (mode === 'local') {
            if (e.code === 'ArrowLeft')  keys.p2.left     = false;
            if (e.code === 'ArrowRight') keys.p2.right    = false;
            if (e.code === 'ArrowUp')    keys.p2.up       = false;
            if (e.code === 'ArrowDown')  keys.p2.down     = false;
            if (e.code === 'KeyL')       keys.p2.shoot    = false;
            if (e.code === 'KeyM')       keys.p2.ability1 = false;
            if (e.code === 'Semicolon')  keys.p2.ability2 = false;
            if (e.code === 'KeyP')       keys.p2.ultimate = false;
        } else if (mode === 'online' && !Network.isHost) {
            if (e.key === 'q' || e.key === 'Q') keys.p2.left     = false;
            if (e.code === 'KeyD')              keys.p2.right    = false;
            if (e.key === 'z' || e.key === 'Z') keys.p2.up       = false;
            if (e.code === 'KeyS')              keys.p2.down     = false;
            if (e.code === 'KeyF')              keys.p2.shoot    = false;
            if (e.code === 'KeyG')              keys.p2.ability1 = false;
            if (e.code === 'KeyH')              keys.p2.ability2 = false;
            if (e.code === 'KeyT')              keys.p2.ultimate = false;
        }
    },



}
