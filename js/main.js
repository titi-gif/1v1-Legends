// ============================================
//  main.js - Point d'entrée
// ============================================

let selectedChars = { host: null, guest: null };

const GameSettings = {
    zonesEnabled:    true,
    powerupsEnabled: true,
    matchDuration:   3,
    winScore:        5,
    volume:          0.7
};

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 1v1 Legends - Chargement...');
    generateParticles();
    UI.showScreen('screen-menu');
    console.log('✅ Menu prêt');
});

function generateParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const emojis = ['⚽', '⚡', '🌟', '💥', '🔥'];
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.cssText = `
            left:             ${Math.random() * 100}%;
            animation-delay:  ${Math.random() * 6}s;
            animation-duration:${5 + Math.random() * 5}s;
            font-size:        ${14 + Math.random() * 20}px;
            opacity:          ${0.1 + Math.random() * 0.3};
        `;
        container.appendChild(p);
    }
}

// ==========================================
//  SÉLECTION DE PERSONNAGE (ONLINE ONLY)
// ==========================================
function initCharacterSelect() {
    UI.showScreen('screen-character');

    const isHost = Network.isHost;
    console.log('[DEBUG] isHost:', isHost);

    const p1Panel = document.getElementById('char-select-p1');
    const p2Panel = document.getElementById('char-select-p2');

    if (isHost) {
        p1Panel.classList.remove('hidden');
        p2Panel.classList.add('hidden');
        document.getElementById('select-title').textContent = '⚡ Choisis ton Legend (P1)';
    } else {
        p2Panel.classList.remove('hidden');
        p1Panel.classList.add('hidden');
        document.getElementById('select-title').textContent = '🔥 Choisis ton Legend (P2)';
    }

    // ✅ Bons IDs : chars-p1 / chars-p2
    renderCharacterCards('p1');
    renderCharacterCards('p2');
}

function renderCharacterCards(slot) {
    // ✅ Corrigé : chars-p1 / chars-p2 (pas char-grid-...)
    const grid = document.getElementById(`chars-${slot}`);
    if (!grid) {
        console.warn(`[WARN] Grid chars-${slot} introuvable`);
        return;
    }
    grid.innerHTML = '';

    // ✅ Bouton confirm correspondant
    const confirmBtn = document.getElementById(`confirm-${slot}`);

    Characters.roster.forEach(char => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.innerHTML = `
            <div class="char-emoji">${char.emoji}</div>
            <div class="char-name">${char.name}</div>
            <div class="char-desc">${char.description}</div>
        `;
        card.onclick = () => {
            const mySlot = Network.isHost ? 'host' : 'guest';
            selectedChars[mySlot] = char;

            // Highlight
            grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // ✅ Active le bouton confirm
            if (confirmBtn) confirmBtn.disabled = false;

            // ✅ Met à jour la preview
            updatePreview(slot, char);

            console.log(`[DEBUG] ${mySlot} a choisi ${char.name}`);
        };
        grid.appendChild(card);
    });
}

function updatePreview(slot, char) {
    const preview = document.getElementById(`preview-${slot}`);
    if (preview) {
        preview.innerHTML = `
            <div style="font-size:48px">${char.emoji}</div>
            <div style="font-weight:700;font-size:18px;color:var(--text)">${char.name}</div>
            <div style="font-size:13px;color:var(--text-dim)">${char.description}</div>
        `;
    }

    // Stats
    const statsEl = document.getElementById(`stats-${slot}`);
    if (statsEl && char.stats) {
        statsEl.style.display = 'flex';
        const setBar = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.style.width = (val * 10) + '%';
            const valEl = document.getElementById(id + '-val');
            if (valEl) valEl.textContent = val + '/10';
        };
        setBar(`stat-${slot}-speed`,   char.stats.speed   ?? 5);
        setBar(`stat-${slot}-power`,   char.stats.power   ?? 5);
        setBar(`stat-${slot}-stamina`, char.stats.stamina ?? 5);
        setBar(`stat-${slot}-defense`, char.stats.defense ?? 5);
    }
}

// ==========================================
//  CONFIRMATION (ONLINE ONLY)
// ==========================================
function confirmMyChar() {
    const mySlot = Network.isHost ? 'host' : 'guest';
    const chosen = selectedChars[mySlot];

    // Désactive le bouton
    const btnId = Network.isHost ? 'confirm-p1' : 'confirm-p2';
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.textContent = '⏳ En attente de l\'adversaire...';
        btn.disabled = true;
    }

    Network.sendCharacterChoice(chosen);
}


// Appelé par Network quand les deux ont confirmé
function bothCharsReady() {
    const p1Char = selectedChars.host;
    const p2Char = selectedChars.guest;

    console.log('[DEBUG] Lancement !', p1Char.name, 'vs', p2Char.name);
    UI.showScreen('screen-game');
    GameLoop.start('online', p1Char, p2Char);
}

// ==========================================
//  REJOUER
// ==========================================
function replayGame() {
    const el = document.getElementById('end-screen');
    if (el) { el.classList.add('hidden'); el.classList.remove('show'); }
    selectedChars = { host: null, guest: null };

    // Réinitialise les boutons confirm
    const b1 = document.getElementById('confirm-p1');
    const b2 = document.getElementById('confirm-p2');
    if (b1) { b1.textContent = '✅ Confirmer ce Legend'; b1.disabled = true; }
    if (b2) { b2.textContent = '✅ Confirmer ce Legend'; b2.disabled = true; }

    initCharacterSelect();
}

// ==========================================
//  RETOUR MENU
// ==========================================
function goToMenu() {
    GameLoop.stop();
    Network.stopPing();
    const endEl = document.getElementById('end-screen');
    if (endEl) { endEl.classList.add('hidden'); endEl.classList.remove('show'); }
    selectedChars = { host: null, guest: null };
    UI.showScreen('screen-menu');
}

// ==========================================
//  SETTINGS
// ==========================================
function saveSettings() {
    GameSettings.zonesEnabled    = document.getElementById('toggle-zones')?.checked    ?? true;
    GameSettings.powerupsEnabled = document.getElementById('toggle-powerups')?.checked ?? true;
    GameSettings.matchDuration   = parseInt(document.getElementById('match-duration')?.value || 3);
    GameSettings.winScore        = parseInt(document.getElementById('win-score')?.value || 5);
    GameLoop.MATCH_DURATION      = GameSettings.matchDuration * 60 * 60;
    GameLoop.WIN_SCORE           = GameSettings.winScore;
    UI.showScreen('screen-menu');
}
