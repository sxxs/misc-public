# 🎄 JumpCat - Weihnachts-Katzen Jump & Run

Ein festliches Jump & Run-Spiel mit einer Weihnachtskatze, Power-ups und Boss-Kampf.

**🎮 [Jetzt spielen!](https://sxxs.github.io/misc-public/jumpcat/)**

## 🎯 Spielziel

Sammle so viele Münzen 🪙 wie möglich, ohne herunterzufallen! Erreiche 30 Münzen, um den Boss-Kampf zu starten.

## 🎮 Steuerung

- **Tippen/Klicken/Leertaste**: Springen
- **2x Tippen**: Doppelsprung
- **Während Boss-Kampf**: Springen + Schneebälle werfen

## ✨ Features

### Münzen & Combos
- 🪙 Sammle gelbe Münzen als Haupt-Score
- **5x Combo**: +5 Bonus-Münzen
- **10x Combo**: +10 Bonus-Münzen
- **20x MEGA-COMBO**: +20 Münzen + 1 Extra-Leben
- Combo bricht, wenn du Münzen überspring

### Power-ups
- ❄️ **Slow-Mo** - Verlangsamt das Spiel
- 🚀 **Speed** - Beschleunigt das Spiel
- ❤️ **Herz** - Extra-Leben (max 3)
- 🎁 **Geschenk** - Multi-Bonus (Slow + Leben + 20 Münzen)
- ⬆️ **Triple Jump** - 3 Sprünge statt 2
- 🪽 **Flügel** - Langsamer fallen beim Gleiten
- 😼 **Catnip-Rage** - Wachse und zerstöre Kerzen

### Plattformen
Neue Plattform-Typen werden mit steigendem Score freigeschaltet:

- 🟡 **Rüttel** (12+) - Wackelt wenn du drauf stehst
- 🟣 **Beweglich** (15+) - Schwebt auf und ab
- 🟠 **Zerbröckelnd** (25+) - Bricht langsam weg
- 🔵 **Eis** (35+) - Rutschige Oberfläche
- 🟢 **Sprung** (45+) - Katapultiert dich hoch

### Boss-Kampf (30 🪙)
- ⛄ **Böser Schneemann** erscheint bei 30 Münzen
- Wirf Schneebälle auf den Boss (automatisch beim Tippen)
- Weiche seinen Projektilen aus
- 5 Treffer zum Sieg

## 🌍 Dynamische Welten

Das Spiel ändert Themes basierend auf deinem Fortschritt:
- **0 Punkte**: Nacht 🌙
- **10 Punkte**: Morgen (Pink/Lila) 🌅
- **20 Punkte**: Tag (Eis/Blau) ☀️
- **30 Punkte**: Abend (Orange) 🌆
- **40 Punkte**: Nordlicht (Grün/Schwarz) 🌌

## 🎵 Audio

- Generative Weihnachtsmusik (Web Audio API)
- Sound-Effekte für Sprünge, Power-ups und Combos
- Stumm-Button oben rechts 🔊/🔇

## 📱 PWA

JumpCat ist eine Progressive Web App:
- Installierbar auf Handy/Desktop
- Offline spielbar
- Highscore wird lokal gespeichert

## 🛠️ Technik

- **Single-File**: Komplettes Spiel in einer HTML-Datei
- **Canvas Rendering**: Smooth 60fps Animation
- **Cache-Busting**: URL-Parameter für automatische Updates
- **Mobile-First**: Optimiert für Touch-Geräte

## 📊 Version

**v6.2** - Boss Trigger Fix

[Changelog & Source](https://github.com/sxxs/misc-public/tree/main/jumpcat)

---

Made with ❤️ and 🎄
