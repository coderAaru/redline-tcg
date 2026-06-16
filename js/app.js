/**
 * REDLINE TCG - CENTRAL SPA APP CONTROLLER
 */

const app = {
    // Ephemeral Trading Session State
    tradeSession: null,

    // Core Game State
    state: {
        playerName: "RedlineDriver",
        coins: 20, // Start off with 20 coins to afford the Garage Tax!
        unopenedPacks: {},
        activeCharm: null, // Holds equipped Luck Charm metadata
        starterCoinsEarned: 0, // Tracker for Starter Progress Ceiling (Max 50-60)
        selectedPackId: null, // Pack loaded in the Garage Bay staging area
        isAnimating: false,
        lastSpinTime: 0,
        freePackRip: false, // Active toggle state
        charmsDisabledToday: false,
        discountActive: false, // Active toggle state
        completedPacks: [],
        claimedCompletions: [], // packIds where completion reward has been claimed
        cardInventory: {}, // cardId -> owned count
        charmsInventory: [], // list of purchased/won charms
        ticketsInventory: {
            discount: 0, // count of 10% off tickets
            freeRip: 0,  // count of free pack rip tickets
            taxExemption: 0,
            fuelMultiplier: 0,
            doubleDown: 0
        },
        taxExemptionActive: false,
        fuelMultiplierCount: 0,
        doubleDownActive: false,
        dailyQuests: [],
        weeklyQuests: [],
        dailyResetTime: 0,
        weeklyResetTime: 0
    },

    /**
     * Initializes app binding, state restore, and sets default view
     */
    init() {
        console.log("Starting Redline TCG...");

        // Check for active login session
        const session = localStorage.getItem("redline_tcg_session");
        if (!session) {
            this.currentUser = null;
            document.body.classList.add("logged-out");
            UI.renderLoginScreen();
            return;
        }

        this.currentUser = session;
        document.body.classList.remove("logged-out");

        // Load persisted state if exists
        this.loadState();
        
        // Populate random quests from pools if empty
        if (!this.state.dailyQuests || this.state.dailyQuests.length === 0) {
            this.state.dailyQuests = this.getRandomQuests(DailyQuestsPool, 3);
        }
        if (!this.state.weeklyQuests || this.state.weeklyQuests.length === 0) {
            this.state.weeklyQuests = this.getRandomQuests(WeeklyQuestsPool, 3);
        }
        this.initializeQuestsProgress(this.state.dailyQuests);
        this.initializeQuestsProgress(this.state.weeklyQuests);

        this.checkNewPackCompletions();
        this.checkHandbook();

        // Bind Navigation buttons
        const navButtons = document.querySelectorAll(".nav-btn");
        navButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", (e) => {
                const targetView = e.target.getAttribute("data-view");
                this.changeView(targetView);
            });
        });

        // Bind Page 3 (Index) filter selector
        const filterSelect = document.getElementById("index-pack-filter");
        if (filterSelect) {
            filterSelect.addEventListener("change", (e) => {
                UI.renderIndex(CardDatabase, e.target.value);
            });
        }

        // Bind rip trigger to the garage bay pack wrapper
        const packWrapper = document.getElementById("pack-wrapper");
        if (packWrapper) {
            const newPackWrapper = packWrapper.cloneNode(true);
            packWrapper.parentNode.replaceChild(newPackWrapper, packWrapper);
            newPackWrapper.addEventListener("click", () => {
                this.executePackOpening();
            });
        }

        // Bind Collect & Exit button
        const collectBtn = document.getElementById("btn-collect-exit");
        if (collectBtn) {
            const newCollectBtn = collectBtn.cloneNode(true);
            collectBtn.parentNode.replaceChild(newCollectBtn, collectBtn);
            newCollectBtn.addEventListener("click", () => {
                this.collectAndExit();
            });
        }

        // Bind Spin Wheel button
        const spinBtn = document.getElementById("btn-spin-wheel");
        if (spinBtn) {
            const newSpinBtn = spinBtn.cloneNode(true);
            spinBtn.parentNode.replaceChild(newSpinBtn, spinBtn);
            newSpinBtn.addEventListener("click", () => {
                this.spinWheel();
            });
        }

        // Populate dynamic filters in Index
        this.populateIndexFilters();

        // Run timers
        if (this.timers) {
            this.timers.forEach(t => clearInterval(t));
        }
        this.timers = [
            setInterval(() => this.charmTimerTick(), 1000),
            setInterval(() => this.spinWheelTimerTick(), 1000)
        ];
        
        // Quests timers initialization
        if (!this.state.dailyResetTime) this.state.dailyResetTime = this.getNextDailyReset();
        if (!this.state.weeklyResetTime) this.state.weeklyResetTime = this.getNextWeeklyReset();
        this.timers.push(setInterval(() => this.questsTimerTick(), 1000));

        // Render initial UI views
        this.updateHeaderStats();
        UI.renderShowroom(PackLicenses, this.state.coins);
        UI.renderIndex(CardDatabase, "all");
        UI.renderShop(PackLicenses, ShopCharms, this.state.coins);

        // Auto-switch to showroom
        this.changeView("showroom");

        // Live Event Notification Toasts
        this.checkLiveEvents();
    },

    /**
     * View Switch Router (Section 1 specs)
     */
    changeView(targetView) {
        if (this.state.isAnimating) {
            this.showToast("Wait for animations to complete!", "error");
            return;
        }

        // Remove active state from nav buttons
        const navButtons = document.querySelectorAll(".nav-btn");
        navButtons.forEach(btn => {
            if (btn.getAttribute("data-view") === targetView) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Fade view panels
        const panels = document.querySelectorAll(".view-panel");
        panels.forEach(panel => {
            const panelId = panel.id.replace("view-", "");
            if (panelId === targetView) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });

        // Re-render corresponding viewport to sync inventory states
        if (targetView === "showroom") {
            UI.renderShowroom(PackLicenses, this.state.coins);
        } else if (targetView === "index") {
            const currentFilter = document.getElementById("index-pack-filter").value;
            UI.renderIndex(CardDatabase, currentFilter);
        } else if (targetView === "performance-shop") {
             UI.renderShop(PackLicenses, ShopCharms, this.state.coins);
        } else if (targetView === "daily-spin") {
            this.checkDailyReset();
            UI.drawSpinWheel();
            this.updateSpinWheelStatus();
        } else if (targetView === "inventory") {
            UI.renderInventory();
        } else if (targetView === "newsroom") {
            UI.renderNewsroom();
        } else if (targetView === "quests") {
            UI.renderQuests();
        } else if (targetView === "trade-terminal") {
            UI.renderTradeTerminal();
        } else if (targetView === "settings") {
            UI.renderSettings();
        } else if (targetView === "coin-store") {
            UI.renderCoinStore();
        }
    },

    /**
     * Prepares Garage Bay staging canvas (Section 1 Page 2)
     */
    selectPackForOpening(packId) {
        const pack = PackLicenses.find(p => p.id === packId);
        if (!pack || (!pack.unlocked && !this.state.freePackRip && !this.state.luckyRedlineActive)) {
            this.showToast("Unlock this pack license in the Performance Shop first!", "error");
            return;
        }

        this.state.selectedPackId = packId;

        // Clear previous cards display to prevent old reveals from sticking around
        const revealedRow = document.getElementById("revealed-cards-row");
        if (revealedRow) {
            revealedRow.innerHTML = "";
        }
        const collectBtn = document.getElementById("btn-collect-exit");
        if (collectBtn) {
            collectBtn.classList.add("hidden");
        }
        const revealAllBtn = document.getElementById("btn-reveal-all");
        if (revealAllBtn) {
            revealAllBtn.classList.add("hidden");
        }
        const promptText = document.querySelector(".reveal-prompt-text");
        if (promptText) {
            promptText.classList.add("hidden");
        }

        // Hide empty canvas state and show staging deck
        document.getElementById("garage-empty-state").classList.add("hidden");
        document.getElementById("pack-ripping-stage").classList.remove("hidden");
        document.getElementById("pack-wrapper").classList.remove("hidden");
        document.getElementById("reveal-container").classList.add("hidden");

        // Update active pack presentation metadata
        const activePackTitle = document.getElementById("active-pack-title");
        const activePackArt = document.getElementById("active-pack-art");
        if (activePackTitle) {
            activePackTitle.textContent = pack.name.toUpperCase();
        }
        if (activePackArt) {
            activePackArt.style.borderColor = pack.color;
            
            // Clean up old cover graphics
            const oldGraphic = activePackArt.querySelector(".pack-cover-graphic");
            if (oldGraphic) {
                oldGraphic.remove();
            }
            
            // Render beautiful vector graphic cover
            const graphicContainer = document.createElement("div");
            graphicContainer.className = "pack-cover-graphic";
            graphicContainer.style.width = "120px";
            graphicContainer.style.height = "120px";
            graphicContainer.style.margin = "1.5rem auto";
            graphicContainer.innerHTML = UI.getPackCoverHTML(pack.id);
            
            const titleEl = activePackArt.querySelector("h2");
            if (titleEl) {
                titleEl.after(graphicContainer);
            }
        }

        // Move to Garage Bay viewport
        this.changeView("garage-bay");
    },

    /**
     * Executes pack opening algorithms and yields inventory modifications
     */
    executePackOpening() {
        if (this.state.isAnimating) return;

        const packId = this.state.selectedPackId;
        const pack = PackLicenses.find(p => p.id === packId);
        const isLuckyRedline = this.state.luckyRedlineActive;

        if (!pack || (!pack.unlocked && !this.state.freePackRip && !isLuckyRedline)) {
            this.showToast("Unlock this pack license in the Performance Shop first!", "error");
            return;
        }

        const isFreeRip = this.state.freePackRip;
        const isTaxExempt = !isFreeRip && !isLuckyRedline && this.state.taxExemptionActive;
        const isDoubleDown = this.state.doubleDownActive;

        // Deduct sequential Garage Tax if not free pack rip / lucky redline
        if (!isFreeRip && !isLuckyRedline) {
            const packIndex = PackLicenses.findIndex(p => p.id === packId);
            const tax = packIndex >= 0 ? (packIndex + 1) : 2;

            if (isTaxExempt) {
                this.showToast("🎫 Tax-Exemption Permit applied! Pack opened for 0 tax.", "success");
            } else {
                if (this.state.coins < tax) {
                    this.showToast(`⚠️ Insufficient coins for Garage Tax (requires ${tax} Coins to open this pack)!`, "error");
                    return;
                }
                this.state.coins -= tax;
                this.showToast(`💸 Paid ${tax} Coins Garage Tax.`, "success");
            }
        } else if (isLuckyRedline) {
            this.showToast("🔥 Lucky Redline Pack: opened completely free!", "success");
        }

        if (isDoubleDown) {
            this.showToast("🎫 Double Down Token applied! Received 2x copies of all card drops.", "success");
        }

        this.state.isAnimating = true;

        // Generate randomized card yield based on math distributions
        const cardsYield = MathEngine.generatePackYield(pack, this.state.activeCharm);

        // Check cards for discovery rewards & update collections
        cardsYield.forEach(rolledCard => {
            const dbCard = CardDatabase.find(c => c.id === rolledCard.id);
            if (dbCard) {
                // Increment duplicity tracker count
                if (!this.state.cardInventory) this.state.cardInventory = {};
                const qtyToAdd = isDoubleDown ? 2 : 1;
                this.state.cardInventory[dbCard.id] = (this.state.cardInventory[dbCard.id] || 0) + qtyToAdd;

                // Quest update: pulling cards (total and rarity specific)
                this.updateQuestProgress(`pull_rarity_${dbCard.rarity}`, qtyToAdd);
                this.updateQuestProgress("pull_cards", qtyToAdd);

                if (!dbCard.discovered) {
                    dbCard.discovered = true;
                    rolledCard.isNew = true; // Mark for "New!" badge overlay

                    // Quest update: discover new vehicle
                    this.updateQuestProgress("discover_new_cars", 1);

                    // Flag to award coins on flip (VFX sync)
                    if (packId === "starter") {
                        // Calculate potential reward based on rarity
                        let reward = 3;
                        if (dbCard.rarity === "Epic") reward = 10;
                        else if (dbCard.rarity === "Legendary") reward = 20;
                        else if (dbCard.rarity === "Exotic") reward = 50;

                        if (this.state.starterCoinsEarned < 50) {
                            this.state.starterCoinsEarned += reward;
                            rolledCard.awardDiscoveryCoins = true;
                        }
                    } else {
                        rolledCard.awardDiscoveryCoins = true;
                    }
                }
            }
        });

        // Trigger UI Ripping Canvas Sequence
        UI.triggerPackRipAnimation(cardsYield, () => {
            this.state.isAnimating = false;
            
            // Post-opening Charm decay updates
            this.decrementCharmDurability(packId);
            
            // Consume free pack rip / tax exemption / double down tokens
            if (isFreeRip) {
                this.state.freePackRip = false;
                this.state.ticketsInventory.freeRip = Math.max(0, (this.state.ticketsInventory.freeRip || 0) - 1);
                this.showToast("🎫 Free Pack Rip Ticket consumed!", "success");
            } else if (isTaxExempt) {
                this.state.taxExemptionActive = false;
                this.state.ticketsInventory.taxExemption = Math.max(0, (this.state.ticketsInventory.taxExemption || 0) - 1);
                this.showToast("🎫 Tax-Exemption Permit consumed!", "success");
            }

            if (isDoubleDown) {
                this.state.doubleDownActive = false;
                this.state.ticketsInventory.doubleDown = Math.max(0, (this.state.ticketsInventory.doubleDown || 0) - 1);
                this.showToast("🎫 Double Down Token consumed!", "success");
            }

            if (isLuckyRedline) {
                this.state.luckyRedlineActive = false;
            }
            
            // Quest update: Rip pack
            this.updateQuestProgress("rip_packs", 1);
            
            this.updateHeaderStats();
            this.saveState();
        });
    },

    /**
     * Handles returning from opening screen to Showroom Grid
     */
    collectAndExit() {
        document.getElementById("pack-ripping-stage").classList.add("hidden");
        document.getElementById("garage-empty-state").classList.remove("hidden");
        this.state.selectedPackId = null;
        this.checkNewPackCompletions();
        this.changeView("showroom");
    },

    /**
     * Unlocks an advanced pack stock license (Performance Shop)
     */
    buyPackLicense(packId, cost) {
        // Block purchase of Supercars if gate is locked
        if (packId === "supercars") {
            const gate = this.checkSupercarsGate();
            if (!gate.unlocked) {
                this.showSupercarsGateModal(gate);
                return;
            }
        }

        if (this.state.charmsDisabledToday && ShopCharms.some(c => c.id === packId)) {
            this.showToast("🚫 Charm purchases are disabled today due to your Spin Wheel roll!", "error");
            return;
        }

        let finalCost = cost;
        if (this.state.discountActive) {
            finalCost = Math.round(cost * 0.9);
        }

        if (this.state.coins < finalCost) {
            this.showToast("Insufficient coin balance!", "error");
            return;
        }

        const pack = PackLicenses.find(p => p.id === packId);
        if (pack && !pack.unlocked) {
            if (!confirm(`Are you sure you want to unlock the ${pack.name} for 🪙 ${finalCost} Coins?`)) {
                return;
            }
            this.state.coins -= finalCost;
            pack.unlocked = true;

            // Quest update: unlock license
            this.updateQuestProgress("unlock_licenses", 1);

            if (this.state.discountActive) {
                this.state.discountActive = false;
                this.state.ticketsInventory.discount = Math.max(0, (this.state.ticketsInventory.discount || 0) - 1);
                this.showToast("🏷️ 10% discount applied and ticket consumed!", "success");
            } else {
                this.showToast(`🔑 Unlocked License: ${pack.name}!`, "success");
            }

            this.updateHeaderStats();
            UI.renderShop(PackLicenses, ShopCharms, this.state.coins);
            UI.renderShowroom(PackLicenses, this.state.coins);
            this.saveState();
        }
    },

    /**
     * Awards coins for discoveries when flipping (visual reward sync)
     */
    awardDiscoveryReward(cardId) {
        const dbCard = CardDatabase.find(c => c.id === cardId);
        if (!dbCard) return;

        let reward = 3;
        if (dbCard.rarity === "Epic") reward = 10;
        else if (dbCard.rarity === "Legendary") reward = 20;
        else if (dbCard.rarity === "Exotic") reward = 50;

        // Apply Fuel Multiplier if active
        if ((this.state.fuelMultiplierCount || 0) > 0) {
            reward *= 2;
            this.state.fuelMultiplierCount--;
            this.showToast(`🔥 Fuel Multiplier active! Discovery reward doubled to +🪙 ${reward} Coins! (${this.state.fuelMultiplierCount} unique finds remaining)`, "success");
        }

        this.state.coins += reward;
        this.showToast(`🏆 Discovered: ${dbCard.manufacturer} ${dbCard.name}! Earned +🪙 ${reward} Coins.`, "success");
        
        // Quest update: discover JDM card
        if (dbCard.pack_eligibility && dbCard.pack_eligibility.includes("JDM Pack")) {
            this.updateQuestProgress("discover_jdm", 1);
        }

        this.checkNewPackCompletions();
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Purchases and equips a Luck Charm (Performance Shop)
     */
    buyCharm(charmId, cost) {
        if (this.state.charmsDisabledToday) {
            this.showToast("🚫 Charm purchases are disabled today due to your Spin Wheel roll!", "error");
            return;
        }

        let finalCost = cost;
        if (this.state.discountActive) {
            finalCost = Math.round(cost * 0.9);
        }

        if (this.state.coins < finalCost) {
            this.showToast("Insufficient coin balance!", "error");
            return;
        }

        const charmMeta = ShopCharms.find(c => c.id === charmId);
        if (!charmMeta) return;

        this.state.coins -= finalCost;
        
        // Add to inactive charms inventory
        if (!this.state.charmsInventory) {
            this.state.charmsInventory = [];
        }
        this.state.charmsInventory.push(JSON.parse(JSON.stringify(charmMeta)));

        if (this.state.discountActive) {
            this.state.discountActive = false;
            this.state.ticketsInventory.discount = Math.max(0, (this.state.ticketsInventory.discount || 0) - 1);
            this.showToast(`⚡ Purchased ${charmMeta.name}! Added to Inventory. (10% discount applied)`, "success");
        } else {
            this.showToast(`⚡ Purchased ${charmMeta.name}! Added to Inventory.`, "success");
        }

        // Quest update: purchase charm
        this.updateQuestProgress(`buy_charm_${charmId}`, 1);

        this.updateHeaderStats();
        UI.renderShop(PackLicenses, ShopCharms, this.state.coins);
        this.saveState();
    },

    /**
     * Decrements durability for pack-specific charms (JDM Magnet)
     */
    decrementCharmDurability(packId) {
        const charm = this.state.activeCharm;
        if (charm && charm.durability !== undefined) {
            // Only decrement if it matches the target pack (or is a general charm)
            if (charm.type === "pack-specific" && charm.targetPack !== packId) {
                return;
            }
            charm.durability--;
            if (charm.durability <= 0) {
                this.state.activeCharm = null;
                this.showToast("⚡ Your Luck Charm has broken!", "error");
            } else {
                this.showToast(`⚡ Luck Charm durability: ${charm.durability} rolls remaining.`, "success");
            }
        }
    },

    /**
     * Counts down and expires time-based charms
     */
    charmTimerTick() {
        const charm = this.state.activeCharm;
        if (charm && charm.expiresAt) {
            const remaining = Math.max(0, Math.ceil((charm.expiresAt - Date.now()) / 1000));
            
            // Render active countdown text in DOM
            const charmNameNode = document.getElementById("active-charm-name");
            if (charmNameNode) {
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
                charmNameNode.textContent = `${charm.icon} ${charm.name} (${formattedTime})`;
            }

            if (remaining <= 0) {
                this.state.activeCharm = null;
                this.showToast("⚡ Your Luck Charm has expired!", "error");
                this.updateHeaderStats();
                this.saveState();
            }
        }
    },

    /**
     * Updates header balance trackers
     */
    updateHeaderStats() {
        const coinsNode = document.getElementById("player-coins");
        if (coinsNode) {
            coinsNode.textContent = this.state.coins;
        }

        const charmNode = document.getElementById("header-charms");
        const charmNameNode = document.getElementById("active-charm-name");
        
        if (this.state.activeCharm) {
            charmNode.style.display = "flex";
            if (this.state.activeCharm.durability !== undefined) {
                charmNameNode.textContent = `${this.state.activeCharm.icon} ${this.state.activeCharm.name} (${this.state.activeCharm.durability} rolls)`;
            } else if (this.state.activeCharm.expiresAt) {
                const remaining = Math.max(0, Math.ceil((this.state.activeCharm.expiresAt - Date.now()) / 1000));
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
                charmNameNode.textContent = `${this.state.activeCharm.icon} ${this.state.activeCharm.name} (${formattedTime})`;
            }
        } else {
            charmNameNode.textContent = "No Active Charm";
        }

        // Update active modifiers
        const modNode = document.getElementById("header-modifiers");
        if (modNode) {
            const mods = [];
            if (this.state.freePackRip) mods.push("🎫 Free Rip");
            if (this.state.taxExemptionActive) mods.push("🎫 Tax-Exempt");
            if (this.state.doubleDownActive) mods.push("🪙 Double Down");
            if ((this.state.fuelMultiplierCount || 0) > 0) mods.push(`🔥 Fuel x${this.state.fuelMultiplierCount}`);
            if (this.state.discountActive) mods.push("🏷️ 10% Off");

            if (mods.length > 0) {
                modNode.style.display = "flex";
                modNode.textContent = mods.join(" | ");
            } else {
                modNode.style.display = "none";
            }
        }
    },

    /**
     * Displays a dynamic floating toast notification in the UI viewport
     */
    showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = "🔔";
        if (type === "success") icon = "🏆";
        else if (type === "error") icon = "⚠️";

        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        // Set duration timeout for removals
        setTimeout(() => {
            toast.classList.add("toast-fadeout");
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    },

    /**
     * Populates drop filters
     */
    populateIndexFilters() {
        const select = document.getElementById("index-pack-filter");
        if (!select) return;

        select.innerHTML = `<option value="all">All Packs</option>`;
        PackLicenses.forEach(pack => {
            select.innerHTML += `<option value="${pack.id}">${pack.name}</option>`;
        });
    },

    /**
     * Detects live real-world holiday transformations (Section 8 specs)
     */
    checkLiveEvents() {
        if (MathEngine.isEaster()) {
            this.showToast("🐰 EASTER EVENT ACTIVE: Standard Packs yield +3% global Luck boost!", "success");
        }
        if (MathEngine.isHalloweenWeek()) {
            this.showToast("🎃 HALLOWEEN EVENT ACTIVE: Check shop for Horror theme variants!", "success");
        }
    },

    /**
     * Resets discovery and unlocks in the global databases in memory
     */
    resetGlobalDatabases() {
        if (typeof CardDatabase !== 'undefined') {
            CardDatabase.forEach(c => {
                c.discovered = false;
            });
        }
        if (typeof PackLicenses !== 'undefined') {
            PackLicenses.forEach(p => {
                if (p.id === "starter") {
                    p.unlocked = true;
                } else {
                    p.unlocked = false;
                }
            });
        }
    },

    /**
     * Saves local user state data
     */
    saveState() {
        const stateToSave = {
            playerName: this.state.playerName || this.currentUser || "RedlineDriver",
            coins: this.state.coins,
            activeCharm: this.state.activeCharm,
            starterCoinsEarned: this.state.starterCoinsEarned,
            unlockedPacks: PackLicenses.map(p => ({ id: p.id, unlocked: p.unlocked })),
            discoveredList: CardDatabase.map(c => ({ id: c.id, discovered: c.discovered })),
            lastSpinTime: this.state.lastSpinTime,
            freePackRip: this.state.freePackRip,
            charmsDisabledToday: this.state.charmsDisabledToday,
            discountActive: this.state.discountActive,
            completedPacks: this.state.completedPacks,
            claimedCompletions: this.state.claimedCompletions,
            cardInventory: this.state.cardInventory,
            charmsInventory: this.state.charmsInventory,
            ticketsInventory: this.state.ticketsInventory,
            taxExemptionActive: this.state.taxExemptionActive,
            fuelMultiplierCount: this.state.fuelMultiplierCount,
            doubleDownActive: this.state.doubleDownActive,
            dailyQuests: this.state.dailyQuests,
            weeklyQuests: this.state.weeklyQuests,
            dailyResetTime: this.state.dailyResetTime,
            weeklyResetTime: this.state.weeklyResetTime
        };

        // Save to active user profile database mapping
        if (this.currentUser) {
            const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
            const lookupKey = this.currentUser.toLowerCase();
            if (users[lookupKey]) {
                users[lookupKey].state = stateToSave;
                localStorage.setItem("redline_tcg_users", JSON.stringify(users));
            }
        }

        // Also update the active state key
        localStorage.setItem("redline_tcg_state", JSON.stringify(stateToSave));
    },

    /**
     * Restores local user state data
     */
    loadState() {
        // First reset global in-memory databases to default
        this.resetGlobalDatabases();

        try {
            let parsed = null;

            // Load from user database profile mapping if we have an active session
            if (this.currentUser) {
                const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
                const lookupKey = this.currentUser.toLowerCase();
                if (users[lookupKey] && users[lookupKey].state) {
                    parsed = users[lookupKey].state;
                }
            }

            // Fallback to active state key if not loaded yet
            if (!parsed) {
                const raw = localStorage.getItem("redline_tcg_state");
                if (raw) {
                    parsed = JSON.parse(raw);
                }
            }

            if (parsed) {
                this.state.playerName = parsed.playerName || this.currentUser || "RedlineDriver";
                this.state.coins = parsed.coins !== undefined ? parsed.coins : 20;
                this.state.activeCharm = parsed.activeCharm || null;
                this.state.starterCoinsEarned = parsed.starterCoinsEarned || 0;
                this.state.lastSpinTime = parsed.lastSpinTime || 0;
                this.state.freePackRip = parsed.freePackRip || false;
                this.state.charmsDisabledToday = parsed.charmsDisabledToday || false;
                this.state.discountActive = parsed.discountActive || false;
                this.state.completedPacks = parsed.completedPacks || [];
                this.state.claimedCompletions = parsed.claimedCompletions || [];
                this.state.cardInventory = parsed.cardInventory || {};
                this.state.charmsInventory = parsed.charmsInventory || [];
                this.state.ticketsInventory = parsed.ticketsInventory || { discount: 0, freeRip: 0 };
                this.state.taxExemptionActive = parsed.taxExemptionActive || false;
                this.state.fuelMultiplierCount = parsed.fuelMultiplierCount || 0;
                this.state.doubleDownActive = parsed.doubleDownActive || false;
                this.state.ticketsInventory = {
                    discount: 0,
                    freeRip: 0,
                    taxExemption: 0,
                    fuelMultiplier: 0,
                    doubleDown: 0,
                    ...this.state.ticketsInventory
                };
                if (parsed.dailyQuests) this.state.dailyQuests = parsed.dailyQuests;
                if (parsed.weeklyQuests) this.state.weeklyQuests = parsed.weeklyQuests;
                this.state.dailyResetTime = parsed.dailyResetTime || 0;
                this.state.weeklyResetTime = parsed.weeklyResetTime || 0;

                // Restore pack stock license unlock status
                if (parsed.unlockedPacks) {
                    parsed.unlockedPacks.forEach(item => {
                        const pack = PackLicenses.find(p => p.id === item.id);
                        if (pack) {
                            pack.unlocked = item.unlocked;
                        }
                    });
                }

                // Sync CardDatabase discovery flags and migrate inventory counts if needed
                if (parsed.discoveredList) {
                    parsed.discoveredList.forEach(item => {
                        const dbCard = CardDatabase.find(c => c.id === item.id);
                        if (dbCard) {
                            dbCard.discovered = item.discovered;
                            if (item.discovered && !this.state.cardInventory[item.id]) {
                                this.state.cardInventory[item.id] = 1;
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Failed to restore game save state:", e);
        }
    },

    /**
     * Check if the daily lock should reset (called when loading/opening Daily Spin view)
     */
    checkDailyReset() {
        const cooldown = 24 * 60 * 60 * 1000;
        const timePassed = Date.now() - this.state.lastSpinTime;
        if (timePassed >= cooldown) {
            if (this.state.charmsDisabledToday) {
                this.state.charmsDisabledToday = false;
                this.showToast("🔓 Charm shop has been unlocked for the new day!", "success");
                this.saveState();
            }
        }
    },

    /**
     * Updates spin wheel button state and status texts
     */
    updateSpinWheelStatus() {
        const spinBtn = document.getElementById("btn-spin-wheel");
        const statusText = document.getElementById("spin-status-text");
        if (!spinBtn || !statusText) return;

        if (this.state.isAnimating) {
            spinBtn.disabled = true;
            statusText.textContent = "Spinning the wheel...";
            return;
        }

        const cooldown = 24 * 60 * 60 * 1000;
        const timePassed = Date.now() - this.state.lastSpinTime;

        if (timePassed < cooldown) {
            spinBtn.disabled = true;
            const remaining = cooldown - timePassed;
            const hours = Math.floor(remaining / (3600 * 1000));
            const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            statusText.textContent = `Next spin available in: ${timeStr}`;
        } else {
            spinBtn.disabled = false;
            statusText.textContent = "Wheel is ready! Spin to win!";
        }
    },

    /**
     * Timer tick function for updating spin status countdown
     */
    spinWheelTimerTick() {
        const dailySpinPanel = document.getElementById("view-daily-spin");
        if (dailySpinPanel && dailySpinPanel.classList.contains("active")) {
            this.checkDailyReset();
            this.updateSpinWheelStatus();
        }
    },

    /**
     * Triggers the daily spin wheel animation and physics simulation
     */
    spinWheel() {
        if (this.state.isAnimating) return;

        const cooldown = 24 * 60 * 60 * 1000;
        const timePassed = Date.now() - this.state.lastSpinTime;
        if (timePassed < cooldown) {
            this.showToast("Wheel is on cooldown!", "error");
            return;
        }

        const canvas = document.getElementById("spin-wheel-canvas");
        if (!canvas) return;

        this.state.isAnimating = true;
        this.updateSpinWheelStatus();

        // 12 sectors, pick a random one
        const targetIndex = Math.floor(Math.random() * 12);
        
        // Setup initial or running rotation state
        if (this.currentRotation === undefined) {
            this.currentRotation = 0;
        }

        const currentAngle = this.currentRotation % 360;
        const targetAngle = (270 - (targetIndex * 30) - 15 + 360) % 360;
        let diff = targetAngle - currentAngle;
        if (diff <= 0) diff += 360;

        // Perform 5 full spins + diff
        const spinAmount = (5 * 360) + diff;
        this.currentRotation += spinAmount;

        canvas.style.transform = `rotate(${this.currentRotation}deg)`;

        setTimeout(() => {
            this.state.isAnimating = false;
            this.awardSpinPrize(targetIndex);
            this.updateSpinWheelStatus();
        }, 5000);
    },

    /**
     * Awards the prize and triggers related side-effects
     */
    awardSpinPrize(index) {
        const sectors = [
            { label: "+10 Coins", type: "coins", value: 10 },
            { label: "+25 Coins", type: "coins", value: 25 },
            { label: "+50 Coins", type: "coins", value: 50 },
            { label: "Fuel Mult.", type: "fuel_multiplier" },
            { label: "Double Down", type: "double_down" },
            { label: "+10 & Spin", type: "spin_again", value: 10 },
            { label: "Free Rip", type: "free_rip" },
            { label: "Lucky Redline", type: "lucky_redline" },
            { label: "Tax-Exempt", type: "tax_exemption" },
            { label: "10% Off", type: "discount" },
            { label: "Magnet", type: "charm", charmId: "universal-magnet" },
            { label: "Fuel Leak", type: "fuel_leak" }
        ];

        const prize = sectors[index];
        this.showToast(`🎡 Wheel Landed on: ${prize.label}!`, "success");

        switch (prize.type) {
            case "coins":
                this.state.coins = Math.max(0, this.state.coins + prize.value);
                if (prize.value > 0) {
                    this.showToast(`🪙 Added ${prize.value} coins to your balance!`, "success");
                } else {
                    this.showToast(`💸 Deducted ${Math.abs(prize.value)} coins from your balance!`, "error");
                }
                this.state.lastSpinTime = Date.now();
                break;
            case "spin_again":
                this.state.coins += prize.value;
                this.showToast(`🪙 Added ${prize.value} coins and granted a Free Spin!`, "success");
                // Do NOT update lastSpinTime
                break;
            case "free_rip":
                if (!this.state.ticketsInventory) this.state.ticketsInventory = { discount: 0, freeRip: 0, taxExemption: 0, fuelMultiplier: 0, doubleDown: 0 };
                this.state.ticketsInventory.freeRip = (this.state.ticketsInventory.freeRip || 0) + 1;
                this.showToast("🎫 You got a Free Pack Rip Ticket! Check your Inventory to activate it.", "success");
                this.state.lastSpinTime = Date.now();
                break;
            case "charm":
                const charmMeta = ShopCharms.find(c => c.id === prize.charmId);
                if (charmMeta) {
                    if (!this.state.charmsInventory) this.state.charmsInventory = [];
                    this.state.charmsInventory.push(JSON.parse(JSON.stringify(charmMeta)));
                    this.showToast(`⚡ Won Charm: ${charmMeta.name}! Added to your Inventory.`, "success");
                }
                this.state.lastSpinTime = Date.now();
                break;
            case "discount":
                if (!this.state.ticketsInventory) this.state.ticketsInventory = { discount: 0, freeRip: 0, taxExemption: 0, fuelMultiplier: 0, doubleDown: 0 };
                this.state.ticketsInventory.discount = (this.state.ticketsInventory.discount || 0) + 1;
                this.showToast("🏷️ Got a 10% Off Shop Ticket! Check your Inventory to activate it.", "success");
                this.state.lastSpinTime = Date.now();
                break;
            case "tax_exemption":
                if (!this.state.ticketsInventory) this.state.ticketsInventory = { discount: 0, freeRip: 0, taxExemption: 0, fuelMultiplier: 0, doubleDown: 0 };
                this.state.ticketsInventory.taxExemption = (this.state.ticketsInventory.taxExemption || 0) + 1;
                this.showToast("🎫 Won a Tax-Exemption Permit! Check your Inventory to activate it.", "success");
                this.state.lastSpinTime = Date.now();
                break;
            case "fuel_multiplier":
                if (!this.state.ticketsInventory) this.state.ticketsInventory = { discount: 0, freeRip: 0, taxExemption: 0, fuelMultiplier: 0, doubleDown: 0 };
                this.state.ticketsInventory.fuelMultiplier = (this.state.ticketsInventory.fuelMultiplier || 0) + 1;
                this.showToast("🎫 Won a Fuel Multiplier Token! Check your Inventory to activate it.", "success");
                this.state.lastSpinTime = Date.now();
                break;
            case "double_down":
                if (!this.state.ticketsInventory) this.state.ticketsInventory = { discount: 0, freeRip: 0, taxExemption: 0, fuelMultiplier: 0, doubleDown: 0 };
                this.state.ticketsInventory.doubleDown = (this.state.ticketsInventory.doubleDown || 0) + 1;
                this.showToast("🎫 Won a Double Down Token! Check your Inventory to activate it.", "success");
                this.state.lastSpinTime = Date.now();
                break;
            case "lucky_redline":
                const unlockedPacks = PackLicenses.filter(p => p.unlocked);
                unlockedPacks.sort((a, b) => b.cost - a.cost);
                const highestPack = unlockedPacks[0] || PackLicenses[0];
                this.showToast(`🎡 Won Lucky Redline Pack! Ripping a free ${highestPack.name}!`, "success");
                
                // Set state for free pack opening
                this.state.luckyRedlineActive = true;
                this.selectPackForOpening(highestPack.id);
                
                // We want to trigger it immediately, but let's wait a tiny bit for the view transitions
                setTimeout(() => {
                    this.executePackOpening();
                }, 300);
                
                this.state.lastSpinTime = Date.now();
                break;
            case "fuel_leak":
                const lostCoins = Math.min(15, this.state.coins);
                this.state.coins -= lostCoins;
                this.showToast(`💥 Fuel Leak! Breakdown drained ${lostCoins} Coins from your bankroll.`, "error");
                this.state.lastSpinTime = Date.now();
                break;
        }

        // Quest update: spin wheel
        this.updateQuestProgress("spin_wheel", 1);

        this.updateHeaderStats();
        UI.renderShop(PackLicenses, ShopCharms, this.state.coins);
        UI.renderShowroom(PackLicenses, this.state.coins);
        this.saveState();
    },

    /**
     * Checks if all eligible cars in a pack are discovered, awarding completion bonuses
     */
    checkNewPackCompletions() {
        let completedAny = false;
        PackLicenses.forEach(pack => {
            const eligibleCards = CardDatabase.filter(card => card.pack_eligibility.includes(pack.name));
            if (eligibleCards.length > 0) {
                const allOwned = eligibleCards.every(card => card.discovered && (this.state.cardInventory[card.id] || 0) > 0);
                const isAlreadyCompleted = this.state.completedPacks.includes(pack.id);

                if (allOwned) {
                    if (!isAlreadyCompleted) {
                        this.state.completedPacks.push(pack.id);
                        completedAny = true;

                        // Quest update: complete card pack
                        this.updateQuestProgress("complete_packs", 1);

                        // Award completion bonus only once per pack
                        if (!this.state.claimedCompletions.includes(pack.id)) {
                            this.state.claimedCompletions.push(pack.id);
                            this.state.coins += 7;
                            this.showToast(`🎉 Pack Completed: ${pack.name}! Bonus +🪙 7 Coins!`, "success");
                        } else {
                            this.showToast(`🎉 Pack Completed: ${pack.name}!`, "success");
                        }
                    }
                } else {
                    if (isAlreadyCompleted) {
                        // Remove from completed packs since a card was liquidated
                        this.state.completedPacks = this.state.completedPacks.filter(id => id !== pack.id);
                        completedAny = true;
                        this.showToast(`⚠️ Pack no longer complete: ${pack.name}`, "info");
                    }
                }
            }
        });
        if (completedAny) {
            this.updateHeaderStats();
            UI.renderShowroom(PackLicenses, this.state.coins);
            this.saveState();
        }
    },

    /**
     * Liquidates/scraps duplicate cards in the inventory back to the house for coins
     */
    scrapCard(cardId) {
        if (!this.state.cardInventory || (this.state.cardInventory[cardId] || 0) <= 0) {
            this.showToast("Cannot liquidate a vehicle you do not own!", "error");
            return;
        }

        const dbCard = CardDatabase.find(c => c.id === cardId);
        if (!dbCard) return;

        const scrapValue = UI.getScaledScrapValue(dbCard.rarity);
        
        this.state.cardInventory[cardId]--;
        this.state.coins += scrapValue;
        
        if (this.state.cardInventory[cardId] === 0) {
            dbCard.discovered = false;
            this.showToast(`♻️ Liquidated final copy of ${dbCard.manufacturer} ${dbCard.name} for +🪙 ${scrapValue} Coins!`, "success");
        } else {
            this.showToast(`♻️ Scrapped duplicate ${dbCard.manufacturer} ${dbCard.name} for +🪙 ${scrapValue} Coins!`, "success");
        }
        
        this.updateHeaderStats();
        const currentFilter = document.getElementById("index-pack-filter").value;
        UI.renderIndex(CardDatabase, currentFilter);
        this.checkNewPackCompletions();
        
        // Quest update: scrap card
        this.updateQuestProgress("scrap_cards", 1);
        this.updateQuestProgress(`scrap_rarity_${dbCard.rarity}`, 1);
        const highRarities = ["Rare", "Very Rare", "Epic", "Legendary", "Exotic", "Limited Edition"];
        if (highRarities.includes(dbCard.rarity)) {
            this.updateQuestProgress("scrap_high_rarity", 1);
        }
        this.updateQuestProgress("earn_scrap_coins", scrapValue);
        
        this.saveState();
    },

    /**
     * Instantly executes a bulk scrap operation, normalising all duplicate counters to x1
     */
    bulkScrapDuplicates() {
        if (!this.state.cardInventory) return;

        let totalRawYield = 0;
        let totalScrapped = 0;
        const highRarities = ["Rare", "Very Rare", "Epic", "Legendary", "Exotic", "Limited Edition"];

        CardDatabase.forEach(card => {
            const count = this.state.cardInventory[card.id] || 0;
            if (count > 1) {
                const dupes = count - 1;
                const scrapValue = UI.getScrapValue(card.rarity);
                
                totalRawYield += dupes * scrapValue;
                totalScrapped += dupes;
                this.state.cardInventory[card.id] = 1;

                // Quest update: rarity-specific scrap
                this.updateQuestProgress(`scrap_rarity_${card.rarity}`, dupes);
                if (highRarities.includes(card.rarity)) {
                    this.updateQuestProgress("scrap_high_rarity", dupes);
                }
            }
        });

        if (totalScrapped > 0) {
            const completedCount = (this.state.completedPacks || []).length;
            const multiplier = Math.pow(1.02, completedCount);
            const totalYield = Math.ceil(totalRawYield * multiplier);
            
            this.state.coins += totalYield;
            this.showToast(`♻️ Bulk Scrapped ${totalScrapped} duplicate cards for +🪙 ${totalYield} Coins!`, "success");
            this.updateHeaderStats();
            const currentFilter = document.getElementById("index-pack-filter").value;
            UI.renderIndex(CardDatabase, currentFilter);
            
            // Quest update: scrap cards in bulk and earn scrap coins
            this.updateQuestProgress("scrap_cards", totalScrapped);
            this.updateQuestProgress("earn_scrap_coins", totalYield);
            
            this.saveState();
        } else {
            this.showToast("No duplicates available to scrap!", "error");
        }
    },

    /**
     * Manually activates a Luck Charm from the inventory storage
     */
    activateCharm(index) {
        if (!this.state.charmsInventory || !this.state.charmsInventory[index]) return;
        
        const charm = this.state.charmsInventory[index];
        
        if (this.state.activeCharm) {
            if (!confirm(`⚡ You already have an active charm (${this.state.activeCharm.name}). Activating this will replace it. Continue?`)) {
                return;
            }
        }
        
        this.state.activeCharm = JSON.parse(JSON.stringify(charm));
        if (this.state.activeCharm.duration) {
                this.state.activeCharm.expiresAt = Date.now() + (this.state.activeCharm.duration * 1000);
        }
        
        this.state.charmsInventory.splice(index, 1);
        
        // Quest update: activate item
        this.updateQuestProgress("buy_and_activate_item", 1);
        
        this.showToast(`⚡ Activated Charm: ${this.state.activeCharm.name}!`, "success");
        this.updateHeaderStats();
        UI.renderInventory();
        this.saveState();
    },

    /**
     * Toggles the active status of 10% off shop tickets
     */
    toggleDiscountTicket() {
        if (this.state.discountActive) {
            this.state.discountActive = false;
            this.showToast("🏷️ Shop Discount deactivated.", "success");
        } else {
            if ((this.state.ticketsInventory.discount || 0) <= 0) {
                this.showToast("No 10% Off Tickets in Inventory!", "error");
                return;
            }
            this.state.discountActive = true;
            
            // Quest update: activate item
            this.updateQuestProgress("buy_and_activate_item", 1);
            
            this.showToast("🏷️ Shop Discount activated! It will apply to your next purchase.", "success");
        }
        UI.renderInventory();
        UI.renderShop(PackLicenses, ShopCharms, this.state.coins);
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Toggles the active status of Free Pack Rip tickets
     */
    toggleFreeRipTicket() {
        if (this.state.freePackRip) {
            this.state.freePackRip = false;
            this.showToast("🎫 Free Pack Rip deactivated.", "success");
        } else {
            if ((this.state.ticketsInventory.freeRip || 0) <= 0) {
                this.showToast("No Free Pack Rip Tickets in Inventory!", "error");
                return;
            }
            this.state.freePackRip = true;
            
            // Quest update: activate item
            this.updateQuestProgress("buy_and_activate_item", 1);
            
            this.showToast("🎫 Free Pack Rip activated! Select any pack to open for free.", "success");
        }
        UI.renderInventory();
        UI.renderShowroom(PackLicenses, this.state.coins);
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Toggles the active status of Tax-Exemption Permits
     */
    toggleTaxExemptionTicket() {
        if (this.state.taxExemptionActive) {
            this.state.taxExemptionActive = false;
            this.showToast("🎫 Tax-Exemption Permit deactivated.", "success");
        } else {
            if ((this.state.ticketsInventory.taxExemption || 0) <= 0) {
                this.showToast("No Tax-Exemption Permits in Inventory!", "error");
                return;
            }
            this.state.taxExemptionActive = true;
            
            // Quest update: activate item
            this.updateQuestProgress("buy_and_activate_item", 1);
            
            this.showToast("🎫 Tax-Exemption Permit activated! Your next single roll opening fee is waived.", "success");
        }
        UI.renderInventory();
        UI.renderShowroom(PackLicenses, this.state.coins);
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Activates a Fuel Multiplier token
     */
    activateFuelMultiplier() {
        if ((this.state.ticketsInventory.fuelMultiplier || 0) <= 0) {
            this.showToast("No Fuel Multipliers in Inventory!", "error");
            return;
        }
        this.state.ticketsInventory.fuelMultiplier = Math.max(0, this.state.ticketsInventory.fuelMultiplier - 1);
        this.state.fuelMultiplierCount = (this.state.fuelMultiplierCount || 0) + 3;
        
        // Quest update: activate item
        this.updateQuestProgress("buy_and_activate_item", 1);
        
        this.showToast("🔥 Activated Fuel Multiplier! Your next 3 new discoveries will reward 2x Coins.", "success");
        UI.renderInventory();
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Toggles the active status of Double Down tokens
     */
    toggleDoubleDownTicket() {
        if (this.state.doubleDownActive) {
            this.state.doubleDownActive = false;
            this.showToast("🎫 Double Down Token deactivated.", "success");
        } else {
            if ((this.state.ticketsInventory.doubleDown || 0) <= 0) {
                this.showToast("No Double Down Tokens in Inventory!", "error");
                return;
            }
            this.state.doubleDownActive = true;
            
            // Quest update: activate item
            this.updateQuestProgress("buy_and_activate_item", 1);
            
            this.showToast("🎫 Double Down Token activated! Your next pack opening will generate double copies.", "success");
        }
        UI.renderInventory();
        this.updateHeaderStats();
        this.saveState();
    },

    /**
     * Spawns a simulated 15-second rewarded video ad overlay and awards 50 coins on completion
     */
    watchRewardedVideo() {
        let modal = document.getElementById("ad-reward-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "ad-reward-modal";
            modal.className = "modal-overlay";
            modal.style.zIndex = "99999";
            document.body.appendChild(modal);
        }
        
        modal.style.display = "flex";
        let timeLeft = 15;
        
        const updateAdModal = () => {
            modal.innerHTML = `
                <div class="handbook-content" style="max-width: 480px; text-align: center; border: 1px solid var(--neon-cyan); background: rgba(12, 12, 14, 0.95); box-shadow: 0 0 25px rgba(0, 240, 255, 0.35);">
                    <style>
                        @keyframes adPulse {
                            0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.4)); }
                            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(0, 240, 255, 0.8)); }
                            100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.4)); }
                        }
                    </style>
                    <div style="margin-bottom: 1rem;">
                        <span style="font-size: 0.65rem; color: var(--neon-cyan); font-weight: bold; border: 1px solid var(--neon-cyan); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1.5px;">Simulated Video Ad</span>
                    </div>
                    
                    <div style="width: 100%; height: 180px; background: #000; border: 1px solid var(--border-main); border-radius: 8px; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(0,240,255,0.05), rgba(46,204,113,0.05)); z-index: 1;"></div>
                        <div style="font-size: 2.8rem; margin-bottom: 0.5rem; animation: adPulse 2s infinite; z-index: 2;">🚗💨</div>
                        <div style="font-family: 'Orbitron', sans-serif; font-size: 0.95rem; color: #fff; font-weight: bold; letter-spacing: 0.5px; z-index: 2;">Redline Racing Championship</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; z-index: 2;">"Feel the High-Octane Speed!"</div>
                        
                        <!-- Progress bar -->
                        <div style="position: absolute; bottom: 0; left: 0; height: 6px; background: #2ecc71; width: ${(15 - timeLeft) / 15 * 100}%; transition: width 1s linear; z-index: 3;"></div>
                    </div>
                    
                    <h3 style="font-family: 'Orbitron', sans-serif; color: #fff; margin-top: 0; margin-bottom: 0.5rem;">Watching Ad for Reward...</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0; margin-bottom: 1.5rem; line-height: 1.4;">
                        Watch the simulated sponsorship video to the end to claim your reward of <strong style="color: #ffb300;">🪙 50 coins</strong>.
                    </p>
                    
                    <div style="text-align: center;">
                        <button class="cta-btn" id="ad-reward-claim-btn" disabled style="font-family: 'Orbitron', sans-serif; font-size: 0.85rem; padding: 0.5rem 1.5rem; border-color: #71717a; color: #71717a; background: transparent; cursor: not-allowed;">
                            Ad playing (${timeLeft}s remaining)
                        </button>
                    </div>
                </div>
            `;
        };
        
        updateAdModal();
        
        let interval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(interval);
                
                const btn = document.getElementById("ad-reward-claim-btn");
                if (btn) {
                    btn.disabled = false;
                    btn.style.cursor = "pointer";
                    btn.style.borderColor = "#2ecc71";
                    btn.style.color = "#2ecc71";
                    btn.style.background = "rgba(46, 204, 113, 0.1)";
                    btn.innerText = "CLAIM 🪙 50 COINS";
                    btn.onclick = () => {
                        this.state.coins += 50;
                        this.saveState();
                        this.updateHeaderStats();
                        this.showToast("🎉 Ad complete! +🪙 50 Coins added to your wallet.", "success");
                        modal.style.display = "none";
                    };
                }
            } else {
                updateAdModal();
            }
        }, 1000);
    },

    /**
     * Check if player needs to see the Handbook on boarding
     */
    checkHandbook() {
        this.showHandbookModal();
    },

    /**
     * Displays Driver's Handbook popup onboarding modal
     */
    showHandbookModal() {
        let modal = document.getElementById("handbook-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "handbook-modal";
            modal.className = "modal-overlay";
            modal.innerHTML = `
                <div class="handbook-content">
                    <div style="text-align: center; margin-bottom: 1.5rem; flex-shrink: 0;">
                        <span style="font-size: 3rem; filter: drop-shadow(0 0 10px #00f0ff);">📖</span>
                        <h2 style="font-family: 'Orbitron', sans-serif; color: #00f0ff; letter-spacing: 1.5px; text-transform: uppercase; margin: 0.5rem 0 0 0; font-size: 1.75rem;">The Driver's Handbook</h2>
                        <div style="font-family: 'Orbitron', sans-serif; color: #ff3e3e; font-size: 0.9rem; font-weight: 700; margin-top: 0.25rem; letter-spacing: 0.5px;">ULTIMATE OBJECTIVE: BUILD THE ULTIMATE GLOBAL FLEET</div>
                    </div>
                    <div style="line-height: 1.6; font-size: 0.95rem; color: #d4d4d8; margin-bottom: 2rem; max-height: 300px; flex: 1 1 auto; overflow-y: auto; padding-right: 0.5rem;">
                        <p style="margin-top: 0;">Welcome to the starting grid. Your mission? Hunt down, unlock, and collect every elite machine on the planet—from street-tuned daily road warriors to multi-million dollar hypercars.</p>
                        <p>Rip packs, handle the opening tax, and manage your garage inventory like a pro. Pull duplicates? Scrap them back to the house for quick cash to fund your next big pull.</p>
                        <p style="margin-bottom: 0;">Stack your odds with Luck Charms, track your duplicates, and see if you have what it takes to unlock 100% completion. Conquer the Index, fill your garage, and dominate the Redline!</p>
                    </div>
                    <div style="text-align: center; flex-shrink: 0;">
                        <button class="cta-btn glow-btn" onclick="app.closeHandbookModal()" style="font-size: 1.1rem; padding: 0.6rem 2rem; font-family: 'Orbitron', sans-serif; cursor: pointer;">ENTER STARTING GRID</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = "flex";
        }
    },

    /**
     * Closes the onboarding Driver's Handbook modal
     */
    closeHandbookModal() {
        const modal = document.getElementById("handbook-modal");
        if (modal) {
            modal.style.display = "none";
        }
        localStorage.setItem("redline_tcg_handbook_seen", "true");
    },

    resetGame() {
        if (confirm("Are you sure you want to reset all game progress? This will lock all packs, clear your coins, and reset discovered cars.")) {
            if (this.currentUser) {
                const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
                const lookupKey = this.currentUser.toLowerCase();
                if (users[lookupKey]) {
                    delete users[lookupKey].state;
                    localStorage.setItem("redline_tcg_users", JSON.stringify(users));
                }
            }
            localStorage.removeItem("redline_tcg_state");
            localStorage.removeItem("redline_tcg_handbook_seen");
            this.showToast("🔄 Game progress reset! Reloading...", "success");
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    },

    getNextDailyReset() {
        const d = new Date();
        d.setHours(24, 0, 0, 0);
        return d.getTime();
    },

    getNextWeeklyReset() {
        const d = new Date();
        const day = d.getDay();
        const diff = (day === 0 ? 1 : 8 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    },

    questsTimerTick() {
        const now = Date.now();
        
        // Check Daily Reset
        if (this.state.dailyResetTime && now >= this.state.dailyResetTime) {
            this.state.dailyQuests = this.getRandomQuests(DailyQuestsPool, 3);
            this.state.dailyResetTime = this.getNextDailyReset();
            this.showToast("☀️ Daily quests have reset!", "success");
            this.saveState();
            const panel = document.getElementById("view-quests");
            if (panel && panel.classList.contains("active")) {
                UI.renderQuests();
            }
        }
        
        // Check Weekly Reset
        if (this.state.weeklyResetTime && now >= this.state.weeklyResetTime) {
            this.state.weeklyQuests = this.getRandomQuests(WeeklyQuestsPool, 3);
            this.state.weeklyResetTime = this.getNextWeeklyReset();
            this.showToast("📅 Weekly quests have reset!", "success");
            this.saveState();
            const panel = document.getElementById("view-quests");
            if (panel && panel.classList.contains("active")) {
                UI.renderQuests();
            }
        }
        
        // Update countdown clocks in DOM
        const dailyTimer = document.getElementById("daily-reset-timer");
        const weeklyTimer = document.getElementById("weekly-reset-timer");
        
        if (dailyTimer && this.state.dailyResetTime) {
            const diff = this.state.dailyResetTime - now;
            if (diff > 0) {
                const hours = Math.floor(diff / (3600 * 1000));
                const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
                const secs = Math.floor((diff % (60 * 1000)) / 1000);
                dailyTimer.textContent = `Resets in: ${hours}h ${mins}m ${secs}s`;
            } else {
                dailyTimer.textContent = `Resets in: --`;
            }
        }
        
        if (weeklyTimer && this.state.weeklyResetTime) {
            const diff = this.state.weeklyResetTime - now;
            if (diff > 0) {
                const days = Math.floor(diff / (24 * 3600 * 1000));
                const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
                const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
                const secs = Math.floor((diff % (60 * 1000)) / 1000);
                weeklyTimer.textContent = `Resets in: ${days}d ${hours}h ${mins}m ${secs}s`;
            } else {
                weeklyTimer.textContent = `Resets in: --`;
            }
        }
    },

    updateQuestProgress(action, amount) {
        let stateChanged = false;
        
        if (this.state.dailyQuests) {
            this.state.dailyQuests.forEach(q => {
                if (q.action === action && !q.claimed) {
                    const oldProg = q.progress;
                    q.progress = Math.min(q.target, q.progress + amount);
                    if (q.progress !== oldProg) {
                        stateChanged = true;
                    }
                }
            });
        }
        
        if (this.state.weeklyQuests) {
            this.state.weeklyQuests.forEach(q => {
                if (q.action === action && !q.claimed) {
                    const oldProg = q.progress;
                    q.progress = Math.min(q.target, q.progress + amount);
                    if (q.progress !== oldProg) {
                        stateChanged = true;
                    }
                }
            });
        }
        
        if (stateChanged) {
            this.saveState();
            const panel = document.getElementById("view-quests");
            if (panel && panel.classList.contains("active")) {
                UI.renderQuests();
            }
        }
    },

    getRandomQuests(pool, count) {
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count).map(q => ({ ...q }));
        return selected;
    },

    initializeQuestsProgress(quests) {
        quests.forEach(q => {
            if (q.action === "complete_packs") {
                q.progress = Math.min(q.target, (this.state.completedPacks || []).length);
            }
        });
    },

    claimQuestReward(questId, type) {
        const list = type === 'daily' ? this.state.dailyQuests : this.state.weeklyQuests;
        if (!list) return;
        
        const quest = list.find(q => q.id === questId);
        if (quest && quest.progress >= quest.target && !quest.claimed) {
            this.state.coins += quest.reward;
            quest.claimed = true;
            this.showToast(`🏆 Claimed quest reward: +🪙 ${quest.reward} Coins!`, "success");
            
            if (type === 'daily') {
                this.updateQuestProgress("complete_daily_quests", 1);
            }
            
            this.updateHeaderStats();
            UI.renderQuests();
            this.saveState();
        }
    },

    checkSupercarsGate() {
        const otherPacks = PackLicenses.filter(p => p.id !== "supercars");
        
        // Condition A: All other 16 foundational packs are unlocked
        const conditionA = otherPacks.every(p => p.unlocked);
        
        // Condition B: At least 80% completion density in every single unlocked pack
        let conditionB = true;
        const packDensities = [];
        
        otherPacks.forEach(p => {
            const eligible = CardDatabase.filter(c => c.pack_eligibility.includes(p.name));
            const discovered = eligible.filter(c => c.discovered && (this.state.cardInventory[c.id] || 0) > 0).length;
            const density = eligible.length > 0 ? (discovered / eligible.length) : 1.0;
            
            if (p.unlocked) {
                packDensities.push({
                    packId: p.id,
                    name: p.name,
                    density: density,
                    discovered: discovered,
                    total: eligible.length
                });
                if (density < 0.80) {
                    conditionB = false;
                }
            } else {
                packDensities.push({
                    packId: p.id,
                    name: p.name,
                    density: density,
                    discovered: discovered,
                    total: eligible.length
                });
            }
        });
        
        return {
            conditionA,
            conditionB,
            unlocked: conditionA && conditionB,
            packDensities
        };
    },

    showSupercarsGateMonitor() {
        const gate = this.checkSupercarsGate();
        this.showSupercarsGateModal(gate);
    },

    showSupercarsGateModal(gate) {
        let modal = document.getElementById("supercars-gate-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "supercars-gate-modal";
            modal.className = "modal-overlay";
            document.body.appendChild(modal);
        }
        
        const otherPacks = PackLicenses.filter(p => p.id !== "supercars");
        const unlockedCount = otherPacks.filter(p => p.unlocked).length;
        
        let conditionA_HTML = unlockedCount === 16
            ? `<span style="color: #2ecc71; font-weight: bold;">✓ COMPLETE (16/16 Packs Unlocked)</span>`
            : `<span style="color: #ef4444; font-weight: bold;">\u2717 INCOMPLETE (${unlockedCount}/16 Packs Unlocked)</span>`;
            
        let densityDetailsHTML = "";
        let failedPacksCount = 0;
        
        gate.packDensities.forEach(pd => {
            const pct = Math.floor(pd.density * 100);
            const isUnlocked = PackLicenses.find(p => p.id === pd.packId).unlocked;
            const met = isUnlocked && pct >= 80;
            if (isUnlocked && !met) failedPacksCount++;
            
            let statusStyle = `color: ${met ? '#2ecc71' : (isUnlocked ? '#ef4444' : '#71717a')};`;
            let statusText = isUnlocked ? `${pd.discovered}/${pd.total} (${pct}%)` : `LOCKED (0%)`;
            let borderStyle = `border-left: 3px solid ${met ? '#2ecc71' : (isUnlocked ? '#ef4444' : 'rgba(255,255,255,0.08)')};`;
            
            densityDetailsHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.02); border-radius: 4px; ${borderStyle} font-size: 0.8rem; margin-bottom: 0.25rem;">
                    <span>${pd.name}</span>
                    <span style="font-family: 'Orbitron', sans-serif; font-weight: bold; ${statusStyle}">${statusText}</span>
                </div>
            `;
        });
        
        const conditionB_HTML = failedPacksCount === 0 && unlockedCount === 16
            ? `<span style="color: #2ecc71; font-weight: bold;">✓ COMPLETE (All unlocked packs >= 80% completion)</span>`
            : `<span style="color: #ef4444; font-weight: bold;">\u2717 INCOMPLETE (${failedPacksCount} unlocked pack(s) below 80% completion)</span>`;
            
        modal.innerHTML = `
            <div class="handbook-content" style="max-width: 480px; border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.25); text-align: left; position: relative;">
                <button onclick="document.getElementById('supercars-gate-modal').remove()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: #a1a1aa; font-size: 1.25rem; cursor: pointer;">✕</button>
                <h2 style="font-family: 'Orbitron', sans-serif; color: #ef4444; font-size: 1.4rem; margin-bottom: 1rem; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); display: flex; align-items: center; gap: 0.5rem;">
                    🔒 Cryptographic Progression Wall
                </h2>
                <p style="font-size: 0.85rem; color: #d1d5db; line-height: 1.5; margin-bottom: 1.5rem;">
                    The ultimate Supercars Pack is locked behind two security protocols. Both checkmarks must be green to access the final licensing sequence.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <!-- Condition A -->
                    <div style="background: rgba(17, 17, 19, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <h3 style="font-size: 0.9rem; font-family: 'Orbitron', sans-serif; margin-bottom: 0.35rem; color: #fff;">Condition A: Showroom Completion</h3>
                        <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.5rem;">Unlock all 16 foundational packs in the Showroom.</p>
                        <div style="font-size: 0.8rem;">${conditionA_HTML}</div>
                    </div>
                    
                    <!-- Condition B -->
                    <div style="background: rgba(17, 17, 19, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <h3 style="font-size: 0.9rem; font-family: 'Orbitron', sans-serif; margin-bottom: 0.35rem; color: #fff;">Condition B: Collection Density Target</h3>
                        <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.75rem;">Achieve at least 80% discovery rate in all unlocked packs.</p>
                        <div style="font-size: 0.8rem; margin-bottom: 0.75rem;">${conditionB_HTML}</div>
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 150px; overflow-y: auto; padding-right: 0.25rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                            ${densityDetailsHTML}
                        </div>
                    </div>
                </div>
                
                <button onclick="document.getElementById('supercars-gate-modal').remove()" style="margin-top: 1.5rem; width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 0.8rem; text-align: center;">
                    Close Progression Monitor
                </button>
            </div>
        `;
    },

    /**
     * Establish connection to simulated P2P Trade Room
     */
    startTradeSession() {
        const peerIdInput = document.getElementById("trade-peer-id");
        if (!peerIdInput) return;
        const peerId = peerIdInput.value.trim();
        if (!peerId) {
            this.showToast("Please enter a valid Peer User ID!", "error");
            return;
        }
        if (peerId.toLowerCase() === "player1" || peerId.toLowerCase() === "you" || peerId.toLowerCase() === "player_1") {
            this.showToast("You cannot trade with yourself!", "error");
            return;
        }

        const peerData = this.getPeerData(peerId);

        this.tradeSession = {
            active: true,
            peerId: peerId,
            peerCoins: peerData.coins,
            peerInventory: peerData.inventory,
            p1CoinsOffered: 0,
            p2CoinsOffered: 0,
            p1CardsOffered: {},
            p2CardsOffered: {},
            p1Locked: false,
            p2Locked: false
        };

        this.showToast(`📡 Connected to Trade Room with ${peerId}!`, "success");
        UI.renderTradeTerminal();
    },

    /**
     * Generates a deterministic mock peer profile from peerId seed
     */
    getPeerData(peerId) {
        let hash = 0;
        for (let i = 0; i < peerId.length; i++) {
            hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        // Deterministic coins balance
        const coins = 100 + (hash % 900); // 100 to 1000 coins

        // Deterministic inventory cards
        const duplicates = {};
        const cardPool = CardDatabase.filter(c => c.rarity !== "Limited Edition");

        const numCards = 6 + (hash % 7); // 6 to 12 cards
        for (let i = 0; i < numCards; i++) {
            const cardIndex = (hash + (i * 31)) % cardPool.length;
            const card = cardPool[cardIndex];
            // 2 to 4 copies so it has duplicates (count - 1 available to trade)
            duplicates[card.id] = 2 + ((hash + i) % 3);
        }

        return { coins, inventory: duplicates };
    },

    /**
     * Terminates connection and resets trade terminal state
     */
    cancelTradeSession() {
        this.tradeSession = null;
        this.showToast("🔌 Trade session terminated.", "info");
        UI.renderTradeTerminal();
    },

    /**
     * Toggles locking the Player 1 (You) offer block
     */
    toggleLockP1() {
        if (!this.tradeSession) return;
        this.tradeSession.p1Locked = !this.tradeSession.p1Locked;
        this.showToast(this.tradeSession.p1Locked ? "🔒 Player 1 offer LOCKED." : "🔓 Player 1 offer UNLOCKED.", "info");
        UI.renderTradeTerminal();
    },

    /**
     * Toggles locking the Player 2 (Peer) offer block
     */
    toggleLockP2() {
        if (!this.tradeSession) return;
        this.tradeSession.p2Locked = !this.tradeSession.p2Locked;
        this.showToast(this.tradeSession.p2Locked ? "🔒 Player 2 offer LOCKED." : "🔓 Player 2 offer UNLOCKED.", "info");
        UI.renderTradeTerminal();
    },

    /**
     * Updates Player 1 coin injection count
     */
    updateTradeP1Coins(value) {
        if (!this.tradeSession) return;
        if (this.tradeSession.p1Locked) {
            this.showToast("Cannot modify offer: Player 1 is locked!", "error");
            UI.renderTradeTerminal();
            return;
        }
        const coins = parseInt(value) || 0;
        if (coins < 0) {
            this.showToast("Coins cannot be negative!", "error");
            UI.renderTradeTerminal();
            return;
        }
        if (this.state.coins < (coins + 5)) {
            this.showToast("Insufficient coins to cover offer + 5 Coin fee!", "error");
            UI.renderTradeTerminal();
            return;
        }
        this.tradeSession.p1CoinsOffered = coins;
        UI.renderTradeTerminal();
    },

    /**
     * Updates Player 2 coin injection count
     */
    updateTradeP2Coins(value) {
        if (!this.tradeSession) return;
        if (this.tradeSession.p2Locked) {
            this.showToast("Cannot modify offer: Player 2 is locked!", "error");
            UI.renderTradeTerminal();
            return;
        }
        const coins = parseInt(value) || 0;
        if (coins < 0) {
            this.showToast("Coins cannot be negative!", "error");
            UI.renderTradeTerminal();
            return;
        }
        if (this.tradeSession.peerCoins < coins) {
            this.showToast("Peer has insufficient coins!", "error");
            UI.renderTradeTerminal();
            return;
        }
        this.tradeSession.p2CoinsOffered = coins;
        UI.renderTradeTerminal();
    },

    /**
     * Adds a duplicate card to a player's active offer block
     */
    addCardToTrade(playerNum, cardId) {
        if (!this.tradeSession) return;
        if (playerNum === 1) {
            if (this.tradeSession.p1Locked) {
                this.showToast("Cannot modify offer: Player 1 is locked!", "error");
                return;
            }
            const count = this.state.cardInventory[cardId] || 0;
            const currentOffered = this.tradeSession.p1CardsOffered[cardId] || 0;
            if (currentOffered < count) {
                this.tradeSession.p1CardsOffered[cardId] = currentOffered + 1;
                UI.renderTradeTerminal();
            } else {
                this.showToast("You cannot trade more copies than you own!", "error");
            }
        } else {
            if (this.tradeSession.p2Locked) {
                this.showToast("Cannot modify offer: Player 2 is locked!", "error");
                return;
            }
            const count = this.tradeSession.peerInventory[cardId] || 0;
            const currentOffered = this.tradeSession.p2CardsOffered[cardId] || 0;
            if (currentOffered < count) {
                this.tradeSession.p2CardsOffered[cardId] = currentOffered + 1;
                UI.renderTradeTerminal();
            } else {
                this.showToast("Peer cannot trade more copies than they own!", "error");
            }
        }
    },

    /**
     * Removes a card from a player's active offer block
     */
    removeCardFromTrade(playerNum, cardId) {
        if (!this.tradeSession) return;
        if (playerNum === 1) {
            if (this.tradeSession.p1Locked) {
                this.showToast("Cannot modify offer: Player 1 is locked!", "error");
                return;
            }
            const currentOffered = this.tradeSession.p1CardsOffered[cardId] || 0;
            if (currentOffered > 1) {
                this.tradeSession.p1CardsOffered[cardId] = currentOffered - 1;
            } else {
                delete this.tradeSession.p1CardsOffered[cardId];
            }
            UI.renderTradeTerminal();
        } else {
            if (this.tradeSession.p2Locked) {
                this.showToast("Cannot modify offer: Player 2 is locked!", "error");
                return;
            }
            const currentOffered = this.tradeSession.p2CardsOffered[cardId] || 0;
            if (currentOffered > 1) {
                this.tradeSession.p2CardsOffered[cardId] = currentOffered - 1;
            } else {
                delete this.tradeSession.p2CardsOffered[cardId];
            }
            UI.renderTradeTerminal();
        }
    },

    /**
     * Finalizes atomic database resolution of exchange arrays
     */
    confirmTrade() {
        if (!this.tradeSession) return;

        // 1. Dual lock verification
        if (!this.tradeSession.p1Locked || !this.tradeSession.p2Locked) {
            this.showToast("Both players must LOCK their offers first!", "error");
            return;
        }

        // 2. Valuation Variance Calculation
        let p1Val = this.tradeSession.p1CoinsOffered;
        for (const cardId in this.tradeSession.p1CardsOffered) {
            const card = CardDatabase.find(c => c.id === cardId);
            if (card) {
                p1Val += this.tradeSession.p1CardsOffered[cardId] * UI.getScrapValue(card.rarity);
            }
        }

        let p2Val = this.tradeSession.p2CoinsOffered;
        for (const cardId in this.tradeSession.p2CardsOffered) {
            const card = CardDatabase.find(c => c.id === cardId);
            if (card) {
                p2Val += this.tradeSession.p2CardsOffered[cardId] * UI.getScrapValue(card.rarity);
            }
        }

        const maxVal = Math.max(p1Val, p2Val);
        const diff = Math.abs(p1Val - p2Val);
        const variance = maxVal === 0 ? 0 : (diff / maxVal);

        if (variance > 0.20) {
            this.showToast("Unbalanced trade! Asset values must stay within 20% variance.", "error");
            return;
        }

        // 3. Balance verification for Player 1 (offered coins + 5 fee)
        const finalP1Deduction = this.tradeSession.p1CoinsOffered + 5;
        if (this.state.coins < finalP1Deduction) {
            this.showToast("Insufficient coins to cover offer + 5 Coin trade fee!", "error");
            return;
        }

        // 4. Atomic exchange resolution
        // Revoke Player 1's cards
        for (const cardId in this.tradeSession.p1CardsOffered) {
            const qty = this.tradeSession.p1CardsOffered[cardId];
            this.state.cardInventory[cardId] = (this.state.cardInventory[cardId] || 0) - qty;
            if (this.state.cardInventory[cardId] <= 0) {
                this.state.cardInventory[cardId] = 0;
                const dbCard = CardDatabase.find(c => c.id === cardId);
                if (dbCard) {
                    dbCard.discovered = false;
                }
            }
        }

        // Append Player 2's cards to Player 1
        for (const cardId in this.tradeSession.p2CardsOffered) {
            const qty = this.tradeSession.p2CardsOffered[cardId];
            this.state.cardInventory[cardId] = (this.state.cardInventory[cardId] || 0) + qty;

            const dbCard = CardDatabase.find(c => c.id === cardId);
            if (dbCard && !dbCard.discovered) {
                dbCard.discovered = true;
            }
        }

        // Deduct/Add coins
        this.state.coins -= finalP1Deduction;
        this.state.coins += this.tradeSession.p2CoinsOffered;

        // Update quests
        this.updateQuestProgress("resolve_trades", 1);

        const peerId = this.tradeSession.peerId;
        this.tradeSession = null;

        // Save state and refresh
        this.saveState();
        this.updateHeaderStats();
        this.showToast(`🤝 Trade with ${peerId} successfully completed! Fee paid: 🪙 5 Coins.`, "success");

        UI.renderTradeTerminal();
    },

    /**
     * Updates player display name
     */
    updatePlayerName(name) {
        const cleaned = name.trim();
        if (!cleaned) {
            this.showToast("Racer name cannot be empty!", "error");
            return;
        }
        this.state.playerName = cleaned;
        this.saveState();
        this.showToast("👤 Racer profile updated!", "success");
        UI.renderSettings();
    },

    /**
     * Hashes password using a simple rolling checksum & base-36 encoding with custom salt key
     */
    hashPassword(password) {
        const salt = "R3DL1N3_K3Y_S4LT_2026";
        const combined = password + salt;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36) + "-" + combined.length.toString(36);
    },

    login(username, password) {
        const cleanUsername = username.trim();
        const lookupKey = cleanUsername.toLowerCase();
        if (!cleanUsername || !password) {
            this.showToast("Username and password cannot be empty!", "error");
            return false;
        }

        // Specific administrator bypass check
        if (cleanUsername === "admin@001" && password === "dzv4me6g085nrytc") {
            const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
            
            // Build absolute unlocked state profile
            const adminInventory = {};
            if (typeof CardDatabase !== 'undefined') {
                CardDatabase.forEach(card => {
                    adminInventory[card.id] = 9; // Grant 9 copies of every card
                });
            }

            const adminState = {
                playerName: "Administrator",
                coins: 999999, // Grant 999,999 coins
                unopenedPacks: {},
                activeCharm: null,
                starterCoinsEarned: 50,
                selectedPackId: null,
                isAnimating: false,
                lastSpinTime: Date.now(),
                freePackRip: false,
                charmsDisabledToday: false,
                discountActive: false,
                completedPacks: typeof PackLicenses !== 'undefined' ? PackLicenses.map(p => p.id) : [],
                claimedCompletions: [],
                cardInventory: adminInventory,
                charmsInventory: [],
                ticketsInventory: {
                    discount: 9,
                    freeRip: 9,
                    taxExemption: 9,
                    fuelMultiplier: 9,
                    doubleDown: 9
                },
                taxExemptionActive: false,
                fuelMultiplierCount: 0,
                doubleDownActive: false,
                dailyQuests: [],
                weeklyQuests: [],
                dailyResetTime: Date.now() + 86400000,
                weeklyResetTime: Date.now() + 604800000
            };

            // Inject/overwrite database mapping
            users[lookupKey] = {
                username: "admin@001",
                passwordHash: this.hashPassword(password),
                state: adminState
            };

            localStorage.setItem("redline_tcg_users", JSON.stringify(users));
            localStorage.setItem("redline_tcg_session", "admin@001");
            this.currentUser = "admin@001";
            document.body.classList.remove("logged-out");

            this.init();
            
            // Force discover status inside the global CardDatabase and PackLicenses in-memory arrays immediately
            if (typeof CardDatabase !== 'undefined') {
                CardDatabase.forEach(card => {
                    card.discovered = true;
                });
            }
            if (typeof PackLicenses !== 'undefined') {
                PackLicenses.forEach(p => {
                    p.unlocked = true;
                });
            }

            this.showToast("⚡ Administrator access authenticated! Everything unlocked.", "success");
            this.changeView("showroom");
            return true;
        }

        const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
        const user = users[lookupKey];
        if (!user) {
            this.showToast("Username does not exist!", "error");
            return false;
        }

        const passHash = this.hashPassword(password);
        if (user.passwordHash !== passHash) {
            this.showToast("Incorrect password!", "error");
            return false;
        }

        // Set active session
        localStorage.setItem("redline_tcg_session", user.username);
        this.currentUser = user.username;
        document.body.classList.remove("logged-out");

        // Force reload / re-init to sync user details
        this.init();
        this.showToast(`🏎️ Welcome back, ${this.currentUser}!`, "success");
        this.changeView("showroom");
        return true;
    },

    /**
     * Registers a new user account
     */
    signUp(username, password) {
        const cleanUsername = username.trim();
        const lookupKey = cleanUsername.toLowerCase();
        if (!cleanUsername || !password) {
            this.showToast("Username and password cannot be empty!", "error");
            return false;
        }
        if (cleanUsername.length < 3) {
            this.showToast("Username must be at least 3 characters long!", "error");
            return false;
        }
        if (password.length < 4) {
            this.showToast("Password must be at least 4 characters long!", "error");
            return false;
        }

        const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
        if (users[lookupKey]) {
            this.showToast("Username already exists!", "error");
            return false;
        }

        // Create a default initial state
        const defaultState = {
            playerName: cleanUsername,
            coins: 20,
            unopenedPacks: {},
            activeCharm: null,
            starterCoinsEarned: 0,
            selectedPackId: null,
            isAnimating: false,
            lastSpinTime: 0,
            freePackRip: false,
            charmsDisabledToday: false,
            discountActive: false,
            completedPacks: [],
            claimedCompletions: [],
            cardInventory: {},
            charmsInventory: [],
            ticketsInventory: {
                discount: 0,
                freeRip: 0,
                taxExemption: 0,
                fuelMultiplier: 0,
                doubleDown: 0
            },
            taxExemptionActive: false,
            fuelMultiplierCount: 0,
            doubleDownActive: false,
            dailyQuests: [],
            weeklyQuests: [],
            dailyResetTime: 0,
            weeklyResetTime: 0
        };

        const passHash = this.hashPassword(password);
        users[lookupKey] = {
            username: cleanUsername,
            passwordHash: passHash,
            state: defaultState
        };

        localStorage.setItem("redline_tcg_users", JSON.stringify(users));
        this.showToast("🏁 Registration complete! Please log in.", "success");
        
        // Switch to login tab in the login page
        UI.switchLoginTab("login");
        return true;
    },

    /**
     * Logs out the current user session
     */
    logout() {
        localStorage.removeItem("redline_tcg_session");
        this.currentUser = null;
        document.body.classList.add("logged-out");
        
        // Reset in-memory game state to prevent leakage
        this.state = {
            playerName: "RedlineDriver",
            coins: 20,
            unopenedPacks: {},
            activeCharm: null,
            starterCoinsEarned: 0,
            selectedPackId: null,
            isAnimating: false,
            lastSpinTime: 0,
            freePackRip: false,
            charmsDisabledToday: false,
            discountActive: false,
            completedPacks: [],
            claimedCompletions: [],
            cardInventory: {},
            charmsInventory: [],
            ticketsInventory: {
                discount: 0,
                freeRip: 0,
                taxExemption: 0,
                fuelMultiplier: 0,
                doubleDown: 0
            },
            taxExemptionActive: false,
            fuelMultiplierCount: 0,
            doubleDownActive: false,
            dailyQuests: [],
            weeklyQuests: [],
            dailyResetTime: 0,
            weeklyResetTime: 0
        };

        // Reset database discovery states
        this.resetGlobalDatabases();

        UI.renderLoginScreen();
        this.showToast("👋 Logged out successfully.", "success");
    },

    /**
     * Calculate signature using the state string + salt
     */
    calculateSignature(dataString, salt) {
        const combined = dataString + salt;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    /**
     * Exports current save state as a cryptographically signed Base64 envelope token
     */
    exportSaveToken() {
        try {
            // Force save state to be up to date
            this.saveState();
            
            const stateData = localStorage.getItem("redline_tcg_state") || "{}";
            const salt = "R3DL1N3_K3Y_S4LT_2026";
            const signature = this.calculateSignature(stateData, salt);
            
            const envelope = {
                data: btoa(unescape(encodeURIComponent(stateData))), // UTF-8 safe base64
                signature: signature
            };
            
            const envelopeStr = JSON.stringify(envelope);
            const finalToken = btoa(unescape(encodeURIComponent(envelopeStr)));
            return finalToken;
        } catch (e) {
            console.error("Export save token failed:", e);
            this.showToast("Failed to generate secure backup envelope!", "error");
            return "";
        }
    },

    /**
     * Verifies, decodes, and imports a signed backup envelope token
     */
    importSaveToken(token) {
        try {
            const cleanToken = token.trim();
            if (!cleanToken) {
                this.showToast("Import token cannot be empty!", "error");
                return false;
            }
            
            // Decode the envelope wrapper
            const envelopeStr = decodeURIComponent(escape(atob(cleanToken)));
            const envelope = JSON.parse(envelopeStr);
            
            if (!envelope.data || !envelope.signature) {
                this.showToast("🚨 Verification failed: Invalid backup envelope format!", "error");
                return false;
            }
            
            // Decode original data string
            const stateData = decodeURIComponent(escape(atob(envelope.data)));
            
            // Verify signature
            const salt = "R3DL1N3_K3Y_S4LT_2026";
            const computedSignature = this.calculateSignature(stateData, salt);
            
            if (computedSignature !== envelope.signature) {
                this.showToast("🚨 CORRUPTION WARNING: Backup validation signature mismatch! Modified save data is rejected.", "error");
                return false;
            }
            
            // Check schema layout
            const parsed = JSON.parse(stateData);
            if (parsed.coins === undefined || !parsed.cardInventory) {
                this.showToast("🚨 Verification failed: Backup content schema is invalid!", "error");
                return false;
            }
            
            // Store inside current user's profile
            if (this.currentUser) {
                const users = JSON.parse(localStorage.getItem("redline_tcg_users") || "{}");
                const lookupKey = this.currentUser.toLowerCase();
                if (users[lookupKey]) {
                    users[lookupKey].state = parsed;
                    localStorage.setItem("redline_tcg_users", JSON.stringify(users));
                }
            }
            
            // Update active state
            localStorage.setItem("redline_tcg_state", stateData);
            
            this.showToast("💾 Save progress verified and loaded! Restarting engine...", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1200);
            
            return true;
        } catch (e) {
            console.error("Import save token failed:", e);
            this.showToast("🚨 CORRUPTION WARNING: Failed to decode envelope token! Checksum is invalid.", "error");
            return false;
        }
    },

    /**
     * Backward compatibility alias for importState
     */
    importState(jsonText) {
        return this.importSaveToken(jsonText);
    },

    /**
     * Spawns a secure mock checkout payment modal in the user's localized currency
     */
    buyCoinsBundle(bundleId, coinsToReward, priceString) {
        let modal = document.getElementById("checkout-payment-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "checkout-payment-modal";
            modal.className = "modal-overlay";
            modal.style.zIndex = "999999";
            document.body.appendChild(modal);
        }

        modal.style.display = "flex";
        let currentStep = 1;
        
        const updateModal = () => {
            if (currentStep === 1) {
                modal.innerHTML = `
                    <div class="handbook-content" style="max-width: 440px; text-align: center; border: 1px solid var(--border-hover); background: rgba(12, 12, 14, 0.98); box-shadow: 0 0 35px rgba(0, 240, 255, 0.45);">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-main); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
                            <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1.15rem; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">🔒 SECURE CHECKOUT</h2>
                            <span style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">STRIPE GATEWAY</span>
                        </div>
                        
                        <div style="text-align: left; background: rgba(255,255,255,0.02); border: 1px solid var(--border-main); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-family: 'Orbitron', sans-serif; letter-spacing: 0.5px;">Item details</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #fff; margin-top: 0.25rem; font-family: 'Outfit', sans-serif; display: flex; justify-content: space-between; align-items: center;">
                                <span>🪙 ${coinsToReward.toLocaleString()} Coins Bundle</span>
                                <span style="color: var(--neon-cyan); font-family: 'Orbitron', sans-serif;">${priceString}</span>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.85rem; text-align: left; margin-bottom: 1.5rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Cardholder Name</label>
                                <input type="text" id="cardholder-name" value="${this.state.playerName || 'RedlineDriver'}" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-main); color: #fff; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-family: 'Outfit', sans-serif; outline: none; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                <label style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Card Number</label>
                                <div style="position: relative; display: flex; align-items: center;">
                                    <input type="text" id="card-number" placeholder="4111 1111 1111 1111" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-main); color: #fff; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-family: monospace; outline: none; width: 100%;">
                                    <span style="position: absolute; right: 10px; font-size: 1.1rem;">💳</span>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                    <label style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">Expiry Date</label>
                                    <input type="text" id="card-expiry" placeholder="12/28" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-main); color: #fff; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-family: monospace; outline: none; text-align: center;">
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                    <label style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-family: 'Orbitron', sans-serif;">CVC / CVV</label>
                                    <input type="text" id="card-cvc" placeholder="123" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-main); color: #fff; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-family: monospace; outline: none; text-align: center;">
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button class="cta-btn secondary-btn" onclick="document.getElementById('checkout-payment-modal').style.display='none'" style="padding: 0.5rem 1.25rem; font-size: 0.8rem; font-family: 'Orbitron', sans-serif;">Cancel</button>
                            <button class="cta-btn glow-btn" id="btn-submit-payment" style="padding: 0.5rem 1.5rem; font-size: 0.8rem; font-family: 'Orbitron', sans-serif;">Authorize Payment</button>
                        </div>
                    </div>
                `;
                
                document.getElementById("btn-submit-payment").onclick = () => {
                    currentStep = 2;
                    updateModal();
                };
            } else if (currentStep === 2) {
                modal.innerHTML = `
                    <div class="handbook-content" style="max-width: 440px; text-align: center; border: 1px solid var(--border-main); background: rgba(12, 12, 14, 0.98); box-shadow: 0 0 25px rgba(0,0,0,0.5); padding: 2.5rem 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1.25rem; animation: adPulse 1.5s infinite;">⚡</div>
                        <h3 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 0.5rem 0; font-size: 1.1rem; letter-spacing: 0.5px;">PROCESSING PAYMENT</h3>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 1.5rem 0; line-height: 1.4;">
                            Routing encrypted checkout session to local server node...
                        </p>
                        
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; position: relative; overflow: hidden; margin-bottom: 0.5rem;">
                            <div style="position: absolute; height: 100%; width: 50%; background: var(--neon-cyan); border-radius: 3px; animation: progressScroll 1.5s infinite linear;"></div>
                        </div>
                        
                        <style>
                            @keyframes progressScroll {
                                0% { left: -50%; }
                                100% { left: 100%; }
                            }
                        </style>
                    </div>
                `;
                
                setTimeout(() => {
                    this.state.coins += coinsToReward;
                    this.saveState();
                    this.updateHeaderStats();
                    this.showToast(`💰 Payment authorized successfully! +🪙 ${coinsToReward.toLocaleString()} Coins added.`, "success");
                    modal.style.display = "none";
                    
                    const currentView = document.querySelector(".view-panel.active");
                    if (currentView && currentView.id === "view-coin-store") {
                        UI.renderCoinStore();
                    }
                }, 3000);
            }
        };

        updateModal();
    }
};

// Start application on page load
window.addEventListener("DOMContentLoaded", () => {
    app.init();
});
