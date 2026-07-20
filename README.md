# 🎹 Klavier-App

Eine Klavier-Lernapp für Kinder (ca. 5–10 Jahre), inspiriert von Simply Piano.  
Das Kind spielt auf einem echten Klavier — das Mikrofon erkennt die gespielten Töne und die App gibt sofortiges visuelles Feedback.

---

## Funktionen

- 🎵 **50 Lieder** von Anfänger bis Fortgeschritten
- 🎨 **Boomwhacker-Farben** — dieselben Farben wie die Aufkleber auf den Tasten
- 🎤 **Mikrofon-Erkennung** — die App hört, ob die richtige Note gespielt wurde
- 🌊 **Wasserfall-Ansicht** — bunte Blöcke zeigen, welche Taste als nächstes dran ist
- 📱 **PWA** — kann auf dem iPad / Handy als App installiert werden (offline nutzbar)
- 🇩🇪 Auf Deutsch

---

## Auf dem iPad oder Handy benutzen

### Schritt 1 — App online abrufen

Die App läuft unter:  
**https://gufiph.github.io/klavier-app/**

> Wird automatisch aktualisiert, wenn neue Lieder hinzugefügt werden.

### Schritt 2 — Als App installieren (einmalig)

**iPad / iPhone (Safari):**
1. Seite im **Safari** öffnen
2. Auf das **Teilen-Symbol** tippen (Rechteck mit Pfeil)
3. **„Zum Home-Bildschirm"** wählen
4. Die App erscheint wie eine normale App — auch **offline nutzbar**

**Android (Chrome):**
1. Seite in **Chrome** öffnen
2. Menü (⋮) → **„App installieren"** oder **„Zum Startbildschirm hinzufügen"**
3. Fertig

### Schritt 3 — Mikrofon erlauben

Beim ersten Start fragt die App nach dem Mikrofon → **Erlauben** tippen.

---

## GitHub Pages aktivieren (einmalig, nur für den Admin)

Damit die URL oben funktioniert, muss GitHub Pages einmal aktiviert werden:

1. Auf GitHub → Repository **klavier-app** öffnen
2. **Settings** → **Pages**
3. Bei „Source": **GitHub Actions** auswählen
4. Speichern

Danach deployt die App automatisch bei jedem Push auf den Branch.

---

## Lokal entwickeln (optional)

### Voraussetzungen

- [Node.js](https://nodejs.org/) Version 18 oder neuer

### Installation und Start

```bash
git clone https://github.com/gufiph/klavier-app.git
cd klavier-app
git checkout claude/piano-learning-app-kids-thejbz
npm install
npm run dev
```

Die App ist dann erreichbar unter: **http://localhost:5173**

Für den Zugriff vom iPad / Handy im selben WLAN:

```bash
npm run dev -- --host
```

Dann die angezeigte Netzwerk-Adresse (z.B. `http://192.168.1.100:5173`) im Safari / Chrome öffnen.

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

3. Speichern und pushen — die App aktualisiert sich automatisch.

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
| Hosting | GitHub Pages (kostenlos, automatisch) |
| Song-Daten | TypeScript-Module (typsicher, IDE-Autovervollständigung) |

---

## Lizenz

Privates Familienprojekt — alle Rechte vorbehalten.
