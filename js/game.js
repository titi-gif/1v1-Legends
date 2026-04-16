// ============================================
//  game.js - Boucle principale du jeu
// ============================================

const GameLoop = {

    state:      null,
    keys:       null,
    running:    false,
    paused:     false,
    mode:       null,
    rafId:      null,
    frameCount: 0,
    syncTimer:  0,

    MATCH_DURATION: 60 * 60 * 3,
    WIN_SCORE:      5,

    start(mode, p1CharData, p2CharData) {
        this.mode       = mode;
        this.running    = true;
        this.paused     = false;
        this.frameCount = 0;
        this.syncTimer  = 0;

        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }

        UI.showScreen('screen-game');

        const canvas = document.getElementById('gameCanvas');
        if (!canvas) { console.error('[GameLoop] Canvas introuvable !'); return; }

        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        Renderer.init(canvas);
        Zones.init(canvas);
        Powerups.reset();

        const p1id = (typeof p1CharData === 'object') ? p1CharData.id : p1CharData;
        const p2id = (typeof p2CharData === 'object') ? p2CharData.id : p2CharData;

        const p1   = Characters.createPlayer(p1id, 1, canvas);
        const p2   = Characters.createPlayer(p2id, 2, canvas);
        const ball = Physics.createBall(canvas);

        this.state = {
            p1, p2, ball,
            scores:    { p1: 0, p2: 0 },
            timer:     this.MATCH_DURATION,
            zones:     Zones.active,
            powerups:  Powerups.active,
            goalFlash: 0,
            slowMo:    false,
            paused:    false
        };

        this.state.countdown = null;

        this.keys = Player.buildKeyMap();
        this._bindKeys();

        if (mode === 'online') Network.startPing();

        this.paused = true;
        this._startCountdown();
        this._loop();
    },

    _loop() {
        if (!this.running) return;
        this.rafId = requestAnimationFrame(() => this._loop());

        const { state, keys } = this;
        const canvas = Renderer.canvas;

        // Toujours dessiner même en pause (pour afficher le décompte)
        if (this.paused) {
            if (state) Renderer.draw(state);
            return;
        }

        this.frameCount++;

        // 1. DÉPLACEMENT
        if (this.mode === 'online') {
            if (Network.isHost) {
                Player.update(state.p1, keys.p1, canvas);
                if (state.p2._remoteKeys) {
                    Player.update(state.p2, state.p2._remoteKeys, canvas);
                }
                if (this.frameCount % 2 === 0) {
                    Network.send({
                        type:    'state',
                        p1:      { x: state.p1.x, y: state.p1.y, vx: state.p1.vx, vy: state.p1.vy },
                        p2:      { x: state.p2.x, y: state.p2.y, vx: state.p2.vx, vy: state.p2.vy },
                        ball:    { x: state.ball.x, y: state.ball.y, vx: state.ball.vx, vy: state.ball.vy },
                        scores:  state.scores,
                        timer:   state.timer,
                        canvasW: canvas.width,
                        canvasH: canvas.height
                    });
                }
            } else {
                Network.sendInputs(keys);
            }
        } else {
            // Mode local
            Player.update(state.p1, keys.p1, canvas);
            Player.update(state.p2, keys.p2, canvas);
        }

        // 2. AIMANT
        if (state.p1.magnetActive) Physics.magnetPull(state.ball, state.p1, 1.5);
        if (state.p2.magnetActive) Physics.magnetPull(state.ball, state.p2, 1.5);

        // 3. PHYSIQUE BALLE
        Physics.updateTrail(state.ball);
        let goalResult = null;
        if (this.mode === 'local' || Network.isHost) {
            goalResult = Physics.updateBall(state.ball, canvas);
            Physics.ballPlayerCollision(state.ball, state.p1);
            Physics.ballPlayerCollision(state.ball, state.p2);
            Physics.playerPlayerCollision(state.p1, state.p2);
        }

        // 4. ZONES
        Zones.update();
        Zones.applyToPlayer(state.p1);
        Zones.applyToPlayer(state.p2);
        Zones.applyToBall(state.ball);

        // 5. POWER-UPS
        const boostBefore = {
            p1: { ...state.p1 },
            p2: { ...state.p2 }
        };
        Powerups.update(canvas, state.p1, state.p2, state.ball);

        if (this.mode === 'online' && Network.isHost) {
            if (state.p1.powerMult !== boostBefore.p1.powerMult ||
                state.p1.speedMult !== boostBefore.p1.speedMult ||
                state.p1.shieldActive !== boostBefore.p1.shieldActive) {
                Network.send({ type: 'notif', msg: `⚡ ${state.p1.name} a ramassé un boost !` });
            }
            if (state.p2.powerMult !== boostBefore.p2.powerMult ||
                state.p2.speedMult !== boostBefore.p2.speedMult ||
                state.p2.shieldActive !== boostBefore.p2.shieldActive) {
                Network.send({ type: 'notif', msg: `⚡ ${state.p2.name} a ramassé un boost !` });
            }
        }

        // 6. COOLDOWNS
        Abilities.updateCooldowns(state.p1);
        Abilities.updateCooldowns(state.p2);

        // 7. BUTS
        if (goalResult) {
            this.handleGoal(goalResult);
        }

        // 8. TIMER
        if (state.timer > 0) {
            state.timer--;
        } else {
            this._handleTimeUp();
        }

        // 9. EFFETS VISUELS
        if (state.goalFlash > 0) state.goalFlash -= 0.05;
        state.slowMo = (state.p1.ultEffect === 'timeslow' || state.p2.ultEffect === 'timeslow');

        // 10. RECHARGE ULTIME
        this._rechargeUltimate(state.p1);
        this._rechargeUltimate(state.p2);

        // 11. HUD
        UI.updateHUD(state);

        // 12. RENDU
        Renderer.draw(state);
    },

    handleGoal(result) {
        const state  = this.state;
        const canvas = Renderer.canvas;

        if (result === 'goal_p1') {
            state.scores.p1++;
            UI.showGoalOverlay(state.p1.name);
            UI.addNotif(`⚽ BUT pour ${state.p1.name} !`);
        } else if (result === 'goal_p2') {
            state.scores.p2++;
            UI.showGoalOverlay(state.p2.name);
            UI.addNotif(`⚽ BUT pour ${state.p2.name} !`);
        }

        state.goalFlash = 1;

        // ✅ Notifie immédiatement le guest du but
        if (this.mode === 'online' && Network.isHost) {
            Network.send({
                type:   'goal',
                scorer: result,
                scores: state.scores
            });
        }

        if (state.scores.p1 >= this.WIN_SCORE) { this.handleMatchEnd(state.p1.name); return; }
        if (state.scores.p2 >= this.WIN_SCORE) { this.handleMatchEnd(state.p2.name); return; }

        this.paused = true;
        setTimeout(() => {
            Physics.resetBall(state.ball, canvas);
            Player.resetPosition(state.p1, canvas);
            Player.resetPosition(state.p2, canvas);
            this._startCountdown();
        }, 1500);
    },

    _startCountdown() {
        let count = 3;
        this.state.countdown = count;

        // ✅ Envoie le countdown au guest
        if (this.mode === 'online' && Network.isHost) {
            Network.send({ type: 'countdown', value: count });
        }

        const interval = setInterval(() => {
            count--;
            if (count <= 0) {
                clearInterval(interval);
                this.state.countdown = null;
                this.paused = false;
                // ✅ Informe le guest que le jeu reprend
                if (this.mode === 'online' && Network.isHost) {
                    Network.send({ type: 'countdown', value: 0 });
                }
            } else {
                this.state.countdown = count;
                if (this.mode === 'online' && Network.isHost) {
                    Network.send({ type: 'countdown', value: count });
                }
            }
        }, 1000);
    },

    _handleTimeUp() {
        const { p1, p2, scores } = this.state;
        let winner = 'draw';
        if (scores.p1 > scores.p2) winner = p1.name;
        if (scores.p2 > scores.p1) winner = p2.name;
        this.handleMatchEnd(winner);
    },

    handleMatchEnd(winner) {
        this.stop();
        if (this.mode === 'online') {
            Network.stopPing();
            if (Network.isHost) {
                Network.send({ type: 'match_end', winner });
            }
        }
        setTimeout(() => {
            UI.showEndScreen(winner, this.state.scores);
        }, 500);
    },

    _rechargeUltimate(player) {
        if (player.ultimate < 100 && player.ultimateCooldown === 0) {
            player.ultimate = Math.min(100, player.ultimate + 0.12);
        }
    },

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) UI.showPause();
        else             UI.hidePause();
    },

    stop() {
        this.running = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup',   this._onKeyUp);
    },

    _bindKeys() {
        if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
        if (this._onKeyUp)   window.removeEventListener('keyup',   this._onKeyUp);

        this._onKeyDown = e => {
            if (e.code === 'Escape') { this.togglePause(); return; }

            Player.handleKeyDown(e, this.keys, this.mode);

            if (this.mode === 'local') {
                if (e.code === 'KeyF') this._handleShoot(this.state.p1);
                if (e.code === 'KeyG') this._handleAbility(this.state.p1, 0);
                if (e.code === 'KeyH') this._handleAbility(this.state.p1, 1);
                if (e.code === 'KeyT') this._handleUltimate(this.state.p1);
                if (e.code === 'KeyL')      this._handleShoot(this.state.p2);
                if (e.code === 'KeyM')      this._handleAbility(this.state.p2, 0);
                if (e.code === 'Semicolon') this._handleAbility(this.state.p2, 1);
                if (e.code === 'KeyP')      this._handleUltimate(this.state.p2);

            } else if (this.mode === 'online') {
                if (Network.isHost) {
                    if (e.code === 'KeyF') this._handleShoot(this.state.p1);
                    if (e.code === 'KeyG') this._handleAbility(this.state.p1, 0);
                    if (e.code === 'KeyH') this._handleAbility(this.state.p1, 1);
                    if (e.code === 'KeyT') this._handleUltimate(this.state.p1);
                } else {
                    if (e.code === 'KeyF') Network.send({ type: 'action', action: 'shoot' });
                    if (e.code === 'KeyG') Network.send({ type: 'action', action: 'ability', index: 0 });
                    if (e.code === 'KeyH') Network.send({ type: 'action', action: 'ability', index: 1 });
                    if (e.code === 'KeyT') Network.send({ type: 'action', action: 'ultimate' });
                }
            }
        };

        this._onKeyUp = e => {
            Player.handleKeyUp(e, this.keys, this.mode);
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup',   this._onKeyUp);
    },

    _handleShoot(player) {
        const { ball } = this.state;
        const power = 12 * (player.powerMult || 1);
        if (player.explosiveShot) {
            Physics.powerShoot(ball, player, power);
            player.explosiveShot = false;
        } else {
            Physics.shoot(ball, player, power);
        }
        player.stamina = Math.max(0, player.stamina - 10);
    },

    _handleAbility(player, index) {
        const ab = player.character?.abilities?.[index];
        if (!ab) return;
        const opponent = player.id === 1 ? this.state.p2 : this.state.p1;
        Abilities.use(ab, player, opponent, this.state.ball, Renderer.canvas);
    },

    _handleUltimate(player) {
        const opponent = player.id === 1 ? this.state.p2 : this.state.p1;
        Abilities.useUltimate(player, opponent, this.state.ball, Renderer.canvas);
    }
};
