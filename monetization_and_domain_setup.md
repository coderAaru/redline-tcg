# REDLINE TCG — MASTER MONETIZATION & DEPLOYMENT GUIDE

This guide details how to launch **Redline TCG** under your own brand name, protect your IP, serve advertisements, and handle secure real-money purchases.

---

## 🌐 1. Custom Domain Configuration
To map a custom domain (e.g., `www.redlinetcg.com`) to your website:

### Step 1: Register Your Domain
Use a domain registrar (e.g., Namecheap, Name.com, GoDaddy, or Cloudflare) to buy your target domain.

### Step 2: Configure DNS Settings
Inside your registrar's DNS Management panel, configure the following records to point to your cloud host (e.g., Vercel, Netlify, or Github Pages):

| Record Type | Host / Name | Value / Destination | TTL | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A Record** | `@` | Host IP (e.g., `76.76.21.21` for Vercel) | Automatic | Directs the root domain to the host. |
| **CNAME Record** | `www` | Host alias (e.g., `cname.vercel-dns.com`) | Automatic | Routes subdomains to the host. |

> [!NOTE]
> DNS changes can take anywhere from a few minutes to 24 hours to propagate worldwide.

---

## 📜 2. Copyright Protection
We have added a formal, legally binding **All Rights Reserved** statement protecting your game:
1. **Source File**: Created a [LICENSE](file:///Users/aaru/source/Python/redline-tcg/LICENSE) file in the repository stating that copying, distribution, or reverse engineering is strictly prohibited.
2. **Global Footer**: Added a styled footer to [index.html](file:///Users/aaru/source/Python/redline-tcg/index.html) displaying:
   `© 2026 REDLINE TCG. All Rights Reserved. High-Octane Card Collector Edition`

---

## 💵 3. Integrating Live Ads into Placeholders

We have created 9 ad banner zones inside [index.html](file:///Users/aaru/source/Python/redline-tcg/index.html).

### Step 1: Set up your `ads.txt` File
Ad networks require an `ads.txt` file at the root level of your domain to verify your ownership. Create a file named `ads.txt` right next to your `index.html` file:
```text
# ads.txt example
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
nitropay.com, pub-YYYYYYYYYYYY, DIRECT, a1b2c3d4e5f6g7h8
```

### Step 2: Choose your Ad Network
*   **Google AdSense**: Best for general websites. Easiest setup.
*   **Nitropay / Playwire**: Programmatic ad partners that specialize in web games and collectables. Highly recommended for card games due to high video/banner CPMs.

### Step 3: Replace placeholders with live tags
Locate the `sponsor-ad-zone` elements in `index.html`. You will find:
*   **Showroom Banner**: `<div id="ad-banner-placeholder">...</div>`
*   **Other View Banners**: `<div class="ad-banner-placeholder-generic">...</div>`

Replace those inner placeholder `div` blocks with the code snippet supplied by your network. For example, a Google AdSense tag:
```html
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="ZZZZZZZZZZ"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

---

## 💳 4. Real-Money Purchases & Banking Flows

When you decide to charge players real money for coin packs via the **Coin Store**:

### How Card Data is Handled (PCI Compliance)
*   **Security Standard**: To protect your business from legal liabilities, you must never handle or store raw card numbers on your server.
*   **Tokenization**: Use a gateway like **Stripe Elements**. The player inputs their card into Stripe's secure iframe. Stripe charges the card and returns a secure token (e.g., `tok_12345`) to your website indicating success or failure.

### Where the Money Goes
1. **Customer Checkout**: Customer pays in their local currency (USD, INR, or EUR).
2. **Stripe Processing**: Stripe authorizes the payment and charges a processing fee (typically **2.9% + $0.30**).
3. **Merchant Holding**: The net funds are deposited instantly into your **Stripe Merchant Account**.
4. **Payout Deposit**: Stripe automatically transfers the accumulated funds from your Stripe dashboard directly to your linked **Checking Bank Account** on a daily or weekly payout schedule.
