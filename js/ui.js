/**
 * REDLINE TCG - CORE USER INTERFACE RENDERING ENGINE
 */

const UI = {
    /**
     * Renders packs in the Showroom view (Section 1 Page 1)
     */
    renderShowroom(packs, coins) {
        const grid = document.getElementById("showroom-packs-grid");
        if (!grid) return;
        grid.innerHTML = "";

        const sortedPacks = [...packs].sort((a, b) => a.cost - b.cost);

        sortedPacks.forEach(pack => {
            const isUnlocked = pack.unlocked;
            const isCompleted = (typeof app !== 'undefined' && app.state.completedPacks) ? app.state.completedPacks.includes(pack.id) : false;
            const hasFreeRip = (typeof app !== 'undefined' && app.state.freePackRip);
            
            const completionBadge = isCompleted ? `
                <div class="pack-completion-badge" style="position: absolute; top: 10px; right: 10px; background: #2e7d32; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; z-index: 5; box-shadow: 0 0 10px rgba(46, 125, 50, 0.8); border: 2px solid #fff;">
                    ✓
                </div>
            ` : '';

            const multiplierBadge = `
                <div class="pack-multiplier-badge" style="position: absolute; top: 10px; left: 10px; z-index: 5; font-family: var(--font-display); font-size: 0.65rem; letter-spacing: 0.5px; backdrop-filter: blur(4px); padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid; transition: all 0.3s ease; ${
                    isCompleted 
                    ? 'font-weight: 800; color: #00f0ff; background: rgba(0, 240, 255, 0.12); border-color: #00f0ff; box-shadow: 0 0 8px rgba(0, 240, 255, 0.5);' 
                    : 'font-weight: 700; color: #71717a; background: rgba(39, 39, 42, 0.60); border-color: rgba(113, 113, 122, 0.25);'
                }">
                    1.02x Multiplier
                </div>
            `;

            const packIndex = sortedPacks.findIndex(p => p.id === pack.id);
            const openingFee = packIndex >= 0 ? (packIndex + 1) : 1;
            const hasTaxExemption = (typeof app !== 'undefined' && app.state && app.state.taxExemptionActive);
            const feeText = hasTaxExemption ? "Free (Exempt)" : `${openingFee} Coin${openingFee > 1 ? 's' : ''}`;
            const feeStyle = hasTaxExemption 
                ? "color: var(--neon-cyan); background: rgba(0, 240, 255, 0.12); border-color: rgba(0, 240, 255, 0.35);" 
                : "color: #ff3e3e; background: rgba(255, 62, 62, 0.12); border-color: rgba(255, 62, 62, 0.25);";

            const element = document.createElement("div");
            element.className = `pack-module ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            // Generate visual style based on pack state
            if (!isUnlocked && !hasFreeRip) {
                let lockOverlayHTML = `
                    <div class="lock-overlay">
                        <span class="lock-icon">🔒</span>
                        <span class="lock-text">LOCKED</span>
                    </div>
                `;
                
                // Supercars Gate Cryptographic Lock Verification
                if (pack.id === "supercars") {
                    const gate = (typeof app !== 'undefined') ? app.checkSupercarsGate() : { unlocked: false };
                    if (!gate.unlocked) {
                        lockOverlayHTML = `
                            <div class="lock-overlay supercars-gate-lock" style="background: radial-gradient(circle, rgba(17, 17, 19, 0.96) 0%, rgba(8, 8, 9, 0.99) 100%); border: 2px solid #ef4444; box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.3); pointer-events: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem;">
                                <span class="lock-icon" style="animation: pulse 2s infinite; font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));">🔒</span>
                                <span class="lock-text" style="color: #ef4444; font-weight: 900; letter-spacing: 1.5px; font-size: 0.8rem; margin-top: 0.5rem; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">CRYPTOGRAPHIC GATE</span>
                                <span class="lock-subtext" style="font-family: var(--font-display); font-size: 0.65rem; color: #a1a1aa; margin-top: 0.25rem;">Click to monitor progression</span>
                            </div>
                        `;
                    }
                }

                element.innerHTML = `
                    ${completionBadge}
                    ${multiplierBadge}
                    ${lockOverlayHTML}
                    <div class="pack-art">
                        <div class="pack-overlay-glow" style="background-color: ${pack.color}"></div>
                        <div class="pack-cover-graphic">${UI.getPackCoverHTML(pack.id)}</div>
                    </div>
                    <div class="pack-info">
                        <div>
                            <h3 class="pack-title">${pack.name}</h3>
                            <p class="pack-description">${pack.description}</p>
                        </div>
                        <div class="pack-footer" style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; width: 100%;">
                            <span class="pack-cost">🪙 ${pack.cost} Coins</span>
                            <span class="pack-fee" style="font-family: var(--font-display); font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid; white-space: nowrap; ${feeStyle}">Fee: ${feeText}</span>
                        </div>
                    </div>
                `;
                element.addEventListener("click", () => {
                    if (pack.id === "supercars") {
                        const gate = (typeof app !== 'undefined') ? app.checkSupercarsGate() : { unlocked: false };
                        if (!gate.unlocked) {
                            app.showSupercarsGateMonitor();
                            return;
                        }
                    }
                    app.buyPackLicense(pack.id, pack.cost);
                });
            } else {
                const buttonText = (!isUnlocked && hasFreeRip) ? "Free Rip" : "Rip Pack";
                element.innerHTML = `
                    ${completionBadge}
                    ${multiplierBadge}
                    ${!isUnlocked ? '<div class="lock-overlay" style="background: rgba(0,0,0,0.55); pointer-events: none;"><span class="lock-icon" style="font-size: 1.5rem; filter: drop-shadow(0 0 8px #e67e22);">🎫</span><span class="lock-text" style="font-size: 0.85rem; color: #e67e22; font-weight: bold; letter-spacing: 0.5px; text-shadow: 0 0 8px rgba(0,0,0,0.8);">FREE RIP AVAILABLE</span></div>' : ''}
                    <div class="pack-art">
                        <div class="pack-overlay-glow" style="background-color: ${pack.color}"></div>
                        <div class="pack-cover-graphic">${UI.getPackCoverHTML(pack.id)}</div>
                    </div>
                    <div class="pack-info">
                        <div>
                            <h3 class="pack-title">${pack.name}</h3>
                            <p class="pack-description">${pack.description}</p>
                        </div>
                        <div class="pack-footer-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-family: var(--font-display); font-size: 0.72rem; font-weight: 700; width: 100%;">
                                <span style="color: var(--neon-cyan); background: rgba(0, 240, 255, 0.05); padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid rgba(0, 240, 255, 0.15); font-size: 0.68rem; letter-spacing: 0.5px; white-space: nowrap;">UNLOCKED</span>
                                <span class="pack-fee" style="font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid; white-space: nowrap; ${feeStyle}">Opening Fee: ${feeText}</span>
                            </div>
                            <div class="pack-action-buttons">
                                <button class="pack-action-btn rip-stock-btn" style="width: 100%; max-width: none; font-size: 0.85rem; padding: 0.4rem 1rem;">
                                    ${buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // Bind actions
                const ripBtn = element.querySelector(".rip-stock-btn");
                ripBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    app.selectPackForOpening(pack.id);
                });
            }

            grid.appendChild(element);
        });
    },

    /**
     * Generates a dynamic, high-contrast vector representation of each card pack.
     */
    getPackCoverHTML(packId) {
        switch (packId) {
            case "ford":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="ford-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1e3c72" />
                            <stop offset="100%" stop-color="#0a2240" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="50" cy="50" rx="44" ry="24" fill="url(#ford-grad)" stroke="#ffffff" stroke-width="2.2" />
                    <ellipse cx="50" cy="50" rx="40" ry="20" fill="none" stroke="#ffffff" stroke-width="0.75" opacity="0.8" />
                    <text x="50" y="56" font-family="'Brush Script MT', 'Outfit', cursive" font-size="20" font-weight="bold" font-style="italic" fill="#ffffff" text-anchor="middle">Force</text>
                </svg>
                `;
            case "chevrolet":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="chevy-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#ffe082" />
                            <stop offset="50%" stop-color="#ffb300" />
                            <stop offset="100%" stop-color="#b78103" />
                        </linearGradient>
                    </defs>
                    <g transform="translate(50, 50) rotate(-6) skewX(-15) translate(-50, -50)">
                        <!-- Stylized V-Wing Badge instead of Bowtie -->
                        <path d="M 20 30 L 80 30 L 50 80 Z" fill="url(#chevy-gold)" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round" />
                        <path d="M 25 35 L 75 35 L 50 72 Z" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                        <path d="M 35 30 L 50 50 L 65 30" fill="none" stroke="#ffffff" stroke-width="2" />
                    </g>
                </svg>
                `;
            case "bmw":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="bmw-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="100%" stop-color="#71717a" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="43" fill="#09090b" stroke="url(#bmw-chrome)" stroke-width="2.2" />
                    <circle cx="50" cy="50" r="28" fill="#ffffff" />
                    <!-- Changed colors from BMW Blue to High-Octane Neon Red -->
                    <path d="M 50 50 L 50 22 A 28 28 0 0 1 78 50 Z" fill="#ff003c" />
                    <path d="M 50 50 L 50 78 A 28 28 0 0 1 22 50 Z" fill="#ff003c" />
                    <line x1="50" y1="22" x2="50" y2="78" stroke="url(#bmw-chrome)" stroke-width="1.5" />
                    <line x1="22" y1="50" x2="78" y2="50" stroke="url(#bmw-chrome)" stroke-width="1.5" />
                    <!-- Changed letters from B M W to B V R (Bavaria) -->
                    <text x="32" y="23" font-family="'Orbitron', 'Outfit', sans-serif" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" transform="rotate(-35, 32, 23)">B</text>
                    <text x="50" y="16" font-family="'Orbitron', 'Outfit', sans-serif" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle">V</text>
                    <text x="68" y="23" font-family="'Orbitron', 'Outfit', sans-serif" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" transform="rotate(35, 68, 23)">R</text>
                </svg>
                `;
            case "toyota":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="toyota-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="50%" stop-color="#a1a1aa" />
                            <stop offset="100%" stop-color="#3f3f46" />
                        </linearGradient>
                    </defs>
                    <!-- Changed from three intersecting ellipses to a double ring T-badge -->
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#toyota-chrome)" stroke-width="4.5" />
                    <circle cx="50" cy="50" r="34" fill="none" stroke="url(#toyota-chrome)" stroke-width="1.5" opacity="0.6" />
                    <path d="M 28 36 L 72 36 M 50 36 L 50 72" fill="none" stroke="url(#toyota-chrome)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                `;
            case "nissan":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="nissan-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="50%" stop-color="#b8b8b8" />
                            <stop offset="100%" stop-color="#555555" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="34" fill="none" stroke="url(#nissan-chrome)" stroke-width="5.5" />
                    <rect x="12" y="42" width="76" height="16" fill="#09090b" stroke="url(#nissan-chrome)" stroke-width="2.5" rx="2" />
                    <text x="50" y="53.5" font-family="'Orbitron', sans-serif" font-size="8" font-weight="900" fill="#ffffff" letter-spacing="2.5" text-anchor="middle">NISMO</text>
                </svg>
                `;
            case "honda":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="honda-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="50%" stop-color="#a1a1aa" />
                            <stop offset="100%" stop-color="#3f3f46" />
                        </linearGradient>
                    </defs>
                    <path d="M 24 22 C 30 20, 70 20, 76 22 C 84 24, 82 72, 79 80 C 77 84, 70 85, 50 85 C 30 85, 23 84, 21 80 C 18 72, 16 24, 24 22 Z" fill="none" stroke="url(#honda-chrome)" stroke-width="4.5" />
                    <!-- Slanted racing tracks instead of Honda H-Crest -->
                    <path d="M 33 28 L 33 75 M 67 28 L 67 75 M 33 54 L 67 48" fill="none" stroke="url(#honda-chrome)" stroke-width="7.5" stroke-linecap="round" />
                </svg>
                `;
            case "mercedes":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="merc-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="100%" stop-color="#3f3f46" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#merc-chrome)" stroke-width="3.5" />
                    <!-- Changed from three-pointed star to a four-pointed star compass -->
                    <g transform="translate(50,50)">
                        <path d="M 0 0 L -4 -4 L 0 -38 L 4 -4 Z" fill="url(#merc-chrome)" />
                        <path d="M 0 0 L 4 -4 L 38 0 L 4 4 Z" fill="url(#merc-chrome)" />
                        <path d="M 0 0 L 4 4 L 0 38 L -4 4 Z" fill="url(#merc-chrome)" />
                        <path d="M 0 0 L -4 4 L -38 0 L -4 -4 Z" fill="url(#merc-chrome)" />
                    </g>
                </svg>
                `;
            case "porsche":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="porsche-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffe082" />
                            <stop offset="100%" stop-color="#b78103" />
                        </linearGradient>
                    </defs>
                    <path d="M 50 15 L 75 15 C 75 15, 78 50, 72 70 C 66 85, 50 90, 50 90 C 50 90, 34 85, 28 70 C 22 50, 25 15, 25 15 Z" fill="url(#porsche-gold)" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
                    <line x1="50" y1="15" x2="50" y2="90" stroke="#000000" stroke-width="1.5" />
                    <line x1="25" y1="42" x2="75" y2="42" stroke="#000000" stroke-width="1.5" />
                    
                    <path d="M 27 17 L 48 17 L 48 40 L 27 40 Z" fill="#e11d48" />
                    <rect x="30" y="17" width="4" height="23" fill="#000000" />
                    <rect x="38" y="17" width="4" height="23" fill="#000000" />
                    <rect x="46" y="17" width="2" height="23" fill="#000000" />
                    
                    <path d="M 52 44 L 71 44 C 71 44, 71 52, 69 60 C 68 64, 63 70, 52 75 Z" fill="#e11d48" />
                    <path d="M 56 44 L 56 71 C 56 71, 56 72, 56 72" stroke="#000000" stroke-width="3" />
                    <path d="M 62 44 L 62 66 C 62 66, 62 67, 62 67" stroke="#000000" stroke-width="3" />
                    <path d="M 68 44 L 68 56" stroke="#000000" stroke-width="3" />
                    
                    <!-- Modified inner horse badge to a 5-pointed star and text to STUTTGART -->
                    <path d="M 50 32 L 60 32 C 60 32, 61 48, 58 56 C 55 62, 50 65, 50 65 C 50 65, 45 62, 42 56 C 39 48, 40 32, 40 32 Z" fill="#ffe082" stroke="#000000" stroke-width="1" />
                    <polygon points="50,42 52,47 57,47 53,50 55,55 50,52 45,55 47,50 43,47 48,47" fill="#000000" />
                    <text x="50" y="27.5" font-family="'Orbitron', sans-serif" font-weight="900" font-size="3" fill="#000000" text-anchor="middle">STUTTGART</text>
                </svg>
                `;
            case "starter":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <pattern id="checkers" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="10" height="10" fill="#ffffff" />
                            <rect x="10" width="10" height="10" fill="#18181b" />
                            <rect y="10" width="10" height="10" fill="#18181b" />
                            <rect x="10" y="10" width="10" height="10" fill="#ffffff" />
                        </pattern>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="url(#checkers)" stroke="#ffffff" stroke-width="3" />
                    <circle cx="50" cy="50" r="24" fill="#ff2255" stroke="#ffffff" stroke-width="2" />
                    <text x="50" y="54" font-family="'Orbitron', sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">GO!</text>
                </svg>
                `;
            case "jdm":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <clipPath id="circle-clip">
                            <circle cx="50" cy="50" r="42" />
                        </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="#ffffff" stroke="#ff0000" stroke-width="3" />
                    <g clip-path="url(#circle-clip)">
                        <path d="M 50 50 L 100 20 L 100 35 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 100 50 L 100 65 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 80 100 L 95 100 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 50 100 L 65 100 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 20 100 L 35 100 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 0 80 L 0 95 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 0 50 L 0 65 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 0 20 L 0 35 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 20 0 L 35 0 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 50 0 L 65 0 Z" fill="#ff0000" opacity="0.85" />
                        <path d="M 50 50 L 80 0 L 95 0 Z" fill="#ff0000" opacity="0.85" />
                        <circle cx="50" cy="50" r="18" fill="#ff0000" />
                    </g>
                </svg>
                `;
            case "italian":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="italy-glow" x1="0" y1="0" x2="0" y2="100%">
                            <stop offset="0%" stop-color="#3f3f46" />
                            <stop offset="100%" stop-color="#18181b" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="url(#italy-glow)" stroke="#27ae60" stroke-width="2.5" />
                    <g transform="rotate(15, 50, 50)">
                        <rect x="23" y="25" width="16" height="50" fill="#009246" rx="2" />
                        <rect x="42" y="25" width="16" height="50" fill="#f1f2f1" rx="2" />
                        <rect x="61" y="25" width="16" height="50" fill="#ce2b37" rx="2" />
                    </g>
                </svg>
                `;
            case "british":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <clipPath id="flag-clip">
                            <circle cx="50" cy="50" r="42" />
                        </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="#012169" stroke="#ffffff" stroke-width="3" />
                    <g clip-path="url(#flag-clip)">
                        <line x1="0" y1="0" x2="100" y2="100" stroke="#ffffff" stroke-width="8" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="#ffffff" stroke-width="8" />
                        <line x1="0" y1="0" x2="100" y2="100" stroke="#c8102e" stroke-width="3.2" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="#c8102e" stroke-width="3.2" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" stroke-width="14" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" stroke-width="14" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#c8102e" stroke-width="8" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#c8102e" stroke-width="8" />
                    </g>
                </svg>
                `;
            case "german":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <clipPath id="circle-clip-germany">
                            <circle cx="50" cy="50" r="42" />
                        </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ffcc00" stroke-width="3" />
                    <g clip-path="url(#circle-clip-germany)">
                        <rect x="0" y="8" width="100" height="28" fill="#000000" />
                        <rect x="0" y="36" width="100" height="28" fill="#dd0000" />
                        <rect x="0" y="64" width="100" height="28" fill="#ffcc00" />
                    </g>
                </svg>
                `;
            case "muscle":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="muscle-grad" x1="0" y1="0" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ff4e00" />
                            <stop offset="100%" stop-color="#ec9f05" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="#18181b" stroke="url(#muscle-grad)" stroke-width="3" />
                    <rect x="36" y="8" width="10" height="84" fill="url(#muscle-grad)" />
                    <rect x="54" y="8" width="10" height="84" fill="url(#muscle-grad)" />
                    <path d="M 20 85 C 30 75, 25 55, 38 45 C 32 60, 42 65, 50 35 C 55 60, 68 55, 62 45 C 75 55, 70 75, 80 85 Z" fill="url(#muscle-grad)" opacity="0.3" />
                    <path d="M 25 88 C 32 80, 30 68, 42 60 C 38 72, 45 75, 50 50 C 53 72, 62 70, 58 60 C 70 68, 68 80, 75 88 Z" fill="url(#muscle-grad)" />
                </svg>
                `;
            case "vintage":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="42" fill="#242427" stroke="#e2a76f" stroke-width="3" />
                    <path d="M 50 14 L 50 20 M 75 25 L 71 29 M 86 50 L 80 50 M 75 75 L 71 71 M 50 86 L 50 80 M 25 75 L 29 71 M 14 50 L 20 50 M 25 25 L 29 29" stroke="#a1a1aa" stroke-width="2" />
                    <text x="50" y="40" font-family="'Courier New', Courier, monospace" font-size="8" font-weight="bold" fill="#e2a76f" text-anchor="middle">RPM</text>
                    <circle cx="50" cy="50" r="6" fill="#e11d48" />
                    <line x1="50" y1="50" x2="78" y2="28" stroke="#e11d48" stroke-width="3.5" stroke-linecap="round" />
                    <circle cx="50" cy="50" r="3" fill="#ffffff" />
                </svg>
                `;
            case "ev":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="ev-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#00f0ff" />
                            <stop offset="100%" stop-color="#2ecc71" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="#121214" stroke="url(#ev-grad)" stroke-width="3" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="url(#ev-grad)" stroke-width="0.75" stroke-dasharray="10 5" opacity="0.5" />
                    <path d="M 52 18 L 30 50 L 48 50 L 40 82 L 70 42 L 50 42 Z" fill="url(#ev-grad)" filter="url(#glow)" />
                </svg>
                `;
            case "supercars":
                return `
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffe082" />
                            <stop offset="50%" stop-color="#ffb300" />
                            <stop offset="100%" stop-color="#b78103" />
                        </linearGradient>
                        <filter id="gold-glow">
                            <feGaussianBlur stdDeviation="2" result="blur"/>
                            <feMerge>
                                <feMergeNode in="blur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="#09090b" stroke="url(#gold-grad)" stroke-width="3.5" />
                    <path d="M 20 50 L 80 50 M 50 20 L 50 80 M 30 30 L 70 70 M 30 70 L 70 30" stroke="rgba(255, 224, 130, 0.15)" stroke-width="1" />
                    <polygon points="50,22 75,38 75,62 50,78 25,62 25,38" fill="none" stroke="url(#gold-grad)" stroke-width="2.5" filter="url(#gold-glow)" />
                    <line x1="50" y1="22" x2="50" y2="78" stroke="url(#gold-grad)" stroke-width="1" opacity="0.8" />
                    <line x1="25" y1="38" x2="75" y2="62" stroke="url(#gold-grad)" stroke-width="1" opacity="0.8" />
                    <line x1="25" y1="62" x2="75" y2="38" stroke="url(#gold-grad)" stroke-width="1" opacity="0.8" />
                    <circle cx="50" cy="50" r="4" fill="#ffffff" filter="url(#gold-glow)" />
                </svg>
                `;
            default:
                return `<span style="font-size: 3rem;">🚗</span>`;
        }
    },

    /**
     * Maps a vehicle ID and manufacturer to a high-quality, brand-accurate real-life image from Unsplash.
     * Uses a stable seed to ensure consistency for each model.
     */
    getVehicleImageURL(cardId, manufacturer) {
        const brand = (manufacturer || "unknown").toLowerCase().trim();
        
        const brandImages = {
            "bmw": [
                "photo-1555215695-3004980ad54e", // Black BMW
                "photo-1617814076367-b759c7d7e738", // Blue BMW
                "photo-1607853202273-797f1c22a38e", // White BMW
                "photo-1556800572-1b8aeef2c54f"  // Silver BMW
            ],
            "audi": [
                "photo-1606016159991-dfe4f2746ad5", // White Audi
                "photo-1618843479313-40f8afb4b4d8", // Grey Audi
                "photo-1542282088-fe8426682b8f", // Red Audi R8
                "photo-1568605117036-5fe5e7bab0b7"  // Grey Audi R8
            ],
            "toyota": [
                "photo-1629897048514-3dd7414fe72a", // Orange GR86
                "photo-1616422285623-13ff0162193c", // White Supra
                "photo-1580273916550-e323be2ae537"  // Blue Supra
            ],
            "nissan": [
                "photo-1617650728468-8576e82837e1", // Nissan GTR
                "photo-1621259182978-f09e5e2b07ae", // Nissan Z
                "photo-1618043097148-522197c3ad9a"  // Skyline
            ],
            "honda": [
                "photo-1593440428178-56f8f7c9e10a", // Honda Civic
                "photo-1605558158359-78c48417643b", // Honda Accord
                "photo-1620216503971-df96b3410e30"  // Honda Civic Type R
            ],
            "ford": [
                "photo-1612465372465-1ede7f457ff7", // Mustang
                "photo-1583121274602-3e2820c69888", // Mustang GT
                "photo-1605558230480-2db2b7f0c9ef"  // Ford Bronco
            ],
            "chevrolet": [
                "photo-1552519507-da3b142c6e3d", // Corvette C8
                "photo-1619642751034-765dfdf7c58e", // Camaro
                "photo-1627454820516-dc767bcb4d3e"  // Corvette
            ],
            "porsche": [
                "photo-1614162692292-7ac56d7f7f1e", // Porsche 911
                "photo-1503376780353-7e6692767b70", // Yellow Porsche
                "photo-1611245044431-7e82b7933f20"  // Taycan
            ],
            "ferrari": [
                "photo-1583121274602-3e2820c69888", // Yellow Ferrari
                "photo-1592853625597-7d17be820d0c"  // Red Ferrari
            ],
            "lamborghini": [
                "photo-1544636331-e26879cd4d9b", // Aventador
                "photo-1621135802920-133df287f89c", // Huracan
                "photo-1614200179396-2bdb77ebf81d"  // Urus
            ],
            "dodge": [
                "photo-1626784215021-2e39cb52415d", // Challenger
                "photo-1606016159991-dfe4f2746ad5"  // Charger SRT
            ],
            "mercedes-benz": [
                "photo-1618843479313-40f8afb4b4d8", // AMG GT
                "photo-1617531653332-bd46c24f2068", // Mercedes C Class
                "photo-1502877338535-766e1452684a"  // Classic Mercedes
            ],
            "mercedes": [
                "photo-1618843479313-40f8afb4b4d8", // AMG GT
                "photo-1617531653332-bd46c24f2068", // Mercedes C Class
                "photo-1502877338535-766e1452684a"  // Classic Mercedes
            ],
            "tesla": [
                "photo-1617788138017-80ad40651399", // Model S
                "photo-1563720223-159311f67de1"  // Model X
            ],
            "mazda": [
                "photo-1552642986-ccb41e7059e7", // MX-5 Miata
                "photo-1615887023516-9b6bcd559e87"  // RX-7
            ],
            "subaru": [
                "photo-1617814076367-b759c7d7e738", // WRX
                "photo-1562920841-029f9d7294ee"  // Impreza
            ],
            "aston martin": [
                "photo-1603584173870-7f23fdae1b7a"  // Aston Martin
            ],
            "jaguar": [
                "photo-1611016186353-9af58c69a533"  // Jaguar F-Type
            ],
            "bentley": [
                "photo-1562675927-4630a91a92e1"  // Continental GT
            ],
            "rolls-royce": [
                "photo-1632245889029-e406faaa34cd"  // Phantom
            ],
            "mclaren": [
                "photo-1580273916550-e323be2ae537"  // McLaren 720S
            ],
            "land rover": [
                "photo-1508974239320-0a029497e820"  // Range Rover
            ],
            "jeep": [
                "photo-1533473359331-0135ef1b58bf"  // Wrangler
            ],
            "hyundai": [
                "photo-1616422285623-13ff0162193c"
            ],
            "kia": [
                "photo-1616422285623-13ff0162193c"
            ],
            "genesis": [
                "photo-1616422285623-13ff0162193c"
            ],
            "lexus": [
                "photo-1616422285623-13ff0162193c"
            ],
            "acura": [
                "photo-1616422285623-13ff0162193c"
            ],
            "mini": [
                "photo-1616422285623-13ff0162193c"
            ],
            "rivian": [
                "photo-1619767886558-efdc259cde1a"
            ],
            "lucid": [
                "photo-1619767886558-efdc259cde1a"
            ],
            "gmc": [
                "photo-1605558230480-2db2b7f0c9ef"
            ],
            "ram": [
                "photo-1605558230480-2db2b7f0c9ef"
            ],
            "cadillac": [
                "photo-1552519507-da3b142c6e3d"
            ],
            "shelby": [
                "photo-1616422285623-13ff0162193c"
            ],
            "pontiac": [
                "photo-1616422285623-13ff0162193c"
            ],
            "plymouth": [
                "photo-1616422285623-13ff0162193c"
            ],
            "de tomaso": [
                "photo-1616422285623-13ff0162193c"
            ],
            "bugatti": [
                "photo-1600706432502-75a0e2751982"
            ],
            "koenigsegg": [
                "photo-1580273916550-e323be2ae537"
            ],
            "pagani": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "rimac": [
                "photo-1619767886558-efdc259cde1a"
            ],
            "lotus": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "alfa romeo": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "maserati": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "polestar": [
                "photo-1619767886558-efdc259cde1a"
            ],
            "suzuki": [
                "photo-1593440428178-56f8f7c9e10a"
            ],
            "mitsubishi": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "daihatsu": [
                "photo-1593440428178-56f8f7c9e10a"
            ],
            "opel": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "hennessey": [
                "photo-1580273916550-e323be2ae537"
            ],
            "ssc": [
                "photo-1580273916550-e323be2ae537"
            ],
            "dallara": [
                "photo-1580273916550-e323be2ae537"
            ],
            "radical": [
                "photo-1580273916550-e323be2ae537"
            ],
            "pininfarina": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "zenvo": [
                "photo-1580273916550-e323be2ae537"
            ],
            "ariel": [
                "photo-1580273916550-e323be2ae537"
            ],
            "bac": [
                "photo-1580273916550-e323be2ae537"
            ],
            "delorean": [
                "photo-1618843479313-40f8afb4b4d8"
            ],
            "nio": [
                "photo-1619767886558-efdc259cde1a"
            ],
            "chrysler": [
                "photo-1626784215021-2e39cb52415d"
            ],
            "volkswagen": [
                "photo-1511919884226-fd3cad34687c", // Yellow Golf
                "photo-1567818735868-e71b99932e29", // Red Golf
                "photo-1541899481282-d53bffe3c35d"  // Blue Golf
            ]
        };

        // Generate a stable seed from the cardId to keep images consistent on refresh
        let hash = 0;
        for (let i = 0; i < cardId.length; i++) {
            hash = cardId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);

        const ids = brandImages[brand] || [
            "photo-1614162692292-7ac56d7f7f1e", // Porsche
            "photo-1544636331-e26879cd4d9b", // Lamborghini
            "photo-1592853625597-7d17be820d0c", // Ferrari
            "photo-1618843479313-40f8afb4b4d8", // Audi/AMG
            "photo-1617788138017-80ad40651399"  // Tesla/Sleek sedan
        ];
        const id = ids[seed % ids.length];
        
        // Fetch 400x220 (matches card-frame aspect ratio of 290x160 almost perfectly)
        return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=220&q=80`;
    },

    /**
     * Maps card rarity to a unique, premium styled vehicle/automotive icon (emoji)
     */
    getRarityIcon(rarity) {
        const rarityIcons = {
            "Common": "🚗",
            "Uncommon": "🚙",
            "Special": "🚐",
            "Rare": "🚘",
            "Very Rare": "🏎️",
            "Epic": "🔥",
            "Legendary": "⚡",
            "Exotic": "🚀",
            "Limited Edition": "🏆"
        };
        return rarityIcons[rarity] || "🚗";
    },

    /**
     * Spawns a beautiful, high-octane Pokemon-style trading card component (Section 4 specs)
     */
    createCardDOM(card, isUndiscovered = false, isNew = false) {
        // Resolve card to the latest version in CardDatabase to sync all fields cleanly
        const dbCard = (typeof CardDatabase !== 'undefined') ? (CardDatabase.find(c => c.id === card.id) || card) : card;

        const cardDiv = document.createElement("div");
        cardDiv.className = `redline-card rarity-${dbCard.rarity.replace(" ", "_")} ${isUndiscovered ? 'undiscovered' : ''}`;
        
        // Dynamic backdrop gradient color matching rarity
        const rarityColors = {
            "Common": "radial-gradient(circle, #2a2a2e 0%, #0c0c0e 100%)",
            "Uncommon": "radial-gradient(circle, #1b5e20 0%, #0c0c0e 100%)",
            "Special": "radial-gradient(circle, #006064 0%, #0c0c0e 100%)",
            "Rare": "radial-gradient(circle, #0d47a1 0%, #0c0c0e 100%)",
            "Very Rare": "radial-gradient(circle, #4a148c 0%, #0c0c0e 100%)",
            "Epic": "radial-gradient(circle, #880e4f 0%, #0c0c0e 100%)",
            "Legendary": "radial-gradient(circle, #e65100 0%, #0c0c0e 100%)",
            "Exotic": "radial-gradient(circle, #f57f17 0%, #0c0c0e 100%)",
            "Limited Edition": "radial-gradient(circle, #b71c1c 0%, #0c0c0e 100%)"
        };
        const bgStyle = rarityColors[dbCard.rarity] || rarityColors["Common"];

        let manufacturer = dbCard.manufacturer;
        let modelName = dbCard.name;

        // Fallback for missing or invalid manufacturer property (e.g. legacy cache)
        if (!manufacturer || manufacturer === "undefined" || manufacturer.trim() === "") {
            if (dbCard.name) {
                const nameParts = dbCard.name.split(" ");
                manufacturer = nameParts[0];
                modelName = nameParts.slice(1).join(" ");
            } else {
                manufacturer = "Unknown";
                modelName = "Vehicle";
            }
        }

        const rarityIcon = UI.getRarityIcon(dbCard.rarity);

        // Fetch card duplicate count
        const count = (typeof app !== 'undefined' && app.state && app.state.cardInventory) ? (app.state.cardInventory[dbCard.id] || 0) : 0;
        const dupeOverlay = (count > 0) ? `
            <div class="card-duplicity-tracker" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.75); border: 1px solid #00f0ff; color: #00f0ff; padding: 2px 8px; border-radius: 4px; font-family: 'Orbitron', sans-serif; font-size: 0.8rem; font-weight: bold; z-index: 5; box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);">
                x${count}
            </div>
        ` : '';

        cardDiv.innerHTML = `
            ${isNew ? '<span class="new-badge">NEW!</span>' : ''}
            <div class="card-header-row">
                <div class="card-title-group">
                    <span class="card-manufacturer">${manufacturer}</span>
                    <span class="card-model-name">${modelName}</span>
                </div>
                <div class="card-ovr-badge">${dbCard.ovr} OVR</div>
            </div>
            <div class="card-frame" style="display: flex; align-items: center; justify-content: center; position: relative;">
                <span class="card-rarity-strip" style="z-index: 3;">${dbCard.rarity}</span>
                ${dupeOverlay}
                <div style="position: absolute; inset: 0; background: ${bgStyle}; opacity: 0.75; z-index: 0; pointer-events: none;"></div>
                <span class="card-silhouette" style="z-index: 2; font-size: 5rem; display: flex; align-items: center; justify-content: center; height: 100%; filter: drop-shadow(0 8px 15px rgba(0,0,0,0.8));">
                    ${rarityIcon}
                </span>
            </div>
            <div class="card-stats-dashboard">
                <div class="spec-cell">
                    <span class="spec-name">Top Speed</span>
                    <span class="spec-value">${dbCard.stats.top_speed} mph</span>
                </div>
                <div class="spec-cell">
                    <span class="spec-name">0-60 MPH</span>
                    <span class="spec-value">${dbCard.stats.zero_to_sixty}s</span>
                </div>
                <div class="spec-cell">
                    <span class="spec-name">Horsepower</span>
                    <span class="spec-value">${dbCard.stats.horsepower} hp</span>
                </div>
                <div class="spec-cell">
                    <span class="spec-name">1/4 Mile</span>
                    <span class="spec-value">${dbCard.stats.quarter_mile}s</span>
                </div>
            </div>
            <div class="card-footer-fields">
                <span>ID: #${dbCard.id.toUpperCase()}</span>
                <span>${dbCard.set_index} ${dbCard.set_name}</span>
            </div>
        `;
        return cardDiv;
    },

    /**
     * Resolves coin liquidation value based on rarity tier
     */
    getScrapValue(rarity) {
        const values = {
            "Common": 1,
            "Uncommon": 2,
            "Special": 3,
            "Rare": 5,
            "Very Rare": 10,
            "Epic": 20,
            "Legendary": 30,
            "Exotic": 50
        };
        return values[rarity] || 1;
    },

    getMultiplier() {
        const completedCount = (typeof app !== 'undefined' && app.state && app.state.completedPacks) ? app.state.completedPacks.length : 0;
        return Math.pow(1.02, completedCount);
    },

    getScaledScrapValue(rarity) {
        const base = UI.getScrapValue(rarity);
        return Math.ceil(base * UI.getMultiplier());
    },

    /**
     * Renders The Collection Index view (Section 1 Page 3)
     */
    renderIndex(inventory, filterPack = "all") {
        const grid = document.getElementById("index-cards-grid");
        if (!grid) return;
        grid.innerHTML = "";

        // Apply filters dynamically using PackLicenses database
        let displayList = CardDatabase;
        if (filterPack !== "all") {
            const targetPack = PackLicenses.find(p => p.id === filterPack);
            const targetName = targetPack ? targetPack.name : "";
            displayList = CardDatabase.filter(card => card.pack_eligibility.includes(targetName));
        }

        // Order the index by rarity (least rare top, most rare bottom)
        const rarityValues = {
            "Common": 1,
            "Uncommon": 2,
            "Special": 3,
            "Rare": 4,
            "Very Rare": 5,
            "Epic": 6,
            "Legendary": 7,
            "Exotic": 8
        };
        displayList = [...displayList].sort((a, b) => {
            const valA = rarityValues[a.rarity] || 99;
            const valB = rarityValues[b.rarity] || 99;
            return valA - valB;
        });

        // Calculate metrics relative to the current displayList (filtered or global)
        const totalCards = displayList.length;
        const discoveredCount = displayList.filter(card => card.discovered).length;
        const completionRatio = document.getElementById("completion-ratio");
        const completionFill = document.getElementById("completion-fill");

        if (completionRatio) {
            completionRatio.textContent = `${discoveredCount}/${totalCards}`;
        }
        if (completionFill) {
            const pct = totalCards > 0 ? (discoveredCount / totalCards) * 100 : 0;
            completionFill.style.width = `${pct}%`;
        }

        // Update active scrap multiplier display in controls header
        const multDisplay = document.getElementById("scrap-multiplier-display");
        if (multDisplay) {
            const completedCount = (typeof app !== 'undefined' && app.state && app.state.completedPacks) ? app.state.completedPacks.length : 0;
            const currentMult = Math.pow(1.02, completedCount);
            multDisplay.textContent = `Multiplier: ${currentMult.toFixed(2)}x`;
            if (completedCount > 0) {
                multDisplay.style.color = "#00f0ff";
                multDisplay.style.borderColor = "#00f0ff";
                multDisplay.style.background = "rgba(0, 240, 255, 0.1)";
                multDisplay.style.boxShadow = "0 0 8px rgba(0, 240, 255, 0.3)";
            } else {
                multDisplay.style.color = "#71717a";
                multDisplay.style.borderColor = "rgba(113, 113, 122, 0.25)";
                multDisplay.style.background = "rgba(39, 39, 42, 0.6)";
                multDisplay.style.boxShadow = "none";
            }
        }

        // Calculate potential bulk scrap yield across the entire collection (independent of current pack filters)
        let totalRawBulkYield = 0;
        CardDatabase.forEach(c => {
            const count = (typeof app !== 'undefined' && app.state && app.state.cardInventory) ? (app.state.cardInventory[c.id] || 0) : 0;
            if (count > 1) {
                const dupes = count - 1;
                totalRawBulkYield += dupes * UI.getScrapValue(c.rarity);
            }
        });
        const multiplier = UI.getMultiplier();
        const totalBulkYield = Math.ceil(totalRawBulkYield * multiplier);

        const yieldTextNode = document.getElementById("bulk-scrap-yield");
        if (yieldTextNode) {
            if (totalRawBulkYield > 0 && multiplier > 1.0) {
                yieldTextNode.innerHTML = `(+ <span style="color: #a1a1aa;">🪙 ${totalRawBulkYield}</span> ➔ <span style="color: #2ecc71; text-shadow: 0 0 8px rgba(46, 204, 113, 0.4); font-weight: 800;">🪙 ${totalBulkYield}</span>)`;
            } else {
                yieldTextNode.innerHTML = `(+🪙 ${totalBulkYield} Coins)`;
            }
        }
        
        const bulkScrapBtn = document.getElementById("btn-bulk-scrap");
        if (bulkScrapBtn) {
            if (totalBulkYield > 0) {
                bulkScrapBtn.disabled = false;
                bulkScrapBtn.style.opacity = "1";
                bulkScrapBtn.style.cursor = "pointer";
            } else {
                bulkScrapBtn.disabled = true;
                bulkScrapBtn.style.opacity = "0.4";
                bulkScrapBtn.style.cursor = "not-allowed";
            }
        }

        displayList.forEach(card => {
            const count = (typeof app !== 'undefined' && app.state && app.state.cardInventory) ? (app.state.cardInventory[card.id] || 0) : 0;
            
            const cardWrapper = document.createElement("div");
            cardWrapper.className = "index-card-container";
            cardWrapper.style.display = "flex";
            cardWrapper.style.flexDirection = "column";
            cardWrapper.style.alignItems = "center";
            cardWrapper.style.gap = "0.75rem";
            cardWrapper.style.width = "290px";
            
            const cardDOM = UI.createCardDOM(card, !card.discovered, false);
            cardWrapper.appendChild(cardDOM);
            
            if (count >= 1) {
                const baseScrapValue = UI.getScrapValue(card.rarity);
                const multiplier = UI.getMultiplier();
                const scrapValue = UI.getScaledScrapValue(card.rarity);
                const scrapBtn = document.createElement("button");
                scrapBtn.className = "cta-btn secondary-btn";
                scrapBtn.style.padding = "0.5rem 1rem";
                scrapBtn.style.fontSize = "0.85rem";
                scrapBtn.style.width = "100%";
                if (multiplier > 1.0) {
                    scrapBtn.innerHTML = `♻️ Scrap: <span style="color: #a1a1aa;">🪙 ${baseScrapValue}</span> ➔ <span style="color: #2ecc71; font-weight: 800; text-shadow: 0 0 6px rgba(46, 204, 113, 0.4);">🪙 ${scrapValue}</span>`;
                } else {
                    scrapBtn.innerHTML = `♻️ Scrap (+🪙 ${scrapValue})`;
                }
                scrapBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    app.scrapCard(card.id);
                });
                cardWrapper.appendChild(scrapBtn);
            }
            
            grid.appendChild(cardWrapper);
        });
    },

    /**
     * Renders Performance Shop purchase inventory grid (Section 1 Page 4)
     */
    renderShop(packs, charms, currentCoins) {
        const licenseGrid = document.getElementById("shop-licenses-grid");
        const charmsGrid = document.getElementById("shop-charms-grid");
        const discountActive = (typeof app !== 'undefined' && app.state.discountActive);
        
        if (licenseGrid) {
            licenseGrid.innerHTML = "";
            packs.forEach(pack => {
                if (pack.id === "starter") return; // Starter is free, don't sell licenses
                
                const shopItem = document.createElement("div");
                shopItem.className = "shop-item";
                let displayPrice = pack.cost;
                let priceHtml = `🪙 ${pack.unlocked ? 'Owned' : pack.cost}`;
                if (!pack.unlocked && discountActive) {
                    displayPrice = Math.round(pack.cost * 0.9);
                    priceHtml = `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem; margin-right: 0.25rem;">🪙 ${pack.cost}</span> <span style="color: #f1c40f; font-weight: bold;">🪙 ${displayPrice}</span>`;
                }

                shopItem.innerHTML = `
                    <div class="shop-item-top">
                        <span class="shop-item-icon" style="width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">${UI.getPackCoverHTML(pack.id)}</span>
                        <h3 class="shop-item-title">${pack.name} License</h3>
                        <p class="shop-item-desc">${pack.unlocked ? 'License active. Purchase pack stock directly from Showroom.' : pack.description}</p>
                    </div>
                    <div class="shop-item-buy">
                        <span class="shop-price">${priceHtml}</span>
                        <button class="buy-btn" 
                                ${pack.unlocked || currentCoins < displayPrice ? 'disabled' : ''} 
                                onclick="app.buyPackLicense('${pack.id}', ${pack.cost})">
                            ${pack.unlocked ? 'Unlocked' : 'Buy License'}
                        </button>
                    </div>
                `;
                licenseGrid.appendChild(shopItem);
            });
        }

        if (charmsGrid) {
            charmsGrid.innerHTML = "";
            const charmsDisabled = (typeof app !== 'undefined' && app.state.charmsDisabledToday);
            
            charms.forEach(charm => {
                const shopItem = document.createElement("div");
                shopItem.className = "shop-item";
                let displayPrice = charm.cost;
                let priceHtml = `🪙 ${charm.cost}`;
                if (discountActive) {
                    displayPrice = Math.round(charm.cost * 0.9);
                    priceHtml = `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem; margin-right: 0.25rem;">🪙 ${charm.cost}</span> <span style="color: #f1c40f; font-weight: bold;">🪙 ${displayPrice}</span>`;
                }

                shopItem.innerHTML = `
                    <div class="shop-item-top">
                        <span class="shop-item-icon">${charm.icon}</span>
                        <h3 class="shop-item-title">${charm.name}</h3>
                        <p class="shop-item-desc">${charm.description}</p>
                    </div>
                    <div class="shop-item-buy">
                        <span class="shop-price">${priceHtml}</span>
                        <button class="buy-btn" 
                                ${currentCoins < displayPrice || charmsDisabled ? 'disabled' : ''} 
                                onclick="app.buyCharm('${charm.id}', ${charm.cost})">
                            ${charmsDisabled ? '🚫 Locked' : 'Purchase'}
                        </button>
                    </div>
                `;
                charmsGrid.appendChild(shopItem);
            });
        }
    },

    /**
     * Executes cinematic pack ripping animations in the Garage Bay (Section 1 Page 2)
     */
    triggerPackRipAnimation(cardsYield, onAnimationComplete) {
        const packWrapper = document.getElementById("pack-wrapper");
        const activePackArt = document.getElementById("active-pack-art");
        const revealContainer = document.getElementById("reveal-container");
        const revealedRow = document.getElementById("revealed-cards-row");
        const collectBtn = document.getElementById("btn-collect-exit");
        const revealAllBtn = document.getElementById("btn-reveal-all");

        if (!packWrapper || !activePackArt) return;

        // 1. Play physics-aligned package-tearing rendering events (Tear upper & lower section)
        activePackArt.classList.add("tear-top");
        
        // Play physical shake impact
        document.getElementById("garage-canvas-container").classList.add("screen-shake");
        setTimeout(() => {
            document.getElementById("garage-canvas-container").classList.remove("screen-shake");
        }, 500);

        setTimeout(() => {
            // Hide tearing wrapper and show cards grid
            packWrapper.classList.add("hidden");
            activePackArt.classList.remove("tear-top");
            revealContainer.classList.remove("hidden");
            revealedRow.innerHTML = "";
            collectBtn.classList.add("hidden");
            if (revealAllBtn) {
                revealAllBtn.classList.remove("hidden");
            }

            // 2. Tap-to-flip presentation setup
            let flippedCount = 0;
            const promptText = document.querySelector(".reveal-prompt-text");
            if (promptText) promptText.classList.remove("hidden");

            cardsYield.forEach((card, index) => {
                // Wrap card in 3D flipping container
                const wrapper = document.createElement("div");
                wrapper.className = "revealed-card-wrapper";
                wrapper.style.cursor = "pointer";
                
                const backFace = document.createElement("div");
                backFace.className = "card-face card-back";
                backFace.innerHTML = `<span class="card-back-logo">REDLINE</span>`;
                
                const frontFace = UI.createCardDOM(card, false, card.isNew);
                frontFace.className += " card-face";

                wrapper.appendChild(frontFace);
                wrapper.appendChild(backFace);
                revealedRow.appendChild(wrapper);

                // Add manual click listener to trigger flip
                wrapper.addEventListener("click", () => {
                    if (!wrapper.classList.contains("flipped")) {
                        wrapper.classList.add("flipped");
                        flippedCount++;
                        
                        // Trigger emission particle bursts matching specific rarity
                        UI.triggerRarityEmissionFX(wrapper, card.rarity);
                        
                        // Award discovery coins if applicable
                        if (card.awardDiscoveryCoins) {
                            app.awardDiscoveryReward(card.id);
                        }
                        
                        // Show collect button only when all cards have been flipped
                        if (flippedCount === cardsYield.length) {
                            if (promptText) promptText.classList.add("hidden");
                            if (revealAllBtn) revealAllBtn.classList.add("hidden");
                            collectBtn.classList.remove("hidden");
                        }
                    }
                });
            });

            // Bind click to Reveal All button to flip everything at once
            if (revealAllBtn) {
                revealAllBtn.onclick = () => {
                    const wrappers = revealedRow.querySelectorAll(".revealed-card-wrapper");
                    wrappers.forEach(w => {
                        if (!w.classList.contains("flipped")) {
                            w.click();
                        }
                    });
                    revealAllBtn.classList.add("hidden");
                };
            }

            if (onAnimationComplete) onAnimationComplete();

        }, 850);
    },

    /**
     * Emits digital neon particles on card flip
     */
    triggerRarityEmissionFX(cardWrapper, rarity) {
        const particleColors = {
            "Common": "#a1a1aa",
            "Uncommon": "#4caf50",
            "Special": "#00bcd4",
            "Rare": "#2196f3",
            "Very Rare": "#9c27b0",
            "Epic": "#e91e63",
            "Legendary": "#ff9800",
            "Exotic": "#ffd700",
            "Limited Edition": "#ff003c"
        };
        const color = particleColors[rarity] || "#ffffff";
        
        // Spawn 20 particle nodes floating outward
        const count = ["Legendary", "Exotic", "Limited Edition"].includes(rarity) ? 40 : 15;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "glow-particle";
            
            // Random direction vectors
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 120;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Set styles dynamically
            particle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${4 + Math.random() * 6}px;
                height: ${4 + Math.random() * 6}px;
                background-color: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10;
                box-shadow: 0 0 10px ${color};
                transform: translate(-50%, -50%);
                transition: transform 0.8s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.8s ease-out;
            `;
            
            cardWrapper.appendChild(particle);
            
            // Force reflow and animate
            requestAnimationFrame(() => {
                particle.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.1)`;
                particle.style.opacity = "0";
            });

            // Cleanup
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    },

    /**
     * Draws the daily spin wheel canvas graphics
     */
    drawSpinWheel() {
        const canvas = document.getElementById("spin-wheel-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const size = canvas.width;
        const center = size / 2;
        const radius = center - 5;
        
        ctx.clearRect(0, 0, size, size);

        const sectors = [
            { label: "+10 Coins", color: "#18181b", textColor: "#2ecc71" },
            { label: "+25 Coins", color: "#27272a", textColor: "#2ecc71" },
            { label: "+50 Coins", color: "#18181b", textColor: "#2ecc71" },
            { label: "Fuel Mult.", color: "#27272a", textColor: "#e67e22" },
            { label: "Double Down", color: "#18181b", textColor: "#e74c3c" },
            { label: "+10 & Spin", color: "#27272a", textColor: "#3498db" },
            { label: "Free Rip", color: "#18181b", textColor: "#e67e22" },
            { label: "Lucky Redline", color: "#27272a", textColor: "#ff2a2a" },
            { label: "Tax-Exempt", color: "#18181b", textColor: "#00f0ff" },
            { label: "10% Off", color: "#27272a", textColor: "#f1c40f" },
            { label: "Magnet", color: "#18181b", textColor: "#9b59b6" },
            { label: "Fuel Leak", color: "#e74c3c", textColor: "#ffffff" }
        ];

        const numSectors = sectors.length;
        const arc = Math.PI * 2 / numSectors;

        for (let i = 0; i < numSectors; i++) {
            const angle = i * arc;
            ctx.beginPath();
            ctx.fillStyle = sectors[i].color;
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arc);
            ctx.lineTo(center, center);
            ctx.fill();

            // Border stroke
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Text drawing
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = sectors[i].textColor;
            ctx.font = "900 11px 'Orbitron', sans-serif";
            ctx.fillText(sectors[i].label, radius - 15, 0);
            ctx.restore();
        }

        // Draw outer ring border
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 3;
        ctx.stroke();
    },

    /**
     * Renders the Garage Inventory view
     */
    renderInventory() {
        const charmsGrid = document.getElementById("inventory-charms-grid");
        const ticketsGrid = document.getElementById("inventory-tickets-grid");
        
        if (charmsGrid) {
            charmsGrid.innerHTML = "";
            const charms = (typeof app !== 'undefined' && app.state) ? (app.state.charmsInventory || []) : [];
            if (charms.length === 0) {
                charmsGrid.innerHTML = `<p class="empty-text" style="color: var(--text-muted); grid-column: 1/-1; text-align: center; font-style: italic; padding: 2rem;">No Luck Charms in storage.</p>`;
            } else {
                charms.forEach((charm, index) => {
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">${charm.icon}</span>
                            <h3 class="shop-item-title">${charm.name}</h3>
                            <p class="shop-item-desc">${charm.description}</p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn glow-btn" onclick="app.activateCharm(${index})" style="width: 100%;">
                                Equip & Activate
                            </button>
                        </div>
                    `;
                    charmsGrid.appendChild(item);
                });
            }
        }
        
        if (ticketsGrid) {
            ticketsGrid.innerHTML = "";
            const t = (typeof app !== 'undefined' && app.state && app.state.ticketsInventory) ? app.state.ticketsInventory : {};
            const discountCount = t.discount || 0;
            const freeRipCount = t.freeRip || 0;
            const taxExemptionCount = t.taxExemption || 0;
            const fuelMultiplierCount = t.fuelMultiplier || 0;
            const doubleDownCount = t.doubleDown || 0;
            
            if (discountCount === 0 && freeRipCount === 0 && taxExemptionCount === 0 && fuelMultiplierCount === 0 && doubleDownCount === 0) {
                ticketsGrid.innerHTML = `<p class="empty-text" style="color: var(--text-muted); grid-column: 1/-1; text-align: center; font-style: italic; padding: 2rem;">No utility tickets in storage.</p>`;
            } else {
                if (discountCount > 0) {
                    const discountActive = app.state.discountActive;
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">🏷️</span>
                            <h3 class="shop-item-title">10% Off Shop Ticket</h3>
                            <p class="shop-item-desc">Apply 10% off to your next Performance Shop purchase. Quantity: <strong>x${discountCount}</strong></p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn ${discountActive ? 'active-ticket-btn' : ''}" onclick="app.toggleDiscountTicket()" style="width: 100%; ${discountActive ? 'background: #f1c40f; color: #000; box-shadow: 0 0 10px #f1c40f;' : ''}">
                                ${discountActive ? 'ACTIVE (Click to Deactivate)' : 'Activate Ticket'}
                            </button>
                        </div>
                    `;
                    ticketsGrid.appendChild(item);
                }
                
                if (freeRipCount > 0) {
                    const freeRipActive = app.state.freePackRip;
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">🎫</span>
                            <h3 class="shop-item-title">Free Pack Rip Ticket</h3>
                            <p class="shop-item-desc">Rip open any card pack in the Showroom for free. Quantity: <strong>x${freeRipCount}</strong></p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn ${freeRipActive ? 'active-ticket-btn' : ''}" onclick="app.toggleFreeRipTicket()" style="width: 100%; ${freeRipActive ? 'background: #e67e22; color: #fff; box-shadow: 0 0 10px #e67e22;' : ''}">
                                ${freeRipActive ? 'ACTIVE (Click to Deactivate)' : 'Activate Ticket'}
                            </button>
                        </div>
                    `;
                    ticketsGrid.appendChild(item);
                }

                if (taxExemptionCount > 0) {
                    const taxExemptionActive = app.state.taxExemptionActive;
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">🎫</span>
                            <h3 class="shop-item-title">Tax-Exemption Permit</h3>
                            <p class="shop-item-desc">Completely waive the pack opening fee for your next single roll. Quantity: <strong>x${taxExemptionCount}</strong></p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn ${taxExemptionActive ? 'active-ticket-btn' : ''}" onclick="app.toggleTaxExemptionTicket()" style="width: 100%; ${taxExemptionActive ? 'background: #00f0ff; color: #000; box-shadow: 0 0 10px #00f0ff;' : ''}">
                                ${taxExemptionActive ? 'ACTIVE (Click to Deactivate)' : 'Activate Ticket'}
                            </button>
                        </div>
                    `;
                    ticketsGrid.appendChild(item);
                }

                if (fuelMultiplierCount > 0) {
                    const fuelMultiplierActiveCount = app.state.fuelMultiplierCount || 0;
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">🔥</span>
                            <h3 class="shop-item-title">Fuel Multiplier</h3>
                            <p class="shop-item-desc">Double the Coin reward for the next 3 new vehicles discovered. Quantity: <strong>x${fuelMultiplierCount}</strong></p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn ${fuelMultiplierActiveCount > 0 ? 'active-ticket-btn' : ''}" onclick="app.activateFuelMultiplier()" style="width: 100%; ${fuelMultiplierActiveCount > 0 ? 'background: #e67e22; color: #fff; box-shadow: 0 0 10px #e67e22;' : ''}">
                                ${fuelMultiplierActiveCount > 0 ? `ACTIVE (${fuelMultiplierActiveCount} discoveries left)` : 'Activate Ticket'}
                            </button>
                        </div>
                    `;
                    ticketsGrid.appendChild(item);
                }

                if (doubleDownCount > 0) {
                    const doubleDownActive = app.state.doubleDownActive;
                    const item = document.createElement("div");
                    item.className = "shop-item";
                    item.innerHTML = `
                        <div class="shop-item-top">
                            <span class="shop-item-icon">🪙</span>
                            <h3 class="shop-item-title">Double Down Token</h3>
                            <p class="shop-item-desc">Instantly duplicates all card drops fetched on your next pack pull. Quantity: <strong>x${doubleDownCount}</strong></p>
                        </div>
                        <div class="shop-item-buy">
                            <button class="buy-btn ${doubleDownActive ? 'active-ticket-btn' : ''}" onclick="app.toggleDoubleDownTicket()" style="width: 100%; ${doubleDownActive ? 'background: #e74c3c; color: #fff; box-shadow: 0 0 10px #e74c3c;' : ''}">
                                ${doubleDownActive ? 'ACTIVE (Click to Deactivate)' : 'Activate Ticket'}
                            </button>
                        </div>
                    `;
                    ticketsGrid.appendChild(item);
                }
            }
        }
    },

    /**
     * Renders the News & Event spotlight view
     */
    renderNewsroom() {
        const newsFeed = document.getElementById("newsroom-feed");
        const activeEventsContainer = document.getElementById("active-events-container");
        
        if (newsFeed) {
            const newsArticles = [
                {
                    title: "🚀 Update v1.2: Dynamic Scrap Economy & Inventory Canvas",
                    date: "2026-06-14",
                    content: "Major changes have arrived! You can now liquidate duplicate cards directly from the Index page. We also introduced the Driver's Handbook onboarding framework, and the secure Inventory canvas to store your won/purchased modifiers."
                },
                {
                    title: "⚖️ Balance Update: Charm Prices & Drop Rate Shifts",
                    date: "2026-06-10",
                    content: "Legendary and Exotic Luck Charms are now more expensive to mirror their massive utility. In addition, the Universal Magnet Charm now only skews RNG for Very Rare and below tiers to keep high-end pulls ultra competitive."
                },
                {
                    title: "🏁 Launch Day: Welcome to Redline TCG",
                    date: "2026-06-01",
                    content: "Get ready to experience the ultimate high-octane dark-mode web TCG. Collect over 400 real-spec cars, buy licenses, equip luck charms, and chase 100% catalog completion!"
                }
            ];
            
            newsFeed.innerHTML = newsArticles.map(article => `
                <div class="news-card" style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.15); transition: border-color 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 style="color: #00f0ff; margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.1rem;">${article.title}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: 'Outfit', sans-serif;">${article.date}</span>
                    </div>
                    <p style="color: var(--text-muted); margin: 0; font-family: 'Outfit', sans-serif; font-size: 0.95rem; line-height: 1.5;">${article.content}</p>
                </div>
            `).join("");
        }
        
        if (activeEventsContainer) {
            activeEventsContainer.innerHTML = "";
            let activeEventsCount = 0;
            
            if (MathEngine.isEaster()) {
                activeEventsCount++;
                activeEventsContainer.innerHTML += `
                    <div class="event-tile" style="background: linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, rgba(46, 125, 50, 0.05) 100%); border: 1px solid #2e7d32; border-radius: 8px; padding: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 0 15px rgba(46, 125, 50, 0.3);">
                        <div style="font-size: 2rem;">🐰</div>
                        <div style="flex: 1;">
                            <h4 style="color: #4caf50; margin: 0 0 0.25rem 0; font-family: 'Orbitron', sans-serif;">Easter Luck Boost Active!</h4>
                            <p style="color: var(--text-muted); margin: 0; font-family: 'Outfit', sans-serif; font-size: 0.85rem; line-height: 1.4;">Standard Packs yield +3% flat global Luck shift to Epic/Legendary/Exotic rarities today.</p>
                        </div>
                    </div>
                `;
            }
            
            if (MathEngine.isHalloweenWeek()) {
                activeEventsCount++;
                activeEventsContainer.innerHTML += `
                    <div class="event-tile" style="background: linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(230, 126, 34, 0.05) 100%); border: 1px solid #e67e22; border-radius: 8px; padding: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 0 15px rgba(230, 126, 34, 0.3);">
                        <div style="font-size: 2rem;">🎃</div>
                        <div style="flex: 1;">
                            <h4 style="color: #e67e22; margin: 0 0 0.25rem 0; font-family: 'Orbitron', sans-serif;">Halloween Event Week Active!</h4>
                            <p style="color: var(--text-muted); margin: 0; font-family: 'Outfit', sans-serif; font-size: 0.85rem; line-height: 1.4;">Stay tuned for spooky vehicle sets and performance shop items.</p>
                        </div>
                    </div>
                `;
            }
            
            if (activeEventsCount === 0) {
                activeEventsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); font-style: italic; padding: 1.5rem; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; font-family: 'Outfit', sans-serif;">
                        No live operations events active right now. Check back during holidays!
                    </div>
                `;
            }
        }
    },

    renderQuests() {
        const dailyContainer = document.getElementById("daily-quests-container");
        const weeklyContainer = document.getElementById("weekly-quests-container");
        
        if (!dailyContainer || !weeklyContainer || typeof app === 'undefined') return;
        
        dailyContainer.innerHTML = "";
        weeklyContainer.innerHTML = "";
        
        const renderQuestList = (quests, container, type) => {
            quests.forEach(quest => {
                const pct = quest.claimed ? 100 : Math.min(100, Math.floor((quest.progress / quest.target) * 100));
                const isReady = quest.progress >= quest.target && !quest.claimed;
                
                let cardClass = "quest-card";
                if (isReady) cardClass += " ready-to-claim";
                if (quest.claimed) cardClass += " claimed";
                
                let barClass = "quest-progress-fill";
                if (quest.claimed) barClass += " completed";
                
                let btnClass = "quest-action-btn";
                let btnText = "Claim";
                let btnDisabled = false;
                
                if (quest.claimed) {
                    btnClass += " claimed-state";
                    btnText = "✓";
                    btnDisabled = true;
                } else if (isReady) {
                    btnClass += " ready";
                } else {
                    btnClass += " locked";
                    btnDisabled = true;
                }
                
                const cardHTML = `
                    <div class="${cardClass}">
                        <div class="quest-header">
                            <div class="quest-title">${quest.text}</div>
                            <div class="quest-reward">🪙 +${quest.reward}</div>
                        </div>
                        <div class="quest-progress-container">
                            <div class="quest-progress-label">
                                <span>Progress</span>
                                <span>${quest.progress}/${quest.target} (${pct}%)</span>
                            </div>
                            <div class="quest-progress-bg">
                                <div class="${barClass}" style="width: ${pct}%;"></div>
                            </div>
                        </div>
                        <button class="${btnClass}" ${btnDisabled ? 'disabled' : ''} onclick="app.claimQuestReward('${quest.id}', '${type}')">
                            ${btnText}
                        </button>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        };
        
        renderQuestList(app.state.dailyQuests, dailyContainer, 'daily');
        renderQuestList(app.state.weeklyQuests, weeklyContainer, 'weekly');
    },

    /**
     * Renders the simulated P2P Trading System Terminal
     */
    renderTradeTerminal() {
        const container = document.getElementById("trade-terminal-content");
        if (!container) return;

        const session = (typeof app !== 'undefined' && app.tradeSession) ? app.tradeSession : null;

        if (!session || !session.active) {
            // Render Connection Screen
            container.innerHTML = `
                <div class="trade-conn-card" style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 2rem; max-width: 600px; margin: 2rem auto; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.4));">📡</div>
                    <h2 style="font-family: 'Orbitron', sans-serif; margin-bottom: 0.5rem; color: #fff;">P2P Secure Connection Staging</h2>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Enter a Peer User ID to open a synchronous trading session. Duplicate cards only will be available for trading.</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center; width: 100%;">
                        <input type="text" id="trade-peer-id" placeholder="Enter peer User ID (e.g. Racer_X, Drift_King)..." 
                               style="width: 100%; max-width: 400px; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.3); color: #fff; font-family: 'Outfit', sans-serif; font-size: 1rem; text-align: center; outline: none; transition: border-color 0.3s;"
                               onkeydown="if(event.key === 'Enter') app.startTradeSession()">
                        
                        <button class="cta-btn glow-btn" onclick="app.startTradeSession()" style="font-size: 1.05rem; padding: 0.75rem 2rem;">Establish Connection</button>
                    </div>

                    <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
                        <h4 style="font-family: 'Orbitron', sans-serif; color: var(--text-secondary); font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.75rem;">Rival Presets</h4>
                        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                            <button onclick="document.getElementById('trade-peer-id').value='Racer_X'; app.startTradeSession()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-family: 'Orbitron', sans-serif;">🏁 Racer_X</button>
                            <button onclick="document.getElementById('trade-peer-id').value='Drift_King'; app.startTradeSession()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-family: 'Orbitron', sans-serif;">🔥 Drift_King</button>
                            <button onclick="document.getElementById('trade-peer-id').value='ApexPredator'; app.startTradeSession()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-family: 'Orbitron', sans-serif;">⚡ ApexPredator</button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Render Active Trade Room
        // 1. Calculate values
        let p1Val = session.p1CoinsOffered;
        for (const cardId in session.p1CardsOffered) {
            const card = CardDatabase.find(c => c.id === cardId);
            if (card) {
                p1Val += session.p1CardsOffered[cardId] * UI.getScrapValue(card.rarity);
            }
        }

        let p2Val = session.p2CoinsOffered;
        for (const cardId in session.p2CardsOffered) {
            const card = CardDatabase.find(c => c.id === cardId);
            if (card) {
                p2Val += session.p2CardsOffered[cardId] * UI.getScrapValue(card.rarity);
            }
        }

        const maxVal = Math.max(p1Val, p2Val);
        const diff = Math.abs(p1Val - p2Val);
        const variance = maxVal === 0 ? 0 : (diff / maxVal);
        const variancePct = (variance * 100).toFixed(1);
        const isBalanced = maxVal === 0 ? true : (variance <= 0.20);

        // Render staging views
        // Helper to render offered items
        const renderOfferedListHTML = (cardsOffered, playerNum) => {
            let html = "";
            for (const cardId in cardsOffered) {
                const card = CardDatabase.find(c => c.id === cardId);
                if (card) {
                    const qty = cardsOffered[cardId];
                    const scrapVal = UI.getScrapValue(card.rarity);
                    html += `
                        <div class="staged-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 0.4rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.85rem; font-weight: bold; color: #fff;">${card.name}</span>
                                <span style="font-size: 0.7rem; color: #a1a1aa; background: rgba(255,255,255,0.08); padding: 0.1rem 0.35rem; border-radius: 4px;">x${qty}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.75rem; color: #ff9800; font-family: 'Orbitron', sans-serif;">♻️ ${scrapVal * qty} Scrap</span>
                                ${!(playerNum === 1 ? session.p1Locked : session.p2Locked) ? `
                                    <button onclick="app.removeCardFromTrade(${playerNum}, '${cardId}')" style="background: transparent; border: none; color: #ff3e3e; font-size: 1rem; cursor: pointer; padding: 0 0.2rem;">✕</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            }
            if (html === "") {
                html = `<div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem;">No cards offered yet</div>`;
            }
            return html;
        };

        // Helper to render live inventories of owned cards
        const renderInventoryHTML = (inventory, playerNum) => {
            let html = "";
            for (const cardId in inventory) {
                const count = inventory[cardId];
                if (count >= 1) { // Any owned card can be offered
                    const card = CardDatabase.find(c => c.id === cardId);
                    if (card) {
                        const offeredQty = (playerNum === 1 ? session.p1CardsOffered[cardId] : session.p2CardsOffered[cardId]) || 0;
                        const availableQty = count - offeredQty;
                        if (availableQty > 0) {
                            html += `
                                <div onclick="app.addCardToTrade(${playerNum}, '${card.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 0.4rem; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 0.8rem; font-weight: bold;">${card.name}</span>
                                        <span style="font-size: 0.65rem; color: #00f0ff; border: 1px solid rgba(0,240,255,0.2); padding: 0.05rem 0.25rem; border-radius: 4px;">Qty (x${availableQty})</span>
                                    </div>
                                    <span style="font-size: 0.72rem; color: #ff9800; font-family: 'Orbitron', sans-serif;">♻️ ${UI.getScrapValue(card.rarity)} Value</span>
                                </div>
                            `;
                        }
                    }
                }
            }
            if (html === "") {
                html = `<div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem;">No cards available to trade</div>`;
            }
            return html;
        };

        // Construct P1 inventory object from main state
        const p1Inventory = {};
        for (const cardId in app.state.cardInventory) {
            p1Inventory[cardId] = app.state.cardInventory[cardId];
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--border-main); border-radius: 8px; padding: 0.75rem 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.25rem;">🤝</span>
                    <span style="font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 0.95rem; color: #fff;">Live Trading Session: <span style="color: #00f0ff;">${session.peerId}</span></span>
                </div>
                <button class="cta-btn secondary-btn" onclick="app.cancelTradeSession()" style="padding: 0.35rem 1rem; font-size: 0.8rem; border-color: #ff3e3e; color: #ff3e3e; background: transparent;">Terminate Session</button>
            </div>

            <!-- Staging Split Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                
                <!-- Player 1 Staging Box -->
                <div style="background: var(--bg-card); border: 2px solid ${session.p1Locked ? 'rgba(46, 204, 113, 0.4)' : 'var(--border-main)'}; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: ${session.p1Locked ? '0 0 15px rgba(46, 204, 113, 0.15)' : 'none'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem;">
                        <h3 style="font-family: 'Orbitron', sans-serif; font-size: 0.9rem; color: #fff; margin: 0;">YOU (Player 1)</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: 'Orbitron', sans-serif;">🪙 Balance: ${app.state.coins}</span>
                    </div>

                    <!-- Lock Offer Action -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem 0.75rem; border-radius: 8px;">
                        <span style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; font-weight: bold; color: ${session.p1Locked ? '#2ecc71' : '#a1a1aa'};">
                            Status: ${session.p1Locked ? '🔒 LOCKED' : '🔓 OPEN'}
                        </span>
                        <button onclick="app.toggleLockP1()" style="padding: 0.3rem 0.75rem; border-radius: 6px; border: 1px solid ${session.p1Locked ? '#ff9800' : '#2ecc71'}; background: ${session.p1Locked ? 'rgba(255, 152, 0, 0.1)' : 'rgba(46, 204, 113, 0.1)'}; color: ${session.p1Locked ? '#ff9800' : '#2ecc71'}; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                            ${session.p1Locked ? 'Unlock Offer' : 'Lock Offer'}
                        </button>
                    </div>

                    <!-- Coin Injection -->
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        <label style="font-family: 'Orbitron', sans-serif; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Inject Coins</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.1rem;">🪙</span>
                            <input type="number" id="trade-p1-coins-input" value="${session.p1CoinsOffered}" min="0" max="${app.state.coins - 5}" 
                                   style="flex: 1; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.3); color: #fff; outline: none; font-family: 'Orbitron', sans-serif; font-size: 0.85rem;"
                                   ${session.p1Locked ? 'disabled' : ''}
                                   onchange="app.updateTradeP1Coins(this.value)">
                        </div>
                    </div>

                    <!-- Staged Staging Area -->
                    <div>
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Staged Cards</h4>
                        <div style="max-height: 150px; overflow-y: auto; padding-right: 0.25rem;">
                            ${renderOfferedListHTML(session.p1CardsOffered, 1)}
                        </div>
                    </div>

                    <!-- Live inventory duplicates -->
                    <div style="border-top: 1px solid var(--border-main); padding-top: 1rem; margin-top: auto;">
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Your Duplicate Cards (Click to stage)</h4>
                        <div style="max-height: 200px; overflow-y: auto; padding-right: 0.25rem;">
                            ${session.p1Locked ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem 0;">Offer locked. Cannot add items.</div>` : renderInventoryHTML(p1Inventory, 1)}
                        </div>
                    </div>
                </div>

                <!-- Player 2 Staging Box -->
                <div style="background: var(--bg-card); border: 2px solid ${session.p2Locked ? 'rgba(46, 204, 113, 0.4)' : 'var(--border-main)'}; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: ${session.p2Locked ? '0 0 15px rgba(46, 204, 113, 0.15)' : 'none'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem;">
                        <h3 style="font-family: 'Orbitron', sans-serif; font-size: 0.9rem; color: #fff; margin: 0;">${session.peerId.toUpperCase()}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: 'Orbitron', sans-serif;">🪙 Balance: ${session.peerCoins}</span>
                    </div>

                    <!-- Lock Offer Action -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem 0.75rem; border-radius: 8px;">
                        <span style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; font-weight: bold; color: ${session.p2Locked ? '#2ecc71' : '#a1a1aa'};">
                            Status: ${session.p2Locked ? '🔒 LOCKED' : '🔓 OPEN'}
                        </span>
                        <button onclick="app.toggleLockP2()" style="padding: 0.3rem 0.75rem; border-radius: 6px; border: 1px solid ${session.p2Locked ? '#ff9800' : '#2ecc71'}; background: ${session.p2Locked ? 'rgba(255, 152, 0, 0.1)' : 'rgba(46, 204, 113, 0.1)'}; color: ${session.p2Locked ? '#ff9800' : '#2ecc71'}; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                            ${session.p2Locked ? 'Unlock Offer' : 'Lock Offer'}
                        </button>
                    </div>

                    <!-- Coin Injection -->
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        <label style="font-family: 'Orbitron', sans-serif; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Inject Coins</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.1rem;">🪙</span>
                            <input type="number" id="trade-p2-coins-input" value="${session.p2CoinsOffered}" min="0" max="${session.peerCoins}" 
                                   style="flex: 1; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.3); color: #fff; outline: none; font-family: 'Orbitron', sans-serif; font-size: 0.85rem;"
                                   ${session.p2Locked ? 'disabled' : ''}
                                   onchange="app.updateTradeP2Coins(this.value)">
                        </div>
                    </div>

                    <!-- Staged Staging Area -->
                    <div>
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Staged Cards</h4>
                        <div style="max-height: 150px; overflow-y: auto; padding-right: 0.25rem;">
                            ${renderOfferedListHTML(session.p2CardsOffered, 2)}
                        </div>
                    </div>

                    <!-- Live inventory duplicates -->
                    <div style="border-top: 1px solid var(--border-main); padding-top: 1rem; margin-top: auto;">
                        <h4 style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Duplicate Cards (Click to stage)</h4>
                        <div style="max-height: 200px; overflow-y: auto; padding-right: 0.25rem;">
                            ${session.p2Locked ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem 0;">Offer locked. Cannot add items.</div>` : renderInventoryHTML(session.peerInventory, 2)}
                        </div>
                    </div>
                </div>

            </div>

            <!-- Valuation & Confirmation Panel -->
            <div style="background: rgba(18, 18, 22, 0.9); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <h3 style="font-family: 'Orbitron', sans-serif; font-size: 0.95rem; color: #fff; margin: 0; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem;">ECONOMY PROTECTION & VALUATION SYSTEM</h3>
                
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 2rem; padding: 0.5rem 0;">
                    <div>
                        <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Player 1 Total Valuation</div>
                        <div style="font-size: 1.5rem; font-weight: 900; color: #ff9800; font-family: 'Orbitron', sans-serif; margin-top: 0.25rem;">♻️ ${p1Val} Value</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-family: 'Orbitron', sans-serif; margin-top: 0.15rem;">🪙 ${session.p1CoinsOffered} Coins offered</div>
                    </div>
                    
                    <div>
                        <div style="background: ${isBalanced ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; border: 1px solid ${isBalanced ? '#2ecc71' : '#e74c3c'}; border-radius: 8px; padding: 0.5rem 1rem;">
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Variance</div>
                            <div style="font-size: 1.25rem; font-weight: bold; color: ${isBalanced ? '#2ecc71' : '#e74c3c'}; font-family: 'Orbitron', sans-serif; margin-top: 0.1rem;">${variancePct}%</div>
                        </div>
                    </div>

                    <div>
                        <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Player 2 Total Valuation</div>
                        <div style="font-size: 1.5rem; font-weight: 900; color: #ff9800; font-family: 'Orbitron', sans-serif; margin-top: 0.25rem;">♻️ ${p2Val} Value</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-family: 'Orbitron', sans-serif; margin-top: 0.15rem;">🪙 ${session.p2CoinsOffered} Coins offered</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.35rem; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    <span style="font-size: 0.85rem; color: ${isBalanced ? '#2ecc71' : '#e74c3c'}; font-weight: 600;">
                        ${isBalanced ? '✓ Trade is within the secure 20% variance window.' : '⚠️ Unbalanced Trade! Adjust items or inject coins to match the value deficit.'}
                    </span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">
                        A flat transaction fee of <strong style="color: #fff;">🪙 5 Coins</strong> will be deducted from your balance upon final resolution.
                    </span>
                </div>

                <div style="margin-top: 0.5rem; display: flex; justify-content: center; gap: 1rem; align-items: center;">
                    <button class="cta-btn ${session.p1Locked && session.p2Locked && isBalanced && app.state.coins >= (session.p1CoinsOffered + 5) ? 'ready' : ''}" 
                            ${!(session.p1Locked && session.p2Locked && isBalanced && app.state.coins >= (session.p1CoinsOffered + 5)) ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} 
                            onclick="app.confirmTrade()" 
                            style="font-size: 1.1rem; padding: 0.75rem 3rem; background: ${session.p1Locked && session.p2Locked && isBalanced && app.state.coins >= (session.p1CoinsOffered + 5) ? '#2ecc71' : 'rgba(255,255,255,0.05)'}; color: ${session.p1Locked && session.p2Locked && isBalanced && app.state.coins >= (session.p1CoinsOffered + 5) ? '#0c0c0e' : '#71717a'}; border: 1px solid ${session.p1Locked && session.p2Locked && isBalanced && app.state.coins >= (session.p1CoinsOffered + 5) ? '#2ecc71' : 'rgba(255,255,255,0.1)'}; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.3s;">
                        Confirm Trade
                    </button>
                </div>
            </div>
        `;
    },

    renderSettings() {
        const container = document.getElementById("settings-content");
        if (!container) return;

        // 1. Calculate general stats
        const totalCards = CardDatabase.length;
        let discoveredCards = 0;
        CardDatabase.forEach(c => {
            if (c.discovered && (app.state.cardInventory[c.id] || 0) > 0) {
                discoveredCards++;
            }
        });
        const globalDisPct = totalCards > 0 ? ((discoveredCards / totalCards) * 100).toFixed(1) : "0.0";

        // Completed packs & scrap multiplier
        const completedCount = (app.state.completedPacks || []).length;
        const currentMultiplier = Math.pow(1.02, completedCount).toFixed(2);

        // 2. Generate pack completion breakdown HTML
        let packBreakdownHTML = "";
        const sortedPacks = [...PackLicenses].sort((a, b) => a.cost - b.cost);

        sortedPacks.forEach(pack => {
            const eligible = CardDatabase.filter(c => c.pack_eligibility.includes(pack.name));
            const discovered = eligible.filter(c => c.discovered && (app.state.cardInventory[c.id] || 0) > 0).length;
            const pct = eligible.length > 0 ? Math.round((discovered / eligible.length) * 100) : 100;
            const isCompleted = app.state.completedPacks && app.state.completedPacks.includes(pack.id);

            packBreakdownHTML += `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-main); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-family: 'Orbitron', sans-serif; font-size: 0.85rem; font-weight: bold; color: #fff;">${pack.name}</span>
                        <span style="font-family: 'Orbitron', sans-serif; font-size: 0.75rem; color: ${isCompleted ? '#2ecc71' : 'var(--text-muted)'}; font-weight: bold;">
                            ${discovered} / ${eligible.length} (${pct}%) ${isCompleted ? '✓' : ''}
                        </span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: ${isCompleted ? '#2ecc71' : 'var(--neon-cyan)'}; box-shadow: ${isCompleted ? 'none' : '0 0 6px var(--neon-cyan-glow)'};"></div>
                    </div>
                </div>
            `;
        });

        // 3. Export secure cryptographically signed save data token
        const exportString = app.exportSaveToken();

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                
                <!-- Left Column: Racer Profile & Account Stats -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- Racer Profile Setting -->
                    <div style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 1rem;">
                        <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: #fff; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 0;">👤 Racer Profile</h2>
                        
                        <div style="font-size: 0.85rem; color: var(--text-secondary); padding: 0.25rem 0;">
                            Authenticated User: <strong style="color: var(--neon-cyan); font-family: 'Orbitron', sans-serif; letter-spacing: 0.5px;">${app.currentUser || 'Guest'}</strong>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                            <label style="font-family: 'Orbitron', sans-serif; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Edit Racer Display Name</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="text" id="setting-racer-name" value="${app.state.playerName || 'RedlineDriver'}" 
                                       style="flex: 1; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.3); color: #fff; font-family: 'Outfit', sans-serif; font-size: 0.9rem; outline: none;">
                                <button class="cta-btn glow-btn" onclick="app.updatePlayerName(document.getElementById('setting-racer-name').value)" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">Update</button>
                            </div>
                        </div>
                    </div>

                    <!-- Account metrics statistics -->
                    <div style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 1.25rem;">
                        <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: #fff; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 0.5rem;">📊 Global Progress Stats</h2>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px; padding: 0.75rem; text-align: center;">
                                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Catalog Discovered</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: #fff; font-family: 'Orbitron', sans-serif; margin-top: 0.25rem;">${discoveredCards} / ${totalCards}</div>
                                <div style="font-size: 0.72rem; color: var(--neon-cyan); font-weight: bold; margin-top: 0.1rem;">${globalDisPct}% Discovery</div>
                            </div>
                            
                            <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px; padding: 0.75rem; text-align: center;">
                                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Scrap Multiplier</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: #e67e22; font-family: 'Orbitron', sans-serif; margin-top: 0.25rem;">${currentMultiplier}x</div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem;">Completed: ${completedCount} packs</div>
                            </div>
                        </div>
                    </div>

                    <!-- Backup import/export system -->
                    <div style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 1rem;">
                        <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: #fff; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 0.5rem;">💾 Secure Database Backup</h2>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                            <label style="font-family: 'Orbitron', sans-serif; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Export Cryptographic Backup Token</label>
                            <textarea readonly style="width: 100%; height: 60px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.4); color: var(--text-secondary); font-family: monospace; font-size: 0.7rem; resize: none; overflow-y: auto;" onclick="this.select(); document.execCommand('copy'); app.showToast('📋 Exported signed token copied to clipboard!', 'success')">${exportString}</textarea>
                            <span style="font-size: 0.65rem; color: var(--text-muted);">Backup is cryptographically signed and salted to prevent manual modification and cheating.</span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                            <label style="font-family: 'Orbitron', sans-serif; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Import Signed Backup Token</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="text" id="setting-import-input" placeholder="Paste secure signed envelope token here..." 
                                       style="flex: 1; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-main); background: rgba(0,0,0,0.3); color: #fff; font-family: monospace; font-size: 0.75rem; outline: none;">
                                <button class="cta-btn secondary-btn" onclick="app.importSaveToken(document.getElementById('setting-import-input').value)" style="padding: 0.4rem 1rem; font-size: 0.8rem; border-color: var(--neon-cyan); color: var(--neon-cyan); background: transparent;">Import</button>
                            </div>
                        </div>

                        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; text-align: center;">
                            <button class="cta-btn" onclick="app.resetGame()" 
                                    style="padding: 0.5rem 1.5rem; font-size: 0.8rem; font-family: 'Orbitron', sans-serif; background: rgba(255,62,62,0.1); border: 1px solid #ff3e3e; color: #ff3e3e;">
                                Reset Game Progress
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Pack Discovery Completion Breakdown -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 1rem;">
                    <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: #fff; border-bottom: 1px solid var(--border-main); padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 0.5rem;">🏁 Pack completion checklist</h2>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 520px; overflow-y: auto; padding-right: 0.25rem;">
                        ${packBreakdownHTML}
                    </div>
                </div>

            </div>
        `;
    },

    /**
     * Renders high-octane authenticating login/signup overlay
     */
    renderLoginScreen() {
        const screen = document.getElementById("login-screen");
        if (!screen) return;
        
        screen.innerHTML = `
            <div class="auth-container" id="auth-box">
                <div class="auth-header">
                    <div class="auth-logo">
                        <span style="color: var(--neon-cyan)">REDLINE</span>
                        <span style="color: #fff">TCG</span>
                    </div>
                    <div class="auth-subtitle">Ignition Authentication Gate</div>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab-btn login-tab active" onclick="UI.switchLoginTab('login')">LOG IN</button>
                    <button class="auth-tab-btn signup-tab" onclick="UI.switchLoginTab('signup')">SIGN UP</button>
                </div>
                
                <div class="auth-error" id="auth-error-msg"></div>
                
                <form class="auth-form" id="auth-form" onsubmit="UI.handleAuthSubmit(event)">
                    <div class="auth-input-group">
                        <label class="auth-input-label" for="auth-username">Racer Username</label>
                        <div class="auth-input-wrapper">
                            <input type="text" id="auth-username" class="auth-input" placeholder="ENTER USERNAME" required autocomplete="username">
                        </div>
                    </div>
                    
                    <div class="auth-input-group">
                        <label class="auth-input-label" for="auth-password" id="auth-password-label">Security Key</label>
                        <div class="auth-input-wrapper">
                            <input type="password" id="auth-password" class="auth-input" placeholder="ENTER KEY / PASSWORD" required autocomplete="current-password">
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-btn login-btn" id="auth-submit-btn">Rev Engine / Log In</button>
                </form>
                
                <div class="auth-footer" id="auth-footer-text">
                    Establish secure connection to local storage profile.
                </div>
            </div>
        `;
    },

    /**
     * Switches between Log In and Sign Up tabs
     */
    switchLoginTab(mode) {
        const authBox = document.getElementById("auth-box");
        const loginTab = document.querySelector(".auth-tab-btn.login-tab");
        const signupTab = document.querySelector(".auth-tab-btn.signup-tab");
        const submitBtn = document.getElementById("auth-submit-btn");
        const passwordLabel = document.getElementById("auth-password-label");
        const footerText = document.getElementById("auth-footer-text");
        const errorMsg = document.getElementById("auth-error-msg");
        
        if (!authBox || !loginTab || !signupTab || !submitBtn) return;
        
        // Hide error message on switch
        if (errorMsg) {
            errorMsg.style.display = "none";
            errorMsg.textContent = "";
        }
        
        if (mode === 'signup') {
            authBox.classList.add("signup-mode");
            loginTab.classList.remove("active");
            signupTab.classList.add("active");
            
            submitBtn.className = "auth-btn signup-btn";
            submitBtn.textContent = "Start Ignition / Sign Up";
            if (passwordLabel) passwordLabel.textContent = "Choose Security Key / Password";
            if (footerText) footerText.textContent = "Register a new racer profile on this device.";
        } else {
            authBox.classList.remove("signup-mode");
            loginTab.classList.add("active");
            signupTab.classList.remove("active");
            
            submitBtn.className = "auth-btn login-btn";
            submitBtn.textContent = "Rev Engine / Log In";
            if (passwordLabel) passwordLabel.textContent = "Security Key";
            if (footerText) footerText.textContent = "Establish secure connection to local storage profile.";
        }
    },

    /**
     * Handles authentication form submissions
     */
    handleAuthSubmit(e) {
        e.preventDefault();
        const usernameInput = document.getElementById("auth-username");
        const passwordInput = document.getElementById("auth-password");
        const errorMsg = document.getElementById("auth-error-msg");
        
        if (!usernameInput || !passwordInput) return;
        
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        const isSignUp = document.getElementById("auth-box").classList.contains("signup-mode");
        
        if (isSignUp) {
            const success = app.signUp(username, password);
            if (!success && errorMsg) {
                errorMsg.textContent = "Registration failed! Check requirements.";
                errorMsg.style.display = "block";
            }
        } else {
            const success = app.login(username, password);
            if (!success && errorMsg) {
                errorMsg.textContent = "Access denied! Invalid credentials.";
                errorMsg.style.display = "block";
            }
        }
    },

    renderCoinStore() {
        const container = document.getElementById("coin-store-content");
        if (!container) return;
        
        let currentCurrency = localStorage.getItem("redline_tcg_currency");
        if (!currentCurrency) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes("Calcutta") || tz.includes("India") || tz.includes("Asia/Kolkata")) {
                currentCurrency = "INR";
            } else if (tz.includes("Europe") || tz.includes("Berlin") || tz.includes("Paris") || tz.includes("London") || tz.includes("Madrid") || tz.includes("Rome")) {
                currentCurrency = "EUR";
            } else {
                currentCurrency = "USD";
            }
            localStorage.setItem("redline_tcg_currency", currentCurrency);
        }

        const bundles = [
            {
                id: "pocket_change",
                name: "Pocket Change Bundle",
                coins: 250,
                desc: "Perfect for a quick booster pull or grab-bag scrap starter.",
                prices: { USD: "$0.49", INR: "₹39", EUR: "€0.49" },
                icon: "👛",
                color: "#95a5a6"
            },
            {
                id: "racer_boost",
                name: "Racer Boost Bundle",
                coins: 1500,
                desc: "Slick injection of coins to unlock advanced packs.",
                prices: { USD: "$1.99", INR: "₹149", EUR: "€1.79" },
                icon: "🏎️",
                tag: "Best Value",
                color: "#2ecc71"
            },
            {
                id: "drift_vault",
                name: "Drift Vault Bundle",
                coins: 5000,
                desc: "Massive pile of gold coins to complete your index.",
                prices: { USD: "$4.99", INR: "₹399", EUR: "€4.59" },
                icon: "🏦",
                tag: "Popular",
                color: "#00f0ff"
            },
            {
                id: "redline_legend",
                name: "Redline Legend Bundle",
                coins: 15000,
                desc: "Unlimited resources for absolute collectors.",
                prices: { USD: "$9.99", INR: "₹799", EUR: "€8.99" },
                icon: "🏆",
                tag: "Ultimate Pack",
                color: "#e67e22"
            }
        ];

        let gridHTML = "";
        bundles.forEach(b => {
            const price = b.prices[currentCurrency] || b.prices.USD;
            const tagHTML = b.tag ? `<div style="position: absolute; top: -12px; right: 12px; background: ${b.color}; color: #000; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; font-weight: bold; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${b.tag}</div>` : "";
            
            gridHTML += `
                <div class="shop-item-card" style="background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.5rem; position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: transform 0.3s, border-color 0.3s; height: 100%;" onmouseover="this.style.borderColor='${b.color}'; this.style.transform='translateY(-5px)';" onmouseout="this.style.borderColor='var(--border-main)'; this.style.transform='none';">
                    ${tagHTML}
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <span style="font-size: 2.5rem; filter: drop-shadow(0 0 10px ${b.color}44);">${b.icon}</span>
                        <div>
                            <h3 style="font-family: 'Orbitron', sans-serif; color: #fff; font-size: 0.95rem; margin: 0;">${b.name}</h3>
                            <div style="font-family: 'Orbitron', sans-serif; color: var(--neon-cyan); font-size: 1.25rem; font-weight: bold; margin-top: 0.25rem;">🪙 ${b.coins.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin: 0; min-height: 40px;">
                        ${b.desc}
                    </p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; margin-top: 0.5rem;">
                        <span style="font-family: 'Orbitron', sans-serif; color: #fff; font-size: 1.15rem; font-weight: bold;">${price}</span>
                        <button class="cta-btn" onclick="app.buyCoinsBundle('${b.id}', ${b.coins}, '${price}')" style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; padding: 0.4rem 1.25rem; border-color: ${b.color}; color: ${b.color}; background: transparent; cursor: pointer;" onmouseover="this.style.background='${b.color}1e'" onmouseout="this.style.background='transparent'">
                            BUY BUNDLE
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 2rem 1.5rem;">
                <!-- Currency selector and Localized server note -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; padding: 1.25rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <span style="font-size: 1.75rem;">🌍</span>
                        <div>
                            <div style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; font-weight: bold; color: #fff; text-transform: uppercase;">Localized Server Detection</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem;">Automatically detected currency region based on host node routing timezone.</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <label style="font-family: 'Orbitron', sans-serif; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Select Store Currency:</label>
                        <select id="coin-store-currency-select" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-main); color: #fff; border-radius: 6px; padding: 0.4rem 0.75rem; font-family: 'Orbitron', sans-serif; font-size: 0.8rem; outline: none; cursor: pointer;">
                            <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                            <option value="INR" ${currentCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                            <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                        </select>
                    </div>
                </div>
                
                <!-- Bundles Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
                    ${gridHTML}
                </div>
            </div>
        `;

        const select = document.getElementById("coin-store-currency-select");
        if (select) {
            select.addEventListener("change", (e) => {
                localStorage.setItem("redline_tcg_currency", e.target.value);
                this.renderCoinStore();
            });
        }
    }
};

// Add screen-shake utility styling inside standard flow helper
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .screen-shake {
        animation: shakeAnimation 0.5s ease-in-out;
    }
    @keyframes shakeAnimation {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 2px) rotate(-1deg); }
        20%, 40%, 60%, 80% { transform: translate(5px, -2px) rotate(1deg); }
    }
    .glow-particle {
        position: absolute;
    }
`;
document.head.appendChild(styleSheet);
