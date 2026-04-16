// ============================================
//  characters.js - Personnages & stats
// ============================================

const Characters = {

    roster: [
        {
            id:          'rapide',
            name:        'Rapide',
            emoji:       '⚡',
            color:       '#facc15',
            description: 'Ultra rapide, difficile à attraper',
            lore:        'Le plus vif de la ligue',
            stats: {
                speed:    10,
                power:    4,
                stamina:  6,
                defense:  3,
                ultimate: 7
            },
            maxSpeed:    9,
            maxStamina:  80,
            powerMult:   0.7,
            radius:      22,
            abilities: [
                {
                    id:       'dash',
                    name:     'Dash',
                    icon:     '🚀',
                    desc:     'Sprint éclair vers l\'avant',
                    cooldown: 4,
                    stamina:  20
                },
                {
                    id:       'spin',
                    name:     'Spin',
                    icon:     '🌪️',
                    desc:     'Tir avec effet dévastateur',
                    cooldown: 6,
                    stamina:  25
                }
            ],
            ultimate: {
                id:   'speed_zone',
                name: 'Zone de Vitesse',
                icon: '⚡',
                desc: 'Vitesse x3 pendant 5 secondes'
            }
        },

        {
            id:          'tank',
            name:        'Tank',
            emoji:       '🐢',
            color:       '#10b981',
            description: 'Lent mais dévastateur au contact',
            lore:        'Une forteresse ambulante',
            stats: {
                speed:    3,
                power:    9,
                stamina:  10,
                defense:  10,
                ultimate: 8
            },
            maxSpeed:    4.5,
            maxStamina:  150,
            powerMult:   1.8,
            radius:      28,
            abilities: [
                {
                    id:       'charge',
                    name:     'Charge',
                    icon:     '💪',
                    desc:     'Charge et explose l\'adversaire',
                    cooldown: 7,
                    stamina:  30
                },
                {
                    id:       'powershot',
                    name:     'Frappe Écrasante',
                    icon:     '💥',
                    desc:     'Tir surpuissant incontrôlable',
                    cooldown: 5,
                    stamina:  35
                }
            ],
            ultimate: {
                id:   'fortress',
                name: 'Forteresse',
                icon: '🏰',
                desc: 'Invincible + Power x2 pendant 4s'
            }
        },

        {
            id:          'sniper',
            name:        'Sniper',
            emoji:       '🎯',
            color:       '#6366f1',
            description: 'Tirs laser ultra précis depuis loin',
            lore:        'Ne rate jamais sa cible',
            stats: {
                speed:    6,
                power:    8,
                stamina:  5,
                defense:  3,
                ultimate: 9
            },
            maxSpeed:    6,
            maxStamina:  70,
            powerMult:   1.2,
            radius:      20,
            abilities: [
                {
                    id:       'precision',
                    name:     'Tir Précision',
                    icon:     '🎯',
                    desc:     'Tir laser droit et rapide',
                    cooldown: 5,
                    stamina:  25
                },
                {
                    id:       'dash',
                    name:     'Esquive',
                    icon:     '🚀',
                    desc:     'Dash rapide d\'esquive',
                    cooldown: 4,
                    stamina:  20
                }
            ],
            ultimate: {
                id:   'laser',
                name: 'Tir Laser',
                icon: '🔦',
                desc: 'Tir irrésistible à 50 de vitesse'
            }
        },

        {
            id:          'ghost',
            name:        'Ghost',
            emoji:       '👻',
            color:       '#a855f7',
            description: 'Maître du clone et de la tromperie',
            lore:        'On ne sait jamais où il est',
            stats: {
                speed:    7,
                power:    5,
                stamina:  7,
                defense:  5,
                ultimate: 10
            },
            maxSpeed:    7,
            maxStamina:  90,
            powerMult:   0.9,
            radius:      21,
            abilities: [
                {
                    id:       'clone',
                    name:     'Clone',
                    icon:     '👥',
                    desc:     'Crée une illusion pour tromper',
                    cooldown: 8,
                    stamina:  30
                },
                {
                    id:       'dash',
                    name:     'Phase',
                    icon:     '🌀',
                    desc:     'Traverse en dash invisible',
                    cooldown: 5,
                    stamina:  20
                }
            ],
            ultimate: {
                id:   'teleport',
                name: 'Téléportation',
                icon: '🌀',
                desc: 'Téléporte derrière l\'adversaire'
            }
        },

        {
            id:          'glacier',
            name:        'Glacier',
            emoji:       '🧊',
            color:       '#06b6d4',
            description: 'Contrôle le terrain avec le gel',
            lore:        'Glace tout ce qu\'il touche',
            stats: {
                speed:    5,
                power:    6,
                stamina:  8,
                defense:  7,
                ultimate: 8
            },
            maxSpeed:    5.5,
            maxStamina:  100,
            powerMult:   1.0,
            radius:      23,
            abilities: [
                {
                    id:       'freeze',
                    name:     'Freeze',
                    icon:     '🧊',
                    desc:     'Gèle l\'adversaire 3 secondes',
                    cooldown: 9,
                    stamina:  35
                },
                {
                    id:       'spin',
                    name:     'Glissade',
                    icon:     '🌪️',
                    desc:     'Tir courbe glacial',
                    cooldown: 5,
                    stamina:  20
                }
            ],
            ultimate: {
                id:   'timeslow',
                name: 'Slow Motion',
                icon: '⏳',
                desc: 'Adversaire à 20% de vitesse 5s'
            }
        },

        {
            id:          'storm',
            name:        'Storm',
            emoji:       '🌩️',
            color:       '#ef4444',
            description: 'Frappes explosives et imprévisibles',
            lore:        'Pur chaos sur le terrain',
            stats: {
                speed:    7,
                power:    10,
                stamina:  6,
                defense:  4,
                ultimate: 10
            },
            maxSpeed:    7,
            maxStamina:  85,
            powerMult:   1.5,
            radius:      23,
            abilities: [
                {
                    id:       'powershot',
                    name:     'Tir Explosif',
                    icon:     '💥',
                    desc:     'Frappe incontrôlable dévastatrice',
                    cooldown: 5,
                    stamina:  30
                },
                {
                    id:       'magnet',
                    name:     'Aimant',
                    icon:     '🧲',
                    desc:     'Attire la balle vers soi',
                    cooldown: 6,
                    stamina:  20
                }
            ],
            ultimate: {
                id:   'megastrike',
                name: 'Méga Frappe',
                icon: '🌋',
                desc: 'Frappe à 60 de vitesse, imparable'
            }
        }
    ],

    // --- Retourne un perso par ID ---
    getById(id) {
        return this.roster.find(c => c.id === id) || this.roster[0];
    },

    // --- Crée un joueur depuis un perso ---
    createPlayer(charId, playerNum, canvas) {
        const char  = this.getById(charId);
        const isP1  = playerNum === 1;

        return {
            // Identité
            id:           playerNum,
            name:         isP1 ? 'P1' : 'P2',
            character:    char,
            emoji:        char.emoji,
            color:        isP1 ? '#6366f1' : '#ef4444',

            // Position
            x:            isP1 ? canvas.width * 0.25 : canvas.width * 0.75,
            y:            canvas.height - 120,
            vx:           0,
            vy:           0,
            radius:       char.radius,
            facingRight:  isP1,
            onGround:     false,
            jumpsLeft:    2,

            // Stats
            maxSpeed:     char.maxSpeed,
            maxStamina:   char.maxStamina,
            stamina:      char.maxStamina,
            staminaRegen:  0.18,
            powerMult:    char.powerMult,
            speedMult:    1,
            zoneMult:     1,
            baseSpeed:    3 + char.stats.speed * 0.4,   // ← AJOUT
            jumpForce:   -11 - char.stats.speed * 0.2,  // ← AJOUT

            // Ultime
            ultimate:         0,
            ultActive:        false,
            ultTimer:         0,
            ultimateCooldown: 0,
            glowing:          false,
            ultEffect:        null,

            // États
            frozen:       false,
            frozenTimer:  0,
            stunned:      false,
            stunTimer:    0,
            dashing:      false,
            dashTimer:    0,
            charging:     false,
            invincible:   false,
            shield:       false,
            cloneActive:  false,
            clone:        null,
            magnetActive: false,
            magnetTimer:  0,
            explosiveShot:false,

            // Cooldowns capacités
            abilityCooldowns: char.abilities.reduce((acc, a) => {
                acc[a.id] = 0;
                return acc;
            }, {})
        };
    },

    // --- Génère les cartes HTML pour la sélection ---
    renderCards(containerId, onSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        this.roster.forEach(char => {
            const card = document.createElement('div');
            card.className   = 'character-card';
            card.dataset.id  = char.id;

            card.innerHTML = `
                <div class="card-emoji">${char.emoji}</div>
                <div class="card-name">${char.name}</div>
                <div class="card-desc">${char.description}</div>
                <div class="card-stats">
                    ${this._renderStat('⚡', char.stats.speed)}
                    ${this._renderStat('💥', char.stats.power)}
                    ${this._renderStat('🛡️', char.stats.defense)}
                    ${this._renderStat('💚', char.stats.stamina)}
                </div>
                <div class="card-abilities">
                    ${char.abilities.map(a =>
                        `<span class="ability-tag">${a.icon} ${a.name}</span>`
                    ).join('')}
                </div>
                <div class="card-ultimate">
                    🌟 ${char.ultimate.name}
                </div>
            `;

            card.addEventListener('click', () => {
                container.querySelectorAll('.character-card').forEach(c =>
                    c.classList.remove('selected')
                );
                card.classList.add('selected');
                onSelect(char);
            });

            container.appendChild(card);
        });
    },

    _renderStat(icon, val) {
        const pct = (val / 10) * 100;
        return `
            <div class="stat-row">
                <span>${icon}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width:${pct}%"></div>
                </div>
            </div>
        `;
    }
};
