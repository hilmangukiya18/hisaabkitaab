# 📒 HisaabKitaab — A Calmer, More Confident Money Tracker

A beautiful, premium mobile-first personal finance tracker with a warm paper-canvas aesthetic. Built with vanilla HTML, CSS, and JavaScript.

👉 **Live Demo:** [https://hilmangukiya18.github.io/hisaabkitaab/](https://hilmangukiya18.github.io/hisaabkitaab/)

---

## ✨ Features

- 🎨 **Warm Paper-Canvas Aesthetic** — Designed with a calming earth-tone palette, clean rounded components, and premium typography (**Space Grotesk** for figures, **Hanken Grotesk** for UI).
- 💱 **Multi-Currency Input** — Record transactions in **20+ different currencies** (USD, EUR, GBP, AED, SGD, JPY, etc.).
- 📈 **Live Exchange Rates** — Automatically fetches and converts foreign transactions to Indian Rupee (INR) on a live basis using caching to optimize API requests.
- 📊 **Insights & Charts** — 
  - **Spending by Category**: An SVG donut chart showing absolute percentage spending distribution.
  - **6-Month Trend**: Side-by-side vertical bar charts comparing monthly incomes vs. expenses.
- 📲 **Data Import & Restore** — Drag-and-drop or browse to upload previous backup CSV files. Includes duplicate detection to prevent redundant entries.
- 📥 **Export to CSV** — Download monthly spreadsheets or generate a complete data backup.
- 🌓 **Pill Theme Toggle** — Cohesive light and dark modes to suit any preference.
- 📱 **Mobile-First PWA** — Fully installable on iOS and Android devices, working entirely offline.
- 🔒 **Privacy First** — 100% local storage. Your financial data never leaves your device.

---

## 🚀 Running Locally

To support Service Worker (PWA) installation and offline caching, the app must be served over an HTTP host (not via `file://`).

```bash
# Clone the repository
git clone https://github.com/hilmangukiya18/hisaabkitaab.git

# Navigate to directory
cd hisaabkitaab

# Run a local HTTP server (using Node's http-server or Python)
npx http-server -p 8080
# OR
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

---

## 📲 Installing the PWA

### iOS (Safari)
1. Navigate to the hosted website.
2. Tap the **Share** button in the Safari toolbar.
3. Scroll down and select **Add to Home Screen**.

### Android (Chrome)
1. Navigate to the hosted website.
2. Tap the menu icon (three dots) in the top-right corner.
3. Select **Install app** or **Add to Home Screen**.

---

## 🛠️ Tech Stack

- **Structure:** HTML5 Semantic Markup
- **Styling:** Vanilla CSS3 (Custom Variables, Flexbox/Grid, Keyframe Animations)
- **Logic:** ES6+ Vanilla JavaScript (LocalStorage API, Fetch API, SVG manipulation)
- **Offline/PWA:** Service Worker API, Cache Storage, Web App Manifest
- **API:** [ExchangeRate-API](https://open.er-api.com) (free tier, cached locally for 1 hour)

---

## 📄 License

MIT License — Feel free to use, modify, and distribute.
