# 🇩🇪 DeutschTrainer — B1 Vocabulary Practice PWA

A modern, mobile-first Progressive Web App for practicing German B1 (telc) vocabulary. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step, instant performance.

![DeutschTrainer Screenshot](https://img.shields.io/badge/PWA-Ready-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Level](https://img.shields.io/badge/level-B1-orange)

## ✨ Features

- **📇 Flashcard & Type-Answer modes** — flip cards or type translations
- **🔄 Bilingual practice** — German → English or English → German (randomly mixed too!)
- **📊 Smart spaced repetition** — weak words appear more often, strong words less
- **📈 Performance tracking** — accuracy, streaks, session history, per-word stats
- **🏷️ Category filtering** — focus on specific topic areas
- **📱 Mobile-first PWA** — installable on Chrome, Safari, Edge; works offline
- **🌙 Dark theme** — easy on the eyes for long study sessions
- **➕ Add your own words** — single or bulk import in simple format
- **💾 Local storage** — all progress saved in your browser
- **🔍 Search & filter** — find any word instantly in the word list
- **♿ Accessible** — keyboard navigation, ARIA labels, screen reader friendly

## 🚀 Getting Started

### Option 1: Just open it
Open `index.html` in any modern browser. That's it!

### Option 2: Serve locally (for PWA features)
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8080
```
Then visit `http://localhost:8080`

### Option 3: Install as App
1. Open in Chrome/Edge on desktop or mobile
2. Click "Install" in the address bar (or menu → "Install app")
3. Use it like a native app!

## 📁 Project Structure

```
├── index.html          # Main app shell
├── css/
│   └── style.css       # All styles (mobile-first)
├── js/
│   ├── data.js         # Vocabulary data
│   └── app.js          # App logic, state management
├── icons/              # PWA icons (generated SVG)
│   ├── icon-192.svg
│   └── icon-512.svg
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── .gitignore
└── README.md
```

## ➕ Adding New Words

### In-App
Click the **"+ Add Words"** button in the app. You can add:

**Single word:**
Fill in the form fields (German, English, type, category, example sentence).

**Bulk import:**
Paste multiple words in this format (one per line):
```
die Wohnung | apartment | Noun (f) | Living | Ich suche eine neue {Wohnung}.
der Beruf | profession | Noun (m) | Work | Was ist dein {Beruf}?
verstehen | to understand | Verb | Communication | Ich {verstehe} das nicht.
```

### In the data file
Edit `js/data.js` and add entries to the `VOCAB_DATA` array:
```javascript
{
  de: "das Beispiel",
  en: "example",
  type: "Noun (n)",
  cat: "Education",
  ex: "Das ist ein gutes {Beispiel}."
}
```

Use `{curly braces}` around the target word in the example sentence — it will be highlighted.

## 🧠 Spaced Repetition System

Words have 5 strength levels:
| Level | Name | Selection Weight | Meaning |
|-------|------|-----------------|---------|
| 0 | New | 5× | Never practiced |
| 1 | Weak | 9× | Frequently wrong |
| 2 | Learning | 4× | Getting better |
| 3 | Decent | 2× | Almost there |
| 4 | Strong | 1× | Mastered |

Wrong answers drop strength by 1–2 levels. Correct answers raise by 1 level. This ensures you spend more time on words you struggle with.

## 📊 Stats & Tracking

- **Session stats**: correct, wrong, accuracy %, current streak
- **All-time stats**: total reviews, best streak, mastery progress
- **Per-word tracking**: individual correct/wrong counts, strength level
- **Category breakdown**: see which topics need more work
- **Session history**: track your progress over time

## 🛠️ Tech Stack

- **HTML5** — semantic markup, Open Graph, structured data
- **CSS3** — custom properties, grid, flexbox, animations, mobile-first
- **Vanilla JS** — ES6+, no dependencies, no build step
- **Service Worker** — offline caching, background sync
- **Web App Manifest** — installable PWA

## 📄 License

MIT — use it, modify it, share it. Viel Erfolg! 🍀
