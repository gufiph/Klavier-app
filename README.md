# 🎹 Klavier-App

Eine Klavier-Lernapp für Kinder (ca. 5–10 Jahre), inspiriert von Simply Piano.  
Das Kind spielt auf einem echten Klavier — das Mikrofon erkennt die gespielten Töne und die App gibt sofortiges visuelles Feedback.

---

## Funktionen

- 🎵 **50 Lieder** von Anfänger bis Fortgeschritten
- 🎨 **Boomwhacker-Farben** — dieselben Farben wie die Aufkleber auf den Tasten
- 🎤 **Mikrofon-Erkennung** — die App hört, ob die richtige Note gespielt wurde
- 🌊 **Wasserfall-Ansicht** — bunte Blöcke zeigen, welche Taste als nächstes dran ist
- 📱 **PWA** — kann auf dem iPad als App installiert werden (offline nutzbar)
- 🇩🇪 Auf Deutsch

---

## Voraussetzungen

- [Node.js](https://nodejs.org/) Version 18 oder neuer
- Ein Mikrofon (eingebaut oder extern)
- **Für Desktop-App:** Windows, macOS oder Linux
- **Für iPad:** Safari-Browser im selben WLAN

---

## Installation

### 1. Repository herunterladen

```bash
git clone https://github.com/gufiph/klavier-app.git
cd klavier-app
git checkout claude/piano-learning-app-kids-thejbz
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

---

## Option A: Desktop-App (kein Browser, kein Server nötig)

Die App läuft als eigenständiges Programm — kein Browser, kein Server, kein Docker.  
Das Mikrofon wird automatisch freigegeben, keine Browser-Popups.

### Im Entwicklungsmodus starten (zum Testen)

```bash
npm run electron:dev
```

### Installierbare .exe / .dmg / AppImage bauen

**Windows (.exe Installer):**
```bash
npm run electron:build:win
```

**macOS (.dmg):**
```bash
npm run electron:build:mac
```

**Linux (.AppImage):**
```bash
npm run electron:build:linux
```

Die fertige Installationsdatei liegt im Ordner `release/`.  
Einfach ausführen — die App ist danach wie ein normales Programm installiert.

---

## Option B: Im Browser starten (Entwicklung / iPad)

```bash
npm run dev
```

Die App ist dann erreichbar unter: **http://localhost:5173**

Für den Zugriff vom iPad im selben WLAN:

```bash
npm run dev -- --host
```

Dann die angezeigte Netzwerk-Adresse (z.B. `http://192.168.1.100:5173`) im iPad-Browser öffnen.

---

## Auf dem iPad installieren (PWA)

1. App im **Safari** auf dem iPad öffnen
2. Auf das **Teilen-Symbol** tippen (Rechteck mit Pfeil nach oben)
3. **„Zum Home-Bildschirm"** auswählen
4. Die App erscheint jetzt wie eine normale App auf dem iPad — auch offline nutzbar

---

## Produktions-Build (nur Web)

```bash
npm run build
```

Die fertige App liegt im Ordner `dist/` und kann auf jedem Webserver gehostet werden.

Build lokal testen:

```bash
npm run preview
```

---

## Neues Lied hinzufügen

1. Datei öffnen: `src/data/songs/beginner.ts` (oder `intermediate.ts` / `advanced.ts`)
2. Neuen Eintrag am Ende der Liste hinzufügen:

```typescript
{
  id: 'mein-lied',
  title: 'Mein neues Lied',
  subtitle: 'Optional',
  difficulty: 1,          // 1 = Anfänger, 2 = Mittel, 3 = Fortgeschritten
  tempo: 100,             // Schläge pro Minute
  timeSignature: [4, 4],
  coverEmoji: '🎵',
  notes: [
    q('C4'), q('D4'), q('E4'), h('F4'),
    // q = Viertelnote, h = halbe Note, w = ganze Note, e = Achtelnote
  ],
},
```

3. Speichern — das Lied erscheint sofort in der App.

**Verfügbare Noten:** C3 bis C6  
**Vorzeichen:** `C#4` = Cis, `D#4` = Dis, `F#4` = Fis, `G#4` = Gis, `A#4` = Ais

---

## Empfohlene Anfänger-Lieder

Für Kinder, die noch nicht alle Tasten mit Aufklebern markiert haben — diese Lieder verwenden **nur weiße Tasten**:

| Lied | Töne | Warum gut |
|------|------|-----------|
| 🍞 Hot Cross Buns | E, D, C | Nur 3 Tasten — absoluter Einstieg |
| 🐑 Mary Had a Little Lamb | C, D, E, G | 5 Töne, bekannte Melodie |
| ⭐ Twinkle Twinkle | C, D, E, F, G, A | Der Klassiker |
| 🏠 Hänschen klein | C, D, E, F, G, A, H | Deutsches Kinderlied |
| 🦆 Alle meine Entchen | C–A (Tonleiter aufwärts) | Gut zum Tonleiter-Üben |

---

## Tastaturbereich

Die App zeigt Tasten von **C3 bis C6** (3 Oktaven, 37 Tasten).

Empfohlen für Anfänger: **C4 bis G4** (mittlere Oktave, nur weiße Tasten).

---

## Boomwhacker-Farben

| Note | Farbe | Hex |
|------|-------|-----|
| C | Rot | `#E21C48` |
| D | Orange | `#F36421` |
| E | Gelb | `#FFE011` |
| F | Hellgrün | `#8DC63F` |
| G | Grün | `#009A44` |
| A | Violett | `#6E4B9E` |
| H / B | Pink | `#F04E98` |
| Kreuz-Tasten (♯) | Grau | `#888888` |

---

## Mikrofon-Tipps

- Das Keyboard **nah** ans Mikrofon stellen
- In einem **ruhigen Raum** spielen
- Noten **klar und deutlich** anschlagen
- Der Klarheits-Balken (% in der App) sollte beim Spielen hoch sein
- Mikrofon nicht erkannt? → Browser-Einstellungen → Mikrofon-Zugriff erlauben

---

## Technologie

| Was | Womit |
|-----|-------|
| Framework | React 18 + TypeScript + Vite |
| Pitch-Erkennung | [pitchy](https://github.com/ianprime0509/pitchy) v4 (McLeod Pitch Method) |
| Styling | Tailwind CSS v3 |
| PWA | vite-plugin-pwa + Workbox autoUpdate |
| Desktop-App | Electron 32 + electron-builder |
| Song-Daten | TypeScript-Module (typsicher, IDE-Autovervollständigung) |

---

## Lizenz

Privates Familienprojekt — alle Rechte vorbehalten.
