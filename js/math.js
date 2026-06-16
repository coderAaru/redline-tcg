/**
 * REDLINE TCG - MATHEMATICAL ENGINES
 * OVR Score Calculations & Pack Probability Rolling Logic
 */

const MathEngine = {
    /**
     * Calculates the Overall Score (OVR) of a vehicle (Section 5 Specs)
     * OVR = horsepower + top_speed + OVR(a) + OVR(q) + OVR(r)
     */
    calculateOVR(stats, rarity) {
        const hp = stats.horsepower;
        const topSpeed = stats.top_speed;
        const a = stats.zero_to_sixty;
        const q = stats.quarter_mile;

        // 1. Acceleration Modifier: OVR(a) = (6 / a) * 100
        const ovr_a = (6.0 / a) * 100;

        // 2. Quarter Mile Modifier: OVR(q) = (14 / q) * 100
        const ovr_q = (14.0 / q) * 100;

        // 3. Rarity Prestige Weights Matrix
        const rarityWeights = {
            "Common": -100,
            "Uncommon": -75,
            "Special": -50,
            "Rare": -25,
            "Very Rare": 0,
            "Epic": 25,
            "Legendary": 50,
            "Exotic": 75,
            "Limited Edition": 100
        };

        const ovr_r = rarityWeights[rarity] !== undefined ? rarityWeights[rarity] : 0;

        // Final aggregate
        const rawOVR = hp + topSpeed + ovr_a + ovr_q + ovr_r;

        return Math.round(rawOVR);
    },

    /**
     * Checks if today is Easter Sunday (Dynamic check for +3% Luck Event)
     */
    isEaster(date = new Date()) {
        const year = date.getFullYear();
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const L = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * L) / 451);
        const month = Math.floor((h + L - 7 * m + 114) / 31); // 3 = March, 4 = April
        const day = ((h + L - 7 * m + 114) % 31) + 1;
        
        return date.getMonth() === (month - 1) && date.getDate() === day;
    },

    /**
     * Checks if the date falls in the week of Halloween (Oct 25th - Nov 1st)
     */
    isHalloweenWeek(date = new Date()) {
        const month = date.getMonth(); // 9 = October
        const day = date.getDate();
        return (month === 9 && day >= 25) || (month === 10 && day === 1);
    },

    /**
     * Rolls a single card from an eligibility pool (Section 6 & 7)
     */
    rollCard(pool, activeCharm, pack, hasEpicAlready = false) {
        if (!pool || pool.length === 0) return null;

        let pickedCard = null;

        // Magnet charm logic: only increase chances of getting undiscovered cards in this pack
        const isMagnetActive = activeCharm && activeCharm.id === "universal-magnet";

        if (isMagnetActive) {
            // Find undiscovered cards in this pack's pool, excluding Epic and above rarities
            const excludedRarities = ["Epic", "Legendary", "Exotic", "Limited Edition"];
            const undiscoveredInPool = pool.filter(card => {
                const dbCard = (typeof CardDatabase !== 'undefined') ? CardDatabase.find(c => c.id === card.id) : null;
                return dbCard && !dbCard.discovered && !excludedRarities.includes(dbCard.rarity);
            });

            // 35% chance to force roll one of the eligible undiscovered cards
            if (undiscoveredInPool.length > 0 && Math.random() < 0.35) {
                pickedCard = undiscoveredInPool[Math.floor(Math.random() * undiscoveredInPool.length)];
            }
        } else if (activeCharm && activeCharm.type === "brand-magnet") {
            const targetBrand = activeCharm.targetBrand;
            const brandCardsInPool = pool.filter(card => card.manufacturer.toLowerCase() === targetBrand.toLowerCase());
            // 40% chance to force roll one of the eligible brand cards
            if (brandCardsInPool.length > 0 && Math.random() < 0.40) {
                pickedCard = brandCardsInPool[Math.floor(Math.random() * brandCardsInPool.length)];
            }
        }

        // If magnet did not force roll an undiscovered card (or none left), perform standard roll
        if (!pickedCard) {
            // Define baseline drop chances
            let table = {
                "Common": 49.40,
                "Uncommon": 26.50,
                "Special": 12.50,
                "Rare": 6.00,
                "Very Rare": 4.00,
                "Epic": 1.20,
                "Legendary": 0.30,
                "Exotic": 0.10
            };

            // Value Compression for BMW and German Packs (to prevent cash farms)
            if (pack && (pack.id === "bmw" || pack.id === "german")) {
                table = {
                    "Common": 48.00,
                    "Uncommon": 36.20,
                    "Special": 12.00,
                    "Rare": 2.50,
                    "Very Rare": 1.00,
                    "Epic": 0.20,
                    "Legendary": 0.08,
                    "Exotic": 0.02
                };
            } else if (pack && pack.id === "honda") {
                // Honda Pack Drop Rate Suppression: Reduce Epic rate to 0.50% (from 1.20%), shifting weight to Uncommon and Special
                // Suppress consecutive/stacked Epics if hasEpicAlready is true
                const epicRate = hasEpicAlready ? 0.00 : 0.50;
                const weightToShift = 1.20 - epicRate;
                table = {
                    "Common": 49.40,
                    "Uncommon": 26.50 + (weightToShift / 2.0),
                    "Special": 12.50 + (weightToShift / 2.0),
                    "Rare": 6.00,
                    "Very Rare": 4.00,
                    "Epic": epicRate,
                    "Legendary": 0.30,
                    "Exotic": 0.10
                };
            }

            // Active Event Modifiers (Section 8)
            let isEasterSunday = MathEngine.isEaster();
            if (isEasterSunday) {
                // Grants +3% flat global Luck: Shift probability from Common to Rare/Epic/Legendary/Exotic
                table["Common"] -= 3.00;
                table["Epic"] += 1.00;
                table["Legendary"] += 1.00;
                table["Exotic"] += 1.00;
            }

            // Active Luck Charm Modifiers (Section 7)
            if (activeCharm) {
                if (activeCharm.id === "legendary-catalyst") {
                    // Legendary Catalyst Charm: flat +0.5% probability boost to Legendary
                    const boost = Math.min(table["Common"], 0.50);
                    table["Common"] -= boost;
                    table["Legendary"] += boost;
                } else if (activeCharm.id === "exotic-catalyst") {
                    // Exotic Catalyst Charm: flat +0.2% probability boost to Exotic
                    const boost = Math.min(table["Common"], 0.20);
                    table["Common"] -= boost;
                    table["Exotic"] += boost;
                } else if (activeCharm.id === "epic-catalyst") {
                    // Epic Catalyst Charm: flat +1.0% probability boost to Epic
                    const boost = Math.min(table["Common"], 1.00);
                    table["Common"] -= boost;
                    table["Epic"] += boost;
                } else if (activeCharm.id === "high-roller-charm") {
                    // High-Roller Charm: Suppress Common cards entirely, shift weight evenly across Uncommon, Special, Rare
                    const commonWeight = table["Common"];
                    table["Common"] = 0;
                    const shift = commonWeight / 3.0;
                    table["Uncommon"] += shift;
                    table["Special"] += shift;
                    table["Rare"] += shift;
                }
            }

            // Convert table to cumulative ranges
            let cumulative = [];
            let runningSum = 0;
            const rarities = Object.keys(table);

            for (let r of rarities) {
                runningSum += table[r];
                cumulative.push({ rarity: r, limit: runningSum });
            }

            // Perform RNG roll [0.00, 100.00)
            const roll = Math.random() * 100;
            let selectedRarity = "Common";

            for (let item of cumulative) {
                if (roll < item.limit) {
                    selectedRarity = item.rarity;
                    break;
                }
            }

            // Filter pool by rolled rarity
            let subset = pool.filter(card => card.rarity === selectedRarity);

            // Fallback matching: If no card of selected rarity is in this pack pool, 
            // fallback search starting from closest rarity to find a card
            if (subset.length === 0) {
                const fallbackOrder = ["Common", "Uncommon", "Special", "Rare", "Very Rare", "Epic", "Legendary", "Exotic"];
                let idx = fallbackOrder.indexOf(selectedRarity);
                // Search outwards
                let offset = 1;
                while (subset.length === 0 && offset < fallbackOrder.length) {
                    // Try higher
                    if (idx + offset < fallbackOrder.length) {
                        let r = fallbackOrder[idx + offset];
                        subset = pool.filter(card => card.rarity === r);
                    }
                    // Try lower
                    if (subset.length === 0 && idx - offset >= 0) {
                        let r = fallbackOrder[idx - offset];
                        subset = pool.filter(card => card.rarity === r);
                    }
                    offset++;
                }
            }

            // Fallback: If still empty, pull random from full pool
            if (subset.length === 0) {
                subset = pool;
            }

            pickedCard = subset[Math.floor(Math.random() * subset.length)];
        }

        return JSON.parse(JSON.stringify(pickedCard)); // Clone
    },

    /**
     * Generates a pack yield array (Section 7 Pack Yield Rule)
     */
    generatePackYield(pack, activeCharm) {
        const targetName = pack.name;
        // Extract eligible pool
        const pool = CardDatabase.filter(card => card.pack_eligibility.includes(targetName));

        // Determine size: Yield exactly 1 card for micro-packs, and up to 3 cards for standard packs.
        // Threshold: If pool size is <= 3, it behaves as a Micro-Pack (yields exactly 1 card).
        // Otherwise, it behaves as a Standard Pack (yields exactly 3 cards).
        let yieldCount = 3;
        if (pool.length <= 3) {
            yieldCount = 1; // Micro-pack bounds
        }

        // Apply Extra Card Charm if equipped
        if (activeCharm && activeCharm.id === "extra-card-charm") {
            yieldCount += 1;
        }

        // Roll cards
        let result = [];
        let rolledEpic = false;
        for (let i = 0; i < yieldCount; i++) {
            const rolled = MathEngine.rollCard(pool, activeCharm, pack, rolledEpic);
            if (rolled) {
                result.push(rolled);
                if (rolled.rarity === "Epic") {
                    rolledEpic = true;
                }
            }
        }

        return result;
    }
};

// Initial boot OVR calculations across full database
CardDatabase.forEach(card => {
    card.ovr = MathEngine.calculateOVR(card.stats, card.rarity);
});
console.log("Card OVRs initialized successfully.");
