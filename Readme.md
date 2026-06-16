# Redline TCG — High-Octane Trading Card Game

A responsive, high-performance, dark-mode Web Trading Card Game (TCG) built with HTML5, CSS3, and ES6 JavaScript.

## 🏁 How to Run Locally

You can launch the web application using macOS's built-in Python HTTP server:

1. Open your terminal in the project directory:
   ```bash
   cd /Users/aaru/source/Python/redline-tcg
   ```
2. Start the HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

## 📁 Project Architecture & Components

The application is structured as a modular Single Page Application (SPA):
*   [index.html](file:///Users/aaru/source/Python/redline-tcg/index.html): Defines the persistent header (navigation links, coins counter, charms inventory) and view sections.
*   [css/style.css](file:///Users/aaru/source/Python/redline-tcg/css/style.css): Contains the core design system tokens (radial dark gradients, carbon fiber textures, neon borders) and layout grids.
*   [js/database.js](file:///Users/aaru/source/Python/redline-tcg/js/database.js): Houses the core schema model and the vehicle list initialized with verified real-world factory specifications.
*   [js/math.js](file:///Users/aaru/source/Python/redline-tcg/js/math.js): Implements overall performance score calculations (OVR) and probability tables.
*   [js/ui.js](file:///Users/aaru/source/Python/redline-tcg/js/ui.js): Performs UI rendering, sequential card reveals, pack-ripping physics animations, and neon particle bursts.
*   [js/app.js](file:///Users/aaru/source/Python/redline-tcg/js/app.js): Acts as the main SPA router, transactional engine, and real-time state manager.

## ⚙️ Mathematical Rules Handled (Master Blueprint specs)
*   **OVR Formula**: `horsepower + top_speed + ((6 / zero_to_sixty) * 100) + ((14 / quarter_mile) * 100) + Rarity_Modifier`.
*   **Pack Yield Sizing**: Dynamically detects the eligibility pool size: yields exactly 1 card for micro-packs (pool <= 3), and up to 3 cards for standard packs.
*   **Discovery Reward**: Yields `+5 Coins` for first-time discoveries. Starter packs limit earnings to a ceiling of `50-60 Coins`.
*   **Luck Charms**:
    *   *JDM Magnet*: Increases specific JDM rolling outcomes (durability: 5 rolls).
    *   *Legendary Charm*: Adds `+3%` to the Legendary probability table (expires after 10 real-time minutes).
*   **Holiday Calendar Checks**: Detects if date is Easter Sunday (`+3%` global Luck) or Halloween Week (announces event).
