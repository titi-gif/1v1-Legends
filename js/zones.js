// ============================================
//  zones.js - Zones spéciales sur le terrain
// ============================================

const Zones = {

    DEFINITIONS: [
        {
            id:     'boost',
            type:   'boost',
            icon:   '🔥',
            label:  'BOOST',
            color:  'rgba(239,68,68,0.12)',
            border: '#ef4444'
        },
        {
            id:     'slow',
            type:   'slow',
            icon:   '❄️',
            label:  'SLOW',
            color:  'rgba(6,182,212,0.12)',
            border: '#06b6d4'
        },
        {
            id:     'precision',
            type:   'precision',
            icon:   '🎯',
            label:  'PRÉCISION',
            color:  'rgba(163,230,53,0.12)',
            border: '#a3e635'
        }
    ],

    active: [],

    init(canvas) {
        if (!GameSettings.zonesEnabled) return;
        this.active = [];
        const ground = canvas.height - 60;
        const zoneH  = 100;
        const zoneW  = 120;

        // Zone boost gauche
        this.active.push({
            ...this.DEFINITIONS[0],
            rx: 60,
            ry: ground - zoneH,
            w:  zoneW,
            h:  zoneH,
            pulseTimer: 0
        });

        // Zone boost droite
        this.active.push({
            ...this.DEFINITIONS[0],
            id: 'boost_r',
            rx: canvas.width - 60 - zoneW,
            ry: ground - zoneH,
            w:  zoneW,
            h:  zoneH,
            pulseTimer: Math.PI
        });

        // Zone slow centre
        this.active.push({
            ...this.DEFINITIONS[1],
            rx: canvas.width / 2 - zoneW / 2,
            ry: ground - zoneH,
            w:  zoneW,
            h:  zoneH,
            pulseTimer: 0
        });

        // Zone précision haut gauche
        this.active.push({
            ...this.DEFINITIONS[2],
            rx: 80,
            ry: 80,
            w:  zoneW,
            h:  80,
            pulseTimer: 1
        });

        // Zone précision haut droite
        this.active.push({
            ...this.DEFINITIONS[2],
            id: 'precision_r',
            rx: canvas.width - 80 - zoneW,
            ry: 80,
            w:  zoneW,
            h:  80,
            pulseTimer: 2
        });
    },

    update() {
        this.active.forEach(z => {
            z.pulseTimer += 0.04;
        });
    },

    // --- Vérifie dans quelle zone est un joueur/balle ---
    getZoneFor(entity) {
        for (const z of this.active) {
            if (
                entity.x >= z.rx &&
                entity.x <= z.rx + z.w &&
                entity.y >= z.ry &&
                entity.y <= z.ry + z.h
            ) {
                return z;
            }
        }
        return null;
    },

    // --- Applique effet de zone sur joueur ---
    applyToPlayer(player) {
        if (!GameSettings.zonesEnabled) return;
        const zone = this.getZoneFor(player);

        // Reset zone mult à chaque frame
        player.zoneMult = 1;

        if (!zone) return;

        switch (zone.type) {
            case 'boost':
                player.zoneMult = 1.4;
                break;
            case 'slow':
                player.zoneMult = 0.5;
                break;
            case 'precision':
                player.powerMult = player.character.powerMult * 1.3;
                break;
        }
    },

    // --- Applique effet de zone sur balle ---
    applyToBall(ball) {
        if (!GameSettings.zonesEnabled) return;
        const zone = this.getZoneFor(ball);
        if (!zone) return;
        Physics.applyZoneToBall(ball, zone);
    }
};
