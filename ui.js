// ============================================
//  ui.js - Interface, HUD, Notifications
// ============================================

const UI = {

    toastQueue:   [],
    toastActive:  false,
    notifList:    [],
    pingMs:       0,

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s =>
            s.classList.remove('active')
        );
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    },

    showToast(msg, duration = 2500) {
        this.toastQueue.push({ msg, duration });
        if (!this.toastActive) this._nextToast();
    },

    _nextToast() {
        if (!this.toastQueue.length) {
            this.toastActive = false;
            return;
        }
        this.toastActive  = true;
        const { msg, duration } = this.toastQueue.shift();
        let el = document.getElementById('toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.className   = 'toast show';
        setTimeout(() => {
            el.className = 'toast';
            setTimeout(() => this._nextToast(), 400);
        }, duration);
    },

    showStatus(text) {
        let el = document.getElementById('connection-status');
        if (!el) return;
        el.classList.remove('hidden');
        const txt = el.querySelector('#status-text');
        if (txt) txt.textContent = text;
    },

    hideStatus() {
        const el = document.getElementById('connection-status');
        if (el) el.classList.add('hidden');
    },

    // ==========================================
    //  NOTIFICATIONS EN JEU — disparaît après 2s
    // ==========================================
    addNotif(text) {
        const container = document.getElementById('notif-container');
        if (!container) return;

        const el       = document.createElement('div');
        el.className   = 'notif-item';
        el.textContent = text;
        container.appendChild(el);

        // Disparaît après 2 secondes
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s, transform 0.4s';
            el.style.opacity    = '0';
            el.style.transform  = 'translateX(20px)';
            setTimeout(() => el.remove(), 400);
        }, 2000); // ← 2000ms = 2 secondes

        // Max 5 notifs
        const items = container.querySelectorAll('.notif-item');
        if (items.length > 5) items[0].remove();
    },

    updateHUD(state) {
        if (!state) return;
        this._updateScore(state.scores);
        this._updateTimer(state.timer);
        this._updatePlayerHUD(state.p1, 1);
        this._updatePlayerHUD(state.p2, 2);
    },

    _updateScore(scores) {
        const s1 = document.getElementById('score-p1');
        const s2 = document.getElementById('score-p2');
        if (s1) s1.textContent = scores.p1;
        if (s2) s2.textContent = scores.p2;
    },

    _updateTimer(frames) {
        const el = document.getElementById('hud-timer');
        if (!el) return;
        const secs    = Math.max(0, Math.floor(frames / 60));
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        el.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (secs <= 10) el.style.color = '#ef4444';
        else            el.style.color = '#fff';
    },

    _updatePlayerHUD(player, num) {
        if (!player) return;

        const stBar = document.getElementById(`stamina-bar-p${num}`);
        if (stBar) {
            const pct = (player.stamina / player.maxStamina) * 100;
            stBar.style.width = `${pct}%`;
            stBar.style.background = pct > 50 ? '#10b981' : pct > 25 ? '#f59e0b' : '#ef4444';
        }

        const ultBar = document.getElementById(`ult-bar-p${num}`);
        if (ultBar) {
            ultBar.style.width = `${player.ultimate}%`;
            if (player.ultimate >= 100) {
                ultBar.style.animation = 'pulse 0.5s infinite';
            } else {
                ultBar.style.animation = 'none';
            }
        }

        const abs = player.character?.abilities || [];
        abs.forEach((ab, i) => {
            const btn = document.getElementById(`ability-btn-p${num}-${i}`);
            if (!btn) return;
            const cd  = player.abilityCooldowns?.[ab.id] || 0;
            const max = ab.cooldown * 60;
            const pct = Math.max(0, (cd / max) * 100);
            const overlay = btn.querySelector('.cd-overlay');
            if (overlay) overlay.style.height = `${pct}%`;
            btn.classList.toggle('ready', cd === 0);
        });
    },

    showGoalOverlay(scorer) {
        const el = document.getElementById('goal-overlay');
        if (!el) return;
        el.querySelector('.goal-text').textContent = '⚽ GOAL !';
        el.querySelector('.goal-scorer').textContent = `Marqué par ${scorer}`;
        el.classList.remove('hidden');
        el.classList.add('show');
        setTimeout(() => {
            el.classList.remove('show');
            el.classList.add('hidden');
        }, 2000);
    },

    showEndScreen(winner, scores) {
        const el = document.getElementById('end-screen');
        if (!el) return;
        el.querySelector('.winner-text').textContent =
            winner === 'draw' ? '🤝 Égalité !' : `🏆 ${winner} gagne !`;
        el.querySelector('.final-score').textContent =
            `${scores.p1} - ${scores.p2}`;
        el.classList.remove('hidden');
        el.classList.add('show');
    },

    updatePing(ms) {
        this.pingMs = ms;
        const el    = document.getElementById('ping-display');
        if (!el) return;
        el.textContent = `${ms}ms`;
        el.style.color = ms < 80 ? '#10b981' : ms < 150 ? '#f59e0b' : '#ef4444';
    },

    showPause() {
        const el = document.getElementById('pause-overlay');
        if (el) el.classList.remove('hidden');
    },

    hidePause() {
        const el = document.getElementById('pause-overlay');
        if (el) el.classList.add('hidden');
    },

    updateCharPreview(char, playerNum) {
        const el = document.getElementById(`preview-p${playerNum}`);
        if (!el) return;
        el.innerHTML = `
            <div class="preview-emoji">${char.emoji}</div>
            <div class="preview-name">${char.name}</div>
            <div class="preview-ult">🌟 ${char.ultimate.name}</div>
        `;
    },

    renderControls() {
        return `
            <div class="controls-grid">
                <div class="control-col">
                    <h4>🎮 Joueur 1</h4>
                    <p>Q / D → Gauche / Droite</p>
                    <p>Z / S → Haut / Bas</p>
                    <p>G → Capacité 1</p>
                    <p>H → Capacité 2</p>
                    <p>T → ULTIME</p>
                    <p>Shift Gauche → Sprint</p>
                </div>
                <div class="control-col">
                    <h4>🎮 Joueur 2</h4>
                    <p>← / → → Gauche / Droite</p>
                    <p>↑ / ↓ → Haut / Bas</p>
                    <p>M → Capacité 1</p>
                    <p>; → Capacité 2</p>
                    <p>P → ULTIME</p>
                    <p>Shift Droit → Sprint</p>
                </div>
            </div>
        `;
    },

    updateConnectionStatus(connected) {
        const el = document.getElementById('online-status');
        if (!el) return;
        if (connected) {
            el.textContent = '✅ Connecté !';
            el.style.color = '#10b981';
        } else {
            el.textContent = '🔌 Non connecté';
            el.style.color = '#ef4444';
        }
    }
};
