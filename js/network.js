const Network = {
    peer:           null,
    conn:           null,
    isHost:         false,
    myRole:         null,
    roomCode:       null,
    pseudo:         'Joueur',
    opponentPseudo: '',

    init(callback) {
        const input = document.getElementById('pseudo-input');
        this.pseudo = input ? input.value.trim() || 'Joueur' : 'Joueur';

        this.peer = new Peer(undefined, {
            host:   '0.peerjs.com',
            port:   443,
            secure: true,
            debug:  1
        });

        this.peer.on('open', id => {
            console.log('[Network] Mon vrai ID PeerJS:', id);
            if (callback) callback(id);
        });

        this.peer.on('error', err => {
            console.error('[Network] Erreur:', err.type, err.message);
            UI.updateConnectionStatus(false);
        });

        this.peer.on('disconnected', () => {
            UI.updateConnectionStatus(false);
        });
    },

    createRoom() {
        if (this.peer) { this.peer.destroy(); this.peer = null; }

        this.isHost = true;
        this.myRole = 'host';

        this.init(realId => {
            this.roomCode = realId;

            const display = document.getElementById('room-code-display');
            const text    = document.getElementById('room-code-text');
            if (display) display.classList.remove('hidden');
            if (text)    text.textContent = realId;

            UI.updateConnectionStatus(false);

            this.peer.on('connection', conn => {
                console.log('[Network] Guest connecté !');
                this.conn = conn;

                conn.on('data', data => {
                    console.log('[Network] Data reçue:', data);
                    this.handleData(data);
                });

                conn.on('open', () => {
                    console.log('[Network] Conn open côté host');
                    UI.updateConnectionStatus(true);
                    this.send({ type: 'hello', pseudo: this.pseudo, role: 'host' });
                });

                if (conn.open) {
                    UI.updateConnectionStatus(true);
                    this.send({ type: 'hello', pseudo: this.pseudo, role: 'host' });
                }

                conn.on('close', () => { UI.updateConnectionStatus(false); });
                conn.on('error', err => {
                    console.error('[Network] Conn error:', err);
                    UI.updateConnectionStatus(false);
                });
            });
        });
    },

    copyCode() {
        const code = this.roomCode;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code)
                .catch(() => this._copyFallback(code));
        } else {
            this._copyFallback(code);
        }
    },

    _copyFallback(text) {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity  = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    },

    joinRoom() {
        const input = document.getElementById('join-code-input');
        let code    = input ? input.value.trim() : '';

        if (this.peer) { this.peer.destroy(); this.peer = null; }

        this.isHost = false;
        this.myRole = 'guest';

        this.init(myId => {
            console.log('[Network] Mon ID guest:', myId);
            console.log('[Network] Connexion vers:', code);

            const conn = this.peer.connect(code, {
                reliable:      true,
                serialization: 'json'
            });
            this.conn = conn;

            const timeout = setTimeout(() => {
                if (!conn.open) UI.updateConnectionStatus(false);
            }, 10000);

            conn.on('data', data => {
                console.log('[Network] Data reçue:', data);
                this.handleData(data);
            });

            conn.on('open', () => {
                clearTimeout(timeout);
                console.log('[Network] ✅ Connexion ouverte !');
                UI.updateConnectionStatus(true);
                this.send({ type: 'hello', pseudo: this.pseudo, role: 'guest' });
            });

            conn.on('close', () => { UI.updateConnectionStatus(false); });
            conn.on('error', err => {
                clearTimeout(timeout);
                console.error('[Network] Conn error:', err);
                UI.updateConnectionStatus(false);
            });
        });
    },

    handleData(data) {
        switch(data.type) {

            case 'notif':
                UI.addNotif(data.msg);
                break;

            case 'hello':
                this.opponentPseudo = data.pseudo;
                UI.updateConnectionStatus(true);
                setTimeout(() => { initCharacterSelect(); }, 600);
                break;

            case 'char-selected':
                if (Network.isHost) {
                    selectedChars.guest = data.char;
                    Network._checkOnlineBothReady();
                } else {
                    selectedChars.host = data.char;
                }
                break;

            case 'game-start':
                selectedChars.host  = data.hostChar;
                selectedChars.guest = data.guestChar;
                UI.showScreen('screen-game');
                GameLoop.start('online', data.hostChar, data.guestChar);
                break;

            case 'inputs':
                if (Network.isHost && GameLoop.state) {
                    GameLoop.state.p2._remoteKeys = data.keys;
                }
                break;

            case 'action':
                if (Network.isHost && GameLoop.state) {
                    const p2 = GameLoop.state.p2;
                    if (data.action === 'shoot')    GameLoop._handleShoot(p2);
                    if (data.action === 'ability')  GameLoop._handleAbility(p2, data.index);
                    if (data.action === 'ultimate') GameLoop._handleUltimate(p2);
                }
                break;

            // ✅ BUT : le guest reçoit le goal immédiatement
            case 'goal':
                if (!Network.isHost && GameLoop.state) {
                    const state = GameLoop.state;
                    state.scores  = data.scores;
                    state.goalFlash = 1;
                    GameLoop.paused = true;

                    if (data.scorer === 'goal_p1') {
                        UI.showGoalOverlay(state.p1.name);
                        UI.addNotif(`⚽ BUT pour ${state.p1.name} !`);
                    } else if (data.scorer === 'goal_p2') {
                        UI.showGoalOverlay(state.p2.name);
                        UI.addNotif(`⚽ BUT pour ${state.p2.name} !`);
                    }
                }
                break;

            // ✅ COUNTDOWN : le guest suit le décompte du host
            case 'countdown':
                if (!Network.isHost && GameLoop.state) {
                    if (data.value === 0) {
                        // Reprendre le jeu
                        GameLoop.state.countdown = null;
                        GameLoop.paused = false;
                    } else {
                        // Afficher le décompte
                        GameLoop.state.countdown = data.value;
                        GameLoop.paused = true;
                    }
                }
                break;

            case 'state':
                if (!Network.isHost && GameLoop.state) {
                    const canvas = Renderer.canvas;
                    const rx = canvas.width  / data.canvasW;
                    const ry = canvas.height / data.canvasH;

                    GameLoop.state.p1.x    = data.p1.x  * rx;
                    GameLoop.state.p1.y    = data.p1.y  * ry;
                    GameLoop.state.p1.vx   = data.p1.vx * rx;
                    GameLoop.state.p1.vy   = data.p1.vy * ry;

                    GameLoop.state.p2.x    = data.p2.x  * rx;
                    GameLoop.state.p2.y    = data.p2.y  * ry;
                    GameLoop.state.p2.vx   = data.p2.vx * rx;
                    GameLoop.state.p2.vy   = data.p2.vy * ry;

                    GameLoop.state.ball.x  = data.ball.x  * rx;
                    GameLoop.state.ball.y  = data.ball.y  * ry;
                    GameLoop.state.ball.vx = data.ball.vx * rx;
                    GameLoop.state.ball.vy = data.ball.vy * ry;

                    GameLoop.state.timer = data.timer;
                    // ⚠️ Les scores sont maintenant gérés via 'goal', on ne les réécrit plus ici
                }
                break;

            case 'match_end':
                if (!Network.isHost) {
                    GameLoop.stop();
                    setTimeout(() => {
                        UI.showEndScreen(data.winner, GameLoop.state?.scores);
                    }, 500);
                }
                break;

            case 'rematch':
                replayGame();
                break;

            case 'ping':
                this.send({ type: 'pong', t: data.t });
                break;

            case 'pong':
                UI.updatePing(Date.now() - data.t);
                break;
        }
    },

    _checkOnlineBothReady() {
        if (!Network.isHost) return;
        if (!selectedChars.host || !selectedChars.guest) return;

        console.log('[DEBUG] Lancement !', selectedChars.host.name, 'vs', selectedChars.guest.name);

        Network.send({
            type:      'game-start',
            hostChar:  selectedChars.host,
            guestChar: selectedChars.guest
        });

        UI.showScreen('screen-game');
        GameLoop.start('online', selectedChars.host, selectedChars.guest);
    },

    sendCharacterChoice(char) {
        this.send({ type: 'char-selected', char });
    },

    send(data) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch(e) {
                console.error('[Network] Send error:', e);
            }
        } else {
            console.warn('[Network] Send ignoré - pas de connexion ouverte');
        }
    },

    startPing() {
        this.pingInterval = setInterval(() => {
            this.send({ type: 'ping', t: Date.now() });
        }, 2000);
    },

    stopPing() {
        clearInterval(this.pingInterval);
    },

    disconnect() {
        this.stopPing();
        if (this.conn)  { this.conn.close();   this.conn  = null; }
        if (this.peer)  { this.peer.destroy(); this.peer  = null; }
        this.isHost = false;
        this.myRole = null;
        UI.updateConnectionStatus(false);
    },

    sendInputs(keys) {
        if (!this.conn || !this.conn.open) return;
        this.conn.send({
            type: 'inputs',
            keys: keys.p2
        });
    },
};
